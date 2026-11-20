// Climate reading (Macro Clima), verification step 1: values of macro/core.js for comparison in verify.py.
const fs = require('fs'), path = require('path'), { WORK, WX } = require('../lib/paths.js'), C = require(path.join(__dirname, '..', '..', 'macro', 'core.js'));
const OUT = path.join(WORK, 'macro'); fs.mkdirSync(OUT, { recursive: true }); const res = { files: {}, psy: [], utci: [] };
for (const f of fs.readdirSync(WX).filter((x) => x.endsWith('.epw') && !x.startsWith('app_')).sort()) {
  const W = C.parseEPW(fs.readFileSync(path.join(WX, f), 'latin1'), f), S = C.solarArrays(W.meta.lat, W.meta.lon, W.meta.tz), walls = {};
  for (const [tilt, az] of [[90, 0], [90, 90], [90, 180], [90, 270], [0, 180]]) { const a = new Float32Array(8760); for (let i = 0; i < 8760; i++) a[i] = C.poa(tilt, az, S.zen[i], S.az[i], W.dni[i], W.dhi[i], W.ghi[i], C.T.doy[i], 0.2).tot; walls[`${tilt}_${az}`] = Array.from(a, (x) => +x.toFixed(2)); }
  const dm = []; for (let d = 0; d < 365; d++) { let s = 0; for (let h = 0; h < 24; h++) s += W.dbt[d * 24 + h]; dm.push(s / 24); }
  const ab = C.adaptiveBands(Float32Array.from(dm));
  res.files[f] = { lat: W.meta.lat, lon: W.meta.lon, tz: W.meta.tz, alt: Array.from(S.alt), az: Array.from(S.az), dni: Array.from(W.dni), dhi: Array.from(W.dhi), ghi: Array.from(W.ghi), walls, dm, rmEN: Array.from(C.runningMeanEN(Float32Array.from(dm), 0.8)), enLo: Array.from(ab.en.lo), enHi: Array.from(ab.en.hi), enValid: Array.from(ab.en.valid) };
}
let s = 7; const r = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
for (let k = 0; k < 2000; k++) { const t = -30 + 75 * r(), rh = 5 + 95 * r(), p = 80000 + 25000 * r(), pv = C.pws(t) * rh / 100, w = C.humRatio(pv, p); res.psy.push([t, rh, p, C.pws(t), w, C.wetBulb(t, w, p), C.enthalpy(t, w), C.dewFromPw(pv)]); }
for (let k = 0; k < 2000; k++) { const ta = -45 + 95 * r(), tr = ta + (-25 + 90 * r()), v = 0.5 + 16.5 * r(), rh = 5 + 95 * r(); res.utci.push([ta, tr, v, rh, C.utci(ta, tr, v, rh)]); }
fs.writeFileSync(path.join(OUT, 'verify.json'), JSON.stringify(res)); console.log('written');
