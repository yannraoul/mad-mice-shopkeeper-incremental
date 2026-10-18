import { z } from 'zod';

// Everything that can grow is a row in a data file, never a branch in code.
// Names/text are *Key fields pointing into the string tables (FR + EN).

const id = z.string().regex(/^[a-z0-9-]+$/);
const key = z.string().min(1);
const range = z.tuple([z.number().int().positive(), z.number().int().positive()]);

const IngredientQty = z.object({ ingredient: id, qty: z.number().int().positive() });

/** Ordered integer scale (rank): plain, fine, excellent, perfect. */
export const Quality = z.object({
  id,
  rank: z.number().int().min(0),
  nameKey: key,
  priceMult: z.number().positive(),
  /** Tree unlock needed before this quality can be crafted (absent = always available). */
  unlock: z.string().optional(),
  /** Perfect-style quality: the recipe of the best other quality plus one unit of each of the candy's `perfect` alternates. */
  alternates: z.boolean().default(false),
  /** Extra hand-crafting steps (after stirring, before forming), e.g. the oven. */
  extraSteps: z.array(z.object({ id, nameKey: key })).default([]),
});
export const Ingredient = z.object({
  id,
  nameKey: key,
  /** Units delivered each morning (unused units are sold at closing). Alternates have 0: they come by chance and are kept. */
  dailySupply: z.number().int().min(0),
  /** Tree/errand unlock id that brings this ingredient into the game (absent = from the start). */
  unlock: z.string().optional(),
  /** This is the rare alternate of that base ingredient: a stored extra that arrives by chance, never replacing a base unit. */
  alternateOf: id.optional(),
  /** Chance per morning that one unit arrives while the store is not full (modifier stat `altChance:<id>` adds to it). */
  chance: z.number().min(0).max(1).default(0),
  /** How many units of this alternate the shop can keep (modifier stat `store:<id>` adds to it); alternates carry over and are never sold. */
  store: z.number().int().positive().default(1),
  /** Coins each unused unit is worth when the shop closes (the rare alternates are worth several times a base unit). */
  surplusValue: z.number().min(0).default(0),
});
export const Candy = z.object({
  id,
  nameKey: key,
  basePrice: z.number().positive(),
  /** Ingredients consumed per batch at Plain quality; the recipe opens by itself once all of them are unlocked. */
  ingredients: z.array(IngredientQty).min(1),
  /** Extra units per batch at a given quality (keyed by quality id), on top of the plain recipe. */
  extra: z.record(id, z.array(IngredientQty)).default({}),
  /** Optional additional gate (absent = none beyond the ingredients). */
  unlock: z.string().optional(),
  /** Candies one batch yields, whatever the cauldron (absent = the cauldron's batch size). The Sweet Tooth is made one at a time. */
  batch: z.number().int().positive().optional(),
  /** The alternates a Perfect batch of this candy needs, one unit each (each is the alternate of one of its ingredients). */
  perfect: z.array(id).default([]),
});
/**
 * A step of hand-crafting (fill, stir, bake, pull, whisper, shape). When `automatedBy` is owned, somebody (a hired mouse or a
 * machine) can do it instead of the player, who can still choose to do it by hand.
 */
export const CraftStep = z.object({
  id,
  /** A mouse does the hand work, a machine the rest (flavour for now, art and animation later). */
  owner: z.enum(['mouse', 'machine']),
  /** The helper's name ("Porter mouse"). */
  helperKey: key,
  /** Unlock id that lets the player automate this step; absent = always by hand. */
  automatedBy: z.string().optional(),
});
/** Stations are instances of a type (n cauldrons), never singletons. */
export const Station = z.object({
  id,
  nameKey: key,
  /** Candies produced per batch. */
  capacity: z.number().int().positive(),
  batchesPerDay: z.number().int().positive(),
  /** Automated station: runs its batches by itself every morning (not craftable by hand). */
  auto: z.object({ candy: id, quality: id }).optional(),
});
/**
 * What a customer asks for. `candy`: one specific recipe (picked per visit). `ingredient`: a craving,
 * any candy containing it will do (`from` narrows which ingredients they may crave). `rich`: any candy
 * with at least `minIngredients` ingredients.
 */
