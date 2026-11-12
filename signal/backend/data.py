"""Versioned deterministic synthetic ledger. Ground truth never enters inference."""
from datetime import datetime, timezone, timedelta
import numpy as np

VERSION = 'signal-synth-1.0'
SEED = 203011
N = 5000
START = datetime(2026, 1, 1, tzinfo=timezone.utc)
CASES = [
    dict(id='relay', title='The Relay', subtitle='Follow the money in motion.', description='Trace near-matching transfers through intermediary accounts. Look for rapid pass-through activity and reconstruct the sequence.', focus=12, group=0, day=68, seed=SEED),
    dict(id='hub', title='The Hub', subtitle='One account. An unusual orbit.', description='Investigate a sudden concentration of incoming counterparties. Compare the local network against its ordinary activity.', focus=412, group=4, day=68, seed=SEED),
    dict(id='loop', title='The Loop', subtitle='A trail that returns to its origin.', description='Explore repeated circular transfers. Check timing and amounts before drawing a conclusion from network structure.', focus=812, group=8, day=68, seed=SEED),
]

def iso(day):
    return (START + timedelta(days=float(day))).isoformat().replace('+00:00', 'Z')

def aid(i): return f'AC-{int(i):05d}'

def generate(n=N, count=120000):
    rng = np.random.default_rng(SEED)
    accounts = []
    kinds = ['Personal', 'Business', 'Merchant', 'Institutional']
    for i in range(n):
        group = i // 100
        a = (group % 5) * 2 * np.pi / 5 + .35
        radial = 32 + (group % 3) * 7
        center = np.array([np.cos(a)*radial, np.sin(a)*radial*.68, ((group % 4)-1.5)*11])
        p = center + rng.normal(0, [9, 8, 7], 3)
        accounts.append(dict(id=i, account_id=aid(i), account_type=kinds[int(rng.choice(4,p=[.63,.22,.12,.03]))], community=group, x=round(p[0],3), y=round(p[1],3), z=round(p[2],3)))
    source = rng.integers(0,n,count)
    local = (source//100)*100 + rng.integers(0,100,count)
    target = np.where(rng.random(count)<.95, local, rng.integers(0,n,count)) % n
    target = np.where(source==target, (target+1)%n, target)
    days = np.sort(rng.uniform(0,90,count))
    amounts = np.maximum(100,np.rint(rng.lognormal(8.2,1.05,count))).astype(int)
    channels = ['ACH','Wire','Card','Internal']
    transactions = [dict(id=f'TX-{j:07d}', s=int(source[j]), t=int(target[j]), amount=int(amounts[j]), day=round(float(days[j]),6), channel=channels[j%4], scenario='base') for j in range(count)]
    labels = {}
    def add(case,s,t,amount,day):
        tid=f'TX-{len(transactions):07d}'
        transactions.append(dict(id=tid,s=s,t=t,amount=amount,day=round(day,6),channel='Wire',scenario=case))
        labels[tid] = case
    for k in range(9):
        for j in range(5): add('relay',12+j,13+j,2400000-j*12000,62+k*.55+j*.006)
    for k in range(48): add('hub',430+k,412,150000+k*1700,64+k*.012)
    for k in range(10):
        for j in range(4): add('loop',812+j,812+(j+1)%4,850000,63+k*.4+j*.009)
    transactions.sort(key=lambda t:(t['day'],t['id']))
    assert len({t['id'] for t in transactions}) == len(transactions)
    assert all(t['amount']>0 and t['s']!=t['t'] and t['s']<n and t['t']<n for t in transactions)
    return accounts, transactions, labels
