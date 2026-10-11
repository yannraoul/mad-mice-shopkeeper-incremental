import { z } from 'zod';
import { tables, Strings, LANGS, type Content } from './schema.ts';

export interface RawFile {
  pack: string;
  /** Path inside the pack, e.g. `candies.json` or `strings/en.json`. */
  path: string;
  data: unknown;
}

/**
 * Merges every pack (core first) into one validated Content:
 * table files (`candies.json`, ...) concatenate rows, `strings/<lang>.json` merge keys.
 * Throws one error listing every problem found.
 */
export function loadContent(files: RawFile[]): Content {
  const errors: string[] = [];
  const out: Record<string, unknown[]> = Object.fromEntries(Object.keys(tables).map((t) => [t, []]));
  const strings: Record<string, Record<string, string>> = { en: {}, fr: {} };

  for (const f of files) {
    const where = `${f.pack}/${f.path}`;
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

  const content = { ...out, strings } as unknown as Content;
  if (errors.length === 0) errors.push(...validateRefs(content));
  if (errors.length) throw new Error(errors.join('\n'));
  return content;
}

/** Cross-references, duplicate ids, and FR/EN string parity. */
export function validateRefs(c: Content): string[] {
  const errors: string[] = [];

  for (const [name, rows] of Object.entries(c) as [string, { id?: string }[]][]) {
    if (name === 'strings') continue;
    const seen = new Set<string>();
    for (const r of rows) {
      if (seen.has(r.id!)) errors.push(`${name}: duplicate id "${r.id}"`);
      seen.add(r.id!);
    }
  }

  const ids = (rows: { id: string }[]) => new Set(rows.map((r) => r.id));
  const qualities = ids(c.qualities);
  const ingredients = ids(c.ingredients);
  for (const cu of c.customerTypes)
    if (!qualities.has(cu.minQuality)) errors.push(`customerTypes/${cu.id}: unknown quality "${cu.minQuality}"`);
  for (const ca of c.candies)
    for (const i of ca.ingredients)
      if (!ingredients.has(i.ingredient)) errors.push(`candies/${ca.id}: unknown ingredient "${i.ingredient}"`);

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
    if (name === 'strings') continue;
    for (const row of rows as Record<string, unknown>[])
      for (const [field, v] of Object.entries(row))
        if (field.endsWith('Key') && typeof v === 'string') keys.add(v);
  }
  return keys;
}
