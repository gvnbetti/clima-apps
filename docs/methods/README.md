# Methods

## Background

> Draft for Giovanni Betti to rewrite.

The decisions that fix most of a building's climate performance are taken first: where it sits, which way it faces,
how much of the facade is glass, what shades it, how heavy it is, how its outdoor spaces are enclosed. They are taken
with the least information, by people who draw, and usually before anyone runs a simulation. Simulation tools arrive
later. They ask for detail the design does not yet have, and they answer questions the design has already settled.

CBE Clima, developed at UC Berkeley's Center for the Built Environment, showed that a weather file can be made
readable for designers: the same hourly data that feeds an energy model can show, in a few charts, what a climate
asks of a building. Clima Toolbox starts from the same idea and adds a second step: testing design moves against the
climate, first outdoors, then in a room.

The four apps follow the order in which these questions come up in a project:

1. **Clima Map** finds the right weather file for a site.
2. **Macro Clima** reads the climate: comfort, sun, wind, sky, rain, and the strategies that suit it, today and under
   future warming or in a city.
3. **Micro Clima** tests design moves for an outdoor space: shade, ground, wind shelter, enclosure.
4. **Room Clima** tests a room and its facade: window, glazing, shading, mass, ventilation, and the energy, comfort,
   daylight and carbon that follow.

Each app can be used alone. Together they move from the region to the street to the room.

## Principles

- **Concept stage.** Inputs are the ones known early: a place, a type of space, a few dimensions, a list of options.
  Where a detail is not known, the apps use a stated typical value rather than ask for it.
- **Comparisons, not predictions.** The apps rank design options on the same climate and the same assumptions.
  Differences between options are more reliable than any single absolute number, and the apps are written to be
  read that way.
- **Fixed targets.** Scores are measured against fixed limits taken from standards (comfort bands, overheating
  limits, daylight levels), never against the best option of the run. A design that misses a target is shown as
  missing it, however good the alternatives.
- **Every assumption visible.** Each constant has a unit, a status (standard, secondary source, decision, assumption)
  and a source. Room Clima keeps them in one register; Macro and Micro Clima list them in their guides. Where a value
  is a placeholder, it is called one.
- **Established models, checked.** The apps use published models (EN ISO 52016-1, Perez, UTCI, Theeuwes, IPCC AR6
  Atlas, Radiance's sky model) and are checked against the tools the field relies on: EnergyPlus, Radiance, pvlib,
  pythermalcomfort, Ladybug. The checks compare models with models; see [validation](../../validation/).
- **In the browser.** Nothing is installed and weather files stay on the user's computer. Every calculation runs in
  the page, which also keeps the models small enough to read.

## Method pages

| Page | Content |
|---|---|
| [Clima Map](clima-map.md) | weather station catalogue, place search, choice of file |
| [Macro Clima](macro-clima.md) | sun, surfaces, psychrometrics, comfort, strategies, derived readings |
| [Future and urban climate](climate-scenarios.md) | morphing to levels of global warming; urban heat island (shared by Macro, Micro and Room Clima) |
| [Micro Clima](micro-clima.md) | ground and wall heat balance, radiant exchange, trees and canopies, enclosures, UTCI |
| [Room Clima](room-clima.md) | hourly room model, ventilation, blinds, comfort, daylight, scores, scenarios |
| [Room Clima: carbon](room-clima-carbon.md) | whole-life carbon of the design options |

Each page has the same parts: what the app is for, how it works, assumptions, limits, and its validation.
