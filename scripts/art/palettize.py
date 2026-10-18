"""Bring any picture onto the Sweet Tooth palette (32 colours), whatever tool made it.

    python scripts/art/palettize.py INPUT [INPUT ...] [--out DIR] [--size WxH] [--dither] [--keep-alpha-threshold N]

Every pixel is replaced by the nearest colour of `docs/art/sweet-tooth-32.hex` (in a perceptual-ish space, not plain RGB), so a
generator that cannot import a palette, a screenshot, or a hand-drawn sketch all end up in the same 32 colours.

- `--size WxH` first shrinks the picture to that size with a box filter (use it for AI output that came out at 4x or 8x the
  size it pretends to be: a "256x144" scene that is really 1024x576), then maps the colours.
- `--dither` uses an ordered 4x4 dither instead of hard nearest-colour (smoother gradients, noisier pixels). Off by default:
  clean flat pixels are what the rest of the art looks like.
- Transparency is kept: a pixel whose alpha is below `--keep-alpha-threshold` (default 128) becomes fully transparent, the rest fully opaque.
- Output goes next to the input as `<name>.pal.png`, or into `--out`.

Needs Pillow and numpy:  pip install pillow numpy
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image

HEX = Path(__file__).resolve().parents[2] / 'docs' / 'art' / 'sweet-tooth-32.hex'
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0 - 0.5


def palette() -> np.ndarray:
    rows = [h.strip().lstrip('#') for h in HEX.read_text().splitlines() if h.strip()]
    return np.array([[int(h[i:i + 2], 16) for i in (0, 2, 4)] for h in rows], dtype=float)


def to_lab(rgb: np.ndarray) -> np.ndarray:
    """sRGB (0-255) to CIE Lab, so 'nearest' means nearest to the eye."""
    c = rgb / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    m = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ m.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], axis=-1)


def convert(src: Path, dst: Path, size: tuple[int, int] | None, dither: bool, alpha_cut: int) -> None:
    img = Image.open(src).convert('RGBA')
    if size:
        img = img.resize(size, Image.BOX)
    a = np.array(img)
    rgb = a[..., :3].astype(float)
    pal = palette()
    if dither:
        h, w = rgb.shape[:2]
        tile = np.tile(BAYER, (h // 4 + 1, w // 4 + 1))[:h, :w, None]
        rgb = np.clip(rgb + tile * 32, 0, 255)
    d = ((to_lab(rgb)[:, :, None, :] - to_lab(pal)[None, None, :, :]) ** 2).sum(-1)
    out = pal[d.argmin(-1)].astype(np.uint8)
    alpha = np.where(a[..., 3] >= alpha_cut, 255, 0).astype(np.uint8)
    Image.fromarray(np.dstack([out, alpha]), 'RGBA').save(dst)
    used = len({tuple(p) for p in out[alpha > 0].reshape(-1, 3)})
    print(f'{src.name} -> {dst}  {img.size[0]}x{img.size[1]}, {used} of {len(pal)} colours used')


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('inputs', nargs='+', type=Path)
    ap.add_argument('--out', type=Path)
    ap.add_argument('--size', help='WxH to shrink to first, e.g. 256x144')
    ap.add_argument('--dither', action='store_true')
    ap.add_argument('--keep-alpha-threshold', type=int, default=128)
    args = ap.parse_args()
    size = tuple(int(x) for x in args.size.lower().split('x')) if args.size else None
    for src in args.inputs:
        dst_dir = args.out or src.parent
        dst_dir.mkdir(parents=True, exist_ok=True)
        convert(src, dst_dir / f'{src.stem}.pal.png', size, args.dither, args.keep_alpha_threshold)


if __name__ == '__main__':
    main()
