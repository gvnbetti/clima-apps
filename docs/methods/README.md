# Methods

## Background

Buildings have always been about protecting people and adapting to climate. Understanding the relation between a
building and its climate, a city and its climate, anything we build and its climate, should be one of the bases of
any design. Not the only one, but a fundamental one. It matters even more now: the energy used to heat and cool
buildings is a major driver of global emissions, and the climate the buildings stand in is changing.

In practice, climate-adaptive and bioclimatic design are still treated as specialist tasks. They often need
specialised software and specialised knowledge.

CBE Clima was born from the idea of making climate data easy to access and easy to read, without specialised tools or
specialised knowledge: lowering the barrier to entry. Clima Toolbox follows the same ethos, builds on the same
experience, and goes a step further.

Clima Map and Macro Clima rebuild and extend what CBE Clima does: easy access to weather files and an easy reading of
them. Three things are part of them from the start:
- **Future climate.** Every weather file can be read at +1.5, +2 and +3 °C of global warming.
- **Comparison.** Every reading is set against other climates.
- **The city.** Weather files are usually recorded at airports or in open country, while many of the buildings we
  design stand in cities. Urban modifiers bring the reading closer to the place being designed.

Micro Clima and Room Clima act as recommendation systems. They run through thousands of what-if scenarios and suggest
which combinations of a few parameters, the ones that matter in most projects, create a more comfortable outdoor or
indoor climate.

Making something easy to access does not mean making it simpler than it needs to be. A lot of mathematics runs
underneath these apps, and we try to be as transparent about it as we can: that is the role of the methods and
validation pages. Some assumptions are self-evident; others an expert user may want to challenge. All the tools are
free to use and free to inspect, in the hope that others will help make them better.

## The four apps

1. **Clima Map** finds the right weather file for a site.
2. **Macro Clima** reads the climate: comfort, sun, wind, sky, rain, and the strategies that suit it, today, under
   future warming and in a city.
3. **Micro Clima** tests design moves for an outdoor space: shade, ground, wind shelter, enclosure.
4. **Room Clima** tests a room and its facade: window, glazing, shading, mass, ventilation, and the energy, comfort,
   daylight and carbon that follow.

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
