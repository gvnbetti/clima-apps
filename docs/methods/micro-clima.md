# Micro Clima: method

## What it is for
Testing design choices for an outdoor space: a square, a courtyard, a street or a terrace.

Micro Clima explores how the design of a space changes the thermal conditions people experience within it. It
calculates hours of heat and cold stress at a reference point in the centre of the space, using UTCI, and compares
different design options: trees or a canopy, paving or grass, an open space or an enclosed courtyard, more or less wind
shelter.

The weather file describes the climate at an open site. Micro Clima models how the geometry, materials, vegetation and
shelter of the designed space modify those conditions.

## How it works
The calculation engine is implemented in the script within `micro/index.html`. It evaluates the outdoor environment
hour by hour across the weather file, combining surface heat balances, solar radiation, vegetation, geometry and wind
exposure to calculate thermal comfort. Sun position, solar radiation on walls, saturation vapour pressure, SolarCal,
UTCI, future climate and the urban heat island come from the calculation core shared with Macro Clima and Room Clima
(`shared/climamods.js`).

| Part | Method | Source |
|---|---|---|
| Neighbourhood air temperature | Weather-file temperature adjusted for the urban heat island. Additional daytime cooling from tree canopy is applied only above 40% canopy cover; its strength is currently a placeholder. | Theeuwes et al. 2017; Ziter et al. 2019 |
| Ground surface | One-dimensional implicit heat balance extending to 4 m depth, accounting for solar radiation, longwave exchange, convection and evaporation according to surface moisture availability. | Oke 1987; material properties documented in the guide, "Where the values come from" |
| Walls | Separate surface heat balances for each orientation, using a fixed indoor temperature. | Surface heat balance model |
| Mean radiant temperature | Longwave radiation exchange calculated using view factors for the sky, ground, canopy and walls, combined with SolarCal for direct and diffuse solar exposure of the body, in standing or seated positions. | Arens et al. 2015 |
| Trees | Big-leaf energy balance model of the tree canopy, including solar transmission for leaf-on and leaf-off conditions. | Sources documented in the guide |
| Built canopy | Thin-sheet heat balance, using a white membrane with 10% solar transmission and 15% absorption. | Material assumptions documented in the guide |
| Enclosures | Four spatial configurations: open field, single wall, courtyard and street canyon, with height-to-width ratios (H/W) of 0.5, 1 and 2. Sky view factors and solar access are calculated geometrically at the centre point. | Geometric calculations |
| Wind | Weather-station wind speed at 10 m, adjusted using wind shelter and enclosure factors. These factors are currently placeholders. | Assumptions documented in the guide |
| Outdoor comfort | UTCI calculated using the operational polynomial and its associated thermal stress categories. | Bröde et al. 2012 |
| Future and urban climate | Adjustments for global warming scenarios and urban heat island effects. See [Future and urban climate](climate-scenarios.md). | See dedicated method |

## Assumptions
**One reference point.** The model evaluates conditions at a single point in the centre of the space. Conditions near
walls, at the edges of tree canopies or in other parts of the space may be different. The results therefore represent
the conditions at this reference point, not a spatial average.

**Solar exposure and shading.** Solar position and sky exposure are calculated geometrically for the centre point.
However, walls do not shade one another in the surface heat balance: each wall is modelled as though it were exposed
to the sun independently.

**Parameters still under development.** Some parameters are currently represented by placeholders rather than
established empirical values. These include wind shelter factors, enclosure-related wind adjustments, the strength of
canopy cooling and the moisture availability of permeable paving. They are explicitly identified in the guide.

## Limits
**Wind.** Wind speed is adjusted using shelter and enclosure factors, rather than calculated through computational
fluid dynamics (CFD). Gusts, corner effects, local wind acceleration and channelled flows are therefore not
represented.

**Geometry.** The model uses a fixed set of enclosure configurations. A real outdoor space is approximated by the
closest available geometry, rather than modelled in all its architectural detail.

## Validation
The main calculation components have been checked against established reference implementations and analytical
solutions.

UTCI matches pythermalcomfort. SolarCal matches it within 0.06 K; the difference comes from the radiation heat transfer
coefficient, 6.012 W/m²K as in ASHRAE 55 and Ladybug, which pythermalcomfort rounds to 6. Solar position agrees with
pvlib within 0.02°. Ground and wall heat balances have been checked against exact solutions.

The overall performance ranking of 70 design configurations has also been compared with Ladybug Tools, achieving a
rank correlation of 0.97.

These checks assess the consistency of the calculations and the relative ranking of design alternatives. They do not
constitute validation against measured conditions in real outdoor spaces. See
[outdoor comfort](../../validation/outdoor-comfort/).
