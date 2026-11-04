"""Cut the customer and bee sheets (assets/customers.png, assets/bees.png: 8 x 8 cells of 32 x 32) into token pictures.

    python scripts/art/cut_token_sheets.py

Writes public/art/tokens/customer-<type>-<n>.png (n from 0), clerk.png and queen.png, every cell mapped onto the 32-colour palette.
Cells are (row, column), counted from 1 at the top left. The UI picks a variant from the customer id (src/ui/tokenArt.ts, whose
counts must match the groups below).
"""
import sys
import tempfile
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from palettize import convert  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'art' / 'tokens'

CUSTOMERS = {
    'traveler': [(1, 1), (2, 1), (3, 1), (5, 1), (7, 1), (7, 7), (8, 1)],
    'faithful': [(1, 4), (2, 4), (2, 5), (3, 4), (4, 3), (4, 5), (4, 6), (5, 4), (6, 3), (6, 5), (8, 5)],
    'merchant': [(1, 7), (2, 7), (3, 7), (5, 7), (6, 7), (7, 6), (8, 2), (8, 3), (8, 6)],
}
BEES = [(1, c) for c in range(1, 6)] + [(2, c) for c in range(1, 9)] + [(3, c) for c in range(1, 8)]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    groups: list[tuple[Path, str, list[tuple[int, int]]]] = [(ROOT / 'assets' / 'customers.png', f'customer-{t}', s) for t, s in CUSTOMERS.items()]
    groups.append((ROOT / 'assets' / 'bees.png', 'customer-bee', BEES))
    singles = [(ROOT / 'assets' / 'customers.png', 'clerk', (8, 8)), (ROOT / 'assets' / 'bees.png', 'queen', (8, 8))]
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d)
        sheets = {}
        for sheet in {g[0] for g in groups} | {s[0] for s in singles}:
            pal = tmp / f'{sheet.stem}.pal.png'
            convert(sheet, pal, None, False, 128)
            sheets[sheet] = Image.open(pal)

        def crop(sheet: Path, r: int, c: int) -> Image.Image:
            return sheets[sheet].crop(((c - 1) * 32, (r - 1) * 32, c * 32, r * 32))

        for sheet, prefix, spots in groups:
            for n, (r, c) in enumerate(spots):
                crop(sheet, r, c).save(OUT / f'{prefix}-{n}.png')
            print(f'{prefix}: {len(spots)} variants')
        for sheet, name, (r, c) in singles:
            crop(sheet, r, c).save(OUT / f'{name}.png')


if __name__ == '__main__':
    main()
