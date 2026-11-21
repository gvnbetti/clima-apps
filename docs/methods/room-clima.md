# Room Clima: method

## What it is for
Exploring and comparing room and facade designs at concept stage.

The user defines a room type (dwelling, office or classroom), its dimensions, orientation and position in the building
(single facade, corner or corner beneath the roof), and the design options to compare.

These include window size, glazing, fixed shading, blinds, thermal mass, insulation, natural ventilation, ceiling fans
and, where needed, a chilled ceiling.

For each combination, Room Clima calculates overheating, delivered energy, daylight and whole-life carbon. It evaluates
the results against fixed performance targets, ranks the designs and tests the most promising options under future
warming and less favourable operating conditions.

The result is a shortlist of facade and room configurations that meet the requirements, together with an explanation
of why they perform as they do.

**A transparent register of assumptions.** Every constant used by the app is defined in one place,
`room/src/register.js`, with its unit, source and status. Each entry is classified as one of four types:

- **Standard:** taken directly from the text of the named standard.
- **Secondary:** taken from a secondary source, pending replacement with the original standard text.
- **Decision:** a documented modelling choice made specifically for this app, with its date.
- **Assumption:** a typical value without a binding source.

The complete register is available under "Method and limits" in the app. This page explains how the different
calculation modules work together.

## Thermal model
The thermal engine calculates the room's hourly heat balance, taking account of solar gains, internal loads, heat
transfer through the building elements, ventilation and heating or cooling systems.

| Part | Method | Source / validation |
|---|---|---|
| Room heat balance | Hourly EN ISO 52016-1 method, with a single thermal zone and calculation nodes for each building element. | EN ISO 52016-1:2017; validation against ASHRAE Standard 140 and EnergyPlus |
| Sun position | NOAA solar calculator at the middle of each hour, from the calculation core shared with Macro and Micro Clima. Used by the thermal and the daylight model alike. | Shared core; validation/climate-reading/ |
| Solar radiation on the facade | Perez 1990 transposition model, with ground albedo of 0.2. | Shared core with Macro Clima; validation/climate-reading/ |
| Shading | Hourly calculation of the sunlit fraction of the glazing, accounting for overhangs, fins, frames and window reveals. Uses the same geometry as the daylight model. | Geometric calculation; validation/thermal/room-types/ |
| Room settings | Exterior convective heat transfer based on station wind using the DOE-2 correlation; glazing transmission adjusted for angle of incidence; transmitted solar radiation distributed over opaque internal surfaces only. | Modelling decisions; validation/thermal/README.md |
| Internal gains and schedules | DIN 4108-2, clause 8.4.2: 100 Wh/m² per day for residential spaces and 144 Wh/m² per day for non-residential spaces. | DIN 4108-2:2013-02 |
| Heating and cooling | Ideal heating and cooling, with heat pump efficiencies used to calculate delivered energy. | Register: score.energy |
| Ventilation through windows | Hourly airflow calculated using the EN 16798-7 single-sided ventilation method, based on effective opening area, sash height and indoor-outdoor temperature difference. Wind is not credited because site-specific wind conditions are unknown at concept stage. The method is therefore deliberately conservative. The openable sash is assumed to be half the window area. | EN 16798-7 |
| Window ventilation control | Day ventilation opens when room air temperature exceeds 23 °C, outdoor temperature is at least 1 K lower and at least 12 °C. Night ventilation operates after a warm day, when operative temperature exceeded 24 °C during the last occupied period and the room is at least 2 K warmer than outside. Airflow is reduced to prevent the room from falling below the heating setpoint plus 2 K. | App control rules |
| Workplace ventilation checks | Office configurations are additionally checked against ASR A3.6, including single-sided room depth, opening area per person and purge ventilation openings. | ASR A3.6 |
| Blinds | Exterior and interior blinds are lowered whenever solar radiation on the window exceeds the threshold in DIN 4108-2, clause 8.4.2 j. Solar reduction factors (F_C) follow Table 7. The same operating hours are used in the daylight calculation. | DIN 4108-2, Table 7 |
| Ceiling fans and chilled ceilings | Fans operate during occupied hours above 25 °C operative temperature, increasing the upper comfort limit by 1.8 K, based on the EN 16798-1 air-speed allowance at 0.9 m/s. Chilled ceilings are sized using product performance data (EN 14240 rating), up to 75 W/m² of floor area at a 10 K temperature difference, with 16 °C water and a 1 K dew-point margin. | EN 16798-1; EN 14240; product data |

