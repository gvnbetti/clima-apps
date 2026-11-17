import sys; sys.path.insert(0, '/home/claude/rdg/v16/edits'); from lib import Ed
B = '/home/claude/rdg/v16/'
# ---------------------------------------------------------------- build: data and shared module inline
b = Ed(B + 'build.py')
b.rep("""html = '\\n'.join([shell, wx, '<script>/* JSZip 3.10.1, MIT or GPLv3 */\\n' + jszip + '\\n</script>',""",
      """mods = '\\n'.join('<script>' + (S / f).read_text().replace('</script', '<\\\\/script') + '</script>' for f in ('data/future.js', 'data/regions.js', 'climamods.js'))
html = '\\n'.join([shell, wx, '<script>/* JSZip 3.10.1, MIT or GPLv3 */\\n' + jszip + '\\n</script>', mods,""")
b.save()
# ---------------------------------------------------------------- register
r = Ed(B + 'src/register.js')
r.rep('''    // ---------------------------------------------------------------- weather import''', '''    // ---------------------------------------------------------------- weather modifiers, shared with Macro Clima and Micro Clima
    "mods.future": { v: [0, 1.5, 2, 3], unit: "°C global warming since 1850-1900", status: "secondary", src: "IPCC AR6 WGI Atlas regional CMIP6 means (Iturbide et al. 2021, CC BY 4.0); morphing after Belcher et al. 2005; code shared with Macro Clima", text: "Future climate: the file is shifted to a global warming level by the monthly change of its IPCC region, measured from the file's own years; relative humidity held, long-wave sky radiation scaled with (T'/T)^4" },
    "mods.uhi": { v: { suburban: [0.8, 0.35], urban: [0.6, 0.2], dense: [0.4, 0.1] }, unit: "[sky view factor, vegetation fraction]", status: "secondary", src: "Theeuwes et al. 2017, calibrated on 14 cities in north-western Europe; presets and diurnal profile as in Micro Clima (placeholders); code shared with Macro Clima", text: "Urban heat island added to the air temperature, vapour pressure held; full at night, 15 % of it at the sun's daily peak" },
    "mods.fileYears": { v: 2010, unit: "mid-year", status: "assumption", src: "As Macro Clima", text: "Middle of the file's years when the file does not state them" },

    // ---------------------------------------------------------------- weather import''')
r.save()
# ---------------------------------------------------------------- page
e = Ed(B + 'src/page.html'); rep = e.rep
rep('''const S = window.Sweep, C = window.Comfort, G = window.Geo, DS = window.DaySweep, SC = window.Score, FS = window.FacadeSearch, Register = window.Register;''',
    '''const S = window.Sweep, C = window.Comfort, G = window.Geo, DS = window.DaySweep, SC = window.Score, FS = window.FacadeSearch, Register = window.Register, CM = window.ClimaMods;''')
# EPW: keep relative humidity and the comment lines, which give the file's years
rep('''    const cc = h[3] || "";
    return { name: h[1] || fname, cc, koppen: "", source: "Uploaded: " + fname, region: null, regionGiven: null, gaps,''',
    '''    const cc = h[3] || "", rhr = raw(8, 999), comments = L.slice(0, 8).filter((l) => /^COMMENTS/i.test(l));
    const rh = Float64Array.from(rhr.map((x, i) => isNaN(x) ? 100 * CM.pws(Math.min(td[i], t[i])) / CM.pws(t[i]) : x));
    return { name: h[1] || fname, cc, koppen: "", source: "Uploaded: " + fname, file: fname, comments, rh, region: null, regionGiven: null, gaps,''')
# engine weather through the shared modifiers
rep('''  const forEngine = (w) => ({ name: w.name, lat: w.lat, lon: w.lon, tz: w.tz, t: w.t, td: w.td, p: w.p, ir: w.ir, dni: w.dni, dhi: w.dhi,''',
    '''  /* v16: weather modifiers shared with Macro Clima and Micro Clima (climamods.js, copied from Macro Clima): future climate
     first, then the urban heat island on top. They change air temperature, dew point (future only) and long-wave sky
     radiation; sun and daylight are unchanged. */
  const modsOn = () => !!(st.mods.level || st.mods.uhi);
  const fileYearsOf = (w) => CM.fileYears(`${w.file || ""} ${w.name || ""} ${w.source || ""}`.replace(/TMYx (\\d{4})-(\\d{4})/, "TMYx.$1-$2"), w.comments);
  function modWeather(w) {
    const key = [st.wxIdx, st.mods.level, st.mods.uhi ? st.mods.uhi.svf : "-", st.mods.uhi ? st.mods.uhi.fveg : "-"].join("|");
    if (st.modCache && st.modCache.key === key && st.modCache.w === w) return st.modCache.out;
    let out = { t: w.t, td: w.td, ir: w.ir, fut: null, uhi: null };
    if (modsOn()) {
      const rh = w.rh || Float64Array.from(w.t, (x, i) => Math.max(1, Math.min(100, 100 * CM.pws(Math.min(w.td[i], x)) / CM.pws(x))));
      const W0 = { dbt: w.t, dpt: w.td, rh, hir: w.ir, prec: new Float64Array(8760), dni: w.dni, dhi: w.dhi, ws: w.ws, meta: { lat: w.lat, lon: w.lon, tz: w.tz } };
      const P = CM.prepWeather(W0, { level: st.mods.level, uhi: st.mods.uhi, year: fileYearsOf(w).year, future: window.CLIMA_FUTURE, regions: window.CLIMA_REGIONS });
      out = { t: P.W.dbt, td: P.W.dpt, ir: P.W.hir, fut: P.fut, uhi: P.uhi };
    }
    st.modCache = { key, w, out }; return out;
  }
  const modLabel = (m) => { m = m || st.mods; const p = []; if (m.level) p.push(CM.futLab(m.level)); if (m.uhi) { const k = Object.keys(CM.UHI_PRESETS).find((x) => CM.UHI_PRESETS[x].svf === m.uhi.svf && CM.UHI_PRESETS[x].fveg === m.uhi.fveg); p.push(`${k || "custom"} heat island (sky view factor ${m.uhi.svf.toFixed(2)}, vegetation ${m.uhi.fveg.toFixed(2)})`); } return p.join("; "); };
  const forEngine = (w) => { const m = modWeather(w); return { name: w.name, lat: w.lat, lon: w.lon, tz: w.tz, t: m.t, td: m.td, p: w.p, ir: m.ir, dni: w.dni, dhi: w.dhi,''')
rep(''' ws: w.ws, albedo: 0.2 });

  // ------------------------------------------------------------ state''', ''' ws: w.ws, albedo: 0.2 }; };

  // ------------------------------------------------------------ state''')
e.save()
