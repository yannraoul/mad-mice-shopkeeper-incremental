import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Points the art slots at finished pictures: `npm run art:link`.
// A slot (`content/core/artSlots.json`) names the file its picture is in, at first a placeholder SVG. Drop a finished picture
// named after the slot, `public/art/<slot id>.png` (or .webp), and run this: the slot's `file` is rewritten to it. The size
// declared in the slot is the size the picture must be delivered in (it is only displayed smaller or larger, never cropped).
// Slots without a finished picture are left alone; the script prints what it changed and what is still a placeholder.

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FILE = resolve(ROOT, 'content/core/artSlots.json');
const slots = JSON.parse(readFileSync(FILE, 'utf-8')) as { id: string; file: string; width: number; height: number }[];

const done: string[] = [];
const todo: string[] = [];
for (const s of slots) {
  const found = ['png', 'webp'].map((ext) => `art/${s.id}.${ext}`).find((f) => existsSync(resolve(ROOT, 'public', f)));
  if (found) {
    if (s.file !== found) {
      s.file = found;
      done.push(`${s.id} -> ${found}`);
    }
  } else if (s.file.endsWith('.svg')) todo.push(`${s.id} (${s.width}x${s.height})`);
}
if (done.length > 0) writeFileSync(FILE, JSON.stringify(slots, null, 2) + '\n');
console.log(done.length > 0 ? `Linked ${done.length}:\n  ${done.join('\n  ')}` : 'Nothing new to link.');
console.log(`${todo.length} slots are still placeholders${todo.length ? `:\n  ${todo.join('\n  ')}` : ''}`);
