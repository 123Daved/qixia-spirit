"""构建栖霞山真实地形与路网数据 → assets/qixia-data.js

数据来源：
  · 高程：AWS Terrain Tiles（Terrarium 编码，SRTM 等公开数据），https://registry.opendata.aws/terrain-tiles/
  · 路网/山界/停车场/地名：© OpenStreetMap contributors，ODbL，https://www.openstreetmap.org/copyright
用法：python3 tools/build_qixia_data.py   （需联网一次；生成后页面完全离线可用）
"""
import base64, io, json, math, struct, urllib.request, xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
LON0, LAT0 = 118.9575, 32.1555          # 局部坐标原点（山体中部）
BBOX = (118.938, 32.142, 118.976, 32.168)  # 西、南、东、北
Z = 15
UA = {'User-Agent': 'qixia-youling-prototype/1.0'}
KX = math.cos(math.radians(LAT0)) * 111320.0   # 每度经度的米数
KZ = 110540.0


def xz(lat, lon):
    """经纬度 → 局部米坐标：x 向东，z 向南（与场景一致，北方为 -z）"""
    return round((lon - LON0) * KX, 1), round(-(lat - LAT0) * KZ, 1)


def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90).read()


# ---------- 高程 ----------
def tile_xy(lat, lon):
    n = 2 ** Z
    return (lon + 180) / 360 * n, (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n


tiles = {}
def elevation(lat, lon):
    x, y = tile_xy(lat, lon)
    tx, ty = int(x), int(y)
    if (tx, ty) not in tiles:
        tiles[(tx, ty)] = Image.open(io.BytesIO(fetch(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{tx}/{ty}.png'))).convert('RGB')
    im = tiles[(tx, ty)]
    fx, fy = (x - tx) * 256 - .5, (y - ty) * 256 - .5
    x0, y0 = max(0, min(254, int(math.floor(fx)))), max(0, min(254, int(math.floor(fy))))
    ax, ay = min(1, max(0, fx - x0)), min(1, max(0, fy - y0))
    def h(px, py):
        r, g, b = im.getpixel((px, py))
        return r * 256 + g + b / 256 - 32768
    return (h(x0, y0) * (1 - ax) + h(x0 + 1, y0) * ax) * (1 - ay) + (h(x0, y0 + 1) * (1 - ax) + h(x0 + 1, y0 + 1) * ax) * ay


# ---------- OSM ----------
osm = ET.fromstring(fetch('https://api.openstreetmap.org/api/0.6/map?bbox=%s,%s,%s,%s' % BBOX))
nodes = {n.get('id'): (float(n.get('lat')), float(n.get('lon')), {t.get('k'): t.get('v') for t in n.findall('tag')}) for n in osm.findall('node')}
ROAD = {'tertiary': 'road', 'secondary': 'road', 'unclassified': 'road', 'service': 'road', 'residential': 'road', 'track': 'road',
        'path': 'path', 'footway': 'path', 'steps': 'path', 'pedestrian': 'path'}
roads, polys, pois = [], {'forest': [], 'parking': [], 'water': [], 'temple': []}, []
for w in osm.findall('way'):
    t = {x.get('k'): x.get('v') for x in w.findall('tag')}
    refs = [n.get('ref') for n in w.findall('nd') if n.get('ref') in nodes]
    if len(refs) < 2:
        continue
    pts = [xz(*nodes[r][:2]) for r in refs]
    kind = ROAD.get(t.get('highway'))
    if kind:
        roads.append({'k': kind, 'h': t['highway'], 'n': t.get('name', ''), 'ids': refs, 'p': pts})
    elif t.get('landuse') == 'forest' and t.get('name') == '栖霞山':
        polys['forest'].append(pts)
    elif t.get('amenity') == 'parking':
        polys['parking'].append(pts)
    elif t.get('natural') == 'water' or t.get('water'):
        polys['water'].append(pts)
    elif t.get('amenity') == 'place_of_worship' and '栖霞' in t.get('name', ''):
        polys['temple'].append(pts)
for nid, (lat, lon, t) in nodes.items():
    name = t.get('name')
    if name and (t.get('tourism') or t.get('natural') == 'peak' or t.get('historic') or name in ('北门', '栖霞山北')):
        x, z = xz(lat, lon)
        pois.append({'n': name, 'x': x, 'z': z, 'ele': t.get('ele')})


def area(p):
    return abs(sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(p, p[1:] + p[:1]))) / 2


# ---------- 高程网格（约 12 米一格）----------
W, S, E, N = BBOX
x0, z1 = xz(S, W)
x1, z0 = xz(N, E)
STEP = 12.0
nx, nz = int((x1 - x0) / STEP) + 1, int((z1 - z0) / STEP) + 1
grid = []
for j in range(nz):
    z = z0 + j * STEP
    lat = LAT0 - z / KZ
    for i in range(nx):
        lon = LON0 + (x0 + i * STEP) / KX
        grid.append(max(-10, min(400, elevation(lat, lon))))

data = {
    'src': '高程 AWS Terrain Tiles；路网与地名 © OpenStreetMap contributors (ODbL)',
    'origin': [LAT0, LON0], 'k': [KX, KZ],
    'grid': {'x0': x0, 'z0': z0, 'step': STEP, 'nx': nx, 'nz': nz,
             'h': base64.b64encode(struct.pack('<%dh' % len(grid), *[round(v * 4) for v in grid])).decode()},  # 0.25 米精度
    'roads': roads, 'forest': polys['forest'], 'water': polys['water'], 'temple': polys['temple'],
    'parking': [{'p': p, 'area': round(area(p))} for p in polys['parking']],
    'pois': pois,
}
out = ROOT / 'assets/qixia-data.js'
out.write_text('/* 栖霞山真实地形与路网（tools/build_qixia_data.py 生成，勿手改）。' + data['src'] + ' */\nwindow.QIXIA_DATA=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
print(f'网格 {nx}×{nz}，高程 {min(grid):.0f}–{max(grid):.0f} 米；道路 {sum(r["k"]=="road" for r in roads)} 条，步道 {sum(r["k"]=="path" for r in roads)} 条；'
      f'山界 {len(polys["forest"])}，停车场 {len(polys["parking"])}，水体 {len(polys["water"])}，地名 {len(pois)}；文件 {out.stat().st_size // 1024} KB')
