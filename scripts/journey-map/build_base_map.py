"""Gera o mapa-base da Jornada (SVG esquemático) a partir do Natural Earth.

Natural Earth é domínio público (https://www.naturalearthdata.com/about/terms-of-use/).
Uso (rodar uma vez; o resultado vai para o repositório):
  curl -sLO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson
  curl -sLO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_lakes.geojson
  curl -sLO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson
  python3 -I scripts/journey-map/build_base_map.py <pasta-dos-geojson> src/features/bible-journey/map/base-map.ts

A projeção (equirretangular com cos da latitude central) tem de ficar igual à de
`src/features/bible-journey/map/projection.ts`.
"""
import json
import math
import sys

# Caixa: do delta do Nilo ao Golfo Pérsico e às montanhas de Ararate.
LON_MIN, LON_MAX = 28.5, 49.5
LAT_MIN, LAT_MAX = 27.5, 40.8
WIDTH = 1000.0
K = math.cos(math.radians((LAT_MIN + LAT_MAX) / 2))
SCALE = WIDTH / ((LON_MAX - LON_MIN) * K)
HEIGHT = round((LAT_MAX - LAT_MIN) * SCALE, 1)


def project(lon, lat):
    return ((lon - LON_MIN) * K * SCALE, (LAT_MAX - lat) * SCALE)


def clip_polygon(points, xmin, ymin, xmax, ymax):
    """Sutherland–Hodgman contra um retângulo (em coordenadas do SVG)."""
    def clip(pts, inside, intersect):
        out = []
        if not pts:
            return out
        prev = pts[-1]
        for cur in pts:
            if inside(cur):
                if not inside(prev):
                    out.append(intersect(prev, cur))
                out.append(cur)
            elif inside(prev):
                out.append(intersect(prev, cur))
            prev = cur
        return out

    def ix(x):
        return lambda a, b: (x, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]))

    def iy(y):
        return lambda a, b: (a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]), y)

    pts = clip(points, lambda p: p[0] >= xmin, ix(xmin))
    pts = clip(pts, lambda p: p[0] <= xmax, ix(xmax))
    pts = clip(pts, lambda p: p[1] >= ymin, iy(ymin))
    pts = clip(pts, lambda p: p[1] <= ymax, iy(ymax))
    return pts


def simplify(points, tolerance):
    """Douglas–Peucker."""
    if len(points) < 3:
        return points
    a, b = points[0], points[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    norm = math.hypot(dx, dy) or 1e-9
    best, index = 0.0, 0
    for i in range(1, len(points) - 1):
        p = points[i]
        dist = abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / norm
        if dist > best:
            best, index = dist, i
    if best <= tolerance:
        return [a, b]
    return simplify(points[: index + 1], tolerance)[:-1] + simplify(points[index:], tolerance)


def simplify_ring(points, tolerance):
    """Anel fechado: divide em duas metades para o Douglas–Peucker não colapsar."""
    if points[0] == points[-1]:
        points = points[:-1]
    half = len(points) // 2
    first = simplify(points[: half + 1], tolerance)
    second = simplify(points[half:] + [points[0]], tolerance)
    return first[:-1] + second[:-1]


def fmt(points, close):
    if len(points) < 2:
        return ""
    body = "L".join(f"{x:.1f} {y:.1f}" for x, y in points)
    return f"M{body}{'Z' if close else ''}"


def polygons(geometry):
    if geometry["type"] == "Polygon":
        return [geometry["coordinates"]]
    if geometry["type"] == "MultiPolygon":
        return geometry["coordinates"]
    return []


def lines(geometry):
    if geometry["type"] == "LineString":
        return [geometry["coordinates"]]
    if geometry["type"] == "MultiLineString":
        return geometry["coordinates"]
    return []


def area_paths(features, tolerance, keep=lambda f: True, min_points=3):
    margin = 4
    out = []
    for feature in features:
        if not keep(feature):
            continue
        for polygon in polygons(feature["geometry"]):
            for ring in polygon:
                projected = [project(lon, lat) for lon, lat in ring]
                clipped = clip_polygon(projected, -margin, -margin, WIDTH + margin, HEIGHT + margin)
                simple = simplify_ring(clipped, tolerance) if len(clipped) > 3 else clipped
                if len(simple) >= min_points:
                    out.append(fmt(simple, True))
    return "".join(out)


def river_path(features, names, tolerance):
    out = []
    for feature in features:
        if (feature["properties"].get("name") or "") not in names:
            continue
        for line in lines(feature["geometry"]):
            current = []
            for lon, lat in line:
                inside = LON_MIN - 0.3 <= lon <= LON_MAX + 0.3 and LAT_MIN - 0.3 <= lat <= LAT_MAX + 0.3
                if inside:
                    current.append(project(lon, lat))
                elif current:
                    out.append(current)
                    current = []
            if current:
                out.append(current)
    return "".join(fmt(simplify(points, tolerance), False) for points in out if len(points) > 1)


def main():
    folder, target = sys.argv[1], sys.argv[2]
    load = lambda name: json.load(open(f"{folder}/{name}.geojson", encoding="utf-8"))["features"]
    land = area_paths(load("ne_50m_land"), 0.35)
    lake_names = {"Dead Sea", "Sea of Galilee", "Lake Van", "Lake Urmia", "Buhayrat ath Tharthar"}
    lakes = area_paths(load("ne_10m_lakes"), 0.6, keep=lambda f: (f["properties"].get("name") or "") in lake_names)
    rivers_source = load("ne_10m_rivers_lake_centerlines")
    rivers = {
        "nile": river_path(rivers_source, {"Nile", "Rosetta Branch", "Damietta Branch"}, 0.8),
        "euphrates": river_path(rivers_source, {"Euphrates", "Al Furat"}, 0.8),
        "tigris": river_path(rivers_source, {"Tigris"}, 0.8),
        "jordan": river_path(rivers_source, {"Jordan"}, 0.4),
    }
    payload = {
        "bounds": {"lonMin": LON_MIN, "lonMax": LON_MAX, "latMin": LAT_MIN, "latMax": LAT_MAX},
        "width": WIDTH,
        "height": HEIGHT,
        "land": land,
        "lakes": lakes,
        "rivers": rivers,
    }
    with open(target, "w", encoding="utf-8") as handle:
        handle.write("// Gerado por scripts/journey-map/build_base_map.py a partir do Natural Earth (domínio público).\n")
        handle.write("// Não editar à mão.\n")
        handle.write("export const journeyBaseMap = ")
        handle.write(json.dumps(payload, ensure_ascii=False))
        handle.write(" as const;\n")
    print(f"ok {target}: land {len(land)} chars, lakes {len(lakes)}, rivers {[len(v) for v in rivers.values()]}, {WIDTH}x{HEIGHT}")


if __name__ == "__main__":
    main()
