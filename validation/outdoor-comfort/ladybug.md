# Micro Clima against Ladybug

V1: Ladybug with the surroundings at air temperature (its default outdoor assumption). V2: Ladybug with Micro Clima's radiant temperature of ground, canopy and walls, so that only sky exchange, sun on the body and UTCI come from Ladybug. Standing person, 70 scenarios per climate (5 shadings × 7 grounds × open field and courtyard H/W 1), exposed to wind.

## Hourly UTCI, hard plaza (no shade, asphalt, open field)

| Climate | V1 minus Micro Clima, mean / RMS | V2 minus Micro Clima, mean / RMS |
|---|---|---|
| Mannheim | +0.20 / 0.98 K | +0.54 / 0.60 K |
| Bologna | -0.11 / 1.13 K | +0.57 / 0.58 K |
| Phoenix | -0.26 / 1.24 K | +0.47 / 0.51 K |
| Ho Chi Minh City | -0.38 / 1.12 K | +0.46 / 0.46 K |

## Decisions: share of hours without thermal stress

Rank correlation of the 70 scenarios; same best scenario; loss = hours (as a share of the window) Ladybug would lose by taking Micro Clima's best instead of its own.

| Climate | Window | Micro Clima's best (share) | V1: rank correlation, same best, loss | V2: rank correlation, same best, loss |
|---|---|---|---|---|
| Mannheim | café, 11:00 to 22:00 | Deciduous tree, Grass, courtyard (62%) | 0.916, no: Deciduous tree, Asphalt, courtyard, 0.1 points | 0.976, yes, 0.0 points |
| Mannheim | plaza, 08:00 to 22:00 | Deciduous tree, Grass, courtyard (63%) | 0.892, no: Deciduous tree, Asphalt, courtyard, 0.1 points | 0.967, yes, 0.0 points |
| Mannheim | all day | Deciduous tree, Light paving, courtyard (62%) | 0.960, no: Deciduous tree, Asphalt, courtyard, 0.1 points | 0.991, no: Deciduous tree, Grey paving, courtyard, 0.1 points |
| Bologna | café, 11:00 to 22:00 | Deciduous tree, Grass, courtyard (55%) | 0.903, no: Seasonal shade, Grey paving, courtyard, 0.3 points | 0.976, yes, 0.0 points |
| Bologna | plaza, 08:00 to 22:00 | Deciduous tree, Grass, courtyard (55%) | 0.902, no: Seasonal shade, Grey paving, courtyard, 0.4 points | 0.966, no: Seasonal shade, Grass, courtyard, 0.0 points |
| Bologna | all day | Deciduous tree, Grass, courtyard (58%) | 0.924, no: Deciduous tree, Asphalt, courtyard, 0.0 points | 0.990, yes, 0.0 points |
| Phoenix | café, 11:00 to 22:00 | Seasonal shade, Grass, courtyard (42%) | 0.918, no: Seasonal shade, Asphalt, courtyard, 0.1 points | 0.960, no: Evergreen tree, Grass, courtyard, 0.3 points |
| Phoenix | plaza, 08:00 to 22:00 | Seasonal shade, Grass, courtyard (44%) | 0.925, no: Seasonal shade, Asphalt, courtyard, 0.1 points | 0.969, no: Evergreen tree, Grass, courtyard, 0.3 points |
| Phoenix | all day | Evergreen tree, Grass, courtyard (50%) | 0.948, no: Deciduous tree, Asphalt, courtyard, 0.0 points | 0.987, no: Deciduous tree, Grass, courtyard, 0.0 points |
| Ho Chi Minh City | café, 11:00 to 22:00 | Evergreen tree, Grass, open field (4%) | 0.921, no: Evergreen tree, Asphalt, open field, 0.0 points | 0.947, yes, 0.0 points |
| Ho Chi Minh City | plaza, 08:00 to 22:00 | Evergreen tree, Grass, open field (4%) | 0.951, no: Evergreen tree, Asphalt, open field, 0.1 points | 0.965, yes, 0.0 points |
| Ho Chi Minh City | all day | No shade, Grass, open field (9%) | 0.806, no: Seasonal shade, Asphalt, open field, 0.4 points | 0.931, no: Seasonal shade, Grass, open field, 0.3 points |

V2 over all 12 cases: rank correlation 0.969 on average (lowest 0.931); same best in 6 of 12; largest loss 0.3 points.
