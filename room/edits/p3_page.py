import sys; sys.path.insert(0, '/home/claude/rdg/v16/edits'); from lib import Ed
B = '/home/claude/rdg/v16/src/'
e = Ed(B + 'page.html'); rep = e.rep

# ===================================================================== worker: scenario runs
rep('''let ctx=null;
const two=''', '''let ctx=null,M0=null,ctxF=null,ctxP=null;
/* v16 phase 3: scenario contexts. clim: the run's weather at the scenario's warming level (sent as wxF), comfort band and
   cooling limit recomputed on it; poor: half the blind hours (night ventilation is switched off in the design itself) */
const mkF=()=>{const m=M0,w=m.wxF;Object.assign(w,Geo.solarPosition(w.lat,w.lon,w.tz));const c=Sweep.context(w,m.use,{dims:m.dims,wallDepth:m.wall,coolSet:m.coolSet,coolHi:m.coolHi,coolHiFan:m.coolHiFan,gainOcc:m.gainOcc,fanW:m.fanW,blindCtl:m.blindCtl,blinds:m.blinds});
 if(m.coolNa){c.coolHi=Float32Array.from(c.BN.B['na_'+m.coolNa].hi);c._coolArr=null;if(m.coolHiFan){const o=new Float32Array(8760);for(let i=0;i<8760;i++)o[i]=c.coolHi[i]+Comfort.FAN_DT>=25?c.coolHi[i]+Comfort.FAN_DT:c.coolHi[i];c.coolHiFan=o;}}return c;};
const two=''')
rep('''ctx=Sweep.context(wx,m.use,{dims:m.dims,wallDepth:m.wall,coolSet:m.coolSet,coolHi:m.coolHi,coolHiFan:m.coolHiFan,gainOcc:m.gainOcc,fanW:m.fanW,blindCtl:m.blindCtl,blinds:m.blinds});postMessage({type:'ready'});}''',
    '''ctx=Sweep.context(wx,m.use,{dims:m.dims,wallDepth:m.wall,coolSet:m.coolSet,coolHi:m.coolHi,coolHiFan:m.coolHiFan,gainOcc:m.gainOcc,fanW:m.fanW,blindCtl:m.blindCtl,blinds:m.blinds});M0=m;ctxF=null;ctxP=null;postMessage({type:'ready'});}''')
rep('''   else if(t.kind==='one') r=two(Object.assign({scenario:t.scenario,azimuth:t.azimuth,supply:'outdoor'},t.dz));''',
    '''   else if(t.kind==='one') r=two(Object.assign({scenario:t.scenario,azimuth:t.azimuth,supply:'outdoor'},t.dz));
   else if(t.kind==='scen'){const c0=t.sk==='clim'?(ctxF||(ctxF=mkF())):(ctxP||(ctxP=Object.assign({},ctx,{blindHalf:true,_coolArr:null})));const d=Object.assign({scenario:t.scenario,azimuth:t.azimuth,supply:'outdoor'},t.dz);if(t.sk==='poor')d.nightAch=0;r={heat:Sweep.runCombo(c0,d,'heat').heat,cool:Sweep.runCombo(c0,d,'cool').cool};}''')
rep('''          else if (o.kind === "din") { st.dinC[o.id] = o.r; dinPending.delete(o.id); scheduleRender(false); }''',
    '''          else if (o.kind === "din") { st.dinC[o.id] = o.r; dinPending.delete(o.id); scheduleRender(false); }
          else if (o.kind === "scen") { st.scenR[o.id] = o.r; scenPending.delete(o.id); scheduleRender(false); }''')
rep('''gainOcc: st.gainRun, fanW: st.fanWRun, blindCtl: st.blindCtlRun, blinds: st.blindsRun });''',
    '''gainOcc: st.gainRun, fanW: st.fanWRun, blindCtl: st.blindCtlRun, blinds: st.blindsRun, wxF: st.scenLv ? forEngineAt(st.scenLv) : null, coolNa: st.model === "na" ? st.cat.na : null });''')
rep('''    const eng = forEngine(st.wx);''', '''    st.scenR = {}; scenPending.clear(); st.scenLv = scenLevel();
    const eng = forEngine(st.wx);''')
rep('''  const forEngine = (w) =>''', '''  /* v16 phase 3: the climate scenario (register scen.climate): +2 °C, or +3 °C when the run is at +2 °C, none at +3 °C;
     the heat island of the run kept */
  const scenLevel = () => { const L = st.mods.level || 0, s = Register.val("scen.climate"); return L < s ? s : L < 3 ? 3 : null; };
  function forEngineAt(L) { const keep = st.mods.level; st.mods.level = L; st.modCache = null; try { return forEngine(st.wx); } finally { st.mods.level = keep; st.modCache = null; } }
  const forEngine = (w) =>''')

