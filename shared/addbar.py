"""Inserts (or replaces) the Clima Studio bar at the top of an app page: the umbrella mark, the four apps and a link to
the source. The block sits between two marker comments right after <body>, so running this again replaces it.
Links are absolute, so the bar also works where an app runs as a Claude artifact.
Usage: python3 addbar.py <app id: map|macro|micro|room> <html file> [...more pairs]"""
import sys, re, pathlib

BASE = 'https://gvnbetti.github.io/clima-apps/'
INK, SUN = 'currentColor', '#d9762b'
ARC = f'<path d="M10 34A22 22 0 0 1 54 34" fill="none" stroke="{INK}" stroke-width="4.5" stroke-linecap="round"/><circle cx="43" cy="14.95" r="5" fill="{SUN}"/>'
S = f'fill="none" stroke="{INK}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"'
GLYPH = {
    'studio': f'<path d="M4 44H60M8 44A24 24 0 0 1 56 44M15 44A17 17 0 0 1 49 44M22 44A10 10 0 0 1 42 44" {S}/><circle cx="44" cy="23.22" r="5" fill="{SUN}"/>',
    'map': ARC + f'<path d="M32 58C29 53 24 48 24 43A8 8 0 0 1 40 43C40 48 35 53 32 58Z" {S}/>',
    'macro': ARC + f'<path d="M4 34H60M14 43H50M24 52H40" {S}/>',
    'micro': ARC + f'<path d="M6 56H58M24 48V56M42 49V56" {S}/><circle cx="24" cy="41" r="7" {S}/><circle cx="42" cy="45" r="3" fill="{INK}"/>',
    'room': ARC + f'<path d="M50 43V38H14V56H50V51" {S}/>',
}
APPS = [('map', 'Clima Map', 'map/index.html', 'Find a weather file'), ('macro', 'Macro Clima', 'macro/index.html', 'Read the climate'),
        ('micro', 'Micro Clima', 'micro/index.html', 'Outdoor comfort'), ('room', 'Room Clima', 'room/build/index.html', 'Room and facade')]
svg = lambda k, s: f'<svg width="{s}" height="{s}" viewBox="0 0 64 64" aria-hidden="true">{GLYPH[k]}</svg>'

CSS = '''<style>
.csb{--csb-bg:#fbfbf9;--csb-ink:#18201f;--csb-mute:#5b6663;--csb-line:#d6dad5;--csb-on:#e6e9e4;display:flex;align-items:center;gap:4px 18px;flex-wrap:wrap;
 padding:6px max(16px,env(safe-area-inset-right,0px)) 6px max(16px,env(safe-area-inset-left,0px));background:var(--csb-bg);color:var(--csb-ink);border-bottom:1px solid var(--csb-line);
 font:500 13px/1.2 "IBM Plex Sans",system-ui,-apple-system,sans-serif;position:relative;z-index:50}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .csb{--csb-bg:#1a201f;--csb-ink:#e7ebe8;--csb-mute:#9aa5a1;--csb-line:#2f3836;--csb-on:#232b29}}
.csb a{color:inherit;text-decoration:none;display:inline-flex;align-items:center;gap:7px;border-radius:5px}
.csb svg{flex:none;display:block}
.csb-home{font-size:15px;padding:3px 4px}.csb-home b{font-weight:600}.csb-home span{font-weight:300}
.csb-apps{display:flex;gap:2px;flex-wrap:wrap}
.csb-apps a{padding:5px 9px;color:var(--csb-mute)}.csb-apps a:hover{color:var(--csb-ink);background:var(--csb-on)}
.csb-apps a[aria-current]{color:var(--csb-ink);background:var(--csb-on);font-weight:600}
.csb-right{margin-left:auto;display:flex;gap:2px 14px;flex-wrap:wrap}
.csb-right a{color:var(--csb-mute);font-size:12px;padding:5px 2px}.csb-right a:hover{color:var(--csb-ink)}
@media (max-width:720px){.csb-apps a span,.csb .csb-src{display:none}.csb-apps a{padding:5px 7px}.csb-right{gap:10px}}
</style>'''

# visitor count: GoatCounter, no cookies; only on the public site (not in Claude artifacts or local copies)
COUNT = ('<script>(function(){if(!/(^|\\.)github\\.io$/.test(location.hostname))return;var s=document.createElement("script");s.async=true;'
         's.setAttribute("data-goatcounter","https://climastudio.goatcounter.com/count");s.src="' + BASE + 'shared/goatcounter-count.js";document.head.appendChild(s)})();</script>')

def bar(cur):
    apps = ''.join(f'<a href="{BASE}{p}" title="{n}: {d}"{" aria-current=page" if k == cur else ""}>{svg(k, 20)}<span>{n}</span></a>' for k, n, p, d in APPS)
    return (f'<!-- clima-studio-bar -->{CSS}<nav class="csb" aria-label="Clima Studio apps"><a class="csb-home" href="{BASE}">{svg("studio", 24)}<b>Clima</b><span>Studio</span></a>'
            f'<span class="csb-apps">{apps}</span><span class="csb-right"><a class="csb-src" href="https://github.com/gvnbetti/clima-apps">Source and validation</a>'
            f'<a href="{BASE}about.html">About</a><a href="{BASE}impressum.html">Impressum</a></span></nav>{COUNT}<!-- /clima-studio-bar -->')

if __name__ == '__main__':
    a = sys.argv[1:]
    for cur, f in zip(a[0::2], a[1::2]):
        p = pathlib.Path(f); s = p.read_text()
        s = re.sub(r'<!-- clima-studio-bar -->.*?<!-- /clima-studio-bar -->', '', s, flags=re.S)
        m = re.search(r'<body[^>]*>', s); assert m, f'no <body> in {f}'
        p.write_text(s[:m.end()] + bar(cur) + s[m.end():])
        print(f'{f}: bar for {cur}')
