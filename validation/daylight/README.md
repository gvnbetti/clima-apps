# Daylight

**What is checked.** Room Clima's daylight calculation (`room/src/core.js`, `Daylight` and `DaySweep`): useful daylight
illuminance (UDI) over the floor and the occupied hours, without blinds and with blinds lowered as the app lowers them.
The reference is Radiance.

**Result in short.** Over 6 rooms and 6 climates (108 comparisons), the app's useful daylight is within 2.6 points of
Radiance in every case:
- without blinds, +0.8 points on average;
- with interior blinds, +0.3 points;
- with exterior blinds, −0.9 points.

What a blind costs in useful daylight matches too: interior −8.3 points in the app against −7.9 in Radiance, exterior
−21.1 against −19.4.

## The model of the app
- **Daylight coefficients** from a radiosity solution of the room's six surfaces, the wall reveals and the outdoor
  shading:
  - Reinhart sky patches MF:1 plus the ground, as Radiance;
  - first arrival by stratified, cosine-weighted rays;
  - interreflection solved once per room.
- **Sky per hour:** Perez all-weather model with Perez 1990 luminous efficacy, as Radiance's gendaymtx.
- **Direct sun:** an exact ray test from each sensor through the glazing.
- **Glazing:** the Radiance glass model (n = 1.52).
- **Blinds** (decision of 20 November 2026). A lowered blind is a diffusing layer. It lets a small share of light pass
  straight through, in the sun's direction, and scatters the rest evenly:

| Blind | Through, straight | Through, scattered | Total | Reflectance |
|---|---|---|---|---|
| Exterior (venetian, 45°) | 0.01 | 0.09 | 0.10 | 0.3 (Radiance only) |
| Interior (white fabric, about 3 % open) | 0.03 | 0.22 | 0.25 | 0.6 (Radiance only) |

  The straight part reaches the room as through clear glass, only weaker. The scattered part is the light arriving at
  the blind: just outside the glass for an exterior blind (then through the glass's diffuse transmittance), just inside
  it for an interior blind. This light is re-emitted evenly from the glass. The app computes it with a second
  coefficient per window: the window as a uniform diffuse source, seen directly and through the room's
  interreflections. The angle dependence of real slats is not modelled: a venetian blind that sends light to the
  ceiling is represented by its average.
- **Hours with blinds down:** from a heated thermal run of a reference room with the same window, orientation and
  blind type (register `dl.blindRef`). The rule is that of DIN 4108-2: blinds down above 200 W/m² of sun on the
  window, 150 W/m² facing north (offices); in design runs they stay up below 23 °C room air.

## Base cases

| Item | Values |
|---|---|
| Rooms | cellular office 4.05 × 5 × 3 m, one window in a wall 0.35 m deep, glass 0.25 m from the outer face; window shares, facing and shading in the table below |
| Reflectances | floor 0.2, walls and inner reveals 0.5, ceiling 0.7, outer facade and outer reveals 0.3 |
| Glazing | normal light transmittance 0.70 (results scaled to 0.70 for the glazing 1.3 / 0.45) |
| Sensors | 63 points at 0.85 m, the app's own grid |
| Climates | the six bundled weather files, written to EPW by `weather/app_epw.js` |
| Hours | office hours, weekdays 07:00 to 18:00 |
| Metric | useful daylight: share of sensor-hours between 300 and 3,000 lx; also below 300 and above 3,000 lx |

| Room | Facing | Window share of the wall | Outdoor shading |
|---|---|---|---|
| S35 | south | 0.35 | none |
| S65 | south | 0.65 | none |
| W50 | west | 0.50 | none |
| N50 | north | 0.50 | none |
| S50-overhang | south | 0.50 | overhang 1.0 m |
| E50-frame | east | 0.50 | frame 0.5 m (overhang and fins) |

**Reference.** Radiance 6.0a (the binaries shipped with pyradiance 1.3.1) on the app's own geometry: every rectangle of the
room, reveals, facade and shading, with the same reflectances and sensors.
- **Daylight coefficients:** two-phase, from rfluxmtx with a Reinhart sky MF:4 and the ground, 6 ambient bounces and
  8,192 ambient divisions.
- **Skies:** gendaymtx (Perez) for each weather file.
- **Glass:** Radiance glass with the same normal transmittance.
- **Blinds:** a Radiance `trans` layer 3 cm outside or inside the glass, with the transmittances and reflectances of
  the table above.
- **Hours with blinds down:** those of the app.

## Results
Per room, climate and blind state: `results.md`. Summary:

| Blind | App minus Radiance, mean | Range | Mean absolute |
|---|---|---|---|
| none | +0.8 points | 0.0 to +2.0 | 0.8 |
| interior | +0.3 points | −1.3 to +2.0 | 0.7 |
| exterior | −0.9 points | −2.6 to +0.2 | 0.9 |

**History.** The run of 19 November 2026 (`history/`) used the earlier model of the app, which scaled the light of a
window with its blind down by the blind's transmittance. Against a fully diffusing Radiance blind it read 7.7 points
too low with blinds, and overstated what a blind costs in daylight, which biased recommendations against blinds. The
two-part model above replaced it on 20 November 2026.

## Limits
- Radiance and the app share the idealised blind (straight and scattered parts). The comparison tests the calculation,
  not how well a real venetian blind or fabric is represented by it.
- The interior blind's reflectance toward the room is in Radiance, not in the app; its effect is within the differences
  above.
- Two-phase Radiance spreads the sun over sky patches, while the app traces it exactly, so sun patches differ
  slightly. Both are within the tolerances above.
- No measured rooms.

## How to rerun
```
node weather/app_epw.js
cd daylight && node dump.js && python3 run.py && python3 analyse.py
```
`run.py` needs the Radiance programs, for example from `pip install pyradiance` (rfluxmtx, gendaymtx, dctimestep, rmtxop, epw2wea); `RADIANCE_BIN` points to
them. About 40 minutes on two cores.
