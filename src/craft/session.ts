import type { Content } from '../content/schema.ts';
import { batchCost, isStepAutomated } from '../engine/economy.ts';
import { step } from '../engine/engine.ts';
import type { Fail, FailCode, State } from '../engine/types.ts';

// The hand-crafting steps of one batch, as pure data transforms (no UI imports).
// Tapping an ingredient puts one unit in the cauldron ("fill all" puts them all in); once
// everything is in, the steps run in order (stir, quality extras such as the oven, shape).
// A step that a hired mouse or a machine does for the player (an unlocked automation the
// player has not switched off) is skipped by itself, so a fully automated batch finishes
// the moment it is started. Finishing the last step is when the UI dispatches the engine `craft`.

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
  /** Step ids (among `steps`, plus "fill") that somebody else does for this batch. */
  auto: string[];
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
  const steps = ['stir', ...q.extraSteps.map((x) => x.id), 'form'];
  const auto = ['fill', ...steps].filter((id) => isStepAutomated(c, s, id));
  const need = batchCost(c, candy, quality);
  const cs: CraftSession = { station, candy, quality, need, placed: auto.includes('fill') ? { ...need } : {}, steps, done: 0, auto };
  return advance(cs);
}

export const remaining = (cs: CraftSession, ingredient: string) =>
  (cs.need[ingredient] ?? 0) - (cs.placed[ingredient] ?? 0);

export const placementDone = (cs: CraftSession) => Object.keys(cs.need).every((i) => remaining(cs, i) <= 0);

/** Let the helpers do their steps: skip every automated step that is next in line. */
function advance(cs: CraftSession): CraftSession {
  let done = cs.done;
  if (placementDone(cs)) while (done < cs.steps.length && cs.auto.includes(cs.steps[done]!)) done++;
  return done === cs.done ? cs : { ...cs, done };
}

/** The step the player must do next, or null while ingredients are still going in / when finished. */
export function nextStep(cs: CraftSession): string | null {
  return placementDone(cs) ? (cs.steps[cs.done] ?? null) : null;
}

export const isComplete = (cs: CraftSession) => placementDone(cs) && cs.done >= cs.steps.length;

/** Put one unit of an ingredient into the cauldron (ignored once the recipe has all it needs of it). */
export function add(cs: CraftSession, ingredient: string): CraftSession {
  if (remaining(cs, ingredient) <= 0) return cs;
  return advance({ ...cs, placed: { ...cs.placed, [ingredient]: (cs.placed[ingredient] ?? 0) + 1 } });
}

/** Put in everything the recipe needs at once. */
export function fillAll(cs: CraftSession): CraftSession {
  return placementDone(cs) ? cs : advance({ ...cs, placed: { ...cs.need } });
}

/** Perform a post-placement step; ignored unless it is the expected next one. */
export function doStep(cs: CraftSession, id: string): CraftSession {
  return nextStep(cs) === id ? advance({ ...cs, done: cs.done + 1 }) : cs;
}
