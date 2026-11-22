#!/usr/bin/env python3
"""Makes the art for the 12 themed Arcade worlds: for each theme one character sprite (sp_<id>.png) and one scene drawn
   natively in five screen shapes (p 9:16, t 3:4, s 1:1, w 16:9, u 21:9) -> bg_<id>_<shape>.jpg.
   Keep THEMES in sync with the list in assets/arcade.js. Usage: python3 tools/make-theme-art.py (needs Pillow)"""
import os, math, random
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, '..', 'arcade', 'img')
SHAPES = {'p': (540, 960), 't': (720, 960), 's': (768, 768), 'w': (960, 540), 'u': (1260, 540)}
SS = 2

def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
def vgrad(w, h, a, b):
    im = Image.new('RGB', (w, h)); d = ImageDraw.Draw(im)
    for y in range(h): d.line([(0, y), (w, y)], fill=lerp(a, b, y / max(1, h - 1)))
    return im

# name: sky top, sky bottom, celestial (kind, x), layers [(kind, color, ybase)], decor, particles
THEMES = {
 'dino':    dict(sky=((110, 190, 235), (250, 232, 170)), sun='sun', layers=[('mount', (150, 165, 140), .62), ('hill', (86, 160, 80), .74), ('hill', (46, 120, 60), .88)], decor='fern', part='none'),
 'jungle':  dict(sky=((30, 110, 90), (190, 235, 150)), sun='sun', layers=[('hill', (46, 130, 80), .6), ('hill', (26, 100, 60), .76), ('hill', (14, 70, 44), .92)], decor='palm', part='firefly'),
 'desert':  dict(sky=((250, 170, 110), (255, 236, 190)), sun='bigsun', layers=[('dune', (236, 178, 96), .66), ('dune', (206, 140, 66), .8), ('dune', (170, 106, 48), .94)], decor='cactus', part='none'),
 'arctic':  dict(sky=((16, 36, 90), (150, 208, 235)), sun='aurora', layers=[('mount', (176, 206, 232), .6), ('hill', (226, 240, 250), .78), ('hill', (250, 253, 255), .92)], decor='pine', part='snow'),
 'volcano': dict(sky=((50, 8, 12), (250, 110, 30)), sun='glow', layers=[('volcano', (50, 28, 30), .5), ('hill', (40, 22, 26), .8), ('hill', (24, 14, 18), .94)], decor='none', part='ember'),
 'candy':   dict(sky=((255, 170, 220), (210, 200, 255)), sun='sun', layers=[('hill', (255, 190, 215), .66), ('hill', (190, 235, 220), .8), ('hill', (255, 220, 160), .93)], decor='lolli', part='sparkle'),
 'pirate':  dict(sky=((255, 160, 100), (255, 232, 170)), sun='bigsun', layers=[('wave', (40, 120, 170), .62), ('wave', (24, 86, 140), .78), ('wave', (14, 56, 104), .92)], decor='ship', part='none'),
 'robot':   dict(sky=((14, 18, 56), (70, 80, 150)), sun='stars', layers=[('city', (40, 48, 100), .6), ('city', (24, 30, 74), .78), ('city', (12, 16, 44), .96)], decor='none', part='sparkle'),
 'farm':    dict(sky=((130, 196, 255), (232, 246, 255)), sun='cloud', layers=[('hill', (140, 205, 90), .66), ('hill', (96, 170, 70), .8), ('hill', (66, 140, 56), .94)], decor='barn', part='none'),
 'haunted': dict(sky=((18, 8, 38), (96, 44, 104)), sun='moon', layers=[('hill', (44, 28, 70), .72), ('hill', (28, 16, 50), .86), ('hill', (14, 8, 30), .96)], decor='cross', part='bat'),
 'rainbow': dict(sky=((140, 205, 255), (255, 240, 250)), sun='rainbow', layers=[('hill', (170, 230, 150), .72), ('hill', (120, 205, 130), .86), ('hill', (80, 180, 110), .96)], decor='none', part='sparkle'),
 'island':  dict(sky=((60, 190, 235), (200, 245, 250)), sun='sun', layers=[('wave', (40, 170, 210), .64), ('island', (240, 214, 150), .74), ('wave', (20, 120, 180), .9)], decor='palm2', part='none'),
}