# ===================================================================== absolute scales
rep('''  function autoAnchors() {
    const Es = [];''', '''  /* v16 phase 3: energy anchors are fixed per use (register score.energy), no longer proposed from the run. The function
     keeps its other duties. */
  function autoAnchors() { fillAnchors(); checkCoolClimate(); }
  function autoAnchorsOld() {
    const Es = [];''')
rep('''  const targetNow = () => st.target != null ? st.target : st.autoT != null ? st.autoT : 10;
  const upperNow = () => st.upper != null ? st.upper : st.autoU != null ? st.autoU : 40;''',
    '''  const EANCH = Register.val("score.energy"), DLS = Register.val("score.dl");
  const targetNow = () => st.target != null ? st.target : EANCH[st.use][0];
  const upperNow = () => st.upper != null ? st.upper : EANCH[st.use][1];
  // daylight target as a share 0..1 of the measure in use; the EN 17037 rating: the minimum level
  const dlTNow = () => st.dlm === "EN" ? 1 / 3 : (st.dlT != null ? st.dlT : DLS.target) / 100;
  const gridNow = () => st.grid != null ? st.grid : Register.val("carbon.grid");''')
rep('''  const scoreOpts = (sc) => Object.assign({ w: st.w, limit: limitNow(), target: targetNow(), upper: upperNow() }, sc ? comfortAnchors(sc) : {});''',
    '''  const scoreOpts = (sc) => ({ w: st.w, limit: limitNow(), target: targetNow(), upper: upperNow(), dlT: dlTNow(), dinLim: dinRule() ? dinLim() : null });''')
rep('''  function comfortAnchors(sc) {
    if (!st.fac || !st.fac[sc]) return {};''', '''  function comfortAnchors(sc) { return {}; } // v16 phase 3: comfort is never scored relative to the run
  function comfortAnchorsOld(sc) {
    if (!st.fac || !st.fac[sc]) return {};''')
rep('''    const dl = dlOf(sc, dz, a), dq = SC.daylight(dl, st.dlm, st.floor), m = { A1: dq.A1, S: dq.S, C: comfortOf(r, dz), E: energyOf(r) }, s = SC.score(m, scoreOpts(sc));
    const row = { sc, a, dz, r, dl, m, d: s.d, D: s.D, short: bandMode() ? false : s.short };''',
    '''    const dl = dlOf(sc, dz, a), dq = SC.daylight(dl, st.dlm, st.floor), m = { A1: dq.A1, S: dq.S, C: comfortOf(r, dz), E: energyOf(r), din: dinRule() ? r.heat["din_" + st.region] : null }, s = SC.score(m, scoreOpts(sc));
    const row = { sc, a, dz, r, dl, m, d: s.d, D: s.D, q: s.q, t: s.t, ws: s.ws, sf: s.s, short: s.short };''')
rep('''const readKey = () => JSON.stringify([st.mode, st.dlm, st.floor,''', '''const readKey = () => JSON.stringify([st.dlT, st.grid, st.mode, st.dlm, st.floor,''')
# ranking: targets first (register rec.rule)
rep('''    A.forEach((a) => facade(sc, a).ok.forEach((r) => { if (!(r.D > 0)) return; const k = FS.SHARED.map((p) => r.dz[p]).join("|");
      const e = sets.get(k) || { shared: FS.SHARED.reduce((o, p) => { o[p] = r.dz[p]; return o; }, {}), per: {}, k4: SH4.map((p) => r.dz[p]).join("|") };
      if (!e.per[a] || r.D > e.per[a].D) e.per[a] = r; sets.set(k, e); }));
    const full = [...sets.values()].filter((e) => A.every((a) => e.per[a])).map((e) => Object.assign(e, { mean: A.reduce((s, a) => s + e.per[a].D, 0) / A.length, min: Math.min(...A.map((a) => e.per[a].D)) }));''',
    '''    // v16 phase 3: designs ranked by targets first (row.q: meeting every target, then the score; else closeness)
    A.forEach((a) => facade(sc, a).ok.forEach((r) => { const k = FS.SHARED.map((p) => r.dz[p]).join("|");
      const e = sets.get(k) || { shared: FS.SHARED.reduce((o, p) => { o[p] = r.dz[p]; return o; }, {}), per: {}, k4: SH4.map((p) => r.dz[p]).join("|") };
      if (!e.per[a] || r.q > e.per[a].q) e.per[a] = r; sets.set(k, e); }));
    const full = [...sets.values()].filter((e) => A.every((a) => e.per[a])).map((e) => Object.assign(e, { mean: A.reduce((s, a) => s + e.per[a].q, 0) / A.length, min: Math.min(...A.map((a) => e.per[a].q)) }));''')
