"""Daylight, step 3: the app's useful daylight (300 to 3,000 lx, office hours) against Radiance, without blinds and with
blinds lowered in the hours the app lowers them. Writes results.md next to this script."""
import json, os, sys, numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from paths import WORK
HERE = os.path.dirname(os.path.abspath(__file__))
R = os.path.join(WORK, 'daylight'); C = json.load(open(f'{R}/cases.json')); tv = C['tv']
L = []; print = lambda *a: L.append(' '.join(str(x) for x in a))
def udi(E, lo=300, hi=3000): n = E.size; return 100 * ((E >= lo) & (E <= hi)).sum() / n, 100 * (E < lo).sum() / n, 100 * (E > hi).sum() / n
print('# Daylight: the app against Radiance'); print(''); print(f"Glass light transmittance {tv}; useful daylight 300 to 3,000 lx over office hours; blinds lowered in the hours the app's reference room lowers them. UDI, percentage of sensor-hours.")
print(''); print('| Room | City | Blind | UDI app | UDI Radiance | Difference | Below 300 lx, app / Radiance | Above 3,000 lx, app / Radiance | Hours with blind down |'); print('|---|---|---|---|---|---|---|---|---|')
rows = []
for r in C['rooms']:
    for w, cv in r['cities'].items():
        occ = np.array(cv['occ'])
        Ec = np.load(f"{R}/ref/{r['id']}/E_{w}_clear.npy")[:, occ] * tv / r['tau']
        for b in ('none', 'interior', 'exterior'):
            if b == 'none': E = Ec; nb = 0
            else:
                m = np.array(cv['masks'][b], bool); Eb = np.load(f"{R}/ref/{r['id']}/E_{w}_{b}.npy")[:, occ] * tv / r['tau']; E = np.where(m[None, :], Eb, Ec); nb = m.mean()
            u, lo, hi = udi(E); a = cv['app'][b]
            rows.append((r['id'], w, b, a['udi'], u, a['lo'], lo, a['hi'], hi, nb))
            print(f"| {r['id']} | {w.replace('_', ' ').title()} | {b} | {a['udi']:.1f} | {u:.1f} | {a['udi']-u:+.1f} | {a['lo']:.1f} / {lo:.1f} | {a['hi']:.1f} / {hi:.1f} | {100*nb:.0f}% |")
print(''); print('## Summary'); print('')
for b in ('none', 'interior', 'exterior'):
    d = [x[3] - x[4] for x in rows if x[2] == b]; print(f"- {b}: UDI app minus Radiance {np.mean(d):+.1f} points on average, {min(d):+.1f} to {max(d):+.1f}; mean absolute {np.mean(np.abs(d)):.1f}")
# effect of the blind on UDI (drop against no blind), app against Radiance
for b in ('interior', 'exterior'):
    e = []
    for r_ in set(x[0] for x in rows):
        for w in set(x[1] for x in rows):
            n = [x for x in rows if x[0] == r_ and x[1] == w and x[2] == 'none'][0]; s = [x for x in rows if x[0] == r_ and x[1] == w and x[2] == b][0]
            e.append(((s[3] - n[3]), (s[4] - n[4])))
    print(f"- {b} blind, change of UDI against no blind: app {np.mean([x[0] for x in e]):+.1f} points, Radiance {np.mean([x[1] for x in e]):+.1f} points")
open(os.path.join(HERE, 'results.md'), 'w').write('\n'.join(L) + '\n'); __builtins__.print('\n'.join(L[-8:]))
