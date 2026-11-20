// v16 phase 3.2 check: full Pareto local search (old) against the targeted search (new), same seed, same daylight
const H = require('./h16.js'); const { S, DS, FS, SC, wx } = H;
const [city, use, a] = [process.argv[2], process.argv[3], +process.argv[4]], noC = city === 'Dubai', germany = city === 'Mannheim';
const ctx = S.context(wx(city), use, {}); ctx.coolHi = Float32Array.from(ctx.BN.B.na_II.hi);
let t0 = Date.now(); const tab = {};
for (const w of S.PARAMS.wwr) for (const f of S.PARAMS.fixed) tab[w + '|' + f] = DS.job(ctx, { scenario: 'cellular', wwr: w, fixed: f, azs: [a] })[a];
console.log(city, use, 'az', S.PARAMS.azimuth[a], '| daylight', Math.round((Date.now() - t0) / 1000), 's (one orientation)');
const PRI = [[1, 1, 1], [4, 1, 1], [1, 4, 1], [1, 1, 4], [5, 5, 2], [5, 2, 5], [2, 5, 5]].map((w) => w.map((x) => x / (w[0] + w[1] + w[2])));
const E0 = use === 'dwelling' ? [6, 15] : [10, 25], nOcc = ctx.occ.reduce((s, x) => s + x, 0), dims = ctx.use.dims;
const rk = { pri: PRI, target: E0[0], upper: E0[1], dlT: 0.4, maxOut: 5, dinLim: germany ? (use === 'dwelling' ? 1200 : 500) : null, region: 'C', noC, nOcc, model: 'na', dims, cscen: 'cellular', grid: 0.25, years: 50 };
const levels = { mass: ['light', 'medium', 'heavy'], nightAch: [0, 1] };
const base = { limit: 500, target: rk.target, upper: rk.upper, dlT: rk.dlT, maxOut: rk.maxOut, dinLim: rk.dinLim, noC };
const wMain = noC ? [0.5, 0, 0.5] : PRI[0];
const carb = (r) => S.carbonOf(dims, 'cellular', r.dz).total + r.m.E * 0.25 * 50;
const SHARED = FS.SHARED, PKM = ['wwr', 'fixed', 'uglass', 'gglass', 'shading', 'dayAch', 'nightAch', 'fans', 'mass', 'opaque'];
const nd = (x, y) => PKM.reduce((n, p) => n + (p === 'wwr' ? (Math.abs(x.dz.wwr - y.dz.wwr) >= 0.1 ? 1 : 0) : x.dz[p] !== y.dz[p] ? 1 : 0), 0);
function pick(rows, w) { const o = Object.assign({}, base, { w }); let b = null, bq = -1; const qs = rows.map((r) => { const q = SC.score(r.m, o).q; if (q > bq) { bq = q; b = r; } return q; });
  let c = b; rows.forEach((r, i) => { if (bq - qs[i] < 0.01 && Math.floor(qs[i]) === Math.floor(bq) && carb(r) < carb(c) - 1e-9) c = r; }); return c; }
function result(rows) {
  const rec = pick(rows, wMain), o = Object.assign({}, base, { w: wMain }), meet = rows.filter((r) => SC.meets(r.m, o).all);
  const cand = meet.filter((r) => r !== rec && SHARED.every((p) => r.dz[p] === rec.dz[p])).sort((x, y) => SC.score(y.m, o).q - SC.score(x.m, o).q), P = [];
  for (const r of cand) { if (P.length >= 5) break; if (nd(r, rec) >= 2 && P.every((p) => nd(r, p) >= 2)) P.push(r); }
  const low = meet.length ? meet.reduce((b, r) => carb(r) < carb(b) ? r : b, meet[0]) : null;
  return { rec, pri: PRI.map((w) => pick(rows, w)), P, low, nMeet: meet.length, q: SC.score(rec.m, o).q };
}
const K = (r) => r ? FS.keyOf(r.dz) : '-';
const out = {};
for (const mode of ['full', 'pruned']) { t0 = Date.now();
  const R = FS.search(ctx, { scenario: 'cellular', azimuth: S.PARAMS.azimuth[a], tab, key: 'na_II', fanOk: false, limit: 500, copH: 3, copC: 3.5, mode: 'cool', dlm: 'UDI', floor: 'en', levels, nRandom: 60, rounds: 4, perRound: 30, cap: 5000, seed: 11 + a, rk: Object.assign({}, rk, { prune: mode === 'full' ? null : 1 }) });
  const ev = FS.evaluator ? null : null;
  // rebuild metrics as the search evaluator does (same functions)
  const rows = R.rows.map((x) => { const d = tab[x.dz.wwr + '|' + x.dz.fixed][DS.dlKey(ctx, x.dz)], q = SC.daylight(d, 'UDI', 'en'), lE = d.light || 0;
    const h = x.heat.na_II, E = x.cool.qh / 3 + x.cool.qc / 3.5 + (x.cool.fanE || 0) + lE;
    return { dz: x.dz, m: { A1: q.A1, S: q.S, C: h[0], E, H: 100 * h[3] / nOcc, din: germany ? x.heat.din_C : null } }; });
  out[mode] = Object.assign(result(rows), { n: rows.length, secs: Math.round((Date.now() - t0) / 1000), complete: R.complete });
  const r = out[mode]; console.log(`${mode}: ${r.n} designs, ${r.secs} s | recommended q ${r.q.toFixed(4)} ${K(r.rec)} | meeting every target ${r.nMeet}`); }
const f = out.full, g = out.pruned, same = (x, y) => K(x) === K(y);
console.log('recommended same:', same(f.rec, g.rec));
console.log('priority picks same:', f.pri.map((x, i) => same(x, g.pri[i]) ? 'yes' : 'NO').join(' '));
console.log('lowest carbon same:', same(f.low, g.low), '|', f.low ? Math.round(carb(f.low)) : '-', 'vs', g.low ? Math.round(carb(g.low)) : '-', 'kg/m²');
console.log('packages full:', f.P.map(K).join(' ; '));
console.log('packages targ:', g.P.map(K).join(' ; '));
console.log('packages in common:', f.P.filter((x) => g.P.some((y) => same(x, y))).length, 'of', f.P.length, '| targeted', g.P.length);
f.pri.forEach((x, i) => { if (!same(x, g.pri[i])) { const o = Object.assign({}, base, { w: PRI[i] }); console.log(`  priority ${i}: full q ${SC.score(x.m, o).q.toFixed(4)} ${K(x)} | targeted q ${SC.score(g.pri[i].m, o).q.toFixed(4)} ${K(g.pri[i])}`); } });
