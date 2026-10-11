import { z } from 'zod';
import { tables, Settings, Strings, LANGS, type Content } from './schema.ts';

export interface RawFile {
  pack: string;
  /** Path inside the pack, e.g. `candies.json` or `strings/en.json`. */
  path: string;
  data: unknown;
}

/**
 * Merges every pack (core first) into one validated Content:
 * table files (`candies.json`, ...) concatenate rows, `strings/<lang>.json` and
 * `settings.json` merge keys. Throws one error listing every problem found.
 */
export function loadContent(files: RawFile[]): Content {
  const errors: string[] = [];
  const out: Record<string, unknown[]> = Object.fromEntries(Object.keys(tables).map((t) => [t, []]));
  const strings: Record<string, Record<string, string>> = { en: {}, fr: {} };
  let settingsRaw: Record<string, unknown> = {};

  for (const f of files) {
    const where = `${f.pack}/${f.path}`;
    if (f.path === 'settings.json') {
      if (typeof f.data !== 'object' || f.data === null || Array.isArray(f.data))
        errors.push(`${where}: expected an object`);
      else settingsRaw = { ...settingsRaw, ...(f.data as Record<string, unknown>) };
      continue;
    }
    const m = /^strings\/(\w+)\.json$/.exec(f.path);
    if (m) {
      const lang = m[1]!;
      if (!(LANGS as readonly string[]).includes(lang)) {
        errors.push(`${where}: unknown language "${lang}"`);
        continue;
      }
      const r = Strings.safeParse(f.data);
      if (!r.success) errors.push(`${where}: ${z.prettifyError(r.error)}`);
      else Object.assign(strings[lang]!, r.data);
      continue;
    }
    const table = f.path.replace(/\.json$/, '') as keyof typeof tables;
    const schema = tables[table];
    if (!schema) {
      errors.push(`${where}: unknown content file`);
      continue;
    }
    const r = z.array(schema).safeParse(f.data);
    if (!r.success) errors.push(`${where}: ${z.prettifyError(r.error)}`);
    else out[table]!.push(...r.data);
  }

  const settings = Settings.safeParse(settingsRaw);
  if (!settings.success) errors.push(`settings.json: ${z.prettifyError(settings.error)}`);

  const content = { ...out, settings: settings.success ? settings.data : undefined, strings } as unknown as Content;
  if (errors.length === 0) errors.push(...validateRefs(content));
  if (errors.length) throw new Error(errors.join('\n'));
  return content;
}

const NOT_TABLES = new Set(['strings', 'settings']);

/** Cross-references, duplicate ids, and FR/EN string parity. */
export function validateRefs(c: Content): string[] {
  const errors: string[] = [];

  for (const [name, rows] of Object.entries(c) as [string, { id?: string }[]][]) {
    if (NOT_TABLES.has(name)) continue;
    const seen = new Set<string>();
    for (const r of rows) {
      if (seen.has(r.id!)) errors.push(`${name}: duplicate id "${r.id}"`);
      seen.add(r.id!);
    }
  }

  const ids = (rows: { id: string }[]) => new Set(rows.map((r) => r.id));
  const qualities = ids(c.qualities);
  const ingredients = ids(c.ingredients);
  const stations = ids(c.stations);
  const customers = ids(c.customerTypes);
  for (const cu of c.customerTypes)
    if (!qualities.has(cu.minQuality)) errors.push(`customerTypes/${cu.id}: unknown quality "${cu.minQuality}"`);
  for (const ca of c.candies)
    for (const i of ca.ingredients)
      if (!ingredients.has(i.ingredient)) errors.push(`candies/${ca.id}: unknown ingredient "${i.ingredient}"`);
  for (const q of c.qualities)
    for (const i of q.extraIngredients)
      if (!ingredients.has(i.ingredient)) errors.push(`qualities/${q.id}: unknown ingredient "${i.ingredient}"`);
  for (const w of c.workers)
    for (const t of w.serves)
      if (!customers.has(t)) errors.push(`workers/${w.id}: unknown customer type "${t}"`);
  for (const f of c.forecasts)
    for (const t of Object.keys(f.weights))
      if (!customers.has(t)) errors.push(`forecasts/${f.id}: unknown customer type "${t}"`);
  for (const s of c.settings.startStations)
    if (!stations.has(s)) errors.push(`settings: unknown start station "${s}"`);
  if (new Set(c.qualities.map((q) => q.rank)).size !== c.qualities.length)
    errors.push('qualities: ranks must be unique');
  if (c.qualities.length && !c.qualities.some((q) => q.rank === 0))
    errors.push('qualities: a rank 0 quality is required');

  // Every craftable thing needs an image slot (placeholders at final size, swappable files).
  const slots = ids(c.artSlots);
  for (const [prefix, rows] of [['ingredient', c.ingredients], ['candy', c.candies], ['station', c.stations], ['worker', c.workers]] as const)
    for (const r of rows)
      if (!slots.has(`${prefix}-${r.id}`)) errors.push(`artSlots: missing slot "${prefix}-${r.id}"`);

  // Every *Key must exist in every language, and EN/FR must have the same keys.
  const used = collectKeys(c);
  for (const lang of LANGS)
    for (const k of used)
      if (!(k in c.strings[lang])) errors.push(`strings/${lang}: missing key "${k}"`);
  const [a, b] = LANGS;
  for (const k of Object.keys(c.strings[a]))
    if (!(k in c.strings[b])) errors.push(`strings/${b}: missing key "${k}" (present in ${a})`);
  for (const k of Object.keys(c.strings[b]))
    if (!(k in c.strings[a])) errors.push(`strings/${a}: missing key "${k}" (present in ${b})`);

  return errors;
}

function collectKeys(c: Content): Set<string> {
  const keys = new Set<string>();
  for (const [name, rows] of Object.entries(c)) {
    if (NOT_TABLES.has(name)) continue;
    walkKeys(rows, keys);
  }
  return keys;
}

/** Collect every string-valued `*Key` property, at any depth. */
function walkKeys(node: unknown, keys: Set<string>) {
  if (Array.isArray(node)) for (const n of node) walkKeys(n, keys);
  else if (node && typeof node === 'object')
    for (const [field, v] of Object.entries(node)) {
      if (field.endsWith('Key') && typeof v === 'string') keys.add(v);
      else walkKeys(v, keys);
    }
}
