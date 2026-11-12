import os, json, hashlib, time, threading, logging
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor
from collections import OrderedDict, deque
from typing import Literal
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import select, update, func, text
from . import db, analytics
from .data import CASES, VERSION, N, iso, aid

class Settings(BaseModel):
    model_config=ConfigDict(extra='forbid')
    case_id: Literal['relay','hub','loop']='relay'
    day: float=Field(default=68,ge=0,le=90,allow_inf_nan=False)
    window: Literal[7,14,30]=14
    threshold: float=Field(default=97,ge=80,le=100,allow_inf_nan=False)
    detector: Literal['combined','rules','model']='combined'
    injection: bool=True

executor=ThreadPoolExecutor(max_workers=1)
slots=threading.BoundedSemaphore(3)
lock=threading.Lock();rates=OrderedDict()
ready=False

@asynccontextmanager
async def lifespan(app):
    global ready
    db.initialize()
    # Prior jobs interrupted by a restart are explicitly failed, never left running.
    with db.engine.begin() as c:c.execute(update(db.runs).where(db.runs.c.status.in_(['queued','running'])).values(status='failed',result={'error':'Interrupted by restart. Submit again.'}))
    analytics.model(14)
    ready=True
    yield
    executor.shutdown(wait=False,cancel_futures=True)

app=FastAPI(title='SIGNAL analysis API',version='1.0',lifespan=lifespan,docs_url='/api/docs')
app.add_middleware(CORSMiddleware,allow_origins=['https://signal-financial-intelligence.rice-emit3k.chatgpt.site'],allow_origin_regex=r'https?://(localhost|127\.0\.0\.1)(:\d+)?|https://[^/]+\.chatgpt\.site',allow_methods=['GET','POST'],allow_headers=['Content-Type'])

@app.middleware('http')
async def limits(request: Request,call_next):
    if request.method=='POST':
        size=request.headers.get('content-length','0')
        if not size.isdigit() or int(size)>2048:return JSONResponse({'detail':'Maximum request size is 2 KB.'},413)
        body=await request.body()
        if len(body)>2048:return JSONResponse({'detail':'Maximum request size is 2 KB.'},413)
        # Render's proxy provides client IP. Bounded map limits memory use.
        ip=request.headers.get('x-forwarded-for',request.client.host if request.client else 'unknown').split(',')[0].strip()
        now=time.monotonic()
        with lock:
            queue=rates.setdefault(ip,deque());rates.move_to_end(ip)
            while queue and now-queue[0]>60:queue.popleft()
            if len(queue)>=24:return JSONResponse({'detail':'Analysis limit reached. Retry in one minute.'},429,headers={'Retry-After':'60'})
            queue.append(now)
            while len(rates)>2000:rates.popitem(last=False)
    response=await call_next(request)
    response.headers['X-Content-Type-Options']='nosniff'
    return response

@app.get('/api/v1/health')
def health():
    with db.engine.connect() as c:c.execute(text('SELECT 1'))
    return {'status':'ok' if ready else 'starting','database':db.engine.dialect.name,'dataset_version':VERSION,'model_version':analytics.MODEL_VERSION}

@app.get('/api/v1/datasets')
def datasets():
    return {'items':[{'id':VERSION,'accounts':N,'transactions':120133,'days':90,'currency':'USD','synthetic':True,'seed':203011,'start':iso(0),'end':iso(90)}]}
@app.get('/api/v1/cases')
def cases():return {'items':CASES}
@app.get('/api/v1/cases/{case_id}')
def case(case_id:str):
    item=next((c for c in CASES if c['id']==case_id),None)
    if not item:raise HTTPException(404,'Case not found')
    return item

def get_run(run_id):
    with db.engine.connect() as c:r=c.execute(select(db.runs).where(db.runs.c.id==run_id)).mappings().first()
    if not r:raise HTTPException(404,'Analysis not found. Recreate it using its saved configuration.')
    return dict(r)

def work(run_id, config):
    try:
        with db.engine.begin() as c:c.execute(update(db.runs).where(db.runs.c.id==run_id).values(status='running'))
        result=analytics.run(config)
        result['run_id']=run_id
        with db.engine.begin() as c:c.execute(update(db.runs).where(db.runs.c.id==run_id).values(status='completed',result=result))
    except Exception:
        logging.exception('Analysis failed: %s',run_id)
        with db.engine.begin() as c:c.execute(update(db.runs).where(db.runs.c.id==run_id).values(status='failed',result={'error':'Analysis failed. Please retry.'}))
    finally:slots.release()

