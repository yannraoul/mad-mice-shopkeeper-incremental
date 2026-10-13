import type { Content } from '../content/schema.ts';
import type { Customer, State } from './types.ts';

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

export function isIngredientUnlocked(c: Content, s: Pick<State, 'unlocks'>, ingredient: string): boolean {
  const i = c.ingredients.find((x) => x.id === ingredient);
  return !!i && (i.unlock === undefined || s.unlocks.includes(i.unlock));
}

export const unlockedIngredients = (c: Content, s: Pick<State, 'unlocks'>) =>
  c.ingredients.filter((i) => isIngredientUnlocked(c, s, i.id));

/** A recipe opens by itself once every ingredient of its plain version is unlocked (plus its own gate, if any). */
export function isCandyUnlocked(c: Content, s: Pick<State, 'unlocks'>, candy: string): boolean {
  const cd = c.candies.find((x) => x.id === candy);
  return (
    !!cd &&
    (cd.unlock === undefined || s.unlocks.includes(cd.unlock)) &&
    cd.ingredients.every((i) => isIngredientUnlocked(c, s, i.ingredient))
  );
}

export const unlockedCandies = (c: Content, s: Pick<State, 'unlocks'>) =>
  c.candies.filter((x) => isCandyUnlocked(c, s, x.id));

/** Customer types that can show up now (their unlock, if any, is owned). */
export const presentCustomerTypes = (c: Content, s: Pick<State, 'unlocks'>) =>
  c.customerTypes.filter((t) => t.unlock === undefined || s.unlocks.includes(t.unlock));

export const currentStage = (c: Content, s: Pick<State, 'stage'>) => c.stages[s.stage.index]!;

/** This week's target: easy mode lowers it a little after each missed week of the same stage. */
export function stageTarget(c: Content, s: Pick<State, 'stage'>): number {
  const relief = Math.min(c.settings.retryReliefMax, s.stage.misses * c.settings.retryRelief);
  return Math.round(currentStage(c, s).target * (1 - relief));
}

/** Places on the map that are open now: their unlock is owned and their stage reached (everything is open once the game is complete). */
export const openPlaces = (c: Content, s: Pick<State, 'unlocks' | 'stage' | 'completed'>) =>
  c.places.filter((p) => (p.unlock === undefined || s.unlocks.includes(p.unlock)) && (s.stage.index >= p.minStage || s.completed));

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

/** Base ingredients a candy is made of (its plain recipe). */
export const candyIngredients = (c: Content, candy: string): string[] =>
  c.candies.find((x) => x.id === candy)?.ingredients.map((i) => i.ingredient) ?? [];

/** Does this candy at this quality satisfy what the customer asked for (and meet their minimum quality)? */
export function satisfies(c: Content, cu: Pick<Customer, 'want' | 'minQuality'>, candy: string, quality: string): boolean {
  if (qualityRank(c, quality) < qualityRank(c, cu.minQuality)) return false;
  const ings = candyIngredients(c, candy);
  switch (cu.want.kind) {
    case 'candy':
      return cu.want.candy === candy;
    case 'ingredient':
      return ings.includes(cu.want.ingredient);
    case 'rich':
      return ings.length >= cu.want.minIngredients;
  }
}

/** Can this customer buy this candy at all? Its price at their minimum quality must fit their budget. */
export const canAfford = (c: Content, cu: Pick<Customer, 'minQuality' | 'budget'>, candy: string): boolean =>
  priceOf(c, candy, cu.minQuality) <= cu.budget;

/** What a customer pays for `candy` at `quality`: its price, but never more than their budget (a tip comes on top), plus the shop's reputation bonus. */
export const salePrice = (
  c: Content,
  s: Pick<State, 'nodes' | 'errands'>,
  cu: Pick<Customer, 'budget'>,
  candy: string,
  quality: string,
): number => {
  const base = Math.min(priceOf(c, candy, quality), cu.budget);
  // Rounded up, so that on cheap candies one level of reputation is worth at least a coin.
  return Math.ceil(base * (1 + modifier(c, s, 'priceBonus') / 100) - 1e-9);
};

/**
 * How happy this candy makes the customer, 1 to 3 hearts. A specific candy: one heart at the minimum quality,
 * one more per quality above it. A craving: the units of the craved ingredient in the recipe (its rare alternate
 * counts for `alternateUnits`). A rich customer: how many ingredients the candy has.
 */
