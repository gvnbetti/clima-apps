"""Builds a bundled weather record (the JSON object used in Room Clima's wxdata block and Micro Clima's) from an EPW file,
and optionally replaces the record of the same name in one or more files.
Encoding: each hourly series as little-endian int16, base64. t, td, ws x10; ir, dni, dhi x1; pressure as (p - 60000) / 2.
Usage: python3 wxrecord.py <epw> <name> <source> <region or -> [file to patch ...]"""
import sys, json, base64, struct, re, pathlib

epw, name, source, region = sys.argv[1:5]
targets = sys.argv[5:]
L = pathlib.Path(epw).read_text(encoding='latin-1').splitlines()
h = L[0].split(',')
rows = [r.split(',') for r in L[8:] if r.strip()]
if len(rows) == 8784:
    rows = [r for r in rows if not (int(r[1]) == 2 and int(r[2]) == 29)]
assert len(rows) == 8760, len(rows)

def col(j, miss):
    v = [float(r[j]) for r in rows]
    bad = [i for i, x in enumerate(v) if x >= miss]
    assert not bad, f'column {j}: {len(bad)} missing values'
    return v

def enc(vals, scale, off):
    q = [max(-32768, min(32767, round((x + off) * scale))) for x in vals]
    return base64.b64encode(struct.pack('<%dh' % len(q), *q)).decode()

rec = {'name': name, 'cc': h[3], 'koppen': None, 'source': source, 'region': None if region == '-' else region,
       'lat': float(h[6]), 'lon': float(h[7]), 'tz': float(h[8]), 'elev': float(h[9]), 'file': pathlib.Path(epw).name,
       't': enc(col(6, 99.9), 10, 0), 'td': enc(col(7, 99.9), 10, 0), 'p': enc(col(9, 999999), 0.5, -60000),
       'ir': enc(col(12, 9999), 1, 0), 'dni': enc(col(14, 9999), 1, 0), 'dhi': enc(col(15, 9999), 1, 0), 'ws': enc(col(21, 999), 10, 0)}

for f in targets:
    p = pathlib.Path(f); s = p.read_text()
    m = re.search(r'\{"name":"' + re.escape(name) + r'".*?"ws":"[A-Za-z0-9+/=]*"\}', s)
    assert m, f'no record named {name} in {f}'
    old = json.loads(m.group(0))
    rec['koppen'] = rec['koppen'] or old.get('koppen')
    new = json.dumps(rec, separators=(',', ':'))
    p.write_text(s[:m.start()] + new + s[m.end():])
    print(f'{f}: replaced {name} ({old["source"]} -> {source})')
if not targets:
    print(json.dumps(rec, separators=(',', ':')))
