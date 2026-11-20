"""Downloads the reference weather files of the validation from public GitHub repositories at fixed commits and checks
each against its SHA-256. The six weather files bundled in Room Clima are written separately by app_epw.js.
Usage: python3 fetch.py"""
import hashlib, os, sys, urllib.request
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from paths import WX

FILES = [
    ("ARE_DU_Dubai.Intl.AP.411940_TMYx.epw", "https://raw.githubusercontent.com/NREL/openstudio-standards/83b1e64c6f130f02b48c8b3ad4eeb3eb4da41663/data/weather/ARE_DU_Dubai.Intl.AP.411940_TMYx.epw", "b24a98da6950f7e9eb2742d4a73375547244c2f3c0f595cafa870f53603ee00d"),
    ("CAN_BC_Vancouver.Intl.AP.718920_CWEC2020.epw", "https://raw.githubusercontent.com/NREL/openstudio-standards/83b1e64c6f130f02b48c8b3ad4eeb3eb4da41663/data/weather/CAN_BC_Vancouver.Intl.AP.718920_CWEC2020.epw", "6bd0469ca4b6e3449906243f3739d215e366b8bb05952104f15e7b31af6ce473"),
    ("CAN_NT_Yellowknife.AP.719360_CWEC2020.epw", "https://raw.githubusercontent.com/NREL/openstudio-standards/83b1e64c6f130f02b48c8b3ad4eeb3eb4da41663/data/weather/CAN_NT_Yellowknife.AP.719360_CWEC2020.epw", "5b5af44b1d227afa2493bf74cdc4e036cf5d1aa247eb0601a319a0587d3ef885"),
    ("CAN_QC_Montreal.Intl.AP.716270_CWEC2020.epw", "https://raw.githubusercontent.com/NREL/openstudio-standards/83b1e64c6f130f02b48c8b3ad4eeb3eb4da41663/data/weather/CAN_QC_Montreal.Intl.AP.716270_CWEC2020.epw", "90a9e28ec82dd18911c3a62313d53b2dacf83f018dea41e7223da199c60d2193"),
    ("DEU_BW_Mannheim.107290_TMYx.2007-2021.epw", "https://raw.githubusercontent.com/IWUGERMANY/DIBS---Dynamic-ISO-Building-Simulator/c6d69e4f39bfb8e8c3af6cddefb232aaeea30eed/iso_simulator/auxiliary/weather_data/weather_data_TMYx_2007_2021/DEU_BW_Mannheim.107290_TMYx.2007-2021.epw", "4370be605366ddd7c5dd7d298bcc9e4d736a367e36e2273c3dbdf08153ac84f0"),
    ("IND_DL_New.Delhi-Safdarjung.AP.421820_TMYx.epw", "https://raw.githubusercontent.com/NREL/openstudio-standards/83b1e64c6f130f02b48c8b3ad4eeb3eb4da41663/data/weather/IND_DL_New.Delhi-Safdarjung.AP.421820_TMYx.epw", "d4fe65f79cf3fae1b0c4cfa11e8211e8a8bf8958f94fb7485039c91561d18614"),
    ("USA_AZ_Phoenix-Sky.Harbor.Intl.AP.722780_TMY3.epw", "https://raw.githubusercontent.com/NREL/openstudio-standards/83b1e64c6f130f02b48c8b3ad4eeb3eb4da41663/data/weather/USA_AZ_Phoenix-Sky.Harbor.Intl.AP.722780_TMY3.epw", "cfe23924e6dddaa1c1e94a075166fefa342789d594247f6c98a338f5980c418d"),
    ("USA_CA_San.Francisco.Intl.AP.724940_TMY3.epw", "https://raw.githubusercontent.com/NREL/openstudio-standards/83b1e64c6f130f02b48c8b3ad4eeb3eb4da41663/data/weather/USA_CA_San.Francisco.Intl.AP.724940_TMY3.epw", "b69e012e7ff8a5d3e610a19acc1ceb84926feae1f4347192b9388459423bf29c"),
    ("USA_CO_Denver.Intl.AP.725650_TMY3.epw", "https://raw.githubusercontent.com/NREL/openstudio-standards/83b1e64c6f130f02b48c8b3ad4eeb3eb4da41663/data/weather/USA_CO_Denver.Intl.AP.725650_TMY3.epw", "6aacee75402057baefa50d14873d07b70e33c535d3aded200f4393bf2ae6077d"),
    ("USA_FL_Miami.Intl.AP.722020_TMY3.epw", "https://raw.githubusercontent.com/NREL/openstudio-standards/83b1e64c6f130f02b48c8b3ad4eeb3eb4da41663/data/weather/USA_FL_Miami.Intl.AP.722020_TMY3.epw", "8eecf4b472e70576b9363234116ae5029738bb46439d1d2f4280f0296c1f6894"),
    ("USA_FL_Tampa.Intl.AP.722110_TMY3.epw", "https://raw.githubusercontent.com/NREL/EnergyPlus/v24.2.0/weather/USA_FL_Tampa.Intl.AP.722110_TMY3.epw", "70bfcdf8a79b9df57f062e0ba94cda9b9316ea53e3c1130a24b6c230eec90c45"),
    ("USA_IL_Chicago-OHare.Intl.AP.725300_TMY3.epw", "https://raw.githubusercontent.com/NREL/openstudio-standards/83b1e64c6f130f02b48c8b3ad4eeb3eb4da41663/data/weather/USA_IL_Chicago-OHare.Intl.AP.725300_TMY3.epw", "3cc3dc0c7bcc93e7203e8d9aab657d384315f5a0c86cdede23f792d437a0309f"),
    ("VNM_SVN_Ho.Chi.Minh-Tan.Son.Nhat.Intl.AP.489000_TMYx.epw", "https://raw.githubusercontent.com/NREL/openstudio-standards/83b1e64c6f130f02b48c8b3ad4eeb3eb4da41663/data/weather/VNM_SVN_Ho.Chi.Minh-Tan.Son.Nhat.Intl.AP.489000_TMYx.epw", "e191a48f9937eb9c77fea5d1f1c4b1a68928460b934c8ee835daa867510271d6"),
]

os.makedirs(WX, exist_ok=True)
bad = 0
for name, url, sha in FILES:
    path = os.path.join(WX, name)
    if not os.path.exists(path):
        urllib.request.urlretrieve(url, path)
    h = hashlib.sha256(open(path, "rb").read()).hexdigest()
    ok = h == sha
    bad += not ok
    print(("ok   " if ok else "BAD  ") + name)
sys.exit(1 if bad else 0)
