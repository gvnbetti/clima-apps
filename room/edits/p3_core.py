import sys; sys.path.insert(0, '/home/claude/rdg/v16/edits'); from lib import Ed
B = '/home/claude/rdg/v16/src/'
D17 = "Decision of 17 November 2026"
# ===================================================================== register
r = Ed(B + 'register.js')
r.rep('''    "blind.ext": {''', '''    "score.shape": { v: "d = 1 / (1 + x)", unit: "score 0 to 1", status: "decision", src: D17 + " (absolute scales, brief section 6)", text: "Scores on fixed scales, never against the run: daylight is the useful daylight share; comfort 1 with no overheating, 0.5 at the limit, 1/3 at twice the limit; energy 1 at or below the target, 0.5 at the limit. Scores never reach 0, so designs that miss a target are still ranked; whether a design meets the targets is decided separately" },
    "score.dl": { v: { target: 40, words: [40, 60, 80], overlit: 10 }, unit: "% of floor and hours", status: "assumption", src: "Proposal of the brief, section 9; to calibrate against the EN 17037 levels on the test rooms", text: "Daylight answer from the useful daylight share: below 40 % not enough, 40 to 60 % sufficient, 60 to 80 % good, 80 % and more very good. The target is met from 40 % (EN 17037 rating: from the minimum level). Flag: over-lit when more than 10 % of floor and hours are above the useful range" },
    "score.energy": { v: { office: [10, 25], school: [10, 25], dwelling: [6, 15] }, unit: "kWh/m²a delivered: target, limit", status: "assumption", src: D17 + " (absolute scales); values to be set per project", text: "Energy scale per use: score 1 at or below the target, 0.5 at the limit; the energy target is met at or below the limit. Delivered energy of the room: heating and cooling through the heat pump efficiencies, fans and, for offices and schools, lighting. Editable in the reading panel" },
    "rec.rule": { v: "targets first, then score", status: "decision", src: D17 + " (brief section 6, when nothing meets the targets)", text: "Recommended design at each facade: among the designs that meet every target (the daylight minimum, useful daylight, the comfort limit, the energy limit and, in Germany, DIN 4108-2 as estimated in the design run), the one with the highest score. When none meets them all: the closest design, with the smallest largest shortfall; each shortfall is a share of its target, weighted by the priorities. The daylight minimum and DIN 4108-2 are not traded: a design that meets them comes before one that does not" },
    "rec.packages": { v: { maxLoss: 0.05, minDiff: 2, n: 3 }, unit: "score, measures, designs", status: "decision", src: D17, text: "Other packages at each facade: up to three designs that meet the same targets as the recommended one (or, when nothing meets them, come about as close), score at most 0.05 below it and differ from it and from each other in at least two measures. They show the designs that do about as well by other means" },
    "scen.climate": { v: 2, unit: "°C global warming level", status: "decision", src: "Brief section 6 (scenarios); morph as the Future climate control (IPCC AR6 Atlas, Belcher et al. 2005)", text: "Climate scenario: +2 °C. When the run already uses +2 °C, +3 °C; when it uses +3 °C, no climate scenario. The urban heat island of the run is kept" },
    "scen.poor": { v: { blinds: 0.5, night: 0 }, unit: "share of blind hours, night ventilation", status: "decision", src: "Brief section 6 (scenarios)", text: "Poor operation: blinds come down only on every other day (half the blind hours) and windows stay shut at night. Day ventilation and everything else as designed" },
    "scen.rule": { v: "recommended and packages", status: "decision", src: D17, text: "The recommended design and the other packages of each facade are rerun in each scenario (daylight unchanged). Robust means: the recommended design still meets the comfort limit, or stays the best of the shortlist" },
    "carbon.years": { v: 50, unit: "years", status: "standard", src: "BNB and DGNB reference study period", text: "Period for replacements and operational carbon" },
    "carbon.grid": { v: 0.25, unit: "kg CO₂e per kWh of electricity", status: "assumption", src: "UBA 2024 about 0.38 kg/kWh for the German mix, falling under the Klimaschutzgesetz; 0.25 is an assumed mean over 50 years", text: "Operational carbon: delivered energy (all electric, heat pump) times this factor times 50 years. Editable in the reading panel" },
    "carbon.window": { v: { double: 55, triple: 75, coat: 3, life: 40 }, unit: "kg CO₂e per m² of window (A1 to A3), years", status: "assumption", src: "Generic values in the range of ÖKOBAUDAT records for timber-aluminium windows; replace with the Build-up LCA dataset", text: "Window with frame: double or triple glazing; solar control coating added for g 0.3 or less; one replacement within 50 years (BNB service life 40 years)" },
    "carbon.wall": { v: { base: 45, perCm: 0.42, cm: { u24: 14, u15: 24, u10: 36 } }, unit: "kg CO₂e per m² of wall, per cm of insulation", status: "assumption", src: "Generic values: masonry or concrete wall without insulation; mineral wool 35 kg/m³ at about 1.2 kg CO₂e/kg", text: "Opaque wall replaced by window: wall structure plus insulation thickness for the U-value level" },
    "carbon.blind": { v: { exterior: [40, 25], interior: [6, 15] }, unit: "kg CO₂e per m² of window, service life in years", status: "assumption", src: "Generic values: aluminium venetian blind with motor about 3.5 kg aluminium per m²; textile interior blind; BNB service lives", text: "Blinds with replacements over 50 years" },
    "carbon.fixed": { v: 90, unit: "kg CO₂e per m² of projected element", status: "assumption", src: "Generic value: aluminium sections about 10 kg/m²", text: "Overhangs, fins and frames: depth times length (overhang over the facade width, two fins over the window height)" },
    "carbon.mass": { v: { light: 0, medium: 15, heavy: 45, vheavy: 60 }, unit: "kg CO₂e per m² of floor, against light construction", status: "assumption", src: "Rough generic values: masonry walls; concrete slab exposed instead of a timber slab with a suspended ceiling. The least certain factor", text: "Thermal mass class: extra material against a light construction" },
    "carbon.fan": { v: { unit: 35, area: 12, life: 15 }, unit: "kg CO₂e per fan, m² of floor per fan, years", status: "assumption", src: "Generic value for a ceiling fan with motor", text: "Ceiling fans with replacements over 50 years" },
    "carbon.night": { v: { window: 15, storey: 5, life: 20 }, unit: "kg CO₂e per facade (tilt restrictor and actuator), per m² floor (vents across storeys), years", status: "assumption", src: "Generic values", text: "Night ventilation hardware with replacements over 50 years" },
    "blind.ext": {''')
