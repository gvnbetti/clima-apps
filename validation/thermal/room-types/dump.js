// Room types, step 1: the cases, run in the app engine (Room Clima build), with the hourly air change, blind state per
// window and internal gains of each run, so that EnergyPlus runs the same operation and only the physics differ.
// Output: WORK/room_types/cases.json and one file of hourly results per case in WORK/room_types/js/.
const fs = require('fs'), path = require('path'), H = require('../../lib/app.js'), { S, wx } = H, OUT = path.join(require('../../lib/paths.js').WORK, 'room_types');
fs.mkdirSync(OUT + '/js', { recursive: true });
const pad = (x, n) => String(x).padStart(n, '0');
const CITIES = { mannheim: 'Mannheim', bologna: 'Bologna', san_francisco: 'San Francisco', phoenix: 'Phoenix', dubai: 'Dubai', ho_chi_minh_city: 'Ho Chi Minh City' };   // the six weather files bundled in the app
const D = S.designs(6, 16).map((d) => Object.assign(d, { fans: 0, supply: 'outdoor' }));
const out = [];
for (const [wn, city] of Object.entries(CITIES)) { const w = wx(city);
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
