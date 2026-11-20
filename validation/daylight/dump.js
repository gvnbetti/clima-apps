// Daylight, step 1: the test rooms as the app builds them (geometry, reflectances, sensors), the hours with blinds down
// from the app's own rule (reference room, register dl.blindRef), the blind's light properties from the register, and the
// app's useful-daylight results without and with blinds. Output: WORK/daylight/cases.json
const fs = require('fs'), path = require('path'), H = require('../lib/app.js'), { S, DS, wx, R } = H, DL = H.sb.Daylight;
const OUT = path.join(require('../lib/paths.js').WORK, 'daylight'); fs.mkdirSync(OUT, { recursive: true });
// id, azimuth of the window (180 south), window-to-wall ratio, fixed outdoor shading (wall reveal 0.35 m in every case)
const ROOMS = [['S35', 180, 0.35, 'none'], ['S65', 180, 0.65, 'none'], ['W50', 270, 0.5, 'none'], ['N50', 0, 0.5, 'none'], ['S50-overhang', 180, 0.5, 'oh10'], ['E50-frame', 90, 0.5, 'box05']];
const CITIES = { mannheim: 'Mannheim', bologna: 'Bologna', san_francisco: 'San Francisco', phoenix: 'Phoenix', dubai: 'Dubai', ho_chi_minh_city: 'Ho Chi Minh City' };
const BREF = R.val('dl.blindRef'), SKY = DL.skyPatches(1), tk = DS.tvKey(1.3, 0.45);
const be = R.val('blind.ext'), bi = R.val('blind.int');
const out = { tk, tv: DS.TV[tk], blinds: { exterior: { tau: be.tau, direct: be.direct, rho: 0.3, offset: 0.03 }, interior: { tau: bi.tau, direct: bi.direct, rho: bi.rho, offset: -0.03 } }, rooms: [] };
for (const [id, az, wwr, fixed] of ROOMS) {
  const ctx0 = S.context(wx('Mannheim'), 'office', {}), c = DS.room(ctx0, 'cellular', wwr, fixed);
  const room = { id, az, wwr, fixed, sensors: c.sensors, geom: DL.geometry(c), tau: c.tau, dims: [c.W, c.D, c.H], cities: {} };
  for (const [cn, city] of Object.entries(CITIES)) {
    const ctx = S.context(wx(city), 'office', {}), a = S.PARAMS.azimuth.indexOf(az), j = DS.job(ctx, { scenario: 'cellular', wwr, fixed, azs: [a] })[a];
    const sk = DS.skyFor(ctx, az, SKY), Hs = DS.hourSets(sk, ctx), occ = Hs.all.filter((_, k) => Hs.occ[k]);
    const masks = {}; for (const [lv, key] of [[1, 'interior'], [2, 'exterior']]) {
      const d = Object.assign({ scenario: 'cellular', azimuth: az, wwr, fixed, shading: lv, fans: 0, supply: 'outdoor', roof: 'standard' }, BREF);
      const sim = S.simulate(ctx, d, 'heat', true); masks[key] = occ.map((i) => sim.bdown[i] ? 1 : 0); }
    const pick = (r) => ({ udi: r.udi, lo: r.udiLo, hi: r.udiHi, sDA: r.sDA, ASE: r.ASE });
    room.cities[cn] = { occ, masks, app: { none: pick(j[tk]), interior: pick(j[tk + '|interior']), exterior: pick(j[tk + '|exterior']) } };
  }
  out.rooms.push(room); console.error(id);
}
fs.writeFileSync(path.join(OUT, 'cases.json'), JSON.stringify(out));
