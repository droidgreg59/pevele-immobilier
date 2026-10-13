"""Cherche, DANS les limites officielles d'une commune, les endroits qui ont le
plus changé entre les photos IGN de 1950-1965 et d'aujourd'hui.

Méthode : grille de tuiles IGN (zoom 16) autour du centre ; densité de contours
(bâti, rues) mesurée sur chaque époque ; score = densité aujourd'hui − densité
1950 (normalisées). On ne garde que les tuiles dont le centre est dans le
contour de la commune (geo.api.gouv.fr), espacées d'au moins 2 tuiles.
Le « bourg » est la tuile la plus dense aujourd'hui.

À vérifier à l'œil ensuite : le score ne distingue pas un lotissement d'une
autoroute ou d'une zone commerciale.

Usage : python find-spots.py <code_insee>   → JSON sur la sortie standard
Dépendances : pillow, numpy (venv conseillé : media/.venv).
"""
import io
import json
import math
import sys
import urllib.request
import concurrent.futures as cf

import numpy as np
from PIL import Image, ImageFilter

INSEE = sys.argv[1]
Z, R = 16, 6
LAYERS = {
    "1950": ("ORTHOIMAGERY.ORTHOPHOTOS.1950-1965", "BDORTHOHISTORIQUE", "PM_0_18", "image/png"),
    "today": ("ORTHOIMAGERY.ORTHOPHOTOS", "normal", "PM_0_19", "image/jpeg"),
}

geo = json.loads(urllib.request.urlopen(
    f"https://geo.api.gouv.fr/communes/{INSEE}?fields=nom,centre,contour&format=geojson&geometry=contour", timeout=30).read())
g = geo["geometry"]
polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
name = geo["properties"]["nom"]


def inside(lat, lng):
    for poly in polys:
        ring, c, j = poly[0], False, len(poly[0]) - 1
        for i in range(len(ring)):
            xi, yi = ring[i]
            xj, yj = ring[j]
            if (yi > lat) != (yj > lat) and lng < (xj - xi) * (lat - yi) / (yj - yi) + xi:
                c = not c
            j = i
        if c:
            return True
    return False


def to_xy(lat, lng):
    n = 2 ** Z
    return (lng + 180) / 360 * n, (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n


def to_ll(x, y):
    n = 2 ** Z
    return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n)))), x / n * 360 - 180


# Centre = barycentre du contour (plus fiable que le centre administratif pour couvrir la commune).
ring = polys[0][0]
clat = sum(p[1] for p in ring) / len(ring)
clng = sum(p[0] for p in ring) / len(ring)
cx, cy = [int(v) for v in to_xy(clat, clng)]


def fetch(ep, x, y):
    lay, st, tms, fmt = LAYERS[ep]
    u = (f"https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER={lay}&STYLE={st}"
         f"&TILEMATRIXSET={tms}&TILEMATRIX={Z}&TILEROW={y}&TILECOL={x}&FORMAT={fmt}")
    for _ in range(3):
        try:
            return Image.open(io.BytesIO(urllib.request.urlopen(u, timeout=30).read())).convert("L")
        except Exception:
            pass
    return None


def edge(img):
    return np.asarray(img.resize((128, 128)).filter(ImageFilter.FIND_EDGES), dtype=float).mean()


cells = []
for dx in range(-R, R + 1):
    for dy in range(-R, R + 1):
        lat, lng = to_ll(cx + dx + 0.5, cy + dy + 0.5)
        if inside(lat, lng):
            cells.append((dx, dy, lat, lng))

with cf.ThreadPoolExecutor(12) as ex:
    futs = {(ep, dx, dy): ex.submit(fetch, ep, cx + dx, cy + dy) for dx, dy, _, _ in cells for ep in LAYERS}
    E = {k: (edge(f.result()) if f.result() else None) for k, f in futs.items()}

res = [(dx, dy, lat, lng, E[("1950", dx, dy)], E[("today", dx, dy)])
       for dx, dy, lat, lng in cells if E[("1950", dx, dy)] is not None and E[("today", dx, dy)] is not None]
A = np.median([r[4] for r in res])
B = np.median([r[5] for r in res])
bourg = max(res, key=lambda r: r[5])
scored = sorted(((r[5] / B - r[4] / A, r) for r in res), key=lambda t: -t[0])
picked = []
for s, r in scored:
    if max(abs(r[0] - bourg[0]), abs(r[1] - bourg[1])) < 2:
        continue
    if all(max(abs(r[0] - p[0]), abs(r[1] - p[1])) >= 2 for p in picked):
        picked.append(r + (s,))
    if len(picked) == 8:
        break

print(json.dumps({
    "commune": name,
    "insee": INSEE,
    "bourg": {"lat": round(bourg[2], 5), "lng": round(bourg[3], 5)},
    "candidats": [{"lat": round(p[2], 5), "lng": round(p[3], 5), "score": round(float(p[6]), 2)} for p in picked],
}, ensure_ascii=False))
