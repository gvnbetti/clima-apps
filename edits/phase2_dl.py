import sys; sys.path.insert(0, '/home/claude/rdg/v16/edits'); from lib import Ed
B = '/home/claude/rdg/v16/src/'
c = Ed(B + 'core.js'); rep = c.rep
rep('''tau: RV("blind.ext").v === undefined ? RV("blind.ext").tau : RV("blind.ext").tau },''', '''tau: RV("blind.ext").tau },''')
rep('''  let SKY1 = null;
  // hours: daylight (sun above the horizon, from the sky) and 8:00 to 18:00; evaluated once on their union
  function hourSets(sk) {
    const all = [], day = [], occ = [];
    for (let i = 0; i < 8760; i++) { const d = sk.sun[3 * i + 2] > 0, o = (i % 24) >= 8 && (i % 24) < 18; if (d || o) { all.push(i); day.push(d ? 1 : 0); occ.push(o ? 1 : 0); } }
    return { all, day, occ };
  }''', '''  let SKY1 = null;
  const RG = root.Register || require("./register.js"), UDI = RG.val("dl.udi"), LIT = RG.val("dl.light");
  /* hours: daylight (sun above the horizon, from the sky) and the occupied hours of the use, as the thermal runs: DIN 4108-2
     schedule, Monday 1 January (v16 phase 2; until v16 phase 1 daylight used 8:00 to 18:00 on every day). Evaluated once
     on their union. */
  function hourSets(sk, ctx) {
    const u = ctx && ctx.use, o0 = u ? u.occ[0] : 8, o1 = u ? u.occ[1] : 18, wdOnly = u ? u.weekdays : false;
    const all = [], day = [], occ = [];
    for (let i = 0; i < 8760; i++) { const h = i % 24, d = sk.sun[3 * i + 2] > 0, o = h >= o0 && h < o1 && (!wdOnly || ((i / 24) | 0) % 7 < 5) && !(o0 === 0 && o1 === 24); if (d || o) { all.push(i); day.push(d ? 1 : 0); occ.push(o ? 1 : 0); } }
    return { all, day, occ };
  }''')
rep('''  // metrics from per-sensor hourly illuminance on the union of hours; tb: "day" | "occ" time base for Reading A
  function readings(E, Es, nS, H, sc, tb) {''', '''  /* metrics from per-sensor hourly illuminance on the union of hours; tb: "day" | "occ" time base for Reading A.
     v16 phase 2: fac (optional) = daylight factor of each hour for blinds as operated; band = useful daylight range of the
     use; light = { lpd, target } for lighting electricity with continuous dimming (offices and schools). */
  function readings(E, Es, nS, H, sc, tb, fac, band, light) {
    band = band || UDI.nonres; let udiN = 0, uLo = 0, uHi = 0, litSum = 0;''')
rep('''        const e = E[s * nH + t] * sc;
        if (H.day[t]) { if (e >= 100) d100++;''', '''        const e = E[s * nH + t] * sc * (fac ? fac[t] : 1);
        if (light && H.occ[t]) litSum += e >= light.target ? 0 : 1 - e / light.target;
        if (H.day[t]) { if (e >= 100) d100++;''')
rep('''          if (e < 100) b1++; else if (e < 300) b2++; else if (e <= 3000) b3++; else b4++;''', '''          if (e < 100) b1++; else if (e < 300) b2++; else if (e <= 3000) b3++; else b4++;
          if (e < band[0]) uLo++; else if (e <= band[1]) udiN++; else uHi++;''')
rep('''      f1 += b1 / nA; f2 += b2 / nA; f3 += b3 / nA; f4 += b4 / nA;
    }''', '''      f1 += b1 / nA; f2 += b2 / nA; f3 += b3 / nA; f4 += b4 / nA;
    }
    const udi = 100 * udiN / (nS * nA), udiLo = 100 * uLo / (nS * nA), udiHi = 100 * uHi / (nS * nA);
    const lightE = light ? light.lpd * litSum / nS / 1000 : 0; // kWh/m²a''')
