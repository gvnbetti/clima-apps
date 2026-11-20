"""The 14 validation climates: Köppen groups A to D, latitudes 11 to 62° N. Files from weather/fetch.py and
weather/app_epw.js (Bologna: the file bundled in the apps, TMYx 2004-2018)."""
DENVER = "USA_CO_Denver.Intl.AP.725650_TMY3.epw"
CLIMATES = {   # key: file, ordered by latitude
    "ho_chi_minh_city": "VNM_SVN_Ho.Chi.Minh-Tan.Son.Nhat.Intl.AP.489000_TMYx.epw",   # Aw
    "miami": "USA_FL_Miami.Intl.AP.722020_TMY3.epw",                                    # Am
    "tampa": "USA_FL_Tampa.Intl.AP.722110_TMY3.epw",                                    # Cfa
    "dubai": "ARE_DU_Dubai.Intl.AP.411940_TMYx.epw",                                    # BWh
    "new_delhi": "IND_DL_New.Delhi-Safdarjung.AP.421820_TMYx.epw",                      # BSh
    "phoenix": "USA_AZ_Phoenix-Sky.Harbor.Intl.AP.722780_TMY3.epw",                     # BWh
    "san_francisco": "USA_CA_San.Francisco.Intl.AP.724940_TMY3.epw",                    # Csb
    "denver": DENVER,                                                                   # BSk
    "chicago": "USA_IL_Chicago-OHare.Intl.AP.725300_TMY3.epw",                          # Dfa
    "bologna": "app_bologna.epw",                                                       # Cfa
    "montreal": "CAN_QC_Montreal.Intl.AP.716270_CWEC2020.epw",                          # Dfb
    "mannheim": "DEU_BW_Mannheim.107290_TMYx.2007-2021.epw",                            # Cfb
    "vancouver": "CAN_BC_Vancouver.Intl.AP.718920_CWEC2020.epw",                        # Cfb
    "yellowknife": "CAN_NT_Yellowknife.AP.719360_CWEC2020.epw",                         # Dfc
}
KOPPEN = {"ho_chi_minh_city": "Aw", "miami": "Am", "tampa": "Cfa", "dubai": "BWh", "new_delhi": "BSh", "phoenix": "BWh", "san_francisco": "Csb",
          "denver": "BSk", "chicago": "Dfa", "bologna": "Cfa", "montreal": "Dfb", "mannheim": "Cfb", "vancouver": "Cfb", "yellowknife": "Dfc"}
