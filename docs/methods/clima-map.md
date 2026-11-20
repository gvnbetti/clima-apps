# Clima Map: method

Clima Map finds a typical-year weather file for a place. It computes nothing about the climate itself.

- **Stations.** The catalogue of Climate.OneBuilding.org and the EnergyPlus weather collection, as used in Macro Clima
  (`macro/data/stations.js`). Entries of the same station listed under several source folders are merged: same name,
  within about 2 km.
- **Climate type.** The Köppen-Geiger class given in the catalogue for each station.
- **Nearest stations.** Great-circle distance from the chosen point. Elevation is shown so that a station with similar
  surroundings can be preferred.
- **Place search.** OpenStreetMap's Nominatim service, only on request (Enter), as its usage policy requires.
- **Files.** Downloaded directly from their source. The apps read the ZIP as downloaded.
