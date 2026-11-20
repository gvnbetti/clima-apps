# Micro Clima: method

Micro Clima tests design moves for an outdoor space: shade, ground, wind shelter and enclosure. It counts the hours of
thermal stress at a point in the centre of the space, using UTCI. The engine is the script `engine` in
`micro/index.html`.

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
| Future climate | shared with Macro Clima | `validation/future-climate/` |

Placeholders, still to be sourced: wind shelter factors, enclosure wind factors and the moisture of permeable paving.
Code checks and the comparison with Ladybug are in `validation/outdoor-comfort/`.
