# Thermal model

**What is checked.** The hourly room model of Room Clima: EN ISO 52016-1 (ISO, 2017; hourly method) with three changes, written in
JavaScript (`room/src/core.js`, `Iso52016`). The reference is EnergyPlus 24.2 (Crawley et al., 2001). EnergyPlus itself is first
checked against ASHRAE Standard 140 (ASHRAE, 2020a).

**Result in short.**
- EnergyPlus 24.2 falls within 43 of 44 Standard 140 ranges, so it can serve as the reference.
- In Room Clima's own rooms, the app follows EnergyPlus within 0.69 K hourly (RMSE). It runs about 0.5 K cooler, so it
  counts 8 % fewer degree-hours above 26 °C. It ranks the designs of each group in the same order: rank correlation
  0.98; same least-overheating design in 68 of 72 groups.
- In the Standard 140 box, which Room Clima does not use, its settings run warm. Cooling is 13 % above the reference
  programmes, and overheating 14 % above EnergyPlus over 14 climates.

The three changes to EN ISO 52016-1, used by Room Clima (`Sweep.simulate`):
1. Exterior convection from wind (DOE-2 correlation, as EnergyPlus; U.S. Department of Energy, 2024), with the weather station's wind speed; the window
   core resistance is taken from the rated U-value with EN 673 surface films (CEN, 2011).
2. Glazing transmission by angle of incidence instead of a constant factor.
3. Transmitted sun is spread over the opaque inner surfaces only, not over the glass (`solOnWindows: false`).
Blinds enter as the DIN 4108-2 (DIN, 2013) reduction factor F_C on the solar gain of the glazing, with the closed blind's added
thermal resistance.

## Study 1: Standard 140 and the engine in 14 climates (`engine/`)

**Base cases.** The ASHRAE Standard 140-2020 building envelope cases as implemented in the LBL Modelica Buildings
library (Wetter et al., 2014; BESTEST package 11.1.0, Lawrence Berkeley National Laboratory, 2024; Standard 140-2020
with Addendum b, ASHRAE, 2023): a single zone 8 × 6 × 2.7 m with 12 m² of
glazing, light (600 series) and heavy (900 series), with set points, night ventilation, setback, overhangs and
free-floating variants.

| Case | Glazing | Mass | Control |
|---|---|---|---|
| 600, 900 | 12 m² south | light, heavy | heating below 20 °C, cooling above 27 °C |
| 610, 910 | as 600, 900, with a 1 m overhang | light, heavy | as 600 |
| 620, 920 | 6 m² east and 6 m² west | light, heavy | as 600 |
| 640, 940 | 12 m² south | light, heavy | setback to 10 °C from 23:00 to 07:00 |
| 650, 950 | 12 m² south | light, heavy | no heating; cooling 07:00 to 18:00; night ventilation 1,700 m³/h |
| 600FF, 650FF, 900FF, 950FF | as above | | free-floating |

Common to all cases: internal gains 200 W (60 % radiant); infiltration 0.5 air changes per hour; walls and roof with
solar absorptance 0.6 and emissivity 0.9; floor raised above the ground, with no sun on it; ground reflectance 0.2.
Glazing is two panes of 3 mm clear glass with 12 mm of air. In the app engine this is entered as the U-value 2.74 W/m²K
and SHGC 0.760 that EnergyPlus computes for this glazing, a check `ep_run.py` repeats.

**Reference.** Annual loads are judged against the acceptance ranges of Addendum b. Peak loads and free-floating
temperatures are judged against the range of the six reference programmes (BSIMAC, CSE, DeST, EnergyPlus, ESP-r,
TRNSYS), as given in the Modelica library. The test runs in Denver, TMY3 (Wilcox & Marion, 2008), the climate the standard is defined for.
Beyond Denver, EnergyPlus is the reference in 14 climates (Köppen A to D, 11° to 62° N; `engine/climates.py`), on
cases 600, 620, 650, 900, 920, 950, 600FF and 900FF.

**Results** (`engine/results.md`):

| Model | Within range, of 44 | Heating | Cooling | Peak heating | Peak cooling |
|---|---|---|---|---|---|
| EnergyPlus 24.2 | 43 | 2.6 % | 2.6 % | 1.0 % | 4.4 % |
| App engine, EN ISO 52016-1 as written | 33 | 14.6 % (+14.6) | 8.0 % (+6.4) | 11.0 % | 6.3 % |
| App engine, settings of Room Clima | 32 | 4.8 % (+4.8) | 12.7 % (+12.7) | 10.6 % | 6.9 % |

