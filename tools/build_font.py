#!/usr/bin/env python3
"""
Gera a fonte pixel original do FarmDays (FarmPixel Regular e Bold) a partir
de bitmaps desenhados à mão neste arquivo. Nenhum glifo é copiado de outra fonte.

Grade: cada pixel = 100 unidades, UPM = 1100.
  - linhas 0..6  -> altura das maiúsculas (acima da linha de base)
  - linhas 7..8  -> descendentes
  - linhas -2..-1 -> acentos das maiúsculas
Assim, font-size: 11px => 1 px de fonte = 1 px CSS; 22px => 2 px; etc.

Uso: python3 tools/build_font.py   (gera www/fonts/FarmPixel-*.ttf)
"""
import os
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

PX = 100
UPM = 1100
ASC = 900
DESC = 200

# --- Glifos base: (linhas, linha_inicial) --------------------------------
G = {}

def g(ch, rows, top=0):
    G[ch] = (rows.strip("\n").split("\n"), top)

# Maiúsculas 5x7
g("A", ".###.\n#...#\n#...#\n#####\n#...#\n#...#\n#...#")
g("B", "####.\n#...#\n#...#\n####.\n#...#\n#...#\n####.")
g("C", ".###.\n#...#\n#....\n#....\n#....\n#...#\n.###.")
g("D", "####.\n#...#\n#...#\n#...#\n#...#\n#...#\n####.")
g("E", "#####\n#....\n#....\n####.\n#....\n#....\n#####")
g("F", "#####\n#....\n#....\n####.\n#....\n#....\n#....")
g("G", ".###.\n#...#\n#....\n#.###\n#...#\n#...#\n.####")
g("H", "#...#\n#...#\n#...#\n#####\n#...#\n#...#\n#...#")
g("I", "###\n.#.\n.#.\n.#.\n.#.\n.#.\n###")
g("J", "..###\n...#.\n...#.\n...#.\n#..#.\n#..#.\n.##..")
g("K", "#...#\n#..#.\n#.#..\n##...\n#.#..\n#..#.\n#...#")
g("L", "#....\n#....\n#....\n#....\n#....\n#....\n#####")
g("M", "#...#\n##.##\n#.#.#\n#.#.#\n#...#\n#...#\n#...#")
g("N", "#...#\n##..#\n#.#.#\n#..##\n#...#\n#...#\n#...#")
g("O", ".###.\n#...#\n#...#\n#...#\n#...#\n#...#\n.###.")
g("P", "####.\n#...#\n#...#\n####.\n#....\n#....\n#....")
g("Q", ".###.\n#...#\n#...#\n#...#\n#.#.#\n#..#.\n.##.#")
g("R", "####.\n#...#\n#...#\n####.\n#.#..\n#..#.\n#...#")
g("S", ".####\n#....\n#....\n.###.\n....#\n....#\n####.")
g("T", "#####\n..#..\n..#..\n..#..\n..#..\n..#..\n..#..")
g("U", "#...#\n#...#\n#...#\n#...#\n#...#\n#...#\n.###.")
g("V", "#...#\n#...#\n#...#\n#...#\n#...#\n.#.#.\n..#..")
g("W", "#...#\n#...#\n#...#\n#.#.#\n#.#.#\n#.#.#\n.#.#.")
g("X", "#...#\n#...#\n.#.#.\n..#..\n.#.#.\n#...#\n#...#")
g("Y", "#...#\n#...#\n.#.#.\n..#..\n..#..\n..#..\n..#..")
g("Z", "#####\n....#\n...#.\n..#..\n.#...\n#....\n#####")

# Dígitos 5x7
g("0", ".###.\n#...#\n#...#\n#...#\n#...#\n#...#\n.###.")
g("1", "..#..\n.##..\n..#..\n..#..\n..#..\n..#..\n.###.")
g("2", ".###.\n#...#\n....#\n...#.\n..#..\n.#...\n#####")
g("3", "####.\n....#\n....#\n.###.\n....#\n....#\n####.")
g("4", "...#.\n..##.\n.#.#.\n#..#.\n#####\n...#.\n...#.")
g("5", "#####\n#....\n####.\n....#\n....#\n#...#\n.###.")
g("6", ".###.\n#....\n#....\n####.\n#...#\n#...#\n.###.")
g("7", "#####\n....#\n...#.\n..#..\n.#...\n.#...\n.#...")
g("8", ".###.\n#...#\n#...#\n.###.\n#...#\n#...#\n.###.")
g("9", ".###.\n#...#\n#...#\n.####\n....#\n....#\n.###.")

