import { z } from 'zod';

// Everything that can grow is a row in a data file, never a branch in code.
// Names/text are *Key fields pointing into the string tables (FR + EN).

const id = z.string().regex(/^[a-z0-9-]+$/);
const key = z.string().min(1);

/** Ordered integer scale; v1 ships 3 rows (plain, fine, perfect). */
export const Quality = z.object({ id, rank: z.number().int().min(0), nameKey: key });
export const Ingredient = z.object({ id, nameKey: key });
export const Candy = z.object({
  id,
  nameKey: key,
  basePrice: z.number().positive(),
  ingredients: z.array(z.object({ ingredient: id, qty: z.number().int().positive() })).min(1),
});
/** Stations are instances of a type (n cauldrons), never singletons. */
export const Station = z.object({ id, nameKey: key, capacity: z.number().int().positive() });
/** Customer axes: wants (picked per visit), min quality, patience, budget. */
export const CustomerType = z.object({
  id,
  nameKey: key,
  minQuality: id,
  patience: z.number().positive(),
  budget: z.number().positive(),
});
/** Fixed-size image slot; swap the file, never the code. */
export const ArtSlot = z.object({
  id,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  file: z.string().min(1),
  altKey: key,
});

export const Strings = z.record(z.string(), z.string());

export const tables = {
  qualities: Quality,
  ingredients: Ingredient,
  candies: Candy,
  stations: Station,
  customerTypes: CustomerType,
  artSlots: ArtSlot,
} as const;

export const LANGS = ['en', 'fr'] as const;
export type Lang = (typeof LANGS)[number];

export type Content = {
  [K in keyof typeof tables]: z.infer<(typeof tables)[K]>[];
} & { strings: Record<Lang, Record<string, string>> };
