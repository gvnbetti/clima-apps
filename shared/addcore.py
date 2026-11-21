"""Puts the shared calculation core (shared/climamods.js) into Micro Clima's engine script, so the page and its Web
Workers (which are started from the engine script's text) compute with the same code as Macro and Room Clima.
The core sits between two marker comments at the top of <script id="engine">; running this again replaces it.
Usage (from the repository root): python3 shared/addcore.py micro/index.html"""
import sys, re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
core = (ROOT / 'shared' / 'climamods.js').read_text().replace('</script', '<\\/script')
for f in sys.argv[1:]:
    p = pathlib.Path(f); s = p.read_text()
    s = re.sub(r'/\* <clima-core> \*/.*?/\* </clima-core> \*/\n', '', s, flags=re.S)
    tag = '<script id="engine">\n'; assert tag in s, f'no engine script in {f}'
    s = s.replace(tag, tag + '/* <clima-core> */\n' + core + '\n/* </clima-core> */\n', 1)
    p.write_text(s); print(f'{f}: core {len(core)} bytes')
