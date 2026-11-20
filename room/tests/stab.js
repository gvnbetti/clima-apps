// stability of the recommendation: same facade searched with different seeds; ranking as the page (targets first)
const H = require('./h16.js'); const { S, DS, FS, SC, wx } = H;
const city = process.argv[2] || 'Mannheim', use = process.argv[3] || 'office', a = +(process.argv[4] || 4), seeds = (process.argv[5] || '11,57,203').split(',').map(Number);
const ctx = S.context(wx(city), use, {}); ctx.coolHi = Float32Array.from(ctx.BN.B.na_II.hi);
const wwr = [0.35, 0.5, 0.65], fixed = ['none', 'oh05', 'box05'], tab = {}; let t0 = Date.now();
for (const w of wwr) for (const f of fixed) tab[w + '|' + f] = DS.job(ctx, { scenario: 'cellular', wwr: w, fixed: f })[a];
console.log('daylight', Math.round((Date.now() - t0) / 1000), 's');
const levels = { wwr, fixed, nightAch: [0, 1], fans: [0], dayAch: [0, 1, 2], mass: ['light', 'medium', 'heavy'] };
const nOcc = ctx.occ.reduce((s, x) => s + x, 0), lim = 500, o = { w: [1/3, 1/3, 1/3], limit: lim, target: 10, upper: 25, dlT: 0.4, dinLim: 500, maxOut: 5 };
const res = seeds.map((seed) => { t0 = Date.now();
  const r = FS.search(ctx, { scenario: 'cellular', azimuth: S.PARAMS.azimuth[a], tab, key: 'na_II', fanOk: false, limit: lim, copH: 3, copC: 3.5, mode: 'cool', dlm: 'UDI', floor: 'en', levels, nRandom: 60, rounds: 4, perRound: 30, cap: 5000, seed });
  const rows = r.rows.map((x) => { const d = tab[x.dz.wwr + '|' + x.dz.fixed][DS.dlKey(ctx, x.dz)], q = SC.daylight(d, 'UDI', 'en');
    const lightE = d.light || 0, E = x.cool.qh / 3 + x.cool.qc / 3.5 + (x.cool.fanE || 0) + lightE, h = x.heat.na_II;
    const m = { A1: q.A1, S: q.S, C: h[0], E, H: 100 * h[3] / nOcc, din: x.heat.din_C }; const s = SC.score(m, o); return { dz: x.dz, m, s, k: FS.keyOf(x.dz) }; });
  rows.sort((x, y) => y.s.q - x.s.q);
  return { seed, n: rows.length, best: rows[0], rows, secs: Math.round((Date.now() - t0) / 1000) }; });
const ref = res[0];
res.forEach((R) => { const b = R.best; console.log(`seed ${R.seed}: ${R.n} designs, ${R.secs} s | q ${b.s.q.toFixed(4)} meets ${b.s.t.all} | ${b.k} | UDI ${(b.m.S*100).toFixed(1)} C ${b.m.C.toFixed(0)} H ${b.m.H.toFixed(1)}% E ${b.m.E.toFixed(1)}`);
  const inRef = ref.rows.find((x) => x.k === b.k); if (R !== ref) console.log(`   same design as seed ${ref.seed}: ${b.k === ref.best.k}; this design in seed ${ref.seed}'s archive: ${!!inRef}${inRef ? ' rank ' + (ref.rows.indexOf(inRef) + 1) : ''}; q gap ${(ref.best.s.q - b.s.q).toFixed(4)}`); });