rep('''    return { A: t.A, best, next: full.filter((e) => e !== best).slice(0, 2), own: full[0], global: !!(g && best.k4 === g) };''',
    '''    return { A: t.A, best, next: full.filter((e) => e !== best).slice(0, 2), own: full[0], global: !!(g && best.k4 === g), meetAll: t.A.every((a) => best.per[a].t && best.per[a].t.all), miss: t.A.filter((a) => !(best.per[a].t && best.per[a].t.all)) };''')
rep('''    const bestAt = PRI.map((w) => A.map((a) => { let b = null, bd = 0; facade(sc, a).ok.forEach((r) => { const D = SC.score(r.m, Object.assign({}, o, { w })).D; if (D > bd) { bd = D; b = r; } }); return b; }));''',
    '''    const bestAt = PRI.map((w) => A.map((a) => { let b = null, bd = 0; facade(sc, a).ok.forEach((r) => { const D = SC.score(r.m, Object.assign({}, o, { w })).q; if (D > bd) { bd = D; b = r; } }); return b; }));''')

# ===================================================================== carbon in comparisons
rep('''  const delta = (b, r) => ({ dS: pts(r.m.S) - pts(b.m.S), dC: r.m.C - b.m.C, dE: r.m.E - b.m.E });''',
    '''  const delta = (b, r) => ({ dS: pts(r.m.S) - pts(b.m.S), dC: r.m.C - b.m.C, dE: r.m.E - b.m.E, dK: carbonOf(r).tot - carbonOf(b).tot });
  /* v16 phase 3: carbon over the study period, per m² floor: embodied (the elements the options change, register carbon.*)
     and operational (delivered energy × grid factor × years) */
  function carbonOf(row) {
    const k = "K" + FS.keyOf(row.dz) + "|" + row.sc + "|" + Math.round(row.m.E * 100) + "|" + gridNow(); if (st.cache[k]) return st.cache[k];
    const em = S.carbonOf(st.dims, row.sc === "cellular" ? "cellular" : "corner", row.dz), op = row.m.E * gridNow() * Register.val("carbon.years");
    return (st.cache[k] = { emb: em.total, per: em.per, op, tot: em.total + op });
  }
  const kgTxt = (x) => fmt(Math.round(x)) + " kg CO₂e/m²";''')
rep('''  const deltaTxt = (c) => { const p = []; if (Math.abs(c.dC) >= 1) p.push(`${c.dC > 0 ? "+" : "−"}${fmt(Math.round(Math.abs(c.dC)))} K·h/a overheating`); if (Math.abs(c.dE) >= 0.1) p.push(`${c.dE > 0 ? "+" : "−"}${fmt(Math.abs(c.dE))} ${UE} energy`); if (Math.abs(c.dS) >= 1) p.push(`daylight ${dlDelta(c.dS)}`); return p.join(", ") || "no clear change"; };''',
    '''  const deltaTxt = (c) => { const p = []; if (Math.abs(c.dC) >= 1) p.push(`${c.dC > 0 ? "+" : "−"}${fmt(Math.round(Math.abs(c.dC)))} K·h/a overheating`); if (Math.abs(c.dE) >= 0.1) p.push(`${c.dE > 0 ? "+" : "−"}${fmt(Math.abs(c.dE))} ${UE} energy`); if (Math.abs(c.dS) >= 1) p.push(`daylight ${dlDelta(c.dS)}`); if (c.dK != null && Math.abs(c.dK) >= 5) p.push(`${c.dK > 0 ? "+" : "−"}${fmt(Math.round(Math.abs(c.dK)))} kg CO₂e/m² over ${Register.val("carbon.years")} years`); return p.join(", ") || "no clear change"; };''')

# ===================================================================== edge flag: only for window size; chips labels
rep('''    if (!["wwr", "dayAch", "nightAch"].includes(p)) return "";''', '''    if (p !== "wwr") return ""; // v16 phase 3: window types and night ventilation are kinds, not sizes''')
rep('''    if (dz.nightAch) c.push(`Night air ${dz.nightAch} ach`); if (dz.fans) c.push("Ceiling fans"); if (dz.dayAch) c.push(`Day air ${dz.dayAch} ach`);''',
    '''    if (dz.nightAch) c.push(`Night: ${SHORT4.nightAch(dz.nightAch).toLowerCase()}`); if (dz.fans) c.push("Ceiling fans"); if (dz.dayAch) c.push(`Day: ${SHORT4.dayAch(dz.dayAch).toLowerCase()} windows`);''')

