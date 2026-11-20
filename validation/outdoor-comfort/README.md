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
  - UTCI is identical to pythermalcomfort, within 1e-11 K;
  - the direct sun on the body is identical to pythermalcomfort's SolarCal, within 1e-14 K;
  - the sun position is within 0.4° of NREL's algorithm (pvlib);
  - annual sun on walls is within 0.25 % of pvlib's Perez model;
  - ground conduction is within 1 % of the exact solution in amplitude and 0.4 h in timing.
- **Against Ladybug,** given the same surroundings, Micro Clima ranks 70 outdoor designs the same way: rank correlation
  0.970 on average over 12 cases. Where the best design differs, taking Micro Clima's best costs at most 0.4 % of hours
  without thermal stress.

## Code verification (`verify_dump.js`, `verify.py`, results in `verification.md`)

| Part | Reference | Base cases | Result |
|---|---|---|---|
| Sun position | pvlib, NREL SPA, at mid-hour | 6 bundled climates, all hours | elevation bias −0.02 to −0.05°, largest 0.40°; azimuth RMS 0.10 to 0.21° |
| Sun on walls | pvlib Perez 1990, albedo 0.2, the engine's sun | 4 walls × 6 climates | annual totals within +0.01 to +0.23 %; hourly RMS up to 1.6 W/m² |
| UTCI | pythermalcomfort `utci` (Bröde et al. 2012 polynomial) | 3,000 random conditions across the polynomial's range | largest difference 1.4e-11 K |
| SolarCal, direct sun | pythermalcomfort `solar_gain`, averaged over the sun's direction relative to the body as the engine does | 42 cases, standing and seated | largest difference 1.1e-14 K |
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

**Reference.** Ladybug Tools (ladybug-comfort) with its own SolarCal (`body_solar_flux_from_parts`), longwave exchange
with the sky (`longwave_mrt_delta_from_horiz_ir`) and UTCI. The inputs are Micro Clima's for sky view, sunlit share and
wind. Two variants:
- **V1:** the surroundings at air temperature, Ladybug's default outdoor assumption;
- **V2:** the surroundings at Micro Clima's computed radiant temperature of ground, canopy and walls.

V2 isolates the sun on the body, the sky exchange and UTCI. V1 shows what Micro Clima's surface model adds.

**Results.**
- **Hard plaza** (no shade, asphalt, open field), hourly UTCI:
  - V2 is 0.45 to 0.57 K warmer than Micro Clima, RMS 0.46 to 0.59 K. This comes from a different convention for the
    sky temperature.
  - V1 differs by −0.38 to +0.20 K on average, RMS about 1 K, because Ladybug then ignores the hot or cold ground.
- **Decisions** (share of hours with UTCI 9 to 26 °C, for three time windows):
  - Against V2, the rank correlation of the 70 scenarios is 0.970 on average (lowest 0.947). The same best design is
    found in 6 of 12 cases. Where it differs, the loss is at most 0.4 percentage points: the designs are practically
    equal.
  - Against V1, the rank correlation is 0.89 to 0.96. V1 cannot tell grounds apart and so prefers asphalt as often as
    grass.

## Not repeated here
The sensitivity study of the placeholder values (October 2026, on version 6) sets the defaults and does not check the
code. It is not part of this validation and should be repeated on the current version before the values are cited.

## Limits
- No measurements, no SOLWEIG or ENVI-met comparison. Ladybug shares part of the method (SolarCal, UTCI), so it checks
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
