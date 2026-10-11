import type { Content } from '../content/schema.ts';
import type { State } from './types.ts';

// Read-only helpers over Content/State. No mutation here.

export const stockKey = (candy: string, quality: string) => `${candy}:${quality}`;

export function qualityRank(c: Content, quality: string): number {
  const q = c.qualities.find((x) => x.id === quality);
  if (!q) throw new Error(`unknown quality "${quality}"`);
  return q.rank;
}

export function isQualityUnlocked(c: Content, s: Pick<State, 'unlocks'>, quality: string): boolean {
  const q = c.qualities.find((x) => x.id === quality);
  return !!q && (q.unlock === undefined || s.unlocks.includes(q.unlock));
}

/** Qualities craftable right now, lowest rank first. */
export function unlockedQualities(c: Content, s: Pick<State, 'unlocks'>) {
  return c.qualities.filter((q) => isQualityUnlocked(c, s, q.id)).sort((a, b) => a.rank - b.rank);
}

export function priceOf(c: Content, candy: string, quality: string): number {
  const cd = c.candies.find((x) => x.id === candy);
  const q = c.qualities.find((x) => x.id === quality);
  if (!cd || !q) throw new Error(`unknown candy/quality "${candy}"/"${quality}"`);
  return Math.round(cd.basePrice * q.priceMult);
}

/** Total ingredients one batch of candy at this quality consumes. */
export function batchCost(c: Content, candy: string, quality: string): Record<string, number> {
  const cd = c.candies.find((x) => x.id === candy);
  const q = c.qualities.find((x) => x.id === quality);
  if (!cd || !q) throw new Error(`unknown candy/quality "${candy}"/"${quality}"`);
  const cost: Record<string, number> = {};
  for (const i of [...cd.ingredients, ...q.extraIngredients]) cost[i.ingredient] = (cost[i.ingredient] ?? 0) + i.qty;
  return cost;
}

/** Stocked qualities of `candy` with rank >= minQuality's rank, cheapest first. */
export function stockedAtLeast(c: Content, s: Pick<State, 'stock'>, candy: string, minQuality: string) {
  const min = qualityRank(c, minQuality);
  return c.qualities
    .filter((q) => q.rank >= min && (s.stock[stockKey(candy, q.id)] ?? 0) > 0)
    .sort((a, b) => a.rank - b.rank);
}
