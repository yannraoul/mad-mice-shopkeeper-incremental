import type { Content } from '../content/schema.ts';
import { batchCost } from '../engine/economy.ts';
import { step } from '../engine/engine.ts';
import type { Fail, FailCode, State } from '../engine/types.ts';

// The hand-crafting steps of one batch, as pure data transforms (no UI imports).
// Tapping an ingredient puts one unit in the cauldron; once everything is in, the
// steps run in order (stir, quality extras such as the oven, shape). Finishing the
// last step is when the UI dispatches the engine `craft`.

export interface CraftSession {
  station: number;
  candy: string;
  quality: string;
  /** Units of each ingredient this batch needs. */
  need: Record<string, number>;
  placed: Record<string, number>;
  /** Step ids after placement, in order: stir, quality extras, form. */
  steps: string[];
  /** How many of `steps` are done. */
  done: number;
}

/** Start a batch, or return why it cannot be started (the engine is the judge). */
export function startSession(
  c: Content,
  s: State,
  station: number,
  candy: string,
  quality: string,
): CraftSession | { error: string; code: FailCode; params: Fail['params'] } {
  const probe = step(c, s, { type: 'craft', station, candy, quality });
  if (!probe.ok) return { error: probe.error, code: probe.code, params: probe.params };
  const q = c.qualities.find((x) => x.id === quality)!;
  return {
    station,
    candy,
    quality,
    need: batchCost(c, candy, quality),
    placed: {},
    steps: ['stir', ...q.extraSteps.map((x) => x.id), 'form'],
    done: 0,
  };
}

export const remaining = (cs: CraftSession, ingredient: string) =>
  (cs.need[ingredient] ?? 0) - (cs.placed[ingredient] ?? 0);

export const placementDone = (cs: CraftSession) => Object.keys(cs.need).every((i) => remaining(cs, i) <= 0);

/** The step the player must do next, or null while ingredients are still going in / when finished. */
export function nextStep(cs: CraftSession): string | null {
  return placementDone(cs) ? (cs.steps[cs.done] ?? null) : null;
}

export const isComplete = (cs: CraftSession) => placementDone(cs) && cs.done >= cs.steps.length;

/** Put one unit of an ingredient into the cauldron (ignored once the recipe has all it needs of it). */
export function add(cs: CraftSession, ingredient: string): CraftSession {
  if (remaining(cs, ingredient) <= 0) return cs;
  return { ...cs, placed: { ...cs.placed, [ingredient]: (cs.placed[ingredient] ?? 0) + 1 } };
}

/** Perform a post-placement step; ignored unless it is the expected next one. */
export function doStep(cs: CraftSession, id: string): CraftSession {
  return nextStep(cs) === id ? { ...cs, done: cs.done + 1 } : cs;
}
