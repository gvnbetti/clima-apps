# Room Clima v16 validation

- `energyplus_v16.txt`: 216 cases against EnergyPlus 24.2, with the app's hourly operation (blinds, airing, night
  ventilation) imposed on the EnergyPlus model.
- `radiance_blinds_v16.txt`: daylight (UDI) against Radiance, two-phase daylight coefficients, blinds as a diffusing layer.

Weather: the Mannheim rows of both results were computed with the Mannheim file bundled before 20 Nov 2026 (a German
test reference year of unverified version). It was replaced by Mannheim TMYx 2007-2021 so the repository can be
public. The validation compares the app and the reference on the same weather, so its conclusions hold; the Mannheim
numbers will change slightly when rerun with the new file. Bologna and Dubai are unchanged.
