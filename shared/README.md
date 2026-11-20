# Shared code

`mkmods.py` extracts the weather modifiers (future climate after IPCC AR6 Atlas and Belcher et al. 2005, urban heat island after Theeuwes et al. 2017, region lookup) verbatim from Macro Clima and writes them as one module for the other apps:

```
python3 shared/mkmods.py macro room/src/climamods.js
```

The module carries a fingerprint of the Macro Clima source it came from. Micro Clima v8 has the same code inlined. Change the modifiers in Macro Clima only, then regenerate.