def scene(name, w, h, rnd):
    t = THEMES[name]; W, H = w * SS, h * SS; u = min(W, H) / 700
    im = vgrad(W, H, *t['sky']).convert('RGBA'); d = ImageDraw.Draw(im, 'RGBA')
    sx, sy = W * rnd.choice([.22, .78]), H * .26
    def glow(x, y, r, col, a):
        g = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(g).ellipse([x - r, y - r, x + r, y + r], fill=col + (a,))
        return Image.alpha_composite(im, g.filter(ImageFilter.GaussianBlur(r * .35)))
    k = t['sun']
    if k in ('sun', 'bigsun', 'glow', 'moon'):
        r = {'sun': 52, 'bigsun': 95, 'glow': 70, 'moon': 62}[k] * u; col = (255, 244, 200) if k != 'glow' else (255, 170, 60)
        im = glow(sx, sy, r * 2.4, col, 80); d = ImageDraw.Draw(im, 'RGBA'); d.ellipse([sx - r, sy - r, sx + r, sy + r], fill=col + (255,))
        if k == 'moon': d.ellipse([sx - r * .4, sy - r * .5, sx + r * .1, sy], fill=(235, 225, 190, 255))
    if k in ('stars', 'moon', 'aurora'):
        for i in range(int(W * H / 9000)):
            x, y, r = rnd.uniform(0, W), rnd.uniform(0, H * .5), rnd.uniform(.8, 2.4) * u; d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, 220))
    if k == 'aurora':
        g = Image.new('RGBA', (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(g)
        for c in ((80, 255, 170, 90), (120, 160, 255, 70)):
            pts = [(x, H * (.18 + .08 * math.sin(x / (200 * u) + c[0]))) for x in range(0, W + 20, 20)]
            gd.polygon(pts + [(W, H * .5), (0, H * .5)], fill=c)
        im = Image.alpha_composite(im, g.filter(ImageFilter.GaussianBlur(26 * u))); d = ImageDraw.Draw(im, 'RGBA')
    if k in ('cloud', 'rainbow', 'sun'):
        for i in range(4 + W // 500):
            cx, cy = rnd.uniform(0, W), rnd.uniform(H * .08, H * .42); s = rnd.uniform(40, 80) * u
            for j in range(4): d.ellipse([cx + j * s * .7 - s, cy - s * (.5 + (j % 2) * .2), cx + j * s * .7 + s * .2, cy + s * .5], fill=(255, 255, 255, 215))
    if k == 'rainbow':
        cols = [(255, 80, 80), (255, 170, 60), (255, 230, 70), (90, 210, 100), (80, 160, 255), (160, 100, 230)]
        cx, cy = W / 2, H * .72; R = min(W * .48, H * .5)
        for i, c in enumerate(cols): d.arc([cx - R + i * 18 * u, cy - R + i * 18 * u, cx + R - i * 18 * u, cy + R - i * 18 * u], 180, 360, fill=c + (235,), width=int(20 * u))
    ridge_cache = []
    for kind, col, yy in t['layers']:
        base = H * yy; ph = yy * 9
        def ridge(x, kind=kind, base=base, ph=ph):
            if kind == 'mount': return base - 120 * u * (abs(math.sin(x / (170 * u) + ph)) ** .8)
            if kind == 'dune': return base - 46 * u * (.5 + .5 * math.sin(x / (220 * u) + ph)) - 18 * u * math.sin(x / (70 * u))
            if kind == 'wave': return base + 10 * u * math.sin(x / (60 * u) + ph)
            if kind == 'island': return base - 90 * u * max(0, math.sin((x / W) * math.pi)) ** 3
            if kind == 'volcano': return base - 260 * u * max(0, 1 - abs(x - W * .5) / (W * .34)) ** 1.1
            return base - 44 * u * (.5 + .5 * math.sin(x / (240 * u) + ph))
        if kind == 'city':
            x = 0
            while x < W:
                bw = rnd.uniform(50, 120) * u; bh = rnd.uniform(60, 260) * u * (1.4 - yy); top = H * yy - bh
                d.rectangle([x, top, x + bw, H], fill=col + (255,))
                for wy in range(int(top + 12 * u), int(H * yy), int(26 * u)):
                    for wx in range(int(x + 10 * u), int(x + bw - 14 * u), int(22 * u)):
                        if rnd.random() < .45: d.rectangle([wx, wy, wx + 9 * u, wy + 12 * u], fill=(255, 225, 120, 230))
                x += bw + rnd.uniform(0, 10) * u
        else:
            d.polygon([(0, H)] + [(x, ridge(x)) for x in range(0, W + 20, 20)] + [(W, H)], fill=col + (255,))
            if kind == 'volcano':
                d.polygon([(W * .5 - 60 * u, ridge(W * .5) + 6 * u), (W * .5 + 60 * u, ridge(W * .5) + 6 * u), (W * .5 + 20 * u, ridge(W * .5) + 160 * u), (W * .5 - 24 * u, ridge(W * .5) + 140 * u)], fill=(255, 120, 30, 255))
            if kind == 'mount' and name == 'arctic':
                pass
        ridge_cache.append(ridge)
    # decor on the nearest layers
    dec = t['decor']; ridge = ridge_cache[-2] if len(ridge_cache) > 1 else ridge_cache[-1]
    for i in range(int(W / (120 * u))):
        x = rnd.uniform(0, W); y = ridge(x) + 6 * u; s = rnd.uniform(.8, 1.4) * u
        if dec == 'fern' or dec == 'palm' or dec == 'palm2':
            g = (30, 120, 50, 255) if dec != 'palm2' else (30, 150, 70, 255)
            d.line([(x, y), (x + 6 * s, y - 90 * s)], fill=(110, 80, 50, 255), width=int(8 * s))
            for a in (-2.6, -2.1, -1.0, -.5, -1.6): d.line([(x + 6 * s, y - 90 * s), (x + 6 * s + math.cos(a) * 60 * s, y - 90 * s - math.sin(a) * -45 * s * -1)], fill=g, width=int(9 * s))
        elif dec == 'cactus':
            c = (60, 130, 70, 255); d.rounded_rectangle([x - 8 * s, y - 80 * s, x + 8 * s, y], 8 * s, fill=c); d.rounded_rectangle([x - 28 * s, y - 56 * s, x - 14 * s, y - 28 * s], 6 * s, fill=c); d.rounded_rectangle([x + 14 * s, y - 62 * s, x + 28 * s, y - 34 * s], 6 * s, fill=c)
        elif dec == 'pine':
            d.polygon([(x, y - 90 * s), (x - 30 * s, y), (x + 30 * s, y)], fill=(40, 100, 90, 255)); d.polygon([(x, y - 90 * s), (x - 12 * s, y - 60 * s), (x + 12 * s, y - 60 * s)], fill=(250, 255, 255, 255))
        elif dec == 'lolli':
            d.line([(x, y), (x, y - 80 * s)], fill=(255, 255, 255, 255), width=int(6 * s)); c = rnd.choice([(255, 90, 150), (90, 200, 255), (255, 200, 60)])
            d.ellipse([x - 26 * s, y - 130 * s, x + 26 * s, y - 78 * s], fill=c + (255,)); d.arc([x - 16 * s, y - 120 * s, x + 16 * s, y - 88 * s], 0, 270, fill=(255, 255, 255, 255), width=int(5 * s))
        elif dec == 'barn' and i % 6 == 0:
            d.rectangle([x - 40 * s, y - 60 * s, x + 40 * s, y], fill=(200, 50, 50, 255)); d.polygon([(x - 46 * s, y - 60 * s), (x, y - 100 * s), (x + 46 * s, y - 60 * s)], fill=(150, 30, 40, 255)); d.rectangle([x - 12 * s, y - 34 * s, x + 12 * s, y], fill=(255, 235, 220, 255))
        elif dec == 'cross':
            d.rectangle([x - 4 * s, y - 56 * s, x + 4 * s, y], fill=(20, 12, 34, 255)); d.rectangle([x - 16 * s, y - 42 * s, x + 16 * s, y - 34 * s], fill=(20, 12, 34, 255))
        elif dec == 'ship' and i % 7 == 0:
            yy = H * .62; d.polygon([(x - 50 * s, yy), (x + 50 * s, yy), (x + 30 * s, yy + 24 * s), (x - 30 * s, yy + 24 * s)], fill=(60, 36, 24, 255)); d.line([(x, yy), (x, yy - 90 * s)], fill=(60, 36, 24, 255), width=int(5 * s)); d.polygon([(x, yy - 86 * s), (x + 44 * s, yy - 20 * s), (x, yy - 20 * s)], fill=(250, 245, 230, 255))
    p = t['part']; ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    for i in range(int(W * H / 22000)):
        x, y, r = rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(2, 5) * u
        if p == 'snow': od.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, 230))
        elif p == 'ember': od.ellipse([x - r, y - r, x + r, y + r], fill=(255, rnd.randint(120, 200), 40, 230))
        elif p == 'firefly': od.ellipse([x - r * 2, y - r * 2, x + r * 2, y + r * 2], fill=(255, 250, 150, 90)); od.ellipse([x - r * .6, y - r * .6, x + r * .6, y + r * .6], fill=(255, 255, 210, 255))
        elif p == 'sparkle': od.polygon([(x, y - r * 2), (x + r * .6, y - r * .6), (x + r * 2, y), (x + r * .6, y + r * .6), (x, y + r * 2), (x - r * .6, y + r * .6), (x - r * 2, y), (x - r * .6, y - r * .6)], fill=(255, 255, 255, 220))
        elif p == 'bat' and i % 5 == 0: od.polygon([(x - 18 * u, y - 8 * u), (x, y), (x + 18 * u, y - 8 * u), (x + 10 * u, y + 6 * u), (x, y + 2 * u), (x - 10 * u, y + 6 * u)], fill=(10, 4, 20, 255))
    im = Image.alpha_composite(im, ov.filter(ImageFilter.GaussianBlur(.8 * u)))
    return im.convert('RGB').resize((w, h), Image.LANCZOS)

def eyes(d, s, y=.42, dx=.12, r=.06):
    for sgn in (-1, 1):
        cx = s * (.5 + sgn * dx); d.ellipse([cx - s * r, s * y - s * r, cx + s * r, s * y + s * r], fill=(255, 255, 255)); d.ellipse([cx - s * r * .5, s * y - s * r * .5, cx + s * r * .6, s * y + s * r * .6], fill=(20, 20, 40))
def smile(d, s, y=.55): d.arc([s * .4, s * (y - .06), s * .6, s * (y + .08)], 15, 165, fill=(40, 20, 30), width=max(2, int(s * .016)))
def body(d, s, col, box=(.2, .2, .8, .86)): d.ellipse([s * box[0], s * box[1], s * box[2], s * box[3]], fill=col, outline=tuple(int(c * .6) for c in col), width=int(s * .012))

def sp_dino(d, s):
    for i in range(5): x = s * (.34 + i * .08); d.polygon([(x - s * .04, s * .22 + abs(2 - i) * s * .02), (x, s * .08 + abs(2 - i) * s * .03), (x + s * .04, s * .22 + abs(2 - i) * s * .02)], fill=(250, 140, 50))
    body(d, s, (90, 200, 90)); d.ellipse([s * .3, s * .55, s * .7, s * .84], fill=(210, 240, 150)); eyes(d, s); smile(d, s, .5)
def sp_jungle(d, s):
    for sg in (-1, 1): d.ellipse([s * (.5 + sg * .34) - s * .1, s * .3 - s * .1, s * (.5 + sg * .34) + s * .1, s * .3 + s * .1], fill=(140, 90, 50))
    body(d, s, (160, 105, 60)); d.ellipse([s * .3, s * .42, s * .7, s * .8], fill=(240, 205, 160)); eyes(d, s, .46); smile(d, s, .62)
def sp_desert(d, s):
    for sg in (-1, 1): d.polygon([(s * (.5 + sg * .12), s * .26), (s * (.5 + sg * .3), s * .02), (s * (.5 + sg * .36), s * .3)], fill=(240, 150, 60))
    body(d, s, (245, 160, 70)); d.ellipse([s * .32, s * .5, s * .68, s * .84], fill=(255, 235, 200)); eyes(d, s); d.ellipse([s * .46, s * .52, s * .54, s * .58], fill=(60, 30, 30))
def sp_arctic(d, s):
    body(d, s, (30, 40, 70)); d.ellipse([s * .3, s * .38, s * .7, s * .84], fill=(250, 250, 255)); eyes(d, s, .36); d.polygon([(s * .44, s * .44), (s * .56, s * .44), (s * .5, s * .54)], fill=(255, 170, 40))
def sp_volcano(d, s):
    for sg in (-1, 1): d.polygon([(s * (.5 + sg * .14), s * .26), (s * (.5 + sg * .24), s * .04), (s * (.5 + sg * .3), s * .3)], fill=(255, 220, 90))
    body(d, s, (235, 70, 50)); d.ellipse([s * .3, s * .5, s * .7, s * .84], fill=(255, 150, 60)); eyes(d, s); smile(d, s, .5)
def sp_candy(d, s):
    d.polygon([(s * .06, s * .3), (s * .3, s * .5), (s * .06, s * .7)], fill=(255, 120, 170)); d.polygon([(s * .94, s * .3), (s * .7, s * .5), (s * .94, s * .7)], fill=(255, 120, 170))
    body(d, s, (255, 150, 195), (.24, .22, .76, .78)); d.arc([s * .3, s * .3, s * .7, s * .7], 0, 270, fill=(255, 255, 255), width=int(s * .035)); eyes(d, s, .46, .1); smile(d, s, .58)
def sp_pirate(d, s):
    body(d, s, (245, 205, 160)); d.pieslice([s * .2, s * .2, s * .8, s * .62], 180, 360, fill=(210, 50, 60)); d.ellipse([s * .3, s * .34, s * .46, s * .5], fill=(20, 20, 30)); d.line([(s * .2, s * .3), (s * .6, s * .5)], fill=(20, 20, 30), width=int(s * .02))
    d.ellipse([s * .56, s * .36, s * .68, s * .48], fill=(255, 255, 255)); d.ellipse([s * .6, s * .39, s * .66, s * .45], fill=(20, 20, 40)); smile(d, s, .62)
def sp_robot(d, s):
    d.line([(s * .5, s * .06), (s * .5, s * .2)], fill=(90, 100, 120), width=int(s * .025)); d.ellipse([s * .45, s * .02, s * .55, s * .12], fill=(255, 80, 80))
    d.rounded_rectangle([s * .18, s * .2, s * .82, s * .82], s * .1, fill=(150, 170, 200), outline=(90, 105, 130), width=int(s * .012)); d.rounded_rectangle([s * .26, s * .3, s * .74, s * .56], s * .06, fill=(30, 40, 70)); 
    for sg in (-1, 1): d.ellipse([s * (.5 + sg * .12) - s * .05, s * .43 - s * .05, s * (.5 + sg * .12) + s * .05, s * .43 + s * .05], fill=(110, 240, 255))
    d.rectangle([s * .36, s * .64, s * .64, s * .7], fill=(60, 70, 95))
def sp_farm(d, s):
    for sg in (-1, 1): d.polygon([(s * (.5 + sg * .18), s * .26), (s * (.5 + sg * .36), s * .18), (s * (.5 + sg * .3), s * .4)], fill=(240, 150, 170))
    body(d, s, (255, 180, 195)); d.ellipse([s * .34, s * .5, s * .66, s * .72], fill=(250, 140, 165)); 
    for sg in (-1, 1): d.ellipse([s * (.5 + sg * .05) - s * .018, s * .6 - s * .025, s * (.5 + sg * .05) + s * .018, s * .6 + s * .025], fill=(120, 40, 60))
    eyes(d, s, .4, .15)
def sp_haunted(d, s):
    d.polygon([(s * .2, s * .5), (s * .2, s * .86), (s * .32, s * .78), (s * .44, s * .88), (s * .56, s * .78), (s * .68, s * .88), (s * .8, s * .78), (s * .8, s * .5)], fill=(245, 245, 255))
    d.ellipse([s * .2, s * .14, s * .8, s * .72], fill=(245, 245, 255)); 
    for sg in (-1, 1): d.ellipse([s * (.5 + sg * .12) - s * .05, s * .38 - s * .07, s * (.5 + sg * .12) + s * .05, s * .38 + s * .07], fill=(40, 30, 70))
    d.ellipse([s * .45, s * .52, s * .55, s * .62], fill=(40, 30, 70))
def sp_rainbow(d, s):
    d.polygon([(s * .5, s * .02), (s * .43, s * .26), (s * .57, s * .26)], fill=(255, 215, 80)); cols = [(255, 90, 90), (255, 190, 60), (110, 210, 110), (90, 160, 255)]
    for i, c in enumerate(cols): d.ellipse([s * (.08 + i * .02), s * (.2 + i * .06), s * .3, s * (.86)], fill=c)
    body(d, s, (255, 255, 255), (.24, .24, .76, .84)); eyes(d, s, .46, .1); smile(d, s, .6)
def sp_island(d, s):
    d.polygon([(s * .5, s * .5), (s * .96, s * .56), (s * .86, s * .7), (s * .6, s * .66)], fill=(60, 180, 110)); body(d, s, (240, 70, 70), (.2, .2, .74, .86)); d.ellipse([s * .3, s * .5, s * .62, s * .82], fill=(255, 210, 90))
    d.polygon([(s * .66, s * .34), (s * .9, s * .44), (s * .66, s * .5)], fill=(255, 170, 40)); eyes(d, s, .36, .09)
SPRITES = dict(dino=sp_dino, jungle=sp_jungle, desert=sp_desert, arctic=sp_arctic, volcano=sp_volcano, candy=sp_candy, pirate=sp_pirate, robot=sp_robot, farm=sp_farm, haunted=sp_haunted, rainbow=sp_rainbow, island=sp_island)

if __name__ == '__main__':
    for name in THEMES:
        seed = sum(map(ord, name))
        for k, (w, h) in SHAPES.items():
            scene(name, w, h, random.Random(seed + ord(k))).save(os.path.join(IMG, 'bg_%s_%s.jpg' % (name, k)), 'JPEG', quality=72, optimize=True, progressive=True)
        im = Image.new('RGBA', (512, 512), (0, 0, 0, 0)); SPRITES[name](ImageDraw.Draw(im), 512)
        im.resize((256, 256), Image.LANCZOS).save(os.path.join(IMG, 'sp_%s.png' % name), optimize=True)
        print(name)
