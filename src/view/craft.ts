import type { Content } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import { unlockedCandies, unlockedQualities, batchSize, batchCost, priceOf, isQualityUnlocked } from '../engine/economy.ts';
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
  /** The recipes on offer as cards (cost and price at the chosen quality). */
  recipes: { value: string; name: string; art: string; costText: string; priceText: string; selected: boolean }[];
  /** All qualities as a segmented control; locked ones are listed but not `enabled`. */
  qualityOptions: { value: string; label: string; note: string; selected: boolean; enabled: boolean }[];
  start: { label: string; enabled: boolean };
  /** Why the batch cannot be started, translated. */
  blocked: string | null;
  batchesLeft: string;
  suppliesTitle: string;
  supplies: string[];
}

/** The scene shared by both modes: shelf, cauldron and the batch counters. */
export interface CraftScene {
  shelfTitle: string;
  shelfSub: string;
  shelf: {
    ingredient: string;
    art: string;
    name: string;
    /** "3 left" */
    supply: string;
    /** Pips: `left` filled out of `total` delivered this morning. */
    left: number;
    total: number;
    held: boolean;
    /** Dimmed: another ingredient is in hand, or this one is not needed. Only on the bench. */
    dimmed: boolean;
    enabled: boolean;
  }[];
  cauldronTitle: string;
  stationArt: string;
  stationArmed: boolean;
  batchesTitle: string;
  /** Circles: `left` filled out of `total`. */
  batches: { left: number; total: number };
  /** "3 batches · 4 candies each" */
  batchInfo: string;
  /** "In the cauldron" and its lines ("Honey 1 / 2"), on the bench only. */
  inCauldron: { title: string; lines: string[] } | null;
}

export interface CraftBenchView {
  /** Fill / Stir / Bake / Shape, the whole path of a batch; steps this quality skips are `dimmed`. */
  track: { id: string; n: number; label: string; note: string; state: 'done' | 'current' | 'todo'; dimmed: boolean }[];
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
  scene: CraftScene;
  noBatches: string | null;
  idle: CraftIdleView | null;
  bench: CraftBenchView | null;
  /** "Made 4 × Honey drop (Plain)." for the last finished batch; null while a batch is in progress. */
  made: string | null;
}

/** The whole path of a batch for the step track: Fill, then every step any quality can have, then Shape. */
function buildTrack(
  c: Content,
  t: Translate,
  session: CraftSession,
  upcoming: string | null,
  size: number,
): CraftBenchView['track'] {
  const need = Object.values(session.need).reduce((n, x) => n + x, 0);
  const placed = Object.values(session.placed).reduce((n, x) => n + x, 0);
  const single = Object.keys(session.need).length === 1 ? ` ${t(`ingredient.${Object.keys(session.need)[0]}`)}` : '';
  const extras = [...new Set(c.qualities.flatMap((q) => q.extraSteps.map((x) => x.id)))];
  const filled = placed >= need;
  const noteFor = (id: string) =>
    id === 'stir' ? t('craft.note.stir') : id === 'form' ? t('craft.note.form', { size }) : t(`craft.note.${id}`);
  const rest = ['stir', ...extras, 'form'].map((id, i) => {
    const at = session.steps.indexOf(id);
    const skipped = at < 0;
    return {
      id,
      n: i + 2,
      label: t(`track.${id}`),
      note: noteFor(id),
      state: skipped ? ('todo' as const) : at < session.done ? ('done' as const) : id === upcoming ? ('current' as const) : ('todo' as const),
      dimmed: skipped,
    };
  });
  return [
    {
      id: 'fill',
      n: 1,
      label: t('track.fill'),
      note: `${placed} / ${need}${single}`,
      state: filled ? 'done' : 'current',
      dimmed: false,
    },
    ...rest,
  ];
}

function buildScene(c: Content, s: State, ui: CraftUi, t: Translate): CraftScene {
  const session = ui.session;
  const inst = s.stations[session ? session.station : ui.station] ?? s.stations[0]!;
  const type = c.stations.find((x) => x.id === inst.type)!;
  return {
    shelfTitle: t('craft.shelf'),
    shelfSub: t('craft.shelfSub'),
    shelf: c.ingredients.map((ing) => {
      const left = (s.supply[ing.id] ?? 0) - (session?.placed[ing.id] ?? 0);
      return {
        ingredient: ing.id,
        art: `ingredient-${ing.id}`,
        name: t(ing.nameKey),
        supply: t('craft.supply', { n: left }),
        left,
        total: Math.max(left, s.supplyToday[ing.id] ?? 0),
        held: session?.held === ing.id,
        dimmed: !!session && !!session.held && session.held !== ing.id,
        enabled: !!session && remaining(session, ing.id) > 0,
      };
    }),
    cauldronTitle: t('craft.cauldron'),
    stationArt: `station-${inst.type}`,
    stationArmed: !!session?.held,
    batchesTitle: t('craft.batchesToday'),
    batches: { left: inst.batchesLeft, total: Math.max(inst.batchesLeft, type.batchesPerDay) },
    batchInfo: t('craft.batchInfo', { n: inst.batchesLeft, size: batchSize(c, s, inst.type) }),
    inCauldron: session
      ? {
          title: t('craft.inCauldron'),
          lines: Object.entries(session.need).map(
            ([ingredient, need]) => `${t(`ingredient.${ingredient}`)} ${session.placed[ingredient] ?? 0} / ${need}`,
          ),
        }
      : null,
  };
}

export function buildCraftView(c: Content, s: State, ui: CraftUi, t: Translate): CraftView {
  const v = buildCraftBase(c, s, ui, t);
  return { ...v, scene: buildScene(c, s, ui, t) };
}

function buildCraftBase(c: Content, s: State, ui: CraftUi, t: Translate): Omit<CraftView, 'scene'> {
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
        track: buildTrack(c, t, session, upcoming, batchSize(c, s, stationType)),
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
      recipes: unlockedCandies(c, s).map((cd) => ({
        value: cd.id,
        name: t(cd.nameKey),
        art: `candy-${cd.id}`,
        costText: Object.entries(batchCost(c, cd.id, ui.quality))
          .map(([ing, qty]) => `${qty} ${t(`ingredient.${ing}`)}`)
          .join(', '),
        priceText: t('ui.money', { n: priceOf(c, cd.id, ui.quality) }),
        selected: cd.id === ui.candy,
      })),
      qualityOptions: c.qualities
        .slice().sort((a, b) => a.rank - b.rank)
        .map((q) => ({
          value: q.id,
          label: t(q.nameKey),
          note: `×${q.priceMult}${q.unlock ? ` · ${t(`quality.note.${q.id}`)}` : ''}`,
          selected: q.id === ui.quality,
          enabled: isQualityUnlocked(c, s, q.id),
        })),
      start: { label: t('craft.start'), enabled: !blocked },
      blocked: blocked ? t('craft.cannot', { error: describeFail(t, blocked.code, blocked.params) }) : null,
      batchesLeft: t('craft.batchesLeft', { n: s.stations[ui.station]?.batchesLeft ?? 0 }),
      suppliesTitle: t('craft.suppliesToday'),
      supplies: c.ingredients.map((ing) => `${t(ing.nameKey)}: ${s.supply[ing.id] ?? 0}`),
    },
  };
}
