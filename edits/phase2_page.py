import sys; sys.path.insert(0, '/home/claude/rdg/v16/edits'); from lib import Ed
B = '/home/claude/rdg/v16/src/'
# ---------------------------------------------------------------- engine: blinds settings through the context
c = Ed(B + 'core.js')
c.rep('''fanW: opt.fanW != null ? opt.fanW : null, gOcc: opt.gainOcc != null ? opt.gainOcc : null, blindCtl: opt.blindCtl || "auto" };''',
      '''fanW: opt.fanW != null ? opt.fanW : null, gOcc: opt.gainOcc != null ? opt.gainOcc : null, blindCtl: opt.blindCtl || "auto", blinds: opt.blinds || null };''')
c.save()

e = Ed(B + 'page.html'); rep = e.rep
# ---- labels for opening types and blinds
DAYW = '{ 1: "tilt windows", 2: "side-hung windows open" }'
NIGHTW = '{ 1: "tilt windows, secured at night", 5: "air across storeys (atrium, stair) or a fan system" }'
rep('''      case "dayAch": return v ? "day ventilation " + v + " 1/h" : "no day ventilation";
      case "nightAch": return v ? "night ventilation " + v + " 1/h" : "no night ventilation";''',
    f'''      case "dayAch": return v ? "day ventilation by " + {DAYW}[v] : "no day ventilation";
      case "nightAch": return v ? "night ventilation by " + {NIGHTW}[v] : "no night ventilation";''')
rep('''    if (k === "shading") return ({ none: "None", shutter: "Shutter", venetian: "Venetian", interior: "Interior" })[S.SHADE_LEVELS[st.use][v]];
    if (k === "dayAch" || k === "nightAch") return v ? v + " 1/h" : "None";''',
    '''    if (k === "shading") return ({ none: "None", interior: "Interior", exterior: "Exterior" })[S.SHADE_LEVELS[st.use][v]];
    if (k === "dayAch") return ({ 0: "None", 1: "Tilt", 2: "Open" })[v];
    if (k === "nightAch") return ({ 0: "None", 1: "Tilt", 5: "Across storeys" })[v];''')
rep('''  const stratLabel = (p, lv) => (p === "nightAch" && lv === 5 ? "5 1/h, only with air across storeys (atrium, stair) or a fan system" : p === "nightAch" && lv === 2 ? "2 1/h, windows open at night" : levelLabel(p, lv)).replace("Overh.", "Overhang").replace("Venetian", "Exterior venetian").replace("Shutter", "Exterior shutter").replace("Interior", "Interior blind").replace(/^U |^g /, "");''',
    '''  const stratLabel = (p, lv) => p === "nightAch" ? ({ 0: "None", 1: "Tilt windows, secured at night", 5: "Air across storeys (atrium, stair) or a fan system, 5 1/h" })[lv]
    : p === "dayAch" ? ({ 0: "None", 1: "Tilt windows", 2: "Side-hung windows opened" })[lv]
    : p === "shading" ? ({ none: "None", interior: "Interior blind", exterior: "Exterior blind" })[S.SHADE_LEVELS[st.use][lv]]
    : levelLabel(p, lv).replace("Overh.", "Overhang").replace(/^U |^g /, "");''')
rep('''shading: (v) => ["None", "Interior", "Exterior"][v], dayAch: (v) => v ? v + " per h" : "Closed", nightAch: (v) => v ? v + " per h" : "None",''',
    '''shading: (v) => ["None", "Interior", "Exterior"][v], dayAch: (v) => ({ 0: "Closed", 1: "Tilt", 2: "Open" })[v], nightAch: (v) => ({ 0: "None", 1: "Tilt", 5: "Across storeys" })[v],''')
rep('''      case "dayAch": return v ? "Windows opened, " + v + " air changes per hour" : "Windows kept closed";
      case "nightAch": return v ? "Night ventilation, " + v + " air changes per hour" : "No night ventilation";''',
    '''      case "dayAch": return v === 2 ? "Side-hung windows opened when the room is warm" : v === 1 ? "Tilt windows opened when the room is warm" : "Windows kept closed";
      case "nightAch": return v === 5 ? "Night air across storeys (atrium, stair) or by a fan system, 5 air changes per hour" : v === 1 ? "Tilt windows open at night, secured" : "No night ventilation";''')
