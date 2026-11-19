"""Radiance reference for daylight with blinds (v16). Same rooms as the app (geometry, sensors), 2-phase daylight
coefficients (Reinhart MF:4, 6 bounces), sky from gendaymtx (Perez). Blinds as a diffusing layer 3 cm outside (exterior)
or inside (interior) the glass: diffuse transmittance as the app's light transmittance (0.10 / 0.25), no beam through.
The app instead scales the light of a window with its blind down by that transmittance, keeping the sun patch."""
import json, os, subprocess, sys, math
import numpy as np
from multiprocessing import Pool
B = "/usr/local/lib/python3.13/site-packages/pyradiance/bin"
ENV = dict(os.environ, PATH=B + ":" + os.environ["PATH"], RAYPATH=".:" + B.replace("/bin", "/lib"))
R = '/home/claude/radz'; os.chdir(R)
def sh(cmd, out=None):
    r = subprocess.run(cmd, shell=True, env=ENV, stdout=open(out, "wb") if out else subprocess.PIPE, stderr=subprocess.PIPE)
    if r.returncode: raise RuntimeError(cmd + "\n" + r.stderr.decode()[-2000:])
    return r.stdout
def tn_of(T): return (math.sqrt(0.8402528435 + 0.0072522239 * T * T) - 0.9166530661) / 0.0036261119 / T
def poly(name, mat, pts): return f"{mat} polygon {name}\n0\n0\n{3*len(pts)} " + " ".join(f"{x:.5f} {y:.5f} {z:.5f}" for x, y, z in pts) + "\n"
BL = {'exterior': (0.10, 0.6, +0.03), 'interior': (0.25, 0.8, -0.03)}  # tau, C(1-s), offset along the outward normal
def rad(room, blind=None):
    s = ""; mats = {}; tn = tn_of(room['tau']); s += f"void glass glass_m 0 0 3 {tn:.5f} {tn:.5f} {tn:.5f}\n"
    if blind:
        tau, cs, off = BL[blind]; t = tau / cs  # trans: diffuse transmittance C(1-s)t, diffuse reflectance C(1-s)(1-t)
        s += f"void trans blind_m 0 0 7 {cs} {cs} {cs} 0 0 {t:.4f} 0\n"
    for k, r in enumerate(room['geom']):
        if r.get('twin'): continue
        if r['kind'] == 'glass': m = 'glass_m'
        else:
            rho = r['rho']; m = f"m_{rho:.3f}".replace(".", "_")
            if m not in mats: mats[m] = 1; s += f"void plastic {m} 0 0 5 {rho} {rho} {rho} 0 0\n"
        o, u, v, Lu, Lv, n = r['o'], r['u'], r['v'], r['Lu'], r['Lv'], r['n']
        def pts_at(sh_):
            P = lambda a, b: tuple(o[i] + u[i] * a + v[i] * b + n[i] * sh_ for i in range(3))
            p = [P(0, 0), P(Lu, 0), P(Lu, Lv), P(0, Lv)]
            cr = (u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0])
            return p[::-1] if sum(cr[i] * n[i] for i in range(3)) < 0 else p
        s += poly(f"{r['kind']}_{k}", m, pts_at(0))
        if blind and r['kind'] == 'glass': s += poly(f"blind_{k}", 'blind_m', pts_at(BL[blind][2]))
    return s
SKY = "#@rfluxmtx h=u u=Y\nvoid glow groundglow 0 0 4 1 1 1 0\ngroundglow source ground 0 0 4 0 0 -1 180\n#@rfluxmtx h=r4 u=Y\nvoid glow skyglow 0 0 4 1 1 1 0\nskyglow source skydome 0 0 4 0 0 1 180\n"
def dc(args):
    room, blind = args; d = f"{R}/ref/{room['id']}"; os.makedirs(d, exist_ok=True); tag = blind or 'clear'
    f = f"{d}/dc_{tag}.mtx"
    if os.path.exists(f): return f
    open(f"{d}/room_{tag}.rad", "w").write(rad(room, blind)); sh(f"xform -rz {180 - room['az']} {d}/room_{tag}.rad", out=f"{d}/world_{tag}.rad")
    open(f"{d}/sky.rad", "w").write(SKY); a = math.radians(180 - room['az'])
    open(f"{d}/pts.txt", "w").write("".join(f"{x*math.cos(a)-y*math.sin(a):.4f} {x*math.sin(a)+y*math.cos(a):.4f} {z:.4f} 0 0 1\n" for x, y, z in room['sensors']))
    sh(f"rfluxmtx -I+ -ab 6 -ad 8192 -lw 2e-5 -y {len(room['sensors'])} -n 1 - {d}/sky.rad {d}/world_{tag}.rad < {d}/pts.txt", out=f + ".tmp"); os.rename(f + ".tmp", f)
    return f
if __name__ == "__main__":
    C = json.load(open('cases.json'))
    for w in ['mannheim', 'bologna', 'dubai']:
        if not os.path.exists(f"sky_{w}.mtx"):
            sh(f"epw2wea /home/claude/epz16/wx/{w}.epw {w}.wea"); sh(f"gendaymtx -m 4 -O0 {w}.wea", out=f"sky_{w}.mtx")
    jobs = [(r, b) for r in C['rooms'] for b in (None, 'exterior', 'interior')]
    with Pool(2) as p:
        for f in p.imap_unordered(dc, jobs): print(f, flush=True)
    res = {}
    for r in C['rooms']:
        for w in ['mannheim', 'bologna', 'dubai']:
            for tag in ('clear', 'exterior', 'interior'):
                o = sh(f"dctimestep {R}/ref/{r['id']}/dc_{tag}.mtx sky_{w}.mtx | rmtxop -fa -c 47.4 119.9 11.6 - | getinfo -")
                np.save(f"{R}/ref/{r['id']}/E_{w}_{tag}.npy", np.loadtxt(o.decode().splitlines()).astype(np.float32))  # [sensor][hour]
    print("DONE")