export const WantKind = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('candy') }),
  z.object({ kind: z.literal('ingredient'), from: z.array(id).optional() }),
  z.object({ kind: z.literal('rich'), minIngredients: z.number().int().positive() }),
]);
/** Customer axes: wants (picked per visit), min quality, patience, budget. */
export const CustomerType = z.object({
  id,
  nameKey: key,
  minQuality: id,
  /** Number of other customers' actions (serve/refuse) they tolerate while waiting. */
  patience: z.number().int().positive(),
  budget: z.number().positive(),
  /** Base share of arrivals. */
  weight: z.number().positive(),
  /** Appears only once this unlock id is owned (e.g. granted by an errand reward). */
  unlock: z.string().optional(),
  /** What they ask for (default: a specific candy). */
  want: WantKind.default({ kind: 'candy' }),
});
/** Rough walk-in forecast shown in the morning; the real day differs. */
export const Forecast = z.object({
  id,
  nameKey: key,
  arrivalsMult: z.number().positive(),
  /** Per customer type multiplier on its weight (default 1). */
  weights: z.record(z.string(), z.number().positive()).default({}),
});
/** A day of the week with its own rhythm (days without a row are ordinary). */
export const Weekday = z.object({
  id,
  /** 1 to 7: the day of the week it falls on. */
  day: z.number().int().min(1).max(7),
  nameKey: key,
  noteKey: key,
  /** Multiplies the day's walk-ins, on top of the forecast. */
  arrivalsMult: z.number().positive().default(1),
  /** Multiplies what a contract pays when it is handed in today. */
  contractMult: z.number().positive().default(1),
  /** Per customer type multiplier on its weight (default 1). */
  weights: z.record(z.string(), z.number().positive()).default({}),
});
/** A hired helper: once unlocked it can take over customer types the player delegates. */
export const Worker = z.object({
  id,
  nameKey: key,
  /** Tree unlock that hires the worker (e.g. "clerk"). */
  unlock: z.string(),
  /** Customer types this worker can serve. */
  serves: z.array(id).min(1),
});
const Effect = z.discriminatedUnion('type', [
  /** Adds an unlock id (first level only). */
  z.object({ type: z.literal('unlock'), id: z.string() }),
  /** Adds `add` to a stat for every level owned: capacity, counterSpace, patience, supply:<ingredient>, weight:<customerType>. */
  z.object({ type: z.literal('modifier'), stat: z.string(), add: z.number() }),
  /** Adds a station instance (first level only). */
  z.object({ type: z.literal('addStation'), station: id }),
]);
export type Effect = z.infer<typeof Effect>;
/** A skill tree node. `costs` has one price per level: repeatable nodes have several, unlocks one. */
export const SkillNode = z.object({
  id,
  branch: z.enum(['kitchen', 'shop', 'temple']),
  nameKey: key,
  descKey: key,
  costs: z.array(z.number().int().positive()).min(1),
  /** Nodes that must be owned (level >= 1) first: how branches link to each other. */
  requires: z.array(id).default([]),
  /** Unlock ids (granted by other upgrades or by errands) that must be owned first. */
  needs: z.array(z.string()).default([]),
  /** The quest that must be done before this upgrade can be bought. */
  quest: id.optional(),
  effects: z.array(Effect).min(1),
});
/** A rival hive steals `amount` of an ingredient each morning until relieved (errand reward `rivalRelief`). */
const Rival = z.object({
  ingredient: id,
  amount: z.number().int().positive(),
  /** First day of the calendar week (1-based) on which it steals: a grace period to prepare. */
  startsOnDay: z.number().int().positive().default(1),
});
/** What a quest asks for; every goal of a quest must hold. */
export const Goal = z.discriminatedUnion('type', [
  /** Coins earned in all, counting the day in progress (nothing resets and nothing runs out). */
  z.object({ type: z.literal('earn'), amount: z.number().positive() }),
  /** An upgrade owned at this level. */
  z.object({ type: z.literal('own'), node: id, level: z.number().int().positive().default(1) }),
  /** The calendar has reached this day. */
  z.object({ type: z.literal('day'), day: z.number().int().positive() }),
  /** An errand finished. */
  z.object({ type: z.literal('errand'), errand: id }),
]);
/**
 * A quest of the chain: it opens once every quest in `requires` is done, completes by itself the moment all its `goals`
 * hold (no weekly target, no deadline), and grants its `reward`. Upgrades, errands and places can be gated behind a quest.
 */
