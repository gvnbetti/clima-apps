import sys; sys.path.insert(0, '/home/claude/rdg/v16/edits'); from lib import Ed
B = '/home/claude/rdg/v16/'
sh = Ed(B + 'src/shell.html')
sh.rep('''        <span class="small" id="reginfo"></span></div>''', '''        <span class="small" id="reginfo"></span></div>
      <div class="grp"><span class="lab">Future climate</span>
        <div class="seg" id="futSeg" role="group" aria-label="Future climate"><button type="button" data-v="0" aria-pressed="true">Present</button><button type="button" data-v="1.5" aria-pressed="false" title="around 2030">+1.5 °C</button><button type="button" data-v="2" aria-pressed="false" title="around 2050">+2 °C</button><button type="button" data-v="3" aria-pressed="false" title="around 2080 to 2100">+3 °C</button></div>
        <span class="small">Global warming since 1850-1900. Approximate years: +1.5 °C around 2030, +2 °C around 2050, +3 °C around 2080 to 2100 (earlier on high emissions).</span>
        <span class="small modnote" id="futnote"></span></div>
      <div class="grp"><span class="lab">Urban context</span>
        <div class="seg" id="uhiSeg" role="group" aria-label="Urban context"><button type="button" data-v="off" aria-pressed="true">As recorded</button><button type="button" data-v="suburban" aria-pressed="false">Suburban</button><button type="button" data-v="urban" aria-pressed="false">Urban</button><button type="button" data-v="dense" aria-pressed="false">Dense</button></div>
        <div id="uhibox" hidden>
          <label class="inl">Sky view factor, area average <input id="svf" type="range" min="0.2" max="1" step="0.05" style="width:100px"> <output id="svfo"></output></label>
          <label class="inl">Vegetation fraction <input id="fveg" type="range" min="0" max="0.8" step="0.05" style="width:100px"> <output id="fvego"></output></label>
        </div>
        <span class="small modnote" id="uhinote"></span>
        <span class="small">Weather files usually come from airports outside the city. An urban context raises the air temperature by an estimated heat island (Theeuwes et al. 2017). Same model, presets and code as Macro Clima and Micro Clima; the preset values are placeholders.</span></div>''')
sh.rep('''      <div id="results" hidden>''', '''      <div id="results" hidden>
      <div class="modband" id="modband" hidden></div>''')
sh.rep('details.ev.in { margin-top: 14px }', 'details.ev.in { margin-top: 14px }\n.modband { margin: 0 0 12px; padding: 7px 10px; border-left: 3px solid var(--warm); background: var(--warm-soft); font-size: 13px } .modnote span { display: block; margin-top: 3px } .warmtxt { color: var(--warm) }')
sh.save()

e = Ed(B + 'src/page.html'); rep = e.rep
rep('''fanW: Register.val("run.fan.power"), blindCtl: "auto", dinC: {},''', '''fanW: Register.val("run.fan.power"), blindCtl: "auto", mods: { level: 0, uhi: null }, uhiLast: { svf: 0.6, fveg: 0.2 }, dinC: {},''')
rep('''    stopWorkers(); $("empty").hidden = true; $("results").hidden = false; setStale(false);''', '''    stopWorkers(); $("empty").hidden = true; $("results").hidden = false; setStale(false);
    st.modsRun = { level: st.mods.level, uhi: st.mods.uhi ? Object.assign({}, st.mods.uhi) : null }; modBand();''')
rep('''  const srcLine = () => `Room Clima v16 · ${st.wx.name} · ${S.USE[st.use] ? st.use : ""} · ${new Date().toISOString().slice(0, 10)}`;''',
    '''  const srcLine = () => `Room Clima v16 · ${st.wx.name}${st.modsRun && modLabel(st.modsRun) ? " (" + modLabel(st.modsRun) + ")" : ""} · ${S.USE[st.use] ? st.use : ""} · ${new Date().toISOString().slice(0, 10)}`;''')
rep('''`Without cooling, with the conditions of DIN 4108-2 (gains ${fmt(Math.round(DIN_GAIN[st.use] * 10) / 10)} W/m²), region ${st.region}. On this weather file an indication: the proof uses the ${Register.val("din.weather")[st.region]}.`''',
    '''`Without cooling, with the conditions of DIN 4108-2 (gains ${fmt(Math.round(DIN_GAIN[st.use] * 10) / 10)} W/m²), region ${st.region}. On this weather file an indication: the proof uses the ${Register.val("din.weather")[st.region]}.${st.modsRun && modLabel(st.modsRun) ? " Run on the modified weather (" + modLabel(st.modsRun) + "): a look ahead, not a proof." : ""}`''')
