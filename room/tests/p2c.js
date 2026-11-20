const H = require('./h16.js'); const { S, wx } = H;
for (const use of ['office','dwelling']) { const ctx = S.context(wx('Mannheim'), use, {}); ctx.coolHi = Float32Array.from(ctx.BN.B.na_II.hi);
for (const sh of [0,1,2]) { const c = { scenario: 'cellular', azimuth: 180, wwr: 0.5, opaque: 'u15', uglass: 0.8, gglass: 0.45, mass: 'medium', fixed: 'none', shading: sh, dayAch: 2, nightAch: 1, fans: 0, supply: 'outdoor', roof: 'standard' };
const r = S.runCombo(ctx, c, 'heat').heat, k = S.runCombo(ctx, c, 'cool').cool; console.log(use, 'shading', sh, 'NA_II Kh', Math.round(r.na_II[0]), 'qh', r.qh.toFixed(1), 'qc', k.qc.toFixed(1)); } }