## Comfort and the German summer check
Room Clima evaluates thermal comfort using several approaches. This allows the results to be interpreted against
international comfort standards as well as the specific requirements of German building regulations.

| Model | Comfort band | Status |
|---|---|---|
| EN 16798-1 adaptive | t = 0.33 t<sub>rm</sub> + 18.8, categories I to III, using an exponential running mean with alpha 0.8. | Secondary |
| ASHRAE 55 adaptive | t = 0.31 t<sub>pma</sub> + 17.8, with 80% and 90% acceptability, using a seven-day prevailing mean. | Secondary |
| DIN EN 16798-1/NA (Germany) | 22 to 26 °C, with a slope of 0.25 between outdoor temperatures of 16 and 32 °C and category-dependent tolerance. | Secondary |
| Cooled rooms | Fixed upper comfort limits based on EN 16798-1 design values, with ASHRAE 55 limits following an app-specific modelling decision. | Secondary and assumption |

Overheating is measured as degree-hours above the applicable comfort band during occupied hours. Up to 5% of occupied
hours above the band is accepted without cooling, following the informative guidance in EN 15251.

For Germany, Room Clima also performs the summer overheating assessment according to DIN 4108-2. This calculation uses
the standard's prescribed conditions, including schedules, internal gains, air change rates, blind operation,
reference temperatures for summer climate regions A, B and C, and the applicable limits of 1,200 or 500 K·h/a.

When the assessment uses a weather file other than the official test reference year for the relevant region, the
result is an estimate rather than a formal compliance assessment. The app identifies this distinction explicitly.

The text of DIN 4108-2 is not included in this repository.

## Daylight
Room Clima calculates climate-based daylight in the room directly in the browser. The implementation is in the first
part of `room/src/core.js`.

The method combines a radiosity solution for the six room surfaces with hourly sky conditions, direct solar radiation
and glazing properties.

**Sky and daylight coefficients.** Daylight coefficients are calculated using a radiosity solution of the six room
surfaces. The sky and ground are represented by Reinhart sky patches (MF:2), following the approach used by Radiance.

**Sky conditions.** The sky is recalculated for each hour using the Perez all-weather sky model and Perez 1990 luminous
efficacy. The implementation reproduces the approach of Radiance's gendaymtx; the sun position comes from the shared
calculation core, as in the thermal model.

**Direct sunlight.** Direct solar radiation is calculated using an exact ray test from each sensor point through the
glazing. Glazing transmission follows the Radiance glass model.

**Blinds.** Venetian blinds are represented as a two-part optical layer, following a modelling decision dated
20 November 2026. A small proportion of light passes directly through, while the remainder is scattered evenly.

- Exterior blinds: total transmission 0.10, of which 0.01 passes directly through.
- Interior blinds: total transmission 0.25, of which 0.03 passes directly through, with a reflectance of 0.6.

The angular behaviour of individual slats is not modelled.

**Useful daylight.** Useful daylight is expressed as the share of floor area and occupied hours within the following
illuminance ranges:

- Non-residential: 300 to 3,000 lx.
- Residential: 100 to 2,000 lx.

The corresponding EN 17037 daylight levels are also reported.

**Electric lighting.** Where daylight falls below the target illuminance, supplementary LED lighting is estimated at
6 W/m², providing 500 lx in offices and 300 lx in classrooms.

**Validation.** The daylight calculation has been checked against Radiance using six room configurations, six climates
and three blind conditions. Results are documented in [validation/daylight/](../../validation/daylight/).

## Scores, recommendations and search
Room Clima evaluates design alternatives against fixed performance targets. Scores are measured against these targets,
never relative to the best or worst option in a particular run.

**Performance scores.**

- Daylight: based on the share of useful daylight within the specified illuminance range.
- Comfort: scores 1 when there is no overheating and 0.5 at the overheating limit.
- Energy: scores 1 at or below the target and 0.5 at the performance limit.

