import sys; sys.path.insert(0, '/home/claude/rdg/v16/edits'); from lib import Ed
B = '/home/claude/rdg/v16/src/'
c = Ed(B + 'core.js'); rep = c.rep
# ---------------------------------------------------------------- daylight only for the orientations in the run
rep('''    for (let a = 0; a < 8; a++) {
      const az = S.PARAMS.azimuth[a], sk = skyFor(ctx, az, SKY1), H = hourSets(sk, ctx), il = DL.illuminance(dc, sk, H.all), res = {};''',
    '''    for (let a = 0; a < 8; a++) {
      if (j.azs && !j.azs.includes(a)) { out.push(null); continue; } // v16 phase 3.2: only the orientations of the run
      const az = S.PARAMS.azimuth[a], sk = skyFor(ctx, az, SKY1), H = hourSets(sk, ctx), il = DL.illuminance(dc, sk, H.all), res = {};''')
# ---------------------------------------------------------------- search: ranking metrics and the targeted local search
rep('''    return { A1: dl.A1, S: dl.S, C: comfortOf(row.heat, o.key + fk), E: (o.mode === "heat"''',
    '''    // v16 phase 3.2: with o.rk (ranking options from the page) also the share of hours above the band and the DIN estimate
    const rk = o.rk, hx = row.heat[o.key + fk], H = rk && rk.model !== "din" && Array.isArray(hx) ? 100 * hx[3] / rk.nOcc : null, din = rk && rk.dinLim != null ? row.heat["din_" + rk.region] : null;
    return { H, din, A1: dl.A1, S: dl.S, C: comfortOf(row.heat, o.key + fk), E: (o.mode === "heat"''')
rep('''    const okGeo = (dz) => { if (noneA1) return true; const d = E.dlOf(dz); return SC.daylight(d, o.dlm, o.floor).A1; };''',
    '''    const okGeo = (dz) => { const d = E.dlOf(dz); if (!d) return false; if (noneA1) return true; return SC.daylight(d, o.dlm, o.floor).A1; };''')
rep('''    const complete = o.pls === false ? true : paretoLocal(E, o, meas, okGeo);''',
    '''    const complete = o.pls === false ? true : o.rk && !o.fullFront ? targetedLocal(E, o, meas, okGeo) : paretoLocal(E, o, meas, okGeo);''')
rep('''  function paretoLocal(E, o, meas, okGeo) {''', '''  /* v16 phase 3.2 (decision of 17 November 2026): targeted local search. Instead of filling the whole front of daylight,
     overheating and energy, every single change is simulated around the designs the result is built from: the two best
     under each of the 7 priority settings (targets first), the five best that meet every target (the packages) and the
     one with the least whole-life carbon among those that meet every target. Repeats until these stop changing. */
  function targetedLocal(E, o, meas, okGeo) {
    const rk = o.rk, cap = o.cap || 5000, done = new Set();
    const base = { limit: o.limit, target: rk.target, upper: rk.upper, dlT: rk.dlT, maxOut: rk.maxOut, dinLim: rk.dinLim, noC: rk.noC };
    const carb = (r) => r._k != null ? r._k : (r._k = S.carbonOf(rk.dims, rk.cscen, r.dz).total + r.m.E * rk.grid * rk.years);
    for (;;) {
      const A = E.arch, centers = new Set();
      for (const w of rk.pri) { const ow = Object.assign({}, base, { w }); A.map((r) => [SC.score(r.m, ow).q, r]).sort((x, y) => y[0] - x[0]).slice(0, 2).forEach((x) => centers.add(x[1])); }
      const o0 = Object.assign({}, base, { w: rk.pri[0] }), meet = A.filter((r) => SC.meets(r.m, o0).all);
      meet.map((r) => [SC.score(r.m, o0).q, r]).sort((x, y) => y[0] - x[0]).slice(0, 5).forEach((x) => centers.add(x[1]));
      if (meet.length) centers.add(meet.reduce((b, r) => carb(r) < carb(b) ? r : b, meet[0]));
      const todo = [...centers].filter((r) => !done.has(keyOf(r.dz)));
      if (!todo.length) return true;
      for (const r of todo) {
        done.add(keyOf(r.dz));
        for (const p of meas) for (const lv of LV(o, p)) {
          if (lv === r.dz[p]) continue;
          const dz = Object.assign({}, r.dz, { [p]: lv });
          if (E.seen.has(keyOf(dz)) || !okGeo(dz)) continue;
          E.ev(dz); if (E.arch.length >= cap) return false;
        }
      }
    }
  }
  function paretoLocal(E, o, meas, okGeo) {''')
c.save()