r.save()

c = Ed(B + 'core.js'); rep = c.rep
# ===================================================================== poor operation: half the blind hours
rep('''      if (shd.fc < 1 && !(hand && weekend) && (din || HOLD == null || tAir > HOLD)) for''',
    '''      if (shd.fc < 1 && !(hand && weekend) && (din || HOLD == null || tAir > HOLD) && !(ctx.blindHalf && ((i / 24) | 0) % 2)) for''')
# ===================================================================== carbon of a design (embodied, per m² of floor)
rep('''  const effArea = (ops, kind)''', '''  /* embodied carbon of the elements the options change, per m² of floor, over the study period with replacements
     (v16 phase 3, register carbon.*). dims [W, D, H]; scenario "cellular" (one facade) or corner (two). */
  function carbonOf(dims, scenario, dz) {
    const W = dims[0], D = dims[1], H = dims[2], Af = W * D, Y = RV("carbon.years"), rep = (life) => Math.ceil(Y / life);
    const fw = RV("carbon.window"), fl = RV("carbon.wall"), fb = RV("carbon.blind"), ff = RV("carbon.fixed"), fm = RV("carbon.mass"), fn = RV("carbon.fan"), fo = RV("carbon.night");
    const walls = scenario === "cellular" ? [W] : [W, D], out = { window: 0, wall: 0, blinds: 0, fixed: 0, mass: 0, fans: 0, night: 0 };
    const key = SHADE_LEVELS.office[dz.shading] || "none";
    walls.forEach((L) => {
      const Aw = dz.wwr * L * H, Ao = (1 - dz.wwr) * L * H, r = Z.windowRect(L, H, dz.wwr, 0.3), hw = r.z1 - r.z0;
      out.window += Aw * ((dz.uglass >= 1 ? fw.double : fw.triple) + (dz.gglass <= 0.3 ? fw.coat : 0)) * rep(fw.life);
      out.wall += Ao * (fl.base + fl.perCm * (fl.cm[dz.opaque] || 0));
      if (key !== "none") out.blinds += Aw * fb[key][0] * rep(fb[key][1]);
      const dep = { none: [0, 0], oh05: [0.5, 0], oh10: [1, 0], fin05: [0, 0.5], box05: [0.5, 0.5] }[dz.fixed] || [0, 0];
      out.fixed += ff * (dep[0] * L + 2 * dep[1] * hw);
      if (dz.nightAch === 1) out.night += fo.window * rep(fo.life);
    });
    if (dz.nightAch === 5) out.night += fo.storey * Af * rep(fo.life);
    out.mass = (fm[dz.mass] || 0) * Af;
    if (dz.fans) out.fans = fn.unit * Math.ceil(Af / fn.area) * rep(fn.life);
    const per = {}; let tot = 0; for (const k in out) { per[k] = out[k] / Af; tot += per[k]; }
    return { per, total: tot };
  }
  const effArea = (ops, kind)''')
