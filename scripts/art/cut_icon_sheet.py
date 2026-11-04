"""Cut the ingredient and candy sheets (assets/ingredients.png, candies-1.png, candies-2.png) into 64 x 64 slot pictures.

    python scripts/art/cut_icon_sheet.py

Each sheet is a grid of 4 columns x 2 rows read left to right, top to bottom. Every cell is mapped onto the 32-colour palette,
trimmed to the icon and centred (both ways) on a transparent 64 x 64 canvas, so a round badge around it fits,
then saved as public/art/<slot id>.png. Run `npm run art:link` afterwards to point the slots at them.
"""
import sys
import tempfile
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from palettize import convert  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'art'
SHEETS = {
    'ingredients.png': ['ingredient-honey', 'ingredient-royal-jelly', 'ingredient-sunflower-seed', 'ingredient-dark-seed',
                        'ingredient-milk', 'ingredient-stumpsville-cream', 'ingredient-blueberry', 'ingredient-cursed-blackberry'],
    'candies-1.png': ['candy-candy-cane', 'candy-sunflower-brittle', 'candy-sunflower-nougat', 'candy-toffee',
                      'candy-berrycorice', 'candy-honey-fudge', 'candy-honey-berry-gums', 'candy-seed-praline'],
    'candies-2.png': ['candy-berry-crunch', 'candy-berry-cream-chews', 'candy-golden-truffle', 'candy-meadow-bar',
                      'candy-berry-cloud', 'candy-cheesecake-bites', 'candy-sweet-tooth'],
}
SIZE = 64


def main() -> None:
    with tempfile.TemporaryDirectory() as d:
        for name, ids in SHEETS.items():
            pal = Path(d) / name
            convert(ROOT / 'assets' / name, pal, None, False, 128)
            im = Image.open(pal)
            cw, ch = im.width // 4, im.height // 2
            for i, slot in enumerate(ids):
                r, c = divmod(i, 4)
                cell = im.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
                box = cell.getbbox()
                if box is None:
                    raise SystemExit(f'{name}: cell {r + 1},{c + 1} ({slot}) is empty')
                icon = cell.crop(box)
                if icon.width > SIZE or icon.height > SIZE:
                    raise SystemExit(f'{slot}: icon is {icon.size}, larger than {SIZE}')
                out = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
                out.paste(icon, ((SIZE - icon.width) // 2, (SIZE - icon.height) // 2))
                out.save(OUT / f'{slot}.png')
                print(f'{slot}: {icon.width}x{icon.height}')


if __name__ == '__main__':
    main()