export const Quest = z.object({
  id,
  nameKey: key,
  descKey: key,
  requires: z.array(id).default([]),
  goals: z.array(Goal).min(1),
  /** Coins paid when the quest is done. */
  coins: z.number().int().min(0).default(0),
  /** More coins when it is done within `days` days of opening (the day the last quest it needs was done): a bonus, never a fail. */
  bonus: z.object({ days: z.number().int().positive(), coins: z.number().int().positive() }).optional(),
  /** From the moment this quest is done, daily arrivals are multiplied by this (the latest done quest that has one counts). */
  arrivalsMult: z.number().positive().optional(),
  /** The rival hive that comes with the latest done quest that sets arrivals (none = no rival). */
  rival: Rival.optional(),
  reward: z.array(Effect).default([]),
});
/** A scripted story errand with permanent rewards. Deliver stock, or send a worker away for some days. */
export const Errand = z.object({
  id,
  nameKey: key,
  descKey: key,
  /** The quest that must be done before it appears. */
  quest: id.optional(),
  /** Unlock ids the player must own (e.g. "errandsBoard"). */
  requires: z.array(z.string()).default([]),
  kind: z.enum(['deliver', 'mission']),
  deliver: z.array(z.object({ candy: id, quality: id.default('plain'), qty: z.number().int().positive() })).default([]),
  mission: z.object({ worker: id, days: z.number().int().positive() }).optional(),
  /** The last quest: delivering it ends the game (the shop runs on afterwards). */
  final: z.boolean().default(false),
  /** Applied when the errand is accepted (e.g. unlocking its special recipe). */
  onAccept: z.array(Effect).default([]),
  /** Permanent rewards, applied on completion. */
  reward: z.array(Effect).min(1),
});
/** A place on the map strip: it shows once its unlock and quest are reached, and pays `income` coins every morning. */
export const Place = z.object({
  id,
  nameKey: key,
  quest: id.optional(),
  unlock: z.string().optional(),
  income: z.number().int().min(0).default(0),
  /** Coins to open it (bought on the map in the evening); 0 = open as soon as its quest is done. */
  cost: z.number().int().min(0).default(0),
});
/** Evening journal line, shown when `when` matches the day's report; all conditions optional. */
export const JournalLine = z.object({
  id,
  textKey: key,
  when: z
    .object({
      minDay: z.number().int().optional(),
      maxDay: z.number().int().optional(),
      revenueAtLeast: z.number().optional(),
      revenueBelow: z.number().optional(),
      lostAtLeast: z.number().int().optional(),
      autoServedAtLeast: z.number().int().optional(),
      node: z.string().optional(),
      /** Result of the week that just ended (set on the first morning/evening after it). */
      questToday: z.boolean().optional(),
    })
    .default({}),
});
/** Fixed-size image slot; swap the file, never the code. */
export const ArtSlot = z.object({
  id,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  file: z.string().min(1),
  altKey: key,
});

