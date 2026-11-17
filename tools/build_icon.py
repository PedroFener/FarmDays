#!/usr/bin/env python3
"""
Ícone do FarmDays em pixel art rural (desenho original, inspirado na estética de
jogos de fazenda; nenhum sprite de terceiros).

Camadas do ícone adaptativo (108 dp, área segura central de 66 dp):
  - fundo:  céu com nuvem + colina de grama
  - frente: placa-calendário de madeira com argolas, página de pergaminho,
            dia de hoje em vermelho, flores rosas e uma galinha espiando
Gera também os ícones legados (quadrado arredondado e redondo).

Uso: python3 tools/build_icon.py
"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAT = os.path.join(ROOT, "native", "android", "res")
WWW = os.path.join(ROOT, "www", "assets")
N = 54  # grade do ícone adaptativo (108 dp / 2)


def c(h):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)


def sprite(rows, pal):
    rows = rows.strip("\n").split("\n")
    im = Image.new("RGBA", (max(map(len, rows)), len(rows)), (0, 0, 0, 0))
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch in pal:
                im.putpixel((x, y), c(pal[ch]))
    return im


# ------------------------------------------------------------------ fundo
def background():
    im = Image.new("RGBA", (N, N), c("#62b6ee"))
    d = ImageDraw.Draw(im)
    bands = ["#57aeea", "#62b6ee", "#70c0f2", "#80caf5", "#93d4f7"]
    for i, col in enumerate(bands):
        d.rectangle([0, i * 7, N - 1, i * 7 + 6], fill=c(col))
    # nuvens
    cloud = sprite("""
...wwww.....
.wwWWWWww...
wWWWWWWWWww.
WWWWWWWWWWWw
bbbbbbbbbbb.
""", {"w": "#e3f2ff", "W": "#ffffff", "b": "#bfe0f7"})
    im.paste(cloud, (5, 9), cloud)
    im.paste(cloud.resize((9, 4), Image.NEAREST), (40, 15), cloud.resize((9, 4), Image.NEAREST))
    # colina de grama
    for x in range(N):
        top = int(36 + 4 * ((x - 27) / 27.0) ** 2)
        d.line([x, top, x, N - 1], fill=c("#5aa83a"))
        d.point((x, top), fill=c("#8fd860"))
        d.point((x, top + 1), fill=c("#73c246"))
    # textura da grama
    import random
    rnd = random.Random(3)
    for _ in range(90):
        x, y = rnd.randrange(N), rnd.randrange(40, N)
        if im.getpixel((x, y))[:3] == c("#5aa83a")[:3]:
            im.putpixel((x, y), c(rnd.choice(["#4a9030", "#66b743", "#3f7f27"])))
    for (x, y, col) in [(6, 47, "#ffffff"), (47, 45, "#ffd3e6"), (10, 51, "#fff27a"), (44, 51, "#ffffff")]:
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            im.putpixel((x + dx, y + dy), c(col))
        im.putpixel((x, y), c("#ffcf3a"))
    return im


# ----------------------------------------------------------------- frente
def foreground():
    im = Image.new("RGBA", (N, N), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    O = c("#3a1a08")      # contorno
    # placa: x 13..40, y 13..41 (área segura ~ 9..45)
    x0, y0, x1, y1 = 13, 14, 40, 41
    # sombra
    d.rectangle([x0 + 1, y0 + 2, x1 + 1, y1 + 2], fill=(40, 18, 4, 110))
    # moldura de madeira
    d.rectangle([x0, y0, x1, y1], fill=O)
    d.rectangle([x0 + 1, y0 + 1, x1 - 1, y1 - 1], fill=c("#b8723a"))
    d.line([x0 + 1, y0 + 1, x1 - 1, y0 + 1], fill=c("#e3a464"))
    d.line([x0 + 1, y0 + 1, x0 + 1, y1 - 1], fill=c("#d8924f"))
    d.line([x1 - 1, y0 + 2, x1 - 1, y1 - 1], fill=c("#8a4d20"))
    d.line([x0 + 2, y1 - 1, x1 - 1, y1 - 1], fill=c("#8a4d20"))
    # faixa do título (madeira clara com veios)
    d.rectangle([x0 + 3, y0 + 3, x1 - 3, y0 + 9], fill=O)
    d.rectangle([x0 + 4, y0 + 4, x1 - 4, y0 + 8], fill=c("#efc283"))
    d.line([x0 + 4, y0 + 4, x1 - 4, y0 + 4], fill=c("#fbe0ad"))
    for gx in (x0 + 7, x0 + 15, x0 + 21):
        d.line([gx, y0 + 6, gx + 3, y0 + 6], fill=c("#c98d4a"))
    # "letreiro" pixel (traços escuros simulando texto)
    for gx in range(x0 + 6, x1 - 5, 3):
        d.line([gx, y0 + 5, gx, y0 + 7], fill=c("#5b2a10"))
        d.point((gx + 1, y0 + 5), fill=c("#5b2a10"))
    # página de pergaminho com grade
    px0, py0, px1, py1 = x0 + 3, y0 + 11, x1 - 3, y1 - 3
    d.rectangle([px0, py0, px1, py1], fill=c("#5b3315"))
    d.rectangle([px0 + 1, py0 + 1, px1 - 1, py1 - 1], fill=c("#f7deac"))
    cols, rows = 5, 3
    cw = (px1 - px0 - 1) / cols
    rh = (py1 - py0 - 1) / rows
    for i in range(1, cols):
        x = int(px0 + 1 + i * cw)
        d.line([x, py0 + 1, x, py1 - 1], fill=c("#cfa169"))
    for j in range(1, rows):
        y = int(py0 + 1 + j * rh)
        d.line([px0 + 1, y, px1 - 1, y], fill=c("#cfa169"))
    # pontinhos dos dias
    for j in range(rows):
        for i in range(cols):
            cx = int(px0 + 1 + i * cw + cw / 2)
            cy = int(py0 + 1 + j * rh + rh / 2)
            d.point((cx, cy), fill=c("#8a5a2a"))
            d.point((cx - 1, cy), fill=c("#8a5a2a"))
    # hoje em vermelho
    tx = int(px0 + 1 + 2 * cw) + 1
    ty = int(py0 + 1 + 1 * rh) + 1
    d.rectangle([tx, ty, tx + int(cw) - 2, ty + int(rh) - 2], fill=c("#e0342a"))
    d.line([tx, ty, tx + int(cw) - 2, ty], fill=c("#ff8a6a"))
    # argolas de metal
    for rx in (x0 + 7, x1 - 7):
        d.rectangle([rx - 1, y0 - 4, rx + 1, y0 + 2], fill=O)
        d.line([rx, y0 - 3, rx, y0 + 1], fill=c("#d8d0c0"))
        d.point((rx, y0 - 3), fill=c("#ffffff"))
    # flores rosas no canto superior direito
    flower = sprite("""
