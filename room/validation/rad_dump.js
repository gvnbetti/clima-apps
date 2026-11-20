// Radiance check of daylight with blinds (v16): rooms, sensors and geometry from the app, the app's own blind hours
// (reference room, register dl.blindRef) and the app's useful-daylight results without and with blinds.
const fs = require('fs'), H = require('./h16.js'), { S, DS, wx, R } = H, DL = H.sb.Daylight, OUT = '/home/claude/radz';
const ROOMS = [['S35', 180, 0.35], ['S65', 180, 0.65], ['W50', 270, 0.5]], CITIES = { mannheim: 'Mannheim', bologna: 'Bologna', dubai: 'Dubai' };
const BREF = R.val('dl.blindRef'), SKY = DL.skyPatches(1), tk = DS.tvKey(1.3, 0.45), out = { tk, tv: DS.TV[tk], rooms: [] };
for (const [id, az, wwr] of ROOMS) {
  const ctx0 = S.context(wx('Mannheim'), 'office', {}), c = DS.room(ctx0, 'cellular', wwr, 'none');
  const room = { id, az, wwr, sensors: c.sensors, geom: DL.geometry(c), tau: c.tau, cities: {} };
  for (const [cn, city] of Object.entries(CITIES)) {
    const ctx = S.context(wx(city), 'office', {}), a = S.PARAMS.azimuth.indexOf(az), j = DS.job(ctx, { scenario: 'cellular', wwr, fixed: 'none', azs: [a] })[a];
    const sk = DS.skyFor(ctx, az, SKY), Hs = DS.hourSets(sk, ctx), occ = Hs.all.filter((_, k) => Hs.occ[k]);
    const masks = {}; for (const [lv, key] of [[1, 'interior'], [2, 'exterior']]) {
      const d = Object.assign({ scenario: 'cellular', azimuth: az, wwr, fixed: 'none', shading: lv, fans: 0, supply: 'outdoor', roof: 'standard' }, BREF);
      const sim = S.simulate(ctx, d, 'heat', true); masks[key] = occ.map((i) => sim.bdown[i] ? 1 : 0); }
    const pick = (r) => ({ udi: r.udi, lo: r.udiLo, hi: r.udiHi, light: r.light });
    room.cities[cn] = { occ, masks, tau: { interior: S.shadeOf(ctx, { shading: 1, uglass: 1.3, gglass: 0.45 }).tau, exterior: S.shadeOf(ctx, { shading: 2, uglass: 1.3, gglass: 0.45 }).tau },
      app: { none: pick(j[tk]), interior: pick(j[tk + '|interior']), exterior: pick(j[tk + '|exterior']) } };
  }
  out.rooms.push(room); console.error(id);
}
fs.writeFileSync(OUT + '/cases.json', JSON.stringify(out)); console.log(JSON.stringify(out.rooms.map((r) => [r.id, Object.fromEntries(Object.entries(r.cities).map(([k, v]) => [k, v.app]))])));
