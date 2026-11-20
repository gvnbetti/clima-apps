"""Outdoor comfort, Ladybug comparison step 2: Ladybug Tools (ladybug-comfort) evaluates the scenarios of lb_dump.js with
its own SolarCal (body_solar_flux_from_parts, standing) and UTCI. Two variants: V1, the surroundings at air temperature
(Ladybug's default outdoor assumption); V2, the surroundings at Micro Clima's computed radiant temperature (ground, canopy,
walls), so that only the sky exchange and the sun on the body come from Ladybug. Usage: python3 lb_run.py <tag>"""
import sys, os, json, numpy as np
from ladybug_comfort.solarcal import body_solar_flux_from_parts, erf_from_body_solar_flux, mrt_delta_from_erf, longwave_mrt_delta_from_horiz_ir
from ladybug_comfort.utci import universal_thermal_climate_index as utci
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from paths import WORK
D = os.path.join(WORK, "outdoor"); tag = sys.argv[1]; meta = json.load(open(f"{D}/lb_{tag}_meta.json")); n = 8760
a = np.fromfile(f"{D}/lb_{tag}.bin", dtype="<f4").reshape(-1, n); H = {k: a[i] for i, k in enumerate(meta["hourly"])}; off = len(meta["hourly"]); ps = meta["perScen"]
out = np.zeros((len(meta["scen"]), 2, n), dtype="<f4")
for k, sc in enumerate(meta["scen"]):
    S = {nm: a[off + k * len(ps) + j] for j, nm in enumerate(ps)}
    for i in range(n):
        el, ta, rh, v = float(H["el"][i]), float(H["ta"][i]), float(H["rh"][i]), float(S["v10"][i])
        sx, fr, ir = float(S["skyx"][i]), float(S["fract"][i]), float(H["lsky"][i])
        sd = 0.0
        if el >= 2:
            fl = body_solar_flux_from_parts(float(H["dhi"][i]), float(H["dni"][i]), el, 135, sx, fr, sc["alb"], "standing")
            sd = mrt_delta_from_erf(erf_from_body_solar_flux(fl, 0.7, 0.95), 0.725)
        for vi, srf in enumerate((ta, float(S["tsrf"][i]))):
            mrt = srf + sd + longwave_mrt_delta_from_horiz_ir(ir, srf, sx, 0.95)
            out[k, vi, i] = utci(ta, ta + max(-30.0, min(70.0, mrt - ta)), v, rh)
out.tofile(f"{D}/lb_{tag}_out.bin"); print(tag, "done")