# ===================================================================== unscored criteria on the decision cards
rep('''  function decisionsHtml(sc, B) {
    const core = briefCore(sc); if (!core) return "";''', '''  // v16 phase 3: what the simulation does not judge, per measure; any of these can reverse a close decision
  const NOTSCORED = {
    wwr: "Not scored: glare from low sun (beyond the over-lit share), view, privacy, cost.",
    dayAch: "Not scored: outdoor noise, rain, draughts at desks. On a loud street, plan for the closed-window case.",
    nightAch: "Not scored: security, noise, insects, rain. Needs secured tilt windows or protected openings.",
    shading: "Not scored: wind (exterior blinds retract in strong wind), maintenance, view out when down.",
    fixed: "Not scored: winter sun and view lost, cost, appearance.",
    fans: "Not scored: noise and draught at desks.",
    gglass: "Not scored: colour and reflection of solar control glass.",
    mass: "Not scored: acoustics of exposed soffits.",
  };
  const nsTxt = (p) => NOTSCORED[p] ? ` <span class="small mute">${NOTSCORED[p]}</span>` : "";
  function decisionsHtml(sc, B) {
    const core = briefCore(sc); if (!core) return "";''')
rep('''        <p>${w ? `Instead ${lcF(choice4(it.p, w.level))}: ${deltaTxt(w)}${at(w)}.` : ""}${extra || ""}</p>''',
    '''        <p>${w ? `Instead ${lcF(choice4(it.p, w.level))}: ${deltaTxt(w)}${at(w)}.` : ""}${extra || ""}${nsTxt(it.p)}</p>''')

# ===================================================================== texts that described the relative scales
rep('''    const rel = scoreOpts(sc).cZero != null ? " No design meets the limit: comfort is scored relative to this run." : "";''', '''    const rel = "";''')
rep('''`Range across the ${n} facades. Ranks the designs; no limit applies here (DIN 4108-2 decides compliance). Scored relative to this run.`''',
    '''`Range across the ${n} facades. Limit ${fmt(limitNow())} K·h/a (score 0.5 there); DIN 4108-2 decides compliance.`''')
rep('''`Range across the ${n} facades. Target ${fmt(targetNow())}, upper value ${fmt(upperNow())} ${UE}${st.target == null ? ", proposed from this run" : ""}.`''',
    '''`Range across the ${n} facades. Target ${fmt(targetNow())}, limit ${fmt(upperNow())} ${UE}.`''')
rep('''${bandMode() ? `ranked by degree-hours above the band (no limit; DIN 4108-2 decides compliance)` : `with a limit of ${fmt(limitNow())} K·h/a`}''',
    '''${`with a limit of ${fmt(limitNow())} K·h/a`}''')
rep('''target ${fmt(targetNow())}, upper value ${fmt(upperNow())} kWh/m²a${st.target == null ? ", proposed from this run" : ""}). Priorities: ${wTxt()}.''',
    '''target ${fmt(targetNow())}, limit ${fmt(upperNow())} kWh/m²a). Daylight target ${Math.round(dlTNow() * 100)}${st.dlm === "EN" ? " (minimum level)" : "%"}. Priorities: ${wTxt()}. Fixed scales: designs that meet every target come first.''')
rep('''Score 1 at or below the target, 0 at or above the upper value.${st.target == null || st.upper == null ? " Grey values are proposed from the run; type to set your own." : ""}`;''',
    '''Score 1 at or below the target, 0.5 at the limit. Defaults per room use (assumptions, register score.energy); type to set your own.`;
    $("dlt").value = st.dlT != null ? st.dlT : DLS.target; $("grid").value = gridNow();''')
rep('''      if (cz) parts.push(`Among them, overheating is ${rg(ok.map((r) => r.m.C), " K·h/a")}, all at or above the point where comfort scores 0 (${fmt(o.cZero != null ? o.cZero : 2 * o.limit)} K·h/a).`);
      if (ez) parts.push(`Delivered energy is ${rg(ok.map((r) => r.m.E), " " + UE)}, all at or above the upper value of ${fmt(o.upper)} ${UE}. Raise the upper value in the reading panel.`);''',
    '''      if (cz) parts.push(`Among them, overheating is ${rg(ok.map((r) => r.m.C), " K·h/a")}.`);
      if (ez) parts.push(`Delivered energy is ${rg(ok.map((r) => r.m.E), " " + UE)}.`);''')
rep('''comfort_score_zero_at_Kh: r1(scoreOpts(sc).cZero != null ? scoreOpts(sc).cZero : 2 * limitNow()), energy_score_zero_at: r1(upperNow()),''',
    '''comfort_score_half_at_Kh: r1(limitNow()), energy_target: r1(targetNow()), energy_limit_score_half: r1(upperNow()), daylight_target: r1(dlTNow() * 100),''')