The deviations are mean absolute deviations from the median of the six programmes; the signed mean is in brackets. In
14 climates, against EnergyPlus, Room Clima's settings give these results:
- heating 4.9 % (+4.6) against 9.3 % for the standard as written;
- cooling 11.8 % (+11.4) against 7.5 %;
- overheating degree-hours 13.9 % (+13.9) against 9.4 %;
- hourly free-floating temperature 1.34 K against 1.39 K RMSE.

**What this means.** The wind-driven convection removes most of the heating bias of the standard as written. That bias
comes from using the rated window U-value at all hours. In this box, Room Clima's settings overestimate cooling and
overheating. The main cause is `solOnWindows: false`. It was chosen against EnergyPlus for Room Clima's rooms (deep
reveal, frame, one or two windows on one side), where it helps. The box of Standard 140 has large, flush windows,
through which EnergyPlus loses part of the transmitted sun back out. The settings are therefore calibrated to the rooms
the app models, and the next study tests them there. The peak heating loads of the simplified model sit 1 to 16 %
above the reference range. Room Clima does not report peak loads.

## Study 2: Room Clima's rooms, as the app runs them (`room-types/`)

**Base cases.** 432 rooms, run free-running and heated:

| Item | Values |
|---|---|
| Climates | the six bundled weather files: Mannheim (TMYx 2007-2021), Bologna, San Francisco, Phoenix, Dubai, Ho Chi Minh City |
| Use | office (4.05 × 5 × 3 m, weekdays 07:00 to 18:00, 21 °C heating); dwelling (4 × 5 × 2.6 m, all hours, 20 °C heating) |
| Room | cellular (one facade); corner (two facades); corner on the top floor (two facades and a roof) |
| Facade | south and west |
| Designs | six per group, drawn by `Sweep.designs(6, 16)` to cover every option level, listed below |

| Design | Window share | Wall U | Glazing U / g | Mass | Fixed shading | Blind | Day airing | Night airing | Roof |
|---|---|---|---|---|---|---|---|---|---|
| 0 | 0.20 | 0.24 | 1.3 / 0.60 | medium | frame 0.5 m | interior | none | none | standard |
| 1 | 0.50 | 0.10 | 0.8 / 0.45 | light | none | exterior | side-hung | tilt | cool |
| 2 | 0.20 | 0.10 | 1.3 / 0.45 | medium | overhang 0.5 m | none | none | none | cool |
| 3 | 0.80 | 0.15 | 0.8 / 0.30 | light | fins 0.5 m | none | tilt | across storeys | standard |
| 4 | 0.65 | 0.15 | 0.8 / 0.60 | heavy | none | exterior | tilt | tilt | standard |
| 5 | 0.35 | 0.24 | 1.3 / 0.30 | very heavy | overhang 1.0 m | interior | side-hung | across storeys | cool |

