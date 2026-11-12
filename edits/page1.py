from lib import Ed
e = Ed('/home/claude/rdg/v16/src/page.html'); rep = e.rep
# ---- weather: gaps, region, long-wave from sky cover when missing
rep('''  function fromRecord(r) {
    return { name: r.name, cc: r.cc, koppen: r.koppen, source: r.source, region: r.region,''', '''  function fromRecord(r) {
    return { name: r.name, cc: r.cc, koppen: r.koppen, source: r.source, region: r.region, regionGiven: ["DEU", "DE"].includes(String(r.cc).toUpperCase()) ? r.region : null, gaps: null,''')
rep('''    rows = rows.slice(0, 8760);
    const col = (j, miss, fb) => Float64Array.from(rows.map((r) => { const x = +r[j]; return !isFinite(x) || x >= miss ? fb : x; }));
    const t = col(6, 99.9, 15), elev = +h[9] || 0;
    const td = Float64Array.from(rows.map((r, i) => { const x = +r[7]; return !isFinite(x) || x >= 99.9 ? t[i] - 5 : x; }));
    const p0 = 101325 * Math.pow(1 - 2.25577e-5 * elev, 5.2559);
    return { name: h[1] || fname, cc: h[3] || "", koppen: "", source: "Uploaded: " + fname, region: h[3] === "DEU" ? "B" : "C",
      lat: +h[6], lon: +h[7], tz: +h[8], elev, t, td, p: col(9, 999999, p0), ir: col(12, 9999, 0), dni: col(14, 9999, 0), dhi: col(15, 9999, 0), ws: col(21, 999, 0), albedo: 0.2 };
  }''', '''    rows = rows.slice(0, 8760);
    /* v16: missing values are no longer replaced by constants. Gaps are filled by linear interpolation in time (wrapping
       the year) and listed; a file with more than the register's share of hours missing in a core variable is refused.
       Missing long-wave sky radiation is computed from air temperature, dew point and opaque sky cover (Clark and Allen,
       as EnergyPlus does). */
    const raw = (j, miss) => rows.map((r) => { const x = +r[j]; return r[j] === undefined || r[j] === "" || !isFinite(x) || x >= miss ? NaN : x; });
    const gaps = {}, maxGap = Register.val("wx.maxGap");
    const fill = (a, key, label) => {
      const n = a.length, out = new Float64Array(n), ok = []; a.forEach((x, i) => { if (!isNaN(x)) ok.push(i); });
      const miss = n - ok.length; if (miss) gaps[key] = { label, hours: miss };
      if (miss / n > maxGap) throw new Error(`${label}: ${miss} of 8,760 hours missing (more than ${Math.round(maxGap * 100)} %). Use a complete file.`);
      if (!ok.length) return out;
      for (let k = 0; k < ok.length; k++) { const i0 = ok[k], i1 = ok[(k + 1) % ok.length], span = ((i1 - i0 + n) % n) || n; out[i0] = a[i0];
        for (let d = 1; d < span; d++) out[(i0 + d) % n] = a[i0] + (a[i1] - a[i0]) * d / span; }
      return out;
    };
    const elev = +h[9] || 0, p0 = 101325 * Math.pow(1 - 2.25577e-5 * elev, 5.2559);
    const t = fill(raw(6, 99.9), "t", "Air temperature"), td = fill(raw(7, 99.9), "td", "Dew point");
    const dni = fill(raw(14, 9999), "dni", "Direct normal radiation"), dhi = fill(raw(15, 9999), "dhi", "Diffuse horizontal radiation");
    const pr = raw(9, 999999), p = Float64Array.from(pr.map((x) => isNaN(x) ? p0 : x)), ws = Float64Array.from(raw(21, 999).map((x) => isNaN(x) ? 0 : x));
    if (pr.some(isNaN)) gaps.p = { label: "Pressure (set from elevation)", hours: pr.filter(isNaN).length };
    const irr = raw(12, 9999), sky = raw(23, 99), nIr = irr.filter(isNaN).length;
    const ir = Float64Array.from(irr.map((x, i) => { if (!isNaN(x)) return x; const N = isNaN(sky[i]) ? 5 : sky[i], Tk = t[i] + 273.15, Td = td[i] + 273.15;
      const eps = (0.787 + 0.764 * Math.log(Td / 273)) * (1 + 0.0224 * N - 0.0035 * N * N + 0.00028 * N * N * N); return eps * 5.6697e-8 * Tk ** 4; }));
    if (nIr) gaps.ir = { label: "Long-wave sky radiation (computed from dew point and sky cover)", hours: nIr };
    const cc = h[3] || "";
    return { name: h[1] || fname, cc, koppen: "", source: "Uploaded: " + fname, region: null, regionGiven: null, gaps,
      lat: +h[6], lon: +h[7], tz: +h[8], elev, t, td, p, ir, dni, dhi, ws, albedo: 0.2 };
  }''')
