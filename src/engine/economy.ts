import type { Content } from '../content/schema.ts';
import type { State } from './types.ts';

// Read-only helpers over Content/State. No mutation here.

/** Sum of every owned node's modifier on `stat` (per level owned). */
export function modifier(c: Content, s: Pick<State, 'nodes' | 'errands'>, stat: string): number {
  let total = 0;
  // Permanent rewards of finished errands count like owned upgrades.
  for (const e of c.errands) {
    if (s.errands[e.id]?.status !== 'done') continue;
    for (const ef of e.reward) if (ef.type === 'modifier' && ef.stat === stat) total += ef.add;
  }
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

/** Customer types that can show up now (their unlock, if any, is owned). */
export const presentCustomerTypes = (c: Content, s: Pick<State, 'unlocks'>) =>
  c.customerTypes.filter((t) => t.unlock === undefined || s.unlocks.includes(t.unlock));

/** Unlocked candies somebody present would actually buy: what is worth making right now. */
export const demandedCandies = (c: Content, s: Pick<State, 'unlocks'>) =>
  unlockedCandies(c, s).filter(
    (x) => !x.exclusive || presentCustomerTypes(c, s).some((t) => t.onlyWants?.includes(x.id)),
  );

/** Recipes customers and contracts may ask for (errand-only recipes are excluded). */
export const sellableCandies = (c: Content, s: Pick<State, 'unlocks'>) =>
  unlockedCandies(c, s).filter((x) => !x.exclusive);

export const currentStage = (c: Content, s: Pick<State, 'stage'>) => c.stages[s.stage.index]!;

/** Units of `ingredient` the rival hive steals this morning (after relief from errands). */
export function rivalPenalty(c: Content, s: Pick<State, 'stage' | 'nodes' | 'errands'>, ingredient: string): number {
  const rival = currentStage(c, s).rival;
  if (!rival || rival.ingredient !== ingredient) return 0;
  // stage.day counts finished days of the week, so today is day stage.day + 1
  if (s.stage.day + 1 < rival.startsOnDay) return 0;
  return Math.max(0, rival.amount - modifier(c, s, 'rivalRelief'));
}

/** Candies one batch at this station yields (base capacity plus tree bonuses). */
export const batchSize = (c: Content, s: Pick<State, 'nodes' | 'errands'>, stationType: string) =>
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

/**
 * What a customer pays for `quality`: its price, but never more than their budget. A better quality
 * than they asked for is therefore always acceptable (they just pay at most their budget).
 */
export const salePrice = (c: Content, cu: { wants: string; budget: number }, quality: string): number =>
  Math.min(priceOf(c, cu.wants, quality), cu.budget);

/** Can this customer buy at all? They must afford the quality they asked for as a minimum. */
export const canAfford = (c: Content, cu: { wants: string; minQuality: string; budget: number }): boolean =>
  priceOf(c, cu.wants, cu.minQuality) <= cu.budget;

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
