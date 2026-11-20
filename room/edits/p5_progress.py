import sys; sys.path.insert(0, '/home/claude/rdg/v16/edits'); from lib import Ed
B = '/home/claude/rdg/v16/src/'
c = Ed(B + 'core.js')
c.rep('''  function topUp(ctx, o) {
    const E = evaluator(ctx, Object.assign({}, o, { onProgress: null })), top = o.scenario === "corner_top";''',
      '''  function topUp(ctx, o) {
    const E = evaluator(ctx, o), top = o.scenario === "corner_top"; // v16 phase 3.4: progress reported (refinement)''')
c.save()

e = Ed(B + 'page.html'); rep = e.rep
# ---- worker: progress for the refinement search too
rep('''kind==='refine') r=FacadeSearch.topUp(ctx,t.o);''', '''kind==='refine') r=FacadeSearch.topUp(ctx,Object.assign({},t.o,{onProgress:(n)=>postMessage({type:'prog',id:t.id,n,k:'refine'})}));''')
rep('''        if (m.type === "prog") { const [sc, a] = m.id; st.prog[sc][a] = m.n; scheduleRender(false); return; }''',
    '''        if (m.type === "prog") { const [sc, a] = m.id; if (m.k === "refine") { if (st.refine) (st.refine.prog = st.refine.prog || {})[sc + a] = m.n - ((st.refine.base || {})[sc + a] || 0); } else st.prog[sc][a] = m.n; scheduleRender(false); return; }
        if (m.type === "done") tmDone(w, m.out);''')
rep('''    w.idle = false; w.postMessage({ type: "run", tasks: queue.splice(0, 1) });''', '''    const tk = queue.splice(0, 1); w.idle = false; w.tStart = performance.now(); w.tKind = tk[0].kind; w.postMessage({ type: "run", tasks: tk });''')
rep('''    st.scenR = {}; scenPending.clear(); st.scenLv = scenLevel();''', '''    st.scenR = {}; scenPending.clear(); st.scenLv = scenLevel(); st.tm = {}; st.nDin = 0; st.nScen = 0;''')
rep('''          else if (o.kind === "din") { st.dinC[o.id] = o.r;''', '''          else if (o.kind === "din") { st.nDin++; st.dinC[o.id] = o.r;''')
rep('''          else if (o.kind === "scen") { st.scenR[o.id] = o.r;''', '''          else if (o.kind === "scen") { st.nScen++; st.scenR[o.id] = o.r;''')
rep('''    st.wwrFine = [...add].sort((x, y) => x - y); st.refine = { phase: "dl", pending: 0, t0: performance.now() };''',
    '''    st.wwrFine = [...add].sort((x, y) => x - y); st.refine = { phase: "dl", pending: 0, t0: performance.now(), dl0: st.dlDone, base: {}, prog: {} };''')
rep('''    for (const sc of st.types) for (const a of facList(sc)) { const F = st.fac[sc][a]; if (!F) continue; st.refine.pending++;
      queue.push({ kind: "refine",''', '''    for (const sc of st.types) for (const a of facList(sc)) { const F = st.fac[sc][a]; if (!F) continue; st.refine.pending++; st.refine.base[sc + a] = F.rows.length; st.refine.n = (st.refine.n || 0) + 1;
      queue.push({ kind: "refine",''')
rep('''    if (--st.refine.pending <= 0) { st.refine.phase = "done";''', '''    (st.refine.fin = st.refine.fin || {})[sc + a] = r.rows.length;
    if (--st.refine.pending <= 0) { st.refine.phase = "done";''')

