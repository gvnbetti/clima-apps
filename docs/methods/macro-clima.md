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
All calculations are performed in `macro/core.js`, hour by hour across the typical meteorological year. Sun
position, solar radiation on surfaces, psychrometrics, SolarCal, UTCI and the future and urban climate are copied from
there into the calculation core shared with Micro and Room Clima (`shared/climamods.js`).

| Topic | Method | Source |
|---|---|---|
| Time | Weather values are evaluated at the middle of each hour, following the EPW convention for solar radiation. | U.S. Department of Energy (2024) |
| Sun position | NOAA solar calculator, based on Meeus, using the Julian day and accounting for atmospheric refraction. Calculated at mid-hour. | NOAA Global Monitoring Laboratory (n.d.); Meeus (1998) |
| Solar radiation on surfaces | Perez 1990 transposition model, with ground reflectance taken from the weather file or set to 0.2 where unavailable. | Perez et al. (1990) |
| Psychrometrics | Calculation of saturation pressure, humidity ratio, wet-bulb temperature, enthalpy and dew point. | ASHRAE (2021); Hyland & Wexler (1983) |
| Outdoor comfort | UTCI using the operational polynomial. Mean radiant temperature is calculated with SolarCal, accounting for direct, diffuse and reflected solar radiation and longwave exchange with the sky. | Bröde et al. (2012); Arens et al. (2015) |
| Indoor comfort | Adaptive comfort following EN 16798-1, using an exponential running mean (alpha 0.8), and ASHRAE 55. PMV is also calculated where shown. | EN 16798-1 (CEN, 2019); ASHRAE 55 (ASHRAE, 2020b); ISO 7730 (ISO, 2005) |
| Degree days | Calculated from daily mean temperatures, with a heating base of 15 °C (G 20/15 for German stations). | VDI 4710 Blatt 2 (VDI, 2007); EN ISO 15927-6 (ISO, 2007) |
| Climate extremes | Summer, hot, tropical, frost and ice days, together with heat and cold spells and the hottest and coldest weeks. | Deutscher Wetterdienst (n.d.) |
| Sky and daylight | Perez sky classifications and the number of hours above 10, 20 and 50 klx. | Perez et al. (1990) |
| Rain and wind | Driving rain index by orientation and wind roses divided into 16 directional sectors. | ISO 15927-3 (ISO, 2009) |
| Passive strategies | Givoni-Milne climate strategy zones, plotted on the psychrometric chart. | Givoni (1969, 1992); Milne & Givoni (1979); Milne (n.d.) |
| PV potential | PVWatts v5 calculation chain, using fixed assumptions. | Dobos (2014) |
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
yet been checked against Climate Consultant (Milne, n.d.), which is one of the established tools using this approach.

**German adaptive comfort.** The national annex comfort band (DIN EN 16798-1/NA; DIN, 2021) follows the formula implemented in
Room Clima. There is currently no open reference implementation available for direct comparison.

## Validation
The climate calculations have been checked against established reference implementations.

Solar position agrees with pvlib's NREL SPA calculation (Holmgren et al., 2018; Reda & Andreas, 2004) within
0.02°. Solar radiation on walls and roofs agrees with
pvlib's Perez model within 0.2%. Psychrometric calculations, UTCI and the adaptive comfort band match the
corresponding implementations in psychrolib (Meyer & Thevenard, 2019) and pythermalcomfort (Tartarini &
Schiavon, 2020).

The first verification, carried out on 7 November 2026, also covered PMV, mean radiant temperature, degree days,
climate extremes, sky classifications, rain, wind and the EPW file reader. The verification results are documented in
the [validation records](../../validation/climate-reading/).

## References
<!-- refs: usdoe2024 noaa meeus1998 perez1990 ashraeF hyland1983 brode2012 arens2015 cen16798_1 ashrae55 iso7730 vdi4710 iso15927_6 dwd iso15927_3 givoni1969 givoni1992 milne1979 milneCC dobos2014 dinNA holmgren2018 reda2004 meyer2019 tartarini2020 -->

Arens, E., Hoyt, T., Zhou, X., Huang, L., Zhang, H., & Schiavon, S. (2015). Modeling the comfort effects of short-wave solar radiation indoors. *Building and Environment, 88*, 3–9. https://doi.org/10.1016/j.buildenv.2014.09.004

ASHRAE. (2020b). *ANSI/ASHRAE Standard 55-2020: Thermal environmental conditions for human occupancy*. American Society of Heating, Refrigerating and Air-Conditioning Engineers.

