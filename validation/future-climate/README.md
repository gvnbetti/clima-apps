# Future climate (Macro, Micro and Room Clima)

**What is checked.** The future-climate generator shared by the three apps (`macro/core.js` `futureDelta` and
`morphWeather`, copied to `room/src/climamods.js` and into Micro Clima). It shifts a weather file to a level of global
warming: +1.5, +2 or +3 °C above 1850-1900. The check asks whether the calculation follows the open data and method it
cites. It does not ask whether the morphed files match future observations. Each step is checked against an open,
independent source:

| Step | Cited source | Check | Result |
|---|---|---|---|
| Regional monthly change of temperature at each level | IPCC AR6 WGI Atlas, CMIP6 regional means (Iturbide et al. 2021) | rebuilt from the Atlas data (`atlas.py`) | within 0.05 K on average; 88 to 97 % of monthly values within 0.1 K |
| Warming already in the file, at its years | the same model runs, 1960 to 2030 | rebuilt | within 0.06 K on average |
| Region of the weather file | IPCC reference regions v4 | the official polygons, 64,919 station positions | same region in 99.99 % (9 stations on a border) |
| Morphing | Belcher et al. 2005 | pyepwmorph (McCarty), with the same monthly changes | annual shift equal (0.002 K); dew point within 0.01 K |

## The method and the choices made (recovered from the code)
1. **Region.** The weather file's latitude and longitude select an IPCC AR6 reference region (land regions first).
2. **Years of the file.** The middle of the period the typical year was built from:
   - read from "Period of Record = YYYY-YYYY" in the file's comments, or from "TMYx.YYYY-YYYY" in its name;
   - if neither is there, 2010 is assumed. This applies, for example, to the Canadian CWEC2020 files, which are built
     from 1998-2017, so their true middle is 2007.5.
3. **Change at the level.** For each month: the median over 35 CMIP6 models of the change from 1995-2014 to the 20
   years around the year the model crosses the level (Atlas crossing years, all four SSP scenarios). The 10th and 90th
   percentiles are shown as the spread.
4. **Change already in the file.** The models' change from 1995-2014 to the file's middle year, interpolated between
   5-year steps (1960 to 2030), is subtracted. The shift is thus measured from the file's own years, so an older file
   is shifted more.
5. **One shift for the whole file** (decision of 17 November 2026: the typical months stand for the whole period).
6. **Temperature.** Shifted (Belcher's "shift") by the monthly change, spread day by day between mid-month values. No
   "stretch": the Atlas gives the change of the mean only, not of the daily maximum and minimum, so the day-night swing
   and the spread of hot and cold spells stay as recorded.
7. **Humidity.** Relative humidity held, so dew point and absolute humidity rise with the temperature.
8. **Sky infrared radiation.** Scaled with (T'/T)⁴ in kelvin.
9. **Precipitation.** Scaled by the median monthly percentage change.

## Results
- `table_check.md`: the apps' table (`macro/future.js`) against the reconstruction from the Atlas data (`atlas.py`).
  - **Tabulated change at each level:** within 0.02 to 0.05 K on average (median), and 88 to 97 % of all monthly
    values within 0.1 K.
  - **Shift actually applied to a file:** within 0.05 to 0.08 K on average, 94 to 98 % within 0.2 K. Single months
    differ by up to 0.5 K, mostly in high-latitude regions (Greenland, Russian Arctic, Siberia).
  - **Why they differ:** the script that produced the apps' table was not kept, so `atlas.py` is a reconstruction.
    Which ensemble members, scenario weighting and percentile convention were used originally cannot be recovered.
  - **Global warming at the file's years** (shown to the user): within 0.06 K.
- `regions_check.md`: region lookup. The 9 differing stations lie on or within 0.001° of a region border, where the
  apps' polygons (rounded coordinates) and the official ones disagree by a few hundred metres.
- `morph_check.md`: the morphing of 13 reference weather files at the three levels, against pyepwmorph.
  - **Annual mean shift:** identical.
  - **Monthly mean shift:** up to 0.18 K from the tabulated monthly change, because the day-by-day spreading between
    mid-month values does not keep each month's mean exactly. pyepwmorph keeps the change constant within each month,
    so the two differ hour by hour by up to 0.6 K (RMS up to 0.17 K).
  - **Dew point at held humidity:** identical within 0.01 K.
  - **Sky infrared:** the apps raise it by 10.4 W/m² on average, pyepwmorph by 12.8 W/m² with Clark-Allen sky
    emissivity. Clark-Allen also counts the higher dew point, so the apps' (T'/T)⁴ is about a fifth lower.

## Open points for decision
- Replace the apps' table with the output of `atlas.py`, so the data path from the Atlas to the apps is fully
  traceable. Results would change by 0.05 K on average.
- Spread the monthly shift so that each month keeps its mean, or keep it constant per month as pyepwmorph does.
- Scale sky infrared with Clark-Allen emissivity (temperature and dew point), as EnergyPlus and pyepwmorph do.

## Limits
- Morphing keeps the file's weather sequence, so future heatwaves are underestimated. The apps say so.
- The change is a regional land mean. Coastal and mountain sites may warm differently.

## How to rerun
```
sh future-climate/fetch_atlas.sh        # about 400 MB from github.com/IPCC-WG1/Atlas
python3 weather/fetch.py
cd future-climate && python3 atlas.py && python3 check_table.py && python3 check_regions.py
node morph_dump.js && python3 check_morph.py       # pip install pyepwmorph shapely
```
Atlas commit ed29da33 (IPCC-WG1/Atlas, CC BY 4.0); pyepwmorph 3.6.1; shapely 2.2.
