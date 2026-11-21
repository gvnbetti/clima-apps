# Future and urban climate: method

## A shared module
Future and Urban Climate is a shared module used by Macro Clima, Micro Clima and Room Clima. It applies the same
climate adjustments consistently across all three apps. Clima Map is the exception: it helps select and download the
original weather file but does not modify it.

The module provides two ways to adjust a weather file: to account for future global warming and to represent the
additional heat associated with the urban environment.

Both modifiers are calculated centrally in Macro Clima (`macro/core.js`) and shared with the other apps. Room Clima
uses a generated version (`room/src/climamods.js`), produced by `shared/mkmods.py`, while Micro Clima carries its own
copy.

## What it is for
A typical-year weather file describes recent climatic conditions at a particular location, usually an open site such
as an airport. But a building designed today will operate in a warmer climate, and most buildings stand within
cities, where the surrounding urban fabric adds further heat.

These two modifiers make it possible to explore both effects directly in the design process, without requiring a
separate climate study.

## Future climate

**Warming levels, not future years.** The weather file is adjusted to represent +1.5, +2 or +3 °C of global warming
above the pre-industrial period (1850–1900). These are warming levels, not projections for specific calendar years.

The timing of each warming level depends on future emissions, while regional climate changes at a given level depend
much less on the pathway taken to reach it. This approach follows the IPCC Sixth Assessment Report (AR6) Atlas.

### How it works
The calculation follows five steps:

1. **Identify the region.** The latitude and longitude of the weather file are used to identify the corresponding
   IPCC AR6 reference region, prioritising land regions.
2. **Establish the file's reference period.** The middle year of the period represented by the typical weather file
   is identified from its comments (Period of Record) or filename (TMYx.YYYY-YYYY). If neither is available, 2010 is
   assumed.
3. **Calculate the climate change.** For each month, the calculation uses the median change across 35 CMIP6 climate
   models, comparing the 1995–2014 baseline with the 20-year period around the year each model reaches the selected
   warming level. All four SSP scenarios are included. The 10th and 90th percentiles show the range of model results.
4. **Account for warming already present.** The warming that has already occurred between the 1995–2014 baseline and
   the middle year of the weather file is subtracted. Older weather files therefore receive a larger adjustment than
   more recent ones.
5. **Adjust the weather file.** Using the morphing method of Belcher et al. (2005), monthly temperature changes are
   interpolated between mid-month values and applied day by day. Relative humidity is held constant, allowing dew
   point and absolute humidity to increase with temperature. Sky infrared radiation is scaled by the fourth power of
   the absolute temperature ratio (T'/T)⁴, while precipitation is adjusted according to the monthly percentage change.

### Assumptions
- **One adjustment for the whole file.** The typical months are assumed to represent the full period from which the
  weather file was constructed.
- **Changes in the mean, not in variability.** The adjustment shifts temperatures but does not stretch or compress
  their daily range. The day-night temperature swing and the variability of hot and cold spells remain as recorded in
  the original file. The IPCC Atlas provides changes in mean climate conditions, not equivalent changes in daily
  extremes.

### Limits
The morphing method preserves the original sequence of weather conditions. It therefore cannot reproduce the timing,
duration or intensity of future heat waves, and may underestimate future extreme heat.

The climate changes are based on regional land averages. Coastal and mountain locations may experience different
changes from the regional mean.

## Urban heat island

### How it works
The urban heat island modifier estimates the additional warming associated with the built environment. It uses the
diagnostic equation proposed by Theeuwes et al. (2017):

<p align="center">UHI<sub>max</sub> = (2 − SVF − F<sub>veg</sub>) × (S × DTR³ / U)<sup>1/4</sup></p>

The calculation combines two characteristics of the neighbourhood, the sky view factor (SVF) and vegetation fraction
(F<sub>veg</sub>), with three daily weather conditions from the weather file: solar radiation (S), diurnal temperature
range (DTR) and wind speed (U).

The resulting maximum daily heat island is distributed across the hours of the day and added to the original air
temperature. Vapour pressure is held constant.

### Assumptions
**Daily temperature profile.** The full maximum heat island is applied at night. During daylight hours, it decreases
according to the sun's altitude, following the apps' own profile:

<p align="center">UHI(h) = UHI<sub>max</sub> × (1 − 0.85 × √(sin α<sub>h</sub> / sin α<sub>max</sub>))</p>

where α<sub>h</sub> is the sun's altitude at a given hour and α<sub>max</sub> is its highest altitude that day. This
leaves 15% of the maximum heat island at solar noon. This hourly profile is an implementation choice developed for the
apps, rather than a profile proposed in the original paper.

**Neighbourhood presets.** Three representative urban conditions are available, defined by their sky view factor and
vegetation fraction:

| Setting | SVF | Vegetation |
|---|--:|--:|
| Suburban | 0.8 | 0.35 |
| Urban | 0.6 | 0.2 |
| Dense urban | 0.4 | 0.1 |

### Limits
The original equation was developed using data from 14 cities in north-western Europe. Its calibration covers sky
view factors from 0.2 to 0.9 and vegetation fractions up to 0.4. Applying it outside these geographical and parameter
ranges is an extrapolation, which the apps explicitly flag.

The result represents an average neighbourhood heat island, not the conditions of an individual street, courtyard or
outdoor space. These more local effects, including shading, ground materials and wind shelter, are explored in Micro
Clima.

## Validation
Both modifiers are checked against their cited reference data and models, rather than against direct measurements of
future or urban conditions.

Future climate adjustments are checked against IPCC Atlas data, official reference regions and the pyepwmorph
implementation of weather-file morphing: see [future climate](../../validation/future-climate/).

The urban heat island calculation is checked against an independent implementation of the diagnostic equation
published by Theeuwes et al. (2017): see [urban heat island](../../validation/urban-heat-island/).
