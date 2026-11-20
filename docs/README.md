# Documentation

- `methods/`: what each app computes, with which models, assumptions and sources.
  - `clima-map.md`
  - `macro-clima.md`
  - `micro-clima.md`
  - `room-clima.md`
  - `room-clima-carbon.md`
- `../validation/`: the checks of every model against established tools, published tests and exact solutions, with
  scripts and results.

Each app also carries its own guide, which explains every reading and lists its sources. Room Clima keeps every
constant with its unit, status (decision, standard, assumption) and source in one register, `room/src/register.js`.
