// Room Clima's shared modifiers against Macro Clima's own code on the same EPW files
const fs = require('fs'), vm = require('vm');
const sb = { console, Math, Float32Array, Float64Array, Uint8Array, Uint16Array, Int16Array, JSON, Object, Array, Number, String, Error, Set, Map }; sb.window = sb; vm.createContext(sb);
for (const f of ['core.js', 'future.js', 'regions.js']) vm.runInContext(fs.readFileSync('' + require('path').join(__dirname, '../../macro/') + '' + f, 'utf8'), sb);
const MC = sb.Clima || sb.ClimaCore || Object.values(sb).find((v) => v && v.morphWeather && v.parseEPW);
const CM = require('' + require('path').join(__dirname, '../src/') + 'climamods.js');
const F = sb.CLIMA_FUTURE, R = sb.CLIMA_REGIONS;
let worst = 0;
for (const [file, label] of [['/home/claude/rdg/epw/Berlin-Tegel.epw', 'Berlin-Tegel TMYx'], ['/home/claude/rdg/epw/Rome.epw', 'Rome TMYx']]) {
  const text = fs.readFileSync(file, 'utf8'), W0 = MC.parseEPW(text, file);
  // Room Clima's reading of the same file: the EPW columns it uses
  const rows = text.split(/\r?\n/).slice(8).filter((l) => l.trim()).map((l) => l.split(',')).slice(0, 8760), col = (j) => Float64Array.from(rows, (r) => +r[j]);
  const room = { dbt: col(6), dpt: col(7), rh: col(8), hir: col(12), prec: new Float64Array(8760), dni: col(14), dhi: col(15), ws: col(21), meta: { lat: W0.meta.lat, lon: W0.meta.lon, tz: W0.meta.tz } };
  const yr = CM.fileYears(file.split('/').pop(), W0.meta.comments);
  for (const level of [0, 1.5, 2, 3]) for (const uhi of [null, { svf: 0.8, fveg: 0.35 }, { svf: 0.4, fveg: 0.1 }]) {
    if (!level && !uhi) continue;
    // Macro Clima's prepWeather, as in its app.js
    let W = W0; if (level) { const reg = MC.regionOf(W0.meta.lat, W0.meta.lon, R), d = MC.futureDelta(F, reg.id, level, yr.year), m = MC.morphWeather(W0, d); W = Object.assign({}, W0, { dbt: m.dbt, dpt: m.dpt, hir: m.hir }); }
    if (uhi) { const u = MC.urbanHeatIsland(W, MC.solarArrays(W.meta.lat, W.meta.lon, W.meta.tz), uhi.svf, uhi.fveg); W = Object.assign({}, W, { dbt: u.dbt, rh: u.rh }); }
    const P = CM.prepWeather(room, { level, uhi, year: yr.year, future: F, regions: R }).W;
    const d = (a, b) => { let m = 0; for (let i = 0; i < 8760; i++) m = Math.max(m, Math.abs(a[i] - b[i])); return m; };
    const e = [d(W.dbt, P.dbt), d(W.dpt, P.dpt), d(W.hir, P.hir)]; worst = Math.max(worst, ...e);
    const dm = (P.dbt.reduce((s, x) => s + x, 0) - room.dbt.reduce((s, x) => s + x, 0)) / 8760;
    console.log(`${label.padEnd(18)} level ${String(level).padEnd(3)} ${uhi ? 'svf ' + uhi.svf : 'no heat island'.padEnd(7)} | mean change ${dm.toFixed(2)} K | largest difference from Macro Clima: air ${e[0].toExponential(1)} K, dew point ${e[1].toExponential(1)} K, long-wave ${e[2].toExponential(1)} W/m2`);
  }
}
console.log('largest difference over all cases', worst, worst < 1e-9 ? 'IDENTICAL' : 'DIFFERS', '| fingerprint', CM.FINGERPRINT, '| file years', JSON.stringify(CM.fileYears('DEU_BE_Berlin-Tegel.AP.103820_TMYx.epw', [])));