ASHRAE. (2021). *ASHRAE handbook: Fundamentals*. American Society of Heating, Refrigerating and Air-Conditioning Engineers.

Bröde, P., Fiala, D., Błażejczyk, K., Holmér, I., Jendritzky, G., Kampmann, B., Tinz, B., & Havenith, G. (2012). Deriving the operational procedure for the Universal Thermal Climate Index (UTCI). *International Journal of Biometeorology, 56*(3), 481–494. https://doi.org/10.1007/s00484-011-0454-1

CEN. (2019). *EN 16798-1:2019 Energy performance of buildings: Ventilation for buildings: Part 1: Indoor environmental input parameters for design and assessment of energy performance of buildings addressing indoor air quality, thermal environment, lighting and acoustics (Module M1-6)*. European Committee for Standardization.

Deutscher Wetterdienst. (n.d.). *Wetter- und Klimalexikon*. https://www.dwd.de/lexikon

DIN. (2021). *E DIN EN 16798-1/NA:2021-06 Nationaler Anhang: Nationale Ergänzungen und Hinweise zur Anwendung: Energetische Bewertung von Gebäuden: Lüftung von Gebäuden: Teil 1* [Draft standard, withdrawn]. Beuth.

Dobos, A. P. (2014). *PVWatts version 5 manual* (NREL/TP-6A20-62641). National Renewable Energy Laboratory.

Givoni, B. (1969). *Man, climate and architecture*. Elsevier.

Givoni, B. (1992). Comfort, climate analysis and building design guidelines. *Energy and Buildings, 18*(1), 11–23. https://doi.org/10.1016/0378-7788(92)90047-K

Holmgren, W. F., Hansen, C. W., & Mikofski, M. A. (2018). pvlib python: A python package for modeling solar energy systems. *Journal of Open Source Software, 3*(29), 884. https://doi.org/10.21105/joss.00884

Hyland, R. W., & Wexler, A. (1983). Formulations for the thermodynamic properties of the saturated phases of H2O from 173.15 K to 473.15 K. *ASHRAE Transactions, 89*(2A), 500–519.

ISO. (2005). *ISO 7730:2005 Ergonomics of the thermal environment: Analytical determination and interpretation of thermal comfort using calculation of the PMV and PPD indices and local thermal comfort criteria*. International Organization for Standardization.

ISO. (2007). *ISO 15927-6:2007 Hygrothermal performance of buildings: Calculation and presentation of climatic data: Part 6: Accumulated temperature differences (degree-days)*. International Organization for Standardization.

ISO. (2009). *ISO 15927-3:2009 Hygrothermal performance of buildings: Calculation and presentation of climatic data: Part 3: Calculation of a driving rain index for vertical surfaces from hourly wind and rain data*. International Organization for Standardization.

Meeus, J. (1998). *Astronomical algorithms* (2nd ed.). Willmann-Bell.

Meyer, D., & Thevenard, D. (2019). PsychroLib: A library of psychrometric functions to calculate thermodynamic properties of air. *Journal of Open Source Software, 4*(33), 1137. https://doi.org/10.21105/joss.01137

Milne, M. (n.d.). *Climate Consultant* (Version 6) [Computer software]. UCLA Energy Design Tools Group. https://www.sbse.org/resources/climate-consultant

Milne, M., & Givoni, B. (1979). Architectural design based on climate. In D. Watson (Ed.), *Energy conservation through building design* (pp. 96–113). McGraw-Hill.

NOAA Global Monitoring Laboratory. (n.d.). *NOAA solar calculator*. https://gml.noaa.gov/grad/solcalc/

Perez, R., Ineichen, P., Seals, R., Michalsky, J., & Stewart, R. (1990). Modeling daylight availability and irradiance components from direct and global irradiance. *Solar Energy, 44*(5), 271–289. https://doi.org/10.1016/0038-092X(90)90055-H

Reda, I., & Andreas, A. (2004). Solar position algorithm for solar radiation applications. *Solar Energy, 76*(5), 577–589. https://doi.org/10.1016/j.solener.2003.12.003

Tartarini, F., & Schiavon, S. (2020). pythermalcomfort: A Python package for thermal comfort research. *SoftwareX, 12*, 100578. https://doi.org/10.1016/j.softx.2020.100578

U.S. Department of Energy. (2024). *EnergyPlus version 24.2 documentation: Engineering reference; Auxiliary programs*. https://energyplus.net/documentation

VDI. (2007). *VDI 4710 Blatt 2: Meteorologische Daten in der technischen Gebäudeausrüstung: Gradtage* [Withdrawn]. Verein Deutscher Ingenieure.