rep('''scen: "corner", fa: 4, yAx: "E", allow: { mass: ["light", "medium", "heavy"], nightAch: [0, 2] },''', '''scen: "corner", fa: 4, yAx: "E", allow: { mass: ["light", "medium", "heavy"], nightAch: [0, 1] },''')
# ---- opening areas and the ASR A3.6 check (replaces the v12 CIBSE AM10 estimate)
rep('''  /* v12: free opening area for window ventilation, single-sided, driven by the temperature difference (CIBSE AM10 /
     BS 5925): Q = Cd A / 3 √(g h ΔT / T), Cd 0.6, h = window height, ΔT 3 K at night and 2 K by day, no wind (cautious). */
  function openArea(ach, dz, night) {
    const [W, D, H] = st.dims, h = Math.min(H - 0.3, Math.max(1, dz.wwr * H)), dT = night ? 3 : 2;
    const Q = ach * W * D * H / 3600, a = Q / (0.6 / 3 * Math.sqrt(9.81 * h * dT / 293));
    return { a, share: a / (dz.wwr * W * H * 0.7) };
  }
  const openTxt = (p, dz) => { if (!dz[p]) return ""; const o = openArea(dz[p], dz, p === "nightAch"); return `about ${fmt(Math.round(o.a * 10) / 10)} m² of free opening (${Math.round(100 * o.share)}% of the glass of facade A)`; };''',
    '''  /* v16 phase 2: window openings (decision of 17 November 2026). Openable sash = half the window area; tilt windows at 10°
     open 17 % of the sash (EN 16798-7 angle factor), side-hung windows the whole sash. Air flow single-sided, without wind
     (EN 16798-7). Check against ASR A3.6 for offices and schools: tilt windows at least 0.35 m² per person, opened windows
     at least 1.05 m² per 10 m² of floor, room depth at most 2.5 times its height. A warning, not a filter. */
  function openInfo(p, dz, sc) {
    const kind = p === "nightAch" ? (dz[p] === 5 ? 5 : 1) : dz[p];
    if (!kind) return null;
    const scen = sc || st.scen, ops = S.openings({ dims: st.dims, use: S.USE[st.use] }, { scenario: scen === "corner_top" ? "corner" : scen, wwr: dz.wwr, dims: st.dims });
    if (kind === 5) return { kind, txt: "air across storeys (atrium, stair) or a fan system, 5 air changes per hour, as DIN 4108-2", warn: "" };
    const a = S.effArea(ops, kind), [W, D, H] = st.dims, V = W * D * H, ach = S.ventFlow(ops, kind, 3) / V;
    let warn = "";
    if (st.use !== "dwelling") {
      const pers = Register.val("asr.persons")[st.use], need = kind === 1 ? Register.val("asr.tilt") * pers : Register.val("asr.purge") * W * D / 10;
      if (a < need - 1e-9) warn = kind === 1 ? `below ASR A3.6 (${fmt(Math.round(need * 100) / 100)} m² for ${pers} people): fresh air also needs purge ventilation or a mechanical system` : `below ASR A3.6 (${fmt(Math.round(need * 100) / 100)} m² for ${fmt(Math.round(W * D))} m² of floor)`;
      if (D > Register.val("vent.depthMax") * H) warn += (warn ? "; " : "") + `the room is deeper than ${Register.val("vent.depthMax")} times its height, the ASR A3.6 limit for one-sided ventilation`;
    }
    return { kind, a, ach, txt: `${kind === 1 ? "tilt windows" : "side-hung windows"}, ${fmt(Math.round(a * 100) / 100)} m² effective opening, about ${fmt(Math.round(ach * 10) / 10)} air changes per hour at 3 K between inside and outside`, warn };
  }
  const openTxt = (p, dz, sc) => { const o = openInfo(p, dz, sc); return o ? o.txt + (o.warn ? ` (<span class="bad">${o.warn}</span>)` : "") : ""; };''')
rep('''    const ventTxt = (it, dz) => (it.p === "dayAch" || it.p === "nightAch") && dz && dz[it.p] ? ` ${cap(PNAME[it.p].toLowerCase())} at ${dz[it.p]} 1/h needs ${openTxt(it.p, dz)}, single-sided, without wind${it.p === "nightAch" ? ", secure at night" : ""}.` : "";''',
    '''    const ventTxt = (it, dz) => (it.p === "dayAch" || it.p === "nightAch") && dz && dz[it.p] ? ` ${cap(PNAME[it.p].toLowerCase())}: ${openTxt(it.p, dz, sc)}; single-sided, without wind (EN 16798-7).` : "";''')
