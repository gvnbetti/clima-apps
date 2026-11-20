# Climate reading (Macro Clima)

**What is checked.** The calculation core of Macro Clima (`macro/core.js`):
- sun position;
- sun on walls and roofs;
- psychrometrics;
- UTCI;
- the EN 16798-1 adaptive comfort band.

Each is checked against an open reference implementation on the 13 reference weather files of `weather/`.
Future climate and urban heat island have their own folders.

**Result in short** (`verification.md`):
- **Sun position:** within 0.02° of NREL's algorithm (pvlib, apparent elevation).
- **Sun on walls and roofs:** annual totals within 0.2 % of pvlib's Perez model; hourly RMS up to 1.6 W/m².
- **Psychrometrics:** identical to psychrolib (wet bulb within 0.0005 K).
- **UTCI:** identical to pythermalcomfort (within 2e-11 K).
- **Adaptive band:** identical to pythermalcomfort for the same running mean.

| Part | Reference | Base cases |
|---|---|---|
| Sun position | pvlib 0.16.1, NREL SPA, apparent elevation (with refraction, as the app) | 13 files, all hours, at mid-hour |
| Sun on surfaces | pvlib Perez 1990, the app's sun, albedo 0.2 | 4 walls and the roof × 13 files |
| Psychrometrics | psychrolib (SI) | 2,000 random states, −30 to 45 °C, 800 to 1,050 hPa |
| UTCI | pythermalcomfort 4.8.1 | 2,000 random conditions inside the polynomial's range |
| Adaptive comfort | pythermalcomfort `adaptive_en` and an independent exponential running mean | 13 files, every day |

**Method choices made visible by the checks.**
- **Running mean outdoor temperature.** The app uses the exponential running mean of EN 16798-1, run twice over the
  typical year so that 1 January follows 31 December. pythermalcomfort uses the standard's 7-day approximation. The two
  forms differ by up to 3.7 K on single days; both are allowed by the standard.
- **Lower comfort limit.** It applies from a running mean of 15 °C. Below that, the app holds it at its 15 °C value.

## How to rerun
```
python3 weather/fetch.py
cd climate-reading && node dump.js && python3 verify.py      # pip install pvlib pythermalcomfort psychrolib
```

## Earlier record
`history/report_7nov2026.md` records the first verification of 7 November 2026. It covered more parts (PMV, MRT with
sky exchange, degree days, comfort bands, extremes, sky classes, driving rain, wind roses, the EPW reader, the
interface) and a comparison of methods with CBE Clima. Its scripts are not in this repository.