rep('''  // DIN 4108-2 region from the file: the highest monthly mean outdoor temperature (A up to 16.5, B up to 18, C above; to verify)
  function regionFor(w) { return C.dinRegion(w.t).region; }''', '''  /* DIN 4108-2 summer climate region (v16): in Germany chosen from figure 1 of the standard (8.1); the bundled German
     file carries its region; an uploaded German file is set to B until the user chooses. Outside Germany the standard
     does not apply: a region is estimated from the warmest monthly mean, for reference only. */
  function regionFor(w) { return inGermany(w) ? (w.regionGiven || "B") : C.dinRegion(w.t).region; }''')
rep('''  function regionInfo() { const r = C.dinRegion(st.wx.t); $("reginfo").textContent = `Set from the weather file: warmest month ${r.maxMonth.toFixed(1)} °C (A up to 16.5, B up to 18, C above). Override if the site's region differs.`; }''', '''  function regionInfo() {
    const w = st.wx, r = C.dinRegion(w.t), ref = Register.val("din.weather")[st.region];
    $("reginfo").textContent = inGermany(w)
      ? (w.regionGiven ? `Region ${w.regionGiven} for this site, from figure 1 of DIN 4108-2. ` : "Choose the region of the site from figure 1 of DIN 4108-2 (between two regions, the warmer one). Set to B until you choose. ")
        + `The proof uses the ${ref}; on this weather file the check is an indication.`
      : `DIN 4108-2 applies in Germany only. Region estimated from the warmest month of the file (${r.maxMonth.toFixed(1)} °C), for reference.`;
    $("regionask").hidden = !(inGermany(w) && !w.regionGiven);
  }''')
rep('''    $("region").onchange = () => { st.region = $("region").value; fillLimit(); if (coolStale()) setStale(true); reread(); };''', '''    $("region").onchange = () => { st.region = $("region").value; if (inGermany(st.wx)) st.wx.regionGiven = st.region; regionInfo(); fillLimit(); if (coolStale()) setStale(true); reread(); };
    $("blindctl").value = st.blindCtl; $("blindctl").onchange = () => { st.blindCtl = $("blindctl").value; setStale(true); };''')
rep('''  function wxInfo() { const w = st.wx; $("wxinfo").textContent = `${w.source}${w.cc ? ", " + w.cc : ""}; ${w.lat.toFixed(2)}°, ${w.lon.toFixed(2)}°; mean ${(w.t.reduce((s, x) => s + x, 0) / 8760).toFixed(1)} °C`; }''', '''  function wxInfo() {
    const w = st.wx, g = w.gaps ? Object.values(w.gaps) : [];
    $("wxinfo").textContent = `${w.source}${w.cc ? ", " + w.cc : ""}; ${w.lat.toFixed(2)}°, ${w.lon.toFixed(2)}°; mean ${(w.t.reduce((s, x) => s + x, 0) / 8760).toFixed(1)} °C`
      + (g.length ? `. Filled gaps: ${g.map((x) => `${x.label.toLowerCase()} ${x.hours} h`).join("; ")}.` : "");
  }''')
