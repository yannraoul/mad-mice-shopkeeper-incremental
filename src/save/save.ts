import { z } from 'zod';
import type { Content } from '../content/schema.ts';
import { PHASES } from '../engine/phases.ts';
import type { State } from '../engine/types.ts';

// Saves are a versioned envelope around the plain engine State. Bump SAVE_VERSION whenever the
// State shape changes and add a step to `migrate`, so old saves keep loading.
export const SAVE_VERSION = 1;
const EXPORT_PREFIX = 'CST1:';

const num = z.number();
const rec = <T extends z.ZodType>(t: T) => z.record(z.string(), t);
const Customer = z.object({
  id: num, type: z.string(), wants: z.string(), minQuality: z.string(), patience: num, budget: num,
});
const Report = z.object({
  day: num, forecast: z.string(), crafted: num, arrivals: num, served: num, autoServed: num,
  refused: num, lost: num, contractsDone: num, contractsExpired: num, revenue: num,
});
const StateSchema = z.object({
  day: z.number().int().min(1),
  phase: z.enum(PHASES),
  rng: num,
  nextId: num,
  money: num.min(0),
  nodes: rec(num),
  unlocks: z.array(z.string()),
  stations: z.array(z.object({ type: z.string(), batchesLeft: num })),
  supply: rec(num),
  stock: rec(num),
  forecast: z.string(),
  contracts: z.array(
    z.object({ id: num, candy: z.string(), quality: z.string(), qty: num, deadlineDay: num, reward: num }),
  ),
  delegated: z.array(z.string()),
  batchesMade: rec(num),
  pending: z.array(Customer),
  queue: z.array(Customer),
  report: Report,
  history: z.array(Report),
});

export interface Envelope {
  v: number;
  savedAt: string;
  state: State;
}

/** Why a save could not be loaded; the UI translates the code, `error` is English detail for logs/tests. */
export type LoadErrorCode = 'not-a-save' | 'corrupted' | 'newer-version' | 'invalid-data' | 'unknown-content';
export type LoadResult = { ok: true; state: State } | { ok: false; code: LoadErrorCode; error: string };

const bad = (code: LoadErrorCode, error: string): LoadResult => ({ ok: false, code, error });

export function serialize(state: State, now: Date = new Date()): string {
  const env: Envelope = { v: SAVE_VERSION, savedAt: now.toISOString(), state };
  return JSON.stringify(env);
}

/** Upgrade an older envelope to the current shape (none exist yet). */
function migrate(env: { v: unknown; state: unknown }): { state: unknown } | { code: LoadErrorCode; error: string } {
  if (typeof env.v !== 'number') return { code: 'not-a-save', error: 'missing save version' };
  if (env.v > SAVE_VERSION)
    return { code: 'newer-version', error: `save version ${env.v} is newer than this game (${SAVE_VERSION})` };
  let state = env.state;
  // for (let v = env.v; v < SAVE_VERSION; v++) state = MIGRATIONS[v](state);
  if (env.v < 1) return { code: 'not-a-save', error: `unsupported save version ${env.v}` };
  return { state };
}

export function deserialize(c: Content, text: string): LoadResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return bad('not-a-save', 'not valid save data');
  }
  if (typeof raw !== 'object' || raw === null || !('state' in raw)) return bad('not-a-save', 'not a save');
  const migrated = migrate(raw as { v: unknown; state: unknown });
  if ('error' in migrated) return bad(migrated.code, migrated.error);
  const parsed = StateSchema.safeParse(migrated.state);
  if (!parsed.success) return bad('invalid-data', z.prettifyError(parsed.error));
  const problem = checkAgainstContent(c, parsed.data as State);
  return problem ? bad('unknown-content', problem) : { ok: true, state: parsed.data as State };
}

/** The save must only mention things that exist in the current content. */
export function checkAgainstContent(c: Content, s: State): string | null {
  const has = (rows: { id: string }[], id: string) => rows.some((r) => r.id === id);
  for (const st of s.stations) if (!has(c.stations, st.type)) return `unknown station "${st.type}"`;
  for (const n of Object.keys(s.nodes)) if (!has(c.skillNodes, n)) return `unknown upgrade "${n}"`;
  if (!has(c.forecasts, s.forecast)) return `unknown forecast "${s.forecast}"`;
  for (const t of s.delegated) if (!has(c.customerTypes, t)) return `unknown customer type "${t}"`;
  for (const k of Object.keys(s.stock)) {
    const [candy, quality] = k.split(':');
    if (!has(c.candies, candy ?? '') || !has(c.qualities, quality ?? '')) return `unknown stock "${k}"`;
  }
  for (const cu of [...s.queue, ...s.pending])
    if (!has(c.customerTypes, cu.type) || !has(c.candies, cu.wants)) return `unknown customer #${cu.id}`;
  return null;
}

/** Copy-paste backup: prefix + base64 of the save JSON. */
export function exportString(state: State): string {
  const bytes = new TextEncoder().encode(serialize(state));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return EXPORT_PREFIX + btoa(bin);
}

export function importString(c: Content, text: string): LoadResult {
  const t = text.trim();
  if (!t.startsWith(EXPORT_PREFIX)) return bad('not-a-save', 'not an exported save');
  let json: string;
  try {
    const bin = atob(t.slice(EXPORT_PREFIX.length));
    json = new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
  } catch {
    return bad('corrupted', 'corrupted save text');
  }
  return deserialize(c, json);
}