**Recommendation.** Among designs that meet every target, Room Clima recommends the option with the highest overall
score. Where scores differ by no more than 0.01, the design with lower whole-life carbon takes priority.

If no design meets all targets, the app identifies the closest alternative based on its largest weighted performance
shortfall.

Two requirements are treated as non-negotiable: the minimum daylight requirement and the DIN 4108-2 summer overheating
assessment cannot be traded against other performance criteria.

**Design packages.** For each facade, the app can propose up to five additional design packages. These differ from the
recommended option in at least two design measures, allowing users to explore meaningful alternatives rather than
minor variations.

**Search strategy.** The design space is searched using pruning to eliminate combinations that cannot meet the
requirements. A subsequent local search identifies the lowest-carbon design among those meeting all targets.

During development, this search strategy was compared with a full enumeration of the available options. That
benchmark is not yet included in the repository.

## Scenarios
The recommended design and its alternative packages are tested under two additional conditions.

**Future climate.** The designs are evaluated under +2 °C global warming, or +3 °C when the original run already uses
+2 °C. The weather-file adjustment follows the shared [future-climate method](climate-scenarios.md).

**Poor operation.** The app tests a less favourable pattern of occupant behaviour: blinds are lowered only every other
day, and windows remain closed at night.

**Robustness.** A design is considered robust when it continues to meet the comfort limit under these scenarios, or
remains the best-performing option within the shortlist.

## Carbon
Whole-life carbon is calculated separately from the thermal and daylight models, using the materials, quantities,
replacement cycles and operational energy associated with each design.

See the dedicated [Room Clima carbon method](room-clima-carbon.md) for the system boundaries, data sources,
calculation approach and assumptions.

## Assumptions
**A single, empty room.** The model represents one rectangular room without internal partitions or furniture. Floors,
ceilings and internal partitions are cut at their mid-plane and do not exchange heat with adjacent rooms. Neighbouring
spaces are assumed to be at the same temperature.

**Fixed occupant behaviour.** Windows, blinds, ceiling fans and night ventilation operate according to predefined
thresholds. These rules apply consistently across the simulations. The poor-operation scenario tests the sensitivity
of the results to less favourable behaviour.

**Conservative natural ventilation.** Window ventilation is driven by temperature differences only. Wind could
increase airflow, but is not included because reliable site-specific wind conditions are not available at concept
stage.

**Ideal heating and cooling.** Heating and cooling are assumed to be delivered ideally through all-electric heat pumps.
Delivered energy and associated operational carbon are calculated from the corresponding system efficiencies.

## Limits
**Thermal model accuracy.** The hourly model is calibrated and evaluated using Room Clima's own room configurations
and reference simulations. In the ASHRAE Standard 140 test box, it falls within 32 of the 44 reported ranges and
overestimates cooling by 12.7%. For Room Clima's own room configurations, hourly results agree with EnergyPlus within
0.7 K.

**Blinds.** Venetian blinds are represented as a diffusing optical layer in the daylight calculation. The
angle-dependent behaviour of individual slats is not modelled.

**German summer assessment.** The DIN 4108-2 assessment is an estimate when performed using a weather file other than
the official test reference year for the relevant climate region.

**Glare and views.** The daylight assessment does not evaluate visual glare, view quality or the relationship between
daylight and the outside view.

## Validation
The calculation modules have been checked against established simulation tools, reference methods and test cases.

| Part | Validation reference |
|---|---|
| Thermal engine | ASHRAE Standard 140 and EnergyPlus, across 14 climates. [validation/thermal/engine/](../../validation/thermal/engine/) |
| Room configurations | Comparison with EnergyPlus across 432 cases. [validation/thermal/room-types/](../../validation/thermal/room-types/) |
| Daylight and blinds | Comparison with Radiance. [validation/daylight/](../../validation/daylight/) |
| Future climate and urban heat island | Reference climate data and independent model implementations. [validation/future-climate/](../../validation/future-climate/), [validation/urban-heat-island/](../../validation/urban-heat-island/) |

These comparisons assess the implementation of the models and their agreement with established reference tools. They
do not replace validation against measured performance in occupied buildings.
