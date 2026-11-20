const H = require('./h16.js'), CM = require('' + require('path').join(__dirname, '../src/') + 'climamods.js'), fs = require('fs'), vm = require('vm');
const sb = { window: {} }; vm.createContext(sb); for (const f of ['future.js', 'regions.js']) vm.runInContext(fs.readFileSync('' + require('path').join(__dirname, '../src/') + 'data/' + f, 'utf8'), sb);
const { S } = H; const c = { scenario: 'cellular', azimuth: 180, wwr: 0.5, opaque: 'u15', uglass: 0.8, gglass: 0.45, mass: 'medium', fixed: 'none', shading: 2, dayAch: 3, nightAch: 2, fans: 0, supply: 'outdoor', roof: 'standard' };
for (const city of ['Mannheim', 'Bologna']) { const w0 = H.wx(city); const yr = city === 'Bologna' ? 2011 : 2010;
  for (const [level, uhi] of [[0, null], [2, null], [0, { svf: 0.6, fveg: 0.2 }], [2, { svf: 0.6, fveg: 0.2 }], [3, null]]) {
    let w = w0; if (level || uhi) { const rh = Float64Array.from(w0.t, (x, i) => Math.max(1, Math.min(100, 100 * CM.pws(Math.min(w0.td[i], x)) / CM.pws(x))));
      const P = CM.prepWeather({ dbt: w0.t, dpt: w0.td, rh, hir: w0.ir, prec: new Float64Array(8760), dni: w0.dni, dhi: w0.dhi, ws: w0.ws, meta: { lat: w0.lat, lon: w0.lon, tz: w0.tz } }, { level, uhi, year: yr, future: sb.window.CLIMA_FUTURE, regions: sb.window.CLIMA_REGIONS }).W;
      w = Object.assign({}, w0, { t: P.dbt, td: P.dpt, ir: P.hir }); }
    const ctx = S.context(w, 'office', {}); ctx.coolHi = Float32Array.from(ctx.BN.B.na_II.hi);
    const h = S.runCombo(ctx, c, 'heat').heat, k = S.runCombo(ctx, c, 'cool').cool, d = S.runDin(ctx, c);
    console.log(`${city.padEnd(9)} ${(level ? '+' + level + ' °C' : 'present').padEnd(8)} ${uhi ? 'urban' : '     '} | DIN check region C ${String(Math.round(d.din_C)).padStart(5)} K·h/a | German annex II ${String(Math.round(h.na_II[0])).padStart(5)} | heating ${h.qh} | cooling ${k.qc} kWh/m2a`); } }