# ---- gains follow DIN 4108-2; blinds control
rep('''dims: S.USE.office.dims.slice(), wall: 0.35, coolSet: 26, gains: { dwelling: 100 / 24, office: 25, school: 30 }, fanW: 1.5, dinC: {}, copH: 3, copC: 3.5,''', '''dims: S.USE.office.dims.slice(), wall: 0.35, coolSet: 26, fanW: Register.val("run.fan.power"), blindCtl: "auto", dinC: {}, copH: 3, copC: 3.5,''')
rep('''scen: "corner", fa: 4, yAx: "E", allow: { mass: ["light", "medium", "heavy"] },''', '''scen: "corner", fa: 4, yAx: "E", allow: { mass: ["light", "medium", "heavy"], nightAch: [0, 2] },''')
rep('''  /* v7: representative internal gains in occupied hours, W/m² floor (people about 7.5, equipment about 12, LED lighting about
     4 for an office; about 2.5 m² per pupil for a school; the DIN value for dwellings). The DIN 4108-2 check keeps the standard's
     own gains (office and school 144 Wh/m²d over 11 h, about 13 W/m²). */
  const gainNow = () => st.gains[st.use];
  const DIN_GAIN = { dwelling: 100 / 24, office: 144 / 11, school: 144 / 11 };''', '''  /* v16 (decision of 11 November 2026): every run uses the internal gains and schedules of DIN 4108-2, 8.4.2 b and e
     (100 Wh/m²d over all hours for dwellings, 144 Wh/m²d over 7 to 18 h on weekdays otherwise). Energy runs will take the
     DIN V 18599-10 profiles once they are added; until then they use the same. */
  const DIN_GAIN = { dwelling: S.USE.dwelling.gainOcc, office: S.USE.office.gainOcc, school: S.USE.school.gainOcc };
  const gainNow = () => DIN_GAIN[st.use];''')
