#!/usr/bin/env python3
"""Draws the 1.3 Arcade art natively for every screen shape (not cropped, so each ratio is composed properly):
   p 9:16 phone portrait, t 3:4 tablet portrait, s 1:1, w 16:9, u 21:9 ultrawide.
   Output: arcade/img/bg_ocean[_k].jpg, bg_forest[_k].jpg (bg_<name>.jpg is the 16:9 fallback) and the new sprites.
   Usage: python3 tools/make-new-art.py   (needs Pillow)"""
import os, math, random
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, '..', 'arcade', 'img')
SHAPES = {'p': (720, 1280), 't': (960, 1280), 's': (1024, 1024), 'w': (1280, 720), 'u': (1680, 720)}
SS = 2  # supersample

def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def vgrad(w, h, stops):
    im = Image.new('RGB', (w, h)); d = ImageDraw.Draw(im)
    for y in range(h):
        t = y / max(1, h - 1)
        for i in range(len(stops) - 1):
            if stops[i][0] <= t <= stops[i + 1][0]:
                u = (t - stops[i][0]) / (stops[i + 1][0] - stops[i][0]); d.line([(0, y), (w, y)], fill=lerp(stops[i][1], stops[i + 1][1], u)); break
    return im

def ocean(w, h, rnd):
    W, H = w * SS, h * SS; u = min(W, H) / 700
    im = vgrad(W, H, [(0, (64, 190, 230)), (.35, (22, 118, 190)), (1, (6, 30, 90))]).convert('RGBA')
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    for i in range(5 + W // 400):                                   # light rays from the surface
        x = rnd.uniform(0, W); wd = rnd.uniform(40, 120) * u; ln = H * rnd.uniform(.5, .9); sk = rnd.uniform(.1, .35) * ln
        d.polygon([(x, 0), (x + wd, 0), (x + wd * 2.2 - sk, ln), (x + wd * .6 - sk, ln)], fill=(255, 255, 255, 22))
    ov = ov.filter(ImageFilter.GaussianBlur(18 * u)); im = Image.alpha_composite(im, ov)
    d = ImageDraw.Draw(im, 'RGBA')
    for i in range(int(W * H / 26000)):                              # bubbles
        r = rnd.uniform(3, 14) * u; x = rnd.uniform(0, W); y = rnd.uniform(0, H * .92)
        d.ellipse([x - r, y - r, x + r, y + r], outline=(220, 245, 255, 150), width=max(1, int(2 * u)))
        d.ellipse([x - r * .45, y - r * .6, x - r * .1, y - r * .25], fill=(255, 255, 255, 170))
    sand = int(H * .13); base = H - sand                              # sea floor
    far = Image.new('RGBA', (W, H), (0, 0, 0, 0)); fd = ImageDraw.Draw(far)
    pts = [(0, H)]
    for x in range(0, W + 40, 40): pts.append((x, base - sand * .5 - 30 * u * (1 + math.sin(x / (150 * u) + 1))))
    pts.append((W, H)); fd.polygon(pts, fill=(12, 70, 120, 255)); im = Image.alpha_composite(im, far); d = ImageDraw.Draw(im, 'RGBA')
    pts = [(0, H)]
    for x in range(0, W + 30, 30): pts.append((x, base + 12 * u * math.sin(x / (110 * u))))
    pts.append((W, H)); d.polygon(pts, fill=(224, 196, 140, 255))
    for i in range(int(W / (90 * u))):                               # seaweed
        x = rnd.uniform(0, W); hh = rnd.uniform(90, 260) * u; col = rnd.choice([(24, 160, 110, 255), (16, 130, 100, 255), (60, 190, 120, 255)])
        prev = (x, base + 10 * u)
        for k in range(1, 13):
            t = k / 12; nx = x + math.sin(t * 5 + x) * 14 * u * t; ny = base + 10 * u - hh * t
            d.line([prev, (nx, ny)], fill=col, width=max(3, int(10 * u * (1 - t * .7)))); prev = (nx, ny)
    for i in range(int(W / (170 * u))):                              # coral
        x = rnd.uniform(0, W); col = rnd.choice([(255, 99, 132, 255), (255, 159, 67, 255), (190, 90, 220, 255)]); y = base + rnd.uniform(0, sand * .6)
        for b in range(rnd.randint(3, 5)):
            ang = -math.pi / 2 + rnd.uniform(-.9, .9); L = rnd.uniform(40, 90) * u
            ex, ey = x + math.cos(ang) * L, y + math.sin(ang) * L
            d.line([(x, y), (ex, ey)], fill=col, width=int(11 * u)); d.ellipse([ex - 8 * u, ey - 8 * u, ex + 8 * u, ey + 8 * u], fill=col)
    return im.convert('RGB').resize((w, h), Image.LANCZOS)

def forest(w, h, rnd):
    W, H = w * SS, h * SS; u = min(W, H) / 700
    im = vgrad(W, H, [(0, (30, 24, 80)), (.45, (150, 70, 140)), (.72, (250, 150, 110)), (1, (255, 205, 130))]).convert('RGBA')
    d = ImageDraw.Draw(im, 'RGBA')
    for i in range(int(W * H / 9000)):                               # stars in the upper sky
        x = rnd.uniform(0, W); y = rnd.uniform(0, H * .42); r = rnd.uniform(.8, 2.6) * u
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, int(255 * (1 - y / (H * .45)))))
    sx, sy, sr = W * rnd.choice([.2, .75]), H * .5, min(W, H) * .11  # low sun
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
    gd.ellipse([sx - sr * 2.4, sy - sr * 2.4, sx + sr * 2.4, sy + sr * 2.4], fill=(255, 210, 140, 90)); glow = glow.filter(ImageFilter.GaussianBlur(40 * u)); im = Image.alpha_composite(im, glow)
    d = ImageDraw.Draw(im, 'RGBA'); d.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(255, 238, 190, 255))
    layers = [(.62, (96, 60, 120), 1.0, .9), (.72, (60, 44, 100), 1.25, 1.0), (.84, (30, 28, 70), 1.6, 1.1), (1.0, (14, 16, 44), 2.1, 1.2)]
    for (yy, col, sc, dens) in layers:
        def ridge(x): return H * yy - 40 * u * sc * (.5 + .5 * math.sin(x / (230 * u) + yy * 9))
        pts = [(0, H)] + [(x, ridge(x)) for x in range(0, W + 30, 30)] + [(W, H)]
        d.polygon(pts, fill=col + (255,))
        for i in range(int(W / (46 * u / sc / dens))):               # pine trees along the ridge
            x = rnd.uniform(0, W); gy = ridge(x) + 8 * u
            th = rnd.uniform(70, 130) * u * sc * .8; tw = th * .34
            for k in range(3):
                t0 = gy - th * (.18 + k * .27); wk = tw * (1 - k * .22)
                d.polygon([(x, t0 - th * .38), (x - wk, t0), (x + wk, t0)], fill=col + (255,))
    ff = Image.new('RGBA', (W, H), (0, 0, 0, 0)); fd = ImageDraw.Draw(ff)  # fireflies
    for i in range(int(W * H / 38000)):
        x = rnd.uniform(0, W); y = rnd.uniform(H * .5, H * .96); r = rnd.uniform(2, 5) * u
        fd.ellipse([x - r * 3, y - r * 3, x + r * 3, y + r * 3], fill=(255, 240, 120, 70)); fd.ellipse([x - r, y - r, x + r, y + r], fill=(255, 250, 190, 255))
    im = Image.alpha_composite(im, ff.filter(ImageFilter.GaussianBlur(1.2 * u)))
    return im.convert('RGB').resize((w, h), Image.LANCZOS)

