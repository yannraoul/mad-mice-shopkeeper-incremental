import { z } from 'zod';

// Everything that can grow is a row in a data file, never a branch in code.
// Names/text are *Key fields pointing into the string tables (FR + EN).

const id = z.string().regex(/^[a-z0-9-]+$/);
const key = z.string().min(1);
const range = z.tuple([z.number().int().positive(), z.number().int().positive()]);

const IngredientQty = z.object({ ingredient: id, qty: z.number().int().positive() });

/** Ordered integer scale (rank); v1 ships 3 rows (plain, fine, perfect). */
export const Quality = z.object({
  id,
  rank: z.number().int().min(0),
  nameKey: key,
  priceMult: z.number().positive(),
  /** Tree unlock needed before this quality can be crafted (absent = always available). */
  unlock: z.string().optional(),
  /** Extra ingredients per batch on top of the recipe. */
  extraIngredients: z.array(IngredientQty).default([]),
  /** Extra hand-crafting steps (after stirring, before forming), e.g. the oven. */
  extraSteps: z.array(z.object({ id, nameKey: key })).default([]),
});
export const Ingredient = z.object({
  id,
  nameKey: key,
  /** Units delivered each morning (unused units do not carry over). */
  dailySupply: z.number().int().min(0),
});
export const Candy = z.object({
  id,
  nameKey: key,
  basePrice: z.number().positive(),
  /** Ingredients consumed per batch. */
  ingredients: z.array(IngredientQty).min(1),
  /** Tree unlock needed before this recipe can be crafted or wanted (absent = from the start). */
  unlock: z.string().optional(),
  /** Only customer types that list it in `onlyWants` buy it: regular customers and contracts never ask for it. */
  exclusive: z.boolean().default(false),
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
  /** Always asks for one of these candies instead of the regular ones. */
  onlyWants: z.array(id).optional(),
});
/** Rough walk-in forecast shown in the morning; the real day differs. */
export const Forecast = z.object({
  id,
  nameKey: key,
  arrivalsMult: z.number().positive(),
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
  effects: z.array(Effect).min(1),
});
/** A weekly stage: reach `target` coins of revenue within `days` days to open the next one. */
export const Stage = z.object({
  id,
  nameKey: key,
  days: z.number().int().positive(),
  target: z.number().positive(),
  /** Multiplies the number of daily arrivals (later stages are busier). */
  arrivalsMult: z.number().positive(),
  /** A rival hive steals `amount` of an ingredient each morning until relieved (errand reward `rivalRelief`). */
  rival: z
    .object({
      ingredient: id,
      amount: z.number().int().positive(),
      /** First day of the week (1-based) on which it steals: a grace period to prepare. */
      startsOnDay: z.number().int().positive().default(1),
    })
    .optional(),
});
/** A scripted story errand with permanent rewards. Deliver stock, or send a worker away for some days. */
export const Errand = z.object({
  id,
  nameKey: key,
  descKey: key,
  /** First stage index (0-based) at which it appears. */
  minStage: z.number().int().min(0).default(0),
  /** Unlock ids the player must own (e.g. "errandsBoard"). */
  requires: z.array(z.string()).default([]),
  kind: z.enum(['deliver', 'mission']),
  deliver: z.array(z.object({ candy: id, quality: id.default('plain'), qty: z.number().int().positive() })).default([]),
  mission: z.object({ worker: id, days: z.number().int().positive() }).optional(),
  /** Applied when the errand is accepted (e.g. unlocking its special recipe). */
  onAccept: z.array(Effect).default([]),
  /** Permanent rewards, applied on completion. */
  reward: z.array(Effect).min(1),
});
/** A place on the map strip: flavor only; it shows once its unlock and stage are reached. */
export const Place = z.object({
  id,
  nameKey: key,
  minStage: z.number().int().min(0).default(0),
  unlock: z.string().optional(),
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
      weekResult: z.enum(['passed', 'missed']).optional(),
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
  startStations: z.array(id).min(1),
  startMoney: z.number().min(0),
  /** Chance per day of a new contract (needs the `contractBoard` unlock). */
  contractChance: z.number().min(0).max(1),
  contractMult: z.number().positive(),
  contractQty: range,
  contractDeadlineDays: range,
});

export const Strings = z.record(z.string(), z.string());

export const tables = {
  qualities: Quality,
  ingredients: Ingredient,
  candies: Candy,
  stations: Station,
  customerTypes: CustomerType,
  forecasts: Forecast,
  workers: Worker,
  skillNodes: SkillNode,
  stages: Stage,
  errands: Errand,
  places: Place,
  journal: JournalLine,
  artSlots: ArtSlot,
} as const;

export const LANGS = ['en', 'fr'] as const;
export type Lang = (typeof LANGS)[number];

export type Content = {
  [K in keyof typeof tables]: z.infer<(typeof tables)[K]>[];
} & { settings: z.infer<typeof Settings>; strings: Record<Lang, Record<string, string>> };
