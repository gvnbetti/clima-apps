# Outdoor comfort (Micro Clima)

**What is checked.** Micro Clima's engine (the script `engine` in `micro/index.html`):
- sun position and sun on walls;
- the sun on the body (SolarCal);
- UTCI;
- heat conduction in the ground;
- the time step;
- the outdoor mean radiant temperature and comfort hours, against Ladybug Tools.

The heat island is checked in `urban-heat-island/`.

**Result in short.**
- **Code against reference implementations:**
  - UTCI is identical to pythermalcomfort (Tartarini & Schiavon, 2020), within 1e-11 K;
  - the direct sun on the body agrees with pythermalcomfort's SolarCal (Arens et al., 2015) within 0.06 K; the 0.2 % difference is the
    radiation coefficient (ASHRAE 55's 6.012 W/m²K; ASHRAE, 2020b; in the engine, Macro Clima and Ladybug; 6 in pythermalcomfort);
  - the sun position is within 0.02° of NREL's algorithm (Reda & Andreas, 2004) in pvlib (Holmgren et al., 2018);
  - annual sun on walls is within 0.2 % of pvlib's Perez model (Perez et al., 1990);
  - ground conduction is within 1 % of the exact solution (Carslaw & Jaeger, 1959) in amplitude and 0.4 h in timing.
- **Against Ladybug,** given the same surroundings, Micro Clima ranks 70 outdoor designs the same way: rank correlation
  0.969 on average over 12 cases. Where the best design differs, taking Micro Clima's best costs at most 0.3 % of hours
  without thermal stress.
- **Shared core.** Since 21 November 2026 the sun position, sun on walls (Perez), saturation pressure, SolarCal table and
  coefficient, sky longwave estimate (Clark & Allen, 1978), UTCI, future climate and heat island come from the calculation core shared with Macro and Room Clima
  (`shared/climamods.js`). All checks above were rerun on that code.

## Code verification (`verify_dump.js`, `verify.py`, results in `verification.md`)

| Part | Reference | Base cases | Result |
|---|---|---|---|
| Sun position | pvlib, NREL SPA, apparent elevation, at mid-hour | 6 bundled climates, all hours | elevation largest 0.02°; azimuth RMS 0.01 to 0.02° |
| Sun on walls | pvlib Perez 1990, albedo 0.2, the engine's sun | 4 walls × 6 climates | annual totals within 0.2 %; hourly RMS up to 0.8 W/m² |
| UTCI | pythermalcomfort `utci`, the polynomial of Bröde et al. (2012) | 3,000 random conditions across the polynomial's range | largest difference 1.4e-11 K |
| SolarCal, direct sun | pythermalcomfort `solar_gain`, averaged over the sun's direction relative to the body as the engine does | 42 cases, standing and seated | largest difference 0.06 K (radiation coefficient 6.012 against 6) |
| Ground conduction | exact solution: periodic air temperature, convective surface, semi-infinite solid | daily and annual wave; default grid at 2 steps per hour, halved grid at 12 | amplitude within 1 %, timing within 0.4 h (daily); annual amplitude within 0.3 % |
| Time step | 12 against 2 sub-steps per hour | asphalt, white paving, grass; Mannheim and Phoenix | ground surface RMS 0.09 to 0.34 K; UTCI RMS 0.03 to 0.06 K |

The diffuse and reflected light on the body follows the closed SolarCal formula (half of the effective radiating area
for each). It is written out in the engine and not compared separately.

## Comparison with Ladybug (`lb_dump.js`, `lb_run.py`, `lb_compare.py`, results in `ladybug.md`)

**Base cases.**
- **Climates:** Mannheim, Bologna, Phoenix and Ho Chi Minh City.
- **Neighbourhood:** urban (sky view factor 0.6, vegetation 0.2, canopy 10 %).
- **Scenarios,** 70 per climate:
  - five shadings: none, fixed canopy, deciduous tree, evergreen tree, seasonal shade;
  - seven grounds: aged asphalt, grey paving, light paving, white paving, gravel, permeable paving, grass;
  - two enclosures: open field, courtyard H/W 1;
  - exposed to wind; standing person.

**Reference.** Ladybug Tools (ladybug-comfort; Roudsari & Pak, 2013) with its own SolarCal (`body_solar_flux_from_parts`), longwave exchange
with the sky (`longwave_mrt_delta_from_horiz_ir`) and UTCI. The inputs are Micro Clima's for sky view, sunlit share and
wind. Two variants:
- **V1:** the surroundings at air temperature, Ladybug's default outdoor assumption;
- **V2:** the surroundings at Micro Clima's computed radiant temperature of ground, canopy and walls.

V2 isolates the sun on the body, the sky exchange and UTCI. V1 shows what Micro Clima's surface model adds.

**Results.**
- **Hard plaza** (no shade, asphalt, open field), hourly UTCI:
  - V2 is 0.46 to 0.57 K warmer than Micro Clima, RMS 0.46 to 0.60 K. This comes from a different convention for the
    sky temperature.
  - V1 differs by −0.38 to +0.20 K on average, RMS about 1 K, because Ladybug then ignores the hot or cold ground.
- **Decisions** (share of hours with UTCI 9 to 26 °C, for three time windows):
  - Against V2, the rank correlation of the 70 scenarios is 0.969 on average (lowest 0.931). The same best design is
    found in 6 of 12 cases. Where it differs, the loss is at most 0.3 percentage points: the designs are practically
    equal.
  - Against V1, the rank correlation is 0.89 to 0.96. V1 cannot tell grounds apart and so prefers asphalt as often as
    grass.

## Not repeated here
The sensitivity study of the placeholder values (October 2026, on version 6) sets the defaults and does not check the
code. It is not part of this validation and should be repeated on the current version before the values are cited.

## Limits
- No measurements, no SOLWEIG (Lindberg et al., 2008) or ENVI-met (Bruse & Fleer, 1998) comparison. Ladybug shares part of the method (SolarCal, UTCI), so it checks
  the implementation and the radiant exchange, not the underlying models.
- Wind shelter factors, enclosure wind factors and the moisture of permeable paving are still placeholders (see the
  app's guide, "Where the values come from").

## How to rerun
```
cd outdoor-comfort && node verify_dump.js && python3 verify.py      # pip install pvlib pythermalcomfort
for c in Mannheim Bologna Phoenix "Ho Chi Minh City"; do node lb_dump.js "$c"; done
for t in Mannheim Bologna Phoenix HoChiMinhCity; do python3 lb_run.py $t; done && python3 lb_compare.py   # pip install ladybug-comfort
```
pvlib 0.16.1, pythermalcomfort 4.8.1, ladybug-comfort 0.19.18.

## References
<!-- refs: tartarini2020 arens2015 ashrae55 reda2004 holmgren2018 perez1990 carslaw1959 clark1978 brode2012 roudsari2013 lindberg2008 bruse1998 -->

Arens, E., Hoyt, T., Zhou, X., Huang, L., Zhang, H., & Schiavon, S. (2015). Modeling the comfort effects of short-wave solar radiation indoors. *Building and Environment, 88*, 3–9. https://doi.org/10.1016/j.buildenv.2014.09.004

ASHRAE. (2020b). *ANSI/ASHRAE Standard 55-2020: Thermal environmental conditions for human occupancy*. American Society of Heating, Refrigerating and Air-Conditioning Engineers.

Bröde, P., Fiala, D., Błażejczyk, K., Holmér, I., Jendritzky, G., Kampmann, B., Tinz, B., & Havenith, G. (2012). Deriving the operational procedure for the Universal Thermal Climate Index (UTCI). *International Journal of Biometeorology, 56*(3), 481–494. https://doi.org/10.1007/s00484-011-0454-1

Bruse, M., & Fleer, H. (1998). Simulating surface–plant–air interactions inside urban environments with a three dimensional numerical model. *Environmental Modelling & Software, 13*(3–4), 373–384. https://doi.org/10.1016/S1364-8152(98)00042-5

Carslaw, H. S., & Jaeger, J. C. (1959). *Conduction of heat in solids* (2nd ed.). Clarendon Press.

Clark, G., & Allen, C. P. (1978). The estimation of atmospheric radiation for clear and cloudy skies. In *Proceedings of the 2nd National Passive Solar Conference* (pp. 675–678). American Section of the International Solar Energy Society.

Holmgren, W. F., Hansen, C. W., & Mikofski, M. A. (2018). pvlib python: A python package for modeling solar energy systems. *Journal of Open Source Software, 3*(29), 884. https://doi.org/10.21105/joss.00884

Lindberg, F., Holmer, B., & Thorsson, S. (2008). SOLWEIG 1.0: Modelling spatial variations of 3D radiant fluxes and mean radiant temperature in complex urban settings. *International Journal of Biometeorology, 52*(7), 697–713. https://doi.org/10.1007/s00484-008-0162-7

Perez, R., Ineichen, P., Seals, R., Michalsky, J., & Stewart, R. (1990). Modeling daylight availability and irradiance components from direct and global irradiance. *Solar Energy, 44*(5), 271–289. https://doi.org/10.1016/0038-092X(90)90055-H

Reda, I., & Andreas, A. (2004). Solar position algorithm for solar radiation applications. *Solar Energy, 76*(5), 577–589. https://doi.org/10.1016/j.solener.2003.12.003

Roudsari, M. S., & Pak, M. (2013). Ladybug: A parametric environmental plugin for Grasshopper to help designers create an environmentally-conscious design. In *Proceedings of BS2013: 13th Conference of the International Building Performance Simulation Association* (pp. 3128–3135). IBPSA.

Tartarini, F., & Schiavon, S. (2020). pythermalcomfort: A Python package for thermal comfort research. *SoftwareX, 12*, 100578. https://doi.org/10.1016/j.softx.2020.100578