def sprite(name, fn, size=256):
    im = Image.new('RGBA', (size * 2, size * 2), (0, 0, 0, 0)); fn(ImageDraw.Draw(im), size * 2)
    im.resize((size, size), Image.LANCZOS).save(os.path.join(IMG, name), optimize=True)

def fish(body, fin, belly):
    def f(d, s):
        d.polygon([(s * .08, s * .22), (s * .3, s * .5), (s * .08, s * .78), (s * .2, s * .5)], fill=fin)
        d.ellipse([s * .16, s * .24, s * .92, s * .76], fill=body)
        d.pieslice([s * .16, s * .38, s * .92, s * .78], 0, 180, fill=belly)
        d.polygon([(s * .42, s * .26), (s * .56, s * .08), (s * .7, s * .28)], fill=fin)
        d.ellipse([s * .70, s * .36, s * .82, s * .48], fill=(255, 255, 255)); d.ellipse([s * .75, s * .39, s * .81, s * .45], fill=(20, 20, 40))
    return f

def star(d, s):
    pts = []
    for i in range(10):
        r = s * .46 if i % 2 == 0 else s * .2; a = -math.pi / 2 + i * math.pi / 5; pts.append((s / 2 + r * math.cos(a), s / 2 + r * math.sin(a)))
    d.polygon(pts, fill=(255, 205, 40)); d.line(pts + [pts[0]], fill=(255, 140, 0), width=int(s * .02))

def gem(d, s):
    top = [(s * .28, s * .24), (s * .72, s * .24), (s * .88, s * .44), (s * .5, s * .86), (s * .12, s * .44)]
    d.polygon(top, fill=(70, 200, 240)); d.polygon([(s * .12, s * .44), (s * .88, s * .44), (s * .5, s * .86)], fill=(40, 150, 220))
    d.polygon([(s * .28, s * .24), (s * .4, s * .44), (s * .5, s * .24)], fill=(190, 240, 255)); d.polygon([(s * .5, s * .24), (s * .6, s * .44), (s * .72, s * .24)], fill=(120, 215, 245))
    d.line(top + [top[0]], fill=(10, 90, 150), width=int(s * .02))

if __name__ == '__main__':
    for name, fn in (('ocean', ocean), ('forest', forest)):
        seed = sum(map(ord, name))
        for k, (w, h) in SHAPES.items():
            fn(w, h, random.Random(seed + ord(k))).save(os.path.join(IMG, 'bg_%s_%s.jpg' % (name, k)), 'JPEG', quality=80, optimize=True, progressive=True)
        fn(1280, 720, random.Random(seed)).save(os.path.join(IMG, 'bg_%s.jpg' % name), 'JPEG', quality=80, optimize=True, progressive=True)
    sprite('fish_orange.png', fish((255, 140, 40), (255, 90, 30), (255, 215, 150)))
    sprite('fish_blue.png', fish((60, 150, 255), (30, 90, 220), (180, 225, 255)))
    sprite('star.png', star); sprite('gem.png', gem)
    print('done')