# Minúsculas (9 linhas: 0-1 ascendente, 2-6 corpo, 7-8 descendente)
g("a", ".....\n.....\n.###.\n....#\n.####\n#...#\n.####")
g("b", "#....\n#....\n####.\n#...#\n#...#\n#...#\n####.")
g("c", "....\n....\n.###\n#...\n#...\n#...\n.###")
g("d", "....#\n....#\n.####\n#...#\n#...#\n#...#\n.####")
g("e", ".....\n.....\n.###.\n#...#\n#####\n#....\n.###.")
g("f", "..##\n.#..\n####\n.#..\n.#..\n.#..\n.#..")
g("g", ".....\n.....\n.####\n#...#\n#...#\n#...#\n.####\n....#\n.###.")
g("h", "#....\n#....\n####.\n#...#\n#...#\n#...#\n#...#")
g("i", ".#.\n...\n##.\n.#.\n.#.\n.#.\n###")
g("j", "...#\n....\n..##\n...#\n...#\n...#\n...#\n#..#\n.##.")
g("k", "#...\n#...\n#..#\n#.#.\n##..\n#.#.\n#..#")
g("l", "##.\n.#.\n.#.\n.#.\n.#.\n.#.\n###")
g("m", ".....\n.....\n##.#.\n#.#.#\n#.#.#\n#.#.#\n#...#")
g("n", ".....\n.....\n####.\n#...#\n#...#\n#...#\n#...#")
g("o", ".....\n.....\n.###.\n#...#\n#...#\n#...#\n.###.")
g("p", ".....\n.....\n####.\n#...#\n#...#\n#...#\n####.\n#....\n#....")
g("q", ".....\n.....\n.####\n#...#\n#...#\n#...#\n.####\n....#\n....#")
g("r", "....\n....\n#.##\n##..\n#...\n#...\n#...")
g("s", "....\n....\n.###\n#...\n.##.\n...#\n###.")
g("t", ".#..\n.#..\n####\n.#..\n.#..\n.#..\n..##")
g("u", ".....\n.....\n#...#\n#...#\n#...#\n#...#\n.####")
g("v", ".....\n.....\n#...#\n#...#\n#...#\n.#.#.\n..#..")
g("w", ".....\n.....\n#...#\n#...#\n#.#.#\n#.#.#\n.#.#.")
g("x", ".....\n.....\n#...#\n.#.#.\n..#..\n.#.#.\n#...#")
g("y", ".....\n.....\n#...#\n#...#\n#...#\n#...#\n.####\n....#\n.###.")
g("z", ".....\n.....\n#####\n...#.\n..#..\n.#...\n#####")

