"""Builds the optimised demo photo set used by the template previews.

Source photos are CC0 / public domain (rawpixel.com and the WordPress Photo
Directory, found through Openverse). See invitations/content/demo-media/CREDITS.md.

Usage:  python tools/prepare-demo-media.py <folder with the downloaded originals>

Each photo is cropped to a 3:4 portrait around a focal point and written as
WebP at up to two widths, so templates can serve a srcset (phones fetch the
small file, ~25-60 KB). File names carry the real pixel width, which keeps
the srcset "w" descriptors honest. A manifest.json lists what was written.
"""
import json
import os
import sys
from PIL import Image, ImageOps

SRC = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "invitations", "content", "demo-media"))
os.makedirs(OUT, exist_ok=True)

ASPECT = 3 / 4
SMALL, LARGE = 360, 720

# name: (source file, focal x, focal y)
PHOTOS = {
    "groom-safa":      ("27.jpg", 0.50, 0.45),
    "bride-namaste":   ("22.jpg", 0.50, 0.50),
    "mehendi-bangles": ("1.jpg",  0.45, 0.45),
    "rings-henna":     ("2.jpg",  0.50, 0.50),
    "green-silk":      ("3.jpg",  0.55, 0.50),
    "red-bangles":     ("23.jpg", 0.55, 0.50),
    "ritual-hands":    ("25.jpg", 0.50, 0.50),
    "alta-feet":       ("26.jpg", 0.50, 0.55),
    "lights-canopy":   ("32.jpg", 0.50, 0.40),
}


def crop_to(im, aspect, fx, fy):
    w, h = im.size
    if w / h > aspect:          # too wide: crop the width around fx
        nw = round(h * aspect)
        left = min(max(round(fx * w - nw / 2), 0), w - nw)
        return im.crop((left, 0, left + nw, h))
    nh = round(w / aspect)       # too tall: crop the height around fy
    top = min(max(round(fy * h - nh / 2), 0), h - nh)
    return im.crop((0, top, w, top + nh))


manifest = {}
for name, (file, fx, fy) in PHOTOS.items():
    path = os.path.join(SRC, file)
    if not os.path.exists(path):
        print("missing", path)
        continue
    im = crop_to(ImageOps.exif_transpose(Image.open(path)).convert("RGB"), ASPECT, fx, fy)
    widths = sorted({min(SMALL, im.width), min(LARGE, im.width)})
    files = []
    for w in widths:
        target = im if im.width == w else im.resize((w, round(w / ASPECT)), Image.LANCZOS)
        out_name = f"{name}-{target.width}.webp"
        target.save(os.path.join(OUT, out_name), "WEBP", quality=76, method=6)
        files.append({"file": out_name, "width": target.width, "height": target.height,
                      "kb": os.path.getsize(os.path.join(OUT, out_name)) // 1024})
    manifest[name] = files
    print(name.ljust(16), ", ".join(f'{f["file"]} ({f["kb"]} KB)' for f in files))

with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as fh:
    json.dump(manifest, fh, indent=1)
