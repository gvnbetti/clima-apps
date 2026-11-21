# Macro Clima: method

## What it is for
Reading a climate for design. Macro Clima takes one weather file (EPW) and shows what the climate asks of a building
and its outdoor spaces: when it is too hot or too cold, where the sun and wind come from, how much daylight and rain
there is, and which passive strategies suit it. It can show the same file under future warming and in a city.

## How it works
All calculations are in `macro/core.js`, hour by hour over the typical year.

| Topic | Method | Source |
|---|---|---|
| Time | values at the middle of each hour (the EPW convention for radiation) | EPW definition |
| Sun position | NOAA solar calculator (Meeus), from the Julian day, with refraction, at mid-hour | NOAA |
| Sun on surfaces | Perez 1990 transposition, ground reflectance from the file or 0.2 | Perez et al. 1990 |
| Psychrometrics | saturation pressure, humidity ratio, wet bulb, enthalpy, dew point | ASHRAE Handbook Fundamentals |
| Outdoor comfort | UTCI (operational polynomial); mean radiant temperature with SolarCal, measured diffuse and reflected light and longwave exchange with the sky | Bröde et al. 2012; Arens et al. 2015 |
| Indoor comfort | adaptive EN 16798-1 (exponential running mean, alpha 0.8) and ASHRAE 55; PMV where shown | EN 16798-1, ASHRAE 55, ISO 7730 |
| Degree days | from daily mean temperatures, heating base 15 °C (G 20/15 for German stations) | VDI 4710, EN ISO 15927-6 |
| Extremes | summer, hot, tropical, frost and ice days; heat and cold spells; hottest and coldest week | DWD definitions |
| Sky and daylight | Perez sky classes; hours above 10, 20 and 50 klx | Perez et al. 1990 |
| Rain and wind | driving rain index by orientation; wind roses in 16 sectors | ISO 15927-3 |
| Strategy zones | Givoni-Milne zones on the psychrometric chart | Givoni; Milne; Climate Consultant |
| PV potential | PVWatts v5 chain, fixed assumptions | NREL PVWatts |
| Future and urban climate | see [Future and urban climate](climate-scenarios.md) | |

Seasons are December to February, March to May and so on, swapped south of the equator.

## Assumptions
- Outdoor comfort treats the ground and surroundings as being at air temperature, and uses the station's wind at
  10 m above open ground. Micro Clima models the ground, walls and shelter of a real outdoor space.
- Typical-year files often carry incomplete rain and snow records. The readings flag implausible totals.
- The "at a glance" comparison uses nine reference climates; none is subarctic or equatorial.

## Limits
- The Givoni-Milne strategy zones are a reconstruction of published criteria and have not yet been checked against
  Climate Consultant.
- The German national annex comfort band (DIN EN 16798-1/NA) follows the formula of Room Clima; no open reference
  implementation exists to check it against.

## Validation
[Climate reading](../../validation/climate-reading/): sun within 0.02° of pvlib's NREL SPA, sun on walls and roofs
within 0.2 % of pvlib's Perez model, psychrometrics, UTCI and the adaptive band identical to psychrolib and
pythermalcomfort. The first verification of 7 November 2026, which also covered PMV, MRT, degree days, extremes, sky
classes, rain, wind and the file reader, is recorded there.
