// Outdoor comfort (Micro Clima), verification step 1: values of the current engine (script "engine" in micro/index.html)
// for comparison with reference implementations in verify.py: sun position and sun on walls (pvlib), UTCI and SolarCal
// (pythermalcomfort), ground conduction (exact solution), time step.
const fs = require('fs'), path = require('path'), { WORK } = require('../lib/paths.js'), H = require('../lib/app.js'), ROOT = path.join(__dirname, '..', '..');
const html = fs.readFileSync(path.join(ROOT, 'micro/index.html'), 'utf8'), ef = path.join(WORK, 'micro_engine.js');
fs.writeFileSync(ef, html.match(/<script id="engine">([\s\S]*?)<\/script>/)[1]); const MC = require(ef);
const OUT = path.join(WORK, 'outdoor'); fs.mkdirSync(OUT, { recursive: true });
const wxOf = (name) => { const w = H.wx(name); return { name, lat: w.lat, lon: w.lon, tz: w.tz, t: w.t, td: w.td, ir: w.ir, dni: w.dni, dhi: w.dhi, ws: w.ws }; };
const res = { sun: {}, utci: [], solar: [], cond: {}, step: {} };
// 1. sun position and sun on four walls, the six bundled climates
for (const rec of H.WX) {
  const wx = wxOf(rec.name), c = MC.prepare(wx, { urban: false }), W = MC.walls(c, [0, 90, 180, 270]);
  res.sun[rec.name] = { lat: wx.lat, lon: wx.lon, tz: wx.tz, el: Array.from(c.el, (x) => +x.toFixed(4)), az: Array.from(c.az, (x) => +x.toFixed(4)), dni: Array.from(wx.dni), dhi: Array.from(wx.dhi), ghi: Array.from(c.ghi, (x) => +x.toFixed(2)),
    wall: Object.fromEntries([0, 90, 180, 270].map((f) => [f, Array.from(W[f].irr, (x) => +x.toFixed(2))])) };
}
// 2. UTCI over a grid of conditions inside the polynomial's range
let s = 12345; const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
for (let k = 0; k < 3000; k++) { const ta = -45 + 95 * rnd(), tr = ta + (-25 + 95 * rnd()), v = 0.5 + 16.5 * rnd(), rh = 5 + 95 * rnd(); res.utci.push([ta, tr, v, rh, MC.utciRaw(ta, tr, v, rh)]); }
// 3. SolarCal: direct sun on the body (diffuse and reflected terms are a closed formula, checked by hand in the report)
for (const el of [5, 15, 30, 45, 60, 75, 90]) for (const dir of [100, 400, 800]) for (const seated of [false, true]) res.solar.push([el, dir, seated, MC.solarDMRT(el, dir, 0, 0, seated)]);
// 4. ground conduction: periodic air temperature, convective surface, semi-infinite solid (no sun, no longwave)
const n = 8760, k = 0.75, rc = 1.94e6, h = 15;
for (const [label, P] of [['daily', 24], ['annual', 8760]]) {
  const w = 2 * Math.PI / P, ta = new Float32Array(n), z = new Float32Array(n), hc = new Float32Array(n).fill(h);
  for (let i = 0; i < n; i++) ta[i] = 20 + 10 * Math.sin(w * (i + 0.5));
  const lay = (dz) => dz.map((d) => ({ dz: d, k, rc }));
  res.cond[label] = { k, rc, h, P, ta: Array.from(ta),
    default: Array.from(MC.surfaceSim(lay(MC.DZ), 0, 0, { kabs: z, lin: z, ta, hc, ea: z }, 20, 1e9, 2)),
    fine: Array.from(MC.surfaceSim(lay(MC.DZ.flatMap((d) => [d / 2, d / 2])), 0, 0, { kabs: z, lin: z, ta, hc, ea: z }, 20, 1e9, 12)) };
}
// 5. time step: ground temperature and UTCI with 2 and 12 steps per hour, open field, three grounds, two climates
for (const name of ['Mannheim', 'Phoenix']) {
  const wx = wxOf(name), c = MC.prepare(wx, { urban: false }), Wl = MC.walls(c, []), leaf = MC.seasonMask(3, 9, wx.lat), o = { leaf, screen: leaf.map((x) => 1 - x) };
  for (const g of [0, 3, 6]) { const a = MC.scenario(c, Wl, { s: 0, g, w: 0, e: 0 }, Object.assign({ sub: 2 }, o)), b = MC.scenario(c, Wl, { s: 0, g, w: 0, e: 0 }, Object.assign({ sub: 12 }, o));
    res.step[`${name}|${MC.GROUND[g].name}`] = { tg2: Array.from(a.tg), tg12: Array.from(b.tg), u2: Array.from(a.utci), u12: Array.from(b.utci) }; }
}
res.DZ = MC.DZ; fs.writeFileSync(path.join(OUT, 'verify.json'), JSON.stringify(res)); console.log('written');
