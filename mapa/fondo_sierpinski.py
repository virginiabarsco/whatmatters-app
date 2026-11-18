# -*- coding: utf-8 -*-
"""Cambia las tríadas del fondo (los "moños") por Sierpinskis como el logo, en app/Index.html.
Uso: python3 mapa/fondo_sierpinski.py [sin]  ("sin" deja el fondo solo con el mapa; se puede repetir: reemplaza lo que haya dentro del grupo del fondo)."""
import math, os, random
AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, '..', 'app', 'Index.html')
random.seed(7)
def mid(a, b): return ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
def sub(T, i): return [T[j] if j == i else mid(T[i], T[j]) for j in range(3)]
def pts(T): return ' '.join('%.1f,%.1f' % p for p in T)
def play(cx, cy, s):  # triángulo que apunta a la derecha, como el logo
    h = s * math.sqrt(3) / 2
    return [(cx - h / 3, cy - s / 2), (cx + 2 * h / 3, cy), (cx - h / 3, cy + s / 2)]
# (centro x, centro y, lado, alcance, cuántas posiciones quedan por convocar)
import sys
SIER = [] if 'sin' in sys.argv[1:] else [(800, 560, 430, 3, 0.15), (640, 1080, 250, 2, 0.0), (1010, 1290, 330, 4, 0.35), (330, 430, 300, 3, 0.25), (1300, 760, 360, 3, 0.4)]
out = []
for n, (cx, cy, s, k, vacias) in enumerate(SIER):
    leaves = [play(cx, cy, s)]
    for _ in range(k): leaves = [sub(T, i) for T in leaves for i in range(3)]
    sw = max(0.8, 2.4 - 0.4 * k)
    for i, T in enumerate(leaves):
        if i and random.random() < vacias: out.append('<polygon class="sp v" points="%s" stroke-width="%.1f"/>' % (pts(T), sw))
        else: out.append('<polygon class="sp" points="%s" stroke-width="%.1f"/>' % (pts(T), sw))
    if n == 0:  # en el grande, una cadena de posiciones en cian, como "Tus posiciones"
        T = play(cx, cy, s)
        for _ in range(k): T = sub(T, 0); out.append('<polygon class="sp y" points="%s" stroke-width="2"/>' % pts(T))
new = ''.join(out)
s = open(P, encoding='utf-8').read()
a = s.index('<g mask="url(#vg)">'); b = s.index('<g clip-path="url(#tierra)">', a) + len('<g clip-path="url(#tierra)">'); c = s.index('</g></g></svg></div>', b)
s = s[:b] + new + s[c:]
open(P, 'w', encoding='utf-8').write(s)
print('ok', len(out), 'triángulos')