# Pontuação
g(" ", "...")
g(".", ".\n.\n.\n.\n.\n.\n#")
g(",", "..\n..\n..\n..\n..\n.#\n.#\n#.")
g(":", ".\n.\n#\n.\n.\n.\n#")
g(";", "..\n..\n.#\n..\n..\n.#\n.#\n#.")
g("!", "#\n#\n#\n#\n#\n.\n#")
g("?", ".###.\n#...#\n....#\n...#.\n..#..\n.....\n..#..")
g("-", "....\n....\n....\n####\n....\n....\n....")
g("_", ".....\n.....\n.....\n.....\n.....\n.....\n.....\n#####")
g("+", ".....\n.....\n..#..\n.###.\n..#..\n.....\n.....")
g("=", "....\n....\n####\n....\n####\n....\n....")
g("/", "....#\n...#.\n...#.\n..#..\n.#...\n.#...\n#....")
g("\\", "#....\n.#...\n.#...\n..#..\n...#.\n...#.\n....#")
g("(", ".#\n#.\n#.\n#.\n#.\n#.\n.#")
g(")", "#.\n.#\n.#\n.#\n.#\n.#\n#.")
g("[", "##\n#.\n#.\n#.\n#.\n#.\n##")
g("]", "##\n.#\n.#\n.#\n.#\n.#\n##")
g("<", "...#\n..#.\n.#..\n#...\n.#..\n..#.\n...#")
g(">", "#...\n.#..\n..#.\n...#\n..#.\n.#..\n#...")
g("'", "#\n#")
g('"', "#.#\n#.#")
g("#", ".#.#.\n.#.#.\n#####\n.#.#.\n#####\n.#.#.\n.#.#.")
g("%", "##..#\n##..#\n...#.\n..#..\n.#...\n#..##\n#..##")
g("&", ".##..\n#..#.\n#.#..\n.#...\n#.#.#\n#..#.\n.##.#")
g("*", ".....\n#.#.#\n.###.\n#####\n.###.\n#.#.#\n.....")
g("@", ".###.\n#...#\n#.###\n#.#.#\n#.###\n#....\n.###.")
g("$", "..#..\n.####\n#.#..\n.###.\n..#.#\n####.\n..#..")
g("°", ".#.\n#.#\n.#.")
g("º", ".#.\n#.#\n.#.\n...\n###")
g("ª", ".##\n#.#\n.##\n...\n###")
g("|", "#\n#\n#\n#\n#\n#\n#\n#\n#")
g("~", ".....\n.....\n.....\n.##.#\n#..#.\n.....\n.....")
g("…", ".....\n.....\n.....\n.....\n.....\n.....\n#.#.#")
g("•", "...\n...\n.#.\n###\n.#.\n...\n...")
g("‹", "..#\n.#.\n#..\n.#.\n..#", 1)
g("›", "#..\n.#.\n..#\n.#.\n#..", 1)

# --- Acentos -------------------------------------------------------------
ACC = {
    "acute": ["...#.", "..#.."],
    "grave": [".#...", "..#.."],
    "circ": ["..#..", ".#.#."],
    "tilde": [".##.#", "#..#."],
    "uml": [".#.#.", "....."],
}

def center(mark, width):
    """Recorta/centraliza a marca de 5 colunas na largura do glifo."""
    out = []
    for row in mark:
        if width >= 5:
            pad = (width - 5) // 2
            out.append("." * pad + row + "." * (width - 5 - pad))
        else:
            cut = (5 - width) // 2
            out.append(row[cut:cut + width])
    return out

def accented(base, acc, newch):
    rows, top = G[base]
    w = len(rows[0])
    mark = center(ACC[acc], w)
    if base.islower():
        rows = list(rows)
        rows[0], rows[1] = mark[0], mark[1]
        G[newch] = (rows, 0)
    else:
        G[newch] = (mark + list(rows), -2)

for base, variants in {
    "a": {"á": "acute", "à": "grave", "â": "circ", "ã": "tilde", "ä": "uml"},
    "e": {"é": "acute", "è": "grave", "ê": "circ", "ë": "uml"},
    "o": {"ó": "acute", "ò": "grave", "ô": "circ", "õ": "tilde", "ö": "uml"},
    "u": {"ú": "acute", "ù": "grave", "û": "circ", "ü": "uml"},
    "n": {"ñ": "tilde"},
    "A": {"Á": "acute", "À": "grave", "Â": "circ", "Ã": "tilde"},
    "E": {"É": "acute", "Ê": "circ"},
    "I": {"Í": "acute"},
    "O": {"Ó": "acute", "Ô": "circ", "Õ": "tilde"},
    "U": {"Ú": "acute", "Ü": "uml"},
}.items():
    for ch, acc in variants.items():
        accented(base, acc, ch)

# i acentuado (3 colunas) desenhado à parte
g("í", "..#\n.#.\n##.\n.#.\n.#.\n.#.\n###")
g("ì", "#..\n.#.\n##.\n.#.\n.#.\n.#.\n###")
g("î", ".#.\n#.#\n##.\n.#.\n.#.\n.#.\n###")
# cedilha
g("ç", "....\n....\n.###\n#...\n#...\n#...\n.###\n..#.\n.##.")
G["Ç"] = (G["C"][0] + ["..#..", ".##.."], 0)

# --- Construção ----------------------------------------------------------

