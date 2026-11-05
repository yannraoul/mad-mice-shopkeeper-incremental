"""Placeholder sprite sheets for the animated workshop (MMSIM-22).

Reads the GIFs (or else the four cleaned 64x64 mice from assets/mice-crops and writes one horizontal strip per action to
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
ROLES = {'baker': 'baker.png', 'porter': 'porter.png', 'puller': 'puller-nostool.png', 'sculptor': 'sculptor.png', 'stirrer': 'stirrer-nostool.png'}
# (dy, dx) of the upper body per frame; dx is never negative so nothing is pushed off the left edge of the frame.
ACTIONS = {
    'idle': [(0, 0), (1, 0), (1, 0), (0, 0)],
    'work': [(0, 0), (2, 1), (0, 0), (1, 1)],
}
FRAME = 64
# (dx, dy) nudge of the whole GIF frame, to line each mouse up with its spot in the scene.
NUDGE = {'puller': (-3, 0), 'porter': (-5, 0), 'sculptor': (4, -1)}
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




def keyed(img: Image.Image, role: str = '') -> Image.Image:
    """The GIFs have no transparency, just a solid black backdrop: flood it to alpha 0 from the frame edges
    (so black pixels inside the mouse, if any, stay)."""
    a = np.array(img)
    black = (a[:, :, :3].sum(axis=2) == 0)
    seen = np.zeros(black.shape, bool)
    stack = [(y, x) for y in range(FRAME) for x in range(FRAME) if y in (0, FRAME - 1) or x in (0, FRAME - 1)]
    while stack:
        y, x = stack.pop()
        if 0 <= y < FRAME and 0 <= x < FRAME and black[y, x] and not seen[y, x]:
            seen[y, x] = True
            stack += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    if role == 'puller':  # black also shows between the stool legs, where the flood cannot reach
        seen = black
    jar = np.zeros_like(black)
    if role == 'sculptor':  # the jar's own outline was black like the backdrop: redraw it in the palette outline colour
        for c in ((0x39, 0x3e, 0x6a), (0x46, 0x3b, 0x6b), (0x71, 0x7d, 0x92), (0x96, 0x8a, 0x80), (0xfb, 0xe7, 0xb5)):
            jar |= (a[:, :, :3] == c).all(axis=2)
        jar[:38] = False
        jar[:, 30:] = False
        edge = np.zeros_like(black)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            edge |= np.roll(np.roll(jar, dy, 0), dx, 1)
        edge &= seen
        a[edge, :3] = (0x2b, 0x1c, 0x0e)
        seen &= ~edge
    a[seen, 3] = 0
    return Image.fromarray(a)


OUT.mkdir(parents=True, exist_ok=True)
# The hand-made GIFs (4 frames, 64x64) are the animation: one strip per role, used for both idle and work
# (content/core/sprites.json gives idle a slower fps). Falls back to the bob above when a role has no GIF.
for role, file in ROLES.items():
    gif = SRC / f'{role}.gif'
    if gif.exists():
        g = Image.open(gif)
        strip = Image.new('RGBA', (FRAME * g.n_frames, FRAME), (0, 0, 0, 0))
        for i in range(g.n_frames):
            g.seek(i)
            cell = Image.new('RGBA', (FRAME, FRAME), (0, 0, 0, 0))  # shift inside the cell so nothing bleeds into the next frame
            cell.paste(keyed(g.convert('RGBA'), role), NUDGE.get(role, (0, 0)))
            strip.paste(cell, (i * FRAME, 0))
        for action in ACTIONS:
            strip.save(OUT / f'{role}-{action}.png')
        continue
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