# ===================================================================== verdicts, least worst, packages, scenarios
rep('''  // ---- render
  function renderV4() {''', '''  /* ============================================================ v16 phase 3 (17 November 2026)
     Verdicts on fixed scales, the closest design when nothing meets the targets, other packages, scenarios, carbon. */
  const scenPending = new Set();
  const SCN = () => [["clim", st.scenLv ? CM.futLab(st.scenLv) + " climate" : null], ["poor", "Poor operation"]].filter((x) => x[1]);
  // a design rerun in a scenario (register scen.*): queued once the search is done; daylight unchanged
  function scenOf(sk, sc, a, row) {
    const id = [sk, sc, a, FS.keyOf(row.dz)].join("|"), r = st.scenR[id];
    if (r) { const m = Object.assign({}, row.m, { C: FS.comfortOf(r.heat, compKey(row.dz)), E: energyOf(r), din: null }), s = SC.score(m, Object.assign(scoreOpts(sc), { dinLim: null }));
      return { sc, a, dz: row.dz, r, m, q: s.q, t: s.t, share: shareOf(r, row.dz) }; }
    if (st.running || st.topping || (st.refine && st.refine.phase !== "done") || scenPending.has(id) || !workers.length) return null;
    scenPending.add(id); queue.push({ kind: "scen", id, sk, scenario: sc, azimuth: S.PARAMS.azimuth[a], dz: row.dz }); setTimeout(wake, 0); return null;
  }
  // share of occupied hours above the comfort band, without cooling
  function shareOf(r, dz) { const h = r.heat, above = st.model === "din" ? h["dinh_" + st.region] : (h[compKey(dz)] || [])[3]; return above == null ? null : 100 * above / nOccNow(); }
  // other packages at a facade (register rec.packages): same target status, score close to the recommended one, two or more measures different
  const PKG = Register.val("rec.packages"), PKM = ["wwr", "fixed", "uglass", "gglass", "shading", "dayAch", "nightAch", "fans", "mass", "opaque", "roof"];
  const ndiff = (x, y) => PKM.reduce((n, p) => n + (p === "wwr" ? (Math.abs(x.dz.wwr - y.dz.wwr) >= 0.1 ? 1 : 0) : x.dz[p] !== y.dz[p] ? 1 : 0), 0);
  function packagesOf(sc, a, rec) {
    const fa = facade(sc, a); if (!fa || !rec) return [];
    const k = "PK" + sc + a + FS.keyOf(rec.dz) + fa.key; if (st.cache[k]) return st.cache[k];
    const same = (r) => FS.SHARED.every((p) => r.dz[p] === rec.dz[p]);
    const cand = fa.ok.filter((r) => r !== rec && same(r) && (rec.t.all ? r.t.all && r.D >= rec.D - PKG.maxLoss : !r.t.all && r.t.req === rec.t.req && r.ws <= rec.ws + 0.1)).sort((x, y) => y.q - x.q);
    const out = []; for (const r of cand) { if (out.length >= PKG.n) break; if (ndiff(r, rec) >= PKG.minDiff && out.every((o) => ndiff(r, o) >= PKG.minDiff)) out.push(r); }
    return (st.cache[k] = out);
  }
  const vWord = (r) => r.m.A1 ? SC.dlWord(r.m.S) : "below the minimum";
  const overlit = (r) => r.dl && r.dl.udiHi != null && r.dl.udiHi > DLS.overlit;
  // shortfalls of the closest design, in units
  function missTxt(r) {
    const t = r.t, w = [];
    if (!t.A1) w.push(`the daylight minimum (${FLOORNAME[st.floor]}) is not met`);
    if (t.A1 && !t.S) w.push(`useful daylight ${dlVal(r.m.S)}${st.dlm === "EN" ? "" : "%"} against ${Math.round(dlTNow() * 100)}${st.dlm === "EN" ? "" : "%"}`);
    if (!t.din) w.push(`DIN 4108-2 estimated at ${fmt(Math.round(r.m.din))} of ${fmt(dinLim())} K·h/a`);
    if (!t.C) w.push(`overheating ${fmt(Math.round(r.m.C))} K·h/a against ${fmt(limitNow())}`);
    if (!t.E) w.push(`energy ${fmt(r.m.E)} against ${fmt(upperNow())} ${UE}`);
    return listJoin(w);
  }
  // what could close the gap, in order of effort
  function wayOut(sc, B) {
    const w = [], off = STRAT.filter((p) => st.allow[p] && S.PARAMS[p] && st.allow[p].length < S.PARAMS[p].length && p !== "roof");
    if (off.length) w.push(`allow the measures left out of the strategies to test (${listJoin(off.map((p) => SLAB[p].toLowerCase()))})`);
    if (!fanOkNow()) w.push("ceiling fans, where the comfort standard credits them");
    const miss = B.miss.map((a) => B.best.per[a]);
    if (miss.some((r) => !r.t.C || !r.t.din)) w.push("cooling: see the cooling answer below (chilled ceiling before air conditioning)");
    if (miss.some((r) => !r.t.S || !r.t.A1)) w.push("a shallower room or a higher ceiling for daylight");
    if (miss.some((r) => !r.t.E)) w.push("a higher energy limit, if the project accepts it");
    return w;
  }
  function verdictHtml(sc, B) {
    const A = B.A, rows = A.map((a) => B.best.per[a]), Y = Register.val("carbon.years");
    let h = `<div class="v4h"><h2>Verdict</h2><span class="small">Fixed targets: useful daylight ${Math.round(dlTNow() * 100)}${st.dlm === "EN" ? " (EN 17037 minimum level)" : "%"}, overheating ${fmt(limitNow())} K·h/a, energy ${fmt(upperNow())} ${UE}${dinRule() ? ", DIN 4108-2" : ""}. Change them in the reading panel.</span></div>`;
    if (B.meetAll) h += `<p class="lead ok">The recommended design meets every target at ${A.length > 1 ? "every facade" : orientLabel(sc, A[0])}.</p>`;
    else { const wo = wayOut(sc, B);
      h += `<p class="lead bad">No design tested meets every target at ${listJoin(B.miss.map((a) => orientLabel(sc, a)))}. The design shown there is the closest (the smallest largest shortfall, weighted by the priorities${dinRule() || st.floor !== "none" ? "; the daylight minimum and DIN 4108-2 are not traded" : ""}).</p><ul class="miss">${B.miss.map((a) => `<li><b>${orientLabel(sc, a)}</b>: ${missTxt(B.best.per[a])}.</li>`).join("")}</ul>${wo.length ? `<p class="small">What could close the gap, in order of effort: ${wo.join("; ")}.</p>` : ""}`; }
    const sc2 = SCN();
    h += `<div class="tw"><table class="cmp vtab"><thead><tr><th>Facade</th><th>Daylight</th>${dinRule() ? "<th>DIN 4108-2</th>" : ""}<th>Comfort, no cooling</th><th>Cooling</th><th>Energy</th><th>Carbon, ${Y} years</th></tr></thead><tbody>`;
    rows.forEach((r, i) => { const a = A[i], cv = coolVerdict(r, sc, a), K = carbonOf(r), sh = shareOf(r.r, r.dz);
      const scn = sc2.map(([sk, lab]) => { const x = scenOf(sk, sc, a, r); return x ? { lab, x, v: x.share != null && x.share <= st.maxOut ? "none" : "need" } : { lab, x: null }; });
      const cRange = scn.filter((s) => s.x).map((s) => s.x.m.C), cc = [r.m.C].concat(cRange);
      const asr = ["dayAch", "nightAch"].map((p) => openInfo(p, r.dz, sc)).filter((o) => o && o.warn);
      h += `<tr><th scope="row">${orientLabel(sc, a)}</th>
        <td><b class="${r.t.S && r.t.A1 ? "" : "bad"}">${cap(vWord(r))}</b><br><small>${dlVal(r.m.S)}${st.dlm === "EN" ? "" : "%"} useful${overlit(r) ? `; <span class="bad">over-lit ${fmt(r.dl.udiHi)}%</span>` : ""}</small></td>
        ${dinRule() ? (() => { const c = dinComply(sc, a, r, true); return `<td><b class="${c.ok ? "" : "bad"}">${c.exact ? (c.ok ? "Complies" : "Fails") : "Checking"}</b><br><small>${fmt(Math.round(c.kh))} of ${fmt(dinLim())} K·h/a</small></td>`; })() : ""}
        <td><b class="${r.t.C ? "" : "bad"}">${r.t.C ? "Within the limit" : "Above the limit"}</b><br><small>${fmt(Math.round(r.m.C))} K·h/a${sh != null ? `, ${pct(sh)} of occupied hours above the band` : ""}${cRange.length ? `; ${fmt(Math.round(Math.min(...cc)))} to ${fmt(Math.round(Math.max(...cc)))} across scenarios` : ""}</small></td>
        <td><b>${VSHORT[cv.v]}</b>${scn.length ? `<br><small>${scn.map((s) => `${s.lab.toLowerCase()}: ${s.x ? (s.v === "none" ? "no cooling" : `cooling likely (${pct(s.x.share)} of hours above the band)`) : "running…"}`).join("; ")}</small>` : ""}</td>
        <td><b class="${r.t.E ? "" : "bad"}">${r.m.E <= targetNow() ? "At or below the target" : r.t.E ? "Within the limit" : "Above the limit"}</b><br><small>${fmt(r.m.E)} ${UE}</small></td>
        <td><b>${kgTxt(K.tot)}</b><br><small>embodied ${fmt(Math.round(K.emb))}, operation ${fmt(Math.round(K.op))}</small></td></tr>`;
      if (asr.length) h += `<tr><td></td><td colspan="${dinRule() ? 6 : 5}" class="small"><span class="bad">ASR A3.6: ${asr.map((o) => o.warn).join("; ")}.</span></td></tr>`;
    });
    h += `</tbody></table></div>`;
    // robustness to the assumptions
    const rob = A.map((a) => robustOf(sc, a, B.best.per[a])).filter(Boolean);
    if (rob.length) h += `<p class="small"><b>Under other conditions</b> (${sc2.map((s) => s[1].toLowerCase()).join(", ")}; register scen.*): ${rob.map((x) => `${orientLabel(sc, x.a)}: ${x.txt}`).join("; ")}.</p>`;
    h += `<p class="small">Carbon: embodied carbon of the elements the options change (window, wall, blinds, fixed shading, mass, fans, night ventilation hardware, with replacements over ${Y} years) and operation at ${fmt(gridNow())} kg CO₂e/kWh. Generic factors, to be replaced with the project's data. Not part of the score.</p>`;
    return h;
  }
  // robustness of the recommended design: comfort limit kept, and still the best of the shortlist (recommended + packages)
  function robustOf(sc, a, rec) {
    const list = [rec].concat(packagesOf(sc, a, rec)), out = [];
    for (const [sk, lab] of SCN()) {
      const xs = list.map((r) => scenOf(sk, sc, a, r)); if (xs.some((x) => !x)) return { a, txt: "running…" };
      const x0 = xs[0], best = xs.reduce((b, x) => x.q > b.q ? x : b, x0), i = xs.indexOf(best);
      const keep = x0.t.C ? "holds the comfort limit" : `${fmt(Math.round(x0.m.C))} K·h/a, above the limit`;
      out.push(`${lab.toLowerCase()} ${keep}${i > 0 ? `, and package ${String.fromCharCode(65 + i - 1)} does better there` : list.length > 1 ? ", still the best of the shortlist" : ""}`);
    }
    return out.length ? { a, txt: out.join("; ") } : null;
  }
  function packagesHtml(sc, a, rec) {
    const P = packagesOf(sc, a, rec), meas = MEASURES(sc), Y = Register.val("carbon.years"); if (!P.length) return `<h3 class="v4k">Other packages at this facade</h3><p class="small">No other design ${rec.t.all ? "meets the targets within 0.05 of the score" : "comes as close"} while differing in two or more measures: the recommended design has no near equal here.</p>`;
    const K0 = carbonOf(rec), scn = SCN();
    const row = (nm, r) => { const K = carbonOf(r), d = r === rec ? null : delta(rec, r);
      const sx = scn.map(([sk]) => scenOf(sk, sc, a, r)).map((x) => x ? fmt(Math.round(x.m.C)) : "…").join(" / ");
      return `<tr${r === rec ? ` class="rr"` : ""}><th scope="row">${nm}</th><td>${dlVal(r.m.S)}</td><td>${fmt(Math.round(r.m.C))}</td><td>${fmt(r.m.E)}</td><td>${fmt(Math.round(K.tot))} <small>(${fmt(Math.round(K.emb))} embodied)</small></td>${scn.length ? `<td>${sx}</td>` : ""}<td class="small">${d ? meas.filter((p) => r.dz[p] !== rec.dz[p]).map((p) => lcF(choice4(p, r.dz[p]))).join("; ") : "the recommended design"}</td></tr>`; };
    return `<h3 class="v4k">Other packages at this facade</h3><p class="small">Designs that ${rec.t.all ? "also meet every target and score within 0.05 of the recommended one" : "come about as close to the targets"}, each different from it and from each other in at least two measures. A single swap on a decision card keeps everything else; these change several things at once.</p>
      <div class="tw"><table class="cmp"><thead><tr><th>Design</th><th>Daylight</th><th>Overheating, K·h/a</th><th>Energy, ${UE}</th><th>Carbon, kg CO₂e/m² over ${Y} years</th>${scn.length ? `<th>Overheating: ${scn.map((s) => s[1].toLowerCase()).join(" / ")}</th>` : ""}<th>Differs in</th></tr></thead><tbody>${row("Recommended", rec)}${P.map((r, i) => row("Package " + String.fromCharCode(65 + i), r)).join("")}</tbody></table></div>`;
  }

  // ---- render
  function renderV4() {''')
