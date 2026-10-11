import type { Content } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import { unlockedCandies, unlockedQualities, batchSize } from '../engine/economy.ts';
import {
  doStep,
  hold,
  isComplete,
  nextStep,
  place,
  remaining,
  startSession,
  type CraftSession,
} from '../craft/session.ts';
import type { Action, State } from '../engine/types.ts';
import { describeFail } from './text.ts';

// The workshop. Hand-crafting is a small interaction (pick a recipe, tap an ingredient, tap the
// cauldron, stir, shape...) that is not part of the saved game, so it has its own small state,
// `CraftUi`, and a pure reducer. Any UI keeps a `CraftUi`, feeds it `CraftEvent`s and renders
// `buildCraftView`. The finished batch is handed to the engine through the `dispatch` callback.

export interface CraftUi {
  /** The recipe form (what the next batch will be). */
  station: number;
  candy: string;
  quality: string;
  /** The batch being made by hand, if any. */
  session: CraftSession | null;
  /** The last batch finished, shown as "Made 4 × ...". Stored as ids so it re-translates. */
  note: { station: number; candy: string; quality: string } | null;
}

export type CraftEvent =
  | { type: 'select'; field: 'station'; value: number }
  | { type: 'select'; field: 'candy' | 'quality'; value: string }
  | { type: 'start' }
  | { type: 'tapShelf'; ingredient: string }
  | { type: 'tapStation' }
  | { type: 'step'; id: string }
  | { type: 'cancel' };

export const initialCraftUi = (c: Content): CraftUi => ({
  station: 0,
  candy: c.candies[0]!.id,
  quality: 'plain',
  session: null,
  note: null,
});

/** Apply one UI event. Finishing the last step crafts the batch through `dispatch`. */
export function craftReduce(
  c: Content,
  s: State,
  ui: CraftUi,
  ev: CraftEvent,
  dispatch: (a: Action) => boolean,
): CraftUi {
  switch (ev.type) {
    case 'select':
      return { ...ui, [ev.field]: ev.value };
    case 'start': {
      const r = startSession(c, s, ui.station, ui.candy, ui.quality);
      return 'error' in r ? ui : { ...ui, note: null, session: r };
    }
    case 'tapShelf':
      return ui.session ? { ...ui, session: hold(ui.session, ev.ingredient) } : ui;
    case 'tapStation':
      return ui.session ? { ...ui, session: place(ui.session) } : ui;
    case 'step': {
      if (!ui.session) return ui;
      const next = doStep(ui.session, ev.id);
      if (!isComplete(next)) return { ...ui, session: next };
      const { station, candy, quality } = next;
      const ok = dispatch({ type: 'craft', station, candy, quality });
      return { ...ui, session: null, note: ok ? { station, candy, quality } : ui.note };
    }
    case 'cancel':
      return { ...ui, session: null };
  }
}

export interface CraftIdleView {
  newBatchTitle: string;
  /** Hand stations to choose from; empty when there is only one (no choice to show). */
  stations: { value: number; label: string }[];
  stationLabel: string;
  candies: { value: string; label: string }[];
  candyLabel: string;
  qualities: { value: string; label: string }[];
  qualityLabel: string;
  start: { label: string; enabled: boolean };
  /** Why the batch cannot be started, translated. */
  blocked: string | null;
  batchesLeft: string;
  suppliesTitle: string;
  supplies: string[];
}

export interface CraftBenchView {
  shelfTitle: string;
  shelf: { ingredient: string; art: string; name: string; supply: string; held: boolean; enabled: boolean }[];
  stationTitle: string;
  /** Art slot id of the station being used. */
  stationArt: string;
  /** True while an ingredient is in hand: the station is waiting for it. */
  stationArmed: boolean;
  /** What is in the station so far, per ingredient: "Honey: 1 / 2". */
  contents: { ingredient: string; placed: number; need: number; text: string }[];
  hint: string;
  steps: { id: string; label: string; done: boolean; enabled: boolean; primary: boolean }[];
  cancelLabel: string;
}

export interface CraftView {
  title: string;
  /** Either the recipe form (with its "nothing left to craft" variant) or the bench. */
  mode: 'idle' | 'bench';
  noBatches: string | null;
  idle: CraftIdleView | null;
  bench: CraftBenchView | null;
  /** "Made 4 × Honey drop (Plain)." for the last finished batch; null while a batch is in progress. */
  made: string | null;
}

