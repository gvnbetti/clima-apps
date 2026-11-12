/* Room Clima parameter register (v16). Every value the engine, the page and the method text use is defined here,
   once, with its source. status: "standard" = taken from the text of the standard named; "secondary" = from a
   secondary source, to be replaced by the standard text; "decision" = a modelling choice of this app, dated;
   "assumption" = a typical value without a binding source. The page lists every entry under Method and limits. */
(function (root) {
  "use strict";
  const DIN = "DIN 4108-2:2013-02";
  const REG = {
    // ---------------------------------------------------------------- DIN 4108-2, clause 8.4.2: the summer protection check
    "din.schedule.nonres": { v: [7, 18], unit: "h, Monday to Friday", status: "standard", src: DIN + ", 8.4.2 b", text: "Non-residential use: Monday to Friday, 7:00 to 18:00" },
    "din.schedule.res": { v: [0, 24], unit: "h, every day", status: "standard", src: DIN + ", 8.4.2 b", text: "Residential use: every day, all hours" },
    "din.yearStart": { v: "Monday", status: "standard", src: DIN + ", 8.4.2 d", text: "The year starts on Monday 1 January; no public holidays or school breaks" },
    "din.gain.res": { v: 100, unit: "Wh/(m² d)", status: "standard", src: DIN + ", 8.4.2 e", text: "Internal gains, residential: 100 Wh per m² of floor a day, constant over all hours" },
    "din.gain.nonres": { v: 144, unit: "Wh/(m² d)", status: "standard", src: DIN + ", 8.4.2 e", text: "Internal gains, non-residential: 144 Wh per m² of floor a day, constant over the 11 use hours" },
    "din.gain.convective": { v: 1, unit: "share", status: "standard", src: DIN + ", 8.4.2 e", text: "Internal gains are 100 % convective" },
    "din.tHeat": { v: { res: 20, nonres: 21 }, unit: "°C", status: "standard", src: DIN + ", 8.4.2 f", text: "Heating setpoint without night setback: 20 °C residential, 21 °C non-residential" },
    "din.air.res": { v: 0.5, unit: "1/h", status: "standard", src: DIN + ", 8.4.2 g", text: "Base air change, residential: 0.5 1/h" },
    "din.air.nonres.use": { v: 4, unit: "m³/(h m²) of floor", status: "standard", src: DIN + ", 8.4.2 g, eq. (5)", text: "Base air change, non-residential, in use hours: n = 4 · A_G / V" },
    "din.air.nonres.off": { v: 0.24, unit: "1/h", status: "standard", src: DIN + ", 8.4.2 g, eq. (6)", text: "Base air change, non-residential, outside use hours: 0.24 1/h" },
    "din.day.ach": { v: 3, unit: "1/h", status: "standard", src: DIN + ", 8.4.2 h", text: "Raised day ventilation: up to 3 1/h in presence hours when the room air is above 23 °C and above the outdoor air" },
    "din.day.tAir": { v: 23, unit: "°C", status: "standard", src: DIN + ", 8.4.2 h", text: "Room air temperature above which day ventilation may be raised" },
    "din.presence.res": { v: [6, 23], unit: "h", status: "standard", src: DIN + ", 8.4.2 h and i", text: "Presence hours for ventilation, residential: 6:00 to 23:00" },
    "din.night.raised": { v: 2, unit: "1/h", status: "standard", src: DIN + ", 8.4.2 i", text: "Raised night ventilation: 2 1/h where windows can be opened at night" },
    "din.night.high": { v: 5, unit: "1/h", status: "standard", src: DIN + ", 8.4.2 i", text: "High night ventilation: 5 1/h only with ventilation across storeys (atrium, stair) or a system sized for it" },
    "din.night.rule": { v: "air > heating setpoint and air > outdoor", status: "standard", src: DIN + ", 8.4.2 i, eq. (7)", text: "Night ventilation runs when the room air is above the heating setpoint and above the outdoor air" },
    "din.night.gtot": { v: 0.4, unit: "g_tot", status: "standard", src: DIN + ", 8.4.2 i", text: "Night ventilation counts only with sun protection reaching g_tot = g · F_C of 0.4 or less" },
    "din.blind.irr": { v: { res: [200, 300], nonres: [150, 200] }, unit: "W/m² on the window, [north, other]", status: "standard", src: DIN + ", 8.4.2 j", text: "Blinds by irradiance on the window: 200 (north) and 300 W/m² residential; 150 (north) and 200 W/m² non-residential. North means north, north-east and north-west" },
    "din.blind.weekend": { v: true, status: "standard", src: DIN + ", 8.4.2 j", text: "Blinds operated by hand are not used at weekends in non-residential use" },
    "din.ref": { v: { A: 25, B: 26, C: 27 }, unit: "°C", status: "standard", src: DIN + ", Table 9", text: "Reference operative temperature by summer climate region: A 25 °C, B 26 °C, C 27 °C" },
    "din.limit": { v: { res: 1200, nonres: 500 }, unit: "K·h/a", status: "standard", src: DIN + ", Table 9", text: "Limit of overheating degree-hours: 1,200 K·h/a residential, 500 K·h/a non-residential" },
    "din.weather": { v: { A: "TRY 2011 zone 2", B: "TRY 2011 zone 4", C: "TRY 2011 zone 12" }, status: "standard", src: DIN + ", 8.4.2 c", text: "The proof uses the 2011 test reference year (normal year) of the region. On any other weather file the result is an indication" },
    "din.region": { v: "from figure 1", status: "standard", src: DIN + ", 8.1, figure 1", text: "Summer climate region from the map of figure 1; between two regions the warmer one" },
    "din.fc": { v: { venetian: { sc: 0.30, double: 0.25, triple: 0.25 }, shutter: { sc: 0.35, double: 0.30, triple: 0.30 }, interior: { sc: 0.65, double: 0.70, triple: 0.65 } }, unit: "F_C", status: "standard", src: DIN + ", Table 7, rows 3.2.1, 3.1.1, 2.1", text: "Shading factors F_C: exterior venetian blind at 45° 0.25 (0.30 with solar control glass); roller shutter three quarters closed 0.30 (0.35); interior white blind 0.70 double, 0.65 triple and solar control" },
    "din.fc.scGlass": { v: 0.4, unit: "g", status: "standard", src: DIN + ", Table 7", text: "Solar control glass column of Table 7: g of 0.40 or less" },

    // ---------------------------------------------------------------- design runs (comfort, energy): controls of this app
    "run.gains": { v: "DIN 4108-2", status: "decision", src: "Decision of 11 November 2026", text: "Comfort runs use the gains and schedules of DIN 4108-2. Energy runs use the same until the DIN V 18599-10 profiles are added" },
    "run.day.levels": { v: [0, 3], unit: "1/h", status: "standard", src: DIN + ", 8.4.2 h", text: "Day window ventilation levels: none or 3 1/h" },
    "run.night.levels": { v: [0, 2, 5], unit: "1/h", status: "standard", src: DIN + ", 8.4.2 i", text: "Night ventilation levels: none, 2 1/h (windows open at night), 5 1/h (across storeys or by a system; off by default)" },
    "run.day.tAir": { v: 23, unit: "°C", status: "standard", src: DIN + ", 8.4.2 h", text: "Windows open by day when the room air is above 23 °C" },
    "run.day.margin": { v: 1, unit: "K", status: "decision", src: "Decision of 12 November 2026", text: "and the outdoor air is at least 1 K cooler than the room air" },
    "run.day.tOutMin": { v: 12, unit: "°C", status: "decision", src: "Spec of 23 October 2026", text: "and the outdoor air is at least 12 °C (draught)" },
    "run.night.margin": { v: 2, unit: "K", status: "decision", src: "Spec of 23 October 2026", text: "Windows open at night when the room air is above the heating setpoint and at least 2 K warmer than outside" },
    "run.night.arm": { v: 24, unit: "°C operative", status: "decision", src: "Decision of 12 November 2026", text: "Night ventilation runs only after a warm day: when the operative temperature in the last presence period exceeded 24 °C" },
    "run.vent.floor": { v: 2, unit: "K above the heating setpoint", status: "decision", src: "Decision of 12 November 2026, after tests in three climates", text: "Window air flow is reduced in the hour so that the operative temperature does not fall below the heating setpoint plus 2 K (23 °C non-residential, 22 °C residential); windows never open while heating runs" },
    "run.blind.warm": { v: 23, unit: "°C", status: "decision", src: "Decision of 24 October 2026", text: "In the design runs blinds come down by the DIN 4108-2 irradiance thresholds only when the room air is above 23 °C, so that winter sun is kept" },
    "run.fan.power": { v: 1.5, unit: "W/m² of floor", status: "assumption", src: "DC ceiling fans at about 0.9 m/s (v12)", text: "Ceiling fan power while running" },
    "run.fan.start": { v: 25, unit: "°C operative", status: "decision", src: "v11", text: "Fans run in occupied hours when the operative temperature of the previous hour was 25 °C or more" },
    "run.fan.credit": { v: 1.8, unit: "K", status: "secondary", src: "EN 16798-1 air speed allowance at 0.9 m/s, as used since v11", text: "Fans raise the upper comfort limit by 1.8 K, in the hours in which they run" },
    "run.peak": { v: 0.99, unit: "percentile of occupied cooling hours", status: "decision", src: "Decision of 12 November 2026", text: "Cooling peaks are the 99th percentile of the occupied hours with cooling, so a Monday restart after a hot weekend does not set the size" },

    // ---------------------------------------------------------------- comfort bands
    "na.band": { v: { below: 16, above: 32, low: 22, high: 26, slope: 0.25, tol: { I: 1, II: 2, III: 3 } }, unit: "°C", status: "secondary", src: "DIN EN 16798-1/NA, figure NA.2 caption (hourly mean outdoor air temperature); formula and tolerances from tab 11/2022 and DGUV IFA report 2013, chapter 9", text: "German annex: comfort temperature 22 °C up to 16 °C hourly mean outdoor temperature, then 18 + 0.25 θe, 26 °C from 32 °C; band ±1, ±2, ±3 K for categories I, II, III" },
    "en.band": { v: { a: 0.33, b: 18.8, up: { I: 2, II: 3, III: 4 }, dn: { I: 3, II: 4, III: 5 }, alpha: 0.8 }, unit: "°C", status: "secondary", src: "EN 16798-1:2019, adaptive model, as in pythermalcomfort", text: "EN 16798-1 adaptive: θc = 0.33 θrm + 18.8 on the exponentially weighted running mean (α 0.8)" },
    "ash.band": { v: { a: 0.31, b: 17.8, half: { 80: 3.5, 90: 2.5 }, days: 7 }, unit: "°C", status: "secondary", src: "ASHRAE 55-2020, adaptive model, as in pythermalcomfort", text: "ASHRAE 55 adaptive: t_cmf = 0.31 t_pma + 17.8 on the mean of the previous 7 days" },
    "comfort.maxOut": { v: 5, unit: "% of occupied hours", status: "assumption", src: "Informative figure of EN 15251", text: "Share of occupied hours above the band that is accepted without cooling" },

    // ---------------------------------------------------------------- weather import
    "wx.maxGap": { v: 0.02, unit: "share of hours", status: "decision", src: "Decision of 12 November 2026", text: "A weather file with more than 2 % of hours missing in air temperature, dew point or radiation is refused; shorter gaps are filled by linear interpolation in time and listed" },
  };
  const val = (k) => { if (!(k in REG)) throw new Error("Register has no entry " + k); return REG[k].v; };
  const api = { REG, val };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Register = api;
})(typeof window !== "undefined" ? window : globalThis);
