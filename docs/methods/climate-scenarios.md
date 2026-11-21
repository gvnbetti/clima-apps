# Future and urban climate: method

Macro, Micro and Room Clima can shift a weather file to a level of global warming, and add the heat island of a
neighbourhood. Both modifiers are computed once, in Macro Clima's code (`macro/core.js`), and shared with the other
two apps (`room/src/climamods.js` is generated from it by `shared/mkmods.py`; Micro Clima carries a copy).

## What it is for
A typical-year file describes the recent past at an open site, usually an airport. A building designed now will
stand in a warmer climate, and most buildings stand in a city. The two modifiers let a design be tested in those
conditions, at concept stage and without a separate climate study.

## Future climate

**Levels, not years.** The file is shifted to +1.5, +2 or +3 °C of global warming above 1850-1900, not to a year
under a scenario. The timing of each level depends on emissions; the regional climate at a given level depends much
less on the route taken to it. This follows the IPCC AR6 Atlas.

**How it works**
1. **Region.** The weather file's latitude and longitude select an IPCC AR6 reference region (land regions first).
2. **Years of the file.** The middle of the period the typical year was built from: read from "Period of Record" in
   the file's comments, or from "TMYx.YYYY-YYYY" in its name; 2010 if neither is there.
3. **Change at the level.** For each month: the median over 35 CMIP6 models of the regional change from 1995-2014 to
   the 20 years around the year each model crosses the level (all four SSP scenarios). The 10th and 90th percentiles
   are shown as the spread.
4. **Warming already in the file** is subtracted: the models' change from 1995-2014 to the file's middle year. An
   older file is therefore shifted more.
5. **Morphing** (Belcher et al. 2005): temperature shifted by the monthly change, spread day by day between mid-month
   values; relative humidity held, so dew point and absolute humidity rise; sky infrared scaled with (T'/T)⁴;
   precipitation scaled by the monthly percentage change.

**Assumptions**
- One shift for the whole file: the typical months stand for the whole period they were drawn from.
- Shift only, no stretch: the Atlas gives the change of the mean, not of the daily maximum and minimum, so the
  day-night swing and the spread of hot and cold spells stay as recorded.

**Limits**
- Morphing keeps the file's weather sequence, so future heat waves are underestimated.
- The change is a regional land mean. Coastal and mountain sites may warm differently.

## Urban heat island

**How it works.** The daily maximum heat island is computed with the diagnostic equation of Theeuwes et al. (2017):

UHI_max = (2 − SVF − F_veg) × (S × DTR³ / U)^¼

from the neighbourhood's sky view factor (SVF) and vegetation fraction (F_veg), and the day's solar radiation (S),
temperature range (DTR) and wind speed (U) in the weather file. The heat island is added to the air temperature at
every hour, with vapour pressure held.

**Assumptions**
- Daily profile: the full maximum with the sun down; with the sun up it is reduced by
  0.85 × √(sin(altitude) / sin(highest altitude of the day)), so 15 % remains at the daily sun peak. This profile is
  the apps' own, not from the paper.
- Neighbourhood presets (SVF, F_veg): suburban 0.8 and 0.35; urban 0.6 and 0.2; dense 0.4 and 0.1.

**Limits**
- The equation was fitted to 14 cities in north-western Europe, for SVF 0.2 to 0.9 and F_veg up to 0.4. Elsewhere it is
  an extrapolation, and the apps say so.
- The heat island is a neighbourhood mean. Conditions in a given street or courtyard are the subject of Micro Clima.

## Validation
Both modifiers are checked against the open data and models they cite, not against observations:
[future climate](../../validation/future-climate/) (IPCC Atlas data, official regions, pyepwmorph) and
[urban heat island](../../validation/urban-heat-island/) (independent implementation of the equation).
