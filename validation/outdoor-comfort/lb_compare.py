"""Outdoor comfort, Ladybug comparison step 3: Micro Clima against Ladybug (V1 and V2, see lb_run.py) on the scenario
matrix of 4 climates. Measures: hourly UTCI difference for the hard plaza (no shade, asphalt, open field); the share of
hours without thermal stress (UTCI 9 to 26 °C) per scenario for three time windows; whether Ladybug ranks the scenarios
the same way, picks the same best scenario, and how much it would lose by taking Micro Clima's best. Writes ladybug.md."""
import json, os, sys, numpy as np
from scipy.stats import spearmanr
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from paths import WORK
HERE = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(WORK, "outdoor"); n = 8760; hour = np.arange(n) % 24
USES = {"café, 11:00 to 22:00": (11, 22), "plaza, 08:00 to 22:00": (8, 22), "all day": (0, 24)}
SH = ["No shade", "Fixed canopy", "Deciduous tree", "Evergreen tree", "Seasonal shade"]; GR = ["Asphalt", "Grey paving", "Light paving", "White paving", "Gravel", "Permeable paving", "Grass"]
md = ["# Micro Clima against Ladybug", "", "V1: Ladybug with the surroundings at air temperature (its default outdoor assumption). V2: Ladybug with Micro Clima's radiant temperature of ground, canopy and walls, so that only sky exchange, sun on the body and UTCI come from Ladybug. Standing person, 70 scenarios per climate (5 shadings × 7 grounds × open field and courtyard H/W 1), exposed to wind.", "",
      "## Hourly UTCI, hard plaza (no shade, asphalt, open field)", "", "| Climate | V1 minus Micro Clima, mean / RMS | V2 minus Micro Clima, mean / RMS |", "|---|---|---|"]
dec = []
for tag in ["Mannheim", "Bologna", "Phoenix", "HoChiMinhCity"]:
    meta = json.load(open(f"{D}/lb_{tag}_meta.json")); a = np.fromfile(f"{D}/lb_{tag}.bin", "<f4").reshape(-1, n); off = len(meta["hourly"]); ps = meta["perScen"]; ns = len(meta["scen"])
    lb = np.fromfile(f"{D}/lb_{tag}_out.bin", "<f4").reshape(ns, 2, n); ours = np.stack([a[off + k * len(ps) + ps.index("utci")] for k in range(ns)])
    nm = lambda s: f"{SH[s['s']]}, {GR[s['g']]}, {'open field' if s['e'] == 0 else 'courtyard'}"
    base = [k for k, s in enumerate(meta["scen"]) if s["s"] == 0 and s["g"] == 0 and s["e"] == 0][0]
    d1, d2 = lb[base, 0] - ours[base], lb[base, 1] - ours[base]
    md.append(f"| {meta['climate']} | {d1.mean():+.2f} / {np.sqrt((d1 ** 2).mean()):.2f} K | {d2.mean():+.2f} / {np.sqrt((d2 ** 2).mean()):.2f} K |")
    for use, (h0, h1) in USES.items():
        m = (hour >= h0) & (hour < h1); ok = lambda U: ((U >= 9) & (U <= 26))[:, m].mean(1) * 100
        sh = {"ours": ok(ours), "V1": ok(lb[:, 0]), "V2": ok(lb[:, 1])}; bo = int(np.argmax(sh["ours"]))
        row = {"clim": meta["climate"], "use": use, "best": nm(meta["scen"][bo]), "share": sh["ours"][bo]}
        for v in ("V1", "V2"):
            bl = int(np.argmax(sh[v])); row[v] = (spearmanr(sh["ours"], sh[v])[0], bl == bo, sh[v][bl] - sh[v][bo], nm(meta["scen"][bl]))
        dec.append(row)
md += ["", "## Decisions: share of hours without thermal stress", "", "Rank correlation of the 70 scenarios; same best scenario; loss = hours (as a share of the window) Ladybug would lose by taking Micro Clima's best instead of its own.", "",
       "| Climate | Window | Micro Clima's best (share) | V1: rank correlation, same best, loss | V2: rank correlation, same best, loss |", "|---|---|---|---|---|"]
for r in dec:
    f = lambda t: f"{t[0]:.3f}, {'yes' if t[1] else 'no: ' + t[3]}, {t[2]:.1f} points"
    md.append(f"| {r['clim']} | {r['use']} | {r['best']} ({r['share']:.0f}%) | {f(r['V1'])} | {f(r['V2'])} |")
v2 = [r["V2"] for r in dec]
md += ["", f"V2 over all {len(dec)} cases: rank correlation {np.mean([x[0] for x in v2]):.3f} on average (lowest {min(x[0] for x in v2):.3f}); same best in {sum(x[1] for x in v2)} of {len(v2)}; largest loss {max(x[2] for x in v2):.1f} points."]
open(os.path.join(HERE, "ladybug.md"), "w").write("\n".join(md) + "\n"); print("\n".join(md[5:11])); print(md[-1])