export function buildCraftView(c: Content, s: State, ui: CraftUi, t: Translate): CraftView {
  const stepName = (id: string) => {
    if (id === 'stir' || id === 'form') return t(`step.${id}`);
    const extra = c.qualities.flatMap((q) => q.extraSteps).find((x) => x.id === id);
    return extra ? t(extra.nameKey) : id;
  };
  const made = ui.note
    ? t('craft.made', {
        qty: batchSize(c, s, s.stations[ui.note.station]!.type),
        candy: t(`candy.${ui.note.candy}`),
        quality: t(`quality.${ui.note.quality}`),
      })
    : null;

  const session = ui.session;
  if (session) {
    const upcoming = nextStep(session);
    const stationType = s.stations[session.station]!.type;
    return {
      title: t('craft.title'),
      mode: 'bench',
      noBatches: null,
      idle: null,
      made: null,
      bench: {
        shelfTitle: t('craft.shelf'),
        shelf: c.ingredients.map((ing) => ({
          ingredient: ing.id,
          art: `ingredient-${ing.id}`,
          name: t(ing.nameKey),
          supply: t('craft.supply', { n: (s.supply[ing.id] ?? 0) - (session.placed[ing.id] ?? 0) }),
          held: session.held === ing.id,
          enabled: remaining(session, ing.id) > 0,
        })),
        stationTitle: t('craft.inCauldron'),
        stationArt: `station-${stationType}`,
        stationArmed: !!session.held,
        contents: Object.entries(session.need).map(([ingredient, need]) => {
          const placed = session.placed[ingredient] ?? 0;
          return { ingredient, placed, need, text: `${t(`ingredient.${ingredient}`)}: ${placed} / ${need}` };
        }),
        hint: upcoming
          ? t('craft.hint.step', { step: stepName(upcoming) })
          : session.held
            ? t('craft.hint.place', { station: t(`station.${stationType}`) })
            : t('craft.hint.pick'),
        steps: session.steps.map((id, i) => ({
          id,
          label: `${i < session.done ? '✓ ' : ''}${stepName(id)}`,
          done: i < session.done,
          enabled: upcoming === id,
          primary: upcoming === id,
        })),
        cancelLabel: t('craft.cancel'),
      },
    };
  }

  // Automated stations run by themselves every morning: only hand stations appear here.
  const handStations = s.stations
    .map((inst, i) => ({ inst, i }))
    .filter(({ inst }) => !c.stations.find((x) => x.id === inst.type)?.auto);
  const batchesLeft = handStations.reduce((n, x) => n + x.inst.batchesLeft, 0);
  if (batchesLeft === 0)
    return { title: t('craft.title'), mode: 'idle', noBatches: t('craft.noBatches'), idle: null, bench: null, made };

  const check = startSession(c, s, ui.station, ui.candy, ui.quality);
  const blocked = 'error' in check ? check : null;
  return {
    title: t('craft.title'),
    mode: 'idle',
    noBatches: null,
    bench: null,
    made,
    idle: {
      newBatchTitle: t('craft.newBatch'),
      stations:
        handStations.length > 1
          ? handStations.map(({ inst, i }) => ({ value: i, label: `${t(`station.${inst.type}`)} #${i + 1}` }))
          : [],
      stationLabel: t('craft.station'),
      candies: unlockedCandies(c, s).map((cd) => ({ value: cd.id, label: t(cd.nameKey) })),
      candyLabel: t('craft.candy'),
      qualities: unlockedQualities(c, s).map((q) => ({ value: q.id, label: t(q.nameKey) })),
      qualityLabel: t('craft.quality'),
      start: { label: t('craft.start'), enabled: !blocked },
      blocked: blocked ? t('craft.cannot', { error: describeFail(t, blocked.code, blocked.params) }) : null,
      batchesLeft: t('craft.batchesLeft', { n: s.stations[ui.station]?.batchesLeft ?? 0 }),
      suppliesTitle: t('craft.suppliesToday'),
      supplies: c.ingredients.map((ing) => `${t(ing.nameKey)}: ${s.supply[ing.id] ?? 0}`),
    },
  };
}