..kk......
.khhk.kk..
khcchkhhk.
kpccpkcchk
.kppkkppk.
.gkkgkkk..
gGg.gG....
.dg..g....
""", {"k": "#a8406a", "h": "#ffc6dc", "p": "#f48cb5", "c": "#ffd23f", "g": "#4f9a31", "G": "#7fcb52", "d": "#2f6a1d"})
    im.paste(flower, (x1 - 6, y0 - 5), flower)
    # galinha espiando no canto inferior esquerdo
    hen = sprite("""
....xx.....
...xrrx....
..xrrrx....
.xxwwwxx...
xhwwwwkwx..
xwwwwwwoox.
xwwwwwwxxx.
xwwwwwwrx..
xswwwwwrx..
xsswwwssx..
.xxxxxxxx..
""", {"x": "#5a3510", "w": "#fff1c4", "h": "#ffffff", "s": "#e9b85c", "r": "#e2382c", "o": "#f39a1e", "k": "#1e1208"})
    im.paste(hen, (x0 - 3, y1 - 9), hen)
    # brilho (estrelinha) no canto
    for (sx, sy) in [(x0 - 2, y0 + 2)]:
        for dx, dy in [(0, -1), (0, 1), (-1, 0), (1, 0)]:
            im.putpixel((sx + dx, sy + dy), c("#fff6b0"))
        im.putpixel((sx, sy), c("#ffffff"))
    return im


def rounded_mask(size, radius):
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return m


def save(im, folder, name):
    os.makedirs(folder, exist_ok=True)
    im.save(os.path.join(folder, name))


if __name__ == "__main__":
    bg, fg = background(), foreground()
    full = bg.copy()
    full.paste(fg, (0, 0), fg)
    # recorte legado: área central 44x44 (como o launcher mostra)
    legacy = full.crop((5, 5, 49, 49))

    FG = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}
    LEG = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
    for dens, s in FG.items():
        folder = os.path.join(NAT, f"mipmap-{dens}")
        save(fg.resize((s, s), Image.NEAREST), folder, "ic_launcher_foreground.png")
        save(bg.resize((s, s), Image.NEAREST), folder, "ic_launcher_background.png")
    for dens, s in LEG.items():
        folder = os.path.join(NAT, f"mipmap-{dens}")
        big = legacy.resize((s * 4, s * 4), Image.NEAREST)
        sq = Image.new("RGBA", big.size, (0, 0, 0, 0))
        sq.paste(big, (0, 0), rounded_mask(big.width, big.width // 6))
        save(sq.resize((s, s), Image.LANCZOS), folder, "ic_launcher.png")
        rd = Image.new("RGBA", big.size, (0, 0, 0, 0))
        m = Image.new("L", big.size, 0)
        ImageDraw.Draw(m).ellipse([0, 0, big.width - 1, big.height - 1], fill=255)
        rd.paste(big, (0, 0), m)
        save(rd.resize((s, s), Image.LANCZOS), folder, "ic_launcher_round.png")

    # web: favicon / README / Play Store (512)
    save(legacy.resize((176, 176), Image.NEAREST), WWW, "app_icon.png")
    store = legacy.resize((44 * 12, 44 * 12), Image.NEAREST).resize((512, 512), Image.NEAREST)
    save(store, os.path.join(ROOT, "docs"), "icon-512.png")
    # prévia: como fica em máscara redonda, squircle e quadrada
    prev = Image.new("RGBA", (3 * 230 + 40, 250), c("#2b2b33"))
    big = full.resize((216, 216), Image.NEAREST)
    for i, kind in enumerate(["circle", "squircle", "square"]):
        m = Image.new("L", (216, 216), 0)
        dd = ImageDraw.Draw(m)
        inset = 20  # launcher mostra ~72 de 108 dp
        box = [inset, inset, 215 - inset, 215 - inset]
        if kind == "circle":
            dd.ellipse(box, fill=255)
        elif kind == "squircle":
            dd.rounded_rectangle(box, radius=50, fill=255)
        else:
            dd.rounded_rectangle(box, radius=16, fill=255)
        tile = Image.new("RGBA", (216, 216), (0, 0, 0, 0))
        tile.paste(big, (0, 0), m)
        prev.paste(tile, (20 + i * 230, 17), tile)
    save(prev, "/tmp", "icon_preview.png")
    print("ícone ok")
