import { z } from 'zod';
import type { Content } from '../content/schema.ts';
import { PHASES } from '../engine/phases.ts';
import type { State } from '../engine/types.ts';

// Saves are a versioned envelope around the plain engine State. Bump SAVE_VERSION whenever the
// State shape changes and add a step to `migrate`, so old saves keep loading.
export const SAVE_VERSION = 8;
const EXPORT_PREFIX = 'CST1:';

const num = z.number();
const rec = <T extends z.ZodType>(t: T) => z.record(z.string(), t);
const Customer = z.object({
  id: num, type: z.string(), minQuality: z.string(), patience: num, budget: num,
  want: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('candy'), candy: z.string() }),
    z.object({ kind: z.literal('ingredient'), ingredient: z.string() }),
    z.object({ kind: z.literal('rich'), minIngredients: num }),
  ]),
});
const Report = z.object({
  day: num, stage: num.default(0), forecast: z.string(), crafted: num, arrivals: num, served: num, tips: num.default(0), surplus: num.default(0), income: num.default(0), autoServed: num,
  refused: num, lost: num, contractsDone: num, contractsExpired: num, revenue: num,
});
const StateSchema = z.object({
  day: z.number().int().min(1),
  phase: z.enum(PHASES),
  rng: num,
  nextId: num,
  money: num.min(0),
  stage: z.object({ index: num.int().min(0), day: num.min(0), revenue: num.min(0), misses: num.min(0).default(0) }),
  lastWeek: z.object({ stage: num, passed: z.boolean(), revenue: num, target: num }).nullable(),
  completed: z.boolean(),
  errands: rec(z.object({ status: z.enum(['active', 'done']), daysLeft: num.optional() })),
  nodes: rec(num),
  unlocks: z.array(z.string()),
  stations: z.array(z.object({ type: z.string(), batchesLeft: num })),
  supply: rec(num),
  supplyToday: rec(num),
  stock: rec(num),
  forecast: z.string(),
  contracts: z.array(
    z.object({ id: num, candy: z.string(), quality: z.string(), qty: num, deadlineDay: num, reward: num }),
  ),
  delegated: z.array(z.string()),
  handSteps: z.array(z.string()).default([]),
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

/** MIGRATIONS[n] upgrades a version-n state to version n+1. */
const MIGRATIONS: Record<number, (state: unknown) => unknown> = {
  // v1 (M4) -> v2 (M5): weekly stages and errands. Old games restart the week counter at stage 1.
  1: (state) => {
    if (typeof state !== 'object' || state === null) return state;
    return { ...state, stage: { index: 0, day: 0, revenue: 0 }, lastWeek: null, completed: false, errands: {} };
  },
  // v2 -> v3: the shelf remembers what was delivered this morning. Old games take today's remaining stock.
  2: (state) => {
    if (typeof state !== 'object' || state === null) return state;
    const supply = (state as { supply?: Record<string, number> }).supply ?? {};
    return { ...state, supplyToday: { ...supply } };
  },
  // v3 -> v4 (MMSIM-11): ingredients, qualities and candies were redesigned. Legacy ids are renamed or dropped;
  // anything already in the new vocabulary is left alone.
  3: (state) => {
    if (typeof state !== 'object' || state === null) return state;
    const s = state as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    const RENAME: Record<string, string> = { 'honey-drop': 'candy-cane' };
    const GONE = new Set(['royal-tonic', 'honey-toffee']);
    const candy = (id: string) => RENAME[id] ?? id;
    const byCandy = (rec: Record<string, number> | undefined, sep: string) =>
      Object.fromEntries(Object.entries(rec ?? {}).filter(([k]) => !GONE.has(k.split(sep)[0]!)).map(([k, v]) => {
        const [head, ...rest] = k.split(sep);
        return [[candy(head!), ...rest].join(sep), v];
      }));
    const unlocks = ((s.unlocks ?? []) as string[]).flatMap((u) => (u === 'recipe-2' ? ['sunflower'] : u === 'recipe-3' || u === 'tonic-recipe' ? [] : [u]));
    const nodes: Record<string, number> = {};
    for (const [k, v] of Object.entries((s.nodes ?? {}) as Record<string, number>)) {
      if (k === 'recipe-3') continue;
      nodes[k === 'recipe-2' ? 'sunflower-patch' : k] = v;
    }
    const seedless = (rec: Record<string, number> | undefined) => {
      const out = { ...(rec ?? {}) };
      if (!unlocks.includes('dark-garden')) delete out['dark-seed'];
      return out;
    };
    const customers = (list: { wants: string }[] | undefined) =>
      (list ?? []).filter((x) => !GONE.has(x.wants)).map((x) => ({ ...x, wants: candy(x.wants) }));
    return {
      ...s,
      unlocks,
      nodes,
      supply: seedless(s.supply),
      supplyToday: seedless(s.supplyToday),
      stock: byCandy(s.stock, ':'),
      batchesMade: byCandy(s.batchesMade, ':'),
      contracts: ((s.contracts ?? []) as { candy: string }[]).filter((x) => !GONE.has(x.candy)).map((x) => ({ ...x, candy: candy(x.candy) })),
      queue: customers(s.queue),
      pending: customers(s.pending),
    };
  },
  // v4 -> v5 (MMSIM-12): customers ask for a candy, an ingredient or a rich candy (`want`), and days record tips.
  4: (state) => {
    if (typeof state !== 'object' || state === null) return state;
    const s = state as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    const customers = (list: Record<string, unknown>[] | undefined) =>
      (list ?? []).map(({ wants, ...rest }) => ({ ...rest, want: { kind: 'candy', candy: wants } }));
    const withTips = (r: Record<string, unknown>) => ({ tips: 0, ...r });
    return {
      ...s,
      queue: customers(s.queue),
      pending: customers(s.pending),
      report: withTips(s.report ?? {}),
      history: ((s.history ?? []) as Record<string, unknown>[]).map(withTips),
    };
  },
  // v5 -> v6: days record the coins from unused ingredients sold at closing.
  5: (state) => {
    if (typeof state !== 'object' || state === null) return state;
    const s = state as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    const withSurplus = (r: Record<string, unknown>) => ({ surplus: 0, ...r });
    return {
      ...s,
      report: withSurplus(s.report ?? {}),
      history: ((s.history ?? []) as Record<string, unknown>[]).map(withSurplus),
    };
  },
  // v6 -> v7 (MMSIM-13): the stage chain. Stages track missed weeks (easy mode), days record passive income, and the
  // game is only complete once the final quest was delivered (the old "last stage passed" flag is dropped).
  6: (state) => {
    if (typeof state !== 'object' || state === null) return state;
    const s = state as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    const withIncome = (r: Record<string, unknown>) => ({ income: 0, ...r });
    return {
      ...s,
      stage: { misses: 0, ...(s.stage ?? {}) },
      completed: Boolean((s.errands ?? {})['sweet-tooth-offering']?.status === 'done'),
      report: withIncome(s.report ?? {}),
      history: ((s.history ?? []) as Record<string, unknown>[]).map(withIncome),
    };
  },
  // v7 -> v8 (MMSIM-15): the player's choice of crafting steps to do by hand although a helper could.
  7: (state) => {
    if (typeof state !== 'object' || state === null) return state;
    return { handSteps: [], ...(state as Record<string, unknown>) };
  },
};

/** Upgrade an older envelope to the current shape (none exist yet). */
function migrate(env: { v: unknown; state: unknown }): { state: unknown } | { code: LoadErrorCode; error: string } {
  if (typeof env.v !== 'number') return { code: 'not-a-save', error: 'missing save version' };
  if (env.v > SAVE_VERSION)
    return { code: 'newer-version', error: `save version ${env.v} is newer than this game (${SAVE_VERSION})` };
  if (env.v < 1) return { code: 'not-a-save', error: `unsupported save version ${env.v}` };
  let state = env.state;
  for (let v = env.v; v < SAVE_VERSION; v++) state = MIGRATIONS[v]!(state);
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
  if (s.stage.index >= c.stages.length) return `unknown stage ${s.stage.index}`;
  for (const e of Object.keys(s.errands)) if (!has(c.errands, e)) return `unknown errand "${e}"`;
  if (!has(c.forecasts, s.forecast)) return `unknown forecast "${s.forecast}"`;
  for (const t of s.delegated) if (!has(c.customerTypes, t)) return `unknown customer type "${t}"`;
  for (const k of Object.keys(s.stock)) {
    const [candy, quality] = k.split(':');
    if (!has(c.candies, candy ?? '') || !has(c.qualities, quality ?? '')) return `unknown stock "${k}"`;
  }
  for (const cu of [...s.queue, ...s.pending])
    if (
      !has(c.customerTypes, cu.type) ||
      (cu.want.kind === 'candy' && !has(c.candies, cu.want.candy)) ||
      (cu.want.kind === 'ingredient' && !has(c.ingredients, cu.want.ingredient))
    )
      return `unknown customer #${cu.id}`;
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