rep('''st.ctx = S.context(st.ctxWx, st.use, { dims: st.dims, wallDepth: st.wall, coolSet: st.coolSet, gainOcc: gainNow(), fanW: st.fanW }); st.gainRun = gainNow(); st.fanWRun = st.fanW;''', '''st.ctx = S.context(st.ctxWx, st.use, { dims: st.dims, wallDepth: st.wall, coolSet: st.coolSet, gainOcc: gainNow(), fanW: st.fanW, blindCtl: st.blindCtl }); st.gainRun = gainNow(); st.fanWRun = st.fanW; st.blindCtlRun = st.blindCtl;''')
rep('''gainOcc: st.gainRun, fanW: st.fanWRun });''', '''gainOcc: st.gainRun, fanW: st.fanWRun, blindCtl: st.blindCtlRun });''')
rep('''gainOcc:m.gainOcc,fanW:m.fanW});''', '''gainOcc:m.gainOcc,fanW:m.fanW,blindCtl:m.blindCtl});''')
rep('''$("gain").value = Math.round(gainNow() * 10) / 10; $("fanw").value = st.fanW; $("gainnote").textContent = st.use === "dwelling" ? "As DIN 4108-2 (100 Wh/m² a day, all hours)." : `Representative ${st.use === "office" ? "office: people about 7.5, equipment about 12, LED lighting about 4 W/m²" : "classroom: about 2.5 m² per pupil"}. The DIN 4108-2 check uses the standard's ${fmt(Math.round(DIN_GAIN[st.use] * 10) / 10)} W/m².`;''', '''$("fanw").value = st.fanW; $("gainnote").textContent = st.use === "dwelling" ? "Internal gains as DIN 4108-2: 100 Wh/m² a day over all hours (about 4.2 W/m²)." : `Internal gains as DIN 4108-2: 144 Wh/m² a day over 7 to 18 h on weekdays (about ${fmt(Math.round(DIN_GAIN[st.use] * 10) / 10)} W/m²), no holidays. Energy figures use the same until the DIN V 18599-10 profiles are added.`;''')
rep('''    $("gain").onchange = () => { const v = +$("gain").value; if (v >= 0 && v <= 80) { st.gains[st.use] = v; setStale(true); } };
''', '')
# ---- night ventilation labels
rep('''  const stratLabel = (p, lv) => levelLabel(p, lv)''', '''  const stratLabel = (p, lv) => (p === "nightAch" && lv === 5 ? "5 1/h, only with air across storeys (atrium, stair) or a fan system" : p === "nightAch" && lv === 2 ? "2 1/h, windows open at night" : levelLabel(p, lv))''')
# ---- DIN labels
rep('''din: "DIN 4108-2 at the representative gains", hum: "Humid hours" };''', '''din: "DIN 4108-2, design run (estimate)", hum: "Humid hours" };''')
rep('''checked_with: c.exact ? "the gains of the standard" : "the representative gains (stricter)" }''', '''checked_with: c.exact ? "the conditions of DIN 4108-2, 8.4.2, on this weather file (an indication; the proof uses the test reference year)" : "the design run (estimate: the app's controls, not the standard's)" }''')
rep('''`Internal gains: comfort, energy and cooling loads use ${fmt(st.gainRun)} W/m² in occupied hours (representative); only the DIN 4108-2 check uses the gains of the standard (${fmt(Math.round(DIN_GAIN[st.use] * 100) / 100)} W/m²).`,''', '''`Internal gains: every run uses the gains and schedules of DIN 4108-2 (${fmt(Math.round(DIN_GAIN[st.use] * 100) / 100)} W/m² in occupied hours). The DIN 4108-2 check also uses the standard's controls; the design runs use the app's.`,''')
rep('''`Without cooling, with the gains of the standard (${fmt(Math.round(DIN_GAIN[st.use] * 10) / 10)} W/m²), region ${st.region}.`''', '''`Without cooling, with the conditions of DIN 4108-2 (gains ${fmt(Math.round(DIN_GAIN[st.use] * 10) / 10)} W/m²), region ${st.region}. On this weather file an indication: the proof uses the ${Register.val("din.weather")[st.region]}.`''')
rep('''"K·h/a without cooling, with the representative gains"''', '''"K·h/a without cooling, with the gains of DIN 4108-2"''')
rep('''  // compliance with DIN 4108-2 of one design: exact (the standard's gains) where run, else the check at the representative
  // gains, which is stricter: complying there implies complying with the standard's gains''', '''  // compliance with DIN 4108-2 of one design: the check with the standard's conditions where run (exact), else an estimate
  // from the design run (same gains, the app's controls)''')
rep('''const k = row.r.heat["din_" + st.region]; return { exact: false, kh: k, ok: k <= lim ? true : null };''', '''const k = row.r.heat["din_" + st.region]; return { exact: false, kh: k, ok: k <= lim };''')
rep('''"yes (checked at the representative gains)"''', '''"yes (estimate from the design run)"''')
rep('''const f = failWords(x), pk = `The peak cooling load is ${fmt(x.peak)} W/m²`;''', '''const f = failWords(x), pk = `The design cooling load (exceeded in 1% of the occupied cooling hours) is ${fmt(x.peak)} W/m²`;''')
# ---- names
rep('''        name: "Room Design Guide",''', '''        name: "Room Clima",''')
rep('''`Room Design Guide v5 · ${st.wx.name}''', '''`Room Clima v16 · ${st.wx.name}''')
rep('''<title>Room Design Guide, ${esc(st.wx.name)}</title>''', '''<title>Room Clima, ${esc(st.wx.name)}</title>''')
# ---- Claude review only in a debug build (decision of 11 November 2026)
rep('''  function bindAI() {''', '''  function bindAI() {
    // v16: the Claude review is for debugging only; it shows when the page address carries #debug or ?debug
    const DEBUG = /[?#&]debug\\b/.test(String(location.href)); $("askbtn").hidden = !DEBUG; if (!DEBUG) { $("aibox").hidden = true; }''')
e.save()
