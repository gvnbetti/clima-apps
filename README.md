# Clima apps

Three browser tools for climate analysis and design guidance at the early stage of architectural projects.

| App | What it does | Folder | Published as |
| --- | --- | --- | --- |
| Macro Clima | Climate analysis of a weather file: comfort, solar, wind, future climate, urban heat island | `macro/` | Claude artifact (multi-file) |
| Micro Clima | Site and street-scale climate: outdoor comfort, shading, heat island, future climate | `micro/` | Claude artifact (single file) |
| Room Clima | Room and facade guidance: searches window size, glazing, shading, ventilation, mass and fans against daylight, comfort, energy and carbon targets; DIN 4108-2 summer check | `room/` | Claude artifact, v16 |

Private repository. All rights reserved until a licence is chosen.

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
              future-climate and urban-heat-island modifiers
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
- Before any public release: check the licence of the bundled weather (`room/src/wxdata.line` and the
  weather inside `micro/index.html`).
