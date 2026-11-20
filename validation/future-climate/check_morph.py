"""Future climate, step 4b: the apps' morphing against pyepwmorph (McCarty et al., open source, Belcher et al. 2005
method), on 13 reference weather files at +1.5, +2 and +3 °C, with the same monthly changes.
- Temperature: pyepwmorph's shift-and-stretch with the stretch set to zero (equal changes of the daily maximum and minimum,
  as the Atlas gives only the mean), so both apply the same monthly shift. The apps spread the shift day by day between
  mid-month values; pyepwmorph keeps it constant within each month.
- Dew point: relative humidity held (pyepwmorph morph_relhum_direct with no change), dew point from pyepwmorph's
  psychrometrics against the apps'.
- Sky infrared: the apps scale it with (T'/T)^4; pyepwmorph scales it with Clark-Allen sky emissivity from temperature,
  dew point and sky cover (as EnergyPlus). Both are compared.
Writes morph_check.md."""
import json, os, sys, numpy as np, pandas as pd
from pyepwmorph.morph import procedures as P
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from paths import WORK, WX
HERE = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(WORK, "future", "morph")
idx = pd.date_range("2017-01-01 00:30", periods=8760, freq="h")   # non-leap year, hour midpoints
rows = []
for it in json.load(open(os.path.join(D, "index.json"))):
    r = json.load(open(os.path.join(D, it["id"] + ".json")))
    dbt0, rh0, dT = pd.Series(r["dbt0"], index=idx), pd.Series(r["rh0"], index=idx), np.array(r["dT"])
    base = pd.Series(np.zeros(12)); fut = pd.Series(dT)
    ref = P.morph_dbt_year(dbt0, fut, base, fut, base, fut, base).to_numpy()       # shift only (stretch zero)
    app = np.array(r["dbt"]); mon = np.array(r["month"]) - 1
    shift_app = app - dbt0.to_numpy(); shift_ref = ref - dbt0.to_numpy()
    mmean = np.array([shift_app[mon == m].mean() for m in range(12)])
    rh_ref = P.morph_relhum_direct(rh0, pd.Series(np.ones(12)), pd.Series(np.ones(12)))
    dpt_ref = P.morph_dewpt(pd.Series(app, index=idx), rh_ref).to_numpy()
    epw = pd.read_csv(os.path.join(WX, r["file"]), skiprows=8, header=None)
    osc = epw[23].to_numpy(dtype=float)
    ir_ref = P.morph_horizontal_ir(pd.Series(r["hir0"], index=idx), dbt0.to_numpy(), np.array(r["dpt0"]), osc, app, np.array(r["dpt"]), osc).to_numpy()
    v = np.array(r["hir0"]) > 0
    rows.append(dict(file=r["file"].replace(".epw", ""), region=r["region"], mid=r["mid"].get("year"), known=r["mid"]["known"], level=r["level"],
        annual=float(shift_app.mean()), annual_ref=float(shift_ref.mean()), month_max=float(np.abs(mmean - dT).max()), hourly_rms=float(np.sqrt(((shift_app - shift_ref) ** 2).mean())),
        hourly_max=float(np.abs(shift_app - shift_ref).max()), dpt_max=float(np.abs(np.array(r["dpt"]) - dpt_ref).max()),
        ir_app=float((np.array(r["hir"]) - np.array(r["hir0"]))[v].mean()), ir_ref=float((ir_ref - np.array(r["hir0"]))[v].mean())))
df = pd.DataFrame(rows)
md = ["# Future climate: the apps' morphing against pyepwmorph", "", "Same monthly changes in both. Shift = morphed minus recorded air temperature.", "",
      "| File | Region | File mid-year | Level | Annual mean shift, app / pyepwmorph | Monthly mean shift, largest difference from the table | Hourly difference, RMS / largest | Dew point, largest difference | Sky infrared change, app / pyepwmorph |",
      "|---|---|---|---|---|---|---|---|---|"]
for _, x in df.iterrows():
    md.append(f"| {x.file} | {x.region} | {x.mid if x.known else str(x.mid) + ' (not in the file: default)'} | +{x.level} °C | {x.annual:.2f} / {x.annual_ref:.2f} K | {x.month_max:.2f} K | {x.hourly_rms:.2f} / {x.hourly_max:.2f} K | {x.dpt_max:.2f} K | {x.ir_app:+.1f} / {x.ir_ref:+.1f} W/m² |")
md += ["", f"Over all {len(df)} cases: annual mean shift equal within {np.abs(df.annual - df.annual_ref).max():.3f} K; monthly mean shift within {df.month_max.max():.2f} K of the table; hourly difference RMS up to {df.hourly_rms.max():.2f} K, largest {df.hourly_max.max():.2f} K (from spreading the shift day by day); dew point within {df.dpt_max.max():.2f} K; sky infrared change {df.ir_app.mean():+.1f} W/m² in the apps against {df.ir_ref.mean():+.1f} W/m² with Clark-Allen on average."]
open(os.path.join(HERE, "morph_check.md"), "w").write("\n".join(md) + "\n"); print("\n".join(md[-1:]))
