const H = require('./h16.js'); const { S, C, wx } = H;
const W = wx('Mannheim'); const ctx = S.context(W, 'office', {}); ctx.coolHi = Float32Array.from(ctx.BN.B.na_II.hi);
const c = { scenario: 'cellular', azimuth: 180, wwr: 0.5, opaque: 'u15', uglass: 0.8, gglass: 0.45, mass: 'medium', fixed: 'none', shading: 2, dayAch: 3, nightAch: 2, fans: 0, supply: 'outdoor', roof: 'standard' };
const t0 = Date.now(); const r = S.runCombo(ctx, c, 'heat').heat, k = S.runCombo(ctx, c, 'cool').cool, d = S.runDin(ctx, c);
console.log('heat run: NA II', r.na_II, 'qh', r.qh, '| cool: qc', k.qc, 'cPeak', k.cPeak, 'cMax', k.cMax, 'ePeak', k.ePeak, '| DIN', d, (Date.now() - t0) + ' ms');
