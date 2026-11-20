// Loads the built Room Clima engine (room/build/worker.js) and its bundled weather into Node, for the validation scripts.
// RDG_BUILD and RDG_WX override the build folder and the weather file.
const fs = require('fs'), vm = require('vm');
const B = process.env.RDG_BUILD || require('path').join(__dirname, '../../room/build'), WXF = process.env.RDG_WX || require('path').join(__dirname, '../../room/src/wxdata.line');
const sb = { console, Math, Float32Array, Float64Array, Int16Array, Uint8Array, Uint16Array, Int32Array, Uint32Array, Map, Set, JSON, Object, Array, Number, String, Error, postMessage() {} };
sb.globalThis = sb; sb.self = sb; vm.createContext(sb);
vm.runInContext(fs.readFileSync(B + '/worker.js', 'utf8'), sb);
const L = fs.readFileSync(WXF, 'utf8');
const WX = JSON.parse(L.slice(L.indexOf('>') + 1, L.lastIndexOf('</script>')));
function dec(b64, scale, off) { const b = Buffer.from(b64, 'base64'), n = b.length >> 1, v = new Float64Array(n); for (let i = 0; i < n; i++) v[i] = b.readInt16LE(2 * i) / scale - off; return v; }
function wx(name) { const r = WX.find((x) => x.name === name); const w = { name: r.name, lat: r.lat, lon: r.lon, tz: r.tz, t: dec(r.t, 10, 0), td: dec(r.td, 10, 0), p: dec(r.p, 0.5, -60000), ir: dec(r.ir, 1, 0), dni: dec(r.dni, 1, 0), dhi: dec(r.dhi, 1, 0), ws: dec(r.ws, 10, 0), albedo: 0.2 }; return Object.assign(w, sb.Geo.solarPosition(w.lat, w.lon, w.tz)); }
module.exports = { S: sb.Sweep, C: sb.Comfort, G: sb.Geo, R: sb.Register, FS: sb.FacadeSearch, SC: sb.Score, DS: sb.DaySweep, wx, WX, sb };