BOLD_OVERRIDE = {
    "m": ["........", "........", "#######.", "##.##.##", "##.##.##", "##.##.##", "##.##.##"],
    "w": ["........", "........", "##.##.##", "##.##.##", "##.##.##", "##.##.##", ".######."],
    "M": ["##....##", "###..###", "##.##.##", "##.##.##", "##....##", "##....##", "##....##"],
    "W": ["##....##", "##....##", "##....##", "##.##.##", "##.##.##", "##.##.##", ".##..##."],
    "#": [".##.##.", "#######", ".##.##.", ".##.##.", "#######", ".##.##.", "......."],
}


def bold(rows, ch=None):
    """Negrito: cada linha OR deslocada 1 px à direita (largura +1)."""
    if ch in BOLD_OVERRIDE:
        return BOLD_OVERRIDE[ch]
    out = []
    for r in rows:
        a = r + "."
        b = "." + r
        out.append("".join("#" if (x == "#" or y == "#") else "." for x, y in zip(a, b)))
    return out

def draw_glyph(rows, top):
    pen = TTGlyphPen(None)
    for i, row in enumerate(rows):
        r = top + i
        y_top = (7 - r) * PX
        y_bot = (6 - r) * PX
        x = 0
        while x < len(row):
            if row[x] == "#":
                s = x
                while x < len(row) and row[x] == "#":
                    x += 1
                x0, x1 = s * PX, x * PX
                # sentido horário (contorno externo TrueType)
                pen.moveTo((x0, y_bot))
                pen.lineTo((x0, y_top))
                pen.lineTo((x1, y_top))
                pen.lineTo((x1, y_bot))
                pen.closePath()
            else:
                x += 1
    return pen.glyph()

def glyph_name(ch):
    return "space" if ch == " " else "uni%04X" % ord(ch)

def build(style, out_path):
    names = [".notdef"]
    cmap = {}
    glyphs = {}
    metrics = {}
    # .notdef = caixa vazia
    nd = TTGlyphPen(None)
    for (x0, y0, x1, y1) in [(0, 0, 400, 100), (0, 600, 400, 700), (0, 100, 100, 600), (300, 100, 400, 600)]:
        nd.moveTo((x0, y0)); nd.lineTo((x0, y1)); nd.lineTo((x1, y1)); nd.lineTo((x1, y0)); nd.closePath()
    glyphs[".notdef"] = nd.glyph()
    metrics[".notdef"] = (500, 0)

    for ch, (rows, top) in sorted(G.items()):
        if style == "Bold" and ch != " ":
            rows = bold(rows, ch)
        name = glyph_name(ch)
        w = len(rows[0])
        adv = (w + 1) * PX if ch != " " else (4 if style == "Regular" else 5) * PX
        glyphs[name] = draw_glyph(rows, top) if ch != " " else TTGlyphPen(None).glyph()
        metrics[name] = (adv, 0)
        names.append(name)
        cmap[ord(ch)] = name
    # NBSP = espaço
    cmap[0xA0] = "space"

    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(names)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=ASC, descent=-DESC, lineGap=0)
    family = "FarmPixel"
    fb.setupNameTable({
        "familyName": family,
        "styleName": style,
        "uniqueFontIdentifier": f"{family}-{style}-1.0",
        "fullName": f"{family} {style}",
        "psName": f"{family}-{style}",
        "version": "Version 1.000",
        "copyright": "FarmDays project - original pixel font",
        "licenseDescription": "MIT License (projeto FarmDays)",
    })
    fb.setupOS2(
        sTypoAscender=ASC, sTypoDescender=-DESC, sTypoLineGap=0,
        usWinAscent=ASC, usWinDescent=DESC, sxHeight=500, sCapHeight=700,
        usWeightClass=700 if style == "Bold" else 400,
        fsSelection=0x20 if style == "Bold" else 0x40,
    )
    fb.setupPost()
    fb.setupHead(unitsPerEm=UPM, macStyle=1 if style == "Bold" else 0)
    fb.save(out_path)
    return len(names)

if __name__ == "__main__":
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = os.path.join(root, "www", "fonts")
    os.makedirs(out, exist_ok=True)
    for style in ("Regular", "Bold"):
        n = build(style, os.path.join(out, f"FarmPixel-{style}.ttf"))
        print(f"FarmPixel-{style}.ttf: {n} glifos")
