"""Room types, step 3: compares the app with EnergyPlus case by case and per group, writes results.md next to this script."""
import json, os, sys, numpy as np, collections
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'lib'))
from paths import WORK
from scipy.stats import spearmanr
R = os.path.join(WORK, 'room_types'); C = json.load(open(f'{R}/cases.json'))
HERE = os.path.dirname(os.path.abspath(__file__)); L = []; print = lambda *a: L.append(' '.join(str(x) for x in a))
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
    print(f"| {lab} | {len(r)} | {np.mean([x['rmse'] for x in r]):.2f} K | {np.mean([x['bias'] for x in r]):+.2f} K | {np.mean([x['dmax'] for x in r]):+.2f} K | {(f'{100*(K1/K2-1):+.0f}%' if K2 > 0 else 'n/a')} ({K2/len(r):.0f} K·h) | {(f'{100*(Q1/Q2-1):+.0f}%' if Q2 > 0.05 * len(r) else 'n/a')} ({Q2/len(r):.1f} kWh/m²) |")
print('# Room types: the app against EnergyPlus'); print('')
print('Free-running hourly operative temperature (app minus EnergyPlus): RMSE, mean bias, difference of the annual maximum. Occupied degree-hours above 26 °C and heating need: app against EnergyPlus as a percentage of the total, with the EnergyPlus mean per case in brackets.'); print('')
print('| Group | Cases | Hourly RMSE | Bias | Annual maximum | Degree-hours above 26 °C | Heating need |'); print('|---|---|---|---|---|---|---|')
summ(lambda x: True, 'all')
for f, vals in [('wx', ['mannheim', 'bologna', 'san_francisco', 'phoenix', 'dubai', 'ho_chi_minh_city']), ('use', ['office', 'dwelling']), ('sc', ['cellular', 'corner', 'corner_top']), ('blind', ['none', 'interior', 'exterior']), ('day', [0, 1, 2]), ('night', [0, 1, 5]), ('mass', ['light', 'medium', 'heavy', 'vheavy'])]:
    for v in vals: summ(lambda x, f=f, v=v: x[f] == v, f'{f}={v}')
# ranking within each group of six designs (same climate, use, room type, facade)
G = collections.defaultdict(list)
for x in rows: G[(x['wx'], x['use'], x['sc'], x['az'])].append(x)
rk = []; best = 0; bestH = 0; rkH = []
for g, r in G.items():
    a = [x['kh26_js'] for x in r]; b = [x['kh26_ep'] for x in r]
    if np.std(b) > 0 and np.std(a) > 0: rk.append(spearmanr(a, b)[0])
    best += int(np.argmin(a) == np.argmin(b))
    qa = [x['qh_js'] for x in r]; qb = [x['qh_ep'] for x in r]; rkH.append(spearmanr(qa, qb)[0] if np.std(qa) > 0 and np.std(qb) > 0 else np.nan); bestH += int(np.argmin(qa) == np.argmin(qb))
print(''); print('## Ranking of the six designs in each group (same climate, use, room type, facade)'); print('')
print(f"- Overheating: rank correlation {np.mean(rk):.3f} on average, lowest {np.min(rk):.3f} ({len(rk)} groups); same least-overheating design in {best} of {len(G)} groups")
print(f"- Heating need: rank correlation {np.nanmean(rkH):.3f} on average, lowest {np.nanmin(rkH):.3f} ({int(np.sum(~np.isnan(rkH)))} groups with heating); same lowest-heating design in {bestH} of {len(G)} groups")
print(f"- Heated runs: hourly operative temperature RMSE {np.mean([x['rmse_h'] for x in rows]):.2f} K")
w = sorted(rows, key=lambda x: -x['rmse'])[:5]
print(''); print('## Largest hourly differences'); print('')
[print(f"- {x['id']}: RMSE {x['rmse']:.2f} K, bias {x['bias']:+.2f} K; blind {x['blind']}, day airing {x['day']}, night airing {x['night']}, mass {x['mass']}, window {x['wwr']}") for x in w]
json.dump(rows, open(f'{R}/summary.json', 'w')); open(os.path.join(HERE, 'results.md'), 'w').write('\n'.join(L) + '\n'); __builtins__.print('\n'.join(L))
