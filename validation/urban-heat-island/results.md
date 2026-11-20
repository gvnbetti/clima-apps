# Urban heat island: the apps against the equation

Worked example (S from 100 W/m² daily mean, DTR 8 K, U 3 m/s, SVF 0.5, Fveg 0.2): UHImax = 2.521 K by hand.

| File | Neighbourhood | Daily maximum, mean | Independent vs Macro Clima, largest hourly difference | Room Clima (shared modifiers) vs Macro Clima | Micro Clima vs Macro Clima | Annual mean | Night mean |
|---|---|---|---|---|---|---|---|
| ARE_DU_Dubai.Intl.AP.411940_TMYx | SVF 0.8, Fveg 0.35 | 2.33 K | 0.0001 K | 0.0000 K | 0.2366 K | 1.57 K | 2.32 K |
| ARE_DU_Dubai.Intl.AP.411940_TMYx | SVF 0.6, Fveg 0.2 | 3.29 K | 0.0001 K | 0.0000 K | 0.3340 K | 2.22 K | 3.28 K |
| ARE_DU_Dubai.Intl.AP.411940_TMYx | SVF 0.4, Fveg 0.1 | 4.11 K | 0.0001 K | 0.0000 K | 0.4175 K | 2.77 K | 4.10 K |
| CAN_BC_Vancouver.Intl.AP.718920_CWEC2020 | SVF 0.8, Fveg 0.35 | 1.38 K | 0.0001 K | 0.0000 K | 0.2251 K | 0.91 K | 1.30 K |
| CAN_BC_Vancouver.Intl.AP.718920_CWEC2020 | SVF 0.6, Fveg 0.2 | 1.95 K | 0.0001 K | 0.0000 K | 0.3178 K | 1.28 K | 1.83 K |
| CAN_BC_Vancouver.Intl.AP.718920_CWEC2020 | SVF 0.4, Fveg 0.1 | 2.43 K | 0.0001 K | 0.0000 K | 0.3972 K | 1.60 K | 2.29 K |
| CAN_NT_Yellowknife.AP.719360_CWEC2020 | SVF 0.8, Fveg 0.35 | 1.60 K | 0.0001 K | 0.0000 K | 0.4369 K | 1.02 K | 1.39 K |
| CAN_NT_Yellowknife.AP.719360_CWEC2020 | SVF 0.6, Fveg 0.2 | 2.25 K | 0.0001 K | 0.0000 K | 0.6168 K | 1.44 K | 1.96 K |
| CAN_NT_Yellowknife.AP.719360_CWEC2020 | SVF 0.4, Fveg 0.1 | 2.82 K | 0.0001 K | 0.0000 K | 0.7710 K | 1.80 K | 2.45 K |
| CAN_QC_Montreal.Intl.AP.716270_CWEC2020 | SVF 0.8, Fveg 0.35 | 1.67 K | 0.0000 K | 0.0000 K | 0.2723 K | 1.11 K | 1.60 K |
| CAN_QC_Montreal.Intl.AP.716270_CWEC2020 | SVF 0.6, Fveg 0.2 | 2.36 K | 0.0000 K | 0.0000 K | 0.3844 K | 1.56 K | 2.26 K |
| CAN_QC_Montreal.Intl.AP.716270_CWEC2020 | SVF 0.4, Fveg 0.1 | 2.95 K | 0.0000 K | 0.0000 K | 0.4805 K | 1.95 K | 2.82 K |
| DEU_BW_Mannheim.107290_TMYx.2007-2021 | SVF 0.8, Fveg 0.35 | 1.89 K | 0.0001 K | 0.0000 K | 0.3380 K | 1.24 K | 1.76 K |
| DEU_BW_Mannheim.107290_TMYx.2007-2021 | SVF 0.6, Fveg 0.2 | 2.67 K | 0.0001 K | 0.0000 K | 0.4771 K | 1.75 K | 2.48 K |
| DEU_BW_Mannheim.107290_TMYx.2007-2021 | SVF 0.4, Fveg 0.1 | 3.34 K | 0.0001 K | 0.0000 K | 0.5964 K | 2.18 K | 3.10 K |
| IND_DL_New.Delhi-Safdarjung.AP.421820_TMYx | SVF 0.8, Fveg 0.35 | 3.12 K | 0.0001 K | 0.0000 K | 0.3848 K | 2.11 K | 3.14 K |
| IND_DL_New.Delhi-Safdarjung.AP.421820_TMYx | SVF 0.6, Fveg 0.2 | 4.40 K | 0.0001 K | 0.0000 K | 0.5433 K | 2.98 K | 4.44 K |
| IND_DL_New.Delhi-Safdarjung.AP.421820_TMYx | SVF 0.4, Fveg 0.1 | 5.50 K | 0.0001 K | 0.0000 K | 0.6791 K | 3.73 K | 5.54 K |
| USA_AZ_Phoenix-Sky.Harbor.Intl.AP.722780_TMY3 | SVF 0.8, Fveg 0.35 | 2.93 K | 0.0001 K | 0.0000 K | 0.3518 K | 1.97 K | 2.90 K |
| USA_AZ_Phoenix-Sky.Harbor.Intl.AP.722780_TMY3 | SVF 0.6, Fveg 0.2 | 4.13 K | 0.0001 K | 0.0000 K | 0.4967 K | 2.78 K | 4.09 K |
| USA_AZ_Phoenix-Sky.Harbor.Intl.AP.722780_TMY3 | SVF 0.4, Fveg 0.1 | 5.16 K | 0.0001 K | 0.0000 K | 0.6209 K | 3.47 K | 5.11 K |
| USA_CA_San.Francisco.Intl.AP.724940_TMY3 | SVF 0.8, Fveg 0.35 | 1.73 K | 0.0000 K | 0.0000 K | 0.2475 K | 1.16 K | 1.71 K |
| USA_CA_San.Francisco.Intl.AP.724940_TMY3 | SVF 0.6, Fveg 0.2 | 2.45 K | 0.0001 K | 0.0000 K | 0.3495 K | 1.64 K | 2.41 K |
| USA_CA_San.Francisco.Intl.AP.724940_TMY3 | SVF 0.4, Fveg 0.1 | 3.06 K | 0.0001 K | 0.0000 K | 0.4368 K | 2.04 K | 3.01 K |
| USA_CO_Denver.Intl.AP.725650_TMY3 | SVF 0.8, Fveg 0.35 | 2.73 K | 0.0000 K | 0.0000 K | 0.3920 K | 1.83 K | 2.69 K |
| USA_CO_Denver.Intl.AP.725650_TMY3 | SVF 0.6, Fveg 0.2 | 3.86 K | 0.0001 K | 0.0000 K | 0.5533 K | 2.58 K | 3.80 K |
| USA_CO_Denver.Intl.AP.725650_TMY3 | SVF 0.4, Fveg 0.1 | 4.82 K | 0.0001 K | 0.0000 K | 0.6917 K | 3.22 K | 4.75 K |
| USA_FL_Miami.Intl.AP.722020_TMY3 | SVF 0.8, Fveg 0.35 | 1.62 K | 0.0000 K | 0.0000 K | 0.1714 K | 1.09 K | 1.62 K |
| USA_FL_Miami.Intl.AP.722020_TMY3 | SVF 0.6, Fveg 0.2 | 2.29 K | 0.0001 K | 0.0000 K | 0.2420 K | 1.55 K | 2.29 K |
| USA_FL_Miami.Intl.AP.722020_TMY3 | SVF 0.4, Fveg 0.1 | 2.86 K | 0.0001 K | 0.0000 K | 0.3025 K | 1.93 K | 2.86 K |
| USA_FL_Tampa.Intl.AP.722110_TMY3 | SVF 0.8, Fveg 0.35 | 2.19 K | 0.0000 K | 0.0000 K | 0.3205 K | 1.47 K | 2.18 K |
| USA_FL_Tampa.Intl.AP.722110_TMY3 | SVF 0.6, Fveg 0.2 | 3.08 K | 0.0000 K | 0.0000 K | 0.4524 K | 2.08 K | 3.07 K |
| USA_FL_Tampa.Intl.AP.722110_TMY3 | SVF 0.4, Fveg 0.1 | 3.86 K | 0.0000 K | 0.0000 K | 0.5656 K | 2.60 K | 3.84 K |
| USA_IL_Chicago-OHare.Intl.AP.725300_TMY3 | SVF 0.8, Fveg 0.35 | 1.89 K | 0.0001 K | 0.0000 K | 0.3686 K | 1.25 K | 1.82 K |
| USA_IL_Chicago-OHare.Intl.AP.725300_TMY3 | SVF 0.6, Fveg 0.2 | 2.66 K | 0.0001 K | 0.0000 K | 0.5204 K | 1.77 K | 2.57 K |
| USA_IL_Chicago-OHare.Intl.AP.725300_TMY3 | SVF 0.4, Fveg 0.1 | 3.33 K | 0.0001 K | 0.0000 K | 0.6505 K | 2.21 K | 3.21 K |
| VNM_SVN_Ho.Chi.Minh-Tan.Son.Nhat.Intl.AP.489000_TMYx | SVF 0.8, Fveg 0.35 | 2.07 K | 0.0000 K | 0.0000 K | 0.1578 K | 1.40 K | 2.07 K |
| VNM_SVN_Ho.Chi.Minh-Tan.Son.Nhat.Intl.AP.489000_TMYx | SVF 0.6, Fveg 0.2 | 2.93 K | 0.0001 K | 0.0000 K | 0.2228 K | 1.98 K | 2.93 K |
| VNM_SVN_Ho.Chi.Minh-Tan.Son.Nhat.Intl.AP.489000_TMYx | SVF 0.4, Fveg 0.1 | 3.66 K | 0.0001 K | 0.0000 K | 0.2785 K | 2.47 K | 3.66 K |

Largest hourly difference over all cases: independent implementation 0.0001 K; Room Clima 0.0000 K; Micro Clima 0.7710 K (all against Macro Clima).

Micro Clima computes the sun with its own, simpler solar position (within 0.85° of Macro Clima's); its heat island differs from Macro Clima's by more than 0.1 K in 2.2% of hours at most (sunrise and sunset hours, where the daily profile switches), its annual mean by at most 0.007 K, and at night by at most 0.029 K.
