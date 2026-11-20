/* Macro Clima calculation core.
   Stateless functions: EPW parsing, solar geometry at the interval midpoint, psychrometrics,
   Perez irradiation on surfaces, SolarCal mean radiant temperature with measured diffuse and
   reflected radiation, UTCI, PMV, adaptive comfort, degree days, extremes, water, daylight and
   Givoni-Milne strategy zones (Climate Consultant criteria). Runs in the page and in Node. */
(function (root) {
  "use strict";
  const N = 8760, D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const MSTART = MDAYS.reduce((a, d, i) => (a.push(i ? a[i - 1] + MDAYS[i - 1] : 0), a), []);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  /* ---------------- EPW ---------------- */
  // field index, key, missing code (value at or above which the field is missing), unit
  const FIELDS = [
    [6, "dbt", 99.9], [7, "dpt", 99.9], [8, "rh", 999], [9, "p", 999999], [10, "etrh", 9999], [11, "etrn", 9999],
    [12, "hir", 9999], [13, "ghi", 9999], [14, "dni", 9999], [15, "dhi", 9999], [16, "gil", 999900], [17, "dnil", 999900],
    [18, "dil", 999900], [19, "zl", 9999], [20, "wd", 999], [21, "ws", 999], [22, "tsc", 99], [23, "osc", 99],
    [24, "vis", 9999], [25, "ceil", 99999], [28, "pw", 999], [29, "aod", 0.999], [30, "snow", 999], [31, "dss", 99],
    [32, "alb", 999], [33, "prec", 999], [34, "precr", 99]];
  const FILL_INTERP = new Set(["dbt", "dpt", "rh", "p", "ws", "tsc", "osc", "hir", "vis", "pw", "alb"]);

  function parseEPW(text, fileName) {
    const lines = text.replace(/\r/g, "").split("\n");
    const head = {}, comments = [];
    let i = 0;
    for (; i < Math.min(lines.length, 12); i++) {
      const L = lines[i];
      if (/^\s*-?\d{4},\s*\d{1,2},\s*\d{1,2},/.test(L)) break;
      const k = L.split(",")[0].trim().toUpperCase();
      head[k] = L;
      if (k.startsWith("COMMENTS")) comments.push(L.slice(L.indexOf(",") + 1).trim());
    }
    if (!head.LOCATION) throw new Error("This file has no LOCATION line, so it is not a valid EPW file.");
    const loc = head.LOCATION.split(",");
    const meta = {
      file: fileName || "", city: (loc[1] || "").trim(), state: (loc[2] || "").trim(), country: (loc[3] || "").trim(),
      source: (loc[4] || "").trim(), wmo: (loc[5] || "").trim(), lat: +loc[6], lon: +loc[7], tz: +loc[8], elev: +loc[9], comments
    };
    if (!isFinite(meta.lat) || !isFinite(meta.lon) || Math.abs(meta.lat) > 90 || Math.abs(meta.lon) > 180) throw new Error("The LOCATION line has no valid latitude and longitude.");
    if (!isFinite(meta.tz) || Math.abs(meta.tz) > 14) throw new Error("The LOCATION line has no valid time zone.");
    let perHour = 1;
    if (head["DATA PERIODS"]) { const dp = head["DATA PERIODS"].split(","); perHour = Math.max(1, parseInt(dp[2], 10) || 1); }
    meta.dataPeriods = head["DATA PERIODS"] ? head["DATA PERIODS"].split(",").slice(1).join(",") : "";
    meta.typical = head["TYPICAL/EXTREME PERIODS"] || "";
    meta.design = head["DESIGN CONDITIONS"] || "";
    meta.ground = head["GROUND TEMPERATURES"] || "";
    // data rows
    const rows = [];
    for (; i < lines.length; i++) { const L = lines[i]; if (!L.trim()) continue; const f = L.split(","); if (f.length < 22) throw new Error(`Row ${i + 1} has ${f.length} fields; an EPW data row has 35.`); rows.push(f); }
    const expect = 8760 * perHour, expectLeap = 8784 * perHour;
    if (rows.length !== expect && rows.length !== expectLeap) throw new Error(`The file has ${rows.length} data rows; a full year has ${expect} (or ${expectLeap} in a leap year).`);
    const notes = [];
    let keep = rows;
    if (rows.length === expectLeap) {
      keep = rows.filter((f) => !(+f[1] === 2 && +f[2] === 29));
      if (keep.length !== expect) throw new Error("The leap-year file could not be reduced to 365 days.");
      notes.push("The file covers a leap year. 29 February was removed so that every chart has 365 days.");
    }
    const W = { meta, notes, missing: {}, filled: {}, flags: {} };
    for (const [, k] of FIELDS) W[k] = new Float32Array(N);
    const raw = {}; for (const [, k] of FIELDS) raw[k] = new Float32Array(N);
    const years = new Map();
    const flagCount = new Map();
    for (let h = 0; h < N; h++) {
      const block = keep.slice(h * perHour, (h + 1) * perHour);
      for (const [idx, k, miss] of FIELDS) {
        let s = 0, n = 0, bad = 0;
        for (const f of block) { const v = parseFloat(f[idx]); if (!isFinite(v) || v >= miss || (k === "aod" && v >= 0.999)) bad++; else { s += v; n++; } }
        // precipitation sums over sub-hourly rows; everything else is averaged
        raw[k][h] = n ? (k === "prec" ? s : s / n) : NaN;
        if (bad === block.length) W.missing[k] = (W.missing[k] || 0) + 1;
      }
      const y = +block[0][0]; years.set(y, (years.get(y) || 0) + 1);
      const fl = (block[0][5] || "").trim(); if (fl) flagCount.set(fl, (flagCount.get(fl) || 0) + 1);
    }
    if (perHour > 1) notes.push(`The file holds ${perHour} records per hour. They were averaged to hourly values (precipitation summed).`);
    // check the first row starts on 1 January
    if (+keep[0][1] !== 1 || +keep[0][2] !== 1) notes.push(`The data start on ${keep[0][2]}/${keep[0][1]} rather than 1 January; rows were read in file order.`);
    // fill: interpolate short gaps for continuous variables, zero for radiation at night
    for (const [, k] of FIELDS) {
      const a = raw[k]; let nMiss = 0;
      for (let h = 0; h < N; h++) if (!isFinite(a[h])) nMiss++;
      if (nMiss === 0) { W[k].set(a); continue; }
      if (nMiss === N) { W[k].fill(NaN); W.filled[k] = 0; continue; }
      if (FILL_INTERP.has(k)) { interpGaps(a); W.filled[k] = nMiss; }
      W[k].set(a);
    }
    // relative humidity from dew point where only one is present
    W.years = [...years.entries()].sort((a, b) => b[1] - a[1]);
    W.flagTop = [...flagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    return W;
  }
  function interpGaps(a) {
    const n = a.length; let last = -1;
    for (let i = 0; i < n; i++) {
      if (isFinite(a[i])) {
        if (last >= 0 && i - last > 1) for (let j = last + 1; j < i; j++) a[j] = a[last] + (a[i] - a[last]) * (j - last) / (i - last);
        else if (last < 0 && i > 0) for (let j = 0; j < i; j++) a[j] = a[i];
        last = i;
      }
    }
    if (last >= 0) for (let j = last + 1; j < n; j++) a[j] = a[last];
  }

  /* ---------------- time ---------------- */
  function timeArrays() {
    const month = new Uint8Array(N), day = new Uint8Array(N), hour = new Uint8Array(N), doy = new Uint16Array(N);
    for (let d = 0; d < 365; d++) {
      let m = 0; while (m < 11 && d >= MSTART[m + 1]) m++;
      for (let h = 0; h < 24; h++) { const i = d * 24 + h; month[i] = m + 1; day[i] = d - MSTART[m] + 1; hour[i] = h; doy[i] = d + 1; }
    }
    return { month, day, hour, doy };
  }
  const T = timeArrays();

  /* ---------------- solar position (NOAA / Meeus), at the interval midpoint ---------------- */
  // EPW hour h (1-24) is the interval ending at h, local standard time. The sun is placed at h - 0.5.
  // year: a fixed non-leap reference year; the composite years of a typical file move the sun by seconds.
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
  // sun path lines: hourly positions on the 21st of each month, at whole hours (for drawing)
  function sunPathLines(lat, lon, tz) {
    const days = [], hours = [];
    for (let m = 0; m < 12; m++) { const doy = MSTART[m] + 21, pts = []; for (let k = 0; k <= 24 * 6; k++) { const h = k / 6, s = sunPosition(lat, lon, tz, doy, h); pts.push([s.alt, s.az]); } days.push({ m, pts }); }
    for (let h = 0; h < 24; h++) { const pts = []; for (let d = 1; d <= 365; d += 3) { const s = sunPosition(lat, lon, tz, d, h); pts.push([s.alt, s.az]); } hours.push({ h, pts }); }
    return { days, hours };
  }

  /* ---------------- psychrometrics (ASHRAE Fundamentals) ---------------- */
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
  function psychroArrays(W) {
    const w = new Float32Array(N), twb = new Float32Array(N), h = new Float32Array(N), pv = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const p = isFinite(W.p[i]) ? W.p[i] : 101325;
      let e = pws(W.dpt[i]);
      if (!isFinite(e)) e = pws(W.dbt[i]) * W.rh[i] / 100;
      pv[i] = e; w[i] = humRatio(e, p); h[i] = enthalpy(W.dbt[i], w[i]); twb[i] = wetBulb(W.dbt[i], w[i], p);
    }
    return { w, twb, h, pv };
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
    let sky = 0;
    const am = airmassKY(zen);
    if (dhi > 0 && isFinite(am)) {
      const eps = perezSkyClearness(dhi, dni, zen);
      let b = 0; while (b < 7 && eps >= EBIN[b]) b++;
      const delta = dhi * am / dniExtra(doy);
      const F1 = Math.max(0, F1C[b][0] + F1C[b][1] * delta + F1C[b][2] * zr), F2 = F2C[b][0] + F2C[b][1] * delta + F2C[b][2] * zr;
      const B = Math.max(Math.cos(zr), Math.cos(85 * D2R));
      sky = Math.max(0, dhi * (0.5 * (1 - F1) * (1 + Math.cos(tr)) + F1 * A / B + F2 * Math.sin(tr)));
    } else if (dhi > 0) sky = dhi * 0.5 * (1 + Math.cos(tr));
    const gnd = ghi * albedo * (1 - Math.cos(tr)) * 0.5;
    return { tot: beam + sky + gnd, beam, sky, gnd };
  }
  const ORIENT = [["N", 0], ["NE", 45], ["E", 90], ["SE", 135], ["S", 180], ["SW", 225], ["W", 270], ["NW", 315]];
  function surfaceIrradiation(W, S, opt) {
    opt = opt || {};
    const out = {};
    const albedoOf = (i) => (opt.albedo != null ? opt.albedo : (W.alb[i] > 0 && W.alb[i] < 1 ? W.alb[i] : 0.2));
    const surfaces = ORIENT.map(([n, a]) => ({ key: n, tilt: 90, az: a })).concat([{ key: "Roof", tilt: 0, az: 180 }]);
    for (const s of surfaces) {
      const hourly = new Float32Array(N); let beam = 0, sky = 0, gnd = 0, albS = 0, albN = 0;
      for (let i = 0; i < N; i++) {
        if (S.zen[i] >= 90 && !(W.dhi[i] > 0)) continue;
        const r = s.tilt === 0 ? { tot: W.ghi[i] > 0 ? W.ghi[i] : 0, beam: 0, sky: 0, gnd: 0 } : poa(s.tilt, s.az, S.zen[i], S.az[i], W.dni[i], W.dhi[i], W.ghi[i], T.doy[i], albedoOf(i));
        hourly[i] = r.tot; beam += r.beam / 1000; sky += r.sky / 1000; gnd += r.gnd / 1000; if (W.ghi[i] > 0) { albS += albedoOf(i); albN++; }
      }
      const monthly = new Array(12).fill(0); let annual = 0;
      for (let i = 0; i < N; i++) { monthly[T.month[i] - 1] += hourly[i] / 1000; annual += hourly[i] / 1000; }
      out[s.key] = { hourly, monthly, annual, beamShare: annual ? beam / annual : 0, skyShare: annual ? sky / annual : 0, gndShare: annual ? gnd / annual : 0, albedo: albN ? albS / albN : 0.2, tilt: s.tilt, az: s.az };
    }
    return out;
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
  // the original pythermalcomfort form, for the comparison in the verification report
  function solarCalDeltaMrtCBE(alt, dni) {
    const fEff = 0.725, hr = 6, asw = 0.7, lw = 0.95, a = Math.max(0, alt), iDir = alt > 0 ? dni : 0, iDiff = 0.2 * iDir;
    const fp = fpStanding(a, 45);
    const e = fEff * 0.5 * iDiff + fEff * fp * iDir + fEff * 0.5 * (iDir * Math.sin(a * D2R) + iDiff) * 0.6;
    return e * (asw / lw) / (hr * fEff);
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
  const utciClass = (u) => { if (!isFinite(u)) return -1; for (let k = 0; k < UTCI_CLASSES.length; k++) if (u < UTCI_CLASSES[k][1]) return k; return 9; };

  /* ---------------- PMV (ISO 7730, as pythermalcomfort pmv_ppd_iso) ---------------- */
  function pmv(ta, tr, vel, rh, met, clo, wme) {
    wme = wme || 0;
    const pa = rh * 10 * Math.exp(16.6536 - 4030.183 / (ta + 235));
    const icl = 0.155 * clo, m = met * 58.15, w = wme * 58.15, mw = m - w;
    const fcl = icl <= 0.078 ? 1 + 1.29 * icl : 1.05 + 0.645 * icl;
    const hcf = 12.1 * Math.sqrt(vel), taa = ta + 273, tra = tr + 273;
    const tcla = taa + (35.5 - ta) / (3.5 * icl + 0.1);
    const p1 = icl * fcl, p2 = p1 * 3.96, p3 = p1 * 100, p4 = p1 * taa, p5 = 308.7 - 0.028 * mw + p2 * (tra / 100) ** 4;
    let xn = tcla / 100, xf = tcla / 50, n = 0, hc = hcf;
    while (Math.abs(xn - xf) > 0.00015) {
      xf = (xf + xn) / 2; const hcn = 2.38 * Math.abs(100 * xf - taa) ** 0.25; hc = hcf > hcn ? hcf : hcn;
      xn = (p5 + p4 * hc - p2 * xf ** 4) / (100 + p3 * hc); if (++n > 150) return NaN;
    }
    const tcl = 100 * xn - 273;
    const hl1 = 3.05 * 0.001 * (5733 - 6.99 * mw - pa), hl2 = mw > 58.15 ? 0.42 * (mw - 58.15) : 0, hl3 = 1.7 * 0.00001 * m * (5867 - pa), hl4 = 0.0014 * m * (34 - ta), hl5 = 3.96 * fcl * (xn ** 4 - (tra / 100) ** 4), hl6 = fcl * hc * (tcl - ta);
    const ts = 0.303 * Math.exp(-0.036 * m) + 0.028;
    return ts * (mw - hl1 - hl2 - hl3 - hl4 - hl5 - hl6);
  }

  /* ---------------- adaptive comfort (EN 16798-1, ASHRAE 55, DIN EN 16798-1/NA) as in Room Design Guide ---------------- */
  function dailyStats(a) {
    const mean = new Float32Array(365), min = new Float32Array(365), max = new Float32Array(365);
    for (let d = 0; d < 365; d++) { let s = 0, lo = Infinity, hi = -Infinity; for (let h = 0; h < 24; h++) { const v = a[d * 24 + h]; s += v; if (v < lo) lo = v; if (v > hi) hi = v; } mean[d] = s / 24; min[d] = lo; max[d] = hi; }
    return { mean, min, max };
  }
  function runningMeanEN(dm, alpha) {
    const a = alpha == null ? 0.8 : alpha, out = new Float32Array(365); let rm = dm.reduce((s, x) => s + x, 0) / 365;
    for (let pass = 0; pass < 2; pass++) for (let k = 0; k < 365; k++) { rm = (1 - a) * dm[(k + 364) % 365] + a * rm; out[k] = rm; }
    return out;
  }
  function prevailingMean(dm, n) { const days = n || 7, out = new Float32Array(365); for (let k = 0; k < 365; k++) { let s = 0; for (let j = 1; j <= days; j++) s += dm[(k - j + 730) % 365]; out[k] = s / days; } return out; }
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  function adaptiveBands(dm) {
    const rmEN = runningMeanEN(dm, 0.8), rmA = prevailingMean(dm, 7);
    const en = { lo: new Float32Array(365), hi: new Float32Array(365), valid: new Uint8Array(365) };
    const ash = { lo: new Float32Array(365), hi: new Float32Array(365), valid: new Uint8Array(365) };
    const na = { lo: new Float32Array(365), hi: new Float32Array(365), valid: new Uint8Array(365) };
    for (let d = 0; d < 365; d++) {
      const r = rmEN[d]; en.hi[d] = 0.33 * clamp(r, 10, 30) + 18.8 + 3; en.lo[d] = 0.33 * clamp(r, 15, 30) + 18.8 - 4; en.valid[d] = r >= 10 && r <= 30 ? 1 : 0; // category II
      const cm = 0.31 * clamp(rmA[d], 10, 33.5) + 17.8; ash.hi[d] = cm + 3.5; ash.lo[d] = cm - 3.5; ash.valid[d] = rmA[d] >= 10 && rmA[d] <= 33.5 ? 1 : 0; // 80 % acceptability
      const nc = r <= 16 ? 22 : r >= 32 ? 26 : 18 + 0.25 * r; na.hi[d] = nc + 2; na.lo[d] = nc - 2; na.valid[d] = 1; // category II
    }
    return { rmEN, rmA, en, ash, na };
  }

  /* ---------------- degree days ---------------- */
  function degreeDays(dm, base, mode) { // mode heat|cool, from daily means, monthly sums
    const m = new Array(12).fill(0);
    for (let d = 0; d < 365; d++) { const mo = T.month[d * 24] - 1, x = mode === "heat" ? base - dm[d] : dm[d] - base; if (x > 0) m[mo] += x; }
    return { monthly: m, annual: m.reduce((a, b) => a + b, 0) };
  }
  function gradtagzahl(dm, ti, th) { // German G20/15: sum of (20 - mean) on days with mean below 15
    ti = ti == null ? 20 : ti; th = th == null ? 15 : th; const m = new Array(12).fill(0); let days = 0;
    for (let d = 0; d < 365; d++) if (dm[d] < th) { m[T.month[d * 24] - 1] += ti - dm[d]; days++; }
    return { monthly: m, annual: m.reduce((a, b) => a + b, 0), heatingDays: days };
  }

  /* ---------------- extremes ---------------- */
  function runs(flags) { // list of [start, length] of consecutive true days
    const out = []; let s = -1;
    for (let d = 0; d <= flags.length; d++) { if (d < flags.length && flags[d]) { if (s < 0) s = d; } else if (s >= 0) { out.push([s, d - s]); s = -1; } }
    // wrap from 31 Dec to 1 Jan
    if (out.length > 1 && out[0][0] === 0 && out[out.length - 1][0] + out[out.length - 1][1] === flags.length) { const last = out.pop(); out[0] = [last[0], last[1] + out[0][1]]; }
    return out;
  }
  function extremes(W, ds) {
    const n = (f) => { let c = 0; for (let d = 0; d < 365; d++) if (f(d)) c++; return c; };
    const r = {
      summerDays: n((d) => ds.max[d] >= 25), hotDays: n((d) => ds.max[d] >= 30), veryHotDays: n((d) => ds.max[d] >= 35),
      tropicalNights: n((d) => ds.min[d] >= 20), frostDays: n((d) => ds.min[d] < 0), iceDays: n((d) => ds.max[d] < 0)
    };
    const hot = runs(Array.from({ length: 365 }, (_, d) => ds.max[d] >= 30)).filter((x) => x[1] >= 3);
    const cold = runs(Array.from({ length: 365 }, (_, d) => ds.mean[d] <= 0)).filter((x) => x[1] >= 3);
    r.heatSpells = hot; r.coldSpells = cold;
    // hottest and coldest 7-day period (daily means, wrapping the year)
    let best = -Infinity, worst = Infinity, bi = 0, wi = 0;
    for (let d = 0; d < 365; d++) { let s = 0; for (let k = 0; k < 7; k++) s += ds.mean[(d + k) % 365]; s /= 7; if (s > best) { best = s; bi = d; } if (s < worst) { worst = s; wi = d; } }
    r.hottestWeek = { start: bi, mean: best }; r.coldestWeek = { start: wi, mean: worst };
    let imax = 0, imin = 0; for (let i = 0; i < N; i++) { if (W.dbt[i] > W.dbt[imax]) imax = i; if (W.dbt[i] < W.dbt[imin]) imin = i; }
    r.tMax = { i: imax, v: W.dbt[imax] }; r.tMin = { i: imin, v: W.dbt[imin] };
    let sw = 0, swd = 0, swSum = 0; for (let d = 0; d < 365; d++) { const x = ds.max[d] - ds.min[d]; swSum += x; if (x > sw) { sw = x; swd = d; } }
    r.maxSwing = { d: swd, v: sw }; r.meanSwing = swSum / 365;
    // overcast days: daily mean total sky cover of 8 tenths or more, or a daily clearness index below 0.3 where cover is missing
    const tscOK = !(W.missing.tsc >= N * 0.5) && Array.from(W.tsc).some((v) => v > 0);
    const over = new Array(365).fill(false);
    for (let d = 0; d < 365; d++) {
      if (tscOK) { let s = 0, c = 0; for (let h = 7; h < 19; h++) { const v = W.tsc[d * 24 + h]; if (isFinite(v)) { s += v; c++; } } over[d] = c && s / c >= 8; }
      else { let g = 0, e = 0; for (let h = 0; h < 24; h++) { const i = d * 24 + h; if (W.ghi[i] > 0) g += W.ghi[i]; if (W.etrh[i] > 0) e += W.etrh[i]; } over[d] = e > 0 && g / e < 0.3; }
    }
    const ov = runs(over); r.overcastDays = over.filter(Boolean).length; r.overcastBasis = tscOK ? "sky cover" : "clearness index";
    r.longestOvercast = ov.length ? ov.reduce((a, b) => (b[1] > a[1] ? b : a)) : [0, 0];
    return r;
  }

  /* ---------------- wind ---------------- */
  const WIND_BINS = [0.5, 2, 4, 6, 8, 10, Infinity];
  function windRose(W, mask, nSect) {
    nSect = nSect || 16;
    const step = 360 / nSect, counts = Array.from({ length: nSect }, () => new Array(WIND_BINS.length).fill(0));
    let calm = 0, total = 0, vs = 0;
    for (let i = 0; i < N; i++) {
      if (mask && !mask[i]) continue; const v = W.ws[i], d = W.wd[i]; if (!isFinite(v)) continue; total++; vs += v;
      if (v < 0.5 || !isFinite(d)) { calm++; continue; }
      const s = Math.floor(((d + step / 2) % 360) / step);
      let b = 1; while (b < WIND_BINS.length - 1 && v >= WIND_BINS[b]) b++;
      counts[s][b]++;
    }
    return { counts, calm, total, mean: total ? vs / total : 0, nSect, step };
  }
  function seasonOf(month, lat) { // meteorological seasons, flipped south of the equator
    const s = month === 12 || month <= 2 ? 0 : month <= 5 ? 1 : month <= 8 ? 2 : 3; // DJF MAM JJA SON
    const names = lat >= 0 ? ["Winter", "Spring", "Summer", "Autumn"] : ["Summer", "Autumn", "Winter", "Spring"];
    return { idx: s, name: names[s] };
  }

  /* ---------------- water ---------------- */
  // ISO 15927-3 airfield index: I = 2/9 * sum(v * r^(8/9) * cos(D - theta)), l/m2, hours with rain and wind onto the wall
  function drivingRain(W) {
    const out = {};
    for (const [n, a] of ORIENT) {
      let s = 0; const m = new Array(12).fill(0);
      for (let i = 0; i < N; i++) { const r = W.prec[i], v = W.ws[i], d = W.wd[i]; if (!(r > 0) || !(v > 0) || !isFinite(d)) continue; const c = Math.cos((d - a) * D2R); if (c <= 0) continue; const x = (2 / 9) * v * r ** (8 / 9) * c; s += x; m[T.month[i] - 1] += x; }
      out[n] = { annual: s, monthly: m };
    }
    return out;
  }

  /* ---------------- Givoni-Milne strategy zones, Climate Consultant criteria ---------------- */
  // Values follow the Climate Consultant 6 criteria screen as reconstructed for this app; each one is editable
  // in the page and listed in the guide. Comfort: ASHRAE 55 PMV model, met 1.1, clo 0.5 summer and 1.0 winter.
  const CC_DEFAULT = {
    comfort: { met: 1.1, cloS: 0.5, cloW: 1.0, v: 0.1, pmv: 0.5, wMax: 0.012, wMin: 0 },
    shade: { tMin: 23.9, ghiMin: 315 },
    mass: { dT: 8.3 },
    massNight: { dT: 16.7, nightBelow: 2.8 },
    evap: { wbMax: 20.0, tMax: 40.0 },
    evap2: { wbMax: 22.0, tMax: 43.0 },
    natVent: { dT: 3.0, rhMax: 90 },
    fan: { dT: 2.5, rhMax: 90 },
    internal: { balance: 12.8 },
    solarLow: { irrMin: 157, hours: 3, dT: 6.0 },
    solarHigh: { irrMin: 157, hours: 12, dT: 9.0 },
    windProt: { vMin: 8.5, tMax: 11.7 },
    humid: { wMin: 0.004 }
  };
  const CC_KEYS = [
    ["comfort", "Comfort"], ["dehumid", "Dehumidification only"], ["humid", "Humidification only"], ["internal", "Internal heat gain"],
    ["solarLow", "Passive solar direct gain, low mass"], ["solarHigh", "Passive solar direct gain, high mass"], ["fan", "Fan-forced ventilation cooling"],
    ["natVent", "Natural ventilation cooling"], ["mass", "High thermal mass"], ["massNight", "High thermal mass, night flushed"],
    ["evap", "Direct evaporative cooling"], ["evap2", "Two-stage evaporative cooling"], ["shade", "Sun shading of windows"],
    ["windProt", "Wind protection of outdoor spaces"], ["heat", "Heating, plus humidification if needed"], ["cool", "Cooling, plus dehumidification if needed"]];
  // comfort temperature limits as a function of humidity ratio, from the PMV model
  function comfortCurves(P, p) {
    p = p || 101325; const c = P.comfort, grid = [];
    const solve = (w, clo, target) => { let lo = 5, hi = 40; for (let k = 0; k < 40; k++) { const t = (lo + hi) / 2; const ps = pws(t), pw = pwFromW(w, p), rh = Math.min(100, 100 * pw / ps); const v = pmv(t, t, c.v, rh, c.met, clo); if (v > target) hi = t; else lo = t; } return (lo + hi) / 2; };
    for (let w = 0; w <= 0.0301; w += 0.0005) {
      const wLo = solve(w, c.cloW, -c.pmv), wHi = solve(w, c.cloW, c.pmv), sLo = solve(w, c.cloS, -c.pmv), sHi = solve(w, c.cloS, c.pmv);
      grid.push({ w, wLo, wHi, sLo, sHi, lo: Math.min(wLo, sLo), hi: Math.max(wHi, sHi) });
    }
    return grid;
  }
  function curveAt(grid, w) { const k = Math.max(0, Math.min(grid.length - 2, Math.floor(w / 0.0005))), a = grid[k], b = grid[k + 1], f = Math.max(0, Math.min(1, (w - a.w) / 0.0005)); const o = {}; for (const key of ["wLo", "wHi", "sLo", "sHi", "lo", "hi"]) o[key] = a[key] + (b[key] - a[key]) * f; return o; }
  function strategyZones(W, X, opt) {
    const P = opt && opt.params ? opt.params : CC_DEFAULT;
    const grid = comfortCurves(P);
    const S = {}; for (const [k] of CC_KEYS) S[k] = new Uint8Array(N);
    const south = X.surf && X.surf[W.meta.lat >= 0 ? "S" : "N"] ? X.surf[W.meta.lat >= 0 ? "S" : "N"].hourly : null;
    const ds = X.daily;
    for (let i = 0; i < N; i++) {
      const t = W.dbt[i], w = X.w[i], rh = W.rh[i], wb = X.twb[i], d = (i / 24) | 0;
      const cv = curveAt(grid, w);
      const inT = (t >= cv.wLo && t <= cv.wHi) || (t >= cv.sLo && t <= cv.sHi);
      const lo = cv.lo, hi = cv.hi;
      const wOK = w <= P.comfort.wMax;
      if (inT && wOK && w >= P.comfort.wMin) S.comfort[i] = 1;
      if (inT && !wOK) S.dehumid[i] = 1;
      if (inT && w < P.humid.wMin) S.humid[i] = 1;
      if (t >= P.internal.balance && t < lo) S.internal[i] = 1;
      if (south && t < lo) {
        const avg = (n) => { let s = 0; for (let k = 0; k < n; k++) s += south[(i - k + N) % N]; return s / n; };
        if (t >= lo - P.solarLow.dT && avg(P.solarLow.hours) >= P.solarLow.irrMin) S.solarLow[i] = 1;
        if (t >= lo - P.solarHigh.dT && avg(P.solarHigh.hours) >= P.solarHigh.irrMin) S.solarHigh[i] = 1;
      }
      if (t > hi && wOK) {
        if (t <= hi + P.fan.dT && rh <= P.fan.rhMax) S.fan[i] = 1;
        if (t <= hi + P.natVent.dT && rh <= P.natVent.rhMax) S.natVent[i] = 1;
        if (t <= hi + P.mass.dT && ds.mean[d] <= hi) S.mass[i] = 1;
        if (t <= hi + P.massNight.dT && ds.min[d] <= hi - P.massNight.nightBelow) S.massNight[i] = 1;
        if (wb <= P.evap.wbMax && t <= P.evap.tMax) S.evap[i] = 1;
        if (wb <= P.evap2.wbMax && t <= P.evap2.tMax) S.evap2[i] = 1;
      }
      if (t >= P.shade.tMin && W.ghi[i] >= P.shade.ghiMin) S.shade[i] = 1;
      if (W.ws[i] >= P.windProt.vMin && t <= P.windProt.tMax) S.windProt[i] = 1;
      const anyPassive = S.comfort[i] || S.internal[i] || S.solarLow[i] || S.solarHigh[i] || S.fan[i] || S.natVent[i] || S.mass[i] || S.massNight[i] || S.evap[i] || S.evap2[i] || S.dehumid[i] || S.humid[i];
      if (!anyPassive) { if (t <= (lo + hi) / 2) S.heat[i] = 1; else S.cool[i] = 1; }
    }
    const hours = {}; for (const [k] of CC_KEYS) { let c = 0; for (let i = 0; i < N; i++) c += S[k][i]; hours[k] = c; }
    return { S, hours, grid, params: P };
  }
  function strategyCover(Z, keys) { const out = new Uint8Array(N); let n = 0; for (let i = 0; i < N; i++) { for (const k of keys) if (Z.S[k][i]) { out[i] = 1; break; } n += out[i]; } return { mask: out, hours: n }; }

  /* ---------------- daylight ---------------- */
  function skyClass(eps) { if (!isFinite(eps)) return -1; return eps < 1.23 ? 0 : eps < 4.5 ? 1 : 2; } // overcast, intermediate, clear

  /* ---------------- process a file ---------------- */



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
  /* ---------- PV potential: PVWatts v5 chain, fixed assumptions ----------
     plane of array: Perez 1990 as above; incidence angle: Martin & Ruiz (a_r 0.16), beam and diffuse (IEC 61853-3);
     cell temperature: Faiman (U0 25, U1 6.84); DC: PVWatts, -0.37 %/K; system losses 14 %; inverter: PVWatts, 96 % nominal, DC/AC 1.2.
     Output per kWp of DC capacity. */
  const PV = { blocks: 3, eff: 0.2, ar: 0.16, u0: 25, u1: 6.84, gamma: -0.0037, loss: 0.14, etaNom: 0.96, etaRef: 0.9637, dcac: 1.2 };
  function pvPrep(W, S) {
    const idx = [];
    for (let i = 0; i < N; i++) if ((S.zen[i] < 90 && W.ghi[i] > 0) || W.dhi[i] > 0) idx.push(i);
    const n = idx.length, f = () => new Float64Array(n);
    const P = { idx, n, cz: f(), sz: f(), saz: f(), dni: f(), dhi: f(), ghi: f(), alb: f(), F1: f(), F2: f(), B: f(), zr: f(), ta: f(), ws: f(), iso: new Uint8Array(n), m: new Uint8Array(n) };
    for (let k = 0; k < n; k++) {
      const i = idx[k], zen = S.zen[i], zr = zen * D2R; P.zr[k] = zr; P.cz[k] = Math.cos(zr); P.sz[k] = Math.sin(zr); P.saz[k] = S.az[i] * D2R;
      P.dni[k] = zen < 90 && W.dni[i] > 0 ? W.dni[i] : 0; P.dhi[k] = W.dhi[i] > 0 ? W.dhi[i] : 0; P.ghi[k] = W.ghi[i] > 0 ? W.ghi[i] : 0;
      P.alb[k] = W.alb[i] > 0 && W.alb[i] < 1 ? W.alb[i] : 0.2; P.ta[k] = W.dbt[i]; P.ws[k] = W.ws[i] > 0 ? W.ws[i] : 0; P.m[k] = T.month[i] - 1;
      const am = airmassKY(zen);
      if (P.dhi[k] > 0 && isFinite(am)) {
        const eps = perezSkyClearness(P.dhi[k], P.dni[k], zen); let b = 0; while (b < 7 && eps >= EBIN[b]) b++;
        const delta = P.dhi[k] * am / dniExtra(T.doy[i]);
        P.F1[k] = Math.max(0, F1C[b][0] + F1C[b][1] * delta + F1C[b][2] * zr); P.F2[k] = F2C[b][0] + F2C[b][1] * delta + F2C[b][2] * zr; P.B[k] = Math.max(P.cz[k], Math.cos(85 * D2R));
      } else P.iso[k] = 1;
    }
    return P;
  }
  function iamMR(cosAoi) { return cosAoi <= 0 ? 0 : (1 - Math.exp(-cosAoi / PV.ar)) / (1 - Math.exp(-1 / PV.ar)); }
  function iamMRdiffuse(tilt) {
    const t = Math.min(180 - 1e-6, Math.max(1e-6, tilt)), b = t * D2R, sb = t < 90 ? Math.sin(b) : Math.sin(Math.PI - b), c1 = 0.4244, c2 = 0.5 * PV.ar - 0.154;
    const ts = sb + (Math.PI - b - sb) / (1 + Math.cos(b)), tg = sb + (b - sb) / (1 - Math.cos(b));
    return { sky: 1 - Math.exp(-(c1 + c2 * ts) * ts / PV.ar), gnd: 1 - Math.exp(-(c1 + c2 * tg) * tg / PV.ar) };
  }
  function pvInverter(pdc) { // W per kWp DC
    if (!(pdc > 0)) return 0;
    const pdc0 = 1000 / PV.dcac, pac0 = PV.etaNom * pdc0, z = pdc / pdc0, eta = PV.etaNom / PV.etaRef * (-0.0162 * z - 0.0059 / z + 0.9858);
    return Math.max(0, Math.min(pac0, eta * pdc));
  }
  // one fixed plane; tilt from horizontal, az clockwise from north (degrees)
  // average masking angle of the sky for a row among rows (Passias and Kallback 1984), degrees
  function maskingAnglePassias(tilt, gcr) {
    if (!(tilt > 0) || !(gcr > 0)) return 0;
    const b = tilt * D2R, sb = Math.sin(b), cb = Math.cos(b), X = 1 / gcr;
    const v = -X * sb * Math.log(Math.abs(2 * X * cb - (X * X + 1))) / 2 + (X * cb - 1) * Math.atan((X * cb - 1) / (X * sb)) + (1 - X * cb) * Math.atan(cb / sb) + X * Math.log(X) * sb;
    return isFinite(v) ? v / D2R : 0;
  }
  // one fixed plane; with rows (gcr = slant length / row pitch) the plane is shaded by the row in front:
  // direct and circumsolar light by the shaded fraction (infinite rows, as pvlib infinite_sheds) with the stepped
  // electrical loss of Martinez-Moreno 2010 (3 bypass blocks across the row height); isotropic sky and horizon light
  // by the Passias masking angle; light reflected from the roof scaled by (1 - gcr).
  function pvRun(P, tilt, az, hourly, gcr) {
    const tr = tilt * D2R, ct = Math.cos(tr), st = Math.sin(tr), ar = az * D2R, di = iamMRdiffuse(tilt), rows = gcr > 0 && tilt > 0, blocks = PV.blocks;
    const skyKeep = rows ? Math.cos(maskingAnglePassias(tilt, gcr) * D2R / 2) ** 2 : 1, gndKeep = rows ? 1 - Math.min(1, gcr) : 1;
    const out = { tilt, az, gcr: gcr || 0, shadeLoss: 0, annual: 0, monthly: new Float64Array(12), mPoa: new Float64Array(12), mIam: new Float64Array(12), mDc: new Float64Array(12), st: { poa: 0, iam: 0, temp: 0, sys: 0, ac: 0 } };
    if (hourly) out.hourly = new Float32Array(N);
    for (let k = 0; k < P.n; k++) {
      const cosAoi = P.cz[k] * ct + P.sz[k] * st * Math.cos(P.saz[k] - ar), A = Math.max(0, cosAoi);
      const beam = P.dni[k] * A;
      let skyIso, circ = 0, hor = 0;
      if (P.iso[k]) skyIso = P.dhi[k] * 0.5 * (1 + ct); else { skyIso = P.dhi[k] * 0.5 * (1 - P.F1[k]) * (1 + ct); circ = P.dhi[k] * P.F1[k] * A / P.B[k]; hor = P.dhi[k] * P.F2[k] * st; }
      const sky = Math.max(0, skyIso + circ + hor), gnd = P.ghi[k] * P.alb[k] * (1 - ct) * 0.5, tot = beam + sky + gnd;
      if (!(tot > 0)) continue;
      let eff = beam * iamMR(cosAoi) + sky * di.sky + gnd * di.gnd, totS = tot;
      if (rows) {
        // shaded fraction of the row (0 when the sun is behind the plane: no direct light reaches it then)
        let f = 0; if (cosAoi > 0) { const x = gcr * (st * Math.cos(P.saz[k] - ar) * P.sz[k] / Math.max(1e-6, P.cz[k]) + ct); f = x > 1 ? Math.min(1, 1 - 1 / x) : 0; }
        const cS = Math.min(Math.max(0, circ), sky), dirC = beam + cS, beamFactor = (1 - f) * (1 - Math.ceil(blocks * f - 1e-9) / (1 + blocks)), diffC = sky - cS;
        const effS = dirC * iamMR(cosAoi) * beamFactor + diffC * skyKeep * di.sky + gnd * gndKeep * di.gnd;
        out.shadeLoss += eff - effS; eff = effS; totS = dirC * beamFactor + diffC * skyKeep + gnd * gndKeep;
      }
      const tc = P.ta[k] + totS / (PV.u0 + PV.u1 * P.ws[k]);
      const dc = eff * (1 + PV.gamma * (tc - 25)), sys = dc * (1 - PV.loss), ac = pvInverter(sys);
      out.st.poa += tot; out.st.iam += eff; out.st.temp += dc; out.st.sys += sys; out.st.ac += ac;
      out.monthly[P.m[k]] += ac / 1000; out.mPoa[P.m[k]] += tot / 1000; out.mIam[P.m[k]] += eff / 1000; out.mDc[P.m[k]] += dc / 1000; if (hourly) out.hourly[P.idx[k]] = ac;
    }
    for (const key in out.st) out.st[key] /= 1000; out.shadeLoss /= 1000;
    out.annual = out.st.ac;
    return out;
  }
  // annual yield over tilt 0..90 (step 5) and orientation 0..350 (step 10), plus the best plane, refined to 1 degree tilt and 2 degrees orientation
  function pvMap(P) {
    const tilts = [], azs = []; for (let t = 0; t <= 90; t += 5) tilts.push(t); for (let a = 0; a < 360; a += 10) azs.push(a);
    const grid = tilts.map((t) => azs.map((a) => (t === 0 && a > 0 ? NaN : pvRun(P, t, a).annual)));
    for (const row of grid) if (isNaN(row[1])) row.fill(row[0]);
    let best = { v: -1 };
    tilts.forEach((t, i) => azs.forEach((a, j) => { if (grid[i][j] > best.v) best = { v: grid[i][j], t, a }; }));
    for (let t = Math.max(0, best.t - 5); t <= Math.min(90, best.t + 5); t++) for (let a = best.a - 10; a <= best.a + 10; a += 2) { const v = pvRun(P, t, ((a % 360) + 360) % 360).annual; if (v > best.v) best = { v, t, a: ((a % 360) + 360) % 360 }; }
    return { tilts, azs, grid, best: { tilt: best.t, az: best.a, annual: best.v } };
  }
  /* rows on a flat roof. cover = panel area / roof area. Equator-facing rows: gcr = cover. East-west tents: two panels
     back to back per pitch, gcr of each face = cover / 2. Yield per m2 of roof = kWh/kWp x kWp per m2 of panel x cover. */
  function pvRoof(P, lat) {
    const eqAz = lat >= 0 ? 180 : 0, covers = [], tiltsEq = [], tiltsEW = [];
    for (let c = 0.2; c <= 1.0001; c += 0.05) covers.push(+c.toFixed(2));
    for (let t = 0; t <= 60; t += 5) tiltsEq.push(t); for (let t = 5; t <= 30; t += 5) tiltsEW.push(t);
    const per = (kwh, cover) => kwh * PV.eff * cover;
    const eq = tiltsEq.map((t) => covers.map((c) => { if (c > 1 / Math.cos(t * D2R) + 1e-9) return null; const r = pvRun(P, t, eqAz, false, t ? c : 0); return { t, c, kwp: r.annual, roof: per(r.annual, c), shade: r.shadeLoss / Math.max(1e-9, r.st.iam + r.shadeLoss), monthly: r.monthly }; }));
    const ew = tiltsEW.map((t) => covers.map((c) => { if (c > 1 / Math.cos(t * D2R) + 1e-9) return null; const a = pvRun(P, t, 90, false, c / 2), b = pvRun(P, t, 270, false, c / 2), kwp = (a.annual + b.annual) / 2; return { t, c, kwp, roof: per(kwp, c), shade: (a.shadeLoss + b.shadeLoss) / Math.max(1e-9, a.st.iam + b.st.iam + a.shadeLoss + b.shadeLoss), monthly: a.monthly.map((v, m) => (v + b.monthly[m]) / 2) }; }));
    // spacing rule: no shading between 10h and 14h (local standard time) on the winter solstice; the largest cover that meets it, per tilt
    const doy = lat >= 0 ? 355 : 172, rule = (t, azs, face) => { let need = 0; for (let h = 10; h <= 14; h += 0.25) { const s = sunPosition(P.lat, P.lon, P.tz, doy, h); if (s.alt <= 0) continue; for (const a of azs) { const ca = Math.cos((s.az - a) * D2R); if (ca <= 0) continue; need = Math.max(need, Math.sin(t * D2R) * ca * Math.tan(s.zen * D2R) + Math.cos(t * D2R)); } } return need > 0 ? Math.min(1 / Math.cos(t * D2R), face / need) : 1 / Math.cos(t * D2R); };
    const ruleEq = tiltsEq.map((t) => (t ? rule(t, [eqAz], 1) : 1)), ruleEW = tiltsEW.map((t) => rule(t, [90, 270], 2));
    return { covers, tiltsEq, tiltsEW, eq, ew, ruleEq, ruleEW, eqAz };
  }
  function pvPotential(W, S) {
    const P = pvPrep(W, S), map = pvMap(P);
    const planes = { best: pvRun(P, map.best.tilt, map.best.az, true), flat: pvRun(P, 0, 180, true) };
    for (const [n, a] of ORIENT) planes[n] = pvRun(P, 90, a, true);
    P.lat = W.meta.lat; P.lon = W.meta.lon; P.tz = W.meta.tz;
    let roof = null;
    return { map, planes, assumptions: Object.assign({}, PV), roof: () => roof || (roof = pvRoof(P, W.meta.lat)), run: (t, a, gcr) => pvRun(P, t, a, false, gcr) };
  }
  function processWeather(W, opt) {
    opt = opt || {};
    const m = W.meta;
    const S = solarArrays(m.lat, m.lon, m.tz);
    const ps = psychroArrays(W);
    const daily = dailyStats(W.dbt);
    const X = Object.assign({}, T, S, ps, { daily });
    X.surf = surfaceIrradiation(W, S);
    X.pv = pvPotential(W, S);
    // MRT and UTCI in four scenarios; shade means MRT equal to air temperature, as in CBE Clima
    // MRT in the open: air temperature, plus solar gain (SolarCal with measured diffuse and reflected), plus longwave exchange with the sky.
    // Shade: the direct beam is blocked; sky and ground stay in view, so diffuse, reflected and longwave terms remain.
    const dmrt = new Float32Array(N), dmrtShade = new Float32Array(N), dlw = new Float32Array(N), tsky = new Float32Array(N), mrt = new Float32Array(N), mrtShade = new Float32Array(N), dmrtCBE = new Float32Array(N);
    const albedo = (i) => (W.alb[i] > 0 && W.alb[i] < 1 ? W.alb[i] : 0.2);
    let irMissing = 0;
    for (let i = 0; i < N; i++) {
      const a = S.alt[i], day = a > 0 || W.dhi[i] > 0;
      dmrt[i] = day ? Math.min(70, solarCalDeltaMrt(a, W.dni[i], W.dhi[i], W.ghi[i], { rFloor: albedo(i) })) : 0;
      dmrtShade[i] = day ? Math.min(70, solarCalDeltaMrt(a, 0, W.dhi[i], W.ghi[i], { rFloor: albedo(i) })) : 0;
      if (!(W.hir[i] > 0 && W.hir[i] < 9999)) irMissing++;
      tsky[i] = skyTemperature(W.hir[i], W.dbt[i], W.dpt[i], W.osc[i]); dlw[i] = longwaveDeltaMrt(tsky[i], W.dbt[i]);
      mrt[i] = W.dbt[i] + dmrt[i] + dlw[i]; mrtShade[i] = W.dbt[i] + dmrtShade[i] + dlw[i];
      dmrtCBE[i] = a > 0 ? Math.min(70, solarCalDeltaMrtCBE(a, W.dni[i])) : 0;
    }
    X.dmrt = dmrt; X.dmrtShade = dmrtShade; X.dlw = dlw; X.tsky = tsky; X.mrt = mrt; X.mrtShade = mrtShade; X.dmrtCBE = dmrtCBE; X.irMissing = irMissing;
    const sw = new Float32Array(N), sn = new Float32Array(N), hw = new Float32Array(N), hn = new Float32Array(N);
    for (let i = 0; i < N; i++) { const t = W.dbt[i], rh = W.rh[i], v = W.ws[i] <= 0.5 ? 0.6 : Math.min(16.9, W.ws[i]); sw[i] = utci(t, mrt[i], v, rh); sn[i] = utci(t, mrt[i], 0.5, rh); hw[i] = utci(t, mrtShade[i], v, rh); hn[i] = utci(t, mrtShade[i], 0.5, rh); }
    X.utci = { sunWind: sw, sunStill: sn, shadeWind: hw, shadeStill: hn };
    X.adaptive = adaptiveBands(daily.mean);
    X.extremes = extremes(W, daily);
    X.rain = drivingRain(W);
    const eps = new Float32Array(N); for (let i = 0; i < N; i++) eps[i] = S.alt[i] > 0 ? perezSkyClearness(W.dhi[i], W.dni[i], S.zen[i]) : NaN; X.eps = eps;
    X.zones = strategyZones(W, X, opt);
    return X;
  }

  const api = { N, MDAYS, MSTART, MONTHS, MONTHS_LONG, FIELDS, T, parseEPW, sunPosition, solarArrays, sunPathLines, pws, humRatio, pwFromW, dewFromPw, wetBulb, enthalpy, psychroArrays, poa, dniExtra, airmassKY, perezSkyClearness, surfaceIrradiation, ORIENT, fpStanding, solarCalDeltaMrt, skyTemperature, longwaveDeltaMrt, solarCalDeltaMrtCBE, utci, utciPvap, UTCI_CLASSES, utciClass, pmv, dailyStats, runningMeanEN, prevailingMean, adaptiveBands, degreeDays, gradtagzahl, extremes, runs, windRose, WIND_BINS, seasonOf, drivingRain, CC_DEFAULT, CC_KEYS, comfortCurves, curveAt, strategyZones, strategyCover, skyClass, processWeather, PV, pvPrep, pvRun, pvMap, pvPotential, pvRoof, urbanHeatIsland, isNWEurope, regionOf, futureDelta, morphWeather, dailyFromMonthly, maskingAnglePassias, iamMR, iamMRdiffuse, pvInverter };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Clima = api;
})(this);