# ---- timing per kind of task, estimate, the progress panel
rep('''  // ------------------------------------------------------------ render
  function setStatus(t) { $("status").textContent = t; }''', '''  /* ============================================================ v16 phase 3.4 (Giovanni, 18 November 2026): progress.
     Each task is timed in the page (start when sent to a worker, end when its result comes back), per kind; the time
     left is the work left, priced at the measured time per unit, divided by the workers. Units: a daylight variant,
     a simulated design (two years), a DIN 4108-2 check, a scenario run. */
  const TDEF = { dl: 4, fac: 0.09, refine: 0.09, topup: 0.09, din: 0.3, scen: 0.2 };
  function tmDone(w, out) {
    if (!w.tStart || !out || !out.length) return; const k = w.tKind, dt = (performance.now() - w.tStart) / 1000; w.tStart = 0;
    const u = k === "fac" || k === "refine" || k === "topup" ? Math.max(1, (out[0].r && out[0].r.rows ? out[0].r.rows.length : 1) - (k === "refine" && st.refine ? (st.refine.base[out[0].id[0] + out[0].id[1]] || 0) : 0)) : out.length;
    const T = st.tm[k] || (st.tm[k] = { n: 0, t: 0 }); T.n += u; T.t += dt;
  }
  const tPer = (k) => { const T = st.tm && st.tm[k]; return T && T.n >= 3 ? T.t / T.n : (k === "dl" ? TDEF.dl * Math.max(1, (st.ori || []).length) / 4 : TDEF[k] || 0.1); };
  const nWork = () => Math.max(1, workers.length || 1);
  const mmss = (s) => { s = Math.max(0, Math.round(s)); return s >= 90 ? `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s` : `${s} s`; };
  // the run as stages with counts; est = designs per facade expected (finished facades' mean, else the planning figure)
  function runState() {
    const facs = [].concat(...st.types.map((sc) => facList(sc).map((a) => [sc, a]))), done = facs.filter(([sc, a]) => st.fac[sc][a] && st.fac[sc][a].done);
    const fin = done.map(([sc, a]) => st.prog[sc][a] || 0), est = fin.length ? fin.reduce((s, x) => s + x, 0) / fin.length : PEREST;
    let des = 0, desTot = 0; facs.forEach(([sc, a]) => { const n = st.prog[sc][a] || 0, isD = st.fac[sc][a] && st.fac[sc][a].done; des += n; desTot += isD ? n : Math.max(n * 1.05, est); });
    const R = st.refine, dl1 = R ? R.dl0 : st.dlTotal, dlDone1 = Math.min(st.dlDone, dl1);
    const s1 = { dl: [dlDone1, dl1], des: [des, Math.round(desTot)], fac: [done.length, facs.length], facs };
    const s2 = st.refineWin ? (R ? { dl: [st.dlDone - R.dl0, st.dlTotal - R.dl0], des: [Object.values(R.prog || {}).reduce((s, x) => s + Math.max(0, x), 0), null], fac: [Object.keys(R.fin || {}).length, R.n || facs.length], phase: R.phase } : { wait: true }) : null;
    const chk = { din: [st.nDin || 0, (st.nDin || 0) + dinPending.size], scen: [st.nScen || 0, (st.nScen || 0) + scenPending.size] };
    // time left (CPU seconds over the workers)
    let left = (s1.dl[1] - s1.dl[0]) * tPer("dl") + Math.max(0, s1.des[1] - s1.des[0]) * tPer("fac");
    if (s2 && !s2.wait) left += Math.max(0, s2.dl[1] - s2.dl[0]) * tPer("dl") + (s2.phase !== "done" ? Math.max(0, (s2.fac[1] - s2.fac[0]) * est * 0.15 - s2.des[0]) * tPer("refine") : 0);
    if (s2 && s2.wait) left += s1.facs.length * est * 0.15 * tPer("refine");
    left += dinPending.size * tPer("din") + scenPending.size * tPer("scen");
    const el = (performance.now() - t0) / 1000, busy = st.running || (R && R.phase !== "done") || dinPending.size || scenPending.size || st.topping;
    return { s1, s2, chk, left: left / nWork(), el, busy, frac: el > 0 ? el / (el + left / nWork()) : 0 };
  }
  const pbar = (a, b, cls) => `<span class="pb${cls ? " " + cls : ""}"><i style="width:${(100 * Math.min(1, b ? a / b : 0)).toFixed(1)}%"></i></span>`;
  function runPanelHtml() {
    const S0 = runState(), s1 = S0.s1, s2 = S0.s2, nAz = (st.ori || []).length, E = (n) => n.toLocaleString("en-GB");
    if (!S0.busy) return st.elapsed ? `<p class="small">Run finished in ${mmss(st.elapsed)}: ${E(s1.dl[1])} daylight variants, ${E(st.evals)} designs simulated (${E(2 * st.evals)} years), ${E(st.nDin || 0)} DIN 4108-2 checks, ${E(st.nScen || 0)} scenario runs, on ${nWork()} worker${nWork() > 1 ? "s" : ""}.${s2 && !s2.wait ? ` Finer window sizes: ${E(s2.dl[1])} daylight variants, ${E(st.refine.added || 0)} designs.` : ""}</p>` : "";
    const pct = Math.round(100 * S0.frac);
    let h = `<div class="v4h"><h2>Running: ${pct}%</h2><span class="small">${mmss(S0.el)} so far, about ${mmss(S0.left)} left on ${nWork()} worker${nWork() > 1 ? "s" : ""}. Results fill in below as facades finish.</span></div>${pbar(S0.frac, 1, "big")}`;
    h += `<div class="pst"><h3>1. Search${s2 ? ", whole steps" : ""}</h3>
      <div class="prow"><span>Daylight</span>${pbar(s1.dl[0], s1.dl[1])}<span class="small">${E(s1.dl[0])} of ${E(s1.dl[1])} room variants (window size × fixed shading, ${nAz} orientation${nAz > 1 ? "s" : ""} each)</span></div>
      <div class="prow"><span>Designs</span>${pbar(s1.des[0], s1.des[1])}<span class="small">${E(s1.des[0])} of about ${E(s1.des[1])} simulated (heating and cooling year each); ${s1.fac[0]} of ${s1.fac[1]} facades finished</span></div>
      <div class="pfac">${s1.facs.map(([sc, a]) => { const F = st.fac[sc][a], n = st.prog[sc][a] || 0, dn = F && F.done; return `<span class="pf${dn ? " dn" : ""}" title="${SCLAB[sc]} ${orientLabel(sc, a)}"><b>${orientLabel(sc, a)}</b> <small>${sc === "cellular" ? "cell" : sc === "corner" ? "corner" : "top"}</small>${pbar(n, dn ? n : Math.max(n * 1.05, s1.des[1] / Math.max(1, s1.facs.length)))}<small>${dn ? "done, " : ""}${E(n)}</small></span>`; }).join("")}</div>
      <div class="prow"><span>Checks</span>${pbar(S0.chk.din[0] + S0.chk.scen[0], S0.chk.din[1] + S0.chk.scen[1])}<span class="small">${dinRule() ? `DIN 4108-2 with the standard's conditions: ${E(S0.chk.din[0])} of ${E(S0.chk.din[1])}; ` : ""}scenarios (+2 °C, poor operation): ${E(S0.chk.scen[0])} of ${E(S0.chk.scen[1])}. Queued once the search is done.</span></div>
      <p class="small">Carbon needs no runs: it is calculated with each design.</p></div>`;
    if (s2) h += `<div class="pst"><h3>2. Finer window sizes, 5% steps</h3>${s2.wait ? `<p class="small">Starts when every facade is searched; about ${mmss(s1.facs.length * (s1.des[1] / Math.max(1, s1.facs.length)) * 0.15 * tPer("refine") / nWork())} more.</p>` : `
      <div class="prow"><span>Daylight</span>${pbar(s2.dl[0], s2.dl[1])}<span class="small">${E(s2.dl[0])} of ${E(s2.dl[1])} room variants for the new window sizes (${st.wwrFine.map((x) => Math.round(x * 100) + "%").join(", ")})</span></div>
      <div class="prow"><span>Designs</span>${pbar(s2.fac[0], s2.fac[1])}<span class="small">${s2.phase === "dl" ? "waits for daylight" : `${E(s2.des[0])} designs added; ${s2.fac[0]} of ${s2.fac[1]} facades finished`}</span></div>`}</div>`;
    return h;
  }
  // ------------------------------------------------------------ render
  function setStatus(t) { $("status").textContent = t; }''')