export function hearts(c: Content, cu: Pick<Customer, 'want' | 'minQuality'>, candy: string, quality: string): number {
  let n: number;
  switch (cu.want.kind) {
    case 'candy':
      n = 1 + qualityRank(c, quality) - qualityRank(c, cu.minQuality);
      break;
    case 'ingredient': {
      const craved = cu.want.ingredient;
      const cost = batchCost(c, candy, quality);
      const alt = c.ingredients.find((x) => x.alternateOf === craved);
      n = (cost[craved] ?? 0) + (alt ? (cost[alt.id] ?? 0) * c.settings.alternateUnits : 0);
      break;
    }
    case 'rich':
      n = candyIngredients(c, candy).length;
      break;
  }
  return Math.max(1, Math.min(3, n));
}

/** The tip for a sale: 0 at one heart, up to `tipMax` of the price at three. */
export const tipFor = (c: Content, price: number, hearts: number): number =>
  Math.round((price * c.settings.tipMax * (hearts - 1)) / 2);

export interface ServeChoice {
  candy: string;
  quality: string;
  price: number;
  hearts: number;
  tip: number;
  /** price + tip: what the customer hands over. */
  total: number;
}

/** Every stocked candy and quality that would serve this customer, most rewarding first (cheaper first on ties). */
export function serveChoices(c: Content, s: Pick<State, 'stock' | 'nodes' | 'errands'>, cu: Customer): ServeChoice[] {
  const out: ServeChoice[] = [];
  for (const [key, qty] of Object.entries(s.stock)) {
    if (qty < 1) continue;
    const [candy, quality] = key.split(':') as [string, string];
    if (!satisfies(c, cu, candy, quality) || !canAfford(c, cu, candy)) continue;
    const price = salePrice(c, s, cu, candy, quality);
    const h = hearts(c, cu, candy, quality);
    const tip = tipFor(c, price, h);
    out.push({ candy, quality, price, hearts: h, tip, total: price + tip });
  }
  return out.sort((a, b) => b.total - a.total || a.price - b.price);
}

/** Does a helper do this crafting step for the player (it is unlocked and the player has not taken it back)? */
export function isStepAutomated(c: Content, s: Pick<State, 'unlocks' | 'handSteps'>, stepId: string): boolean {
  const row = c.craftSteps.find((x) => x.id === stepId);
  return !!row?.automatedBy && s.unlocks.includes(row.automatedBy) && !s.handSteps.includes(stepId);
}

/** Crafting steps a helper could do for the player right now (unlocked, whether or not switched on). */
export const automatableSteps = (c: Content, s: Pick<State, 'unlocks'>) =>
  c.craftSteps.filter((x) => x.automatedBy && s.unlocks.includes(x.automatedBy));

/**
 * Total ingredients one batch of candy at this quality consumes. Fine and the like add units listed in
 * the candy's `extra`; an `alternates` quality (Perfect) keeps the plain quantities but every ingredient
 * is its rare alternate.
 */
export function batchCost(c: Content, candy: string, quality: string): Record<string, number> {
  const cd = c.candies.find((x) => x.id === candy);
  const q = c.qualities.find((x) => x.id === quality);
  if (!cd || !q) throw new Error(`unknown candy/quality "${candy}"/"${quality}"`);
  const cost: Record<string, number> = {};
  const add = (ingredient: string, qty: number) => (cost[ingredient] = (cost[ingredient] ?? 0) + qty);
  if (q.alternates) {
    for (const i of cd.ingredients) add(c.ingredients.find((x) => x.alternateOf === i.ingredient)!.id, i.qty);
  } else {
    for (const i of [...cd.ingredients, ...(cd.extra[quality] ?? [])]) add(i.ingredient, i.qty);
  }
  return cost;
}

/** Stocked qualities of `candy` with rank >= minQuality's rank, cheapest first. */
export function stockedAtLeast(c: Content, s: Pick<State, 'stock'>, candy: string, minQuality: string) {
  const min = qualityRank(c, minQuality);
  return c.qualities
    .filter((q) => q.rank >= min && (s.stock[stockKey(candy, q.id)] ?? 0) > 0)
    .sort((a, b) => a.rank - b.rank);
}
