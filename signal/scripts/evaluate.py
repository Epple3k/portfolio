"""Measured synthetic evaluation. Run from project root: python -m scripts.evaluate."""
import json,time,platform
from pathlib import Path
from sklearn.metrics import precision_score,recall_score,average_precision_score
from backend import db,analytics
from backend.data import generate,CASES

def main():
 db.initialize();_,tx,labels=generate();results=[]
 for case in CASES:
  cfg=dict(case_id=case['id'],day=68,window=14,threshold=97,detector='combined',injection=True)
  positives={r[k] for r in tx if labels.get(r['id'])==case['id'] for k in ['s','t']}
  for detector in ['model','rules','combined']:
   r=analytics.run({**cfg,'detector':detector});flagged={a['entity_id'] for a in r['alerts']}
   truth=[n['id'] in positives for n in r['nodes']];pred=[n['id'] in flagged for n in r['nodes']]
   raw=[n['raw_score'] for n in r['nodes']]
   fp=sum(p and not y for p,y in zip(pred,truth));neg=sum(not y for y in truth)
   top=sorted(r['nodes'],key=lambda n:-n['raw_score'])[:15]
   results.append(dict(case_id=case['id'],detector=detector,population=len(truth),positive_accounts=sum(truth),alert_count=len(flagged),precision=precision_score(truth,pred,zero_division=0),recall=recall_score(truth,pred,zero_division=0),false_positive_rate=fp/neg,average_precision=average_precision_score(truth,raw) if detector=='model' else None,recall_at_15_model_rank=sum(n['id'] in positives for n in top)/sum(truth),elapsed_ms=r['elapsed_ms']))
 timing=[]
 for case in CASES:
  plant=min(r['day'] for r in tx if labels.get(r['id'])==case['id']);first=None
  for day in [plant-.001,plant+.05,plant+.5,plant+1,plant+2,plant+3,68]:
   r=analytics.run(dict(case_id=case['id'],day=round(day,6),window=14,threshold=97,detector='rules',injection=True))
   positives={t[k] for t in tx if labels.get(t['id'])==case['id'] for k in ['s','t']}
   if any(a['entity_id'] in positives for a in r['alerts']):first=round(day,6);break
  timing.append(dict(case_id=case['id'],injection_start_day=plant,first_detected_sample_day=first,elapsed_hours=(first-plant)*24 if first else None,note='Detection sampled at specified checkpoints, not an exact continuous first-detection estimate.'))
 out=dict(dataset_version=analytics.VERSION,model_version=analytics.MODEL_VERSION,feature_version=analytics.FEATURE_VERSION,seed=203011,config={'day':68,'window':14,'threshold':97},evaluation='Endpoints of scenario transfers are positives. Others in each 300-account view are negatives. Synthetic only; no claim of real-world validity.',hardware=platform.platform(),results=results,timing=timing)
 Path('public').mkdir(exist_ok=True);Path('public/evaluation.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
if __name__=='__main__':main()