@app.post('/api/v1/analyses',status_code=202)
def submit(settings:Settings):
    config=settings.model_dump();config['day']=round(config['day'],6)
    key=hashlib.sha256(json.dumps([VERSION,analytics.MODEL_VERSION,config],sort_keys=True).encode()).hexdigest()[:24]
    with lock:
        with db.engine.begin() as c:
            old=c.execute(select(db.runs).where(db.runs.c.id==key)).mappings().first()
            if old and old['status']!='failed':return {'id':key,'status':old['status'],'cached':True}
            if not slots.acquire(blocking=False):raise HTTPException(429,'Analysis queue is full. Retry shortly.')
            if old:c.execute(update(db.runs).where(db.runs.c.id==key).values(status='queued',result=None))
            else:c.execute(db.runs.insert().values(id=key,status='queued',config=config,result=None))
        executor.submit(work,key,config)
    return {'id':key,'status':'queued','cached':False}
@app.get('/api/v1/analyses/{run_id}')
def analysis(run_id:str):return get_run(run_id)

def completed(run_id):
    r=get_run(run_id)
    if r['status']!='completed':raise HTTPException(409,'Analysis is not complete')
    return r['result']
@app.get('/api/v1/graph')
def graph(run_id:str,root:int|None=None,hops:int=Query(1,ge=1,le=3),limit:int=Query(300,ge=1,le=800)):
    result=completed(run_id);nodes=result['nodes'];edges=result['edges']
    if root is not None:
        ids={root}
        for _ in range(hops):ids|={e[k] for e in edges if e['s'] in ids or e['t'] in ids for k in ['s','t']}
        nodes=[n for n in nodes if n['id'] in ids]
    nodes=nodes[:limit];ids={n['id'] for n in nodes}
    return {'nodes':nodes,'edges':[e for e in edges if e['s'] in ids and e['t'] in ids][:4000],'as_of':result['as_of'],'dataset_version':VERSION}
@app.get('/api/v1/transactions')
def transactions(run_id:str,account:int|None=None,q:str='',offset:int=Query(0,ge=0),limit:int=Query(100,ge=1,le=500)):
    r=completed(run_id);items=r['transactions']
    if account is not None:items=[t for t in items if t['s']==account or t['t']==account]
    if q:items=[t for t in items if q.upper() in t['id']]
    return {'items':items[offset:offset+limit],'total':len(items),'offset':offset,'limit':limit,'dataset_version':VERSION}
@app.get('/api/v1/accounts/{account_id}')
def account(account_id:str,run_id:str):
    r=completed(run_id);n=next((n for n in r['nodes'] if n['account_id']==account_id),None)
    if not n:raise HTTPException(404,'Account is outside the current case view')
    return {**n,'as_of':r['as_of'],'dataset_version':VERSION,'model_version':analytics.MODEL_VERSION}
@app.get('/api/v1/alerts')
def alerts(run_id:str,offset:int=Query(0,ge=0),limit:int=Query(100,ge=1,le=500)):
    items=completed(run_id)['alerts'];return {'items':items[offset:offset+limit],'total':len(items)}
@app.get('/api/v1/alerts/{alert_id}')
def alert(alert_id:str,run_id:str):
    r=completed(run_id);a=next((a for a in r['alerts'] if a['id']==alert_id),None)
    if not a:raise HTTPException(404,'Alert not found')
    return {**a,'transactions':[t for t in r['transactions'] if t['id'] in a['evidence']],'model_version':r['model_version'],'dataset_version':VERSION,'config':r['config']}

@app.get('/api/v1/cases/{case_id}/timeline')
def timeline(case_id:str,injection:bool=True):
    c=case(case_id);lo=c['group']*100;hi=lo+300
    rows=db.rows(db.tx,(db.tx.c.s>=lo)&(db.tx.c.s<hi)&(db.tx.c.t>=lo)&(db.tx.c.t<hi)&((db.tx.c.scenario=='base')|((db.tx.c.scenario==case_id) if injection else (db.tx.c.scenario=='base'))))
    density=[0]*90
    for r in rows:density[min(89,int(r['day']))]+=1
    return {'density':density,'events':[r['day'] for r in rows],'note':'Full case event density; future records do not enter analysis before their timestamp.'}
