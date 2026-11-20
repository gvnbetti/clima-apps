import json, numpy as np, collections
from scipy.stats import spearmanr
R = '/home/claude/epz16'; C = json.load(open(f'{R}/cases.json'))
h = np.arange(8760); dow = (h // 24) % 7; hr = h % 24
OCC = {'office': (dow < 5) & (hr >= 7) & (hr < 18), 'dwelling': np.ones(8760, bool)}
rows = []
for c in C:
    js = json.load(open(f"{R}/js/{c['id']}.json")); ef = json.load(open(f"{R}/runs/{c['id']}_f/res.json")); eh = json.load(open(f"{R}/runs/{c['id']}_h/res.json"))
    a, b = np.array(ef['top']), np.array(js['free']['top']); o = OCC[c['use']]
    kh = lambda t, ref: float(np.clip(t[o] - ref, 0, None).sum())
    d = c['design']
    rows.append(dict(id=c['id'], wx=c['wx'], use=c['use'], sc=c['scenario'], az=c['az'], k=c['id'].split('_')[-1], blind=c['shade']['key'], day=d['dayAch'], night=d['nightAch'], mass=d['mass'], wwr=d['wwr'],
        rmse=float(np.sqrt(((b - a) ** 2).mean())), bias=float((b - a).mean()), dmax=float(b.max() - a.max()),
        kh26_js=kh(b, 26), kh26_ep=kh(a, 26), qh_js=js['heat']['qh'], qh_ep=eh['qh'],
        rmse_h=float(np.sqrt(((np.array(js['heat']['top']) - np.array(eh['top'])) ** 2).mean()))))
def summ(sel, lab):
    r = [x for x in rows if sel(x)];
    if not r: return
    K1 = sum(x['kh26_js'] for x in r); K2 = sum(x['kh26_ep'] for x in r); Q1 = sum(x['qh_js'] for x in r); Q2 = sum(x['qh_ep'] for x in r)
    print(f"{lab:34s} n={len(r):3d} rmse {np.mean([x['rmse'] for x in r]):.2f} K  bias {np.mean([x['bias'] for x in r]):+.2f} K  max {np.mean([x['dmax'] for x in r]):+.2f} K  K·h>26 {100*(K1/K2-1):+.0f}%  heating {100*(Q1/Q2-1):+.0f}%")
print('All cases, free-running hourly operative temperature (JS minus EnergyPlus), occupied degree-hours above 26 °C, heating need')
summ(lambda x: True, 'all')
for f, vals in [('wx', ['mannheim', 'bologna', 'dubai']), ('use', ['office', 'dwelling']), ('sc', ['cellular', 'corner', 'corner_top']), ('blind', ['none', 'interior', 'exterior']), ('day', [0, 1, 2]), ('night', [0, 1, 5]), ('mass', ['light', 'medium', 'heavy', 'vheavy'])]:
    for v in vals: summ(lambda x, f=f, v=v: x[f] == v, f'{f}={v}')
# ranking within each group of six designs (same climate, use, room type, facade)
G = collections.defaultdict(list)
for x in rows: G[(x['wx'], x['use'], x['sc'], x['az'])].append(x)
rk = []; best = 0; bestH = 0; rkH = []
for g, r in G.items():
    a = [x['kh26_js'] for x in r]; b = [x['kh26_ep'] for x in r]
    if np.std(b) > 0 and np.std(a) > 0: rk.append(spearmanr(a, b)[0])
    best += int(np.argmin(a) == np.argmin(b))
    qa = [x['qh_js'] for x in r]; qb = [x['qh_ep'] for x in r]; rkH.append(spearmanr(qa, qb)[0]); bestH += int(np.argmin(qa) == np.argmin(qb))
print(f"\nRank correlation of overheating across the 6 designs, per group: mean {np.mean(rk):.3f}, min {np.min(rk):.3f} ({len(rk)} groups); same least-overheating design in {best} of {len(G)}")
print(f"Rank correlation of heating need: mean {np.mean(rkH):.3f}, min {np.min(rkH):.3f}; same lowest-heating design in {bestH} of {len(G)}")
print(f"Heated run hourly RMSE: {np.mean([x['rmse_h'] for x in rows]):.2f} K")
w = sorted(rows, key=lambda x: -x['rmse'])[:5]
print('\nLargest hourly differences:'); [print(f"  {x['id']}: rmse {x['rmse']:.2f} bias {x['bias']:+.2f} blind {x['blind']} day {x['day']} night {x['night']} mass {x['mass']} wwr {x['wwr']}") for x in w]
json.dump(rows, open(f'{R}/summary.json', 'w'))