rep('''    $("v4tiles").innerHTML = tilesHtml(sc, B);''', '''    $("v4tiles").innerHTML = tilesHtml(sc, B); $("v5verd").innerHTML = verdictHtml(sc, B);''')
rep('''$("v4dec").innerHTML = ""; $("v4fac").innerHTML = "";''', '''$("v4dec").innerHTML = ""; $("v4fac").innerHTML = ""; $("v5verd").innerHTML = "";''')
rep('''    if (wi) h += `<button type="button" class="ghost" id="wireset">Back to the recommended design</button>`;
    h += `</div></div>`;''', '''    if (wi) h += `<button type="button" class="ghost" id="wireset">Back to the recommended design</button>`;
    h += `</div></div>`;
    h += packagesHtml(sc, a, rec);''')
# inputs
rep('''    $("upp").onchange = () =>''', '''    $("dlt").onchange = () => { const v = +$("dlt").value; st.dlT = $("dlt").value === "" ? null : v >= 0 && v <= 100 ? v : st.dlT; fillAnchors(); reread(); };
    $("grid").onchange = () => { const v = +$("grid").value; st.grid = $("grid").value === "" ? null : v >= 0 ? v : st.grid; fillAnchors(); reread(); };
    $("upp").onchange = () =>''')
# version note
rep('''    ["v16, phase 2", "17 Nov 2026",''', '''    ["v16, phase 3", "17 Nov 2026", "Fixed scales instead of scales from the run: daylight target 40% useful daylight, comfort limit, energy target and limit per use. Designs that meet every target come first; when none does, the closest design is recommended and the page says so, with the shortfalls and what could close the gap. Verdict table per facade: daylight in words, DIN 4108-2, comfort, cooling, energy, carbon. Other packages that do about as well by other means. Scenarios: +2 °C climate and poor operation (half the blind hours, no night ventilation) for the recommended design and the packages. Carbon over 50 years from generic factors (embodied and operation, not scored). What the simulation does not judge is named on each decision card. Corrected: the edge note on window types."],
    ["v16, phase 2", "17 Nov 2026",''')
