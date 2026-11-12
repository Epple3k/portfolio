"""Python-authoritative graph features, temporal rules and fitted IsolationForest."""
import hashlib, json, time
from functools import lru_cache
from pathlib import Path
import numpy as np
import pandas as pd
import networkx as nx
import joblib
from sklearn.ensemble import IsolationForest
from .data import N, VERSION, SEED, CASES, aid, iso
from . import db
FEATURE_VERSION='features-1.0'
MODEL_VERSION='isolation-forest-1.0'
FEATURE_NAMES=['incoming_per_day','outgoing_per_day','count_per_day','counterparties','mean_amount','max_amount','flow_balance','reciprocal_neighbors']


def features(records,window):
    incoming=np.zeros(N);outgoing=np.zeros(N);cnt=np.zeros(N);maximum=np.zeros(N)
    ins=[set() for _ in range(N)];outs=[set() for _ in range(N)]
    for r in records:
        s,t,a=r['s'],r['t'],r['amount']
        outgoing[s]+=a;incoming[t]+=a;cnt[s]+=1;cnt[t]+=1
        maximum[s]=max(maximum[s],a);maximum[t]=max(maximum[t],a)
        outs[s].add(t);ins[t].add(s)
    total=incoming+outgoing
    neighbors=np.array([len(ins[i]|outs[i]) for i in range(N)])
    reciprocal=np.array([len(ins[i]&outs[i]) for i in range(N)])
    balance=np.divide(np.minimum(incoming,outgoing),np.maximum(incoming,outgoing),out=np.zeros(N),where=total>0)
    mean=np.divide(total,cnt,out=np.zeros(N),where=cnt>0)
    x=np.column_stack([incoming/window,outgoing/window,cnt/window,neighbors,mean,maximum,balance,reciprocal])
    return x,dict(incoming=incoming,outgoing=outgoing,count=cnt,neighbors=neighbors,ins=ins,outs=outs)

@lru_cache(maxsize=4)
def model(window=14):
    # Training ends on day 28; calibration is disjoint day 29. Injected events start day 62.
    base=db.rows(db.tx,(db.tx.c.day<=29)&(db.tx.c.scenario=='base'))
    matrices=[]
    for end in [14,21,28]:
        x,_=features([r for r in base if max(0,end-window)<r['day']<=end],min(window,end))
        matrices.append(np.log1p(x))
    train=np.concatenate(matrices)
    clf=IsolationForest(n_estimators=80,max_samples=256,random_state=SEED,n_jobs=1).fit(train)
    cal,_=features([r for r in base if max(0,29-window)<r['day']<=29],min(window,29))
    reference=np.sort(-clf.score_samples(np.log1p(cal)))
    Path('artifacts').mkdir(exist_ok=True)
    joblib.dump({'model':clf,'reference':reference,'window':window,'version':MODEL_VERSION},f'artifacts/{MODEL_VERSION}-{window}.joblib')
    return clf,reference,np.median(np.expm1(train),axis=0)


def rules(records):
    """Bounded, evidence-producing detection; uses only received transaction records."""
    found={}
    incoming={};edges={};recent={}
    for r in records:
        incoming.setdefault(r['t'],[]).append(r)
        edges.setdefault((r['s'],r['t']),[]).append(r)
        prior=recent.get(r['s'],[])
        matches=[p for p in prior[-50:] if 0<=r['day']-p['day']<=1/24 and p['s']!=r['t'] and .94<=r['amount']/p['amount']<=1.01 and r['amount']>=100000]
        if matches:
            p=matches[-1]
            found.setdefault(r['s'],[]).append(dict(rule='Rapid pass-through',condition='Near-matching inbound and outbound transfers (94–101%) within 60 minutes; outgoing ≥ $1,000.',evidence=[p['id'],r['id']]))
        recent.setdefault(r['t'],[]).append(r)
    for account,events in incoming.items():
        # Sliding 24-hour distinct sender count, bounded by dataset size.
        left=0;counts={}
        for right,r in enumerate(events):
            counts[r['s']]=counts.get(r['s'],0)+1
            while r['day']-events[left]['day']>1:
                old=events[left]['s'];counts[old]-=1
                if counts[old]==0: del counts[old]
                left+=1
            if len(counts)>=16:
                found.setdefault(account,[]).append(dict(rule='Counterparty surge',condition=f'{len(counts)} unique incoming counterparties within 24 hours (threshold 16).',evidence=[t['id'] for t in events[left:right+1]]))
                break
    # Enumerate 3/4-hop cycles only for repeated high-value directed relationships.
    g=nx.DiGraph()
    for (s,t),rs in edges.items():
        big=[r for r in rs if r['amount']>=500000]
        if len(big)>=3:g.add_edge(s,t,records=big)
    for cycle in nx.simple_cycles(g,length_bound=4):
        if len(cycle)<3: continue
        pairs=list(zip(cycle,cycle[1:]+cycle[:1]))
        sequence=[]
        for r in g[pairs[0][0]][pairs[0][1]]['records']:
            chain=[r]
            for s,t in pairs[1:]:
                candidates=[q for q in g[s][t]['records'] if 0<q['day']-chain[-1]['day']<=1 and .9<=q['amount']/r['amount']<=1.1]
                if not candidates: break
                chain.append(candidates[0])
            if len(chain)==len(pairs):sequence=chain;break
        if sequence:
            for i in cycle:found.setdefault(i,[]).append(dict(rule='Recurring circular flow',condition=f'{len(cycle)}-account directed cycle; each relationship repeats ≥3 transfers ≥$5,000. Evidence follows increasing time and matching amounts (±10%).',evidence=[q['id'] for q in sequence]))
    return found


