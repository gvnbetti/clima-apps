import sys; sys.path.insert(0, '/home/claude/rdg/v16/edits'); from lib import Ed
B = '/home/claude/rdg/v16/src/'
# ===================================================================== register
r = Ed(B + 'register.js'); rep = r.rep
rep('''    "run.day.levels": { v: [0, 3], unit: "1/h", status: "standard", src: DIN + ", 8.4.2 h", text: "Day window ventilation levels: none or 3 1/h" },
    "run.night.levels": { v: [0, 2, 5], unit: "1/h", status: "standard", src: DIN + ", 8.4.2 i", text: "Night ventilation levels: none, 2 1/h (windows open at night), 5 1/h (across storeys or by a system; off by default)" },''',
'''    "run.day.levels": { v: [0, 1, 2], unit: "code", status: "decision", src: "Decision of 17 November 2026", text: "Day window ventilation: 0 none, 1 tilt windows, 2 side-hung windows open. Air flow from the opening by EN 16798-7; in the DIN 4108-2 check any day opening counts as 3 1/h" },
    "run.night.levels": { v: [0, 1, 5], unit: "code", status: "decision", src: "Decision of 17 November 2026", text: "Night ventilation: 0 none, 1 tilt windows secured at night (air flow by EN 16798-7; 2 1/h in the DIN 4108-2 check), 5 air across storeys (atrium, stair) or a fan system, 5 1/h as DIN 4108-2 (off by default)" },
    "vent.method": { v: { cst: 0.0035, cwnd: 0.001, k: 1800 }, unit: "q = k · A · √(C_st · h · ΔT), m³/h", status: "secondary", src: "EN 16798-7:2017, single-sided airing (coefficients as quoted by REHVA and AIVC, 2022); wind term off by decision of 17 November 2026", text: "Window air flow each hour from the effective opening area A, the sash height h and the indoor-outdoor temperature difference; wind is not credited, since site wind is unknown at concept stage. The method is built to underestimate. Openings on two facades are added as two single-sided openings, without cross ventilation" },
    "vent.openShare": { v: 0.5, unit: "share of window area", status: "decision", src: "Decision of 17 November 2026", text: "Openable sash area: half of the window area (fixed, not editable)" },
    "vent.tilt": { v: { angle: 10, ck: 0.174 }, unit: "°, factor", status: "secondary", src: "EN 16798-7 opening-angle factor C_k(α) = 2.6·10⁻⁷ α³ − 1.19·10⁻⁴ α² + 1.86·10⁻² α (from EN 15242)", text: "Tilt windows at 10°: effective area 17 % of the sash area. Side-hung windows fully open: the whole sash area" },
    "vent.depthMax": { v: 2.5, unit: "× room height", status: "standard", src: "ASR A3.6, Table 3", text: "Workplaces: a room ventilated from one side may be at most 2.5 times its clear height deep" },
    "asr.tilt": { v: 0.35, unit: "m² per person present", status: "standard", src: "ASR A3.6, Table 3 (single-sided, continuous ventilation)", text: "Workplaces: effective opening for continuous ventilation by tilt windows, single-sided" },
    "asr.purge": { v: 1.05, unit: "m² per 10 m² of floor", status: "standard", src: "ASR A3.6, Table 3 (single-sided, purge ventilation)", text: "Workplaces: opening for purge ventilation by fully opened windows, single-sided" },
    "asr.persons": { v: { office: 2, school: 28 }, unit: "persons", status: "decision", src: "Room presets of the spec of 23 October 2026", text: "Persons present for the ASR A3.6 check: two-person office, classroom for 28 pupils. Dwellings: no check" },''')
