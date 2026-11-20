import sys, time, http.server, threading, functools
from playwright.sync_api import sync_playwright
root = sys.argv[1]
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8769), functools.partial(Q, directory=root)); threading.Thread(target=srv.serve_forever, daemon=True).start()
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox']); pg = b.new_page(viewport={'width': 1400, 'height': 1100})
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e) + ' ' + (e.stack or '')[:400]))
    pg.goto('http://127.0.0.1:8769/index.html'); pg.wait_for_timeout(1500)
    pg.evaluate('''() => { document.querySelectorAll('#ori input').forEach((x, i) => { x.checked = (i === 4 || i === 0); }); document.querySelector('#ori').dispatchEvent(new Event('change', {bubbles:true}));
       document.querySelectorAll('#types input').forEach((x) => { x.checked = x.value === 'cellular'; }); document.querySelector('#types').dispatchEvent(new Event('change', {bubbles:true})); }''')
    pg.check('#refwin'); pg.dispatch_event('#refwin', 'change')
    pg.click('#run'); t0 = time.time(); shots = 0
    while time.time() - t0 < 1500:
        pg.wait_for_timeout(15000); el = round(time.time() - t0)
        rp = pg.inner_text('#runp') if pg.is_visible('#runp') else '(hidden)'
        print(f'--- {el} s | status: {pg.inner_text("#status")[:160]}'); print(rp.replace('\n', ' | ')[:900])
        if shots < 3 and el > 40 * (shots + 1): pg.locator('#runp').screenshot(path=f'runp{shots}.png'); shots += 1
        if 'Run finished' in rp: break
    print('ERRORS', errs); b.close()
srv.shutdown()
