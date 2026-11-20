import json, numpy as np
R = '/home/claude/radz'; C = json.load(open(f'{R}/cases.json')); tv = C['tv']
def udi(E, lo=300, hi=3000): n = E.size; return 100 * ((E >= lo) & (E <= hi)).sum() / n, 100 * (E < lo).sum() / n, 100 * (E > hi).sum() / n
print(f"Glass light transmittance {tv}; useful daylight 300 to 3,000 lx, office weekdays 7 to 18; blind hours from the app's reference room")
print(f"{'room':5s} {'city':9s} {'blind':9s} | {'UDI app':>8s} {'Radiance':>8s} {'diff':>6s} | {'<300 app':>8s} {'Rad':>6s} | {'>3000 app':>9s} {'Rad':>6s} | blind hours")
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
            print(f"{r['id']:5s} {w:9s} {b:9s} | {a['udi']:8.1f} {u:8.1f} {a['udi']-u:+6.1f} | {a['lo']:8.1f} {lo:6.1f} | {a['hi']:9.1f} {hi:6.1f} | {100*nb:4.0f}%")
for b in ('none', 'interior', 'exterior'):
    d = [x[3] - x[4] for x in rows if x[2] == b]; print(f"{b:9s}: UDI app minus Radiance mean {np.mean(d):+.1f} points, range {min(d):+.1f} to {max(d):+.1f}")
# effect of the blind on UDI (drop against no blind), app against Radiance
for b in ('interior', 'exterior'):
    e = []
    for r_ in set(x[0] for x in rows):
        for w in set(x[1] for x in rows):
            n = [x for x in rows if x[0] == r_ and x[1] == w and x[2] == 'none'][0]; s = [x for x in rows if x[0] == r_ and x[1] == w and x[2] == b][0]
            e.append(((s[3] - n[3]), (s[4] - n[4])))
    print(f"{b:9s}: UDI change from the blind, app {np.mean([x[0] for x in e]):+.1f} points, Radiance {np.mean([x[1] for x in e]):+.1f} points")
json.dump(rows, open(f'{R}/summary.json', 'w'))
