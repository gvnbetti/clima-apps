# Macro Clima: method

## What it is for
Understanding a climate and what it means for design.

Macro Clima takes a single weather file (EPW) and turns it into a reading of the climate: when conditions are too hot
or too cold, where the sun and wind come from, how much daylight and rain there is, and which passive design
strategies are likely to work.

It looks at the climate from several perspectives, bringing together thermal comfort, solar radiation, wind, sky
conditions, precipitation and energy potential. The same climate can also be explored under future warming scenarios
and with adjustments for the urban environment.

## How it works
All calculations are performed in `macro/core.js`, hour by hour across the typical meteorological year.

| Topic | Method | Source |
|---|---|---|
| Time | Weather values are evaluated at the middle of each hour, following the EPW convention for solar radiation. | EPW definition |
| Sun position | NOAA solar calculator, based on Meeus, using the Julian day and accounting for atmospheric refraction. Calculated at mid-hour. | NOAA |
| Solar radiation on surfaces | Perez 1990 transposition model, with ground reflectance taken from the weather file or set to 0.2 where unavailable. | Perez et al. 1990 |
| Psychrometrics | Calculation of saturation pressure, humidity ratio, wet-bulb temperature, enthalpy and dew point. | ASHRAE Handbook of Fundamentals |
| Outdoor comfort | UTCI using the operational polynomial. Mean radiant temperature is calculated with SolarCal, accounting for direct, diffuse and reflected solar radiation and longwave exchange with the sky. | Bröde et al. 2012; Arens et al. 2015 |
| Indoor comfort | Adaptive comfort following EN 16798-1, using an exponential running mean (alpha 0.8), and ASHRAE 55. PMV is also calculated where shown. | EN 16798-1; ASHRAE 55; ISO 7730 |
| Degree days | Calculated from daily mean temperatures, with a heating base of 15 °C (G 20/15 for German stations). | VDI 4710; EN ISO 15927-6 |
| Climate extremes | Summer, hot, tropical, frost and ice days, together with heat and cold spells and the hottest and coldest weeks. | DWD definitions |
| Sky and daylight | Perez sky classifications and the number of hours above 10, 20 and 50 klx. | Perez et al. 1990 |
| Rain and wind | Driving rain index by orientation and wind roses divided into 16 directional sectors. | ISO 15927-3 |
| Passive strategies | Givoni-Milne climate strategy zones, plotted on the psychrometric chart. | Givoni; Milne; Climate Consultant |
| PV potential | PVWatts v5 calculation chain, using fixed assumptions. | NREL PVWatts |
| Future and urban climate | Adjustments for global warming scenarios and urban conditions. See [Future and urban climate](climate-scenarios.md). | See dedicated method |

Seasons are grouped into December–February, March–May and so on, with the seasons reversed for locations in the
southern hemisphere.

## Assumptions
**Outdoor comfort.** The ground and surrounding surfaces are assumed to be at air temperature. Wind conditions are
taken from the weather station, typically measured at 10 m above open ground. This represents the general outdoor
climate rather than the microclimate of a particular space. Micro Clima takes the analysis further by explicitly
modelling the ground, walls, shading and wind shelter of an outdoor environment.

**Rain and snow.** Typical-year weather files often contain incomplete or unreliable precipitation records. The app
flags implausible totals so that these readings can be interpreted with care.

**Climate comparisons.** The "At a glance" comparison uses nine reference climates. These illustrate a range of
climatic conditions but do not cover every climate type, notably subarctic and equatorial climates.

## Limits
**Passive strategy zones.** The Givoni-Milne zones are a reconstruction of published criteria. Their results have not
yet been checked against Climate Consultant, which is one of the established tools using this approach.

**German adaptive comfort.** The national annex comfort band (DIN EN 16798-1/NA) follows the formula implemented in
Room Clima. There is currently no open reference implementation available for direct comparison.

## Validation
The climate calculations have been checked against established reference implementations.

Solar position agrees with pvlib's NREL SPA calculation within 0.02°. Solar radiation on walls and roofs agrees with
pvlib's Perez model within 0.2%. Psychrometric calculations, UTCI and the adaptive comfort band match the
corresponding implementations in psychrolib and pythermalcomfort.

The first verification, carried out on 7 November 2026, also covered PMV, mean radiant temperature, degree days,
climate extremes, sky classifications, rain, wind and the EPW file reader. The verification results are documented in
the [validation records](../../validation/climate-reading/).