def run(config):
    begun=time.perf_counter()
    case=next(c for c in CASES if c['id']==config['case_id'])
    end=config['day'];window=config['window'];start=max(0,end-window)
    condition=(db.tx.c.day>start)&(db.tx.c.day<=end)&((db.tx.c.scenario=='base')|((db.tx.c.scenario==case['id']) if config['injection'] else (db.tx.c.scenario=='base')))
    records=db.rows(db.tx,condition)
    x,f=features(records,min(window,max(end,.001)))
    clf,reference,median=model(window)
    raw=-clf.score_samples(np.log1p(x))
    percent=np.searchsorted(reference,raw,side='right')/len(reference)*100
    # Before baseline/calibration availability, no score is shown.
    available=end>=30
    detected=rules(records)
    alerts=[]
    visible_ids=set(range(case['group']*100,case['group']*100+300))
    ranks=np.argsort(np.argsort(-raw))+1
    for i in range(N):
        why=detected.get(i,[])
        ml=available and percent[i]>=config['threshold'] and f['count'][i]>0
        flag=(bool(why) if config['detector']=='rules' else ml if config['detector']=='model' else bool(why) or ml)
        if flag and i in visible_ids:
            ev=list(dict.fromkeys(tid for w in why for tid in w['evidence']))
            if not ev: ev=[r['id'] for r in sorted([r for r in records if r['s']==i or r['t']==i],key=lambda r:-r['amount'])[:12]]
            alerts.append(dict(id=f"{case['id']}-{i}",entity_id=i,account_id=aid(i),percentile=round(float(percent[i]),2) if available else None,rank=int(ranks[i]),detector='Graph rule + Isolation Forest' if why and ml else 'Graph rule' if why else 'Isolation Forest',rules=why,evidence=ev[:100],title=why[0]['rule'] if why else 'Unusual account activity',priority='High' if why else 'Review',first_observed_at=iso(max((r['day'] for r in records if r['id'] in ev),default=end)),as_of=iso(end)))
    alerts.sort(key=lambda a:(not bool(a['rules']),-(a['percentile'] or 0),a['entity_id']))
    flagged={a['entity_id'] for a in alerts}
    acct=db.rows(db.accounts,db.accounts.c.id.in_(visible_ids))
    nodes=[]
    for a in acct:
        i=a['id'];a.update(incoming_minor=int(f['incoming'][i]),outgoing_minor=int(f['outgoing'][i]),count=int(f['count'][i]),counterparties=int(f['neighbors'][i]),in_degree=len(f['ins'][i]),out_degree=len(f['outs'][i]),percentile=round(float(percent[i]),2) if available else None,raw_score=round(float(raw[i]),6) if available else None,rank=int(ranks[i]) if available else None,flagged=i in flagged,features={k:round(float(x[i,j]),3) for j,k in enumerate(FEATURE_NAMES)},baseline={k:round(float(median[j]),3) for j,k in enumerate(FEATURE_NAMES)} if available else {})
        nodes.append(a)
    visible=[r for r in records if r['s'] in visible_ids and r['t'] in visible_ids]
    agg={}
    for r in visible:
        key=(r['s'],r['t'])
        e=agg.setdefault(key,dict(s=r['s'],t=r['t'],amount_minor=0,count=0,last_day=0,transaction_ids=[]))
        e['amount_minor']+=r['amount'];e['count']+=1;e['last_day']=r['day'];e['transaction_ids'].append(r['id'])
    edges=sorted(agg.values(),key=lambda e:-e['amount_minor'])[:4000]
    g=nx.DiGraph();g.add_nodes_from(visible_ids);g.add_edges_from(agg)
    return dict(config=config,dataset_version=VERSION,model_version=MODEL_VERSION,feature_version=FEATURE_VERSION,seed=SEED,as_of=iso(end),window_start=iso(start),score_available=available,nodes=nodes,edges=edges,alerts=alerts,transactions=visible,stats=dict(accounts=len(nodes),transactions=len(visible),volume_minor=sum(r['amount'] for r in visible),components=nx.number_weakly_connected_components(g),dataset_accounts=N,analysed_transactions=len(records)),elapsed_ms=round((time.perf_counter()-begun)*1000),limitations='Synthetic evidence only. Scores are reference-distribution percentiles, not probabilities of misconduct. Features describe differences; they are not causal explanations.')
