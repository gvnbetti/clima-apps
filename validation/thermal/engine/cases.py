"""ASHRAE Standard 140-2020 building thermal envelope cases (600 and 900 series): one description shared by the
EnergyPlus models (ep_run.py) and the app engine (js_run.js). Specification as implemented in the LBL Modelica
Buildings library (Buildings.ThermalZones.Detailed.Validation.BESTEST, version 11.1.0), which follows Standard 140-2020
with Addendum b. Writes WORK/thermal_engine/cases.json."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
from paths import WORK

L, W, H = 8.0, 6.0, 2.7          # x (south wall length), y (east and west wall length), height, m
AF = L * W
# layers outside to inside: thickness m, conductivity W/mK, density kg/m3, specific heat J/kgK (density 0: no mass)
LIGHT = {
    "wall": [(0.009, 0.140, 530, 900), (0.066, 0.040, 12, 840), (0.012, 0.160, 950, 840)],
    "roof": [(0.019, 0.140, 530, 900), (0.1118, 0.040, 12, 840), (0.010, 0.160, 950, 840)],
    "floor": [(1.003, 0.040, 0, 0), (0.025, 0.140, 650, 1200)],
}
HEAVY = {
    "wall": [(0.009, 0.140, 530, 900), (0.0615, 0.040, 10, 1400), (0.100, 0.510, 1400, 1000)],
    "roof": LIGHT["roof"],
    "floor": [(1.007, 0.040, 0, 0), (0.080, 1.130, 1400, 1000)],
}
GLASS = {"thick": 0.003048, "k": 1.0, "tau": 0.834, "rho": 0.075, "eps": 0.84, "gap": 0.012}


def zone(case):
    heavy = case.startswith("9")
    C = HEAVY if heavy else LIGHT
    base = case.replace("FF", "")
    if base in ("620", "920"):
        wins = [{"wall": "E", "x0": 1.5, "w": 3.0, "z0": 0.2, "h": 2.0}, {"wall": "W", "x0": 1.5, "w": 3.0, "z0": 0.2, "h": 2.0}]
    else:
        wins = [{"wall": "S", "x0": 0.5, "w": 3.0, "z0": 0.2, "h": 2.0}, {"wall": "S", "x0": 4.5, "w": 3.0, "z0": 0.2, "h": 2.0}]
    for wn in wins:
        wn["overhang"] = {"dep": 1.0, "gap": 0.5, "ext": 0.5} if base in ("610", "910") else None
    walls = {"S": (L, 180), "E": (W, 90), "N": (L, 0), "W": (W, 270)}
    el = []
    for k, (length, az) in walls.items():
        a = length * H - sum(w["w"] * w["h"] for w in wins if w["wall"] == k)
        el.append({"id": "wall_" + k, "kind": "opaque", "area": a, "tilt": 90, "azimuth": az, "layers": C["wall"], "aSol": 0.6, "eps": 0.9, "bc": "outdoor"})
    el.append({"id": "roof", "kind": "opaque", "area": AF, "tilt": 0, "azimuth": 0, "layers": C["roof"], "aSol": 0.6, "eps": 0.9, "bc": "outdoor"})
    el.append({"id": "floor", "kind": "opaque", "area": AF, "tilt": 180, "azimuth": 0, "layers": C["floor"], "aSol": 0.0, "eps": 0.9, "bc": "outdoor_nosun"})
    for j, wn in enumerate(wins):
        el.append({"id": f"win{j}", "kind": "window", "area": wn["w"] * wn["h"], "tilt": 90, "azimuth": walls[wn["wall"]][1], "wall": wn["wall"], "geom": wn, "frame": 0.0})
    hs, cs, vent = [20.0] * 24, [27.0] * 24, [0.0] * 24          # hour of day 0..23, hour starting
    if base in ("640", "940"):
        hs = [10.0] * 7 + [15.0] + [20.0] * 15 + [10.0]          # setback 23:00 to 07:00, the 07:00 to 08:00 hour at 15 °C
    if base in ("650", "950"):
        hs = [-100.0] * 24
        cs = [100.0 if (k < 7 or k >= 18) else 27.0 for k in range(24)]
        vent = [1700.0 if (k < 7 or k >= 18) else 0.0 for k in range(24)]   # m3/h at site air density, 18:00 to 07:00
    return {"case": case, "heavy": heavy, "floorArea": AF, "volume": AF * H, "dims": [L, W, H], "elements": el,
            "gains": {"total": 200.0, "radFrac": 0.6}, "ach_inf": 0.5, "albedo": 0.2,
            "heatSP": hs, "coolSP": cs, "ventM3h": vent, "ideal": not case.endswith("FF"), "glass": GLASS}


CASES = ["600", "610", "620", "640", "650", "900", "910", "920", "940", "950", "600FF", "900FF", "650FF", "950FF"]
CLIMATE_CASES = ["600", "620", "650", "900", "920", "950", "600FF", "900FF"]   # the set run in all 14 climates

if __name__ == "__main__":
    os.makedirs(os.path.join(WORK, "thermal_engine"), exist_ok=True)
    json.dump({"cases": {c: zone(c) for c in CASES}, "climate_cases": CLIMATE_CASES}, open(os.path.join(WORK, "thermal_engine", "cases.json"), "w"))
    print("wrote", len(CASES), "cases")
