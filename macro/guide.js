/* Macro Clima guide: text only. Structure follows the CBE Clima documentation: getting a file, using the page,
   then every section and chart (what it shows, how to read it, method), then methods, glossary, units and sources.
   The method text of each chart is the card's own "info" text in app.js, so it is written once. */
(function (root) {
  "use strict";
  const G = {};

  G.start = [
    ["What Macro Clima is", `<p>Macro Clima describes the climate held in one EPW weather file, for the early stages of design and for teaching. It reads the file, computes what can be derived from it, and writes a short reading for each topic. It does not recommend. It is the largest of three scales: Macro Clima reads the climate of a place as the weather file records it, Micro Clima tests outdoor spaces on a site, Room Design Guide tests a room.</p>
<p>It rebuilds CBE Clima (Center for the Built Environment, UC Berkeley) as a single scrolling page: every chart can be inspected, changed and downloaded, and every number in the text links to the chart it comes from.</p>`],
    ["Choosing a weather file", `<p>There are three ways in, in the sidebar:</p>
<ul><li><b>Bundled files.</b> Eleven typical-year files from Climate.OneBuilding.Org, from Moscow to Singapore. They are also the reference climates in "Climate at a glance".</li>
<li><b>Map.</b> Search or click any of about 65,000 stations. The page cannot download from other sites, so the map gives the link to the file on Climate.OneBuilding.Org; download it, then drop it on the page.</li>
<li><b>Upload.</b> Drop an .epw file or the .zip from OneBuilding. Nothing leaves your browser.</li></ul>
<p>Prefer the TMYx files built from the most recent years (for example 2011-2025). A typical year is assembled from real months of different years; it shows typical conditions, not extremes, and not the climate of the coming decades.</p>`],
    ["Reading the page", `<p>Each section opens with a reading: a few sentences written by fixed rules from the numbers of the file. Underlined numbers are links: click one to jump to the chart it comes from. Below the reading are the cards.</p>
<ul><li><b>Menus</b> on a card change the variable, the view or the model shown.</li>
<li><b>?</b> opens this guide at that chart.</li>
<li><b>SVG, PNG, CSV</b> download the chart as a drawing, as an image, or the numbers behind it. Downloads carry the title, the file and the date.</li>
<li><b>Hover</b> any chart for exact values.</li></ul>`],
    ["Settings", `<ul><li><b>Filter.</b> Limit the year to some months and hours. Charts leave the other hours out of their totals or show them in grey.</li>
<li><b>Future climate.</b> Morph the file to 1.5, 2 or 3 °C of global warming (around 2030, 2050 and 2080 to 2100). Air temperature is shifted month by month by the change the CMIP6 models project for the file's IPCC region, measured from the file's own years; relative humidity is held; precipitation is scaled. Radiation, cloud and wind stay as recorded, and so do the day-night swing and the spread of hot and cold spells. Every section and download then names the level.</li>
<li><b>Urban context.</b> Weather files usually come from airports outside the city. Choose suburban, urban or dense, or set the sky view factor and vegetation fraction, to raise the air temperature by an estimated urban heat island (Theeuwes et al. 2017, the same model as Micro Clima). Every section then says so, and so does every download. Do not use it with stations that already stand in the city.</li>
<li><b>Units.</b> International (SI) or imperial (IP); wind optionally in km/h. All calculations run in SI and only what is shown changes; CSV downloads stay in SI.</li>
<li><b>Colour and axis ranges.</b> Local ranges stretch to the file; global ranges are fixed across files, as in CBE Clima, so two files can be compared by eye. Click any colour bar or axis to type a range by hand.</li>
<li><b>Degree days.</b> The heating and cooling base temperatures. For German stations the Gradtagzahl G 20/15 can be shown as well.</li></ul>`]
  ];

  G.sections = {
    summary: "The main figures of the file and where they sit among eleven reference climates, then the location, monthly temperature and radiation, and degree days.",
    temperature: "Air temperature and humidity through the year, the day and the hour, with an adaptive comfort band for reference.",
    extremes: "Hot and cold days, runs of them, the hottest and coldest weeks, and the extreme hours.",
    sun: "Where the sun is, how much radiation arrives, and how clear or overcast the sky is.",
    surfaces: "Radiation on the eight façade orientations and on the roof.",
    pv: "Sunlight on panels turned into electricity per kWp and per m² of panel or roof, with fixed assumptions. It describes the resource; it does not size a system.",
    daylight: "Outdoor illuminance, where the file records it.",
    wind: "Where the wind comes from, how strong it is, by season and by day and night.",
    psychro: "Temperature and humidity together, the passive strategy zones of Givoni and Milne, and hours suited to natural ventilation.",
    water: "Precipitation, wind-driven rain on façades, and snow.",
    outdoor: "How the outdoor climate feels to a person, in the sun or shade and in or out of the wind, by the UTCI.",
    future: "How the climate of this file changes at 1.5, 2 and 3 °C of global warming, from CMIP6 models as aggregated by the IPCC AR6 Atlas, and whether its region warms more or less than the world.",
    quality: "What the file contains: its source, its years, and missing or doubtful data.",
    explorer: "Any variable of the file or derived from it, hour by hour or against another variable."
  };

  // how to read each chart; what it shows comes from the card's title and subtitle, the method from its info text
  G.read = {
    "c-glance": "Each row places one figure of this file (the dot) among the reference climates (the ticks). The rank counts this file too. A rank is not a judgement: a low heating figure is neither good nor bad.",
    "c-identity": "Station, coordinates, elevation and the Köppen-Geiger class of the location, with the source of the file.",
    "c-monthT": "For each month, the band spans the mean daily minimum to the mean daily maximum, with the monthly mean between. The widest bands are the months with the largest day-night swing.",
    "c-monthR": "Daily radiation on a horizontal surface, as a monthly mean, split into direct and diffuse. The diffuse part comes from the whole sky and does not depend on orientation.",
    "c-dd": "Degree days for each month. Heating degree days scale with heat lost to the outside, cooling degree days with heat brought in by outdoor air. They describe the climate, not a building.",
    "c-daily": "Every day of the year: the range from minimum to maximum, and the daily mean. The shaded band is the chosen adaptive comfort band, drawn lighter on days outside the range the standard covers.",
    "c-profiles": "The average day of each month, hour by hour, with the range of the month around it. Compare the shape of winter and summer days, and when in the day the peaks fall.",
    "c-uhi": "Shown only with an urban context. The carpet gives the heat island added to each hour: largest on clear, calm nights after warm days, smallest around midday. The table compares the file as recorded with the file plus the heat island. The step at 08:00 is where the model passes from one day's value to the next.",
    "c-carpet": "Days across, hours down: each pixel is one hour of the year. Bands of colour show daily and seasonal patterns at once; grey hours are outside the filter.",
    "c-calendar": "Each square is a day, coloured by the events of that day: summer days, hot days, tropical nights, frost days, ice days and overcast days.",
    "c-weeks": "The grey line is each day's mean; the dark line is the mean of the seven days starting that day. The shaded bands mark the hottest (red) and the coldest (blue) week.",
    "c-hotweek": "The hottest week and a day on either side, hour by hour, so the build-up and the release can be read. Nights are shaded.",
    "c-coldweek": "The coldest week and a day on either side, hour by hour. Nights are shaded.",
    "c-sunpath": "The sun's position at every hour of the year, coloured by a variable. Arcs are the 21st of each month; figures of eight (analemmas) are the same clock hour through the year. With no data overlay the arcs turn orange. Choose equidistant (distance from the centre proportional to the angle from the zenith), orthographic (the sky dome seen from straight above, which crowds the low sun towards the edge as a plan drawing of the sun path would), cylindrical or 3D.",
    "c-sunsection": "The sun path seen from the side along the north-south line. Rays show the sun at solar noon at the solstices and the equinoxes; the table gives the noon altitude, the side the sun is on, and the clock time of solar noon.",
    "c-sky": "Hours that are clear, partly cloudy or overcast, by month, from the total sky cover recorded in the file. All hours, day and night, or daylight hours only.",
    "c-suncarpet": "Radiation or cloud cover hour by hour. Long dark gaps in daytime mean overcast spells.",
    "c-orient": "Annual radiation on each vertical orientation and on the roof. The lengths compare directly; the roof value stands at the side.",
    "c-orientSeason": "Radiation on each surface in the three summer and the three winter months. A façade that receives more in winter than in summer gains most when heat is wanted.",
    "c-orientM": "The same as a table, month by month, coloured on one scale.",
    "c-surfcarpet": "Hour by hour radiation on each façade and the roof, laid out as on a plan with north at the top, all on one colour scale.",
    "c-pvMap": "Each cell is one tilt and orientation, coloured by its yield as a share of the best. The circle marks the best fixed plane; the top row is the vertical façades. The broad light area shows how much tilt and orientation can vary before yield falls.",
    "c-pvYear": "Annual yield per m² of panel, or per kWp, for the best plane, a flat panel, and the main façades.",
    "c-pvMonthly": "The same surfaces month by month. Steep surfaces flatten the year; flat panels follow the summer sun.",
    "c-pvLoss": "From sunlight on the panel to electricity, step by step: reflection at the glass, heat, system losses and the inverter. The last rows give electricity as a share of sunlight, and per area of panel.",
    "c-pvRoof": "Rows on a flat roof shade each other. Across: how much of the roof is covered by panel. Each line is one tilt. Per m² of roof, dense flat panels usually win; per kWp, tilted rows spaced apart do. The diamonds mark the spacing that avoids shade between 10h and 14h on the winter solstice.",
    "c-pvRoofCmp": "A few common layouts side by side, per m² of roof, with their cover, spacing, shading loss and yield per kWp.",
    "c-pvCarpet": "Electricity per kWp, hour by hour, for one surface.",
    "c-lux": "Hours a day, by month, when outdoor illuminance exceeds 10, 20 and 50 klx.",
    "c-luxcarpet": "Outdoor illuminance hour by hour.",
    "c-rose": "Each petal points to where the wind comes from; its length is the share of hours, its bands the speed. Follows the filter.",
    "c-roseD": "Wind roses for hours with the sun up and with the sun down.",
    "c-roseS": "Wind roses for each season.",
    "c-ws": "Wind speed hour by hour. Speeds are at the station mast, usually 10 m above open ground; near buildings they are lower and gustier.",
    "c-psy": "Each cell counts hours with that temperature (across) and water content of the air (up). Curves are relative humidity. Outlined zones show where each passive strategy can bring indoor conditions into the comfort zone.",
    "c-zones": "Share of hours in the comfort zone and in each strategy zone. Zones overlap, so shares do not add up.",
    "c-zcarpet": "The zones hour by hour, to see when in the day and year each strategy would act.",
    "c-nv": "Hours when outdoor air lies within the chosen temperature and dew point limits, as in CBE Clima's natural ventilation filter. Change the limits in the card.",
    "c-prec": "Precipitation by month. Many typical-year files hold no reliable precipitation; the reading says when the data look doubtful.",
    "c-rain": "Wind-driven rain on each façade orientation over the year, by the ISO 15927-3 airfield index.",
    "c-snow": "Snow depth through the year, where the file records it.",
    "c-utci-sw": "UTCI hour by hour for a person in the sun and the wind, coloured by thermal stress class.",
    "c-utci-sn": "The same in the sun, with wind reduced to 0.5 m/s.",
    "c-utci-hw": "The same in shade and in the wind.",
    "c-utci-hn": "The same in shade, out of the wind.",
    "c-utciM": "Hours in each stress class by month, for the chosen scenario.",
    "c-dmrt": "How much the sun raises the mean radiant temperature of a person standing in the open.",
    "c-dlw": "How much the cold sky lowers the mean radiant temperature by longwave exchange, by day and night.",
    "c-dwind": "UTCI in the wind minus UTCI in still air: how much the wind cools, or in hot dry air warms, a person.",
    "c-futT": "The change in each month's mean temperature, from the years the file was built from to each warming level. Lines are the median of the models, bands their spread. This is the shift applied when the file is morphed.",
    "c-futP": "The change in each month's precipitation, as a percentage. Bands are wide: models agree less on rain than on temperature.",
    "c-futReg": "Warming since 1850-1900 at each global level: the world, all land, and this region by year and season, with the ratio to the global figure. Land warms faster than the oceans, so most regions sit above 1. Shaded cells mark a region that warms more (warm) or less (cool) than the global mean by more than 10 %.",
    "c-futCmp": "The same indicators counted on the file as recorded and on the file morphed to each level. Days and hours are counts in the typical year.",
    "c-quality": "The source and years of the file, and which fields are missing, filled or doubtful.",
    "c-exCarpet": "Any variable hour by hour. Use the filter above the card to keep only hours where a variable lies in a range.",
    "c-exScatter": "One variable against another, each dot one hour, optionally coloured by a third."
  };

  G.glossary = [
    ["EPW", "EnergyPlus Weather file: 8,760 hourly records of one year, with location, temperature, humidity, radiation, wind and more."],
    ["TMY, TMYx", "Typical meteorological year: twelve real months chosen from different years to match long-term statistics. TMYx files on OneBuilding use recent ISD data."],
    ["GHI, DNI, DHI", "Global horizontal, direct normal and diffuse horizontal irradiance: the total on a horizontal surface, the beam on a surface facing the sun, and the part from the sky."],
    ["Irradiance, irradiation", "Irradiance is power per area (W/m²); irradiation is energy over time (kWh/m²)."],
    ["Dew point", "The temperature at which air becomes saturated. It measures the water in the air without depending on air temperature."],
    ["Humidity ratio", "Grams of water vapour per kilogram of dry air."],
    ["Degree days", "Over a year, the sum of daily differences between a base temperature and the daily mean, on days on the relevant side of the base."],
    ["Adaptive comfort", "Indoor temperatures accepted in naturally ventilated buildings, rising with the recent outdoor temperature (EN 16798-1, ASHRAE 55)."],
    ["Mean radiant temperature (MRT)", "The uniform surface temperature that would exchange the same radiant heat with a person as the real surroundings, including sun and sky."],
    ["UTCI", "Universal Thermal Climate Index: the air temperature of a reference environment that would cause the same strain as the actual conditions."],
    ["Analemma", "The figure of eight traced by the sun at the same clock time over a year."],
    ["Perez model", "Splits diffuse sky light into a uniform part, a bright area around the sun and a bright horizon band, to compute radiation on tilted surfaces."],
    ["kWp", "Kilowatt-peak: panel output at standard test conditions (1000 W/m², 25 °C). Yield per kWp does not depend on panel efficiency."],
    ["Cover", "On a flat roof, panel area divided by roof area. Rows of tilted panels need spacing, which lowers the cover."],
    ["Global warming level", "Global mean surface temperature above 1850-1900, averaged over 20 years. About 1.4 °C in 2025."],
    ["Morphing", "Changing a present weather file by the monthly change a climate model projects, keeping its hour-by-hour sequence (Belcher et al. 2005)."],
    ["CMIP6", "The sixth phase of the Coupled Model Intercomparison Project: the set of climate model runs assessed by IPCC AR6."],
    ["Köppen-Geiger", "A classification of climates by temperature and precipitation, for example Cfb, temperate oceanic."]
  ];

  G.units = [["Temperature", "°C", "°F"], ["Temperature difference", "K", "°F"], ["Degree days", "Kd", "°F·d"], ["Irradiance", "W/m²", "Btu/h·ft²"], ["Irradiation", "kWh/m²", "kBtu/ft²"], ["PV yield per area", "kWh/m²", "kWh/ft²"], ["Wind speed", "m/s or km/h", "mph"], ["Precipitation, snow", "mm, cm", "in"], ["Length, elevation", "m", "ft"], ["Humidity ratio", "g/kg", "gr/lb"], ["Pressure", "hPa", "inHg"], ["Illuminance", "klx", "kfc"]];

  root.CLIMA_GUIDE = G;
})(this);
