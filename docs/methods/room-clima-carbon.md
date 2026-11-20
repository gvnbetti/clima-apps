# Room Clima: how carbon is calculated

Room Clima compares designs by whole-life carbon over 50 years, per m² of floor. It counts only what the options
change: the embodied carbon of the elements a design adds or removes, with their replacements, and the operational
carbon of the energy the room uses. The structure, floors, partitions and services that every design shares are left
out. The figures are therefore for comparing designs of the same room, not a building LCA.

Code: `carbonOf` in `room/src/core.js`. Values: the `carbon.*` entries of `room/src/register.js`. All are generic
assumptions, to be replaced by project data or the Build-up LCA datasets (ÖKOBAUDAT).

## Formula

Whole-life carbon = embodied carbon of the options + delivered energy × grid factor × 50 years

- **Study period:** 50 years (BNB and DGNB reference study period).
- **Replacements:** an element with a service life L is counted ⌈50 / L⌉ times.
- **Operational carbon:** delivered energy (all electric, through a heat pump) × 0.25 kg CO₂e/kWh × 50. The factor is
  an assumed mean over 50 years; the German mix was about 0.38 kg/kWh in 2024 (UBA) and is set to fall. It can be
  changed in the app.

## Embodied carbon of the options

| Element | Value | Life | Measured on |
|---|---|---|---|
| Window with frame, double glazing | 55 kg CO₂e/m² | 40 years (counted twice) | window area |
| Window with frame, triple glazing | 75 kg CO₂e/m² | 40 years | window area |
| Solar control coating (g 0.3 or less) | +3 kg CO₂e/m² | with the window | window area |
| Opaque wall | 45 kg CO₂e/m² + 0.42 per cm of insulation (14, 24 or 36 cm by U-value level) | 50 years | wall area without window |
| Exterior venetian blind with motor | 40 kg CO₂e/m² | 25 years | window area |
| Interior textile blind | 6 kg CO₂e/m² | 15 years | window area |
| Overhang, fins, frame | 90 kg CO₂e per m² of projected element | 50 years | depth × length (overhang over the facade width, two fins over the window height) |
| Thermal mass, against light construction | medium 15, heavy 45, very heavy 60 kg CO₂e per m² of floor | 50 years | floor area |
| Ceiling fan | 35 kg CO₂e per fan, one per 12 m² of floor | 15 years | number of fans |
| Night ventilation, tilt restrictors and actuators | 15 kg CO₂e per facade | 20 years | facade |
| Night ventilation across storeys | 5 kg CO₂e per m² of floor | 20 years | floor area |

The window area is the window-to-wall ratio times the facade. A corner room counts both facades. The thermal mass
values are the least certain of the set.

## Worked example

Office, one facade, 3.6 × 5.4 m, 3.0 m high (19.44 m² floor, 10.8 m² facade). Computed with the current code.

| Element | Design A: 50 % window, triple, exterior blind, 0.5 m overhang, medium mass, night tilt, fans | Design B: 30 % window, double, interior blind, heavy mass |
|---|---|---|
| Window | 5.4 m² × 75 × 2 = 810 kg → 41.7 kg/m² | 3.24 m² × 55 × 2 = 356 kg → 18.3 kg/m² |
| Wall | 5.4 m² × (45 + 0.42 × 24) = 297 kg → 15.3 | 7.56 m² × (45 + 0.42 × 14) = 385 kg → 19.8 |
| Blinds | 5.4 m² × 40 × 2 = 432 kg → 22.2 | 3.24 m² × 6 × 4 = 78 kg → 4.0 |
| Overhang | 90 × 0.5 × 3.6 = 162 kg → 8.3 | 0 |
| Thermal mass | 15.0 | 45.0 |
| Fans | 35 × 2 × 4 = 280 kg → 14.4 | 0 |
| Night ventilation | 15 × 3 = 45 kg → 2.3 | 0 |
| **Embodied, per m² floor** | **119.2 kg CO₂e/m²** | **87.1 kg CO₂e/m²** |

Operational carbon adds 12.5 kg CO₂e/m² for each kWh/m²a of delivered energy (0.25 × 50). At 10 kWh/m²a that is
125 kg CO₂e/m²: of the same order as the embodied part. A design that saves 2 kWh/m²a each year therefore justifies
about 25 kg CO₂e/m² more embodied carbon.

## How carbon enters the recommendation

Carbon is not a target and not part of the score. It decides between designs that are otherwise equal: among designs
within 0.01 in score and in the same tier, the one with less whole-life carbon is recommended. After the main search, a
local search looks for the design with the least whole-life carbon among those that meet every target, because carbon
is not one of the search criteria and the search alone could miss it.
