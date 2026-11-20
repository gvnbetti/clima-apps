// Future climate, step 4a: the apps' morphing of real weather files at +1.5, +2 and +3 °C, written out for comparison with
// pyepwmorph (check_morph.py). Region and file years found as Macro Clima does (macro/app.js prepWeather, futMid).
const fs = require('fs'), path = require('path'), { WORK, WX } = require('../lib/paths.js'), ROOT = path.join(__dirname, '..', '..');
global.window = {}; require(path.join(ROOT, 'macro/future.js')); require(path.join(ROOT, 'macro/regions.js'));
const C = require(path.join(ROOT, 'macro/core.js')), F = window.CLIMA_FUTURE, OUT = path.join(WORK, 'future', 'morph'); fs.mkdirSync(OUT, { recursive: true });
function futMid(W, name) { // as macro/app.js
  const t = name + ' ' + W.meta.comments.join(' '), per = t.match(/Period of Record\s*=?\s*(\d{4})\s*-\s*(\d{4})/i) || t.match(/TMYx\.?(\d{4})-(\d{4})/i);
  return per ? { year: (+per[1] + +per[2]) / 2, from: +per[1], to: +per[2], known: true } : { year: 2010, known: false };
}
const files = fs.readdirSync(WX).filter((f) => f.endsWith('.epw') && !f.startsWith('app_')).sort(), index = [];
for (const f of files) {
  const W = C.parseEPW(fs.readFileSync(path.join(WX, f), 'latin1'), f), reg = C.regionOf(W.meta.lat, W.meta.lon, window.CLIMA_REGIONS), mid = futMid(W, f);
  for (const lv of [1.5, 2, 3]) {
    const d = C.futureDelta(F, reg.id, lv, mid.year), m = C.morphWeather(W, d), id = `${f.replace('.epw', '')}_${lv}`;
    fs.writeFileSync(path.join(OUT, id + '.json'), JSON.stringify({ file: f, region: reg.id, mid, level: lv, dT: d.dT, dP: d.dP, month: Array.from(C.T.month), dbt0: Array.from(W.dbt), rh0: Array.from(W.rh), dpt0: Array.from(W.dpt), hir0: Array.from(W.hir), dbt: Array.from(m.dbt, (x) => +x.toFixed(4)), dpt: Array.from(m.dpt, (x) => +x.toFixed(4)), hir: Array.from(m.hir, (x) => +x.toFixed(3)) }));
    index.push({ id, file: f, region: reg.id, mid });
  }
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index)); console.log(index.length, 'morphed files');
