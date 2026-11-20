// Outdoor comfort, Ladybug comparison step 1: the current Micro Clima engine on a scenario matrix (five shadings, seven
// grounds, open field and courtyard H/W 1, exposed), and the inputs Ladybug needs to evaluate the same scenarios with its
// own SolarCal and UTCI: wind at 10 m, radiant temperature of the surroundings, sunlit share, sky view.
// Usage: node lb_dump.js <city>   (one of the bundled climates). Output: WORK/outdoor/lb_<tag>.bin and _meta.json
const fs = require('fs'), path = require('path'), { WORK } = require('../lib/paths.js'), H = require('../lib/app.js');
const MC = require(path.join(WORK, 'micro_engine.js'));   // written by verify_dump.js
const name = process.argv[2], tag = name.replace(/\W/g, ''), OUT = path.join(WORK, 'outdoor'); fs.mkdirSync(OUT, { recursive: true });
const w = H.wx(name), wx = { name, lat: w.lat, lon: w.lon, tz: w.tz, t: w.t, td: w.td, ir: w.ir, dni: w.dni, dhi: w.dhi, ws: w.ws };
const ctx = { urban: true, svf: 0.6, fveg: 0.2, canopy: 10, leafFrom: 3, leafTo: 9 };
const E_IDX = [0, MC.ENCL.findIndex((e) => e.id === 'court1')];
const c = MC.prepare(wx, ctx), vals = { s: [0, 1, 2, 3, 4], g: [0, 1, 2, 3, 4, 5, 6], w: [0], e: E_IDX };
const Wl = MC.walls(c, MC.wallFacesFor(vals.e)), leaf = MC.seasonMask(3, 9, wx.lat), opt = { leaf, screen: leaf.map((x) => 1 - x) };
const n = 8760, K0 = 273.15, P = MC.PAR, hcOf = (u) => 5.7 + 3.8 * u;
const hourly = { ta: c.ta, rh: c.rh, lsky: c.lsky, dhi: c.dhi, dni: Float64Array.from(c.dni, (v, i) => (c.el[i] > 0 ? v : 0)), el: c.el };
const meta = { climate: name, vals, scen: [] }, bufs = [];
for (const s of vals.s) for (const g of vals.g) for (const e of vals.e) {
  const S = MC.SHADING[s], G = MC.GROUND[g], Wd = MC.WIND[0], E = MC.ENCL[e], x = MC.scenario(c, Wl, { s, g, w: 0, e }, opt);
  const v10 = new Float32Array(n), tsrf = new Float32Array(n), fract = new Float32Array(n), skyx = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const m = MC.MONTH[i], el = c.el[i], ta = c.ta[i];
    let cov = S.c || 0, tb = S.tb == null ? 1 : S.tb; if (S.seasonal === 'leaf' && !opt.leaf[m]) tb = S.tbOff; if (S.seasonal === 'deploy' && !opt.leaf[m]) { cov = 0; tb = 1; }
    const lit = MC.sunlitEnc(E, el, c.az[i]), fEdge = cov > 0 ? Math.max(0, Math.min(1, (el - P.canopyLo) / (P.canopyHi - P.canopyLo))) : 0, tau = 1 - fEdge * (1 - tb);
    fract[i] = lit ? tau : 0; skyx[i] = E.svf * (1 - cov);
    const vC = c.ws[i] * Wd.f * E.wf;
    let tcK = ta + K0;   // canopy temperature as in the engine
    if (S.built && cov > 0) tcK += P.canAbs * c.ghi[i] / (2 * (hcOf(P.hcHeight * Math.max(0.5, vC)) + 5.5));
    else if (!S.built && cov > 0 && tb === S.tb) tcK = MC.leafTemp(ta, c.ghi[i], c.lsky[i], c.rh[i], 0.88 * vC, el > 0) + K0;
    let tw4 = 0; E.walls.forEach((q) => { const tk = Wl[q.face].ts[i] + K0; tw4 += q.f * tk ** 4; });
    const tgK = x.tg[i] / 10 + K0, up = E.svf * cov * tcK ** 4 + (1 - E.svf) * tw4, wUp = E.svf * cov + (1 - E.svf);
    tsrf[i] = Math.pow((0.5 * tgK ** 4 + 0.5 * up) / (0.5 + 0.5 * wUp), 0.25) - K0;   // radiant temperature of everything but the sky
    v10[i] = Math.max(0.5, Math.min(17, c.ws[i] * Wd.f * E.wf));
  }
  meta.scen.push({ s, g, e, alb: G.alb });
  bufs.push(v10, tsrf, fract, skyx, Float32Array.from(x.utci, (v) => v / 10), Float32Array.from(x.tmrt, (v) => v / 10));
}
meta.perScen = ['v10', 'tsrf', 'fract', 'skyx', 'utci', 'tmrt']; meta.hourly = Object.keys(hourly);
fs.writeFileSync(path.join(OUT, `lb_${tag}_meta.json`), JSON.stringify(meta));
const all = [...Object.values(hourly).map((a) => Float32Array.from(a)), ...bufs], out = Buffer.alloc(all.length * n * 4);
all.forEach((a, k) => Buffer.from(a.buffer).copy(out, k * n * 4)); fs.writeFileSync(path.join(OUT, `lb_${tag}.bin`), out);
console.log(tag, meta.scen.length, 'scenarios');