rep('''    return { weather_file: st.wx.name, source: st.wx.source,''', '''    return { weather_file: st.wx.name, source: st.wx.source, weather_modifiers: st.modsRun ? modLabel(st.modsRun) || "none" : "none",''')
rep('''  function init() {
    fillRegister();''', '''  // ---- weather modifiers: controls and notes (wording as in Macro Clima)
  function modBand() {
    const m = st.modsRun, b = $("modband"); if (!b) return; const l = m ? modLabel(m) : "";
    b.hidden = !l; if (l) b.textContent = `Modified weather: ${l}. Every result on this page, the DIN 4108-2 check included, uses it.`;
  }
  function modsSync() {
    for (const b of document.querySelectorAll("#futSeg button")) b.setAttribute("aria-pressed", String(+b.dataset.v === st.mods.level));
    const pk = st.mods.uhi ? (Object.keys(CM.UHI_PRESETS).find((k) => CM.UHI_PRESETS[k].svf === st.mods.uhi.svf && CM.UHI_PRESETS[k].fveg === st.mods.uhi.fveg) || "") : "off";
    for (const b of document.querySelectorAll("#uhiSeg button")) b.setAttribute("aria-pressed", String(b.dataset.v === pk));
    const u = st.mods.uhi || st.uhiLast; $("uhibox").hidden = !st.mods.uhi; $("svf").value = u.svf; $("svfo").textContent = u.svf.toFixed(2); $("fveg").value = u.fveg; $("fvego").textContent = u.fveg.toFixed(2);
    const w = st.wx, reg = CM.futRegion({ meta: { lat: w.lat, lon: w.lon } }, window.CLIMA_REGIONS), yr = fileYearsOf(w), fn = [];
    if (reg) fn.push(`IPCC region: ${esc(CM.regName(reg))} (${reg.id}). Change measured from the file's years${yr.known ? ` (${yr.from}-${yr.to})` : ""}.`);
    if (!yr.known) fn.push(`<span class="warmtxt">The file does not state its years; they are taken to centre on 2010.</span>`);
    const m = modsOn() ? modWeather(w) : null;
    if (st.mods.level && m && m.fut) { const a = m.fut.dT.reduce((x, v) => x + v, 0) / 12; fn.push(`Applied: ${fmt(Math.round(a * 10) / 10)} K on average over the year, ${fmt(Math.round(Math.min(...m.fut.dT) * 10) / 10)} to ${fmt(Math.round(Math.max(...m.fut.dT) * 10) / 10)} K by month.`); }
    if (st.mods.level && m && !m.fut) fn.push(`<span class="warmtxt">No regional change is available for this location; the file is used as recorded.</span>`);
    $("futnote").innerHTML = fn.map((x) => `<span>${x}</span>`).join("");
    const un = [];
    if (st.mods.uhi && m && m.uhi) un.push(`Heat island factor ${m.uhi.factor.toFixed(2)} (2 − sky view factor − vegetation fraction). Estimated heat island: ${fmt(Math.round(m.uhi.nightMean * 10) / 10)} K on average with the sun down, up to ${fmt(Math.round(m.uhi.max * 10) / 10)} K.`);
    if (st.mods.uhi && !CM.isNWEurope(w.lat, w.lon)) un.push(`<span class="warmtxt">The model was calibrated on cities in north-western Europe. For this location the estimate is indicative.</span>`);
    if (st.mods.uhi && !CM.AIRPORT.test(`${w.name} ${w.file || ""} ${w.source || ""}`)) un.push(`<span class="warmtxt">This station's name does not mark it as an airport. If it stands in a built-up area, its data already hold part of the heat island, and this estimate adds it again.</span>`);
    $("uhinote").innerHTML = un.map((x) => `<span>${x}</span>`).join("");
  }
  function bindMods() {
    for (const b of document.querySelectorAll("#futSeg button")) b.onclick = () => { st.mods.level = +b.dataset.v; modsSync(); setStale(true); };
    for (const b of document.querySelectorAll("#uhiSeg button")) b.onclick = () => { const v = b.dataset.v; st.mods.uhi = v === "off" ? null : Object.assign({}, CM.UHI_PRESETS[v]); if (st.mods.uhi) st.uhiLast = Object.assign({}, st.mods.uhi); modsSync(); setStale(true); };
    const sl = () => { st.mods.uhi = { svf: +$("svf").value, fveg: +$("fveg").value }; st.uhiLast = Object.assign({}, st.mods.uhi); modsSync(); setStale(true); };
    $("svf").oninput = () => { $("svfo").textContent = (+$("svf").value).toFixed(2); }; $("fveg").oninput = () => { $("fvego").textContent = (+$("fveg").value).toFixed(2); };
    $("svf").onchange = sl; $("fveg").onchange = sl;
  }
  function init() {
    fillRegister(); bindMods();''')
# notes refresh when the weather changes
rep('''  function selectBuiltin(i) { st.wxIdx = i; st.wx = st.wxList[i]; st.region = st.wx.region; locDefaults(); fillControls(); $("region").value = st.region; wxInfo(); regionInfo(); setStale(true); }''',
    '''  function selectBuiltin(i) { st.wxIdx = i; st.wx = st.wxList[i]; st.region = st.wx.region; locDefaults(); fillControls(); $("region").value = st.region; wxInfo(); regionInfo(); modsSync(); setStale(true); }''')
rep('''locDefaults(); fillControls(); $("region").value = st.region; wxInfo(); regionInfo(); (err || $("fileerr")).textContent = "";''',
    '''locDefaults(); fillControls(); $("region").value = st.region; wxInfo(); regionInfo(); modsSync(); (err || $("fileerr")).textContent = "";''')
e.save()
