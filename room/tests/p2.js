const H = require('./h16.js'); const { S, DS, wx } = H;
for (const [city, use] of [['Mannheim', 'office'], ['Mannheim', 'dwelling'], ['Bologna', 'school']]) {
  const W = wx(city); const ctx = S.context(W, use, {}); ctx.coolHi = Float32Array.from(ctx.BN.B.na_II.hi);
  console.log('==', city, use, 'dims', ctx.use.dims, 'occ', ctx.use.occ, ctx.use.weekdays);
  const base = { scenario: 'cellular', azimuth: 180, wwr: 0.5, opaque: 'u15', uglass: 0.8, gglass: 0.45, mass: 'medium', fixed: 'none', shading: 0, dayAch: 0, nightAch: 0, fans: 0, supply: 'outdoor', roof: 'standard' };
  const ops = S.openings(ctx, base); console.log('openings', JSON.stringify(ops), 'tilt m2', S.effArea(ops, 1).toFixed(3), 'open m2', S.effArea(ops, 2).toFixed(2), 'ach@3K tilt', (S.ventFlow(ops, 1, 3) / (ctx.use.dims[0]*ctx.use.dims[1]*ctx.use.dims[2])).toFixed(2), 'open', (S.ventFlow(ops, 2, 3) / (ctx.use.dims[0]*ctx.use.dims[1]*ctx.use.dims[2])).toFixed(2));
  for (const v of [[0,0,0],[1,0,0],[2,0,0],[2,1,0],[2,1,1],[2,1,2],[2,5,2]]) {
    const c = Object.assign({}, base, { dayAch: v[0], nightAch: v[1], shading: v[2] });
    const r = S.runCombo(ctx, c, 'heat').heat, k = S.runCombo(ctx, c, 'cool').cool, d = S.runDin(ctx, c);
    console.log(JSON.stringify(v), 'NA_II', Math.round(r.na_II), 'qh', r.qh.toFixed(1), 'qc', k.qc.toFixed(1), 'DIN', Math.round(d.din_ueg ?? d.ueg ?? JSON.stringify(d).slice(0,80)));
  }
  const t0 = Date.now(); const j = DS.job(ctx, { scenario: 'cellular', wwr: 0.5, fixed: 'none' }); const s = j[4], tk = Object.keys(DS.TV)[1];
  for (const k of [tk, tk + '|interior', tk + '|exterior']) { const r = s[k]; console.log(k, 'udi', r.udi, 'lo', r.udiLo, 'hi', r.udiHi, 'band', r.band, 'light', r.light, 'A1', r.A1, 'S', r.S); }
  console.log('job ms', Date.now() - t0);
}