rep('''      UDAp: p(udaP), EXAp: p(exaP), sDA: p(sda), ASE: p(ase), bins: [p(f1), p(f2), p(f3), p(f4)] };''', '''      UDAp: p(udaP), EXAp: p(exaP), sDA: p(sda), ASE: p(ase), bins: [p(f1), p(f2), p(f3), p(f4)],
      udi: Math.round(10 * udi) / 10, udiLo: Math.round(10 * udiLo) / 10, udiHi: Math.round(10 * udiHi) / 10, band: band.slice(), light: Math.round(100 * lightE) / 100 };''')
rep('''  function job(ctx, j, opt) {
    opt = opt || FAST;
    SKY1 = SKY1 || DL.skyPatches(1);
    const c = room(ctx, j.scenario, j.wwr, j.fixed), nS = c.sensors.length, tb = ctx.useKey === "dwelling" ? "day" : "occ";
    const dc = DL.coefficients(c, Object.assign({ sky: SKY1 }, opt)), out = [];
    for (let a = 0; a < 8; a++) {
      const az = S.PARAMS.azimuth[a], sk = skyFor(ctx, az, SKY1), H = hourSets(sk), il = DL.illuminance(dc, sk, H.all), res = {};
      for (const tk of Object.keys(TV)) res[tk] = readings(il.E, il.Es, nS, H, TV[tk] / TAU0, tb);
      out.push(res);
    }
    return out;
  }''', '''  /* job: {scenario: "cellular"|"corner", wwr, fixed}; returns per orientation index: {tvKey: readings without blinds,
     tvKey|interior, tvKey|exterior: readings with blinds as operated}. Blinds come down by the DIN 4108-2 irradiance rule on
     each facade, as in the thermal runs; when down, daylight from that facade is scaled by the blind's light transmittance
     (the windows of a corner room count half each). The EN 17037 minimum (A1) is always read without blinds. */
  const KEEP = ["a100", "a300", "a500", "a750", "en", "A1"];
  function job(ctx, j, opt) {
    opt = opt || FAST;
    SKY1 = SKY1 || DL.skyPatches(1);
    const c = room(ctx, j.scenario, j.wwr, j.fixed), nS = c.sensors.length, tb = ctx.useKey === "dwelling" ? "day" : "occ";
    const band = ctx.useKey === "dwelling" ? UDI.res : UDI.nonres, light = ctx.useKey === "dwelling" ? null : { lpd: LIT.lpd, target: LIT.target[ctx.useKey] || 500 };
    const dc = DL.coefficients(c, Object.assign({ sky: SKY1 }, opt)), out = [], nW = c.windows.length;
    for (let a = 0; a < 8; a++) {
      const az = S.PARAMS.azimuth[a], sk = skyFor(ctx, az, SKY1), H = hourSets(sk, ctx), il = DL.illuminance(dc, sk, H.all), res = {};
      const down = [S.blindsDown(ctx, az)]; if (nW > 1) down.push(S.blindsDown(ctx, (az + 90) % 360));
      const facOf = (tau) => Float32Array.from(H.all, (i) => 1 - down.reduce((s, m) => s + (m[i] ? (1 - tau) / nW : 0), 0));
      const fx = { interior: facOf(S.shadeOf(ctx, { shading: 1, uglass: 0.8, gglass: 0.45 }).tau), exterior: facOf(S.shadeOf(ctx, { shading: 2, uglass: 0.8, gglass: 0.45 }).tau) };
      for (const tk of Object.keys(TV)) {
        const r0 = readings(il.E, il.Es, nS, H, TV[tk] / TAU0, tb, null, band, light); res[tk] = r0;
        for (const k of ["interior", "exterior"]) { const r = readings(il.E, il.Es, nS, H, TV[tk] / TAU0, tb, fx[k], band, light); KEEP.forEach((x) => { r[x] = r0[x]; }); r.passA = r.A1 && r.A2 && r.A3; res[tk + "|" + k] = r; }
      }
      out.push(res);
    }
    return out;
  }
  // key of the daylight readings for a design: glass, and the blind type of its shading level
  const dlKey = (ctx, dz) => { const t = tvKey(dz.uglass, dz.gglass), k = dz.shading != null ? S.SHADE_LEVELS[ctx.useKey][dz.shading] : "none"; return k && k !== "none" ? t + "|" + k : t; };''')
