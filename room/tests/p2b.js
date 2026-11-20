const H = require('./h16.js'); const { S, DS, wx } = H;
const W = wx('Mannheim'); const ctx = S.context(W, 'office', {}); ctx.coolHi = Float32Array.from(ctx.BN.B.na_II.hi);
const c = { scenario: 'cellular', azimuth: 180, wwr: 0.5, opaque: 'u15', uglass: 0.8, gglass: 0.45, mass: 'medium', fixed: 'none', shading: 2, dayAch: process.env.OLD ? 3 : 2, nightAch: process.env.OLD ? 2 : 1, fans: 0, supply: 'outdoor', roof: 'standard' };
const r = S.runCombo(ctx, c, 'heat').heat, k = S.runCombo(ctx, c, 'cool').cool;
console.log('na_II', JSON.stringify(r.na_II), 'qh', r.qh.toFixed(1), 'qc', k.qc.toFixed(1), 'dayOpen', r.dayOpen, 'nightOpen', r.nightOpen, 'ventHeat', r.ventHeat);
let t0 = Date.now(); DS.job(ctx, { scenario: 'cellular', wwr: 0.5, fixed: 'none' }); console.log('job ms', Date.now() - t0);