rep('''    else if (st.running) setStatus(st.dlDone < st.dlTotal ? `Daylight: ${st.dlDone} of ${st.dlTotal} room variants` : facCount() < nF ? `Facades: ${facCount()} of ${nF} searched, ${evals.toLocaleString("en-GB")} options, ${Math.round(el)} s` : `Combining the facades into the building, ${Math.round(el)} s`);''',
    '''    else if (st.running) { const R0 = runState(); setStatus(`${Math.round(100 * R0.frac)}%: ${st.dlDone < st.dlTotal ? `daylight ${st.dlDone} of ${st.dlTotal}` : `${evals.toLocaleString("en-GB")} designs, ${facCount()} of ${nF} facades finished`}; ${mmss(R0.el)} so far, about ${mmss(R0.left)} left`); }''')
rep('''    $("bar").style.width = (100 * Math.min(1, (st.dlDone * 6 + prog) / Math.max(1, units))).toFixed(1) + "%";''', '''    $("bar").style.width = (st.fac && st.tm ? 100 * runState().frac : 100 * Math.min(1, (st.dlDone * 6 + prog) / Math.max(1, units))).toFixed(1) + "%";''')
rep('''    if (!st.fac) return;
    if (!facList(st.scen).includes(st.fa))''', '''    if (!st.fac) return;
    if (st.tm) { const rp = runPanelHtml(); $("runp").innerHTML = rp; $("runp").hidden = !rp; }
    if (!facList(st.scen).includes(st.fa))''')