rep('''(it.p === "dayAch" || it.p === "nightAch") && it.lv0 ? `; needs ${openTxt(it.p, B.best.per[B.A[0]].dz)}` : ""''', '''(it.p === "dayAch" || it.p === "nightAch") && it.lv0 ? `; ${openTxt(it.p, B.best.per[B.A[0]].dz, sc)}` : ""''')
rep('''(p === "dayAch" || p === "nightAch") && dz[p] ? `; needs ${openTxt(p, dz)}` : ""''', '''(p === "dayAch" || p === "nightAch") && dz[p] ? `; ${openTxt(p, dz, sc)}` : ""''')
rep('''${v.map((p) => `${PNAME[p].toLowerCase()} ${dz[p]} 1/h needs ${openTxt(p, dz)}`).join("; ")}; single-sided, without wind.</p>`; }''', '''${v.map((p) => `${PNAME[p].toLowerCase()}: ${openTxt(p, dz, sc)}`).join("; ")}; single-sided, without wind (EN 16798-7).</p>`; }''')
rep('''The free opening area these air changes need is estimated single-sided without wind (CIBSE AM10): about 1 to 2 m² for a cellular office at 5 to 6 1/h.",''',
    '''Window air flow: tilt or side-hung windows, half the window area openable, single-sided without wind (EN 16798-7), checked against ASR A3.6 for offices and schools; air across storeys at 5 1/h. Blinds by the DIN 4108-2 irradiance thresholds in every run, also for daylight; lighting electricity with continuous dimming for offices and schools.",''')
# ---- daylight: UDI by default, blinds in the readings
rep('''mode: "cool", dlm: "S", floor: "en",''', '''mode: "cool", dlm: "UDI", floor: "en",''')
rep('''  const DLNAME = { S: "Useful dayl''', '''  const DLNAME = { UDI: "Useful daylight (UDI)", S: "Useful dayl''')
rep('''  const DLNOTE = {
    S:''', '''  const DLNOTE = {
    UDI: "Share of the floor and of the hours with useful daylight, with the blinds as operated: 300 to 3,000 lx in the occupied hours of offices and schools, 100 to 2,000 lx in the daylight hours of dwellings. 75 means useful daylight three quarters of the time.",
    S:''')
rep('''    const r = st.dl && st.dl[dlScen(sc)][dz.wwr + "|" + dz.fixed];
    return r ? r[a][DS.tvKey(dz.uglass, dz.gglass)] : null;''', '''    const r = st.dl && st.dl[dlScen(sc)][dz.wwr + "|" + dz.fixed];
    return r ? r[a][DS.dlKey(st.ctx, dz)] || r[a][DS.tvKey(dz.uglass, dz.gglass)] : null;''')
# ---- energy: lighting electricity added
rep('''nst energyOf = (r) => st.mode === "heat" ? r.heat.qh / st.copH + (r.heat.fanE || 0) : r.cool.qh / st.copH + r.cool.qc / st.copC + (r.cool.fanE || 0);''',
    '''nst energyOf = (r) => (st.mode === "heat" ? r.heat.qh / st.copH + (r.heat.fanE || 0) : r.cool.qh / st.copH + r.cool.qc / st.copC + (r.cool.fanE || 0)) + (r.heat.lightE || 0);''')
rep('''ceiling_fans_electricity: r1(c.fanE || 0) }; }''', '''ceiling_fans_electricity: r1(c.fanE || 0), lighting_electricity: r1(c.lightE || 0) }; }''')
rep('''${c.fanE ? `, ceiling fans ${fmt(c.fanE)} (${fmt(c.fanH)} h at ${fmt(st.fanWRun)} W/m²)` : ""} ${UE}.` : `Heating need''', '''${c.fanE ? `, ceiling fans ${fmt(c.fanE)} (${fmt(c.fanH)} h at ${fmt(st.fanWRun)} W/m²)` : ""}${c.lightE ? `, lighting ${fmt(c.lightE)}` : ""} ${UE}.` : `Heating need''')
# ---- blinds settings
rep('''fanW: Register.val("run.fan.power"), blindCtl: "auto",''', '''fanW: Register.val("run.fan.power"), blindCtl: "auto", blinds: { exterior: { fc: null, tau: Register.val("blind.ext").tau }, interior: { fc: null, tau: Register.val("blind.int").tau } },''')
rep('''gainOcc: gainNow(), fanW: st.fanW, blindCtl: st.blindCtl }); st.gainRun = gainNow(); st.fanWRun = st.fanW; st.blindCtlRun = st.blindCtl;''',
    '''gainOcc: gainNow(), fanW: st.fanW, blindCtl: st.blindCtl, blinds: JSON.parse(JSON.stringify(st.blinds)) }); st.gainRun = gainNow(); st.fanWRun = st.fanW; st.blindCtlRun = st.blindCtl; st.blindsRun = JSON.parse(JSON.stringify(st.blinds));''')