rep('''openings, effArea, ventFlow };''', '''openings, effArea, ventFlow, carbonOf };''')

# ===================================================================== score: absolute scales, targets, shortfalls, ranking
rep('''  function dC(m, o) { return o.cZero != null ? clip((o.cZero - m.C) / Math.max(1e-9, o.cZero - o.cBest)) : clip(1 - m.C / (2 * o.limit)); }
  function dE(m, o) { return o.upper <= o.target ? (m.E <= o.target ? 1 : 0) : clip((o.upper - m.E) / (o.upper - o.target)); }''',
    '''  /* v16 phase 3: absolute scales (register score.shape). Comfort 1 at 0, 0.5 at the limit; energy 1 at or below the target,
     0.5 at the limit. Neither reaches 0, so designs that miss a target are still ranked. */
  function dC(m, o) { return 1 / (1 + Math.max(0, m.C) / Math.max(1e-9, o.limit)); }
  function dE(m, o) { return m.E <= o.target ? 1 : 1 / (1 + (m.E - o.target) / Math.max(1e-9, o.upper - o.target)); }
  /* targets (register rec.rule): o.dlT daylight share 0..1, o.limit comfort, o.upper energy limit, o.dinLim with m.din in
     Germany. Shortfalls as shares of the target; ws the largest, weighted by the priorities (largest weight = 1). */
  function meets(m, o) {
    const req = !!m.A1 && (m.din == null || o.dinLim == null || m.din <= o.dinLim);
    const t = { A1: !!m.A1, din: m.din == null || o.dinLim == null || m.din <= o.dinLim, S: m.S >= o.dlT - 1e-9, C: m.C <= o.limit, E: m.E <= o.upper };
    return Object.assign(t, { req, all: req && t.S && t.C && t.E });
  }
  function shortfall(m, o) {
    const s = [m.A1 ? Math.max(0, (o.dlT - m.S) / Math.max(1e-9, o.dlT)) : 1, Math.max(0, (m.C - o.limit) / Math.max(1e-9, o.limit)), Math.max(0, (m.E - o.upper) / Math.max(1e-9, o.upper))];
    const wm = Math.max(...o.w); return { s, ws: Math.max(...s.map((x, i) => x * o.w[i] / wm)) };
  }
  /* one number to rank by: designs meeting every target in (2, 3] by their score; the others by closeness, in (1, 2] when
     they meet the daylight minimum and DIN 4108-2, in (0, 1] when not */
  function rank(m, o, D) { const t = meets(m, o); if (t.all) return { q: 2 + D, t, ws: 0, s: [0, 0, 0] }; const f = shortfall(m, o); return { q: (t.req ? 1 : 0) + 1 / (1 + f.ws), t, ws: f.ws, s: f.s }; }''')
rep('''    return { d, D, short: m.C > o.limit };
  }''', '''    const k = o.dlT != null ? rank(m, o, D) : null;
    return { d, D, short: m.C > o.limit, q: k ? k.q : D, t: k ? k.t : null, ws: k ? k.ws : 0, s: k ? k.s : null };
  }''')
rep('''  const api = { dS, dC, dE, score, pareto, corner, analyse, daylight, DLM, FLOOR };''', '''  // daylight answer in words (register score.dl), from the share 0..1
  const DLW = RG.val("score.dl"), dlWord = (S) => { const p = 100 * S, w = DLW.words; return p < w[0] ? "not enough" : p < w[1] ? "sufficient" : p < w[2] ? "good" : "very good"; };
  const api = { dS, dC, dE, score, meets, shortfall, rank, dlWord, DLW, pareto, corner, analyse, daylight, DLM, FLOOR };''')
rep('''(function (root) {
  "use strict";
  const clip = (x) => Math.max(0, Math.min(1, x));''', '''(function (root) {
  "use strict";
  const RG = root.Register || require("./register.js");
  const clip = (x) => Math.max(0, Math.min(1, x));''')
c.save()
