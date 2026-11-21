# Documentation

- [`methods/`](methods/): why the toolbox exists, the principles behind it, and for each app what it is for, how it
  works, its assumptions and its limits. Start with [methods/README.md](methods/README.md).
- [`../validation/`](../validation/): the checks of every model against established tools, published tests and exact
  solutions, with scripts and results.

The site shows the same pages: Methods and Validation in the top bar. They are generated from these files by
`shared/mkmethods.py` and `shared/mkvalidation.py`.

Each app also carries its own guide, which explains every reading and lists its sources. Room Clima keeps every
constant with its unit, status (decision, standard, assumption) and source in one register, `room/src/register.js`.
