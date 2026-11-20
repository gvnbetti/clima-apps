"""Future climate, step 1: rebuilds the warming-level table of the apps (macro/future.js) from the IPCC AR6 WGI Atlas
regional data, with every choice written out. The original processing script was not kept, so this is a documented
reconstruction; check_table.py compares its output with the table the apps use.

Data: CMIP6 monthly means aggregated over the IPCC reference regions (Iturbide et al. 2021), one run per model as listed in
the Atlas warming-level table (warming-levels/CMIP6_Atlas_WarmingLevels.csv), historical plus SSP1-2.6, 2-4.5, 3-7.0, 5-8.5.

Choices:
- Baseline: 1995-2014 monthly means of each model's historical run (the AR6 recent-past baseline).
- Warming level: the 20-year period centred on the year the model crosses 1.5, 2 or 3 °C above 1850-1900 in a scenario
  (crossing year Y from the Atlas table, period Y-9 to Y+10, the Atlas convention).
- Per model: change of each month's mean from the baseline, averaged over the scenarios in which the model crosses the level,
  so each model counts once. Across models: median, 10th and 90th percentile.
- Temperature over land for land regions (tas_land); precipitation over land (pr_land), as a percentage change of the
  monthly mean.
- Change since the baseline at the years of a weather file (to subtract the warming already in the file): the same model
  runs, historical continued by SSP2-4.5, 20-year window centred on each year 1960, 1965, ... 2030, per month and region,
  median across models.
- Global warming at those years (shown to the user): global mean over land and sea (tas_landsea, 'world'), relative to
  1850-1900, same windows, median across models.
Output: WORK/future/atlas_table.json"""
import json, os, sys
import numpy as np, pandas as pd
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from paths import WORK

AT = os.environ.get("ATLAS", os.path.join(WORK, "atlas"))
D = os.path.join(AT, "datasets-aggregated-regionally", "data", "CMIP6")
WL = pd.read_csv(os.path.join(AT, "warming-levels", "CMIP6_Atlas_WarmingLevels.csv"))
SSP = ["ssp126", "ssp245", "ssp370", "ssp585"]
LEVELS = {"1.5": "1.5", "2.0": "2", "3.0": "3"}
YEARS = list(range(1960, 2031, 5))
cache = {}


def load(var, model, exp, member):
    f = os.path.join(D, f"CMIP6_{var}", f"CMIP6_{model}_{exp}_{member}.csv")
    if f not in cache:
        if not os.path.exists(f): cache[f] = None
        else:
            d = pd.read_csv(f, comment="#"); t = pd.to_datetime(d.pop("date"))
            d.index = pd.MultiIndex.from_arrays([t.dt.year, t.dt.month], names=["y", "m"]); cache[f] = d
    return cache[f]


def runs():
    for _, r in WL.iterrows():
        model, member = r.model_run.split("_", 1)
        if load("tas_land", model, "historical", member) is not None: yield r, model, member


def window(d, y0, y1):
    return d[(d.index.get_level_values("y") >= y0) & (d.index.get_level_values("y") <= y1)].groupby(level="m").mean()


out = {"levels": [1.5, 2.0, 3.0], "gwl": {}, "trendYears": YEARS, "trend": {}, "gtrend": None}
regions = None
for key, lv in LEVELS.items():
    dT, dP, n = {}, {}, 0
    for r, model, member in runs():
        h = load("tas_land", model, "historical", member); base = window(h, 1995, 2014)
        hp = load("pr_land", model, "historical", member); basep = window(hp, 1995, 2014) if hp is not None else None
        regions = regions or list(h.columns)
        t_s, p_s = [], []
        for ssp in SSP:
            Y = r[f"{lv}_{ssp}"]; s = load("tas_land", model, ssp, member)
            if pd.isna(Y) or s is None: continue
            Y = int(Y); t_s.append((window(s, Y - 9, Y + 10) - base).to_numpy())
            sp = load("pr_land", model, ssp, member)
            if sp is not None and basep is not None: p_s.append((100 * (window(sp, Y - 9, Y + 10) / basep - 1)).to_numpy())
        if not t_s: continue
        n += 1; dT[model] = np.mean(t_s, 0)
        if p_s: dP[model] = np.mean(p_s, 0)
    A, P = np.array(list(dT.values())), np.array(list(dP.values()))   # model x month x region
    stat = lambda X: np.stack([np.median(X, 0), np.percentile(X, 10, 0), np.percentile(X, 90, 0)], -1)   # month x region x 3
    sT, sP = stat(A), stat(P)
    out["gwl"][key] = {"n": n, "dT": {g: [[round(float(x), 2) for x in sT[m, j]] for m in range(12)] for j, g in enumerate(regions)},
                       "dP": {g: [[round(float(x), 2) for x in sP[m, j]] for m in range(12)] for j, g in enumerate(regions)}}
    print(key, n, "models")

TR, GT = [], []
for r, model, member in runs():
    h, s = load("tas_land", model, "historical", member), load("tas_land", model, "ssp245", member)
    hg, sg = load("tas_landsea", model, "historical", member), load("tas_landsea", model, "ssp245", member)
    if s is None or sg is None: continue
    d = pd.concat([h, s]); base = window(d, 1995, 2014)
    TR.append(np.stack([(window(d, y - 9, y + 10) - base).to_numpy() for y in YEARS], -1))       # month x region x year
    g = pd.concat([hg, sg])["world"].groupby(level="y").mean(); pre = g.loc[1850:1900].mean()
    GT.append([g.loc[y - 9:y + 10].mean() - pre for y in YEARS])
TR = np.median(np.array(TR), 0)
out["trend"] = {g: [[round(float(x), 2) for x in TR[m, j]] for m in range(12)] for j, g in enumerate(regions)}
out["gtrend"] = [round(float(x), 2) for x in np.median(np.array(GT), 0)]
out["n_trend"] = len(GT)
os.makedirs(os.path.join(WORK, "future"), exist_ok=True)
json.dump(out, open(os.path.join(WORK, "future", "atlas_table.json"), "w"))
print("trend from", len(GT), "models; written", os.path.join(WORK, "future", "atlas_table.json"))