/** Singleton balance/config object (`settings.json`); packs may override keys. */
export const Settings = z.object({
  baseArrivals: z.number().positive(),
  /** Relative random spread on the number of arrivals (0.25 = +-25%). */
  arrivalNoise: z.number().min(0).max(1),
  counterSpace: z.number().int().positive(),
  /** The shop welcomes at most counterSpace x this many customers per day (extra ones never come in). */
  customersPerSpace: z.number().int().positive(),
  /** The rival hive never pushes an ingredient below this many units (no fail state). */
  rivalMinSupply: z.number().int().min(0),
  /** Batches of a recipe the player must craft by hand before a worker can sell it. */
  delegateAfterBatches: z.number().int().min(0),
  /** A customer nothing in stock can satisfy leaves on their own after this many turns (no patience cost for the others). */
  stuckLeaveTurns: z.number().int().positive(),
  /** How long the accounting mouse takes over each upgrade it buys, and the least time it spends on the books in an evening, in ms. */
  accountingStepMs: z.number().int().positive(),
  accountingMinMs: z.number().int().positive(),
  /** The shop's rating (0 to 100, 50 at the start) moves prices by at most this fraction either way (0.1 = plus or minus 10 %). */
  ratingSwing: z.number().min(0).max(0.5),
  /** The rating at which prices are unchanged, and how far from it the full swing is reached (50 and 40: 10 or less = -10 %, 90 or more = +10 %). */
  ratingMid: z.number().min(0).max(100),
  ratingRange: z.number().positive(),
  /** How much of each day's satisfaction enters the rating (0.3 = the rating moves 30 % of the way to today's score). */
  ratingSmoothing: z.number().gt(0).max(1),
  startStations: z.array(id).min(1),
  startMoney: z.number().min(0),
  /** Chance per day of a new contract (needs the `contractBoard` unlock). */
  contractChance: z.number().min(0).max(1),
  contractMult: z.number().positive(),
  contractQty: range,
  contractDeadlineDays: range,
  /** Tip at full happiness (3 hearts) as a share of the price; 0 hearts-above-one gives no tip. */
  tipMax: z.number().min(0),
  /** How many units of a craved ingredient one unit of its rare alternate counts for when judging happiness. */
  alternateUnits: z.number().int().positive(),
  /** The daily routine stops making a candy once this many of it are in stock. */
  routineStock: z.number().int().positive(),
  /** How long (ms) the mouse of a crafting step works on it when the routine is played in the scene. */
  sceneStepMs: z.number().int().positive(),
});

/** One animation of a sprite: a horizontal strip of `frames` frames of the sprite's size. */
const SpriteAction = z.object({
  /** Path of the strip under `public/`. */
  file: z.string().min(1),
  frames: z.number().int().positive(),
  fps: z.number().positive(),
  loop: z.boolean().default(true),
});
/** An animated character: frame size and its actions (`idle` is required). */
export const Sprite = z.object({
  id,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  actions: z.record(z.string(), SpriteAction).refine((a) => 'idle' in a, 'a sprite needs an "idle" action'),
});
/** A mouse standing in a scene: it shows once its crafting step is done by a helper, and works while that step is played. */
const SceneActor = z.object({
  id,
  sprite: id,
  /** The crafting step this mouse does (it appears when a helper does it for the player). */
  step: id,
  /** Top-left corner of the sprite's frame, in the scene's own pixels. */
  x: z.number().int(),
  y: z.number().int(),
});
/** A clickable area of a scene that switches one crafting step between its helper and the player's hands. */
const SceneZone = z.object({
  step: id,
  /** Top-left corner and size, in the scene's own pixels. */
  x: z.number().int(),
  y: z.number().int(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
/** A pixel-art background drawn at its own small size and scaled by the UI, with the mice placed on it. */
export const Scene = z.object({
  id,
  file: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  altKey: key,
  actors: z.array(SceneActor).default([]),
  zones: z.array(SceneZone).default([]),
});

export const Strings = z.record(z.string(), z.string());

export const tables = {
  qualities: Quality,
  ingredients: Ingredient,
  candies: Candy,
  stations: Station,
  craftSteps: CraftStep,
  customerTypes: CustomerType,
  forecasts: Forecast,
  weekdays: Weekday,
  workers: Worker,
  skillNodes: SkillNode,
  quests: Quest,
  errands: Errand,
  places: Place,
  journal: JournalLine,
  artSlots: ArtSlot,
  sprites: Sprite,
  scenes: Scene,
} as const;

export const LANGS = ['en', 'fr'] as const;
export type Lang = (typeof LANGS)[number];

export type Content = {
  [K in keyof typeof tables]: z.infer<(typeof tables)[K]>[];
} & { settings: z.infer<typeof Settings>; strings: Record<Lang, Record<string, string>> };
