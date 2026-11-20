/* Clima weather modifiers, shared by Macro Clima, Micro Clima and Room Clima.
   Urban heat island (Theeuwes et al. 2017) and future climate (IPCC AR6 Atlas, morphing to a global warming level).
   The code below is copied verbatim from Macro Clima (core.js and app.js, version 1794244167-1bb9) by tools/mkmods.py;
   do not edit it here: change Macro Clima and regenerate. Source fingerprint f017fa21409f.
   Data: window.CLIMA_FUTURE (future.js) and window.CLIMA_REGIONS (regions.js), as in Macro Clima. */
(function (root) {
  "use strict";
  const N = 8760, D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const MSTART = MDAYS.reduce((a, d, i) => (a.push(i ? a[i - 1] + MDAYS[i - 1] : 0), a), []);
  function timeArrays() {
    const month = new Uint8Array(N), day = new Uint8Array(N), hour = new Uint8Array(N), doy = new Uint16Array(N);
    for (let d = 0; d < 365; d++) {
      let m = 0; while (m < 11 && d >= MSTART[m + 1]) m++;
      for (let h = 0; h < 24; h++) { const i = d * 24 + h; month[i] = m + 1; day[i] = d - MSTART[m] + 1; hour[i] = h; doy[i] = d + 1; }
    }
    return { month, day, hour, doy };
  }
  const T = timeArrays();
  function julianDay(y, m, d) { if (m <= 2) { y -= 1; m += 12; } const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4); return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5; }
  function sunPosition(lat, lon, tz, doy, hourLST, year) {
    year = year || 2019;
    let m = 0; while (m < 11 && doy - 1 >= MSTART[m + 1]) m++;
    const dom = doy - MSTART[m];
    const jd = julianDay(year, m + 1, dom) + (hourLST - tz) / 24;
    const t = (jd - 2451545) / 36525;
    const L0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
    const M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
    const Mr = M * D2R;
    const C = Math.sin(Mr) * (1.914602 - t * (0.004817 + 0.000014 * t)) + Math.sin(2 * Mr) * (0.019993 - 0.000101 * t) + Math.sin(3 * Mr) * 0.000289;
    const trueLong = L0 + C;
    const omega = 125.04 - 1934.136 * t;
    const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * D2R);
    const eps0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
    const epsC = eps0 + 0.00256 * Math.cos(omega * D2R);
    const decl = Math.asin(Math.sin(epsC * D2R) * Math.sin(lambda * D2R));
    const y2 = Math.tan(epsC * D2R / 2) ** 2;
    const L0r = L0 * D2R;
    const eqTime = 4 * R2D * (y2 * Math.sin(2 * L0r) - 2 * e * Math.sin(Mr) + 4 * e * y2 * Math.sin(Mr) * Math.cos(2 * L0r) - 0.5 * y2 * y2 * Math.sin(4 * L0r) - 1.25 * e * e * Math.sin(2 * Mr)); // minutes
    const tst = (hourLST * 60 + eqTime + 4 * lon - 60 * tz) % 1440;
    let ha = tst / 4 < 0 ? tst / 4 + 180 : tst / 4 - 180;
    const latr = lat * D2R, har = ha * D2R;
    let cz = Math.sin(latr) * Math.sin(decl) + Math.cos(latr) * Math.cos(decl) * Math.cos(har);
    cz = Math.max(-1, Math.min(1, cz));
    const zen = Math.acos(cz) * R2D, elev = 90 - zen;
    // refraction (NOAA)
    let ref = 0;
    if (elev <= 85) { const te = Math.tan(elev * D2R); if (elev > 5) ref = 58.1 / te - 0.07 / te ** 3 + 0.000086 / te ** 5; else if (elev > -0.575) ref = 1735 + elev * (-518.2 + elev * (103.4 + elev * (-12.79 + elev * 0.711))); else ref = -20.772 / te; ref /= 3600; }
    const appElev = elev + ref;
    let az;
    const sz = Math.sin(zen * D2R);
    if (sz > 1e-9) {
      let ca = ((Math.sin(latr) * cz) - Math.sin(decl)) / (Math.cos(latr) * sz);
      ca = Math.max(-1, Math.min(1, ca));
      az = ha > 0 ? (Math.acos(ca) * R2D + 180) % 360 : (540 - Math.acos(ca) * R2D) % 360;
    } else az = lat > 0 ? 180 : 0;
    return { alt: appElev, az, zen: 90 - appElev, trueZen: zen, decl: decl * R2D, eqTime };
  }
  function solarArrays(lat, lon, tz) {
    const alt = new Float32Array(N), az = new Float32Array(N), zen = new Float32Array(N);
    for (let i = 0; i < N; i++) { const s = sunPosition(lat, lon, tz, T.doy[i], T.hour[i] + 0.5); alt[i] = s.alt; az[i] = s.az; zen[i] = s.zen; }
    return { alt, az, zen };
  }
  function pws(t) { // saturation vapour pressure, Pa (Hyland-Wexler)
    const T = t + 273.15;
    if (t > 0.01) return Math.exp(-5.8002206e3 / T + 1.3914993 - 4.8640239e-2 * T + 4.1764768e-5 * T * T - 1.4452093e-8 * T * T * T + 6.5459673 * Math.log(T));
    return Math.exp(-5.6745359e3 / T + 6.3925247 - 9.677843e-3 * T + 6.2215701e-7 * T * T + 2.0747825e-9 * T ** 3 - 9.484024e-13 * T ** 4 + 4.1635019 * Math.log(T));
  }
  function dewFromPw(pw) { // inverse of pws by Newton
    let t = 237.3 * Math.log(pw / 610.78) / (17.27 - Math.log(pw / 610.78));
    for (let k = 0; k < 8; k++) { const f = pws(t) - pw, d = (pws(t + 0.01) - pws(t - 0.01)) / 0.02; t -= f / d; }
    return t;
  }
  /* ---------- future climate: morphing to a global warming level ----------
     Regional monthly change of mean temperature and precipitation from CMIP6 (IPCC AR6 Atlas regional means), at a global warming
     level, measured from the file's own years: change(level, from 1995-2014) minus change(file mid-year, from 1995-2014).
     Temperature is shifted (Belcher et al. 2005), interpolated day by day between mid-month values; relative humidity is held, so
     dew point rises; longwave sky radiation is scaled with (T'/T)^4 in kelvin; precipitation is scaled by its monthly change. */
  function pointInRings(lon, lat, rings) {
    let inside = false;
    for (const r of rings) for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
      const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
      if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function regionOf(lat, lon, regions) {
    const hits = regions.filter((r) => pointInRings(lon, lat, r.rings));
    return hits.find((r) => r.type !== "Ocean") || hits[0] || null;
  }
  const MIDDAY = [15.5, 45, 74.5, 105, 135.5, 166, 196.5, 227.5, 258, 288.5, 319, 349.5];
  function dailyFromMonthly(v) { // 365 values, linear between mid-month points, cyclic
    const out = new Float64Array(365);
    for (let d = 0; d < 365; d++) {
      const x = d + 0.5; let k = MIDDAY.findIndex((m) => m > x); if (k < 0) k = 12;
      const a = (k + 11) % 12, b = k % 12, xa = k === 0 ? MIDDAY[11] - 365 : MIDDAY[k - 1], xb = k === 12 ? MIDDAY[0] + 365 : MIDDAY[k];
      out[d] = v[a] + (v[b] - v[a]) * (x - xa) / (xb - xa);
    }
    return out;
  }
  function futureDelta(F, reg, level, midYear) {
    const L = F.gwl[level.toFixed(1)], ys = F.trendYears, y = Math.max(ys[0], Math.min(ys[ys.length - 1], midYear));
    const k = Math.min(ys.length - 2, Math.floor((y - ys[0]) / 5)), f = (y - ys[k]) / 5;
    const dT = [], lo = [], hi = [], dP = [];
    for (let m = 0; m < 12; m++) {
      const tr = F.trend[reg][m], off = tr[k] == null ? 0 : tr[k] + (tr[k + 1] - tr[k]) * f;
      const t = L.dT[reg][m]; if (!t || t[0] == null) return null;
      dT.push(t[0] - off); lo.push(t[1] - off); hi.push(t[2] - off);
      const p = L.dP[reg] && L.dP[reg][m]; dP.push(p && p[0] != null ? p[0] : 0);
    }
    const gk = F.gtrend[k] + (F.gtrend[k + 1] - F.gtrend[k]) * f;
    return { dT, lo, hi, dP, fileWarming: gk, level };
  }
  function morphWeather(W, delta) {
    const dd = dailyFromMonthly(delta.dT), n = N, dbt = new Float64Array(n), dpt = new Float64Array(n), hir = new Float64Array(n), prec = new Float64Array(n), dh = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const d = Math.floor(i / 24), m = T.month[i] - 1, t = W.dbt[i], t2 = t + dd[d]; dh[i] = dd[d];
      dbt[i] = t2;
      const pv = Math.max(1, Math.min(100, W.rh[i])) / 100 * pws(t2); dpt[i] = Math.min(t2, dewFromPw(pv));
      hir[i] = W.hir[i] > 0 ? W.hir[i] * Math.pow((t2 + 273.15) / (t + 273.15), 4) : W.hir[i];
      prec[i] = W.prec[i] > 0 ? Math.max(0, W.prec[i] * (1 + delta.dP[m] / 100)) : W.prec[i];
    }
    return { dbt, dpt, hir, prec, dh };
  }
  /* ---------- urban heat island (same model and code path as Micro Clima) ----------
     Theeuwes et al. 2017: UHImax = (2 - SVF - Fveg) * (S * DTR^3 / U)^(1/4); S = daily mean global radiation / (rho cp) [K m/s],
     DTR = station daily temperature range [K], U = daily mean 10 m wind [m/s] (at least 0.5). S over 01:00 to 00:00; DTR and U over
     08:00 to 07:00 the next day (Table 2); the value applies to that 08:00 to 07:00 window. Diurnal profile (assumption, as in Micro Clima):
     full value with the sun down, falling to 15 % of it at the daily sun peak, with the square root of sin(altitude) / sin(peak altitude).
     Vapour pressure is held, so dew point and humidity ratio stay as recorded and relative humidity is recomputed. Calibrated on
     14 cities in north-western Europe, for SVF 0.2 to 0.9 and Fveg up to 0.4. Global radiation is rebuilt from DNI and DHI, as Micro Clima does. */
  const UHI_NOON = 0.85;
  function urbanHeatIsland(W, S, svf, fveg) {
    const n = N, uhi = new Float32Array(n), dbt = new Float64Array(n), rh = new Float64Array(n), ghi = new Float64Array(n), elMaxDay = new Float64Array(365);
    for (let i = 0; i < n; i++) { const el = S.alt[i]; ghi[i] = Math.max(0, W.dhi[i]) + (el > 0 ? Math.max(0, W.dni[i]) * Math.sin(el * D2R) : 0); const d = Math.floor(i / 24); if (el > elMaxDay[d]) elMaxDay[d] = el; }
    const fac = Math.max(0, 2 - svf - fveg), uday = new Float64Array(365);
    for (let d = 0; d < 365; d++) {
      let sg = 0, u = 0, tmax = -99, tmin = 99;
      for (let h = 0; h < 24; h++) sg += ghi[d * 24 + h];
      for (let k = 0; k < 24; k++) { const i = (d * 24 + 8 + k) % n; tmax = Math.max(tmax, W.dbt[i]); tmin = Math.min(tmin, W.dbt[i]); u += Math.max(0, W.ws[i]); }
      const Sk = (sg / 24) / (1.2 * 1005), U = Math.max(0.5, u / 24), dtr = Math.max(0, tmax - tmin);
      uday[d] = fac * Math.pow(Sk * dtr * dtr * dtr / U, 0.25);
    }
    let sum = 0, sn = 0, nn = 0, mx = 0;
    for (let i = 0; i < n; i++) {
      let d = Math.floor((i - 8) / 24); if (d < 0) d = 364;
      const el = S.alt[i], dm = elMaxDay[Math.floor(i / 24)];
      const f = el <= 0 ? 1 : 1 - UHI_NOON * Math.sqrt(Math.sin(el * D2R) / Math.max(0.05, Math.sin(dm * D2R)));
      uhi[i] = uday[d] * f; sum += uhi[i]; if (el <= 0) { sn += uhi[i]; nn++; } if (uhi[i] > mx) mx = uhi[i];
      dbt[i] = W.dbt[i] + uhi[i];
      const e = pws(Math.min(W.dpt[i], W.dbt[i]));
      rh[i] = Math.max(1, Math.min(100, 100 * e / pws(dbt[i])));
    }
    return { uhi, dbt, rh, factor: fac, mean: sum / n, nightMean: nn ? sn / nn : 0, max: mx, dayMax: uday };
  }
  const isNWEurope = (lat, lon) => lat >= 45 && lat <= 62 && lon >= -11 && lon <= 20;
  /* ---------- from Macro Clima app.js ---------- */
  const FUT_LEVELS = [[1.5, "+1.5 °C", "around 2030"], [2, "+2 °C", "around 2050"], [3, "+3 °C", "around 2080 to 2100"]];
  const futLab = (L) => { const x = FUT_LEVELS.find((f) => f[0] === L); return x ? `${x[1]} global warming, ${x[2]}` : ""; };
  const futRegion = (W, regions) => (regions ? regionOf(W.meta.lat, W.meta.lon, regions) : null);
  const REG_NAMES = { GIC: "Greenland and Iceland", NWN: "North-West North America", NEN: "North-East North America", WNA: "Western North America", CNA: "Central North America", ENA: "Eastern North America", NCA: "Northern Central America", SCA: "Southern Central America", CAR: "Caribbean", NWS: "North-West South America", NSA: "Northern South America", NES: "North-East South America", SAM: "South American Monsoon", SWS: "South-West South America", SES: "South-East South America", SSA: "Southern South America", NEU: "Northern Europe", WCE: "Western and Central Europe", EEU: "Eastern Europe", MED: "Mediterranean", SAH: "Sahara", WAF: "Western Africa", CAF: "Central Africa", NEAF: "North Eastern Africa", SEAF: "South Eastern Africa", WSAF: "West Southern Africa", ESAF: "East Southern Africa", MDG: "Madagascar", RAR: "Russian Arctic", WSB: "Western Siberia", ESB: "Eastern Siberia", RFE: "Russian Far East", WCA: "West Central Asia", ECA: "East Central Asia", TIB: "Tibetan Plateau", EAS: "East Asia", ARP: "Arabian Peninsula", SAS: "South Asia", SEA: "South-East Asia", NAU: "Northern Australia", CAU: "Central Australia", EAU: "Eastern Australia", SAU: "Southern Australia", NZ: "New Zealand", EAN: "East Antarctica", WAN: "West Antarctica" };
  const regName = (r) => (r ? REG_NAMES[r.id] || r.name.replace(/[.-]/g, " ") : "");
  const UHI_PRESETS = { suburban: { svf: 0.8, fveg: 0.35 }, urban: { svf: 0.6, fveg: 0.2 }, dense: { svf: 0.4, fveg: 0.1 } };
  // the file's years, from its name and comment lines (as futMid in Macro Clima, which reads the same two sources)
  function fileYears(name, comments) {
    const t = (name || "") + " " + (comments || []).join(" ");
    const per = (t.match(/Period of Record\s*=?\s*(\d{4})\s*-\s*(\d{4})/i) || t.match(/TMYx\.?(\d{4})-(\d{4})/i));
    if (per) return { year: (+per[1] + +per[2]) / 2, from: +per[1], to: +per[2], known: true };
    return { year: 2010, known: false };
  }
  const AIRPORT = /(\bAP\b|\.AP\.|Intl|Airport|Airfield|AFB|Aero|Flughafen|Aeroporto|Aeropuerto|Aéroport|RAF)/i;
  /* prepWeather as in Macro Clima: morph to the warming level first, then the heat island on top.
     W0 in Macro Clima's fields: dbt, dpt, rh, hir, prec, dni, dhi, ws, meta { lat, lon, tz }.
     opt: { level: 0 | 1.5 | 2 | 3, uhi: null | { svf, fveg }, year: mid-year of the file, future, regions } */
  function prepWeather(W0, opt) {
    let W = W0, fut = null;
    if (opt.level) { const reg = futRegion(W0, opt.regions), d = reg ? futureDelta(opt.future, reg.id, opt.level, opt.year) : null; if (d) { const m = morphWeather(W0, d); W = Object.assign({}, W0, { dbt: m.dbt, dpt: m.dpt, hir: m.hir, prec: m.prec }); fut = Object.assign(d, { region: reg, dh: m.dh }); } }
    if (!opt.uhi) return { W, uhi: null, fut };
    const S0 = solarArrays(W.meta.lat, W.meta.lon, W.meta.tz), u = urbanHeatIsland(W, S0, opt.uhi.svf, opt.uhi.fveg);
    return { W: Object.assign({}, W, { dbt: u.dbt, rh: u.rh }), uhi: u, fut };
  }
  const api = { FINGERPRINT: "f017fa21409f", prepWeather, futureDelta, morphWeather, urbanHeatIsland, regionOf, futRegion, regName, fileYears, isNWEurope, AIRPORT, FUT_LEVELS, futLab, UHI_PRESETS, REG_NAMES, pws, dewFromPw, solarArrays, sunPosition };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.ClimaMods = api;
})(typeof window !== "undefined" ? window : globalThis);
