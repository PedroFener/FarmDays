#!/usr/bin/env python3
"""
Gera todos os gráficos pixel art ORIGINAIS do FarmDays (texturas, sprites,
ícones do app e modelo do widget). Nada aqui é extraído de jogos: tudo é
desenhado proceduralmente ou por mapas de caracteres neste arquivo.

Uso: python3 tools/build_assets.py
Saídas:
  www/assets/*.png                      (interface web)
  native/android/res/drawable-nodpi/*   (widget)
  native/android/res/mipmap-*/          (ícone do app)
"""
import os
import random
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WWW = os.path.join(ROOT, "www", "assets")
NAT = os.path.join(ROOT, "native", "android", "res")
os.makedirs(WWW, exist_ok=True)


def hexc(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def new(w, h, bg=None):
    return Image.new("RGBA", (w, h), hexc(bg) if bg else (0, 0, 0, 0))


def from_map(rows, pal):
    rows = [r for r in rows.strip("\n").split("\n")]
    w = max(len(r) for r in rows)
    im = new(w, len(rows))
    px = im.load()
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c in pal:
                px[x, y] = hexc(pal[c])
    return im


def save(im, name, folder=WWW):
    os.makedirs(folder, exist_ok=True)
    im.save(os.path.join(folder, name))


def hstack(frames):
    w = sum(f.width for f in frames)
    h = max(f.height for f in frames)
    out = new(w, h)
    x = 0
    for f in frames:
        out.paste(f, (x, 0), f)
        x += f.width
    return out


# ---------------------------------------------------------------- texturas

def wood_planks(w, h, plank_h, cols, seed, vertical_seams=True):
    """Tábuas horizontais com veios, emendas e nós. Tileável."""
    rnd = random.Random(seed)
    base, mid, light, dark, seam, hi = [hexc(c) for c in cols]
    im = new(w, h)
    px = im.load()
    n = h // plank_h
    for p in range(n):
        y0 = p * plank_h
        # tom ligeiramente diferente por tábua
        shade = rnd.choice([base, base, mid])
        for y in range(y0, y0 + plank_h):
            for x in range(w):
                px[x, y] = shade
        # veios: traços horizontais
        for _ in range(int(w * plank_h / 18)):
            gy = rnd.randrange(y0 + 2, y0 + plank_h - 1)
            gx = rnd.randrange(w)
            ln = rnd.randrange(3, 14)
            col = rnd.choice([dark, dark, light, mid])
            for i in range(ln):
                px[(gx + i) % w, gy] = col
        # nó
        if rnd.random() < 0.55:
            kx = rnd.randrange(3, w - 4)
            ky = y0 + plank_h // 2
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1), (-2, 0), (2, 0)]:
                px[(kx + dx) % w, ky + dy] = dark
            px[kx % w, ky] = seam
            for i in range(-6, 7):
                if abs(i) > 2:
                    px[(kx + i) % w, ky - 2 + (1 if abs(i) > 4 else 0)] = dark
                    px[(kx + i) % w, ky + 2 - (1 if abs(i) > 4 else 0)] = dark
        # emenda superior + brilho
        for x in range(w):
            px[x, y0] = seam
            px[x, y0 + 1] = hi
            px[x, y0 + plank_h - 1] = dark
        # emenda vertical (topo de tábua)
        if vertical_seams:
            sx = (rnd.randrange(w // 4, w) + p * (w // 2)) % w
            for y in range(y0 + 1, y0 + plank_h):
                px[sx, y] = seam
                px[(sx + 1) % w, y] = hi
    return im


def parchment(w, h, seed):
    rnd = random.Random(seed)
    im = new(w, h, "#f5dcaa")
    px = im.load()
    for _ in range(w * h // 5):
        x, y = rnd.randrange(w), rnd.randrange(h)
        px[x, y] = hexc(rnd.choice(["#efd29b", "#f9e6bf", "#ecca8e", "#f3d7a2"]))
    return im


def grass(w, h, seed, flowers=True):
    rnd = random.Random(seed)
    im = new(w, h, "#5aa83a")
    px = im.load()
    for _ in range(w * h // 3):
        x, y = rnd.randrange(w), rnd.randrange(h)
        px[x, y] = hexc(rnd.choice(["#4f9a31", "#66b743", "#4a9030", "#6fc24a"]))
    # tufos
    for _ in range(w * h // 40):
        x, y = rnd.randrange(w), rnd.randrange(h)
        px[x, y] = hexc("#3f7f27")
        px[x, (y + 1) % h] = hexc("#3f7f27")
        px[(x + 1) % w, y] = hexc("#86d35b")
    if flowers:
        for _ in range(max(1, w * h // (260 if w <= 48 else 900))):
            x, y = rnd.randrange(1, w - 1), rnd.randrange(1, h - 1)
            c = hexc(rnd.choice(["#ffffff", "#ffd3e6", "#fff27a", "#ffb0cf"]))
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                px[x + dx, y + dy] = c
            px[x, y] = hexc("#ffcf3a")
    return im


WOOD_DARK = ["#6e3f1d", "#7a4823", "#94592c", "#4f2a12", "#3a1d0b", "#9b6233"]
WOOD_LIGHT = ["#e2b273", "#d9a463", "#f0c88e", "#b97e42", "#8a5426", "#f7d9a6"]
WOOD_BAR = ["#7b3d1c", "#844524", "#9b5a31", "#5b2a10", "#3e1a07", "#a8653a"]
WOOD_BTN = ["#8a4f25", "#93572b", "#a9693a", "#653715", "#45230b", "#b67745"]

save(wood_planks(64, 48, 12, WOOD_DARK, 1), "wood_dark.png")
save(wood_planks(64, 32, 8, WOOD_LIGHT, 2), "wood_light.png")
save(wood_planks(64, 16, 8, WOOD_BAR, 3, vertical_seams=False), "wood_bar.png")
save(wood_planks(64, 24, 8, WOOD_BTN, 4), "wood_button.png")
save(parchment(24, 24, 5), "parchment.png")
save(grass(96, 96, 6), "grass.png")
save(grass(48, 48, 7, flowers=False), "grass_plain.png")


# ------------------------------------------------------------- molduras 9-slice

def frame(size, border, outline, rim, rim_hi, inner=None, nails=True):
    """Moldura 9-slice: contorno escuro, aro com brilho e pregos nos cantos."""
    im = new(size, size)
    d = ImageDraw.Draw(im)
    o, r, h = hexc(outline), hexc(rim), hexc(rim_hi)
    d.rectangle([0, 0, size - 1, size - 1], fill=o)
    d.rectangle([1, 1, size - 2, size - 2], fill=r)
    d.line([2, 1, size - 3, 1], fill=h)
    d.line([1, 2, 1, size - 3], fill=h)
    d.rectangle([border - 1, border - 1, size - border, size - border], fill=o)
    if inner:
        d.rectangle([border, border, size - border - 1, size - border - 1], fill=hexc(inner))
    else:
        d.rectangle([border, border, size - border - 1, size - border - 1], fill=(0, 0, 0, 0))
    if nails:
        for (x, y) in [(2, 2), (size - 3, 2), (2, size - 3), (size - 3, size - 3)]:
            im.putpixel((x, y), hexc("#d8d0c0"))
    # cantos arredondados
    for (x, y) in [(0, 0), (size - 1, 0), (0, size - 1), (size - 1, size - 1)]:
        im.putpixel((x, y), (0, 0, 0, 0))
    return im


save(frame(12, 4, "#3e1d0a", "#a5652f", "#d29254"), "frame_sign.png")
save(frame(12, 4, "#3e1d0a", "#6f3a17", "#9a5a2c"), "frame_dark.png")
save(frame(12, 4, "#3e1d0a", "#c98c4c", "#f0c27e"), "frame_button.png")
save(frame(9, 3, "#5b3315", "#c79858", "#e9c88c", nails=False), "frame_parch.png")
save(frame(12, 4, "#2c4f1c", "#5f9b3a", "#86c25a"), "frame_green.png")


# ------------------------------------------------------------------ sprites

def flower_cluster(petal, petal_hi, petal_dk, center="#ffd23f", seed=0):
    """Ramo com três flores de cinco pétalas e folhas (16x14)."""
    leaf = {"g": "#4f9a31", "G": "#7fcb52", "d": "#2f6a1d"}
    pal = {"p": petal, "h": petal_hi, "k": petal_dk, "c": center, "o": "#8b3b55", **leaf}
    m = """
....oo..........
...ohho....oo...
..ohcchoo.ohho..
..opccpko.hcch..
...okpko.okppko.
..ggoodgg.okko..
.gGg.dgG.ggoo...
..dgGd.ggGd.g...
.oo.dgdgd.oo....
ohhoGgdg.ohho...
ohccpgd..pcchk..
.okpko...okpko..
..ok.g....okk...
.....d..........
"""
    return from_map(m, pal)


def tulip(c, hi, dk):
    m = """
.h.k.
hcckk
hccck
.ckk.
..g..
.Gg..
..gG.
..g..
"""
    return from_map(m, {"c": c, "h": hi, "k": dk, "g": "#3f8a2a", "G": "#6fbe46"})


def daisy(c="#ffffff", hi="#ffffff", dk="#d9d3e8"):
    m = """
.w.
wyw
.w.
.g.
"""
    return from_map(m, {"w": c, "y": "#ffcf3a", "g": "#3f8a2a"})


SEASON_FLOWERS = {
    "primavera": ("#f48cb5", "#ffc6dc", "#c8517f"),
    "verao": ("#ffcf2e", "#fff08a", "#d98c12"),
    "outono": ("#e9772b", "#ffb05a", "#a8461a"),
    "inverno": ("#b9a3f0", "#e4dcff", "#7c63bf"),
}
for name, (p, h, k) in SEASON_FLOWERS.items():
    save(flower_cluster(p, h, k), f"flowers_{name}.png")

# folha de outono (decoração alternativa)
leaf = from_map("""
...oo..
..oyyo.
.oyrryo
oyrrryo
.oyrro.
..oyo..
..b....
""", {"o": "#7a3410", "y": "#ffae3d", "r": "#e2621f", "b": "#6b3a17"})
save(leaf, "leaf.png")

# Nuvem
cloud = from_map("""
......wwww..........
....wwWWWWww..www...
..wwWWWWWWWWwwWWWw..
.wWWWWWWWWWWWWWWWWw.
wWWWWWWWWWWWWWWWWWWw
wbWWWWWWWWWWWWWWWbbw
.bbbbbbbbbbbbbbbbbb.
""", {"w": "#d7ecff", "W": "#ffffff", "b": "#b9dcf5"})
save(cloud, "cloud.png")

# Borboleta (2 quadros)
bf_pal = {"x": "#4a2208", "o": "#f39a2b", "y": "#ffd25a", "k": "#2b1405"}
bf1 = from_map("""
xx.....xx
xyox.xoyx
xoox.xoox
.xoxkxox.
.xoxkxox.
xyox.xoyx
.xx...xx.
""", bf_pal)
bf2 = from_map("""
.........
...x.x...
..xyxyx..
..xoxox..
...xkx...
..xoxox..
...x.x...
""", bf_pal)
save(hstack([bf1, bf2]), "butterfly.png")
# borboleta azul (variação)
bf_pal_b = {"x": "#1d2a5a", "o": "#5aa8f0", "y": "#bfe6ff", "k": "#101830"}
save(hstack([from_map("""
xx.....xx
xyox.xoyx
xoox.xoox
.xoxkxox.
.xoxkxox.
xyox.xoyx
.xx...xx.
""", bf_pal_b), from_map("""
.........
...x.x...
..xyxyx..
..xoxox..
...xkx...
..xoxox..
...x.x...
""", bf_pal_b)]), "butterfly_blue.png")

# Galinha (2 quadros: em pé / bicando)
ck_pal = {"x": "#6b4320", "w": "#ffe9a8", "s": "#e9b85c", "S": "#c98d38",
          "r": "#e2382c", "o": "#f39a1e", "k": "#1e1208", "h": "#fff8de"}
chick1 = from_map("""
..........xx......
.........xrrx.....
........xrrrx.....
.......xxhwwxx....
......xhwwwkwx....
......xwwwwwwoox..
......xwwwwwwxxx..
.xx...xwwwwwwrx...
xhwx.xwwwwwwwrx...
xwwwxwwwwwwwwwx...
xwwwwwwssswwwwx...
xswwwwsSSswwwx....
.xsswwwwwwwssx....
..xxsssssssxx.....
....xxxxxxxx......
.....o...o........
.....o...o........
....oo..oo........
""", ck_pal)
chick2 = from_map("""
..................
..................
..................
..................
..........xx......
.xx......xrrx.....
xhwx....xrrrx.....
xwwwx..xhwwwxx....
xwwwwxxwwwwwkwx...
xwwwwwwwwwwwwwoox.
xswwwwwssswwwwxxx.
xswwwwsSSswwwwrx..
.xsswwwwwwwwssrx..
..xxsssssssssxx...
....xxxxxxxxx.....
.....o...o........
.....o...o........
....oo..oo........
""", ck_pal)
save(hstack([chick1, chick2]), "chicken.png")

# Pintinho (detalhe)
chick_small = from_map("""
..xx..
.xyyxo
xyykyo
xyyyx.
.xyyx.
..o.o.
""", {"x": "#9a7420", "y": "#ffe34a", "k": "#1e1208", "o": "#f39a1e"})
save(chick_small, "chick.png")

# Cerca (tile horizontal 16x20)
def fence_tile():
    im = new(16, 20)
    d = ImageDraw.Draw(im)
    o, m, h, k = hexc("#4a2410"), hexc("#b36a2e"), hexc("#dc9550"), hexc("#7d4119")
    # trilhos
    for y0 in (6, 13):
        d.rectangle([0, y0, 15, y0 + 3], fill=o)
        d.rectangle([0, y0 + 1, 15, y0 + 2], fill=m)
        d.line([0, y0 + 1, 15, y0 + 1], fill=h)
    # postes
    for x0 in (2, 10):
        d.rectangle([x0, 2, x0 + 4, 19], fill=o)
        d.rectangle([x0 + 1, 2, x0 + 3, 18], fill=m)
        d.line([x0 + 1, 2, x0 + 1, 18], fill=h)
        d.line([x0 + 3, 3, x0 + 3, 18], fill=k)
        # ponta
        im.putpixel((x0, 2), (0, 0, 0, 0)); im.putpixel((x0 + 4, 2), (0, 0, 0, 0))
        d.line([x0 + 1, 1, x0 + 3, 1], fill=o)
        im.putpixel((x0 + 2, 0), o)
        im.putpixel((x0 + 2, 1), h)
        im.putpixel((x0 + 2, 6), hexc("#d8d0c0"))
        im.putpixel((x0 + 2, 14), hexc("#d8d0c0"))
    return im
save(fence_tile(), "fence.png")

# Arbusto
bush = from_map("""
......oooo........
....ooGGGgoo.ooo..
...oGGGgggggoGGgo.
..oGGgggpgggggggo.
.oGggggggggdgpggo.
.oggpgggdggggggdo.
oGgggggggggggggggo
ogggdgggggpgggdggo
ogdgggggdggggggddo
.oddgdddgggdddddo.
..oooooooooooooo..
""", {"o": "#244f16", "G": "#7fcb52", "g": "#4f9a31", "d": "#356e22", "p": "#ffc0da"})
save(bush, "bush.png")

# Canteiro de tulipas (vários)
bed = new(30, 10)
for i, (c, h, k) in enumerate([("#e8333a", "#ff8d8d", "#9a1a20"), ("#ffd23a", "#fff09a", "#c08a10"),
                               ("#3f8ff0", "#a8d4ff", "#1f4f9a"), ("#e8333a", "#ff8d8d", "#9a1a20"),
                               ("#f48cb5", "#ffc6dc", "#c8517f"), ("#ffd23a", "#fff09a", "#c08a10")]):
    t = tulip(c, h, k)
    bed.paste(t, (i * 5, 1 + (i % 2) * 2 - 1), t)
save(bed, "tulips.png")

# Girassol (verão)
sun = from_map("""
..y.y.y..
.yYyYyYy.
yYoobooYy
.yobbboy.
yYoobooYy
.yYyYyYy.
..y.g.y..
....g....
...Gg....
....gG...
....g....
""", {"y": "#e8a812", "Y": "#ffd53a", "o": "#6b3a12", "b": "#3e1f08", "g": "#3f8a2a", "G": "#6fbe46"})
save(sun, "sunflower.png")

# Flor pequena p/ etiqueta da estação
small_flower = from_map("""
.h.h.
hppph
.pcp.
hppph
.k.k.
""", {"h": "#ffc6dc", "p": "#f48cb5", "c": "#ffd23f", "k": "#c8517f"})
save(small_flower, "flower_small.png")

# Ícone Eventos: bolo
cake = from_map("""
.....r..r.r.....
....rRr.rRr.....
....xrx.xrx.....
..xxxgxxxgxxx...
.xpppppppppppx..
.xPPpPPPpPPPPx..
.xpppppppppppx..
.xcccccccccccx..
.xCCCCCCCCCCCx..
.xcccccccccccx..
.xpppppppppppx..
.xcccccccccccx..
lxxxxxxxxxxxxxl.
llllllllllllllll
.LLLLLLLLLLLLLL.
""", {"r": "#e2302a", "R": "#ff8a7a", "x": "#6b3a20", "g": "#3f8a2a", "p": "#ffb3cc", "P": "#ffe1ec",
      "c": "#fff1cf", "C": "#f3d79c", "l": "#c7c9cf", "L": "#8d9099"})
save(cake, "icon_cake.png")

# Ícone Feriados: barraca verde listrada com bandeirinha
tent = from_map("""
.......r........
.......rr.......
.......k........
......xkx.......
.....xGkgx......
....xGgkgGx.....
...xgGgkGggx....
..xGGgGkgGGgx...
.xgggGgkgGgggx..
xGGGgGgkggGGGGx.
xggxxxxxxxxxggx.
xGGxbbbbbbbxGGx.
xggxbbbbbbbxggx.
xxxxxxxxxxxxxxx.
""", {"r": "#e2302a", "k": "#5a3317", "x": "#1f4a14", "G": "#6fd04a", "g": "#2f8f2a", "b": "#173a10"})
save(tent, "icon_tent.png")

# Marcadores do calendário
save(from_map("""
#..
##.
###
##.
#..
k..
k..
""", {"#": "#2f8f2a", "k": "#5a3317"}), "mark_holiday.png")
save(from_map("""
#..
#w.
#ww
#w.
#..
k..
k..
""", {"#": "#3f6fbf", "w": "#cfe0ff", "k": "#5a3317"}), "mark_optional.png")
save(from_map("""
.r.r.
rRrrr
rrrrr
.rrr.
..r..
""", {"r": "#d8344a", "R": "#ff9aa8"}), "mark_event.png")
save(from_map("""
..y..
.yyy.
yyyyy
.y.y.
""", {"y": "#e8a812"}), "mark_commem.png")

# Setas de madeira
arrow = from_map("""
....xx
...xhx
..xhmx
.xhmmx
xhmmmx
.xmmmx
..xmmx
...xmx
....xx
""", {"x": "#3e1d0a", "h": "#ffe0a8", "m": "#d29254"})
save(arrow, "arrow_left.png")
save(arrow.transpose(Image.FLIP_LEFT_RIGHT), "arrow_right.png")

# Ponta de seta da barra dos dias (placa)
tip = new(8, 13)
d = ImageDraw.Draw(tip)
d.polygon([(0, 0), (1, 0), (7, 6), (1, 12), (0, 12)], fill=hexc("#3e1d0a"))
d.polygon([(0, 1), (1, 1), (6, 6), (1, 11), (0, 11)], fill=hexc("#844524"))
d.line([(0, 2), (4, 5)], fill=hexc("#a8653a"))
save(tip, "bar_tip.png")

# Alto-falante (som)
spk = from_map("""
...x....
..xx..x.
xxhx.x.x
xhhx.x.x
xxhx.x.x
..xx..x.
...x....
""", {"x": "#3e1d0a", "h": "#ffe0a8"})
save(spk, "icon_sound.png")
spk_off = from_map("""
...x....
..xx.r.r
xxhx..r.
xhhx.r.r
xxhx....
..xx....
...x....
""", {"x": "#3e1d0a", "h": "#ffe0a8", "r": "#c0281f"})
save(spk_off, "icon_sound_off.png")

# Lápis e lixeira (editar/excluir)
save(from_map("""
.....xx
....xrx
...xhx.
..xhx..
.xhx...
xkx....
xx.....
""", {"x": "#3e1d0a", "r": "#e2302a", "h": "#ffd25a", "k": "#5a3317"}), "icon_edit.png")
save(from_map("""
..xxx..
xxxxxxx
.xhxhx.
.xhxhx.
.xhxhx.
.xhxhx.
..xxx..
""", {"x": "#3e1d0a", "h": "#b8b8c0"}), "icon_trash.png")

# Mato/capim de borda (topo da grama sobre o céu)
def grass_edge(w=32, seed=9):
    rnd = random.Random(seed)
    im = new(w, 6)
    px = im.load()
    for x in range(w):
        hgt = rnd.choice([1, 2, 2, 3, 4])
        for y in range(6 - hgt, 6):
            px[x, y] = hexc(rnd.choice(["#5aa83a", "#4f9a31", "#6fc24a"]))
        px[x, 6 - hgt] = hexc("#86d35b")
    return im
save(grass_edge(), "grass_edge.png")


# ----------------------------------------------------------- ícone do app

def app_icon():
    im = new(32, 32)
    d = ImageDraw.Draw(im)
    # placa de madeira
    d.rounded_rectangle([1, 3, 30, 30], radius=3, fill=hexc("#3e1d0a"))
    d.rounded_rectangle([2, 4, 29, 29], radius=2, fill=hexc("#a5652f"))
    d.line([3, 5, 28, 5], fill=hexc("#d29254"))
    # topo verde (grama)
    d.rectangle([4, 7, 27, 13], fill=hexc("#3e7f27"))
    d.rectangle([4, 7, 27, 12], fill=hexc("#5aa83a"))
    for x in range(4, 28, 3):
        im.putpixel((x, 7), hexc("#86d35b"))
    # argolas
    for x in (9, 22):
        d.rectangle([x, 1, x + 1, 8], fill=hexc("#3e1d0a"))
        im.putpixel((x, 2), hexc("#d8d0c0"))
    # pergaminho
    d.rectangle([4, 14, 27, 27], fill=hexc("#5b3315"))
    d.rectangle([5, 15, 26, 26], fill=hexc("#f5dcaa"))
    for x in range(5, 27, 4):
        d.line([x + 3, 15, x + 3, 26], fill=hexc("#d9b27a"))
    for y in (18, 22):
        d.line([5, y, 26, y], fill=hexc("#d9b27a"))
    # dia destacado
    d.rectangle([13, 19, 16, 21], fill=hexc("#e2302a"))
    # flor
    fl = small_flower
    im.paste(fl, (24, 1), fl)
    return im

# Ícone do app: ver tools/build_icon.py (gera mipmaps e www/assets/app_icon.png)


# ------------------------------------------------------- modelo do widget
W_W, W_H = 76, 56
# regiões (usadas também pelo código Java: WidgetRenderer.java)
DAY_BOX = (5, 5, 70, 25)      # x0, y0, x1, y1 (inclusive)
MONTH_BOX = (5, 28, 70, 38)
SEASON_BOX = (5, 41, 70, 50)


def widget_template():
    im = new(W_W, W_H)
    d = ImageDraw.Draw(im)
    o = hexc("#3e1d0a")
    # moldura externa
    d.rectangle([0, 1, W_W - 1, W_H - 2], fill=o)
    d.rectangle([1, 0, W_W - 2, W_H - 1], fill=o)
    planks = wood_planks(W_W, 56, 7, ["#a5652f", "#ad6c34", "#c2803f", "#7d4119", "#5b2a10", "#d29254"], 11, False)
    im.paste(planks.crop((0, 0, W_W - 4, W_H - 4)), (2, 2))
    # postes laterais
    for x0 in (1, W_W - 5):
        d.rectangle([x0, 0, x0 + 3, W_H - 1], fill=o)
        d.rectangle([x0 + 1, 1, x0 + 2, W_H - 2], fill=hexc("#b8763a"))
        d.line([x0 + 1, 1, x0 + 1, W_H - 2], fill=hexc("#e0a060"))
        for y in (3, W_H - 4):
            im.putpixel((x0 + 1, y), hexc("#d8d0c0"))
    # painel verde do dia (grama)
    gx0, gy0, gx1, gy1 = DAY_BOX
    d.rectangle([gx0 - 1, gy0 - 1, gx1 + 1, gy1 + 1], fill=o)
    gtex = grass(gx1 - gx0 + 1, gy1 - gy0 + 1, 12, flowers=False)
    im.paste(gtex, (gx0, gy0))
    d.line([gx0, gy0, gx1, gy0], fill=hexc("#86d35b"))
    # faixa do mês (madeira clara)
    mx0, my0, mx1, my1 = MONTH_BOX
    d.rectangle([mx0 - 1, my0 - 1, mx1 + 1, my1 + 1], fill=o)
    mtex = wood_planks(mx1 - mx0 + 1, 16, 16, ["#c27a3a", "#c98240", "#dc9a55", "#9b5a26", "#7d4119", "#e8ad6a"], 13, False)
    im.paste(mtex.crop((0, 2, mx1 - mx0 + 1, my1 - my0 + 3)), (mx0, my0))
    # faixa da estação (verde escuro)
    sx0, sy0, sx1, sy1 = SEASON_BOX
    d.rectangle([sx0 - 1, sy0 - 1, sx1 + 1, sy1 + 1], fill=o)
    d.rectangle([sx0, sy0, sx1, sy1], fill=hexc("#3e8a2a"))
    d.line([sx0, sy0, sx1, sy0], fill=hexc("#5aa83a"))
    d.line([sx0, sy1, sx1, sy1], fill=hexc("#2f6a1d"))
    return im


tmpl = widget_template()
save(tmpl, "widget_template.png", os.path.join(NAT, "drawable-nodpi"))
save(small_flower, "widget_flower.png", os.path.join(NAT, "drawable-nodpi"))


def widget_preview(day="18", month="Abril", season="Primavera"):
    """Prévia do seletor de widgets (mesma lógica do WidgetRenderer.java)."""
    im = tmpl.copy()
    bold = os.path.join(ROOT, "www", "fonts", "FarmPixel-Bold.ttf")
    d = ImageDraw.Draw(im)
    d.fontmode = "1"
    f1 = ImageFont.truetype(bold, 11)
    f2 = ImageFont.truetype(bold, 22)

    def text_w(t, f):
        return int(d.textlength(t, font=f)) - (2 if f is f2 else 1)

    def draw(t, f, box, fill, shadow, extra=0, dy=0):
        x0, y0, x1, y1 = box
        w = text_w(t, f) + extra
        x = x0 + (x1 - x0 + 1 - w) // 2
        cap = 14 if f is f2 else 7
        y = y0 + (y1 - y0 + 1 - cap) // 2 + dy
        asc = 18 if f is f2 else 9  # ascendente em px (900/1100*size)
        d.text((x + 1, y - asc + cap + 1), t, font=f, fill=hexc(shadow), anchor="ls") if False else None
        # PIL: anchor 'ls' = baseline à esquerda
        base = y + cap
        d.text((x + 1, base + 1), t, font=f, fill=hexc(shadow), anchor="ls")
        d.text((x, base), t, font=f, fill=hexc(fill), anchor="ls")
        return x + w

    draw(day, f2, DAY_BOX, "#fff4c8", "#1f4a14")
    draw(month, f1, MONTH_BOX, "#fff0c8", "#5b2a10")
    end = draw(season, f1, SEASON_BOX, "#fff4c8", "#1f4a14", extra=7)
    fl = small_flower
    im.paste(fl, (end - 5, SEASON_BOX[1] + 2), fl)
    return im


prev = widget_preview()
save(prev.resize((W_W * 4, W_H * 4), Image.NEAREST), "widget_preview.png", os.path.join(NAT, "drawable-nodpi"))
save(prev.resize((W_W * 4, W_H * 4), Image.NEAREST), "widget_preview.png", WWW)
print("assets ok")


# ------------------------------------------------------- splash (abertura)
def splash():
    W, H = 180, 320
    im = Image.new("RGBA", (W, H))
    tex = Image.open(os.path.join(WWW, "wood_dark.png"))
    for y in range(0, H, tex.height):
        for x in range(0, W, tex.width):
            im.paste(tex, (x, y))
    ic = Image.open(os.path.join(WWW, "app_icon.png")).convert("RGBA").resize((66, 66), Image.NEAREST)
    im.paste(ic, ((W - 66) // 2, (H - 66) // 2 - 10), ic)
    return im.resize((W * 6, H * 6), Image.NEAREST).convert("RGB")


save(splash(), "splash.png", os.path.join(ROOT, "native", "android", "splash"))
print("splash ok")
