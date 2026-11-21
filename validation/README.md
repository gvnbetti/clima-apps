# Validation of the Clima Toolbox tools

Every model in the apps is checked against an established tool, an open reference implementation, a published test or
an exact solution. Each folder holds a report (`README.md`) with the base cases, the assumptions, the reference and the
results; the scripts that produce them; and the result files they write. Every study can be rerun from this folder.

| Model | Used by | Reference | Result | Folder |
|---|---|---|---|---|
| Hourly room model (EN ISO 52016-1 with three changes) | Room Clima | ASHRAE Standard 140-2020; EnergyPlus 24.2 in 14 climates | Standard 140: 32 of 44 within range (EnergyPlus 43); heating 4.8 %, cooling 12.7 % from the reference median | `thermal/` |
| Room Clima's rooms with their operation | Room Clima | EnergyPlus 24.2, 432 rooms in 6 climates | hourly RMSE 0.69 K, bias −0.49 K; overheating −8 %; same ranking (0.98), same best design in 68 of 72 groups | `thermal/` |
| Daylight with and without blinds | Room Clima | Radiance, 6 rooms × 6 climates | useful daylight within 2.9 points in all 108 cases; mean +1.0 (no blind), +0.3 (interior), −0.9 (exterior) | `daylight/` |
| Climate reading: sun, surfaces, psychrometrics, UTCI, adaptive comfort | Macro Clima | pvlib, psychrolib, pythermalcomfort | sun within 0.02°; surfaces within 0.2 %; psychrometrics and UTCI identical | `climate-reading/` |
| Future climate | Macro, Micro, Room Clima | IPCC AR6 Atlas data; official regions; pyepwmorph (Belcher 2005) | table within 0.05 K on average; region 99.99 %; morphing equal on the annual mean, dew point within 0.01 K | `future-climate/` |
| Urban heat island | Macro, Micro, Room Clima | Theeuwes et al. 2017, independent implementation | identical within 0.0001 K; the three apps share one implementation | `urban-heat-island/` |
| Outdoor comfort | Micro Clima | pvlib, pythermalcomfort, exact solutions; Ladybug Tools | UTCI identical, SolarCal within 0.06 K; sun within 0.02°; ranking of 70 designs 0.97 against Ladybug | `outdoor-comfort/` |

## Shared calculation core
Since 21 November 2026 Macro, Micro and Room Clima compute sun position, sun on surfaces (Perez), psychrometrics,
SolarCal, sky longwave (file data, or Clark and Allen where missing), UTCI (inputs outside the polynomial's range held at
its edge), future climate and the urban heat island with the same code, `shared/climamods.js`, copied verbatim from
Macro Clima. The studies it affects (thermal, room types, daylight, climate reading, outdoor comfort, urban heat island)
were rerun on that code on 21 November 2026; the future-climate code itself did not change.

## Known limits
- Future climate: the shipped table differs from the reconstructed calculation by 0.05 K on average and up to about
  0.5 K in single months; monthly mean shifts are up to 0.18 K off after morphing; sky infrared rises by 10.4 W/m²
  where pyepwmorph gives 12.8 W/m². Corrections are under review.
- Room Clima's hourly model is tuned to its own rooms: in the Standard 140 test box it reaches 32 of 44 ranges and
  overestimates cooling by 12.7 %.
- Not yet checked independently: the Givoni-Milne strategy zones of Macro Clima, and the German national annex comfort
  band (DIN EN 16798-1/NA), for which no open reference exists.
- Daylight blinds are modelled as a diffusing layer; the angle dependence of venetian slats is not modelled.

Verification checks that the code computes the model it claims to. Validation compares the model with another
established model. Neither compares the tools with measured buildings or outdoor spaces; that is beyond the scope of
these studies.

## Software
- EnergyPlus 24.2.0 (build 94a887817b)
- Radiance 6.0a (as shipped with pyradiance 1.3.1)
- Node.js 22
- Python 3.13 with numpy, pandas, scipy, pvlib 0.16.1, pythermalcomfort 4.8.1, ladybug-comfort 0.19.18, pyepwmorph
  3.6.1, shapely 2.2

## Running
```
python3 weather/fetch.py && node weather/app_epw.js        # reference weather files
export EPLUS=/path/to/energyplus WORK=/tmp/clima-validation  # optional; WORK defaults to validation/_work
```
Then follow "How to rerun" in each folder. `lib/app.js` loads the built Room Clima engine (`room/build/worker.js`), so
build Room Clima first (`python3 room/build.py`).

## Runs
All results were produced on 20 November 2026 and, for the studies affected by the shared core, again on 21 November
2026, with the code at the commit that adds them. Earlier runs, on earlier
versions, are kept in `history/` folders where they were published.
