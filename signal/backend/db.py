import os, json
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, BigInteger, String, Float, JSON, ForeignKey, CheckConstraint, Index, select, func
from .data import VERSION, generate
url = os.getenv('DATABASE_URL','sqlite:///signal.db')
if url.startswith('postgres://'): url = url.replace('postgres://','postgresql+psycopg://',1)
if url.startswith('postgresql://'): url = url.replace('postgresql://','postgresql+psycopg://',1)
engine = create_engine(url, pool_pre_ping=True, **({'connect_args':{'check_same_thread':False}} if url.startswith('sqlite') else {'pool_size':3,'max_overflow':2}))
meta=MetaData()
accounts=Table('signal_accounts',meta,Column('id',Integer,primary_key=True),Column('account_id',String(20),unique=True,nullable=False),Column('account_type',String(30),nullable=False),Column('community',Integer,nullable=False),Column('x',Float),Column('y',Float),Column('z',Float))
tx=Table('signal_transactions',meta,Column('id',String(20),primary_key=True),Column('s',Integer,ForeignKey('signal_accounts.id'),nullable=False),Column('t',Integer,ForeignKey('signal_accounts.id'),nullable=False),Column('amount',BigInteger,nullable=False),Column('day',Float,nullable=False),Column('channel',String(20)),Column('scenario',String(20),nullable=False),CheckConstraint('amount > 0'),CheckConstraint('s != t'))
Index('signal_tx_time',tx.c.day)
Index('signal_tx_source',tx.c.s,tx.c.day)
Index('signal_tx_target',tx.c.t,tx.c.day)
runs=Table('signal_runs',meta,Column('id',String(64),primary_key=True),Column('status',String(20)),Column('config',JSON),Column('result',JSON))
metadata=Table('signal_metadata',meta,Column('key',String(50),primary_key=True),Column('value',JSON))

def initialize():
    meta.create_all(engine)
    with engine.begin() as con:
        old=con.execute(select(metadata.c.value).where(metadata.c.key=='dataset')).scalar()
        if old:
            if old['version'] != VERSION: raise RuntimeError('Dataset migration required')
            return
        a,t,labels=generate()
        con.execute(accounts.insert(),a)
        for start in range(0,len(t),4000): con.execute(tx.insert(),t[start:start+4000])
        con.execute(metadata.insert(),{'key':'dataset','value':{'version':VERSION,'accounts':len(a),'transactions':len(t),'days':90}})
        # Evaluation truth lives in a separate table record. No inference path reads it.
        con.execute(metadata.insert(),{'key':'evaluation_truth','value':labels})

def rows(table, condition=None):
    with engine.connect() as c:
        q=select(table)
        if condition is not None: q=q.where(condition)
        if table is tx: q=q.order_by(tx.c.day,tx.c.id)
        return [dict(r) for r in c.execute(q).mappings()]