rep('''gainOcc: st.gainRun, fanW: st.fanWRun, blindCtl: st.blindCtlRun });''', '''gainOcc: st.gainRun, fanW: st.fanWRun, blindCtl: st.blindCtlRun, blinds: st.blindsRun });''')
rep('''gainOcc:m.gainOcc,fanW:m.fanW,blindCtl:m.blindCtl});''', '''gainOcc:m.gainOcc,fanW:m.fanW,blindCtl:m.blindCtl,blinds:m.blinds});''')
rep('''    $("blindctl").value = st.blindCtl; $("blindctl").onchange = () => { st.blindCtl = $("blindctl").value; setStale(true); };''',
    '''    $("blindctl").value = st.blindCtl; $("blindctl").onchange = () => { st.blindCtl = $("blindctl").value; setStale(true); };
    const bl = [["fcext", "exterior", "fc"], ["tauext", "exterior", "tau"], ["fcint", "interior", "fc"], ["tauint", "interior", "tau"]];
    bl.forEach(([id, k, f]) => { const v = st.blinds[k][f]; $(id).value = v == null ? "" : v; $(id).onchange = () => { const s = $(id).value.trim(), x = +s; st.blinds[k][f] = s === "" ? (f === "tau" ? Register.val(k === "exterior" ? "blind.ext" : "blind.int").tau : null) : (x >= 0 && x <= 1 ? x : st.blinds[k][f]); $(id).value = st.blinds[k][f] == null ? "" : st.blinds[k][f]; setStale(true); }; });
    blindThr();''')
rep('''  function init() {
    fillRegister(); bindMods();''', '''  // the DIN 4108-2 thresholds for blinds, shown in the inputs (decision of 17 November 2026)
  function blindThr() { const t = S.SHADE_IRR[st.use]; $("blindthr").textContent = `Blinds come down when the sun on the window exceeds ${t[1]} W/m² (${t[0]} W/m² on north, north-east and north-west facades), as DIN 4108-2, 8.4.2 j, for ${st.use === "dwelling" ? "dwellings" : "offices and schools"}. The same hours reduce the daylight.`; }
  function init() {
    fillRegister(); bindMods();''')
e.save()

sh = Ed(B + 'shell.html')
sh.rep('''        <label class="inl">Blinds operated <select id="blindctl" aria-label="How blinds are operated" style="width:auto"><option value="auto">automatically</option><option value="hand">by hand</option></select></label>''',
       '''        <label class="inl">Blinds operated <select id="blindctl" aria-label="How blinds are operated" style="width:auto"><option value="auto">automatically</option><option value="hand">by hand</option></select></label>
        <span class="small" id="blindthr"></span>
        <details class="small"><summary>Blind properties</summary>
          <label class="inl">Exterior blind F<sub>C</sub> <input id="fcext" type="number" step="0.05" min="0" max="1" placeholder="DIN" style="width:64px"> light <input id="tauext" type="number" step="0.05" min="0" max="1" style="width:64px"></label>
          <label class="inl">Interior blind F<sub>C</sub> <input id="fcint" type="number" step="0.05" min="0" max="1" placeholder="DIN" style="width:64px"> light <input id="tauint" type="number" step="0.05" min="0" max="1" style="width:64px"></label>
          <span class="small">F<sub>C</sub>: share of solar heat let through when down; empty = DIN 4108-2 Table 7 by glazing (exterior 0.25, 0.30 with solar control glass; interior 0.70 double, 0.65 triple). Light: share of daylight let through when down (assumptions 0.10 and 0.25).</span>
        </details>''')
sh.rep('''<div class="seg" id="dlSeg" role="group" aria-label="Daylight measure"><button type="button" data-v="S">Useful daylight, %</button>''',
       '''<div class="seg" id="dlSeg" role="group" aria-label="Daylight measure"><button type="button" data-v="UDI">Useful daylight (UDI), %</button><button type="button" data-v="S">Daylight score S, %</button>''')
sh.rep('''<select id="dlm" aria-label="Daylight measure"><option value="S">Useful daylight, % of floor and working hours</option>''',
       '''<select id="dlm" aria-label="Daylight measure"><option value="UDI">Useful daylight (UDI) with blinds, % of floor and hours</option><option value="S">Daylight score S, % of floor and working hours</option>''')
sh.save()