e = Ed(B + 'page.html'); rep = e.rep
# ---------------------------------------------------------------- daylight jobs: only room types and orientations of the run
rep('''    for (const sc of DLSC) for (const w of S.PARAMS.wwr) for (const f of S.PARAMS.fixed) queue.push({ kind: "dl", id: [sc, w + "|" + f], job: { scenario: sc, wwr: w, fixed: f } });''',
    '''    // v16 phase 3.2: daylight only for the room types and orientations of the run
    for (const sc of DLSC.filter((d) => st.types.some((t) => dlScen(t) === d))) for (const w of S.PARAMS.wwr) for (const f of S.PARAMS.fixed) queue.push({ kind: "dl", id: [sc, w + "|" + f], job: { scenario: sc, wwr: w, fixed: f, azs: azsOf(sc) } });''')
rep('''  function dlTab(sc, a) {''', '''  const azsOf = (d) => [...new Set([].concat(...st.types.filter((t) => dlScen(t) === d).map(facList)))];
  // ranking options sent to the search workers (targets first, priority settings, carbon): the targeted search uses them
  const rankOpts = (sc) => ({ pri: PRI, target: targetNow(), upper: upperNow(), dlT: dlTNow(), maxOut: st.model === "din" ? null : st.maxOut, dinLim: dinRule() ? dinLim() : null, region: st.region, noC: !!st.coolClimate, nOcc: nOccNow(), model: st.model, dims: st.dims, cscen: sc === "cellular" ? "cellular" : "corner", grid: gridNow(), years: Register.val("carbon.years") });
  function dlTab(sc, a) {''')
rep('''    return r ? r[a][DS.dlKey(st.ctx, dz)] || r[a][DS.tvKey(dz.uglass, dz.gglass)] : null;''', '''    return r && r[a] ? r[a][DS.dlKey(st.ctx, dz)] || r[a][DS.tvKey(dz.uglass, dz.gglass)] : null;''')
# refine: picks by the targets-first rank; daylight only for the fixed shading of the picks
rep('''      const picks = new Set(B && B.best.per[a] ? [B.best.per[a].dz.wwr] : []);
      PRI.forEach((w) => { let b = null, bd = 0; fa.ok.forEach((r) => { const D = SC.score(r.m, Object.assign({}, o, { w })).D; if (D > bd) { bd = D; b = r; } }); if (b) picks.add(b.dz.wwr); });''',
    '''      const picks = new Set(B && B.best.per[a] ? [B.best.per[a].dz.wwr] : []), fx = (addF[dlScen(sc)] = addF[dlScen(sc)] || new Set());
      if (B && B.best.per[a]) fx.add(B.best.per[a].dz.fixed);
      PRI.forEach((w) => { const b = pickTie(fa.ok, (r) => SC.score(r.m, Object.assign({}, o, { w })).q); if (b) { picks.add(b.dz.wwr); fx.add(b.dz.fixed); } });''')
rep('''hi = Math.max(...coarse), add = new Set(); st.wwrBy = {};''', '''hi = Math.max(...coarse), add = new Set(), addF = {}; st.wwrBy = {};''')
rep('''    for (const sc of scs) for (const w of st.wwrFine) for (const f of S.PARAMS.fixed) { queue.push({ kind: "dl", id: [sc, w + "|" + f], job: { scenario: sc, wwr: w, fixed: f } }); st.dlTotal++; }''',
    '''    for (const sc of scs) for (const w of st.wwrFine) for (const f of addF[sc] || []) { queue.push({ kind: "dl", id: [sc, w + "|" + f], job: { scenario: sc, wwr: w, fixed: f, azs: azsOf(sc) } }); st.dlTotal++; }''')
# search tasks carry the ranking options
n = 0
for kind in ['"fac"', '"refine"', '"topup"']:
    i = e.s.find('queue.push({ kind: ' + kind)
    j = e.s.find('mode: st.mode, dlm: st.dlm, floor: st.floor,', i)
    assert i >= 0 and j >= 0 and j - i < 400, kind
    e.s = e.s[:j] + 'rk: rankOpts(sc), ' + e.s[j:]; n += 1
# ---------------------------------------------------------------- carbon as tie-break; lowest-carbon design in the packages
rep('''  function typeSets(sc) {''', '''  /* v16 phase 3.2: the best by a rank function; among designs within 0.01 of it, in the same tier (meets every target /
     meets the requirements / neither), the one with the least whole-life carbon (register rec.rule) */
  function pickTie(rows, qf) {
    let b = null, bq = -Infinity; const qs = rows.map((r) => { const q = qf(r); if (q > bq) { bq = q; b = r; } return q; });
    if (!b) return null; let c = b, ck = carbonOf(b).tot;
    rows.forEach((r, i) => { if (bq - qs[i] < 0.01 && Math.floor(qs[i]) === Math.floor(bq)) { const k = carbonOf(r).tot; if (k < ck - 1e-9) { c = r; ck = k; } } });
    return c;
  }
  function typeSets(sc) {''')