rep('''    const c = room(ctx, scenario, wwr, fixedKey), nS = c.sensors.length, sk = skyFor(ctx, az, SKY1), H = hourSets(sk), tb = ctx.useKey === "dwelling" ? "day" : "occ";''', '''    const c = room(ctx, scenario, wwr, fixedKey), nS = c.sensors.length, sk = skyFor(ctx, az, SKY1), H = hourSets(sk, ctx), tb = ctx.useKey === "dwelling" ? "day" : "occ";''')
rep('''  const api = { job, floorMap, room, sensors, readings, TV, tvKey, TAU0 };''', '''  const api = { job, floorMap, room, sensors, readings, TV, tvKey, TAU0, dlKey, hourSets };''')
# ===================================================================== score: UDI measure
rep('''  const DLM = {
    S: (d) => d.S, // useful daylight score of Reading A''', '''  const DLM = {
    UDI: (d) => (d.udi != null ? d.udi : 0) / 100, // v16 phase 2 default: useful daylight share with blinds as operated
    S: (d) => d.S, // useful daylight score of Reading A''')
rep('''  function daylight(d, measure, floor) { if (!d) return { A1: false, S: 0 }; return { A1: FLOOR[floor || "en"](d), S: DLM[measure || "S"](d) }; }''',
    '''  function daylight(d, measure, floor) { if (!d) return { A1: false, S: 0 }; return { A1: FLOOR[floor || "en"](d), S: DLM[measure || "UDI"](d) }; }''')
# ===================================================================== facade search: blinds in daylight, lighting in energy
rep('''    return { A1: dl.A1, S: dl.S, C: comfortOf(row.heat, o.key + fk), E: o.mode === "heat" ? row.heat.qh / o.copH + (row.heat.fanE || 0) : row.cool.qh / o.copH + row.cool.qc / o.copC + (row.cool.fanE || 0) };''',
    '''    return { A1: dl.A1, S: dl.S, C: comfortOf(row.heat, o.key + fk), E: (o.mode === "heat" ? row.heat.qh / o.copH + (row.heat.fanE || 0) : row.cool.qh / o.copH + row.cool.qc / o.copC + (row.cool.fanE || 0)) + (row.heat.lightE || 0) };''')
rep('''    const dlOf = (dz) => { const t = o.tab[dz.wwr + "|" + dz.fixed]; return t ? t[DS.tvKey(dz.uglass, dz.gglass)] || null : null; };''',
    '''    const dlOf = (dz) => { const t = o.tab[dz.wwr + "|" + dz.fixed]; return t ? t[DS.dlKey(ctx, dz)] || t[DS.tvKey(dz.uglass, dz.gglass)] || null : null; };''')
rep('''      const row = { dz: Object.assign({}, dz), heat: S.runCombo(ctx, c, "heat").heat, cool: S.runCombo(ctx, c, "cool").cool, dl: dlOf(dz) };''',
    '''      const row = { dz: Object.assign({}, dz), heat: S.runCombo(ctx, c, "heat").heat, cool: S.runCombo(ctx, c, "cool").cool, dl: dlOf(dz) };
      row.heat.lightE = row.cool.lightE = row.dl && row.dl.light ? row.dl.light : 0; // lighting electricity, kWh/m²a''')
c.save()
