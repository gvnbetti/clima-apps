"""Writes validation.html, the site's validation page, from validation/README.md: the summary table and the known
limits are read from there, so the page and the repository cannot disagree. Rerun after changing that file.
Usage (from the repository root): python3 shared/mkvalidation.py"""
import html, pathlib, re, subprocess, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent)); import addbar as A
ROOT = pathlib.Path(__file__).resolve().parent.parent; GH = 'https://github.com/gvnbetti/clima-toolbox'
md = (ROOT / 'validation' / 'README.md').read_text()

def inline(t):  # the little Markdown the README uses: `code`, **bold**
    t = html.escape(t)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    return re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', t)

rows = [[c.strip() for c in l.strip().strip('|').split('|')] for l in md.splitlines() if l.startswith('|')]
head = rows[0]; body = [r for r in rows[2:] if len(r) == len(head)]
trs = ''
for model, used, ref, res, folder in body:
    f = folder.strip('`').strip('/')
    trs += (f'<tr><th scope="row">{inline(model)}<span>{inline(used)}</span></th><td>{inline(ref)}</td><td>{inline(res)}</td>'
            f'<td><a href="{GH}/tree/main/validation/{f}">Report</a></td></tr>')
lim = re.search(r'## Known limits\n(.*?)\n\n', md, re.S).group(1)
items = ''.join(f'<li>{inline(" ".join(x.split()))}</li>' for x in re.split(r'\n- ', '\n' + lim.strip())[1:])
date = re.search(r'produced on ([0-9]+ \w+ [0-9]{4})', md).group(1)
res_files = [str(p.relative_to(ROOT)) for p in (ROOT / 'validation').rglob('*') if p.suffix in ('.md', '.json') and '_work' not in p.parts and p.name != 'README.md' and 'history' not in p.parts]
commit = subprocess.run(['git', 'log', '-1', '--format=%h', '--', *res_files], cwd=ROOT, capture_output=True, text=True).stdout.strip()

page = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Validation · Clima Toolbox</title>
<meta name="description" content="How the models of Clima Toolbox are checked, against which tools, and with what result.">
<link rel="icon" href="shared/icons/toolbox.svg" type="image/svg+xml">
<link rel="stylesheet" href="shared/fonts/fonts.css">
<style>
:root {{ --bg: #f1f2ef; --panel: #fbfbf9; --ink: #18201f; --mute: #5b6663; --line: #d6dad5; --accent: #23614f;
  --f-body: "IBM Plex Sans", system-ui, sans-serif; --f-data: "IBM Plex Mono", ui-monospace, monospace }}
@media (prefers-color-scheme: dark) {{ :root {{ --bg: #131817; --panel: #1a201f; --ink: #e7ebe8; --mute: #9aa5a1; --line: #2f3836; --accent: #6cc0a3; color-scheme: dark }} }}
* {{ box-sizing: border-box }}
body {{ margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.65 var(--f-body) }}
main {{ max-width: 960px; margin: 0 auto; padding: 56px max(20px, env(safe-area-inset-left, 0px)) 64px }}
h1 {{ font-size: 40px; font-weight: 300; letter-spacing: -.01em; line-height: 1.1; margin: 0 0 28px }} h1 b {{ font-weight: 600 }}
h2 {{ font: 600 13px var(--f-data); text-transform: uppercase; letter-spacing: .08em; color: var(--mute); margin: 40px 0 10px }}
p {{ margin: 0 0 14px; max-width: 720px }} a {{ color: var(--accent) }} code {{ font: 13px var(--f-data) }}
ul {{ margin: 0 0 14px; padding-left: 20px; max-width: 760px }} li {{ margin: 0 0 6px }}
table {{ width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.5; background: var(--panel); border: 1px solid var(--line) }}
th, td {{ text-align: left; vertical-align: top; padding: 10px 12px; border-top: 1px solid var(--line) }}
thead th {{ font: 600 11px var(--f-data); text-transform: uppercase; letter-spacing: .06em; color: var(--mute); border-top: 0 }}
tbody th {{ font-weight: 600; width: 24% }} tbody th span {{ display: block; font-weight: 400; color: var(--mute); font-size: 13px }}
.stamp {{ font: 13px var(--f-data); color: var(--mute) }}
@media (max-width: 720px) {{ thead {{ display: none }} table, tbody, tr, th, td {{ display: block; width: 100% }}
  tr {{ border-top: 1px solid var(--line); padding: 6px 0 }} th, td {{ border: 0; padding: 4px 14px }} tbody th {{ width: auto }}
  td:nth-of-type(1)::before {{ content: "Compared with: "; color: var(--mute) }} td:nth-of-type(2)::before {{ content: "Result: "; color: var(--mute) }} }}
footer {{ margin-top: 48px; padding-top: 16px; border-top: 1px solid var(--line); font-size: 13px; color: var(--mute) }} footer a {{ color: inherit }}
</style>
</head>
<body>
<main>
  <h1><b>Validation</b></h1>
  <p>Every model in Clima Toolbox is checked against an established simulation tool, an open reference implementation, a published test or an exact solution. The checks compare models with models: they show that each tool computes what it claims and agrees with the tools the field relies on. They do not compare the tools with measured buildings or outdoor spaces.</p>
  <p>Each report in the repository gives the base cases, the assumptions, the reference and the scripts, so every result can be rerun.</p>
  <p class="stamp">Results of {date}, code at commit <a href="{GH}/commit/{commit}">{commit}</a></p>

  <h2>Results</h2>
  <table><thead><tr><th>Model</th><th>Compared with</th><th>Result</th><th></th></tr></thead><tbody>{trs}</tbody></table>

  <h2>Known limits</h2>
  <ul>{items}</ul>

  <h2>Methods</h2>
  <p>What each app computes, with its models, assumptions and limits: <a href="methods.html">Methods</a>. Full overview of the studies in the repository: <a href="{GH}/tree/main/validation">validation</a>.</p>

  <footer><a href="index.html">Clima Toolbox</a> · <a href="about.html">About</a> · <a href="impressum.html">Impressum and privacy</a></footer>
</main>
</body>
</html>
'''
m = re.search(r'<body[^>]*>', page)
(ROOT / 'validation.html').write_text(page[:m.end()] + A.bar('validation') + page[m.end():])
print(f'validation.html: {len(body)} models, {items.count("<li>")} limits, commit {commit}')
