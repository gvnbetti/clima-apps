#!/bin/sh
# Fetches the regional CMIP6 data of the IPCC AR6 WGI Atlas (Iturbide et al. 2021, CC BY 4.0) at a fixed commit:
# monthly regional means of temperature and precipitation, the warming-level crossing years, the reference regions.
# About 400 MB. Target: $WORK/atlas (default validation/_work/atlas).
set -e
W=${WORK:-$(dirname "$0")/../_work}/atlas
COMMIT=ed29da33d38ae767d19caafd4cde06042cbe00f4
[ -d "$W/.git" ] || { git init -q "$W"; git -C "$W" remote add o https://github.com/IPCC-WG1/Atlas.git; }
git -C "$W" config core.sparseCheckout true
printf "datasets-aggregated-regionally/data/CMIP6/CMIP6_tas_land/*\ndatasets-aggregated-regionally/data/CMIP6/CMIP6_tas_landsea/*\ndatasets-aggregated-regionally/data/CMIP6/CMIP6_pr_land/*\nwarming-levels/*\nreference-regions/IPCC-WGI-reference-regions-v4.geojson\n" > "$W/.git/info/sparse-checkout"
git -C "$W" fetch -q --depth 1 --filter=blob:none o $COMMIT
git -C "$W" checkout -q FETCH_HEAD
echo "Atlas at $(git -C "$W" rev-parse HEAD) in $W"
