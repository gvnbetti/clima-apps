# Clima Map: method

## What it is for
Finding a typical-year weather file for a site. Clima Map computes nothing about the climate itself; it helps choose
the station whose climate is closest to the site's, then hands the file to the other apps.

## How it works
- **Stations.** The catalogue of Climate.OneBuilding.org and the EnergyPlus weather collection, as used in Macro Clima
  (`macro/data/stations.js`): 29,787 stations and 67,686 files. Entries of the same station listed under several
  source folders are merged: same name, within about 2 km.
- **Climate type.** The Köppen-Geiger class given in the catalogue for each station.
- **Nearest stations.** Great-circle distance from the chosen point. Elevation is shown so that a station with similar
  surroundings can be preferred.
- **Place search.** OpenStreetMap's Nominatim service, only on request (Enter), as its usage policy requires.
- **Files.** Downloaded directly from their source as ZIP files. The other apps read the ZIP as downloaded.
- **Map.** OpenStreetMap tiles, no account or key.

## Assumptions
- The nearest station is not always the best one. Elevation, distance to the coast and the station's surroundings
  (airport, city, valley) matter as much as distance. The map shows them; the choice is the user's.
- Where a station has several files (TMYx periods, TMY3, IWEC, national sets), the most recent TMYx period is the
  usual choice: it is built from the most recent years.

## Limits
- The catalogue was read in 2026 and does not include the newest TMYx periods for every station.
- A typical year contains typical weather, not extremes. Heat waves and cold spells are under-represented by
  construction.

## Validation
No calculation to check. The station list is the source catalogue, merged as described.
