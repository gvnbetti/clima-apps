"""Future climate, step 2: compares the table the apps use (macro/future.js, shared by Micro and Room Clima through
climamods.js) with the reconstruction from the Atlas data (atlas.py). Land regions only (the apps take the land region
of a weather file). Reports the differences of the tabulated values and of the shift the apps actually apply: change at
the level minus change already in the file, for file mid-years 2000, 2011 and 2016. Writes table_check.md."""
import json, os, sys, subprocess
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from paths import WORK
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, "..", "..")
APP = json.loads(subprocess.check_output(["node", "-e", f"global.window={{}};require('{ROOT}/macro/future.js');require('{ROOT}/macro/regions.js');console.log(JSON.stringify({{F:window.CLIMA_FUTURE,R:window.CLIMA_REGIONS.map(r=>({{id:r.id,type:r.type}}))}}))"]))
F, REC = APP["F"], json.load(open(os.path.join(WORK, "future", "atlas_table.json")))
LAND = [r["id"] for r in APP["R"] if r["type"] != "Ocean" and r["id"] in REC["gwl"]["2.0"]["dT"] and r["id"] in F["gwl"]["2.0"]["dT"]]
LAND = [g for g in LAND if REC["gwl"]["2.0"]["dT"][g][0][0] == REC["gwl"]["2.0"]["dT"][g][0][0]]   # drop regions without land data
def delta(T, reg, level, mid):   # as futureDelta in macro/core.js
    L = T["gwl"][level]; ys = T["trendYears"]; y = max(ys[0], min(ys[-1], mid)); k = min(len(ys) - 2, int((y - ys[0]) // 5)); f = (y - ys[k]) / 5
    return np.array([L["dT"][reg][m][0] - (T["trend"][reg][m][k] + (T["trend"][reg][m][k + 1] - T["trend"][reg][m][k]) * f) for m in range(12)])
md = ["# Future climate: the apps' table against the reconstruction from the Atlas data", "",
      f"{len(LAND)} land regions, 12 months. Differences are app minus reconstruction, in K (temperature) or percentage points (precipitation).", "",
      "| Quantity | Mean absolute difference | Largest difference | Share within 0.1 K |", "|---|---|---|---|"]
rows = []
for lv in ("1.5", "2.0", "3.0"):
    for j, name in enumerate(("median", "10th percentile", "90th percentile")):
        d = np.array([[F["gwl"][lv]["dT"][g][m][j] - REC["gwl"][lv]["dT"][g][m][j] for m in range(12)] for g in LAND])
        md.append(f"| Change of monthly mean temperature at +{lv} °C, {name} | {np.abs(d).mean():.2f} K | {d.flat[np.abs(d).argmax()]:+.2f} K | {100 * (np.abs(d) <= 0.1).mean():.0f}% |")
    d = np.array([[F["gwl"][lv]["dP"][g][m][0] - REC["gwl"][lv]["dP"][g][m][0] for m in range(12)] for g in LAND if g in F["gwl"][lv]["dP"]])
    md.append(f"| Change of monthly precipitation at +{lv} °C, median | {np.abs(d).mean():.1f} points | {d.flat[np.abs(d).argmax()]:+.1f} points | |")
d = np.array([[[F["trend"][g][m][k] - REC["trend"][g][m][k] for k in range(len(F["trendYears"]))] for m in range(12)] for g in LAND])
md.append(f"| Warming since 1995-2014 at the file's years (1960 to 2030) | {np.abs(d).mean():.2f} K | {d.flat[np.abs(d).argmax()]:+.2f} K | {100 * (np.abs(d) <= 0.1).mean():.0f}% |")
g = np.array(F["gtrend"]) - np.array(REC["gtrend"])
md.append(f"| Global warming above 1850-1900 at the file's years | {np.abs(g).mean():.2f} K | {g[np.abs(g).argmax()]:+.2f} K | {100 * (np.abs(g) <= 0.1).mean():.0f}% |")
md += ["", "## The shift applied to a weather file", "", "Monthly temperature shift (change at the level minus the change already in the file), app minus reconstruction:", "",
       "| File mid-year | Level | Mean absolute difference | Largest difference | Share within 0.1 K | Share within 0.2 K |", "|---|---|---|---|---|---|"]
for mid in (2000, 2011, 2016):
    for lv in ("1.5", "2.0", "3.0"):
        d = np.array([delta(F, g, lv, mid) - delta(REC, g, lv, mid) for g in LAND])
        md.append(f"| {mid} | +{lv} °C | {np.abs(d).mean():.2f} K | {d.flat[np.abs(d).argmax()]:+.2f} K | {100 * (np.abs(d) <= 0.1).mean():.0f}% | {100 * (np.abs(d) <= 0.2).mean():.0f}% |")
md += ["", "Regions with the largest mean difference of the applied shift (file mid-year 2011, +2 °C):", ""]
dd = sorted(((np.abs(delta(F, g, "2.0", 2011) - delta(REC, g, "2.0", 2011)).mean(), g) for g in LAND), reverse=True)[:6]
md += [f"- {g}: {v:.2f} K" for v, g in dd]
open(os.path.join(HERE, "table_check.md"), "w").write("\n".join(md) + "\n"); print("\n".join(md))