rep('''    "run.blind.warm": { v: 23, unit: "°C", status: "decision", src: "Decision of 24 October 2026", text: "In the design runs blinds come down by the DIN 4108-2 irradiance thresholds only when the room air is above 23 °C, so that winter sun is kept" },''',
'''    "run.blinds": { v: "DIN 4108-2 irradiance", status: "decision", src: "Decision of 17 November 2026", text: "Every run, exterior and interior blinds alike: blinds come down when the sun on the window exceeds the DIN 4108-2 threshold (8.4.2 j), whatever the room temperature. The same hours apply to daylight" },
    "blind.ext": { v: { fc: "DIN 4108-2 Table 7", tau: 0.10 }, unit: "F_C, light transmittance", status: "assumption", src: "F_C: DIN 4108-2 Table 7 row 3.2.1 (0.25; 0.30 with solar control glass). Light transmittance: assumption", text: "Exterior blind (venetian blind at 45°): solar factor and daylight let through when down. Both editable" },
    "blind.int": { v: { fc: "DIN 4108-2 Table 7", tau: 0.25 }, unit: "F_C, light transmittance", status: "assumption", src: "F_C: DIN 4108-2 Table 7 row 2.1 (0.70 double, 0.65 triple and solar control glass). Light transmittance: assumption", text: "Interior blind (white): solar factor and daylight let through when down. Both editable" },
    "dl.udi": { v: { nonres: [300, 3000], res: [100, 2000] }, unit: "lx", status: "decision", src: "Decision of 17 November 2026; 100 to 2,000 lx after Nabil and Mardaljevic 2005", text: "Daylight score: share of the floor and of the hours with useful daylight, 300 to 3,000 lx for offices and schools over their occupied hours, 100 to 2,000 lx for dwellings over daylight hours, with blinds as operated" },
    "dl.light": { v: { lpd: 6, target: { office: 500, school: 300 } }, unit: "W/m², lx", status: "assumption", src: "Targets as DIN V 18599-10 and EN 12464-1 (office 500 lx, classroom 300 lx); LED power density an assumption", text: "Lighting electricity, offices and schools only: continuous dimming against the daylight at each point of the floor, in occupied hours. Not counted for dwellings, as in DIN V 18599" },''')
r.save()

# ===================================================================== sweep: shading, blinds, ventilation, DIN mapping
c = Ed(B + 'core.js'); rep = c.rep
rep('''  const SHADES = {
    none: { label: "No shading", fc: { double: 1, triple: 1, sc: 1 }, dR: 0 },
    shutter: { label: "Exterior roller shutter, three quarters closed", fc: FC.shutter, dR: 0.10 },
    venetian: { label: "Exterior venetian blind", fc: FC.venetian, dR: 0.10 },
    interior: { label: "Interior blind, white", fc: FC.interior, dR: 0 },
  };''', '''  // v16 phase 2: two blind types, exterior and interior; F_C and light transmittance editable through ctx.blinds
  const SHADES = {
    none: { label: "No blinds", fc: { double: 1, triple: 1, sc: 1 }, dR: 0, tau: 1 },
    exterior: { label: "Exterior blind", fc: FC.venetian, dR: 0.10, tau: RV("blind.ext").v === undefined ? RV("blind.ext").tau : RV("blind.ext").tau },
    interior: { label: "Interior blind", fc: FC.interior, dR: 0, tau: RV("blind.int").tau },
  };''')
rep('''  const SHADE_LEVELS = { dwelling: ["none", "shutter", "venetian"], office: ["none", "interior", "venetian"], school: ["none", "interior", "venetian"] };''',
    '''  const SHADE_LEVELS = { dwelling: ["none", "interior", "exterior"], office: ["none", "interior", "exterior"], school: ["none", "interior", "exterior"] };''')
rep('''  const BLIND_WARM = RV("run.blind.warm"); // °C room air above which blinds may come down in the design runs
''', '')
rep('''  function shadeOf(ctx, c) {
    const key = SHADE_LEVELS[ctx.useKey][c.shading], sh = SHADES[key];
    const col = colOf(c.uglass, c.gglass);
    return { key, label: sh.label, fc: sh.fc[col], dR: sh.dR };
  }''', '''  function shadeOf(ctx, c) {
    const key = SHADE_LEVELS[ctx.useKey][c.shading], sh = SHADES[key];
    const col = colOf(c.uglass, c.gglass), ov = ctx.blinds && ctx.blinds[key];
    return { key, label: sh.label, fc: ov && ov.fc != null ? ov.fc : sh.fc[col], dR: sh.dR, tau: ov && ov.tau != null ? ov.tau : sh.tau };
  }
  /* window openings for ventilation (v16 phase 2): per window of the room, the openable sash area (half the window area,
     frame included) and the sash height; effective area for tilt (C_k at 10°) or fully open side-hung windows */
  const VM = RV("vent.method"), V_SHARE = RV("vent.openShare"), V_CK = RV("vent.tilt").ck;
  function openings(ctx, c) {
    const dims = c.dims || ctx.dims || ctx.use.dims, W = dims[0], D = dims[1], H = dims[2];
    const walls = c.scenario === "cellular" ? [W] : [W, D];
    return walls.map((L) => { const r = Z.windowRect(L, H, c.wwr, 0.3); return { sash: V_SHARE * c.wwr * L * H, h: r.z1 - r.z0 }; });
  }
  const effArea = (ops, kind) => ops.reduce((s, o) => s + o.sash * (kind === 2 ? 1 : V_CK), 0); // m², kind 1 tilt, 2 open
  // EN 16798-7 single-sided airing without wind: m³/h through all openings of the kind, at a temperature difference dT
  const ventFlow = (ops, kind, dT) => dT <= 0 ? 0 : ops.reduce((s, o) => s + VM.k * o.sash * (kind === 2 ? 1 : V_CK) * Math.sqrt(VM.cst * o.h * dT), 0);''')
