import unittest, os, tempfile, time, json
os.environ['DATABASE_URL']='sqlite:///'+tempfile.mktemp(suffix='.db')
from backend import db, analytics
from backend.data import generate, N
from backend.app import app
from fastapi.testclient import TestClient
from sqlalchemy import update

BASE=dict(case_id='relay',day=68,window=14,threshold=97,detector='combined',injection=True)
class SignalTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  db.initialize();cls.base=analytics.run(BASE)
 def test_generation_deterministic_and_valid(self):
  a,t,labels=generate();a2,t2,l2=generate()
  self.assertEqual(t,t2);self.assertEqual(a,a2);self.assertEqual(labels,l2)
  self.assertEqual(len(a),5000);self.assertEqual(len(t),120133)
  self.assertTrue(all(isinstance(r['amount'],int) and r['amount']>0 and r['s']!=r['t'] for r in t))
 def test_scenarios_detected(self):
  for case,expected in [('relay',13),('hub',412),('loop',812)]:
   r=analytics.run({**BASE,'case_id':case,'detector':'rules'})
   self.assertIn(expected,{a['entity_id'] for a in r['alerts']})
   ids={t['id'] for t in r['transactions']}
   self.assertTrue(all(set(a['evidence'])<=ids for a in r['alerts']))
 def test_injection_changes_actual_records(self):
  r=analytics.run({**BASE,'injection':False})
  self.assertEqual(self.base['stats']['transactions']-r['stats']['transactions'],45)
  self.assertNotEqual(self.base['nodes'][13]['outgoing_minor'],r['nodes'][13]['outgoing_minor'])
 def test_threshold_is_monotonic(self):
  low=analytics.run({**BASE,'detector':'model','threshold':90})
  high=analytics.run({**BASE,'detector':'model','threshold':99})
  self.assertLess(len(high['alerts']),len(low['alerts']))
  self.assertTrue({a['entity_id'] for a in high['alerts']}<={a['entity_id'] for a in low['alerts']})
 def test_no_future_leakage(self):
  with db.engine.begin() as c:
   row=c.execute(db.tx.select().where(db.tx.c.day>70)).mappings().first();old=row['amount'];tid=row['id']
   c.execute(update(db.tx).where(db.tx.c.id==tid).values(amount=999999999))
  after=analytics.run(BASE)
  with db.engine.begin() as c:c.execute(update(db.tx).where(db.tx.c.id==tid).values(amount=old))
  self.assertEqual(self.base['nodes'],after['nodes']);self.assertEqual(self.base['alerts'],after['alerts'])
  before=analytics.run({**BASE,'day':20})
  self.assertTrue(all(n['percentile'] is None and n['baseline']=={} for n in before['nodes']))
  self.assertTrue(all(t['day']<=20 for t in before['transactions']))
 def test_window_and_totals(self):
  r=self.base
  self.assertTrue(all(54<t['day']<=68 for t in r['transactions']))
  self.assertEqual(sum(t['amount'] for t in r['transactions']),r['stats']['volume_minor'])
  self.assertEqual(sum(e['amount_minor'] for e in r['edges']),r['stats']['volume_minor'])
 def test_reproduction(self):
  r=analytics.run(BASE)
  for key in ['nodes','edges','alerts','transactions','stats']:self.assertEqual(self.base[key],r[key])
 def test_temporal_rule_evidence(self):
  events=[dict(id='a',s=0,t=1,amount=200000,day=2),dict(id='b',s=1,t=2,amount=199000,day=2.01)]
  found=analytics.rules(events);self.assertEqual(found[1][0]['evidence'],['a','b'])
  events[1]['day']=3;self.assertNotIn(1,analytics.rules(events))
 def test_api_contract_and_validation(self):
  with TestClient(app) as client:
   self.assertEqual(client.get('/api/v1/health').status_code,200)
   self.assertEqual(client.post('/api/v1/analyses',json={**BASE,'day':91}).status_code,422)
   self.assertEqual(client.post('/api/v1/analyses',json={**BASE,'evil':'code'}).status_code,422)
   self.assertEqual(client.post('/api/v1/analyses',content='x'*3000).status_code,413)
   self.assertEqual(client.get('/api/v1/transactions?run_id=missing&limit=9999').status_code,422)
   job=client.post('/api/v1/analyses',json=BASE).json()
   for _ in range(100):
    result=client.get('/api/v1/analyses/'+job['id']).json()
    if result['status'] in ['completed','failed']:break
    time.sleep(.05)
   self.assertEqual(result['status'],'completed')
   cached=client.post('/api/v1/analyses',json=BASE).json();self.assertEqual(cached['id'],job['id']);self.assertTrue(cached['cached'])
   tx=client.get('/api/v1/transactions',params={'run_id':job['id'],'limit':5}).json();self.assertEqual(len(tx['items']),5)
   graph=client.get('/api/v1/graph',params={'run_id':job['id'],'root':13,'hops':1}).json();self.assertIn(13,{n['id'] for n in graph['nodes']})
if __name__=='__main__':unittest.main()
