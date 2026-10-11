import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT_DIR } from './lib/readContent.ts';

// The preview build is shared with players before the campaign ends, so nothing from an optional
// pack (ending, live-plot errands) may be in it. Everything shipped to a browser is readable, so
// this checks the real output: every text value of every pack must be absent from dist-preview/.

const DIST = fileURLToPath(new URL('../dist-preview/', import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

/** Every string value (8+ characters) found in the JSON files of every pack. */
function packStrings(): { pack: string; text: string }[] {
  const out: { pack: string; text: string }[] = [];
  const packsDir = join(CONTENT_DIR, 'packs');
  if (!existsSync(packsDir)) return out;
  const collect = (pack: string, node: unknown) => {
    if (typeof node === 'string') {
      if (node.length >= 8) out.push({ pack, text: node });
    } else if (Array.isArray(node)) node.forEach((n) => collect(pack, n));
    else if (node && typeof node === 'object') Object.values(node).forEach((n) => collect(pack, n));
  };
  for (const pack of readdirSync(packsDir)) {
    const dir = join(packsDir, pack);
    if (!statSync(dir).isDirectory()) continue;
    for (const f of walk(dir).filter((x) => x.endsWith('.json'))) collect(pack, JSON.parse(readFileSync(f, 'utf8')));
  }
  return out;
}

if (!existsSync(DIST)) {
  console.error('dist-preview/ not found: run `npm run build:preview` first.');
  process.exit(1);
}
const bundle = walk(DIST)
  .filter((f) => /\.(js|css|html|json|svg|txt|map)$/.test(f))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');
// Strings are embedded as JSON, so also look for their escaped form (quotes, non-ASCII).
const forms = (t: string) => [t, JSON.stringify(t).slice(1, -1)];

const strings = packStrings();
const leaks = strings.filter((s) => forms(s.text).some((f) => bundle.includes(f)));
if (leaks.length > 0) {
  console.error(`preview build LEAKS pack content (${leaks.length}):`);
  for (const l of leaks) console.error(`  [${l.pack}] ${l.text.slice(0, 80)}`);
  process.exit(1);
}
console.log(`preview OK: ${strings.length} pack text value(s) checked, none found in dist-preview/`);
