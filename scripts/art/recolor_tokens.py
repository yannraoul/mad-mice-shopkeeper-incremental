"""Take the pure black out of the customer and clerk tokens and put palette colours in its place (2026-10-19).

Run from the repo root: python scripts/art/recolor_tokens.py   (needs Pillow and numpy)

- clerk, faithful: black (and the near-black #464646 shading) becomes stone-700, the darkest grey of the palette.
- bee: the outline of the wings becomes stone-700; the rest of the outline follows what it borders: dark brown (cocoa-700)
  next to the brown stripes, ochre (wood) next to the yellow; black inside the body (the eyes) becomes cocoa-900.
Reads and writes assets/<name>.png, then copies each to public/art/tokens/. Run it once on the original pictures: it only
looks for #000000 and #464646, so running it again changes nothing.
"""
from pathlib import Path
import shutil

import numpy as np
from PIL import Image

STONE_700 = (0x5B, 0x52, 0x4C)
COCOA_900 = (0x2B, 0x1C, 0x0E)
COCOA_700 = (0x4D, 0x32, 0x20)
WOOD = (0xA8, 0x74, 0x3F)
BLACK = (0, 0, 0)
SHADE = (0x46, 0x46, 0x46)
YELLOW = (0xFF, 0xC2, 0x0E)
BROWN = (0x9C, 0x5A, 0x3C)
WING = [(0xFF, 0xFF, 0xFF), (0xB4, 0xB4, 0xB4)]

ASSETS = Path('assets')
OUT = Path('public/art/tokens')


def load(name: str) -> np.ndarray:
    return np.array(Image.open(ASSETS / f'{name}.png').convert('RGBA'))


def save(name: str, a: np.ndarray, dest: str) -> None:
    Image.fromarray(a, 'RGBA').save(ASSETS / f'{name}.png')
    OUT.mkdir(parents=True, exist_ok=True)
    shutil.copy(ASSETS / f'{name}.png', OUT / dest)
    print('recoloured', name)


def is_color(px, rgb) -> bool:
    return px[3] > 0 and tuple(px[:3]) == rgb


for name in ('clerk', 'faithful'):
    a = load(name)
    for y in range(a.shape[0]):
        for x in range(a.shape[1]):
            if a[y, x, 3] and (is_color(a[y, x], BLACK) or is_color(a[y, x], SHADE)):
                a[y, x, :3] = STONE_700
    save(name, a, 'clerk.png' if name == 'clerk' else f'customer-{name}.png')

a = load('bee')
h, w = a.shape[:2]
src = a.copy()
for y in range(h):
    for x in range(w):
        if not is_color(src[y, x], BLACK):
            continue
        near = [(yy, xx) for yy in range(y - 1, y + 2) for xx in range(x - 1, x + 2) if (yy, xx) != (y, x)]
        edge = any(not (0 <= yy < h and 0 <= xx < w) or src[yy, xx, 3] == 0 for yy, xx in near)
        inside = [src[yy, xx] for yy, xx in near if 0 <= yy < h and 0 <= xx < w and src[yy, xx, 3] > 0]
        n_wing = sum(any(is_color(p, c) for c in WING) for p in inside)
        n_brown = sum(is_color(p, BROWN) for p in inside)
        n_yellow = sum(is_color(p, YELLOW) for p in inside)
        if not edge:
            colour = COCOA_900  # the eyes and the mouth
        elif n_wing > 0 and n_wing >= n_brown + n_yellow:
            colour = STONE_700
        elif n_brown >= n_yellow:
            colour = COCOA_700
        else:
            colour = WOOD
        a[y, x, :3] = colour
save('bee', a, 'customer-bee.png')
