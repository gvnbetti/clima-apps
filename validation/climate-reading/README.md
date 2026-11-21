# Climate reading (Macro Clima)

**What is checked.** The calculation core of Macro Clima (`macro/core.js`):
- sun position;
- sun on walls and roofs;
- psychrometrics;
- UTCI;
- the EN 16798-1 adaptive comfort band (CEN, 2019).

Each is checked against an open reference implementation on the 13 reference weather files of `weather/`.
Future climate and urban heat island have their own folders.

**Result in short** (`verification.md`):
- **Sun position:** within 0.02° of NREL's algorithm (Reda & Andreas, 2004), in pvlib (Holmgren et al.,
  2018), apparent elevation.
- **Sun on walls and roofs:** annual totals within 0.2 % of pvlib's Perez model (Perez et al., 1990); hourly RMS up to 1.6 W/m².
- **Psychrometrics:** identical to psychrolib (Meyer & Thevenard, 2019; wet bulb within 0.0005 K).
- **UTCI:** identical to pythermalcomfort (Tartarini & Schiavon, 2020; within 2e-11 K).
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
interface) and a comparison of methods with CBE Clima (Betti et al., 2024). Its scripts are not in this repository.

## References
<!-- refs: cen16798_1 reda2004 holmgren2018 perez1990 meyer2019 tartarini2020 betti2023 -->

Betti, G., Tartarini, F., Nguyen, C., & Schiavon, S. (2024). CBE Clima Tool: A free and open-source web application for climate analysis tailored to sustainable building design. *Building Simulation, 17*(3), 493–508. https://doi.org/10.1007/s12273-023-1090-5

CEN. (2019). *EN 16798-1:2019 Energy performance of buildings: Ventilation for buildings: Part 1: Indoor environmental input parameters for design and assessment of energy performance of buildings addressing indoor air quality, thermal environment, lighting and acoustics (Module M1-6)*. European Committee for Standardization.

Holmgren, W. F., Hansen, C. W., & Mikofski, M. A. (2018). pvlib python: A python package for modeling solar energy systems. *Journal of Open Source Software, 3*(29), 884. https://doi.org/10.21105/joss.00884

Meyer, D., & Thevenard, D. (2019). PsychroLib: A library of psychrometric functions to calculate thermodynamic properties of air. *Journal of Open Source Software, 4*(33), 1137. https://doi.org/10.21105/joss.01137

Perez, R., Ineichen, P., Seals, R., Michalsky, J., & Stewart, R. (1990). Modeling daylight availability and irradiance components from direct and global irradiance. *Solar Energy, 44*(5), 271–289. https://doi.org/10.1016/0038-092X(90)90055-H

Reda, I., & Andreas, A. (2004). Solar position algorithm for solar radiation applications. *Solar Energy, 76*(5), 577–589. https://doi.org/10.1016/j.solener.2003.12.003

Tartarini, F., & Schiavon, S. (2020). pythermalcomfort: A Python package for thermal comfort research. *SoftwareX, 12*, 100578. https://doi.org/10.1016/j.softx.2020.100578