# blinds: one rule in every run
rep('''      /* blinds down when the sun on the facade is above the DIN 4108-2 threshold of the use. Design runs add the room-warm
         condition (air above 23 °C), so winter sun is kept; the DIN check uses the irradiance alone. Blinds operated by hand
         stay up at weekends in non-residential use (8.4.2 j). */
      if (shd.fc < 1 && !(hand && weekend) && (din || ctx.blindRule === "din" || tAir > BLIND_WARM)) for (let w = 0; w < wins.length; w++) if (irr[w][i] > wthr[w]) mask |= wins[w].bit;''',
    '''      /* blinds down when the sun on the window is above the DIN 4108-2 threshold of the use (8.4.2 j), in every run and for
         both blind types (decision of 17 November 2026). Blinds operated by hand stay up at weekends in non-residential use. */
      if (shd.fc < 1 && !(hand && weekend)) for (let w = 0; w < wins.length; w++) if (irr[w][i] > wthr[w]) mask |= wins[w].bit;''')
# ventilation
rep('''      if (din) {
        if (pres[i]) { if (c.dayAch > 0 && tAir > VR.dinDayT && tAir > te) { want = Math.max(base, VR.dinDay); isDay = true; } }
        else if (c.nightAch > 0 && gtotOk && tAir > u.tHeat && tAir > te) want = Math.max(base, c.nightAch);
      } else {
        const dryOut = !coolHi || wx.w[i] <= W_DEHUM, coolOk = !coolHi || !occ[i] || te <= coolHi[i] - 2;
        if (pres[i]) { if (c.dayAch > 0 && tAir > VR.dayT && te <= tAir - VR.dayM && te >= VR.dayOut && dryOut && coolOk) { want = Math.max(base, c.dayAch); isDay = true; } }
        else if (c.nightAch > 0 && lastMax > arm && tAir > u.tHeat && te <= tAir - VR.nightM && dryOut) want = Math.max(base, c.nightAch);
      }''', '''      if (din) { // DIN 4108-2, 8.4.2 h and i: any day opening counts as 3 1/h; tilt windows at night as 2 1/h; across storeys 5 1/h
        if (pres[i]) { if (c.dayAch > 0 && tAir > VR.dinDayT && tAir > te) { want = Math.max(base, VR.dinDay); isDay = true; } }
        else if (c.nightAch > 0 && gtotOk && tAir > u.tHeat && tAir > te) want = Math.max(base, c.nightAch === 5 ? 5 : 2);
      } else { // v16 phase 2: air flow of the opening (EN 16798-7, single-sided, no wind); across storeys: 5 1/h
        const dryOut = !coolHi || wx.w[i] <= W_DEHUM, coolOk = !coolHi || !occ[i] || te <= coolHi[i] - 2;
        if (pres[i]) { if (c.dayAch > 0 && tAir > VR.dayT && te <= tAir - VR.dayM && te >= VR.dayOut && dryOut && coolOk) { want = Math.max(base, ventFlow(ops, c.dayAch, tAir - te) / V); isDay = true; } }
        else if (c.nightAch > 0 && lastMax > arm && tAir > u.tHeat && te <= tAir - VR.nightM && dryOut) want = Math.max(base, c.nightAch === 5 ? 5 : ventFlow(ops, 1, tAir - te) / V);
      }''')
rep('''    const vFloor = u.tHeat + (ctx.ventFloor != null ? ctx.ventFloor : VR.floor);''', '''    const vFloor = u.tHeat + (ctx.ventFloor != null ? ctx.ventFloor : VR.floor), ops = openings(ctx, c);''')
rep('''    const V = zone.volume, Af = zone.floorArea, heat = mode !== "free"''', '''    const V = zone.volume, Af = zone.floorArea, heat = mode !== "free"''')
rep('''designs, shadeOf, zoneParams, humidityRatio, isNorth, shadeSide, achOccOf, pctl, VR };''', '''designs, shadeOf, zoneParams, humidityRatio, isNorth, shadeSide, achOccOf, pctl, VR, openings, effArea, ventFlow };''')
c.save()