rep('''      if (!e.per[a] || r.q > e.per[a].q) e.per[a] = r; sets.set(k, e); }));''',
    '''      e.cand = e.cand || {}; (e.cand[a] = e.cand[a] || []).push(r); sets.set(k, e); }));
    sets.forEach((e) => A.forEach((a) => { if (e.cand && e.cand[a]) e.per[a] = pickTie(e.cand[a], (r) => r.q); }));''')
rep('''    const bestAt = PRI.map((w) => A.map((a) => { let b = null, bd = 0; facade(sc, a).ok.forEach((r) => { const D = SC.score(r.m, Object.assign({}, o, { w })).q; if (D > bd) { bd = D; b = r; } }); return b; }));''',
    '''    const bestAt = PRI.map((w) => A.map((a) => pickTie(facade(sc, a).ok, (r) => SC.score(r.m, Object.assign({}, o, { w })).q)));''')
rep('''    const K0 = carbonOf(rec), scn = SCN();''', '''    const K0 = carbonOf(rec), scn = SCN(), lowC = lowCarbonOf(sc, a);''')
rep('''<tbody>${row("Recommended", rec)}${P.map((r, i) => row("Package " + String.fromCharCode(65 + i), r)).join("")}</tbody></table></div>`;''',
    '''<tbody>${row("Recommended", rec)}${lowC && lowC !== rec ? row("Lowest carbon that meets every target", lowC) : ""}${P.filter((r) => r !== lowC).map((r, i) => row("Package " + String.fromCharCode(65 + i), r)).join("")}</tbody></table></div>${lowC === rec ? `<p class="small">The recommended design is also the design with the least whole-life carbon among those that meet every target.</p>` : lowC ? `<p class="small">Lowest carbon: ${fmt(Math.round(K0.tot - carbonOf(lowC).tot))} kg CO₂e/m² less over ${Y} years than the recommended design, for a score ${(rec.D - lowC.D).toFixed(2)} lower. It may differ in building-wide measures.</p>` : ""}`;''')
rep('''  function packagesHtml(sc, a, rec) {
    const P = packagesOf(sc, a, rec),''', '''  // the design with the least whole-life carbon among those that meet every target at this facade (any building-wide measures)
  function lowCarbonOf(sc, a) { const fa = facade(sc, a); if (!fa) return null; const m = fa.ok.filter((r) => r.t && r.t.all); return m.length ? m.reduce((b, r) => carbonOf(r).tot < carbonOf(b).tot ? r : b, m[0]) : null; }
  function packagesHtml(sc, a, rec) {
    const P = packagesOf(sc, a, rec),''')
rep('''if (!P.length) return `<h3 class="v4k">Other packages at this facade</h3>''', '''if (!P.length && !(lowCarbonOf(sc, a) && lowCarbonOf(sc, a) !== rec)) return `<h3 class="v4k">Other packages at this facade</h3>''')
rep('''<td class="small">${d ? meas.filter((p) => r.dz[p] !== rec.dz[p]).map((p) => lcF(choice4(p, r.dz[p]))).join("; ") : "the recommended design"}</td>''',
    '''<td class="small">${d ? PKM.filter((p) => p !== "roof" && r.dz[p] !== rec.dz[p]).map((p) => lcF(choice4(p, r.dz[p]))).join("; ") : "the recommended design"}</td>''')
rep('''    ["v16, phase 3.1", "17 Nov 2026",''', '''    ["v16, phase 3.2", "17 Nov 2026", "Faster runs: daylight only for the room types and orientations chosen, refinement daylight only for the fixed shading of the picks, and a targeted search around the designs the result is built from (the best under each priority setting, the designs that meet every target, the lowest-carbon one) instead of the whole trade-off front. Carbon: the lowest-carbon design that meets every target is shown with the packages and is searched for; among designs within 0.01 in score, the one with less whole-life carbon is recommended."],
    ["v16, phase 3.1", "17 Nov 2026",''')
e.save(); print('rk added', n)

r = Ed(B + 'register.js')
r.rep('''text: "Recommended design at each facade: among the designs that meet every target''', '''text: "Ties: among designs within 0.01 in score and in the same tier, the one with less whole-life carbon (decision of 17 November 2026). Recommended design at each facade: among the designs that meet every target''')
r.rep('''    "scen.climate": {''', '''    "search.targeted": { v: { perPriority: 2, meet: 5, lowCarbon: 1 }, unit: "designs explored around", status: "decision", src: D17 + " (run time)", text: "Search: after the random start and the rounds of variations, every single change is simulated around the two best designs under each of the 7 priority settings, the five best that meet every target and the one with the least whole-life carbon among them, until these stop changing. The trade-off chart then shows the part of the front near these designs, not all of it" },
    "scen.climate": {''')
r.save()
sh = Ed(B + 'shell.html')
sh.rep('''Corner picks: the option with the smallest largest weighted shortfall''', '''Search (v16 phase 3.2): targeted local search around the designs the result is built from; see search.targeted in the register. Ties within 0.01 in score go to less whole-life carbon. Corner picks: the option with the smallest largest weighted shortfall''')
sh.save()
