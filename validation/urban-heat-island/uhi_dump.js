// Urban heat island, step 1: the hourly heat island of the three implementations in the apps, for the 13 reference weather
// files and three neighbourhoods: Macro Clima (macro/core.js), the shared modifiers used by Room Clima (room/src/climamods.js,
// generated from Macro Clima) and Micro Clima's engine (script "engine" in micro/index.html, with its canopy cooling kept
// separate). Also the sun altitude used, so uhi_check.py recomputes the equation from the same inputs.
const fs = require('fs'), path = require('path'), { WORK, WX } = require('../lib/paths.js'), ROOT = path.join(__dirname, '..', '..');
const C = require(path.join(ROOT, 'macro/core.js')), M = require(path.join(ROOT, 'shared/climamods.js'));
const html = fs.readFileSync(path.join(ROOT, 'micro/index.html'), 'utf8'), eng = html.match(/<script id="engine">([\s\S]*?)<\/script>/)[1];
const ef = path.join(WORK, 'micro_engine.js'); fs.writeFileSync(ef, eng); const MC = require(ef);
const OUT = path.join(WORK, 'uhi'); fs.mkdirSync(OUT, { recursive: true });
const NB = { suburban: [0.8, 0.35], urban: [0.6, 0.2], dense: [0.4, 0.1] };   // sky view factor, vegetation fraction (Macro Clima presets)
const files = fs.readdirSync(WX).filter((f) => f.endsWith('.epw') && !f.startsWith('app_')).sort(), idx = [];
for (const f of files) {
  const W = C.parseEPW(fs.readFileSync(path.join(WX, f), 'latin1'), f), S = C.solarArrays(W.meta.lat, W.meta.lon, W.meta.tz);
  const wx = { name: f, lat: W.meta.lat, lon: W.meta.lon, tz: W.meta.tz, t: W.dbt, td: W.dpt, ir: W.hir, dni: W.dni, dhi: W.dhi, ws: W.ws };
  for (const [k, [svf, fveg]] of Object.entries(NB)) {
    const a = C.urbanHeatIsland(W, S, svf, fveg), b = M.urbanHeatIsland(W, M.solarArrays(W.meta.lat, W.meta.lon, W.meta.tz), svf, fveg);
    const c = MC.prepare(wx, { urban: true, svf, fveg, canopy: 0 });
    const id = `${f.replace('.epw', '')}_${k}`;
    fs.writeFileSync(path.join(OUT, id + '.json'), JSON.stringify({ file: f, svf, fveg, alt: Array.from(S.alt, (x) => +x.toFixed(4)), dbt: Array.from(W.dbt), dni: Array.from(W.dni), dhi: Array.from(W.dhi), ws: Array.from(W.ws),
      macro: Array.from(a.uhi, (x) => +x.toFixed(5)), room: Array.from(b.uhi, (x) => +x.toFixed(5)), micro: Array.from(c.uhi, (x) => +x.toFixed(5)), dayMax: Array.from(a.dayMax, (x) => +x.toFixed(5)) }));
    idx.push(id);
  }
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(idx)); console.log(idx.length, 'cases');
