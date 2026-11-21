# Urban heat island (Macro, Micro and Room Clima)

**What is checked.** The urban heat island that the apps add to a weather file's air temperature for a chosen
neighbourhood. Its daily maximum comes from the diagnostic equation of Theeuwes et al. (2017); its spread over the day
is the apps' own assumption. One implementation is shared by the three apps: Macro Clima's `urbanHeatIsland`
(`macro/core.js`), copied verbatim into the shared core `shared/climamods.js`, which Room Clima's build and Micro
Clima's engine embed. The check confirms that each app, as built, gives the same hours.

**Result in short.**
- An independent implementation reproduces the apps within 0.0001 K at every hour, for 13 weather files and three
  neighbourhoods.
- Macro, Room and Micro Clima give identical hours (largest difference 0.0000 K). Until 21 November 2026 Micro Clima
  had its own copy with a simpler sun position, which differed by up to 0.77 K in 2 % of hours.
- The equation gives 2.521 K for the worked example both by hand and in the apps.

## The model
**Daily maximum** (Theeuwes et al. 2017, equation 13):

UHI_max = (2 − SVF − F_veg) × (S × DTR³ / U)^¼

| Symbol | Meaning | Averaging window |
|---|---|---|
| SVF | sky view factor of the neighbourhood | |
| F_veg | vegetation fraction of the neighbourhood | |
| S | daily mean incoming solar radiation / (ρ c_p), K m/s, with ρ c_p = 1.2 × 1005 J/(m³ K) | 00:00 to 24:00 |
| DTR | daily temperature range at the weather station, K | 08:00 to 07:00 the next day |
| U | daily mean wind speed at 10 m, m/s, at least 0.5 | 08:00 to 07:00 the next day |

UHI_max applies to the 08:00 to 07:00 window. Solar radiation is rebuilt from direct and diffuse radiation with the
apps' sun position.

**Choices of the apps** (assumptions, not from the paper):
- **Daily profile:** the full UHI_max with the sun down. With the sun up it is reduced by
  0.85 × √(sin(altitude) / sin(highest altitude of the day)), so 15 % remains at the daily sun peak.
- **Humidity:** vapour pressure held, so relative humidity is recomputed.
- **Neighbourhood presets** (sky view factor, vegetation fraction): suburban 0.8 and 0.35; urban 0.6 and 0.2;
  dense 0.4 and 0.1.
- **Range of the fit:** the equation was fitted to 14 cities in north-western Europe, for SVF 0.2 to 0.9 and F_veg up
  to 0.4. The apps warn outside that range and outside that region.

## Base cases
The 13 reference weather files of `weather/` (Köppen A to D) × the three presets. The worked example uses constant
inputs: S from 100 W/m² daily mean, DTR 8 K, U 3 m/s, SVF 0.5, F_veg 0.2.

## Results
`results.md`, per file and neighbourhood: mean daily maximum, annual and night means, and the largest hourly difference
between implementations.

## Limits
- The equation describes the daily maximum heat island at night in north-western European cities. Elsewhere it is an
  extrapolation, flagged in the apps.
- The daily profile is an assumption, not fitted to measurements.
- Verification only: the check confirms the apps compute the equation as published, not that it matches a given city.

## How to rerun
```
python3 weather/fetch.py
cd urban-heat-island && node uhi_dump.js && python3 uhi_check.py
```
