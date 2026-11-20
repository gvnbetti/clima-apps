const H = require('./h16.js'); const { S, DS, wx } = H; const DL = H.DL || global.Daylight;
const ctx = S.context(wx('Mannheim'), 'office', {}); ctx.coolHi = Float32Array.from(ctx.BN.B.na_II.hi);
const d = { scenario: 'cellular', azimuth: 180, wwr: 0.5, opaque: 'u15', uglass: 0.8, gglass: 0.45, mass: 'medium', fixed: 'none', shading: 2, dayAch: 2, nightAch: 1, fans: 0, supply: 'outdoor', roof: 'standard' };
let t = Date.now(); for (let i = 0; i < 10; i++) S.simulate(ctx, d, 'heat', false); console.log('simulate heat year ms', (Date.now() - t) / 10);
t = Date.now(); for (let i = 0; i < 5; i++) S.runCombo(ctx, d, 'heat'); console.log('runCombo heat ms', (Date.now() - t) / 5);
t = Date.now(); for (let i = 0; i < 5; i++) S.runCombo(ctx, d, 'cool'); console.log('runCombo cool ms', (Date.now() - t) / 5);
t = Date.now(); for (let i = 0; i < 5; i++) S.runDin(ctx, d); console.log('runDin ms', (Date.now() - t) / 5);
t = Date.now(); for (let i = 0; i < 4; i++) S.simulate(ctx, d, 'heat', true); console.log('simulate keepHourly ms', (Date.now() - t) / 4);
// daylight job pieces
const orig = S.simulate; let simT = 0, simN = 0; S.simulate = function () { const t0 = Date.now(); const r = orig.apply(this, arguments); simT += Date.now() - t0; simN++; return r; };
const origR = DS.readings; 
t = Date.now(); DS.job(ctx, { scenario: 'cellular', wwr: 0.5, fixed: 'none' }); const tot = Date.now() - t;
console.log('daylight job ms', tot, '| reference sims', simN, 'ms', simT);
S.simulate = orig;
