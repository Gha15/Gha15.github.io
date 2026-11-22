#!/usr/bin/env python3
"""Makes every Arcade background in five screen shapes so games never get an ugly crop:
   p = 9:16 phone portrait, t = 3:4 tablet portrait, s = 1:1, w = 16:9, u = 21:9 ultrawide.
   Usage: python3 tools/make-backgrounds.py   (needs Pillow). Sources are arcade/img/bg_<name>.jpg;
   the originals are kept as the fallback. Output: arcade/img/bg_<name>_<shape>.jpg"""
import glob, os
from PIL import Image, ImageFilter

SHAPES = {'p': (720, 1280), 't': (960, 1280), 's': (1024, 1024), 'w': (1280, 720), 'u': (1680, 720)}
HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, '..', 'arcade', 'img')

def cover(im, w, h):
    s = max(w / im.width, h / im.height)
    r = im.resize((max(w, round(im.width * s)), max(h, round(im.height * s))), Image.LANCZOS)
    x, y = (r.width - w) // 2, (r.height - h) // 2
    return r.crop((x, y, x + w, y + h))

def feather(mask_w, mask_h, horizontal, edge):
    m = Image.new('L', (mask_w, mask_h), 255)
    px = m.load()
    for i in range(edge):
        v = int(255 * i / edge)
        if horizontal:
            for y in range(mask_h):
                px[i, y] = v; px[mask_w - 1 - i, y] = v
        else:
            for x in range(mask_w):
                px[x, i] = v; px[x, mask_h - 1 - i] = v
    return m

def flat(src, box):
    from PIL import ImageStat
    st = ImageStat.Stat(src.crop(box).convert('L'))
    return st.stddev[0] < 14 and st.mean[0] > 90      # plain AND light (not a dark star field)

def make(src, W, H):
    sr, tr = src.width / src.height, W / H
    if abs(sr - tr) < .03:
        return cover(src, W, H)
    if tr > sr:                      # wider than the picture: mirror it left and right (seamless, nothing blurry)
        fw = round(H * sr); fg = src.resize((fw, H), Image.LANCZOS)
        out = Image.new('RGB', (W, H)); x0 = (W - fw) // 2
        out.paste(fg, (x0, 0))
        flip = fg.transpose(Image.FLIP_LEFT_RIGHT)
        x = x0 - fw
        while x > -fw:
            out.paste(flip if ((x0 - x) // fw) % 2 else fg, (x, 0)); x -= fw
        x = x0 + fw; n = 1
        while x < W:
            out.paste(flip if n % 2 else fg, (x, 0)); x += fw; n += 1
        return out
    # taller than the picture: if the top and bottom edges are plain (sky, grass...), stretch them to fill;
    # otherwise crop the middle
    fh = round(W / sr); fg = src.resize((W, fh), Image.LANCZOS)
    if flat(src, (0, 0, src.width, 12)) and flat(src, (0, src.height - 12, src.width, src.height)):
        y0 = (H - fh) // 2
        ct = fg.crop((0, 0, W, 8)).resize((1, 1), Image.BOX).getpixel((0, 0))
        cb = fg.crop((0, fh - 8, W, fh)).resize((1, 1), Image.BOX).getpixel((0, 0))
        out = Image.new('RGB', (W, H), ct)
        for y in range(H // 2, H):                       # bottom half uses the bottom colour
            out.paste(cb, (0, y, W, y + 1))
        edge = round(fh * .08)
        out.paste(fg, (0, y0), feather(W, fh, False, edge))
        # the feather fades both the top and the bottom of the picture into its edge colour
        return out
    return cover(src, W, H)

for path in sorted(glob.glob(os.path.join(IMG, 'bg_*.jpg'))):
    name = os.path.basename(path)
    if name[-6] == '_' and name[-5] in SHAPES:     # skip generated files
        continue
    src = Image.open(path).convert('RGB')
    for k, (w, h) in SHAPES.items():
        out = os.path.join(IMG, name[:-4] + '_' + k + '.jpg')
        make(src, w, h).save(out, 'JPEG', quality=80, optimize=True, progressive=True)
        print(os.path.basename(out), w, h)