**How EnergyPlus sees the same room.** Constructions, windows, frame, wall reveal and outdoor shading are those of the
app. The app's own hourly operation is imposed on EnergyPlus:
- the air change of the window openings (EN 16798-7, single-sided, wind off; CEN, 2017) plus base air;
- the blind state of each window (switchable glazing: SHGC g × F_C, and U with the blind's added resistance);
- the internal gains, 100 % convective as in DIN 4108-2.

The comparison therefore isolates the room physics. The airflow model of the openings is not compared. Interior
surfaces facing other rooms are adiabatic, modelled in EnergyPlus as mirrored constructions. Ceilings split into an
exposed part and a part under a suspended ceiling are modelled as two strips.

**Results** (`room-types/results.md`):
- **Hourly temperature, free-running:** RMSE 0.69 K, mean bias −0.49 K, annual maximum −0.94 K. The app is cooler.
- **Occupied degree-hours above 26 °C:** −8 % overall. In mild climates, where the totals are small, the difference is
  larger in relative terms: Mannheim −23 % and San Francisco −53 %. Elsewhere it is −7 to −14 %.
- **Heating need:** +7 % overall. Phoenix shows +26 %, of 1.8 kWh/m² a year.
- **Ranking within each group of six designs:** overheating rank correlation 0.982 on average (lowest 0.829), with the
  same least-overheating design in 68 of 72 groups. Heating rank correlation 0.978, with the same lowest-heating design
  in 69 of 72 groups.
- **Largest differences:** Bologna dwellings with medium mass and closed windows (RMSE up to 1.47 K, bias about −1 K).

**What this means.** The app ranks designs as EnergyPlus does, which is what its recommendations rest on. Absolute
overheating is somewhat optimistic, by about 0.5 K. This matters most for the DIN 4108-2 check in mild climates, where
the limit is reached by few degree-hours. The bias is known and stated in the app.

## Limits
- Model against model: no measured room. Outside Denver the reference is one programme, EnergyPlus.
- One zone. Neighbouring rooms are at the same temperature (adiabatic). No ground contact.
- The airflow through open windows (EN 16798-7) is not compared here. The same air change is given to both models.
- The DIN 4108-2 check in the app uses the bundled weather. A formal proof uses the DWD test reference year (Bundesinstitut für Bau-,
  Stadt- und Raumforschung, 2017).

## How to rerun
```
python3 weather/fetch.py && node weather/app_epw.js
cd thermal/engine && python3 cases.py && EPLUS=/path/to/energyplus python3 ep_run.py && node js_run.js && python3 analyse.py
cd ../room-types && node dump.js && EPLUS=/path/to/energyplus python3 ep_run.py && python3 analyse.py
```
EnergyPlus 24.2.0 (build 94a887817b); Node 22; Python 3.13 with numpy, pandas, scipy. The room-type runs take about
90 minutes on two cores.

`room-types/history/` keeps the run of 19 November 2026 (three climates, the earlier Mannheim weather file) for
comparison.

## References
<!-- refs: iso52016 crawley2001 ashrae140 usdoe2024 cen673 din4108 wetter2014 modelica_bestest ashrae140b wilcox2008 cen16798_7 bbsr2017 -->

ASHRAE. (2020a). *ANSI/ASHRAE Standard 140-2020: Method of test for evaluating building performance simulation software*. American Society of Heating, Refrigerating and Air-Conditioning Engineers.

ASHRAE. (2023). *Addendum b to ANSI/ASHRAE Standard 140-2020* [Software acceptance criteria]. American Society of Heating, Refrigerating and Air-Conditioning Engineers.

Bundesinstitut für Bau-, Stadt- und Raumforschung. (2017). *Ortsgenaue Testreferenzjahre von Deutschland für mittlere, extreme und zukünftige Witterungsverhältnisse*. BBSR; Deutscher Wetterdienst.

CEN. (2011). *EN 673:2011 Glass in building: Determination of thermal transmittance (U value): Calculation method*. European Committee for Standardization.

CEN. (2017). *EN 16798-7:2017 Energy performance of buildings: Ventilation for buildings: Part 7: Calculation methods for the determination of air flow rates in buildings including infiltration (Module M5-5)*. European Committee for Standardization.

Crawley, D. B., Lawrie, L. K., Winkelmann, F. C., Buhl, W. F., Huang, Y. J., Pedersen, C. O., Strand, R. K., Liesen, R. J., Fisher, D. E., Witte, M. J., & Glazer, J. (2001). EnergyPlus: Creating a new-generation building energy simulation program. *Energy and Buildings, 33*(4), 319–331. https://doi.org/10.1016/S0378-7788(00)00114-6

DIN. (2013). *DIN 4108-2:2013-02 Wärmeschutz und Energie-Einsparung in Gebäuden: Teil 2: Mindestanforderungen an den Wärmeschutz*. Beuth.

ISO. (2017). *ISO 52016-1:2017 Energy performance of buildings: Energy needs for heating and cooling, internal temperatures and sensible and latent heat loads: Part 1: Calculation procedures*. International Organization for Standardization.

Lawrence Berkeley National Laboratory. (2024). *Modelica Buildings library, package Buildings.ThermalZones.Detailed.Validation.BESTEST* (Version 11.1.0) [Computer software]. https://simulationresearch.lbl.gov/modelica

U.S. Department of Energy. (2024). *EnergyPlus version 24.2 documentation: Engineering reference; Auxiliary programs*. https://energyplus.net/documentation

Wetter, M., Zuo, W., Nouidui, T. S., & Pang, X. (2014). Modelica Buildings library. *Journal of Building Performance Simulation, 7*(4), 253–270. https://doi.org/10.1080/19401493.2013.765506

Wilcox, S., & Marion, W. (2008). *Users manual for TMY3 data sets* (NREL/TP-581-43156). National Renewable Energy Laboratory.
