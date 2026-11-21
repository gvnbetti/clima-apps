# Shared code

`climamods.js` is the calculation core of Clima Toolbox: sun position (NOAA), sun on surfaces (Perez 1990),
psychrometrics, SolarCal, sky longwave, UTCI, future climate (IPCC AR6 Atlas, Belcher et al. 2005 morphing) and the
urban heat island (Theeuwes et al. 2017). `mkmods.py` copies it verbatim from Macro Clima, so Macro, Micro and Room
Clima compute these the same way:

```
python3 shared/mkmods.py macro shared/climamods.js
python3 shared/addcore.py micro/index.html
cd room && python3 build.py
```

The module carries a fingerprint of the Macro Clima source it came from. Change the calculations in Macro Clima only,
then regenerate.
