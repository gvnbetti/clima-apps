"""Write the APA reference list of each method and validation page.
A page lists the keys it cites in a comment under its "## References" heading:
    ## References
    <!-- refs: perez1990 brode2012 -->
This script rewrites everything below that comment from shared/bib.py, sorted as APA asks.
Same author and year across the whole documentation get a, b, ... in title order."""
import glob, os, re, sys, unicodedata
sys.path.insert(0, os.path.dirname(__file__)); from bib import B
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = sorted(glob.glob(f"{ROOT}/docs/methods/*.md") + glob.glob(f"{ROOT}/validation/README.md") + glob.glob(f"{ROOT}/validation/*/README.md"))
MARK = re.compile(r"<!-- refs: ([^>]*) -->")
def skey(e): return unicodedata.normalize("NFKD", e).encode("ascii", "ignore").decode().lower().replace("*", "")
pages = {}
for f in FILES:
    m = MARK.search(open(f).read())
    if m: pages[f] = m.group(1).split()
used = sorted({k for ks in pages.values() for k in ks})
miss = [k for k in used if k not in B]
if miss: sys.exit(f"unknown keys: {miss}")
# a, b suffixes for same author-year
groups = {}
for k in used:
    a, y = re.match(r"(.*?)\. \(([^)]*)\)", B[k]).groups(); groups.setdefault((a, y), []).append(k)
E = dict(B)
for (a, y), ks in groups.items():
    if len(ks) > 1:
        for i, k in enumerate(sorted(ks, key=lambda k: skey(B[k]))):
            suf = ("-" if y == "n.d." else "") + "abcdefgh"[i]
            E[k] = B[k].replace(f"({y})", f"({y}{suf})", 1)
            print(f"  {k}: {y}{suf}")
for f, ks in pages.items():
    s = open(f).read(); m = MARK.search(s)
    body = "\n\n".join(sorted((E[k] for k in set(ks)), key=skey))
    open(f, "w").write(s[:m.end()] + "\n\n" + body + "\n")
    print(os.path.relpath(f, ROOT), len(set(ks)))
