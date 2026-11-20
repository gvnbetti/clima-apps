"""Urban heat island, step 2: an independent implementation of the Theeuwes et al. (2017) equation for the daily maximum
urban heat island, with the averaging windows of the paper, and of the apps' stated hourly profile, against the three
implementations in the apps (uhi_dump.js). Also a worked example with constant inputs. Writes results.md.

Equation (Theeuwes et al. 2017): UHImax = (2 - SVF - Fveg) * (S * DTR^3 / U)^(1/4)
  S   = daily mean incoming solar radiation / (rho cp), K m/s; rho cp = 1.2 * 1005 J/(m3 K); day = 00:00 to 24:00
  DTR = daily temperature range at the rural (weather) station, K; U = daily mean wind speed at 10 m, m/s (at least 0.5);
        both over 08:00 to 07:00 the next day, and UHImax applies to that window
Hourly profile (the apps' assumption, not from the paper): the full UHImax with the sun down; with the sun up, reduced by
  0.85 * sqrt(sin(altitude) / sin(highest altitude of the day)), so 15 % of it remains at the daily sun peak."""
import json, os, sys, numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from paths import WORK
HERE = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(WORK, "uhi")
RHOCP = 1.2 * 1005

def theeuwes(dbt, dni, dhi, ws, alt, svf, fveg):
    alt = np.asarray(alt); ghi = np.maximum(0, dhi) + np.where(alt > 0, np.maximum(0, dni) * np.sin(np.radians(alt)), 0)
    n = 8760; day = np.zeros(365)
    for d in range(365):
        S = ghi[d * 24:(d + 1) * 24].mean() / RHOCP
        w = [(d * 24 + 8 + k) % n for k in range(24)]
        dtr = max(0.0, dbt[w].max() - dbt[w].min()); U = max(0.5, np.maximum(0, ws[w]).mean())
        day[d] = max(0.0, 2 - svf - fveg) * (S * dtr ** 3 / U) ** 0.25
    peak = np.array([alt[d * 24:(d + 1) * 24].max() for d in range(365)])
    out = np.zeros(n)
    for i in range(n):
        d = (i - 8) // 24 if i >= 8 else 364
        f = 1.0 if alt[i] <= 0 else 1 - 0.85 * np.sqrt(np.sin(np.radians(alt[i])) / max(0.05, np.sin(np.radians(peak[i // 24]))))
        out[i] = day[d] * f
    return day, out

# worked example: constant inputs, S from a daily mean radiation of 100 W/m2, DTR 8 K, U 3 m/s, SVF 0.5, Fveg 0.2
ex = (2 - 0.5 - 0.2) * ((100 / RHOCP) * 8 ** 3 / 3) ** 0.25
md = ["# Urban heat island: the apps against the equation", "", f"Worked example (S from 100 W/m² daily mean, DTR 8 K, U 3 m/s, SVF 0.5, Fveg 0.2): UHImax = {ex:.3f} K by hand.", "",
      "| File | Neighbourhood | Daily maximum, mean | Independent vs Macro Clima, largest hourly difference | Room Clima (shared modifiers) vs Macro Clima | Micro Clima vs Macro Clima | Annual mean | Night mean |",
      "|---|---|---|---|---|---|---|---|"]
worst = {"ind": 0, "room": 0, "micro": 0}
for id_ in json.load(open(os.path.join(D, "index.json"))):
    r = json.load(open(os.path.join(D, id_ + ".json"))); A = {k: np.array(r[k]) for k in ("dbt", "dni", "dhi", "ws", "alt", "macro", "room", "micro", "dayMax")}
    day, hourly = theeuwes(A["dbt"], A["dni"], A["dhi"], A["ws"], A["alt"], r["svf"], r["fveg"])
    d1, d2, d3 = np.abs(hourly - A["macro"]).max(), np.abs(A["room"] - A["macro"]).max(), np.abs(A["micro"] - A["macro"]).max()
    worst["ind"], worst["room"], worst["micro"] = max(worst["ind"], d1), max(worst["room"], d2), max(worst["micro"], d3)
    night = A["alt"] <= 0
    md.append(f"| {r['file'].replace('.epw', '')} | SVF {r['svf']}, Fveg {r['fveg']} | {day.mean():.2f} K | {d1:.4f} K | {d2:.4f} K | {d3:.4f} K | {hourly.mean():.2f} K | {hourly[night].mean():.2f} K |")
md += ["", f"Largest hourly difference over all cases: independent implementation {worst['ind']:.4f} K; Room Clima {worst['room']:.4f} K; Micro Clima {worst['micro']:.4f} K (all against Macro Clima)."]
open(os.path.join(HERE, "results.md"), "w").write("\n".join(md) + "\n"); print(md[2]); print(md[-1])
