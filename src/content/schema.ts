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
});
/** Stations are instances of a type (n cauldrons), never singletons. */
export const Station = z.object({
  id,
  nameKey: key,
  /** Candies produced per batch. */
  capacity: z.number().int().positive(),
  batchesPerDay: z.number().int().positive(),
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
});
/** Rough walk-in forecast shown in the morning; the real day differs. */
export const Forecast = z.object({
  id,
  nameKey: key,
  arrivalsMult: z.number().positive(),
  /** Per customer type multiplier on its weight (default 1). */
  weights: z.record(z.string(), z.number().positive()).default({}),
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
  artSlots: ArtSlot,
} as const;

export const LANGS = ['en', 'fr'] as const;
export type Lang = (typeof LANGS)[number];

export type Content = {
  [K in keyof typeof tables]: z.infer<(typeof tables)[K]>[];
} & { settings: z.infer<typeof Settings>; strings: Record<Lang, Record<string, string>> };
