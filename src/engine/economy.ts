import type { Content } from '../content/schema.ts';
import type { State } from './types.ts';

// Read-only helpers over Content/State. No mutation here.

/** Sum of every owned node's modifier on `stat` (per level owned). */
export function modifier(c: Content, s: Pick<State, 'nodes'>, stat: string): number {
  let total = 0;
  for (const n of c.skillNodes) {
    const level = s.nodes[n.id] ?? 0;
    if (level === 0) continue;
    for (const e of n.effects) if (e.type === 'modifier' && e.stat === stat) total += e.add * level;
  }
  return total;
}

export function isCandyUnlocked(c: Content, s: Pick<State, 'unlocks'>, candy: string): boolean {
  const cd = c.candies.find((x) => x.id === candy);
  return !!cd && (cd.unlock === undefined || s.unlocks.includes(cd.unlock));
}

export const unlockedCandies = (c: Content, s: Pick<State, 'unlocks'>) =>
  c.candies.filter((x) => isCandyUnlocked(c, s, x.id));

/** Candies one batch at this station yields (base capacity plus tree bonuses). */
export const batchSize = (c: Content, s: Pick<State, 'nodes'>, stationType: string) =>
  c.stations.find((x) => x.id === stationType)!.capacity + modifier(c, s, 'capacity');

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
