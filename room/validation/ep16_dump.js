// v16 EnergyPlus check, step 1: cases from the app engine (v16 build), with the hourly air change, blind state per
// window and internal gains of each JS run, so EnergyPlus runs the same operation and only the physics differ.
const fs = require('fs'), H = require('./h16.js'), { S, wx } = H, OUT = '/home/claude/epz16';
fs.mkdirSync(OUT + '/js', { recursive: true }); fs.mkdirSync(OUT + '/wx', { recursive: true });
const pad = (x, n) => String(x).padStart(n, '0');
function writeEpw(w, f) { // minimal EPW from the app's weather (dew point, pressure, IR, DNI, DHI, wind speed)
  const L = [`LOCATION,${w.name},-,-,app,000000,${w.lat},${w.lon},${w.tz},0`, 'DESIGN CONDITIONS,0', 'TYPICAL/EXTREME PERIODS,0', 'GROUND TEMPERATURES,0', 'HOLIDAYS/DAYLIGHT SAVINGS,No,0,0,0', 'COMMENTS 1,written from Room Clima weather', 'COMMENTS 2,', 'DATA PERIODS,1,1,Data,Sunday,1/1,12/31'];
  const md = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; let i = 0;
  for (let m = 0; m < 12; m++) for (let d = 1; d <= md[m]; d++) for (let h = 1; h <= 24; h++, i++) {
    const t = w.t[i], td = Math.min(w.td[i], t), es = (x) => 610.94 * Math.exp(17.625 * x / (x + 243.04)), rh = Math.min(100, Math.max(1, 100 * es(td) / es(t))), p = w.p.length ? w.p[i] : w.p;
    const ghi = Math.max(0, w.dni[i] * Math.max(0, Math.sin((w.el ? w.el[i] : 0) * Math.PI / 180)) + w.dhi[i]);
    L.push([2005, m + 1, d, h, 60, '?9?9?9?9E0?9?9?9?9?9?9?9?9?9?9?9?9?9?9?9*9*9?9?9?9', t.toFixed(1), td.toFixed(1), Math.round(rh), Math.round(p), 9999, 9999, w.ir[i].toFixed(0), ghi.toFixed(0), w.dni[i].toFixed(0), w.dhi[i].toFixed(0), 999999, 999999, 999999, 9999, 0, w.ws[i].toFixed(1), 0, 0, 77777, 9, '999999999', 0, 0.2, 0, 88, 0.2, 0, 0].join(','));
  }
  fs.writeFileSync(f, L.join('\n') + '\n');
}
const CITIES = { mannheim: 'Mannheim', bologna: 'Bologna', dubai: 'Dubai' };
const D = S.designs(6, 16).map((d) => Object.assign(d, { fans: 0, supply: 'outdoor' }));
const out = [];
for (const [wn, city] of Object.entries(CITIES)) { const w = wx(city); writeEpw(w, `${OUT}/wx/${wn}.epw`);
  for (const use of ['office', 'dwelling']) { const ctx = S.context(w, use, {}); const u = ctx.use;
    for (const sc of S.SCENARIOS) for (const az of [180, 270]) D.forEach((d, k) => {
      const c = Object.assign({ scenario: sc, azimuth: az }, d), zp = S.zoneParams(ctx, c), zone = H.sb.SweepZone.buildZone(zp), shd = S.shadeOf(ctx, c);
      const fr = S.simulate(ctx, c, 'free', true), he = S.simulate(ctx, c, 'heat', true), id = `${wn}_${use}_${sc}_${az}_${k}`;
      const wins = zone.elements.filter((e) => e.kind === 'window').map((e) => ({ wall: e.id.slice(4), area: e.area, U: e.U, g: e.g, frame: e.frame, rect: H.sb.SweepZone.windowRect(e.id.endsWith('A') ? zp.width : zp.depth, zp.height, zp.wwr, e.frame) }));
      out.push({ id, wx: wn, use, scenario: sc, az, design: d, dims: [zp.width, zp.depth, zp.height], wall: ctx.wall, fixed: S.FIXED[d.fixed], tHeat: u.tHeat, shade: { key: shd.key, fc: shd.fc, dR: shd.dR },
        elements: zone.elements.filter((e) => e.kind === 'opaque').map((e) => ({ id: e.id, area: e.area, layers: e.layers, aSol: e.aSol, bc: e.bc, tilt: e.tilt })), windows: wins, winBits: fr.winBits });
      const r2 = (a) => Array.from(a, (x) => +x.toFixed(3));
      fs.writeFileSync(`${OUT}/js/${id}.json`, JSON.stringify({ free: { ach: r2(fr.achH), mask: Array.from(fr.bmask), q: r2(fr.qIntH), top: r2(fr.top) }, heat: { ach: r2(he.achH), mask: Array.from(he.bmask), q: r2(he.qIntH), top: r2(he.top), qh: he.heat } }));
    });
  } console.error(wn);
}
fs.writeFileSync(`${OUT}/cases.json`, JSON.stringify(out)); console.log(out.length, 'cases'); console.log(JSON.stringify(D));
