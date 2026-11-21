# Micro Clima: method

## What it is for
Testing design moves for an outdoor space: a square, a courtyard, a street, a terrace. Micro Clima counts the hours
of heat and cold stress at a point in the centre of the space, with UTCI, and compares options: trees or a canopy,
paving or grass, a wall or a courtyard, more or less wind shelter. The weather file describes the open site; the
model works out how the space changes it.

## How it works
The engine is the script `engine` in `micro/index.html`. Each hour of the year:

| Part | Method | Source |
|---|---|---|
| Neighbourhood air temperature | weather file plus urban heat island; daytime canopy cooling only above 40 % canopy cover (placeholder strength) | Theeuwes et al. 2017; Ziter et al. 2019 |
| Ground surface | one-dimensional implicit heat balance to 4 m depth: sun, longwave, convection, evaporation by moisture availability | Oke 1987; material values in the guide, "Where the values come from" |
| Walls | per orientation, the same surface balance with a fixed indoor temperature | |
| Mean radiant temperature | longwave by view factors (sky, ground, canopy, walls) plus SolarCal for the sun on the body, standing or seated | Arens et al. 2015 |
| Trees | big-leaf energy balance of the canopy; transmission of sun with and without leaves | sourced in the guide |
| Built canopy | thin sheet in balance, white membrane (10 % transmitted, 15 % absorbed) | |
| Enclosures | open field, single wall, courtyard and street canyons at H/W 0.5, 1, 2; exact sky view factors and sun access at the centre point | geometry |
| Wind | 10 m wind times shelter and enclosure factors (placeholders) | |
| Comfort | UTCI, operational polynomial, with its stress classes | Bröde et al. 2012 |
| Future and urban climate | see [Future and urban climate](climate-scenarios.md) | |

## Assumptions
- One point at the centre of the space. Conditions near a wall or at the edge of a tree's shade differ.
- Sun and sky are exact for the centre point, but walls do not shade each other: each wall is as warm as if it stood
  alone in the sun.
- Placeholders, still to be sourced: the wind shelter factors, the enclosure wind factors, the strength of canopy
  cooling and the moisture of permeable paving.

## Limits
- Wind is scaled, not simulated. Gusts, corner winds and channelling are outside the model.
- Enclosures are a fixed set of shapes. A real space is matched to the nearest one.
- The heat island uses Micro Clima's own sun position: up to 0.77 K apart from Macro Clima in about 2 % of hours,
  around sunrise and sunset.

## Validation
[Outdoor comfort](../../validation/outdoor-comfort/): UTCI and SolarCal identical to pythermalcomfort, sun within 0.4°
of pvlib, wall and ground balances against exact solutions, and the ranking of 70 designs against Ladybug Tools (rank
correlation 0.97).
