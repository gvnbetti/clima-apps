# Macro Clima: method

Macro Clima reads one weather file (EPW) and describes the climate for design: comfort, sun, wind, sky, rain, and the
strategies that suit it. All calculations are in `macro/core.js`.

| Topic | Method | Source |
|---|---|---|
| Time | values at the middle of each hour (the EPW convention for radiation) | EPW definition |
| Sun position | NOAA solar calculator (Meeus), from the Julian day, with refraction, at mid-hour | Checked against pvlib NREL SPA in `validation/climate-reading/`: within 0.02° |
| Sun on surfaces | Perez 1990 transposition, ground reflectance from the file or 0.2 | Perez et al. 1990 |
| Psychrometrics | saturation pressure, humidity ratio, wet bulb, enthalpy | ASHRAE Handbook Fundamentals |
| Outdoor comfort | UTCI (operational polynomial); mean radiant temperature with SolarCal and measured diffuse and reflected light | Bröde et al. 2012; Arens et al. 2015 |
| Indoor comfort | adaptive EN 16798-1 and ASHRAE 55; PMV where shown | EN 16798-1, ASHRAE 55 |
| Strategy zones | Givoni-Milne zones on the psychrometric chart, with Climate Consultant's criteria | Givoni; Milne; Climate Consultant |
| Degree days, extremes, rain | from the hourly file | |
| PV potential | PVWatts v5 chain, fixed assumptions | NREL PVWatts |
| Future climate | morphing to +1.5, +2 and +3 °C of global warming with the IPCC AR6 Atlas regional changes | Iturbide et al. 2021; Belcher et al. 2005; `validation/future-climate/` |
| Urban heat island | Theeuwes et al. 2017, with an assumed daily profile | `validation/urban-heat-island/` |

The future-climate and heat-island code is shared with Micro Clima and Room Clima (`room/src/climamods.js` is generated
from it by `shared/mkmods.py`). The in-app guide gives every reading its explanation and sources.