rep('''    ["v16, phase 3.3", "18 Nov 2026",''', '''    ["v16, phase 3.4", "19 Nov 2026", "Progress: a panel at the top of the results while a run is on, with the share done, time so far and time left (from the measured time per daylight variant, per design and per check, over the workers), counts per stage (daylight variants, designs simulated, DIN checks and scenario runs) and a small bar per facade; the finer window sizes in 5% steps have their own block. The status line under Run gives the same in short."],
    ["v16, phase 3.3", "18 Nov 2026",''')
e.save()
sh = Ed(B + 'shell.html')
sh.rep('''      <section class="v4s v4card" id="v5verd"></section>''', '''      <section class="v4card runp" id="runp" hidden aria-live="polite"></section>
      <section class="v4s v4card" id="v5verd"></section>''')
sh.rep('''/* v16 phase 3.3: design buttons above the switches */''', '''/* v16 phase 3.4: progress panel */
.runp .pb { display: inline-block; height: 8px; background: var(--soft); border-radius: 4px; overflow: hidden; vertical-align: middle; width: 160px; flex: 0 0 160px } .runp .pb i { display: block; height: 100%; background: var(--accent, var(--ink)); transition: width .4s } .runp .pb.big { display: block; width: 100%; height: 12px; margin: 6px 0 10px } .runp .pst { border-top: 1px solid var(--soft); padding: 8px 0 } .runp h3 { font-size: 13px; margin: 0 0 6px } .runp .prow { display: flex; align-items: center; gap: 10px; margin: 4px 0; font-size: 13px } .runp .prow > span:first-child { flex: 0 0 64px; font-weight: 600 } .runp .pfac { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 6px 0 6px 74px } .runp .pf { display: flex; align-items: center; gap: 6px; font-size: 12px } .runp .pf .pb { width: 70px; flex: 0 0 70px; height: 6px } .runp .pf.dn .pb i { background: var(--ok) }
/* v16 phase 3.3: design buttons above the switches */''')
sh.save()
