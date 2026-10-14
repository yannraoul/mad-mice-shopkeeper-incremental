"""Placeholder sprite sheets for the animated workshop (MMSIM-22).

Reads the four cleaned 64x64 mice from assets/mice-crops and writes one horizontal strip per action to
public/art/sprites/<role>-<action>.png, by moving the upper body of the sprite a pixel or two (a bob, a sway).
Crude on purpose: the real art (Pixellab) replaces the strips, not the content rows that point at them.
Run from the repo root: python scripts/art/make_placeholder_sheets.py   (needs Pillow)
"""
from pathlib import Path
import shutil
import numpy as np
from PIL import Image

SRC = Path('assets/mice-crops')
OUT = Path('public/art/sprites')
ROLES = {'baker': 'baker.png', 'porter': 'porter.png', 'sculptor': 'sculptor-nostool.png', 'stirrer': 'stirrer-nostool.png'}
# (dy, dx) of the upper body per frame; dx is never negative so nothing is pushed off the left edge of the frame.
ACTIONS = {
    'idle': [(0, 0), (1, 0), (1, 0), (0, 0)],
    'work': [(0, 0), (2, 1), (0, 0), (1, 1)],
}
FRAME = 64
LOWER = 14  # rows from the bottom of the sprite that stay put (the feet)


def moved(img: np.ndarray, pivot: int, dy: int, dx: int) -> np.ndarray:
    out = img.copy()
    out[:pivot] = 0
    upper = img[:pivot]
    ys = slice(0, pivot - dy) if dy else slice(0, pivot)
    out[ys, dx:] = upper[dy:, : FRAME - dx] if dy else upper[:, : FRAME - dx]
    # close the gap the shift opened above the pivot with the original rows
    for y in range(pivot - dy, pivot):
        empty = out[y, :, 3] == 0
        out[y][empty] = img[y][empty]
    return out


OUT.mkdir(parents=True, exist_ok=True)
for role, file in ROLES.items():
    img = np.array(Image.open(SRC / file).convert('RGBA'))
    bottom = int(np.where(img[:, :, 3].any(axis=1))[0].max()) + 1
    pivot = max(1, bottom - LOWER)
    for action, frames in ACTIONS.items():
        strip = Image.new('RGBA', (FRAME * len(frames), FRAME), (0, 0, 0, 0))
        for i, (dy, dx) in enumerate(frames):
            strip.paste(Image.fromarray(moved(img, pivot, dy, dx)), (i * FRAME, 0))
        strip.save(OUT / f'{role}-{action}.png')
shutil.copy('assets/workshop-no-mice.png', 'public/art/scenes/workshop.png')
print('done')
