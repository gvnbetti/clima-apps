/* Chart kit: SVG strings, colour scales, hover registry, exports. Every chart is plain SVG so it can be saved as it is. */
(function (root) {
  "use strict";
  const C = root.Clima;
  const K = {};
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  K.esc = esc;
  const fmt = (v, d) => (v == null || !isFinite(v) ? "–" : (Math.abs(v) < 1e-9 ? 0 : v).toLocaleString("en-GB", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }));
  K.fmt = fmt;

  /* ---------- units: calculations stay in SI; this layer converts what is shown ---------- */
  // [label, factor, offset, extra decimals]; temperature differences (K) and degree days scale without offset
  const KBTU = 0.316998, FT2 = 0.09290304;
  const IP = {
    "°C": ["°F", 1.8, 32, 0], "K": ["°F", 1.8, 0, 0], "Kd": ["°F·d", 1.8, 0, 0],
    "W/m²": ["Btu/h·ft²", KBTU, 0, 0], "kWh/m²": ["kBtu/ft²", KBTU, 0, 0], "kWh/m² a year": ["kBtu/ft² a year", KBTU, 0, 0], "kWh/m² per day": ["kBtu/ft² per day", KBTU, 0, 1], "kWh/m² per month": ["kBtu/ft² per month", KBTU, 0, 0],
    "kWh/m² of panel": ["kWh/ft² of panel", FT2, 0, 1], "kWh/m² of roof": ["kWh/ft² of roof", FT2, 0, 1], "kWh per m²": ["kWh per ft²", FT2, 0, 1],
    "mm": ["in", 1 / 25.4, 0, 1], "l/m² a year": ["in a year", 1 / 25.4, 0, 1], "l/m²": ["in", 1 / 25.4, 0, 1], "cm": ["in", 1 / 2.54, 0, 1], "m": ["ft", 3.28084, 0, 0], "km": ["mi", 0.621371, 0, 0],
    "g/kg": ["gr/lb", 7, 0, 0], "hPa": ["inHg", 0.02953, 0, 2], "klx": ["kfc", 1 / 10.7639, 0, 1], "m/s": ["mph", 2.23694, 0, 0] };
  const KMH = ["km/h", 3.6, 0, 0];
  const U = K.U = { sys: "si", wind: "ms" };
  U.c = (unit) => { if (!unit) return null; if (unit === "m/s" && U.sys !== "ip") return U.wind === "kmh" ? KMH : null; return U.sys === "ip" ? IP[unit] || null : null; };
  U.v = (v, unit) => { const c = U.c(unit); return c ? c[1] * v + c[2] : v; };
  U.inv = (v, unit) => { const c = U.c(unit); return c ? (v - c[2]) / c[1] : v; };
  U.lab = (unit) => { const c = U.c(unit); return c ? c[0] : unit; };
  // ticks in shown units, returned with their position in SI
  U.ticks = (lo, hi, n, unit) => { const c = U.c(unit); if (!c) return niceTicks(lo, hi, n).map((t) => [t, t]); const a = c[1] * lo + c[2], b = c[1] * hi + c[2]; return niceTicks(Math.min(a, b), Math.max(a, b), n).map((t) => [(t - c[2]) / c[1], t]); };
  // convert numbers with SI units inside an HTML or text string, then lone unit names
  const KEYS = Object.keys(IP).sort((a, b) => b.length - a.length), reEsc = (x) => x.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  const NUM = "-?\\d[\\d,]*(?:\\.\\d+)?";
  const RX = new RegExp(`(?<![\\w.,#/])(\\+?${NUM})(?:(\\s*(?:–|to|and)\\s*)(${NUM}))?([\\s\\u00a0]?)(${KEYS.map(reEsc).join("|")})(?![A-Za-zÀ-ÿ²³])`, "g");
  const LONE = ["°C", "kWh/m² of panel", "kWh/m² of roof", "kWh per m²", "kWh/m² a year", "kWh/m² per day", "kWh/m² per month", "kWh/m²", "W/m²", "m/s", "g/kg", "hPa", "klx", "Kd", "mm", "l/m² a year", "l/m²"];
  const RX1 = new RegExp(`(?<![\\w/])(${LONE.map(reEsc).join("|")})(?![A-Za-zÀ-ÿ²³])`, "g");
  const conv1 = (str, unit, dd) => { const c = U.c(unit), d = (dd != null ? dd : (str.split(".")[1] || "").length) + c[3], v = parseFloat(str.replace(/,/g, "")); return fmt(c[1] * v + c[2], d); };
  U.text = (html) => {
    if (U.sys !== "ip" && U.wind !== "kmh") return html;
    html = html.replace(RX, (m, a, sep, b, sp, unit) => { if (!U.c(unit)) return m;
      if (a[0] === "+") { const u2 = unit === "°C" ? "K" : unit; a = a.slice(1); const d1 = Math.max(1, (a.split(".")[1] || "").length); return "+" + conv1(a, u2, d1) + (b != null ? sep + conv1(b, u2, d1) : "") + (sp || " ") + U.lab(unit); } // a signed temperature is a difference
      const dd = b != null ? Math.max((a.split(".")[1] || "").length, (b.split(".")[1] || "").length) : null; return conv1(a, unit, dd) + (b != null ? sep + conv1(b, unit, dd) : "") + (sp || " ") + U.lab(unit); });
    return html.replace(RX1, (m, unit) => (U.c(unit) ? U.lab(unit) : m));
  };

  /* ---------- colour ---------- */
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const toHex = (c) => "#" + c.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, "0")).join("");
  function ramp(stops) { const S = stops.map(hex); return (t) => { if (!isFinite(t)) return null; t = Math.max(0, Math.min(1, t)); const x = t * (S.length - 1), i = Math.min(S.length - 2, Math.floor(x)), f = x - i; return toHex(S[i].map((a, k) => a + (S[i + 1][k] - a) * f)); }; }
  // colour schemes per variable, taken from CBE Clima (pages/lib/global_variables.py)
  K.PAL = {
    temp: ["#00b3ff", "#000082", "#ff0000", "#ffff00"],
    humid: ["#ffe600", "#00c8ff", "#0000ff"],
    sun: ["#293a59", "#960c2c", "#ff0000", "#ff7b00", "#fffc00", "#ffff7b", "#ffffff"],
    light: ["#4d6daa", "#a0beed", "#f1e969", "#eb7d05", "#d81600"],
    sky: ["#08306b", "#7ec9f3", "#e6eae9"],
    wind: ["#fcf4d9", "#d3e3a1", "#89c36a", "#5aa171", "#418a80", "#2f798b", "#1b608f", "#073966", "#031327"], // Crameri "navia", reversed: calm pale cream to strong dark navy (perceptually uniform, colour-vision-deficiency friendly)
    dir: ["#f884f7", "#f968c4", "#ea4388", "#cf244b", "#b51a15", "#bd4304", "#cc6904", "#d58f04", "#cfaa27", "#a19f62", "#588a93", "#2269c4", "#3e3ef0", "#6b4ef9", "#956bfa", "#cd7dfe", "#f884f7"],
    press: ["#ffffff", "#b2f2ff", "#33ddff", "#00aaff", "#0055ff", "#0000ff", "#aa00ff", "#ff00ff", "#cc0000", "#ffaa00"],
    rain: ["#ffffff", "#00c8ff", "#0000ff", "#000082"],
    delta: ["#000082", "#00b3ff", "#f2f2f2", "#ff7b00", "#ff0000"],
    green: ["#f1f5f1", "#b9d6c6", "#5e9c82", "#23614f", "#0f2e25"]
  };
  K.ramps = {}; for (const [k, v] of Object.entries(K.PAL)) K.ramps[k] = ramp(v);
  K.UTCI_COLORS = ["#2B2977", "#38429B", "#4253A4", "#4B62AD", "#68B8E7", "#53B848", "#EE8522", "#EA2C24", "#B12224", "#751613"];
  K.SERIES = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)", "var(--s5)", "var(--s6)"];
  K.SERIES_HEX = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#6250d6"];
  // a scale object: value -> colour, with domain and ticks
  K.scale = function (o) {
    const s = Object.assign({ ramp: "green", lo: 0, hi: 1, mid: null }, o);
    const R = K.ramps[s.ramp];
    s.color = (v) => (isFinite(v) ? R((v - s.lo) / (s.hi - s.lo)) : null);
    s.ticks = s.ticks || niceTicks(s.lo, s.hi, 5);
    return s;
  };
  function niceTicks(lo, hi, n) {
    if (!(hi > lo)) return [lo];
    const raw = (hi - lo) / Math.max(1, n), p = 10 ** Math.floor(Math.log10(raw)), m = raw / p, st = (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
    const out = []; for (let v = Math.ceil(lo / st - 1e-9) * st; v <= hi + 1e-9; v += st) out.push(+v.toFixed(10)); return out;
  }
  K.niceTicks = niceTicks;

  /* ---------- hover registry ---------- */
  K.hov = {}; let hovId = 0;
  K.hover = (fn) => { const id = "h" + (++hovId); K.hov[id] = fn; return id; };
  K.resetHover = () => { K.hov = {}; };

  /* ---------- axes helpers ---------- */
  const MON_TICKS = C.MSTART.map((d, i) => [d, C.MONTHS[i]]);
  function axisMonthsX(x0, w, y, days, short) { days = days || 365; let s = `<g class="ax"><line x1="${x0}" x2="${x0 + w}" y1="${y}" y2="${y}"/>`; for (const [d, m] of MON_TICKS) { const x = x0 + w * d / days; s += `<line x1="${x}" x2="${x}" y1="${y}" y2="${y + 4}"/><text x="${x + w / days * 15}" y="${y + 15}" text-anchor="middle">${short ? m[0] : m}</text>`; } return s + "</g>"; }
  K.axisOv = {}; K.curCard = "";
  const axKey = (unit) => K.curCard + "|" + (unit || ""); // one override per card and unit: two charts in a card keep their own axes
  const axOv = (unit) => K.axisOv[axKey(unit)];
  function axisY(x0, y0, h, lo, hi, ticks, unit, w) { if (U.c(unit)) { const tt = U.ticks(lo, hi, Math.max(3, ticks.length), unit); return axisYc(x0, y0, h, lo, hi, tt, unit, w); } return axisYc(x0, y0, h, lo, hi, ticks.map((t) => [t, t]), unit, w); }
  function axisYc(x0, y0, h, lo, hi, ticks, unit, w) { let s = `<g class="ax" data-axis="${axKey(unit)}" data-u="${encodeURIComponent(unit || "")}" data-lo="${lo}" data-hi="${hi}" style="cursor:pointer"><title>Click to set the axis range</title><rect x="${Math.max(0, x0 - 44)}" y="${y0 - 16}" width="44" height="${h + 20}" fill="transparent"/>`; for (const [t, lab] of ticks) { const y = y0 + h - h * (t - lo) / (hi - lo); if (y < y0 - 0.5 || y > y0 + h + 0.5) continue; s += `<line class="gl" x1="${x0}" x2="${x0 + w}" y1="${y}" y2="${y}" style="stroke:var(--soft)"/><text x="${x0 - 6}" y="${y + 3.5}" text-anchor="end">${fmt(lab, Math.abs(lab) < 10 && lab % 1 ? 1 : 0)}</text>`; } if (unit) s += `<text x="${Math.max(2, x0 - 40)}" y="${y0 - 6}">${esc(U.lab(unit))}</text>`; return s + "</g>"; }
  K.axisY = axisY; K.axisMonthsX = axisMonthsX;
  function colorbar(x, y, h, sc, unit) {
    const id = "cb" + Math.random().toString(36).slice(2, 8); let st = "";
    for (let k = 20; k >= 0; k--) { const v = sc.lo + (sc.hi - sc.lo) * k / 20; st += `<stop offset="${100 - k * 5}%" stop-color="${sc.color(v)}"/>`; }
    let s = `<g data-scale="${esc(sc.key || "")}" data-u="${encodeURIComponent(unit || "")}" data-lo="${sc.lo}" data-hi="${sc.hi}" style="cursor:pointer"><title>Click to set the colour range</title><defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1">${st}</linearGradient></defs><rect x="${x - 4}" y="${y - 16}" width="60" height="${h + 26}" fill="transparent"/><rect x="${x}" y="${y}" width="10" height="${h}" fill="url(#${id})" rx="2"/>`;
    const tks = U.c(unit) ? U.ticks(sc.lo, sc.hi, Math.max(3, sc.ticks.length), unit) : sc.ticks.map((t) => [t, t]);
    for (const [t, lab] of tks) { const yy = y + h - h * (t - sc.lo) / (sc.hi - sc.lo); if (yy < y - 0.5 || yy > y + h + 0.5) continue; s += `<text x="${x + 14}" y="${yy + 3.5}">${fmt(lab, Math.abs(lab) < 10 && lab % 1 ? 1 : 0)}</text>`; }
    if (unit) s += `<text x="${x}" y="${y - 6}">${esc(U.lab(unit))}</text>`;
    return s + `</g>`;
  }
  K.colorbar = colorbar;

  /* ---------- carpet: day of year across, hour of day down ---------- */
  // vals: Float32Array(8760); colorOf(v, i) -> css hex or null; mask: Uint8Array (1 = shown)
  K.carpet = function (o) {
    const W = o.W || K.curW || 760, H = o.small ? 150 : 250, x0 = o.small ? 30 : 40, y0 = o.small ? 18 : 14, w = W - (o.small ? 40 : o.legend && W >= 700 ? 60 : 140), h = o.small ? 110 : 200;
    const cv = document.createElement("canvas"); cv.width = 365; cv.height = 24; const g = cv.getContext("2d"), img = g.createImageData(365, 24);
    const grey = hex(o.greyHex || "#d3d7d2");
    for (let d = 0; d < 365; d++) for (let hr = 0; hr < 24; hr++) {
      const i = d * 24 + hr, p = (hr * 365 + d) * 4; let c = null;
      if (o.mask && !o.mask[i]) c = grey; else { const col = o.colorOf(o.vals ? o.vals[i] : null, i); c = col ? hex(col) : grey; }
      img.data[p] = c[0]; img.data[p + 1] = c[1]; img.data[p + 2] = c[2]; img.data[p + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const url = cv.toDataURL("image/png");
    const hid = K.hover((lx, ly) => { const d = Math.floor((lx - x0) / w * 365), hr = Math.floor((ly - y0) / h * 24); if (d < 0 || d > 364 || hr < 0 || hr > 23) return null; const i = d * 24 + hr; return o.tip(i, d, hr); });
    let s = `<svg viewBox="0 0 ${W} ${H}" data-hov="${hid}" role="img" aria-label="${esc(o.label || "")}">` + (o.small && o.label ? `<text x="${x0}" y="11" class="ink" font-weight="600" font-size="12">${esc(o.label)}</text>` : "");
    s += `<image href="${url}" x="${x0}" y="${y0}" width="${w}" height="${h}" preserveAspectRatio="none" style="image-rendering:pixelated"/>`;
    s += `<g class="ax">`; for (const hr of o.small ? [0, 12, 24] : [0, 6, 12, 18, 24]) { const y = y0 + h * hr / 24; s += `<line x1="${x0 - 4}" x2="${x0}" y1="${y}" y2="${y}"/><text x="${x0 - 6}" y="${y + 3.5}" text-anchor="end">${String(hr).padStart(2, "0")}h</text>`; } s += `</g>`;
    s += axisMonthsX(x0, w, y0 + h + 2, 365, o.small);
    if (o.scale && !o.small) s += colorbar(x0 + w + 22, y0 + 10, h - 20, o.scale, o.unit);
    if (o.legend && W < 700) { let yy = y0 + 6; for (const [col, name] of o.legend) { s += `<rect x="${x0 + w + 18}" y="${yy}" width="10" height="10" rx="2" fill="${col}"/><text x="${x0 + w + 32}" y="${yy + 9}">${esc(name)}</text>`; yy += 16; } }
    s += `</svg>`;
    if (o.legend && W >= 700) s += `<div class="legend">${o.legend.map(([c, t]) => `<span><i style="background:${c}"></i>${esc(t)}</span>`).join("")}</div>`;
    return s;
  };

  /* ---------- lines over the year (daily) or any x ---------- */
  K.lines = function (o) {
    const W = o.W || K.curW || 760, H = o.height || 260, x0 = 44, y0 = 16, w = (o.right ? W - x0 - o.right : W - x0 - 16), h = H - y0 - 30;
    const n = o.n || 365; let lo = o.lo, hi = o.hi; if (axOv(o.unit) && !o.noOv) { lo = axOv(o.unit).lo; hi = axOv(o.unit).hi; }
    if (lo == null || hi == null) { lo = Infinity; hi = -Infinity; for (const s of o.series) for (const v of s.vals) if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } if (o.band) for (const a of [o.band.lo, o.band.hi]) for (const v of a) if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } const pad = (hi - lo) * 0.06 || 1; lo -= pad; hi += pad; }
    const X = (i) => x0 + w * (i + 0.5) / n, Y = (v) => y0 + h - h * (v - lo) / (hi - lo);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || "")}">`;
    s += axisY(x0, y0, h, lo, hi, niceTicks(lo, hi, h < 120 ? 3 : 6), o.unit, w);
    if (o.months !== false) s += axisMonthsX(x0, w, y0 + h, n);
    else if (o.xTicks) { s += `<g class="ax"><line x1="${x0}" x2="${x0 + w}" y1="${y0 + h}" y2="${y0 + h}"/>`; for (const [i, t] of o.xTicks) s += `<text x="${X(i)}" y="${y0 + h + 15}" text-anchor="middle">${esc(t)}</text>`; s += `</g>`; }
    if (o.band) { let p = ""; for (let i = 0; i < n; i++) p += (i ? "L" : "M") + X(i).toFixed(1) + "," + Y(o.band.hi[i]).toFixed(1); for (let i = n - 1; i >= 0; i--) p += "L" + X(i).toFixed(1) + "," + Y(o.band.lo[i]).toFixed(1); s += `<path d="${p}Z" fill="${o.band.fill || "var(--accent-soft)"}" opacity="${o.band.opacity || 0.9}"/>`; }
    const marksLater = o.marks || [];
    if (o.spans) for (const [a, len, col] of o.spans) { const x1 = x0 + w * a / n, x2 = x0 + w * Math.min(n, a + len) / n; s += `<rect x="${x1}" y="${y0}" width="${x2 - x1}" height="${h}" fill="${col}" opacity="0.16"/>`; if (a + len > n) s += `<rect x="${x0}" y="${y0}" width="${w * (a + len - n) / n}" height="${h}" fill="${col}" opacity="0.16"/>`; }
    if (o.shade) for (const [a, b] of o.shade) s += `<rect x="${X(a) - w / n / 2}" y="${y0}" width="${(b - a + 1) * w / n}" height="${h}" fill="var(--soft)" opacity="0.7"/>`;
    const cid = "cl" + (K._clip = (K._clip || 0) + 1); s += `<clipPath id="${cid}"><rect x="${x0}" y="${y0 - 1}" width="${w}" height="${h + 2}"/></clipPath><g clip-path="url(#${cid})">`; // data stays inside the plot when a range is set by hand
    for (const a of [].concat(o.area || [], o.areas || [])) { let i = 0; while (i < n) { while (i < n && !(isFinite(a.lo[i]) && isFinite(a.hi[i]))) i++; const st0 = i; while (i < n && isFinite(a.lo[i]) && isFinite(a.hi[i])) i++; if (i - st0 < 2) continue; let p = ""; for (let k = st0; k < i; k++) p += (k > st0 ? "L" : "M") + X(k).toFixed(1) + "," + Y(a.hi[k]).toFixed(1); for (let k = i - 1; k >= st0; k--) p += "L" + X(k).toFixed(1) + "," + Y(a.lo[k]).toFixed(1); s += `<path d="${p}Z" fill="${a.fill}" opacity="${a.opacity || 0.35}"${a.stroke ? ` stroke="${a.stroke}" stroke-dasharray="${a.dash || ""}"` : ""}/>`; } }
    for (const se of o.series) { let p = "", pen = false; for (let i = 0; i < n; i++) { const v = se.vals[i]; if (!isFinite(v)) { pen = false; continue; } p += (pen ? "L" : "M") + X(i).toFixed(1) + "," + Y(v).toFixed(1); pen = true; } s += `<path d="${p}" fill="none" stroke="${se.color}" stroke-width="${se.width || 2}" ${se.dash ? `stroke-dasharray="${se.dash}"` : ""} stroke-linejoin="round" stroke-linecap="round"/>`; if (o.dots) for (let i = 0; i < n; i++) { const v = se.vals[i]; if (isFinite(v)) s += `<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3.5" fill="${se.color}" stroke="var(--panel)" stroke-width="1" data-tip="${esc(`${o.xName ? o.xName(i) : o.xTicks && o.xTicks[i] ? o.xTicks[i][1] : i}, ${se.name}: ${fmt(v, o.dec)} ${o.unit || ""}`)}"/>`; } }
    s += `</g>`;
    if (o.hline != null) for (const hl of [].concat(o.hline)) s += `<line x1="${x0}" x2="${x0 + w}" y1="${Y(hl.v)}" y2="${Y(hl.v)}" stroke="${hl.color || "var(--mute)"}" stroke-dasharray="4 3"/>${hl.label ? `<text x="${x0 + w - 4}" y="${Y(hl.v) - 4}" text-anchor="end">${esc(hl.label)}</text>` : ""}`;
    if (o.tip) { const hid = K.hover((lx) => { const i = Math.round((lx - x0) / w * n - 0.5); if (i < 0 || i >= n) return null; return o.tip(i); }); s += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="transparent" data-hov="${hid}" data-cross="${x0},${y0},${w},${h},${n}"/>`; }
    for (const mk of marksLater) { const x = X(mk.i), y = Y(mk.v); s += `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" transform="rotate(45 ${x} ${y})" fill="var(--panel)" stroke="${mk.color}" stroke-width="2" data-tip="${esc(mk.tip || "")}"/>`; }
    return s + `</svg>`;
  };

  /* ---------- bars by month (grouped or stacked) ---------- */
  K.bars = function (o) {
    const W = o.W || K.curW || 760, H = o.height || 240, x0 = 48, y0 = 16, w = W - x0 - 16, h = H - y0 - 30, cats = o.cats || C.MONTHS, n = cats.length;
    let hi = axOv(o.unit) ? axOv(o.unit).hi : o.hi; if (hi == null) { hi = 0; for (let i = 0; i < n; i++) { if (o.stacked) { let s = 0; for (const se of o.series) s += Math.max(0, se.vals[i] || 0); hi = Math.max(hi, s); } else for (const se of o.series) hi = Math.max(hi, se.vals[i] || 0); } hi = hi * 1.08 || 1; }
    const lo = axOv(o.unit) ? axOv(o.unit).lo : 0, Y = (v) => y0 + h - h * (Math.max(lo, v) - lo) / (hi - lo), bw = w / n;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || "")}">` + axisY(x0, y0, h, lo, hi, niceTicks(lo, hi, 5), o.unit, w);
    s += `<g class="ax"><line x1="${x0}" x2="${x0 + w}" y1="${y0 + h}" y2="${y0 + h}"/></g>`;
    const ns = o.series.length;
    for (let i = 0; i < n; i++) {
      const cx = x0 + bw * i; s += `<text x="${cx + bw / 2}" y="${y0 + h + 15}" text-anchor="middle">${esc(cats[i])}</text>`;
      if (o.stacked) { let acc = 0; const gw = Math.min(o.barMax || 34, bw * 0.62); o.series.forEach((se, k) => { const v = Math.max(0, se.vals[i] || 0); if (v <= 0) return; const ya = Y(acc + v), yb = Y(acc); const top = k === ns - 1 || o.series.slice(k + 1).every((q) => !(q.vals[i] > 0)); s += barRect(cx + (bw - gw) / 2, ya, gw, Math.max(0, yb - ya - (acc > 0 ? 2 : 0)), se.color, false, o.tip ? o.tip(i, k) : `${cats[i]}, ${se.name}: ${fmt(v, o.dec)} ${o.unit || ""}`); acc += v; }); }
      else { const gw = Math.min(26, (bw * 0.78) / ns); o.series.forEach((se, k) => { const v = se.vals[i]; if (!isFinite(v) || v <= 0) return; const xx = cx + (bw - gw * ns - 2 * (ns - 1)) / 2 + k * (gw + 2); s += barRect(xx, Y(v), gw, Y(0) - Y(v), se.color, true, o.tip ? o.tip(i, k) : `${cats[i]}, ${se.name}: ${fmt(v, o.dec)} ${o.unit || ""}`); }); }
    }
    return s + `</svg>`;
  };
  function barRect(x, y, w, h, color, roundTop, tip) {
    if (h <= 0) return "";
    const r = Math.min(4, w / 2, h);
    const d = roundTop ? `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z` : `M${x},${y + h}V${y}H${x + w}V${y + h}Z`;
    return `<path d="${d}" fill="${color}" data-tip="${esc(tip)}"/>`;
  }
  K.barRect = barRect;

  /* ---------- twelve monthly daily profiles ---------- */
  K.profiles = function (o) {
    const W = 760, H = 230, x0 = 40, y0 = 16, h = 170, gap = 4, pw = (W - x0 - 8 - gap * 11) / 12;
    let lo = o.lo, hi = o.hi; if (axOv(o.unit)) { lo = axOv(o.unit).lo; hi = axOv(o.unit).hi; } const vals = o.vals, mask = o.mask;
    const stats = []; for (let m = 0; m < 12; m++) { const mn = new Array(24).fill(0), cnt = new Array(24).fill(0), mi = new Array(24).fill(Infinity), ma = new Array(24).fill(-Infinity); for (let d = C.MSTART[m]; d < C.MSTART[m] + C.MDAYS[m]; d++) for (let hr = 0; hr < 24; hr++) { const i = d * 24 + hr; if (mask && !mask[i]) continue; const v = vals[i]; if (!isFinite(v)) continue; mn[hr] += v; cnt[hr]++; mi[hr] = Math.min(mi[hr], v); ma[hr] = Math.max(ma[hr], v); } stats.push({ mean: mn.map((s, k) => (cnt[k] ? s / cnt[k] : NaN)), min: mi.map((v) => (isFinite(v) ? v : NaN)), max: ma.map((v) => (isFinite(v) ? v : NaN)) }); }
    if (lo == null || hi == null) { lo = Infinity; hi = -Infinity; for (const s of stats) for (const a of [s.min, s.max]) for (const v of a) if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } const pad = (hi - lo) * 0.05 || 1; lo -= pad; hi += pad; }
    const Y = (v) => y0 + h - h * (v - lo) / (hi - lo);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || "")}">` + axisY(x0, y0, h, lo, hi, niceTicks(lo, hi, 5), o.unit, W - x0 - 8);
    stats.forEach((st, m) => {
      const px = x0 + m * (pw + gap), X = (k) => px + pw * (k + 0.5) / 24;
      let band = "", line = "", pen = false;
      for (let k = 0; k < 24; k++) band += (k ? "L" : "M") + X(k).toFixed(1) + "," + Y(isFinite(st.max[k]) ? st.max[k] : lo).toFixed(1);
      for (let k = 23; k >= 0; k--) band += "L" + X(k).toFixed(1) + "," + Y(isFinite(st.min[k]) ? st.min[k] : lo).toFixed(1);
      for (let k = 0; k < 24; k++) { if (!isFinite(st.mean[k])) { pen = false; continue; } line += (pen ? "L" : "M") + X(k).toFixed(1) + "," + Y(st.mean[k]).toFixed(1); pen = true; }
      s += `<rect x="${px}" y="${y0}" width="${pw}" height="${h}" fill="none" stroke="var(--soft)"/>`;
      if (isFinite(st.mean[0]) || st.mean.some(isFinite)) s += `<path d="${band}Z" fill="${o.fill || "var(--accent-soft)"}" fill-opacity="${o.fillOpacity || 1}"/><path d="${line}" fill="none" stroke="${o.color || "var(--accent)"}" stroke-width="2"/>`;
      s += `<text x="${px + pw / 2}" y="${y0 + h + 15}" text-anchor="middle">${C.MONTHS[m]}</text>`;
      const hid = K.hover((lx) => { const k = Math.max(0, Math.min(23, Math.floor((lx - px) / pw * 24))); return `<b>${C.MONTHS_LONG[m]}, ${String(k).padStart(2, "0")}:00 to ${String(k + 1).padStart(2, "0")}:00</b><br>mean ${fmt(st.mean[k], 1)} ${o.unit}<br>range ${fmt(st.min[k], 1)} to ${fmt(st.max[k], 1)} ${o.unit}`; });
      s += `<rect x="${px}" y="${y0}" width="${pw}" height="${h}" fill="transparent" data-hov="${hid}"/>`;
    });
    if (o.hline != null) s += `<line x1="${x0}" x2="${W - 8}" y1="${Y(o.hline)}" y2="${Y(o.hline)}" stroke="var(--mute)" stroke-dasharray="4 3"/>`;
    K._lastProfiles = stats;
    return s + `</svg>`;
  };

  /* ---------- polar helpers ---------- */
  const pol = (cx, cy, r, azDeg) => [cx + r * Math.sin(azDeg * Math.PI / 180), cy - r * Math.cos(azDeg * Math.PI / 180)];
  K.pol = pol;

  K.rose = function (o) {
    const R = o.r || 120, size = o.size || (2 * R + 60), cx = size / 2, cy = size / 2 + 2, rose = o.rose, nS = rose.nSect;
    let max = 0; for (const c of rose.counts) max = Math.max(max, c.reduce((a, b) => a + b, 0)); const tot = rose.total || 1;
    const pmax = Math.max(o.pmax || 0, Math.ceil(100 * max / tot / 2) * 2 || 2);
    let s = `<svg viewBox="0 0 ${size} ${size + (o.title ? 18 : 0)}" role="img" aria-label="${esc(o.label || "")}">`;
    const rings = niceTicks(0, pmax, 3).filter((v) => v > 0);
    for (const p of rings) s += `<circle cx="${cx}" cy="${cy}" r="${R * p / pmax}" fill="none" stroke="var(--soft)"/><text x="${cx + 3}" y="${cy - R * p / pmax - 2}" font-size="9">${p}%</text>`;
    for (const [a, l] of [[0, "N"], [90, "E"], [180, "S"], [270, "W"]]) { const [x, y] = pol(cx, cy, R + 12, a); s += `<text x="${x}" y="${y + 4}" text-anchor="middle" class="ink" font-weight="600">${l}</text>`; }
    const wdt = (2 * Math.PI / nS) * 0.86;
    for (let k = 0; k < nS; k++) {
      let acc = 0; const a0 = (k * rose.step) * Math.PI / 180 - wdt / 2, a1 = a0 + wdt;
      for (let b = 1; b < rose.counts[k].length; b++) {
        const c = rose.counts[k][b]; if (!c) continue; const r0 = R * acc / tot * 100 / pmax, r1 = R * (acc + c) / tot * 100 / pmax; acc += c;
        const p = (r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
        const [x1, y1] = p(r0, a0), [x2, y2] = p(r1, a0), [x3, y3] = p(r1, a1), [x4, y4] = p(r0, a1);
        s += `<path d="M${x1},${y1}L${x2},${y2}A${r1},${r1} 0 0 1 ${x3},${y3}L${x4},${y4}A${r0},${r0} 0 0 0 ${x1},${y1}Z" fill="${o.colors[b]}" stroke="var(--panel)" stroke-width="1" data-tip="${esc(`${dirName(k * rose.step)}, ${binName(b)}: ${fmt(100 * c / tot, 1)} % of hours`)}"/>`;
      }
    }
    s += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="9">${fmt(100 * rose.calm / tot, 0)}% calm</text>`;
    if (o.title) s += `<text x="${cx}" y="${size + 12}" text-anchor="middle" class="ink" font-weight="600">${esc(o.title)}</text>`;
    return s + `</svg>`;
  };
  const DIRS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const dirName = (a) => DIRS[Math.round(((a % 360) + 360) % 360 / 22.5) % 16];
  K.dirName = dirName;
  const binName = (b) => { const B = C.WIND_BINS; return b === B.length - 1 ? `above ${B[b - 1]} m/s` : `${B[b - 1]} to ${B[b]} m/s`; };
  K.binName = binName;

  /* ---------- sun path (equidistant polar) ---------- */
  K.sunPath = function (o) {
    // equidistant: radius proportional to zenith angle; orthographic: the sky dome seen from straight above, radius = cos(altitude)
    const size = 520, R = 220, cx = size / 2, cy = size / 2 + 4, rad = o.ortho ? (alt) => R * Math.cos(alt * Math.PI / 180) : (alt) => R * (90 - alt) / 90; const P = (alt, az) => pol(cx, cy, rad(alt), az);
    let s = `<svg viewBox="0 0 ${size + 90} ${size + 6}" role="img" aria-label="${esc(o.label || "")}">`;
    for (let a = 0; a < 90; a += 10) s += `<circle cx="${cx}" cy="${cy}" r="${rad(a)}" fill="none" stroke="${a % 30 ? "var(--soft)" : "var(--line)"}" stroke-width="${a % 30 ? 0.7 : 1}"/>${!o.ortho || a === 0 || a >= 30 ? `<text x="${cx + 3}" y="${cy - rad(a) - 2}" font-size="8.5">${a}°</text>` : ""}`;
    for (let a = 0; a < 360; a += 30) { const [x, y] = pol(cx, cy, R, a), [x2, y2] = pol(cx, cy, R + 14, a); s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--soft)"/><text x="${x2}" y="${y2 + 4}" text-anchor="middle" ${a % 90 ? "" : 'class="ink" font-weight="600"'}>${a % 90 ? a + "°" : ["N", "E", "S", "W"][a / 90]}</text>`; }
    // analemma-like hour lines and day arcs
    s += dayArcs(o.lines.days, (alt, az) => P(alt, az), o.emphasis);
    for (const L of o.lines.hours) { let p = "", pen = false; for (const [alt, az] of L.pts) { if (alt < 0) { pen = false; continue; } const [x, y] = P(alt, az); p += (pen ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1); pen = true; } if (p) s += `<path d="${p}" fill="none" stroke="var(--soft)" stroke-width="1"/>`; const hi = L.pts.reduce((a, b) => (b[0] > a[0] ? b : a)); if (hi[0] > 2) { const [x, y] = P(hi[0], hi[1]); s += `<text x="${x}" y="${y - 4}" text-anchor="middle" font-size="9">${L.h}h</text>`; } }
    for (const q of o.points) { const [x, y] = P(q.alt, q.az); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="${q.c}"/>`; }
    if (o.tip) { const hid = K.hover((lx, ly) => { let best = null, bd = 64; for (const q of o.points) { const [x, y] = P(q.alt, q.az), dd = (x - lx) ** 2 + (y - ly) ** 2; if (dd < bd) { bd = dd; best = q; } } return best ? o.tip(best.i) : null; }); s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="transparent" data-hov="${hid}"/>`; }
    if (o.scale) s += colorbar(size + 20, 60, size - 140, o.scale, o.unit);
    return s + `</svg>`;
  };

  /* ---------- radial chart of surfaces by orientation ---------- */
  K.orient = function (o) {
    const size = 400, cx = 200, cy = 200, R = 150; const max = o.max || Math.max(...o.vals.map((v) => v[1])) * 1.05;
    let s = `<svg viewBox="0 0 ${size + (o.roof != null ? 150 : 0)} ${size}" role="img" aria-label="${esc(o.label || "")}">`;
    for (const t of niceTicks(0, max, 3).filter((v) => v > 0)) { const rr = 26 + (R - 26) * t / max; s += `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="none" stroke="var(--soft)"/><text x="${cx + 3}" y="${cy - rr - 2}" font-size="9">${fmt(U.v(t, o.unit))}</text>`; }
    const r0 = 26, bw = 16; // straight bars of equal width, one per orientation, so neighbours never overlap
    for (const [n, v, az] of o.vals) {
      const a = az * Math.PI / 180, ux = Math.sin(a), uy = -Math.cos(a), px = Math.cos(a), py = Math.sin(a), r = r0 + (R - r0) * v / max;
      const pt = (rr, side) => `${(cx + ux * rr + px * side * bw / 2).toFixed(1)},${(cy + uy * rr + py * side * bw / 2).toFixed(1)}`;
      s += `<path d="M${pt(r0, -1)}L${pt(r, -1)}L${pt(r, 1)}L${pt(r0, 1)}Z" fill="${o.color(v)}" stroke="var(--line)" stroke-width="0.5" data-tip="${esc(`${n}: ${fmt(v)} ${o.unit}`)}"/>`;
      const lr = Math.max(r, r0 + 10) + 16; s += `<text x="${cx + ux * lr}" y="${cy + uy * lr}" text-anchor="middle" class="lbl" font-weight="600">${n}</text><text x="${cx + ux * lr}" y="${cy + uy * lr + 12}" text-anchor="middle" font-size="10">${fmt(U.v(v, o.unit))}</text>`;
    }
    if (o.roof != null) s += `<text x="${size + 10}" y="40" class="ink" font-weight="600">Roof (horizontal)</text><text x="${size + 10}" y="62" style="font:600 22px var(--f-disp);fill:var(--ink)">${fmt(U.v(o.roof, o.unit))}</text><text x="${size + 10}" y="80">${esc(o.unit)}</text>`;
    if (o.note) s += `<text x="${size + 10}" y="110" font-size="11">${esc(o.note)}</text>`;
    return s + `</svg>`;
  };

  /* ---------- scatter ---------- */
  K.scatter = function (o) {
    const W = o.W || K.curW || 760, H = 380, x0 = 52, y0 = 14, w = W - x0 - (o.scale ? 90 : 16), h = H - y0 - 40;
    const xs = o.x, ys = o.y; let xl = Infinity, xh = -Infinity, yl = Infinity, yh = -Infinity;
    for (let i = 0; i < xs.length; i++) { if (o.mask && !o.mask[i]) continue; if (isFinite(xs[i])) { xl = Math.min(xl, xs[i]); xh = Math.max(xh, xs[i]); } if (isFinite(ys[i])) { yl = Math.min(yl, ys[i]); yh = Math.max(yh, ys[i]); } }
    if (o.xr) [xl, xh] = o.xr; if (o.yr) [yl, yh] = o.yr; if (axOv(o.yUnit)) { yl = axOv(o.yUnit).lo; yh = axOv(o.yUnit).hi; } if (!(xh > xl)) xh = xl + 1; if (!(yh > yl)) yh = yl + 1;
    const X = (v) => x0 + w * (v - xl) / (xh - xl), Y = (v) => y0 + h - h * (v - yl) / (yh - yl);
    const cv = document.createElement("canvas"); cv.width = w * 2; cv.height = h * 2; const g = cv.getContext("2d");
    for (let i = 0; i < xs.length; i++) { if (o.mask && !o.mask[i]) continue; if (!isFinite(xs[i]) || !isFinite(ys[i])) continue; g.fillStyle = o.colorOf ? o.colorOf(i) || "#8b9592" : "#23614f"; g.globalAlpha = 0.75; g.beginPath(); g.arc((X(xs[i]) - x0) * 2, (Y(ys[i]) - y0) * 2, 3, 0, 7); g.fill(); }
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || "")}"><image href="${cv.toDataURL("image/png")}" x="${x0}" y="${y0}" width="${w}" height="${h}"/>`;
    s += axisY(x0, y0, h, yl, yh, niceTicks(yl, yh, 6), o.yUnit, w);
    s += `<g class="ax"><line x1="${x0}" x2="${x0 + w}" y1="${y0 + h}" y2="${y0 + h}"/>`; for (const [t, lab] of U.ticks(xl, xh, 8, o.xUnit)) { const x = X(t); if (x < x0 - 0.5 || x > x0 + w + 0.5) continue; s += `<line x1="${x}" x2="${x}" y1="${y0 + h}" y2="${y0 + h + 4}"/><text x="${x}" y="${y0 + h + 16}" text-anchor="middle">${fmt(lab, Math.abs(lab) < 10 && lab % 1 ? 1 : 0)}</text>`; } s += `<text x="${x0 + w}" y="${y0 + h + 32}" text-anchor="end">${esc(o.xLabel || "")}</text></g>`;
    if (o.scale) s += colorbar(x0 + w + 24, y0 + 20, h - 40, o.scale, o.cUnit);
    return s + `</svg>`;
  };

  /* ---------- standalone export ---------- */
  K.standalone = function (svg, title, source, sub) {
    const vb = (svg.getAttribute("viewBox") || "0 0 760 260").split(/\s+/).map(Number), [vx, vy, vw, vh] = vb;
    const cl = svg.cloneNode(true), src = svg.querySelectorAll("*"), dst = cl.querySelectorAll("*");
    const P = ["fill", "fill-opacity", "stroke", "stroke-width", "stroke-opacity", "stroke-dasharray", "opacity", "font-family", "font-size", "font-weight", "text-anchor"];
    src.forEach((el, i) => { const cs = getComputedStyle(el), d = dst[i]; P.forEach((p) => { const v = cs.getPropertyValue(p); if (v && v !== "normal" && v !== "auto") d.style.setProperty(p, v); }); d.removeAttribute("class"); d.removeAttribute("data-tip"); d.removeAttribute("data-hov"); });
    const pad = 16, th = sub ? 56 : 40, sh = 26, Wd = vw + 2 * pad, Hd = vh + th + sh + pad, sc = 1600 / Wd;
    return { w: Math.round(Wd * sc), h: Math.round(Hd * sc), svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${Math.round(Wd * sc)}" height="${Math.round(Hd * sc)}" viewBox="0 0 ${Wd} ${Hd}"><rect width="${Wd}" height="${Hd}" fill="#ffffff"/><text x="${pad}" y="26" font-family="Helvetica, Arial, sans-serif" font-size="15" font-weight="700" fill="#18201f">${esc(title)}</text>${sub ? `<text x="${pad}" y="44" font-family="Helvetica, Arial, sans-serif" font-size="11.5" font-weight="400" fill="#5b6663">${esc(sub)}</text>` : ""}<g transform="translate(${pad - vx} ${th - vy})">${cl.innerHTML}</g><text x="${pad}" y="${Hd - 10}" font-family="Helvetica, Arial, sans-serif" font-size="10" fill="#5b6663">${esc(source)}</text></svg>` };
  };
  K.svgToPng = function (st) {
    return new Promise((res, rej) => { const img = new Image(); img.onload = () => { const c = document.createElement("canvas"); c.width = st.w; c.height = st.h; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, st.w, st.h); c.toBlob(res, "image/png"); }; img.onerror = () => rej(new Error("This browser could not draw the image.")); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(st.svg); });
  };


  // the 21st of every month; solstices and equinoxes solid, the others dashed; orange and stronger without a data overlay
  function dayArcs(days, P, emph) {
    let s = "";
    for (const L of days) {
      let d = "", pen = false; for (const [alt, az] of L.pts) { if (alt < 0) { pen = false; continue; } const [x, y] = P(alt, az); d += (pen ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1); pen = true; }
      const key = L.m === 5 || L.m === 11, eq = L.m === 2 || L.m === 8;
      s += emph ? `<path d="${d}" fill="none" stroke="#ff7b00" stroke-width="${key ? 2.4 : 1.5}"/>` : `<path d="${d}" fill="none" stroke="var(--out)" stroke-width="${key ? 1.3 : 0.8}" ${key || eq ? "" : 'stroke-dasharray="3 3"'}/>`;
    }
    return s;
  }
  K.dayArcs = dayArcs;

  /* ---------- sun path, cylindrical: azimuth across, altitude up, centred on the equator-facing direction ---------- */
  K.sunPathCyl = function (o) {
    const W = 760, H = 330, x0 = 44, y0 = 14, w = W - x0 - (o.scale ? 90 : 16), h = 270, c = o.lat >= 0 ? 180 : 0;
    const X = (az) => x0 + w * (((az - c + 540) % 360)) / 360, Y = (alt) => y0 + h - h * alt / 90;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || "")}">` + axisY(x0, y0, h, 0, 90, [0, 10, 20, 30, 40, 50, 60, 70, 80, 90], "altitude, °", w);
    s += `<g class="ax"><line x1="${x0}" x2="${x0 + w}" y1="${y0 + h}" y2="${y0 + h}"/>`;
    for (let k = 0; k <= 8; k++) { const az = (c - 180 + k * 45 + 360) % 360, x = x0 + w * k / 8, lab = { 0: "N", 90: "E", 180: "S", 270: "W" }[az]; s += `<line x1="${x}" x2="${x}" y1="${y0}" y2="${y0 + h + 4}" style="stroke:var(--soft)"/><text x="${x}" y="${y0 + h + 16}" text-anchor="middle" ${lab ? 'class="ink" font-weight="600"' : ""}>${lab || az + "°"}</text>`; }
    s += `</g>`;
    const line = (pts, st) => { let d = "", pen = false, px = null; for (const [alt, az] of pts) { if (alt < 0) { pen = false; continue; } const x = X(az), y = Y(alt); if (px != null && Math.abs(x - px) > w / 2) pen = false; d += (pen ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1); pen = true; px = x; } return d ? `<path d="${d}" fill="none" ${st}/>` : ""; };
    for (const L of o.lines.days) s += line(L.pts, o.emphasis ? `stroke="#ff7b00" stroke-width="${L.m === 5 || L.m === 11 ? 2.2 : 1.4}"` : `stroke="var(--out)" stroke-width="${L.m === 5 || L.m === 11 ? 1.2 : 0.8}" ${L.m === 5 || L.m === 11 || L.m === 2 || L.m === 8 ? "" : 'stroke-dasharray="3 3"'}`);
    for (const L of o.lines.hours) s += line(L.pts, `stroke="var(--soft)" stroke-width="1"`);
    for (const q of o.points) s += `<circle cx="${X(q.az).toFixed(1)}" cy="${Y(q.alt).toFixed(1)}" r="2.4" fill="${q.c}"/>`;
    if (o.tip) { const hid = K.hover((lx, ly) => { let best = null, bd = 64; for (const q of o.points) { const dd = (X(q.az) - lx) ** 2 + (Y(q.alt) - ly) ** 2; if (dd < bd) { bd = dd; best = q; } } return best ? o.tip(best.i) : null; }); s += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="transparent" data-hov="${hid}"/>`; }
    if (o.scale) s += colorbar(x0 + w + 22, y0 + 10, h - 20, o.scale, o.unit);
    return s + `</svg>`;
  };

  /* ---------- sun path, 3D: the sky dome seen from outside; drag to turn it ---------- */
  K.view3d = { yaw: -25, pitch: 28 };
  K.sunPath3D = function (o) {
    const size = 560, Hh = 470, cx = 260, cy = 320, R = 220, v = K.view3d, yr = v.yaw * Math.PI / 180, pr = v.pitch * Math.PI / 180;
    const P = (alt, az) => { const a = alt * Math.PI / 180, z0 = az * Math.PI / 180, x = Math.cos(a) * Math.sin(z0), y = Math.cos(a) * Math.cos(z0), z = Math.sin(a); const X = x * Math.cos(yr) - y * Math.sin(yr), Yh = x * Math.sin(yr) + y * Math.cos(yr); return [cx + R * X, cy - R * (Yh * Math.sin(pr) + z * Math.cos(pr)), -Yh * Math.cos(pr) + z * Math.sin(pr)]; };
    let s = `<svg viewBox="0 0 ${size + (o.scale ? 90 : 0)} ${Hh}" role="img" aria-label="${esc(o.label || "")}" data-drag3d="1" style="cursor:grab;touch-action:none">`;
    let g = ""; for (let a = 0; a <= 360; a += 5) { const [x, y] = P(0, a); g += (a ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1); } s += `<path d="${g}Z" fill="var(--bg)" stroke="var(--line)"/>`;
    for (let alt = 10; alt < 90; alt += 10) { let d = ""; for (let a = 0; a <= 360; a += 5) { const [x, y] = P(alt, a); d += (a ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1); } s += `<path d="${d}" fill="none" stroke="var(--soft)"/>`; }
    for (let a = 0; a < 360; a += 30) { const [x1, y1] = P(0, a), [x2, y2] = P(0, a + 180); if (a < 180) s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--soft)"/>`; const [lx, ly] = P(-6, a); s += `<text x="${lx}" y="${ly + 4}" text-anchor="middle" ${a % 90 ? "" : 'class="ink" font-weight="600"'}>${a % 90 ? a + "°" : ["N", "E", "S", "W"][a / 90]}</text>`; }
    const [zx, zy] = P(90, 0), [gx, gy] = P(0, 0); s += `<line x1="${cx}" y1="${cy}" x2="${zx}" y2="${zy}" stroke="var(--soft)" stroke-dasharray="2 3"/>`;
    for (const L of o.lines.hours) { let d = "", pen = false; for (const [alt, az] of L.pts) { if (alt < 0) { pen = false; continue; } const [x, y] = P(alt, az); d += (pen ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1); pen = true; } if (d) s += `<path d="${d}" fill="none" stroke="var(--out)" stroke-width="0.7" opacity="${o.emphasis ? 0.6 : 0.35}"/>`; }
    s += dayArcs(o.lines.days, P, o.emphasis);
    const pts = o.points.map((q) => { const [x, y, dep] = P(q.alt, q.az); return { q, x, y, dep }; }).sort((a, b) => a.dep - b.dep);
    for (const p of pts) s += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.6" fill="${p.q.c}" opacity="${p.dep < 0 ? 0.45 : 1}"/>`;
    s += `<text x="10" y="${Hh - 8}" font-size="10">Drag to turn the dome</text>`;
    if (o.tip) { K._pts3d = pts; const hid = K.hover((lx, ly) => { let best = null, bd = 64; for (const p of K._pts3d) { const dd = (p.x - lx) ** 2 + (p.y - ly) ** 2; if (dd <= bd) { bd = dd; best = p; } } return best ? o.tip(best.q.i) : null; }); s += `<rect x="0" y="0" width="${size}" height="${size}" fill="transparent" data-hov="${hid}"/>`; }
    if (o.scale) s += colorbar(size + 20, 40, Hh - 100, o.scale, o.unit);
    return s + `</svg>`;
  };


  /* ---------- sun path section: the north-south plane through the dome, with noon sun angles ---------- */
  K.sunSection = function (o) {
    const W = 760, H = 400, cx = 380, cy = 330, R = 250, eqRight = o.lat >= 0;
    // south is always on the right; th is the angle from the southern horizon, so a noon sun to the north has th = 180 - altitude
    const P = (th, r) => { const a = th * Math.PI / 180; return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; };
    const TH = (c) => (c.north ? 180 - c.alt : c.alt);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sun path section">`;
    // the 3D sun path seen from the west in parallel projection: south to the right, north to the left
    if (o.lines) {
      const Q = (alt, az) => [cx - R * Math.cos(alt * Math.PI / 180) * Math.cos(az * Math.PI / 180), cy - R * Math.sin(alt * Math.PI / 180)];
      const path = (pts) => { let d = "", pen = false; for (const [alt, az] of pts) { if (alt < 0) { pen = false; continue; } const [x, y] = Q(alt, az); d += (pen ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1); pen = true; } return d; };
      // analemmas from sunrise on the summer solstice up to solar noon that day (clock hours, local standard time)
      const sd = o.lines.days.find((d) => d.m === (o.lat >= 0 ? 5 : 11)).pts, rise = sd.findIndex((p) => p[0] > 0) / 6, noon = sd.reduce((b, p, k) => (p[0] > sd[b][0] ? k : b), 0) / 6;
      for (const L of o.lines.hours) { if (L.h < rise || L.h > noon + 0.01) continue; const d = path(L.pts); if (d) s += `<path d="${d}" fill="none" stroke="var(--out)" stroke-width="0.8" opacity="0.55"/>`; }
      for (const L of o.lines.days) { const d = path(L.pts); if (d) s += `<path d="${d}" fill="none" stroke="var(--out)" stroke-width="${L.m === 5 || L.m === 11 ? 1.2 : 0.8}" ${L.m === 5 || L.m === 11 || L.m === 2 || L.m === 8 ? "" : 'stroke-dasharray="3 3"'} opacity="0.7"/>`; }
      const top = o.lines.hours.find((L) => L.h === 12); if (top) { const hi = top.pts.reduce((x, y) => (y[0] > x[0] ? y : x)); const [x, y] = Q(hi[0], hi[1]); s += `<text x="${x}" y="${y - 6}" text-anchor="middle" style="font-size:12px">12h</text>`; }
    }
    // dome section and altitude ticks every 10 degrees
    s += `<path d="M${cx - R},${cy} A${R},${R} 0 0 1 ${cx + R},${cy}" fill="none" stroke="var(--line)"/>`;
    for (let a = 10; a < 180; a += 10) { const ang = a * Math.PI / 180, x1 = cx + R * Math.cos(ang), y1 = cy - R * Math.sin(ang), x2 = cx + (R + 6) * Math.cos(ang), y2 = cy - (R + 6) * Math.sin(ang); const alt = a <= 90 ? a : 180 - a; s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--line)"/>`; if (alt % 30 === 0) s += `<text x="${cx + (R - 22) * Math.cos(ang)}" y="${cy - (R - 22) * Math.sin(ang) + 5}" text-anchor="middle" style="font-size:15px">${alt}°</text>`; }
    s += `<line x1="${cx - R - 20}" x2="${cx + R + 20}" y1="${cy}" y2="${cy}" stroke="var(--ink)" stroke-width="1.5"/>`;
    s += `<text x="${cx + (eqRight ? 1 : -1) * (R + 26)}" y="${cy + 18}" text-anchor="middle" class="ink" style="font-size:18px;font-weight:600">${o.lat >= 0 ? "S" : "N"}</text><text x="${cx - (eqRight ? 1 : -1) * (R + 26)}" y="${cy + 18}" text-anchor="middle" class="ink" style="font-size:18px;font-weight:600">${o.lat >= 0 ? "N" : "S"}</text>`;
    // band of noon altitudes over the year
    const ths = o.cases.map(TH), [bx1, by1] = P(Math.min(...ths), R), [bx2, by2] = P(Math.max(...ths), R);
    s += `<path d="M${cx},${cy} L${bx1},${by1} A${R},${R} 0 0 0 ${bx2},${by2} Z" fill="var(--s4)" opacity="0.10"/>`;
    o.cases.forEach((c, k) => {
      const th = TH(c), right = !c.north, [x, y] = P(th, R), rr = 80 + k * 50, [ax, ay] = P(th, rr), [sx, sy] = P(right ? 0 : 180, rr);
      s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${c.color}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="12" fill="${c.color}" stroke="var(--panel)" stroke-width="2" data-tip="${esc(`${c.name}: ${fmt(c.alt, 1)}° to the ${c.north ? "north" : "south"} at ${c.time}`)}"/>`;
      s += right ? `<path d="M${sx},${sy} A${rr},${rr} 0 0 0 ${ax},${ay}" fill="none" stroke="${c.color}" stroke-width="1.2"/>` : `<path d="M${ax},${ay} A${rr},${rr} 0 0 0 ${sx},${sy}" fill="none" stroke="${c.color}" stroke-width="1.2"/>`;
      const lab = P(th, R + 20); s += `<text x="${lab[0] + (right ? 10 : -10)}" y="${lab[1] - 8}" text-anchor="${right ? "start" : "end"}" class="lbl" style="font-size:16px;font-weight:600">${esc(c.name)}</text><text x="${lab[0] + (right ? 10 : -10)}" y="${lab[1] + 14}" text-anchor="${right ? "start" : "end"}" style="font-size:19px;font-weight:700;fill:${c.color}">${fmt(c.alt, 1)}°</text>`;
    });
    s += `<circle cx="${cx}" cy="${cy}" r="3.5" class="ink" style="fill:var(--ink)"/>`;
    s += `<text x="12" y="${H - 8}" style="font-size:14px">The 3D sun path seen from the west, cut along the north-south line. Rays: sun at true solar noon.</text>`;
    return s + `</svg>`;
  };

  /* ---------- reference strip: one value placed among reference climates ---------- */
  K.refStrip = function (o) {
    const W = 340, H = 52, x0 = 10, w = W - 20; const all = o.refs.map((r) => r.v).concat([o.v]); let lo = Math.min(...all), hi = Math.max(...all); const pad = (hi - lo) * 0.04 || 1; lo -= pad; hi += pad;
    const X = (v) => x0 + w * (v - lo) / (hi - lo);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || "")}"><line x1="${x0}" x2="${x0 + w}" y1="20" y2="20" stroke="var(--line)" stroke-width="2"/>`;
    let lastX = [-99, -99]; for (const r of [...o.refs].sort((a, b) => a.v - b.v)) { const x = X(r.v), row = x - lastX[0] < 20 && x - lastX[1] >= 20 ? 1 : 0; lastX[row] = x; s += `<line x1="${x}" x2="${x}" y1="13" y2="27" stroke="var(--out)" stroke-width="2" data-tip="${esc(`${r.name}: ${o.fmt(r.v)}`)}"/><text x="${x}" y="${38 + row * 10}" text-anchor="middle" font-size="8.5">${esc(r.short || r.name.slice(0, 3))}</text>`; }
    s += `<circle cx="${X(o.v)}" cy="20" r="6.5" fill="var(--accent)" stroke="var(--panel)" stroke-width="2" data-tip="${esc(`This file: ${o.fmt(o.v)}`)}"/><text x="${X(o.v)}" y="9" text-anchor="middle" font-size="9.5" class="ink" font-weight="600">${esc(o.fmt(o.v))}</text>`;
    return s + `</svg>`;
  };

  root.K = K;
})(this);
