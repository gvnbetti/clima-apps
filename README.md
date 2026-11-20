# Clima apps

Three browser tools for climate analysis and design guidance at the early stage of architectural projects.

| App | What it does | Folder | Published as |
| --- | --- | --- | --- |
| Macro Clima | Climate analysis of a weather file: comfort, solar, wind, future climate, urban heat island | `macro/` | Claude artifact (multi-file) |
| Micro Clima | Site and street-scale climate: outdoor comfort, shading, heat island, future climate | `micro/` | Claude artifact (single file) |
| Room Clima | Room and facade guidance: searches window size, glazing, shading, ventilation, mass and fans against daylight, comfort, energy and carbon targets; DIN 4108-2 summer check | `room/` | Claude artifact, v16 |

Live: https://gvnbetti.github.io/clima-apps/ (the apps run in the browser; nothing leaves it unless you use the optional AI assistant with your own API key).

Code under the MIT licence (`LICENSE`); documentation, notes and validation results under CC BY 4.0
(`LICENSE-docs.md`). To cite, see `CITATION.cff`.

## Layout

```
macro/        Macro Clima source (index.html, app.js, core.js, sections.js, future.js, regions.js)
micro/        Micro Clima v8 (single built file)
room/         Room Clima v16
  src/          register.js (every constant with source and status), core.js (engine), shell.html, page.html,
                climamods.js (generated, see shared/), data/, wxdata.line (bundled weather)
  build.py      assembles build/index.html and build/worker.js
  build/        built app as published
  edits/        scripted edits used to make each phase (history of changes)
  tests/        Node harness (h16.js) and checks; pw/ browser tests (Playwright, headless Chrome)
  validation/   EnergyPlus 24.2 and Radiance checks of v16, scripts and results
shared/       mkmods.py: generates room/src/climamods.js from Macro Clima, so all three apps share the
              future-climate and urban-heat-island modifiers; wxrecord.py: turns an EPW file into a bundled
              weather record
docs/         notes and links
```

## Build and test Room Clima

```
cd room
python3 build.py                      # writes build/index.html and build/worker.js
node tests/smoke.js                   # engine smoke test
node tests/modcheck.js                # shared modifiers against Macro Clima
python3 tests/pw/p2.py build          # browser run, Mannheim south office (needs Playwright and Chrome)
```

Validation (`room/validation/`): `ep16_dump.js` then `ep16_run.py` then `ep16_analyse.py` (EnergyPlus 24.2);
`rad_dump.js` then `rad_run.py` then `rad_analyse.py` (Radiance through pyradiance). Paths at the top of each script.

## Shared code

`room/src/climamods.js` is generated: `python3 shared/mkmods.py macro room/src/climamods.js`. Change the
modifiers in Macro Clima, then regenerate. Do not edit the generated file.

## Not in this repository

- Standard texts (DIN 4108-2, DIN EN 16798-1 and others): copyrighted, kept outside.

## Bundled weather

Room Clima (`room/src/wxdata.line`) and Micro Clima (inside `micro/index.html`) carry six typical years:

| City | File | Source |
| --- | --- | --- |
| Mannheim | DEU_BW_Mannheim.107290_TMYx.2007-2021 | TMYx, climate.onebuilding.org |
| Bologna | ITA_Bologna TMYx 2004-2018 | TMYx, climate.onebuilding.org |
| Dubai | ARE_DU_Dubai.Intl.AP.411940_TMYx | TMYx, climate.onebuilding.org |
| Ho Chi Minh City | VNM_SVN_Ho.Chi.Minh-Tan.Son.Nhat.Intl.AP.489000_TMYx | TMYx, climate.onebuilding.org |
| San Francisco | USA_CA_San.Francisco.Intl.AP.724940_TMY3 | TMY3, NREL |
| Phoenix | USA_AZ_Phoenix-Sky.Harbor.Intl.AP.722780_TMY3 | TMY3, NREL |

TMYx: Lawrie, L. K., Crawley, D. B. Development of Global Typical Meteorological Years (TMYx).
https://climate.onebuilding.org. TMY3: Wilcox, S., Marion, W. (2008) Users Manual for TMY3 Data Sets,
NREL/TP-581-43156. Both are published free of charge; the data keep their sources' terms.

The DIN 4108-2 summer check is defined on the German test reference years (TRY) of the DWD. Mannheim here is TMYx,
so the bundled DIN result is indicative. For a formal check, load the TRY file for the site.

## Third-party material

- IBM Plex fonts (SIL Open Font License 1.1), bundled in Room Clima.
- JSZip 3.10.1 (MIT or GPLv3, used under MIT), bundled in Room Clima; loaded from cdnjs in Micro Clima.
- fflate (MIT), loaded from jsDelivr in Macro Clima.