e.save()

sh = Ed(B + 'shell.html')
sh.rep('''      <section class="v4tiles" id="v4tiles"></section>''', '''      <section class="v4s v4card" id="v5verd"></section>
      <section class="v4tiles" id="v4tiles"></section>''')
sh.rep('''            <span class="small">Judged without cooling. If no design meets the limit, comfort is scored relative to the run and the page says so.</span></div>''',
       '''            <span class="small">Judged without cooling. Score 0.5 at the limit; a design above it does not meet the comfort target.</span></div>''')
sh.rep('''            <label class="inl">Upper value <input id="upp" type="number" step="0.5" min="0" style="width:80px"> kWh/m²a</label>''',
       '''            <label class="inl">Limit <input id="upp" type="number" step="0.5" min="0" style="width:80px"> kWh/m²a</label>
            <label class="inl">Carbon of electricity <input id="grid" type="number" step="0.01" min="0" style="width:80px"> kg CO₂e/kWh, mean over 50 years</label>''')
sh.rep('''            <label class="chk"><input type="checkbox" id="floorOn"> Require the EN 17037 minimum</label>''',
       '''            <label class="inl">Daylight target <input id="dlt" type="number" step="5" min="0" max="100" style="width:70px"> % useful daylight</label>
            <label class="chk"><input type="checkbox" id="floorOn"> Require the EN 17037 minimum</label>''')
