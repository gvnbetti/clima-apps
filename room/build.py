"""Builds Room Clima: index.html (page with engine, weather data, fonts and JSZip inline) and worker.js
(engine + worker tail), from v16/src. No request leaves the page: fonts and JSZip are bundled."""
import base64, re, sys, pathlib

R = pathlib.Path(__file__).resolve().parent
S, V, B = R / 'src', R / 'vendor', R / 'build'
B.mkdir(exist_ok=True)

shell = (S / 'shell.html').read_text()
wx = (S / 'wxdata.line').read_text()
core = (S.parent.parent / 'shared' / 'climamods.js').read_text() + '\n' + (S / 'register.js').read_text() + '\n' + (S / 'core.js').read_text()  # shared core first: the worker needs it too
page = (S / 'page.html').read_text()

# fonts: IBM Plex (SIL Open Font License 1.1), Latin subset, as data URLs
FONTS = [('IBM Plex Sans', 'fontsource-ibm-plex-sans-5.3.0', 'ibm-plex-sans', [400, 500, 600]),
         ('IBM Plex Sans Condensed', 'fontsource-ibm-plex-sans-condensed-5.3.0', 'ibm-plex-sans-condensed', [500, 600]),
         ('IBM Plex Mono', 'fontsource-ibm-plex-mono-5.3.0', 'ibm-plex-mono', [400, 500])]
ff = []
for fam, pkg, stem, ws in FONTS:
    for w in ws:
        b = (V / pkg / 'package' / 'files' / f'{stem}-latin-{w}-normal.woff2').read_bytes()
        ff.append(f'@font-face{{font-family:"{fam}";font-style:normal;font-weight:{w};font-display:swap;'
                  f'src:url(data:font/woff2;base64,{base64.b64encode(b).decode()}) format("woff2")}}')
fontcss = '<style>/* IBM Plex, SIL Open Font License 1.1 */' + ''.join(ff) + '</style>'

n0 = len(re.findall(r'<link [^>]*fonts\.(googleapis|gstatic)\.com[^>]*>', shell))
shell = re.sub(r'<link [^>]*fonts\.(googleapis|gstatic)\.com[^>]*>\n?', '', shell)
assert n0 >= 1, 'font links not found'
shell = shell.replace('<meta name="claude:viewport-fit-sides" content="cover">',
                      '<meta name="claude:viewport-fit-sides" content="cover">\n' + fontcss, 1)
assert fontcss in shell

jszip = (V / 'jszip-3.10.1' / 'package' / 'dist' / 'jszip.min.js').read_text()
jszip = jszip.replace('</script', '<\\/script')

m = re.search(r'const WTAIL = `(.*?)`;', page, re.S)
assert m, 'worker tail not found'
wtail = m.group(1)

mods = '\n'.join('<script>' + (S.parent.parent / 'macro' / f).read_text().replace('</script', '<\\/script') + '</script>' for f in ('future.js', 'regions.js'))  # one copy, in Macro Clima
html = '\n'.join([shell, wx, '<script>/* JSZip 3.10.1, MIT or GPLv3 */\n' + jszip + '\n</script>', mods,
                  '<script id="core">' + core + '</script>', page])
for bad in ('fonts.googleapis', 'fonts.gstatic', 'cdnjs.cloudflare'):
    assert bad not in html, bad
(B / 'index.html').write_text(html)
(B / 'worker.js').write_text(core + '\n' + wtail)
print('index.html', len(html.encode()), 'bytes; worker.js', len((core + wtail).encode()), 'bytes')
