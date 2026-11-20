"""Future climate, step 3: the IPCC reference region of a weather file. The apps' polygons (macro/regions.js) and their
point-in-polygon test against the official region file of the Atlas (IPCC-WGI-reference-regions-v4.geojson, shapely),
for every station of the Clima Map catalogue. Land regions are preferred where a point lies in a land and an ocean region,
as the apps do. Writes regions_check.md."""
import json, os, sys, subprocess, base64, gzip
from shapely.geometry import shape, Point
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from paths import WORK
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, "..", "..")
s = open(os.path.join(ROOT, "macro", "data", "stations.js")).read(); sites = json.loads(gzip.decompress(base64.b64decode(s[s.index('"') + 1:s.rindex('"')])))["sites"]
pts = sorted({(round(x[0], 3), round(x[1], 3)) for x in sites if abs(x[0]) <= 90 and abs(x[1]) <= 180})
json.dump(pts, open(os.path.join(WORK, "future", "points.json"), "w"))
app = json.loads(subprocess.check_output(["node", "-e", f"""
global.window={{}}; require('{ROOT}/macro/regions.js'); const C=require('{ROOT}/macro/core.js'), P=require('{WORK}/future/points.json');
console.log(JSON.stringify(P.map(([la,lo])=>{{const r=C.regionOf(la,lo,window.CLIMA_REGIONS);return r?r.id:null;}})))"""]))
G = json.load(open(os.path.join(WORK, "atlas", "reference-regions", "IPCC-WGI-reference-regions-v4.geojson")))
REG = [(f["properties"]["Acronym"], f["properties"]["Type"], shape(f["geometry"])) for f in G["features"]]
def official(la, lo):
    hits = [(a, t) for a, t, g in REG if g.covers(Point(lo, la))]
    land = [a for a, t in hits if not t.startswith("Ocean")]
    return land[0] if land else (hits[0][0] if hits else None)
ref = [official(la, lo) for la, lo in pts]
same = sum(a == b for a, b in zip(app, ref)); diff = [(p, a, b) for p, a, b in zip(pts, app, ref) if a != b]
md = ["# Future climate: region of a weather file", "", f"{len(pts):,} station positions of the Clima Map catalogue.", "",
      f"- Same region as the official polygons: {same:,} ({100 * same / len(pts):.2f}%)", f"- Different: {len(diff)}", ""]
if diff:
    md += ["| Latitude | Longitude | App | Official |", "|---|---|---|---|"] + [f"| {p[0]} | {p[1]} | {a} | {b} |" for p, a, b in diff[:40]]
open(os.path.join(HERE, "regions_check.md"), "w").write("\n".join(md) + "\n"); print("\n".join(md[:8]))
