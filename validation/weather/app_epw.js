// Writes the six weather files bundled in Room Clima (and Micro Clima) to EPW, so that EnergyPlus and Radiance read
// exactly the weather the app uses. Fields the app does not keep are filled with EPW missing codes; global horizontal
// radiation is recomputed from direct normal and diffuse radiation. Output: weather/files/app_<city>.epw
const fs = require('fs'), path = require('path'), H = require('../lib/app.js'), { WX } = require('../lib/paths.js');
fs.mkdirSync(WX, { recursive: true });
const slug = (n) => n.toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_|_$/g, '');
function writeEpw(w, rec, f) {
  const L = [`LOCATION,${w.name},-,${rec.cc || '-'},${(rec.source || 'app').replace(/,/g, ' ')},000000,${w.lat},${w.lon},${w.tz},${rec.elev || 0}`, 'DESIGN CONDITIONS,0', 'TYPICAL/EXTREME PERIODS,0', 'GROUND TEMPERATURES,0', 'HOLIDAYS/DAYLIGHT SAVINGS,No,0,0,0', `COMMENTS 1,written from the weather bundled in Room Clima (${rec.file || rec.name})`, 'COMMENTS 2,', 'DATA PERIODS,1,1,Data,Sunday,1/1,12/31'];
  const md = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; let i = 0;
  for (let m = 0; m < 12; m++) for (let d = 1; d <= md[m]; d++) for (let h = 1; h <= 24; h++, i++) {
    const t = w.t[i], td = Math.min(w.td[i], t), es = (x) => 610.94 * Math.exp(17.625 * x / (x + 243.04)), rh = Math.min(100, Math.max(1, 100 * es(td) / es(t)));
    const ghi = Math.max(0, w.dni[i] * Math.max(0, Math.sin((w.el ? w.el[i] : 0) * Math.PI / 180)) + w.dhi[i]);
    L.push([2005, m + 1, d, h, 0, '?9?9?9?9E0?9?9?9?9?9?9?9?9?9?9?9?9?9?9?9*9*9?9?9?9', t.toFixed(1), td.toFixed(1), Math.round(rh), Math.round(w.p[i]), 9999, 9999, w.ir[i].toFixed(0), ghi.toFixed(0), w.dni[i].toFixed(0), w.dhi[i].toFixed(0), 999999, 999999, 999999, 9999, 0, w.ws[i].toFixed(1), 0, 0, 77777, 9, '999999999', 0, 0.2, 0, 88, 0.2, 0, 0].join(','));
  }
  fs.writeFileSync(f, L.join('\n') + '\n');
}
for (const rec of H.WX) { const f = path.join(WX, `app_${slug(rec.name)}.epw`); writeEpw(H.wx(rec.name), rec, f); console.log(path.basename(f)); }
