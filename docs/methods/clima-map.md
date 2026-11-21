# Clima Map: method

## What it is for
Finding a representative weather file for a given location.

Clima Map does not calculate or simulate climate conditions. Its purpose is to help identify the weather station whose
climate is most relevant to the site, and to select and download a suitable weather file for use in the other apps.

## How it works
**Weather stations.** The station catalogue combines data from Climate.OneBuilding.org (Lawrie & Crawley, 2022) and the
EnergyPlus weather collection (U.S. Department of Energy, n.d.), as used in Macro Clima (`macro/data/stations.js`). It currently contains 29,787 stations and 67,686
weather files. Entries referring to the same station across different source folders are merged when their names
match and their locations are within approximately 2 km.

**Climate classification.** Each station is associated with a Köppen-Geiger climate classification, as provided in the
source catalogue.

**Distance and elevation.** Clima Map calculates the great-circle distance between the selected location and each
station. Station elevation is also displayed, helping identify stations with similar geographical conditions.

**Place search.** Location searches use OpenStreetMap's Nominatim service (OpenStreetMap contributors, n.d.). Requests are only sent when the user
explicitly submits a search, in accordance with its usage policy.

**Weather files.** Files are downloaded directly from their original source as ZIP archives. The other apps can read
these archives directly, without requiring the user to unpack them.

**Map.** The map uses OpenStreetMap tiles and requires no account or API key.

## Assumptions
The closest station is not necessarily the most representative one. Elevation, distance from the coast and local
surroundings, such as an airport, an urban area or a valley, can all influence the relevance of a weather file. Clima
Map makes these factors visible, but leaves the final choice to the user.

Where several files are available for the same station, such as different TMYx periods (Lawrie & Crawley, 2022), TMY3 (Wilcox & Marion, 2008), IWEC or national
weather datasets, the most recent TMYx period is generally a good starting point, as it draws on the most recent
available years.

## Limits
The station catalogue was compiled in 2026 and may not include the latest TMYx periods for every station.

Typical-year weather files represent typical conditions rather than extreme events. Heat waves, cold spells and other
unusual weather conditions are therefore under-represented by design. They should not be used to assess
extreme-weather risk.

## Validation
Clima Map does not perform climate calculations or simulations that require numerical validation. Its output is based
on the published station catalogue and the original weather files, with station entries consolidated as described
above.

The reliability of the selection therefore depends on the accuracy and completeness of the source data, as well as
the user's assessment of how representative a station is for the site.

## References
<!-- refs: lawrie2022 usdoe_weather osm wilcox2008 -->

Lawrie, L. K., & Crawley, D. B. (2022). *Development of global typical meteorological years (TMYx)*. Climate.OneBuilding.Org. https://climate.onebuilding.org

OpenStreetMap contributors. (n.d.). *OpenStreetMap* and *Nominatim*. OpenStreetMap Foundation. https://www.openstreetmap.org, https://nominatim.org

U.S. Department of Energy. (n.d.). *EnergyPlus weather data* [Data set]. https://energyplus.net/weather

Wilcox, S., & Marion, W. (2008). *Users manual for TMY3 data sets* (NREL/TP-581-43156). National Renewable Energy Laboratory.
