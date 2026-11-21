/* Clima Toolbox calculation core, shared by Macro Clima, Micro Clima and Room Clima.
   Sun position (NOAA), sun on surfaces (Perez 1990), psychrometrics (Hyland-Wexler, as psychrolib), SolarCal (ASHRAE 55),
   sky longwave, UTCI (Broede et al. 2012), urban heat island (Theeuwes et al. 2017) and future climate (IPCC AR6 Atlas).
   The code below is copied verbatim from Macro Clima (core.js and app.js) by shared/mkmods.py;
   do not edit it here: change Macro Clima and regenerate. Source fingerprint 104ba3161862.
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
  const humRatio = (pw, p) => 0.621945 * pw / (p - pw);
  const pwFromW = (w, p) => p * w / (0.621945 + w);
  function dewFromPw(pw) { // inverse of pws by Newton
    let t = 237.3 * Math.log(pw / 610.78) / (17.27 - Math.log(pw / 610.78));
    for (let k = 0; k < 8; k++) { const f = pws(t) - pw, d = (pws(t + 0.01) - pws(t - 0.01)) / 0.02; t -= f / d; }
    return t;
  }
  const enthalpy = (t, w) => 1.006 * t + w * (2501 + 1.86 * t); // kJ/kg
  function wetBulb(t, w, p) { // psychrometric wet bulb, bisection between dew point and dry bulb (as psychrolib)
    let lo = Math.min(t, dewFromPw(Math.max(1e-3, pwFromW(w, p)))), hi = t;
    for (let k = 0; k < 40; k++) {
      const tw = (lo + hi) / 2, wsw = humRatio(pws(tw), p);
      const wc = tw >= 0 ? ((2501 - 2.326 * tw) * wsw - 1.006 * (t - tw)) / (2501 + 1.86 * t - 4.186 * tw) : ((2830 - 0.24 * tw) * wsw - 1.006 * (t - tw)) / (2830 + 1.86 * t - 2.1 * tw);
      if (wc > w) hi = tw; else lo = tw;
    }
    return (lo + hi) / 2;
  }
  /* ---------------- irradiation on surfaces (Perez 1990, as pvlib) ---------------- */
  const F1C = [[-0.008, 0.588, -0.062], [0.13, 0.683, -0.151], [0.33, 0.487, -0.221], [0.568, 0.187, -0.295], [0.873, -0.392, -0.362], [1.132, -1.237, -0.412], [1.06, -1.6, -0.359], [0.678, -0.327, -0.25]];
  const F2C = [[-0.06, 0.072, -0.022], [-0.019, 0.066, -0.029], [0.055, -0.064, -0.026], [0.109, -0.152, -0.014], [0.226, -0.462, 0.001], [0.288, -0.823, 0.056], [0.264, -1.127, 0.131], [0.156, -1.377, 0.251]];
  const EBIN = [1.065, 1.23, 1.5, 1.95, 2.8, 4.5, 6.2];
  function dniExtra(doy) { const B = 2 * Math.PI * (doy - 1) / 365; return 1366.1 * (1.00011 + 0.034221 * Math.cos(B) + 0.00128 * Math.sin(B) + 0.000719 * Math.cos(2 * B) + 0.000077 * Math.sin(2 * B)); }
  function airmassKY(zen) { if (zen > 90) return NaN; return 1 / (Math.cos(zen * D2R) + 0.50572 * (96.07995 - zen) ** -1.6364); }
  function perezSkyClearness(dhi, dni, zen) { if (!(dhi > 0)) return NaN; const z = zen * D2R, k = 1.041 * z ** 3; return ((dhi + dni) / dhi + k) / (1 + k); }
  // plane-of-array irradiance for one hour: tilt, surface azimuth (deg from north, clockwise)
  function poa(tilt, sAz, zen, az, dni, dhi, ghi, doy, albedo) {
    if (!(ghi > 0) && !(dhi > 0)) return { tot: 0, beam: 0, sky: 0, gnd: 0 };
    const zr = zen * D2R, tr = tilt * D2R;
    let cosAoi = Math.cos(zr) * Math.cos(tr) + Math.sin(zr) * Math.sin(tr) * Math.cos((az - sAz) * D2R);
    const A = Math.max(cosAoi, 0);
    const beam = zen < 90 ? Math.max(0, dni * A) : 0;
    let sky = 0, iso = 0, circ = 0, hor = 0;
    const am = airmassKY(zen);
    if (dhi > 0 && isFinite(am)) {
      const eps = perezSkyClearness(dhi, dni, zen);
      let b = 0; while (b < 7 && eps >= EBIN[b]) b++;
      const delta = dhi * am / dniExtra(doy);
      const F1 = Math.max(0, F1C[b][0] + F1C[b][1] * delta + F1C[b][2] * zr), F2 = F2C[b][0] + F2C[b][1] * delta + F2C[b][2] * zr;
      const B = Math.max(Math.cos(zr), Math.cos(85 * D2R));
      iso = dhi * 0.5 * (1 - F1) * (1 + Math.cos(tr)); circ = dhi * F1 * A / B; hor = dhi * F2 * Math.sin(tr);
      sky = Math.max(0, iso + circ + hor);
    } else if (dhi > 0) sky = iso = dhi * 0.5 * (1 + Math.cos(tr));
    const gnd = ghi * albedo * (1 - Math.cos(tr)) * 0.5;
    // iso, circ (circumsolar) and hor (horizon band) are the parts of sky; cosAoi the cosine of the angle of incidence
    return { tot: beam + sky + gnd, beam, sky, gnd, iso, circ, hor, cosAoi };
  }
  /* ---------------- SolarCal (ASHRAE 55 Appendix C), outdoor, with measured diffuse and reflected ---------------- */
  const ALT_RANGE = [0, 15, 30, 45, 60, 75, 90];
  const AZ_RANGE = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];
  const FP_STANDING = [[0.35, 0.35, 0.314, 0.258, 0.206, 0.144, 0.082], [0.342, 0.342, 0.31, 0.252, 0.2, 0.14, 0.082], [0.33, 0.33, 0.3, 0.244, 0.19, 0.132, 0.082], [0.31, 0.31, 0.275, 0.228, 0.175, 0.124, 0.082], [0.283, 0.283, 0.251, 0.208, 0.16, 0.114, 0.082], [0.252, 0.252, 0.228, 0.188, 0.15, 0.108, 0.082], [0.23, 0.23, 0.214, 0.18, 0.148, 0.108, 0.082], [0.242, 0.242, 0.222, 0.18, 0.153, 0.112, 0.082], [0.274, 0.274, 0.245, 0.203, 0.165, 0.116, 0.082], [0.304, 0.304, 0.27, 0.22, 0.174, 0.121, 0.082], [0.328, 0.328, 0.29, 0.234, 0.183, 0.125, 0.082], [0.344, 0.344, 0.304, 0.244, 0.19, 0.128, 0.082], [0.347, 0.347, 0.308, 0.246, 0.191, 0.128, 0.082]];
  function span(arr, x) { for (let i = 0; i < arr.length - 1; i++) if (arr[i + 1] >= x && x >= arr[i]) return i; return -1; }
  function fpStanding(alt, sharp) {
    alt = Math.max(0, Math.min(90, alt)); sharp = Math.max(0, Math.min(180, sharp));
    const ai = span(ALT_RANGE, alt), zi = span(AZ_RANGE, sharp);
    const a1 = ALT_RANGE[ai], a2 = ALT_RANGE[ai + 1], z1 = AZ_RANGE[zi], z2 = AZ_RANGE[zi + 1], t = FP_STANDING;
    return (t[zi][ai] * (z2 - sharp) * (a2 - alt) + t[zi + 1][ai] * (sharp - z1) * (a2 - alt) + t[zi][ai + 1] * (z2 - sharp) * (alt - a1) + t[zi + 1][ai + 1] * (sharp - z1) * (alt - a1)) / ((z2 - z1) * (a2 - a1));
  }
  // returns delta MRT (K). diffuse and global horizontal are the measured values (the CBE Clima version used 0.2 x DNI).
  function solarCalDeltaMrt(alt, dni, dhi, ghi, o) {
    o = o || {};
    const fEff = 0.725, hr = 6.012, asw = o.asw != null ? o.asw : 0.7, lw = 0.95, fsvv = o.fsvv != null ? o.fsvv : 1, fbes = o.fbes != null ? o.fbes : 1, rf = o.rFloor != null ? o.rFloor : 0.2, sharp = o.sharp != null ? o.sharp : 45;
    const a = Math.max(0, alt);
    const iDir = alt > 0 ? Math.max(0, dni) : 0, iDiff = Math.max(0, dhi || 0), iTH = Math.max(0, ghi || 0);
    const fp = fpStanding(a, sharp);
    const eDiff = fEff * fsvv * 0.5 * iDiff;
    const eDir = fEff * fp * fbes * iDir;
    const eRef = fEff * fsvv * 0.5 * iTH * rf;
    const erf = (eDiff + eDir + eRef) * (asw / lw);
    return erf / (hr * fEff);
  }
  /* ---------------- longwave exchange with the sky (as Ladybug Tools' outdoor SolarCal) ---------------- */
  const SIGMA = 5.6697e-8;
  // sky temperature from the file's horizontal infrared radiation; where that is missing, from dew point and opaque sky cover (Clark and Allen, as EnergyPlus)
  function skyTemperature(hir, tdb, tdp, osc) {
    let ir = hir;
    if (!(ir > 0 && ir < 9999)) { const n = isFinite(osc) ? Math.max(0, Math.min(10, osc)) : 5, td = tdp + 273.15, eps = (0.787 + 0.764 * Math.log(td / 273)) * (1 + 0.0224 * n - 0.0035 * n * n + 0.00028 * n * n * n); ir = eps * SIGMA * (tdb + 273.15) ** 4; }
    return (ir / (0.95 * SIGMA)) ** 0.25 - 273.15;
  }
  // change of MRT from the upper half of the view being sky rather than surfaces at air temperature
  const longwaveDeltaMrt = (tSky, tSurf, fsvv) => 0.5 * (fsvv == null ? 1 : fsvv) * (tSky - tSurf);

  /* ---------------- UTCI (Broede et al. 2012 polynomial, as pythermalcomfort) ---------------- */
  function utciPoly(tdb, v, delta_t_tr, pa) { return (tdb + 0.607562052 + (-0.0227712343) * tdb + (8.06470249e-4) * tdb * tdb + (-1.54271372e-4) * tdb * tdb * tdb + (-3.24651735e-6) * tdb * tdb * tdb * tdb + (7.32602852e-8) * tdb * tdb * tdb * tdb * tdb + (1.35959073e-9) * tdb * tdb * tdb * tdb * tdb * tdb + (-2.25836520) * v + 0.0880326035 * tdb * v + 0.00216844454 * tdb * tdb * v + (-1.53347087e-5) * tdb * tdb * tdb * v + (-5.72983704e-7) * tdb * tdb * tdb * tdb * v + (-2.55090145e-9) * tdb * tdb * tdb * tdb * tdb * v + (-0.751269505) * v * v + (-0.00408350271) * tdb * v * v + (-5.21670675e-5) * tdb * tdb * v * v + (1.94544667e-6) * tdb * tdb * tdb * v * v + (1.14099531e-8) * tdb * tdb * tdb * tdb * v * v + 0.158137256 * v * v * v + (-6.57263143e-5) * tdb * v * v * v + (2.22697524e-7) * tdb * tdb * v * v * v + (-4.16117031e-8) * tdb * tdb * tdb * v * v * v + (-0.0127762753) * v * v * v * v + (9.66891875e-6) * tdb * v * v * v * v + (2.52785852e-9) * tdb * tdb * v * v * v * v + (4.56306672e-4) * v * v * v * v * v + (-1.74202546e-7) * tdb * v * v * v * v * v + (-5.91491269e-6) * v * v * v * v * v * v + 0.398374029 * delta_t_tr + (1.83945314e-4) * tdb * delta_t_tr + (-1.73754510e-4) * tdb * tdb * delta_t_tr + (-7.60781159e-7) * tdb * tdb * tdb * delta_t_tr + (3.77830287e-8) * tdb * tdb * tdb * tdb * delta_t_tr + (5.43079673e-10) * tdb * tdb * tdb * tdb * tdb * delta_t_tr + (-0.0200518269) * v * delta_t_tr + (8.92859837e-4) * tdb * v * delta_t_tr + (3.45433048e-6) * tdb * tdb * v * delta_t_tr + (-3.77925774e-7) * tdb * tdb * tdb * v * delta_t_tr + (-1.69699377e-9) * tdb * tdb * tdb * tdb * v * delta_t_tr + (1.69992415e-4) * v * v * delta_t_tr + (-4.99204314e-5) * tdb * v * v * delta_t_tr + (2.47417178e-7) * tdb * tdb * v * v * delta_t_tr + (1.07596466e-8) * tdb * tdb * tdb * v * v * delta_t_tr + (8.49242932e-5) * v * v * v * delta_t_tr + (1.35191328e-6) * tdb * v * v * v * delta_t_tr + (-6.21531254e-9) * tdb * tdb * v * v * v * delta_t_tr + (-4.99410301e-6) * v * v * v * v * delta_t_tr + (-1.89489258e-8) * tdb * v * v * v * v * delta_t_tr + (8.15300114e-8) * v * v * v * v * v * delta_t_tr + (7.55043090e-4) * delta_t_tr * delta_t_tr + (-5.65095215e-5) * tdb * delta_t_tr * delta_t_tr + (-4.52166564e-7) * tdb * tdb * delta_t_tr * delta_t_tr + (2.46688878e-8) * tdb * tdb * tdb * delta_t_tr * delta_t_tr + (2.42674348e-10) * tdb * tdb * tdb * tdb * delta_t_tr * delta_t_tr + (1.54547250e-4) * v * delta_t_tr * delta_t_tr + (5.24110970e-6) * tdb * v * delta_t_tr * delta_t_tr + (-8.75874982e-8) * tdb * tdb * v * delta_t_tr * delta_t_tr + (-1.50743064e-9) * tdb * tdb * tdb * v * delta_t_tr * delta_t_tr + (-1.56236307e-5) * v * v * delta_t_tr * delta_t_tr + (-1.33895614e-7) * tdb * v * v * delta_t_tr * delta_t_tr + (2.49709824e-9) * tdb * tdb * v * v * delta_t_tr * delta_t_tr + (6.51711721e-7) * v * v * v * delta_t_tr * delta_t_tr + (1.94960053e-9) * tdb * v * v * v * delta_t_tr * delta_t_tr + (-1.00361113e-8) * v * v * v * v * delta_t_tr * delta_t_tr + (-1.21206673e-5) * delta_t_tr * delta_t_tr * delta_t_tr + (-2.18203660e-7) * tdb * delta_t_tr * delta_t_tr * delta_t_tr + (7.51269482e-9) * tdb * tdb * delta_t_tr * delta_t_tr * delta_t_tr + (9.79063848e-11) * tdb * tdb * tdb * delta_t_tr * delta_t_tr * delta_t_tr + (1.25006734e-6) * v * delta_t_tr * delta_t_tr * delta_t_tr + (-1.81584736e-9) * tdb * v * delta_t_tr * delta_t_tr * delta_t_tr + (-3.52197671e-10) * tdb * tdb * v * delta_t_tr * delta_t_tr * delta_t_tr + (-3.36514630e-8) * v * v * delta_t_tr * delta_t_tr * delta_t_tr + (1.35908359e-10) * tdb * v * v * delta_t_tr * delta_t_tr * delta_t_tr + (4.17032620e-10) * v * v * v * delta_t_tr * delta_t_tr * delta_t_tr + (-1.30369025e-9) * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr + (4.13908461e-10) * tdb * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr + (9.22652254e-12) * tdb * tdb * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr + (-5.08220384e-9) * v * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr + (-2.24730961e-11) * tdb * v * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr + (1.17139133e-10) * v * v * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr + (6.62154879e-10) * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr + (4.03863260e-13) * tdb * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr + (1.95087203e-12) * v * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr + (-4.73602469e-12) * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr + 5.12733497 * pa + (-0.312788561) * tdb * pa + (-0.0196701861) * tdb * tdb * pa + (9.99690870e-4) * tdb * tdb * tdb * pa + (9.51738512e-6) * tdb * tdb * tdb * tdb * pa + (-4.66426341e-7) * tdb * tdb * tdb * tdb * tdb * pa + 0.548050612 * v * pa + (-0.00330552823) * tdb * v * pa + (-0.00164119440) * tdb * tdb * v * pa + (-5.16670694e-6) * tdb * tdb * tdb * v * pa + (9.52692432e-7) * tdb * tdb * tdb * tdb * v * pa + (-0.0429223622) * v * v * pa + 0.00500845667 * tdb * v * v * pa + (1.00601257e-6) * tdb * tdb * v * v * pa + (-1.81748644e-6) * tdb * tdb * tdb * v * v * pa + (-1.25813502e-3) * v * v * v * pa + (-1.79330391e-4) * tdb * v * v * v * pa + (2.34994441e-6) * tdb * tdb * v * v * v * pa + (1.29735808e-4) * v * v * v * v * pa + (1.29064870e-6) * tdb * v * v * v * v * pa + (-2.28558686e-6) * v * v * v * v * v * pa + (-0.0369476348) * delta_t_tr * pa + 0.00162325322 * tdb * delta_t_tr * pa + (-3.14279680e-5) * tdb * tdb * delta_t_tr * pa + (2.59835559e-6) * tdb * tdb * tdb * delta_t_tr * pa + (-4.77136523e-8) * tdb * tdb * tdb * tdb * delta_t_tr * pa + (8.64203390e-3) * v * delta_t_tr * pa + (-6.87405181e-4) * tdb * v * delta_t_tr * pa + (-9.13863872e-6) * tdb * tdb * v * delta_t_tr * pa + (5.15916806e-7) * tdb * tdb * tdb * v * delta_t_tr * pa + (-3.59217476e-5) * v * v * delta_t_tr * pa + (3.28696511e-5) * tdb * v * v * delta_t_tr * pa + (-7.10542454e-7) * tdb * tdb * v * v * delta_t_tr * pa + (-1.24382300e-5) * v * v * v * delta_t_tr * pa + (-7.38584400e-9) * tdb * v * v * v * delta_t_tr * pa + (2.20609296e-7) * v * v * v * v * delta_t_tr * pa + (-7.32469180e-4) * delta_t_tr * delta_t_tr * pa + (-1.87381964e-5) * tdb * delta_t_tr * delta_t_tr * pa + (4.80925239e-6) * tdb * tdb * delta_t_tr * delta_t_tr * pa + (-8.75492040e-8) * tdb * tdb * tdb * delta_t_tr * delta_t_tr * pa + (2.77862930e-5) * v * delta_t_tr * delta_t_tr * pa + (-5.06004592e-6) * tdb * v * delta_t_tr * delta_t_tr * pa + (1.14325367e-7) * tdb * tdb * v * delta_t_tr * delta_t_tr * pa + (2.53016723e-6) * v * v * delta_t_tr * delta_t_tr * pa + (-1.72857035e-8) * tdb * v * v * delta_t_tr * delta_t_tr * pa + (-3.95079398e-8) * v * v * v * delta_t_tr * delta_t_tr * pa + (-3.59413173e-7) * delta_t_tr * delta_t_tr * delta_t_tr * pa + (7.04388046e-7) * tdb * delta_t_tr * delta_t_tr * delta_t_tr * pa + (-1.89309167e-8) * tdb * tdb * delta_t_tr * delta_t_tr * delta_t_tr * pa + (-4.79768731e-7) * v * delta_t_tr * delta_t_tr * delta_t_tr * pa + (7.96079978e-9) * tdb * v * delta_t_tr * delta_t_tr * delta_t_tr * pa + (1.62897058e-9) * v * v * delta_t_tr * delta_t_tr * delta_t_tr * pa + (3.94367674e-8) * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr * pa + (-1.18566247e-9) * tdb * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr * pa + (3.34678041e-10) * v * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr * pa + (-1.15606447e-10) * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr * pa + (-2.80626406) * pa * pa + 0.548712484 * tdb * pa * pa + (-0.00399428410) * tdb * tdb * pa * pa + (-9.54009191e-4) * tdb * tdb * tdb * pa * pa + (1.93090978e-5) * tdb * tdb * tdb * tdb * pa * pa + (-0.308806365) * v * pa * pa + 0.0116952364 * tdb * v * pa * pa + (4.95271903e-4) * tdb * tdb * v * pa * pa + (-1.90710882e-5) * tdb * tdb * tdb * v * pa * pa + 0.00210787756 * v * v * pa * pa + (-6.98445738e-4) * tdb * v * v * pa * pa + (2.30109073e-5) * tdb * tdb * v * v * pa * pa + (4.17856590e-4) * v * v * v * pa * pa + (-1.27043871e-5) * tdb * v * v * v * pa * pa + (-3.04620472e-6) * v * v * v * v * pa * pa + 0.0514507424 * delta_t_tr * pa * pa + (-0.00432510997) * tdb * delta_t_tr * pa * pa + (8.99281156e-5) * tdb * tdb * delta_t_tr * pa * pa + (-7.14663943e-7) * tdb * tdb * tdb * delta_t_tr * pa * pa + (-2.66016305e-4) * v * delta_t_tr * pa * pa + (2.63789586e-4) * tdb * v * delta_t_tr * pa * pa + (-7.01199003e-6) * tdb * tdb * v * delta_t_tr * pa * pa + (-1.06823306e-4) * v * v * delta_t_tr * pa * pa + (3.61341136e-6) * tdb * v * v * delta_t_tr * pa * pa + (2.29748967e-7) * v * v * v * delta_t_tr * pa * pa + (3.04788893e-4) * delta_t_tr * delta_t_tr * pa * pa + (-6.42070836e-5) * tdb * delta_t_tr * delta_t_tr * pa * pa + (1.16257971e-6) * tdb * tdb * delta_t_tr * delta_t_tr * pa * pa + (7.68023384e-6) * v * delta_t_tr * delta_t_tr * pa * pa + (-5.47446896e-7) * tdb * v * delta_t_tr * delta_t_tr * pa * pa + (-3.59937910e-8) * v * v * delta_t_tr * delta_t_tr * pa * pa + (-4.36497725e-6) * delta_t_tr * delta_t_tr * delta_t_tr * pa * pa + (1.68737969e-7) * tdb * delta_t_tr * delta_t_tr * delta_t_tr * pa * pa + (2.67489271e-8) * v * delta_t_tr * delta_t_tr * delta_t_tr * pa * pa + (3.23926897e-9) * delta_t_tr * delta_t_tr * delta_t_tr * delta_t_tr * pa * pa + (-0.0353874123) * pa * pa * pa + (-0.221201190) * tdb * pa * pa * pa + 0.0155126038 * tdb * tdb * pa * pa * pa + (-2.63917279e-4) * tdb * tdb * tdb * pa * pa * pa + 0.0453433455 * v * pa * pa * pa + (-0.00432943862) * tdb * v * pa * pa * pa + (1.45389826e-4) * tdb * tdb * v * pa * pa * pa + (2.17508610e-4) * v * v * pa * pa * pa + (-6.66724702e-5) * tdb * v * v * pa * pa * pa + (3.33217140e-5) * v * v * v * pa * pa * pa + (-0.00226921615) * delta_t_tr * pa * pa * pa + (3.80261982e-4) * tdb * delta_t_tr * pa * pa * pa + (-5.45314314e-9) * tdb * tdb * delta_t_tr * pa * pa * pa + (-7.96355448e-4) * v * delta_t_tr * pa * pa * pa + (2.53458034e-5) * tdb * v * delta_t_tr * pa * pa * pa + (-6.31223658e-6) * v * v * delta_t_tr * pa * pa * pa + (3.02122035e-4) * delta_t_tr * delta_t_tr * pa * pa * pa + (-4.77403547e-6) * tdb * delta_t_tr * delta_t_tr * pa * pa * pa + (1.73825715e-6) * v * delta_t_tr * delta_t_tr * pa * pa * pa + (-4.09087898e-7) * delta_t_tr * delta_t_tr * delta_t_tr * pa * pa * pa + 0.614155345 * pa * pa * pa * pa + (-0.0616755931) * tdb * pa * pa * pa * pa + 0.00133374846 * tdb * tdb * pa * pa * pa * pa + 0.00355375387 * v * pa * pa * pa * pa + (-5.13027851e-4) * tdb * v * pa * pa * pa * pa + (1.02449757e-4) * v * v * pa * pa * pa * pa + (-0.00148526421) * delta_t_tr * pa * pa * pa * pa + (-4.11469183e-5) * tdb * delta_t_tr * pa * pa * pa * pa + (-6.80434415e-6) * v * delta_t_tr * pa * pa * pa * pa + (-9.77675906e-6) * delta_t_tr * delta_t_tr * pa * pa * pa * pa + 0.0882773108 * pa * pa * pa * pa * pa + (-0.00301859306) * tdb * pa * pa * pa * pa * pa + 0.00104452989 * v * pa * pa * pa * pa * pa + (2.47090539e-4) * delta_t_tr * pa * pa * pa * pa * pa + 0.00148348065 * pa * pa * pa * pa * pa * pa); }

  function utciPvap(tdb) { // hPa
    const g = [-2836.5744, -6028.076559, 19.54263612, -0.02737830188, 0.000016261698, 7.0229056e-10, -1.8680009e-13];
    const tk = tdb + 273.15; let es = 2.7150305 * Math.log(tk);
    for (let c = 0; c < 7; c++) es += g[c] * tk ** (c - 2);
    return Math.exp(es) * 0.01;
  }
  function utci(tdb, tr, v, rh) {
    if (!(tdb >= -50 && tdb <= 50) || !(tr - tdb >= -30 && tr - tdb <= 70)) return NaN;
    const vv = Math.max(0.5, Math.min(17, v));
    const pa = utciPvap(tdb) * rh / 100 / 10;
    return utciPoly(tdb, vv, tr - tdb, pa);
  }
  const UTCI_CLASSES = [
    [-Infinity, -40, "extreme cold stress"], [-40, -27, "very strong cold stress"], [-27, -13, "strong cold stress"], [-13, 0, "moderate cold stress"],
    [0, 9, "slight cold stress"], [9, 26, "no thermal stress"], [26, 32, "moderate heat stress"], [32, 38, "strong heat stress"], [38, 46, "very strong heat stress"], [46, Infinity, "extreme heat stress"]];
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
  const api = { FINGERPRINT: "104ba3161862", prepWeather, futureDelta, morphWeather, urbanHeatIsland, regionOf, futRegion, regName, fileYears, isNWEurope, AIRPORT, FUT_LEVELS, futLab, UHI_PRESETS, REG_NAMES, pws, dewFromPw, humRatio, pwFromW, enthalpy, wetBulb, solarArrays, sunPosition, T, poa, dniExtra, airmassKY, perezSkyClearness, fpStanding, solarCalDeltaMrt, FP_STANDING, ALT_RANGE, AZ_RANGE, SIGMA, skyTemperature, longwaveDeltaMrt, utci, utciPoly, utciPvap, UTCI_CLASSES };
  root.ClimaMods = api; // also global in Node, so code that embeds this core (Micro Clima's engine) finds it there too
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
