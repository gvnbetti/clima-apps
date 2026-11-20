# Room Clima: method

Room Clima tests facade and room options for a single room at concept stage: window size, glazing, shading, blinds,
thermal mass, ventilation by windows, ceiling fans and, where needed, a chilled ceiling. For each design it computes
overheating, delivered energy, daylight and whole-life carbon, ranks the designs against fixed targets and reruns the
best ones in two stress scenarios.

Every constant, with its unit, its status and its source, is defined once in `room/src/register.js`. Status is one of
*standard* (taken from the text of the standard named), *secondary* (from a secondary source, to be replaced by the
standard text), *decision* (a modelling choice of this app, dated) or *assumption* (a typical value without a binding
source). The app lists the whole register under "Method and limits". This page explains how the parts fit together.

## Thermal model

| Part | Method | Source | Checked in |
|---|---|---|---|
| Room heat balance | EN ISO 52016-1 hourly method, one zone, nodes in each element | EN ISO 52016-1:2017 | `validation/thermal/engine/` (Standard 140, EnergyPlus) |
| Sun on the facade | Perez 1990, ground albedo 0.2 | shared with Macro Clima | `validation/climate-reading/` |
| Shading by overhangs, fins, frames and reveals | sunlit share of the glass each hour, same geometry as the daylight model | geometry | `validation/thermal/room-types/` |
| Room settings | exterior convection from the station's wind (DOE-2 correlation); glazing transmission by angle of incidence; transmitted sun spread over the opaque inner surfaces only | decisions, see `validation/thermal/README.md` | Standard 140 rerun with these settings |
| Internal gains, schedules | DIN 4108-2, clause 8.4.2 (residential 100, non-residential 144 Wh/m² d) | DIN 4108-2:2013-02 | |
| Heating and cooling | ideal; heat pump efficiencies for delivered energy | register `score.energy` | |

**Ventilation by windows.** Air flow each hour by the EN 16798-7 single-sided method, from the effective opening, the
sash height and the indoor-outdoor temperature difference. Wind is not credited, because site wind is not known at
concept stage; the method underestimates on purpose. The openable sash is half the window area. Day ventilation opens
when the room air is above 23 °C, the outdoor air at least 1 K cooler and at least 12 °C. Night ventilation runs after
a warm day (operative above 24 °C in the last presence period), when the room is at least 2 K warmer than outside.
The flow is reduced so that the room does not fall below the heating setpoint plus 2 K. Workplaces are also checked
against ASR A3.6 (depth of single-sided rooms, opening per person, purge opening).

**Blinds.** In every run, exterior and interior blinds come down when the sun on the window exceeds the DIN 4108-2
threshold (8.4.2 j). Their solar factor F_C is from DIN 4108-2 Table 7. The same hours are used for daylight.

**Fans and chilled ceiling.** Fans run in occupied hours from 25 °C operative and raise the upper comfort limit by
1.8 K (EN 16798-1 air speed allowance at 0.9 m/s). A chilled ceiling is sized from product data (EN 14240 rating,
up to 75 W/m² of floor at 10 K) with water at 16 °C and a dew point margin of 1 K.

## Comfort and the German summer check

| Model | Band | Status |
|---|---|---|
| EN 16798-1 adaptive | t = 0.33 t_rm + 18.8, categories I to III; exponential running mean, alpha 0.8 | secondary |
| ASHRAE 55 adaptive | t = 0.31 t_pma + 17.8, 80 % and 90 % acceptability; 7-day prevailing mean | secondary |
| DIN EN 16798-1/NA (Germany) | 22 to 26 °C, slope 0.25 between 16 and 32 °C outdoor, tolerance by category | secondary |
| Cooled rooms | fixed upper limits (EN 16798-1 design values; ASHRAE 55 by decision) | secondary and assumption |

Overheating is counted as degree-hours above the band in occupied hours; up to 5 % of occupied hours above the band
is accepted without cooling (informative figure of EN 15251). In Germany, the DIN 4108-2 summer check runs with the
standard's own conditions (schedules, gains, air change, blinds, reference temperature by summer region A, B, C, and
limits of 1,200 or 500 K·h/a). On any weather file other than the test reference year of the region, the result is
an estimate, and the app says so. The text of DIN 4108-2 is not part of this repository.

## Daylight

Climate-based daylight for the box room, in the browser (`room/src/core.js`, first part):
- Daylight coefficients from a radiosity solution of the six room surfaces. Sky and ground in Reinhart patches (MF:2),
  as Radiance.
- Sky each hour by the Perez all-weather model with Perez 1990 luminous efficacy, replicated from Radiance gendaymtx.
- Direct sun by an exact ray test from each sensor through the glazing. Glazing by the Radiance glass model.
- Blinds as a two-part layer (decision of 20 November 2026): a small share of the light passes straight through,
  the rest is scattered evenly. Exterior blind 0.10 in all, 0.01 of it straight; interior blind 0.25, 0.03 straight,
  reflectance 0.6. The angle dependence of slats is not modelled.
- Useful daylight: share of floor and hours between 300 and 3,000 lx (non-residential) or 100 and 2,000 lx
  (residential). EN 17037 levels are also reported.
- Electric lighting: 6 W/m² LED to reach 500 lx (office) or 300 lx (classroom) where daylight falls short.

Checked against Radiance on 6 rooms × 6 climates × 3 blind states in `validation/daylight/`.

## Scores, recommendation and search

- **Scores** are on fixed scales, never relative to the run: daylight is the useful daylight share; comfort is 1 with
  no overheating, 0.5 at the limit; energy is 1 at or below the target and 0.5 at the limit.
- **Recommendation:** among the designs that meet every target, the one with the highest score. Ties within 0.01 go to
  the design with less whole-life carbon. When none meets every target, the closest design, by its largest weighted
  shortfall. The daylight minimum and DIN 4108-2 are not traded against the rest.
- **Packages:** up to five other designs per facade that differ from the recommendation in at least two measures.
- **Search:** the option space is searched with pruning; after that, a local search for the design with the least
  whole-life carbon among those meeting every target. The search was compared with a full enumeration during
  development; that benchmark is not yet part of this repository.

## Scenarios

The recommended design and the packages are rerun:
- **Climate:** +2 °C global warming (+3 °C when the run already uses +2 °C). Morphing as in `validation/future-climate/`.
- **Poor operation:** blinds down on only every other day, windows shut at night.

A design is robust when it still meets the comfort limit, or stays the best of the shortlist.

## Carbon

See `room-clima-carbon.md`.

## Validation

| Part | Folder |
|---|---|
| Thermal engine (Standard 140, EnergyPlus, 14 climates) | `validation/thermal/engine/` |
| Room types against EnergyPlus (432 cases) | `validation/thermal/room-types/` |
| Daylight and blinds against Radiance | `validation/daylight/` |
| Future climate and urban heat island | `validation/future-climate/`, `validation/urban-heat-island/` |
