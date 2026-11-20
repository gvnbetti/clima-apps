# Macro Clima: verification of 7 November 2026 (record)

This is the record of the first verification of Macro Clima, made on 7 November 2026 on an earlier version of the code.
It covered more parts than `verify.py` in the folder above, on a different set of six weather files. The scripts were
not kept in this repository; the current check (`../verification.md`) reruns the core parts on the present code.

**Method.** The app's calculation code was run outside the browser, and its hourly results were compared with
independent tools fed the same inputs.
- Reference tools: pvlib 0.16 (sun position, Perez, airmass), psychrolib, pythermalcomfort 4.8 (UTCI, PMV, SolarCal,
  adaptive comfort), ladybug-comfort (outdoor SolarCal with sky exchange). Where no library exists, a separate
  implementation in Python (numpy, pandas).
- Files: Berlin-Dahlem TMYx 2011-2025, Bologna TMYx 2004-2018, Dubai TMYx, Sydney TMYx 2009-2023, San Francisco TMY3,
  Phoenix TMY3. Reader and interface tests also used Chicago and Miami TMY3 and EnergyPlus's leap-year sample.
- Tolerances: angles 0.05°, temperatures 0.01 K, counts exact. A check passes only if the largest difference over all
  hours stays within the tolerance.

## Calculation core

| Check | Reference | Files | Largest difference | Result |
|---|---|---|---|---|
| Solar altitude, sun above 5° | pvlib NREL SPA | 6 | 0.012° | Pass |
| Solar azimuth, sun above 5° | pvlib NREL SPA | 6 | 0.047° (0.054° in Dubai within 4° of the zenith) | Pass |
| Humidity ratio | psychrolib | 6 | below 0.00001 kg/kg | Pass |
| Wet bulb | psychrolib | 6 | 0.0005 K | Pass |
| Façade irradiance N, E, S, sun above the horizon | pvlib Perez 1990 | 6 | below 0.001 W/m² | Pass |
| UTCI, sun and wind; shade and still air | pythermalcomfort | 6 | below 0.001 K | Pass |
| PMV, 400 cases | pythermalcomfort ISO 7730 | | 0.0013 | Pass |
| SolarCal, 300 cases | pythermalcomfort solar_gain | | below 0.001 K | Pass |
| MRT in the open with sky longwave | ladybug-comfort | 3 | night 0.000 K; day 0.42 K, mean 0.03 to 0.06 K | Pass |

- Façade totals: pvlib also counts direct sun on a façade when the file records direct radiation but the sun at the
  middle of the hour is below the horizon. The app does not; annual totals change by up to 0.15 %.
- Daytime MRT: the 0.42 K comes from the projected area factor. The app interpolates the ASHRAE 55 table; Ladybug fits
  splines to the same data.

## Derived results (Berlin, Sydney, Dubai)

All matched their independent calculation: daily means, heating and cooling degree days (base 15 and 18 °C), Gradtagzahl
G 20/15 and heating days (VDI 4710), EN 16798-1 bands (categories I to III), ASHRAE 55 bands (80 and 90 %), ASHRAE
prevailing mean, summer, hot, tropical, frost and ice days, heat and cold spells, hottest and coldest week, Perez sky
classes, hours above 10, 20 and 50 klx, driving rain index (ISO 15927-3), wind rose, natural ventilation hours,
percentiles. Largest differences 0.000002 Kd, 0.000001 K, 0 hours, 0 days.

- EN running mean: the app uses the exponential series of EN 16798-1 (alpha 0.8). The 7-day approximation of
  pythermalcomfort differs by 0.27 to 0.63 K on average and 2.1 K at most on those files. Both are allowed.
- German national annex band: no independent library implements it; not checked.

## Differences from CBE Clima v0.10.2 (method reproduced from its source)

| Topic | CBE Clima | Macro Clima |
|---|---|---|
| Sun position | end of each EPW hour | middle of the hour |
| Solar part of MRT | diffuse taken as 0.2 × DNI | measured diffuse and reflected |
| MRT in the sun | ground reflectance 0.6, no sky exchange | file albedo, sky longwave included |
| Degree days | hourly differences ÷ 24 | daily means (VDI 4710, EN ISO 15927-6) |
| Default heating base | 10 °C | 15 °C (G 20/15 for German stations) |
| Seasons | December in winter and autumn; northern names everywhere | DJF, MAM, JJA, SON; swapped south of the equator |

## EPW reader and interface

Leap-year files, two records per hour, missing-value codes, Windows line endings and OneBuilding ZIP files were read
correctly; files without a LOCATION line, truncated files, short rows, impossible latitudes and plain CSV files were
refused with a message naming the problem. Chart export (SVG, PNG, CSV), dark mode and a 390 px phone width worked.

## Open items at the time
- Givoni-Milne zones: compare with Climate Consultant 6. The values in the app are a reconstruction.
- German national annex band: confirm the formula against DIN EN 16798-1/NA:2021.