sh.rep('''      <p>Scoring: each metric scored 0 to 1 (daylight as chosen; comfort: 1 at 0, 0 at twice the comfort limit; energy: 1 at or below the target, 0 at or above the upper value). The overall score is the weighted geometric mean, with the weights set in the priority triangle. Corner picks: the option with the smallest largest weighted shortfall, weight 0.6 on one metric and 0.2 on the others. Regret: the best option's score minus the best score found with that measure changed. The relative scales (energy from the run, comfort from the run in Germany) are to be replaced by fixed targets in the next phase.</p>''',
       '''      <p>Scoring (v16 phase 3): fixed scales, never taken from the run. Daylight: the useful daylight share; target 40% (sufficient), words at 40, 60 and 80%. Comfort: 1 with no overheating, 0.5 at the limit, 1/3 at twice the limit. Energy: 1 at or below the target, 0.5 at the limit. The overall score is the weighted geometric mean, with the weights set in the priority triangle. Recommended design at each facade: among the designs that meet every target (daylight minimum, daylight target, comfort limit, energy limit and, in Germany, DIN 4108-2 as estimated in the design run), the one with the highest score; when none meets them all, the closest design: the smallest largest shortfall, each shortfall as a share of its target and weighted by the priorities, with the daylight minimum and DIN 4108-2 never traded. Other packages: up to three designs with the same target status, at most 0.05 below in score, differing in two or more measures. Scenarios: the recommended design and the packages rerun at +2 °C (+3 °C when the run is at +2 °C) and with poor operation (blinds down on every other day only, no night ventilation). Carbon: embodied carbon of the elements the options change, with replacements over 50 years, plus delivered energy times the grid factor over 50 years; generic factors listed in the register, shown but not scored. Corner picks: the option with the smallest largest weighted shortfall, weight 0.6 on one metric and 0.2 on the others.</p>''')
sh.save()
