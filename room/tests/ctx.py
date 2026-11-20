import re, sys
pat, f = sys.argv[1], sys.argv[2]; w = int(sys.argv[3]) if len(sys.argv) > 3 else 120; mx = int(sys.argv[4]) if len(sys.argv) > 4 else 40
s = open(f, encoding='utf-8').read(); n = 0
for m in re.finditer(pat, s):
    a = max(0, m.start() - w); b = min(len(s), m.end() + w)
    print(f"{s.count(chr(10), 0, m.start()) + 1}: " + s[a:b].replace('\n', ' ⏎ ')); n += 1
    if n >= mx: break
