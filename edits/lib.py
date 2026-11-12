import sys
class Ed:
    def __init__(self, p): self.p = p; self.s = open(p, encoding='utf-8').read()
    def rep(self, a, b, n=1):
        c = self.s.count(a)
        if c != n: raise SystemExit(f'{self.p}: expected {n}, found {c}: {a[:120]!r}')
        self.s = self.s.replace(a, b)
    def save(self): open(self.p, 'w', encoding='utf-8').write(self.s); print('saved', self.p)
