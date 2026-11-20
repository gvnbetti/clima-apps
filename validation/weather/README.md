# Weather files of the validation

`fetch.py` downloads 13 reference weather files from public GitHub repositories at fixed commits and checks each
against its SHA-256. `app_epw.js` writes the six weather files bundled in the apps to EPW, so that EnergyPlus and
Radiance read exactly the weather the apps use. Files go to `weather/files/` (not kept in git).

| Climate | Köppen | File | Source |
|---|---|---|---|
| Ho Chi Minh City | Aw | VNM_SVN_Ho.Chi.Minh-Tan.Son.Nhat.Intl.AP.489000_TMYx | NREL/openstudio-standards, commit 83b1e64 |
| Miami | Am | USA_FL_Miami.Intl.AP.722020_TMY3 | NREL/openstudio-standards |
| Tampa | Cfa | USA_FL_Tampa.Intl.AP.722110_TMY3 | NREL/EnergyPlus, tag v24.2.0 |
| Dubai | BWh | ARE_DU_Dubai.Intl.AP.411940_TMYx | NREL/openstudio-standards |
| New Delhi | BSh | IND_DL_New.Delhi-Safdarjung.AP.421820_TMYx | NREL/openstudio-standards |
| Phoenix | BWh | USA_AZ_Phoenix-Sky.Harbor.Intl.AP.722780_TMY3 | NREL/openstudio-standards |
| San Francisco | Csb | USA_CA_San.Francisco.Intl.AP.724940_TMY3 | NREL/openstudio-standards |
| Denver | BSk | USA_CO_Denver.Intl.AP.725650_TMY3 (also the Standard 140 file) | NREL/openstudio-standards |
| Chicago | Dfa | USA_IL_Chicago-OHare.Intl.AP.725300_TMY3 | NREL/openstudio-standards |
| Montreal | Dfb | CAN_QC_Montreal.Intl.AP.716270_CWEC2020 | NREL/openstudio-standards |
| Mannheim | Cfb | DEU_BW_Mannheim.107290_TMYx.2007-2021 | IWUGERMANY/DIBS, commit c6d69e4 |
| Vancouver | Cfb | CAN_BC_Vancouver.Intl.AP.718920_CWEC2020 | NREL/openstudio-standards |
| Yellowknife | Dfc | CAN_NT_Yellowknife.AP.719360_CWEC2020 | NREL/openstudio-standards |
| Bologna | Cfa | the file bundled in the apps (TMYx 2004-2018), written by `app_epw.js` | this repository |

The files bundled in the apps (written as `app_<city>.epw`): Mannheim, Bologna, San Francisco, Phoenix, Dubai, Ho Chi
Minh City. They hold the fields the apps use: air and dew point temperature, pressure, sky infrared, direct and diffuse
radiation, wind speed. Global horizontal radiation is recomputed from direct and diffuse; other fields carry EPW missing
codes.

TMYx: Lawrie and Crawley, climate.onebuilding.org. TMY3: NREL. CWEC2020: Environment and Climate Change Canada.
