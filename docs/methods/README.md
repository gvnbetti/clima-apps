# Methods

## Background

Buildings have always been about protecting people and adapting to climate. Understanding the relationship between a
building and its climate, a city and its climate, and ultimately anything we build and the climate it stands in,
should be one of the foundations of design. Not the only one, but a fundamental one. It matters even more now: the
energy used to heat and cool buildings is a major driver of global emissions, while the climate in which buildings
stand is changing.

In practice, climate-adaptive and bioclimatic design are still often treated as specialist tasks, requiring
specialised software and knowledge.

CBE Clima was born from the idea that climate data should be easy to access and easy to understand, without
specialised tools or expertise. The aim was to lower the barrier to entry. Clima Toolbox follows the same ethos,
builds on that experience, and takes it a step further.

Clima Map and Macro Clima extend what CBE Clima set out to do: make weather files accessible and climate data easy to
read. Three things are built into them from the start:

- **Future climate.** Every weather file can be explored under +1.5, +2 and +3 °C of global warming.
- **Comparison.** Every climate reading can be understood in relation to other climates.
- **The city.** Weather files are usually recorded at airports or in open country, while many of the buildings we
  design stand in cities. Urban modifiers bring the climate data closer to the actual conditions of the place being
  designed.

Micro Clima and Room Clima take this a step further. They work as design recommendation systems, running thousands of
what-if scenarios to identify which combinations of a few key parameters can create more comfortable outdoor and
indoor environments.

Making something easy to access does not mean making it simpler than it needs to be. A considerable amount of
mathematics runs underneath these apps, and we try to be as transparent about it as possible. That is the purpose of
the methods and validation pages. Some assumptions are self-evident; others are there for expert users to question and
challenge. All the tools are free to use and free to inspect, in the hope that others will help us make them better.

## The four apps

**Clima Map** finds the most appropriate weather file for a given location.

**Macro Clima** helps understand the climate: comfort, sun, wind, sky and rain, and the design strategies that respond
to them. It explores present conditions, future warming and the influence of the city.

**Micro Clima** explores how design choices shape the outdoor environment, testing the effects of shade, ground
materials, wind protection and enclosure.

**Room Clima** explores the relationship between a room and its facade, testing windows, glazing, shading, thermal mass
and ventilation, and their effects on energy use, comfort, daylight and carbon.

## Principles

### Designed for the early stages
The apps focus on the information available at the beginning of a project: a location, a type of space, a few
dimensions and a set of design options. When details are not yet known, they use clearly stated typical values rather
than requiring information that may not exist yet.

### Explore alternatives, not predict outcomes
The apps compare design options under the same climate conditions and assumptions. The differences between
alternatives are generally more reliable than any single absolute result. The tools are designed primarily to help
understand these differences and support informed design decisions.

### Performance against fixed targets
Results are measured against fixed thresholds drawn from established standards and guidance, such as comfort ranges,
overheating limits and daylight requirements. They are never measured against the best-performing option in a
particular run. If a design does not meet a target, it is shown as such, regardless of how it compares with the
alternatives.

### Open about assumptions
Every assumption is documented, with its unit, source and status: standard, secondary source, design decision or
assumption. Room Clima brings these into a single register, while Macro Clima and Micro Clima document them in their
respective guides. Placeholder values are explicitly identified.

### Established models, independently checked
The apps build on published scientific models and methods, including EN ISO 52016-1, Perez, UTCI, Theeuwes, the IPCC
AR6 Atlas and Radiance's sky model. Their results are checked against established simulation tools used in the field,
including EnergyPlus, Radiance, pvlib, pythermalcomfort and Ladybug. These comparisons are model-to-model validations,
rather than comparisons with measured building performance. See [Validation](../../validation/) for details.

### Everything runs in the browser
There is nothing to install, and weather files remain on the user's computer. All calculations run directly in the
browser. The underlying models are kept compact and transparent, so that their assumptions and methods can be
inspected.

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
