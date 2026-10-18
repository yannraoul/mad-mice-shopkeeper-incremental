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

/** Calendar: the week (1-based) and the day of the week (1 to 7) of a day number. */
export const weekOf = (day: number) => Math.floor((day - 1) / 7) + 1;
export const dayOfWeek = (day: number) => ((day - 1) % 7) + 1;
export const DAYS_PER_WEEK = 7;
/** Today's special weekday (market day...), if the day of the week has one. */
export const weekdayOf = (c: Content, s: Pick<State, 'day'>) => c.weekdays.find((w) => w.day === dayOfWeek(s.day));

export const questDone = (s: Pick<State, 'quests'>, id: string) => s.quests[id] !== undefined;
/** The quest that is done, if the player has completed the quest this thing waits for (or it waits for none). */
export const questReached = (s: Pick<State, 'quests'>, quest: string | undefined) => quest === undefined || questDone(s, quest);

/** Coins earned in all, counting today's sales so far. */
export const earnedTotal = (s: Pick<State, 'revenueTotal' | 'report'>) => s.revenueTotal + s.report.revenue;

/** The latest done quest that sets the shop's busyness (and rival): what the shop has grown into. */
export const shopQuest = (c: Content, s: Pick<State, 'quests'>) =>
  [...c.quests].reverse().find((q) => questDone(s, q.id) && q.arrivalsMult !== undefined);
export const arrivalsMult = (c: Content, s: Pick<State, 'quests'>) => shopQuest(c, s)?.arrivalsMult ?? 1;

type GoalOf = Content['quests'][number]['goals'][number];
/** How far a goal is: `have` out of `need`. */
export function goalProgress(c: Content, s: Pick<State, 'revenueTotal' | 'report' | 'nodes' | 'day' | 'errands'>, g: GoalOf): { have: number; need: number } {
  if (g.type === 'earn') return { have: Math.min(g.amount, earnedTotal(s)), need: g.amount };
  if (g.type === 'own') return { have: Math.min(g.level, s.nodes[g.node] ?? 0), need: g.level };
  if (g.type === 'errand') return { have: s.errands?.[g.errand]?.status === 'done' ? 1 : 0, need: 1 };
  return { have: Math.min(g.day, s.day), need: g.day };
}
export const goalMet = (c: Content, s: Pick<State, 'revenueTotal' | 'report' | 'nodes' | 'day' | 'errands'>, g: GoalOf) => {
  const p = goalProgress(c, s, g);
  return p.have >= p.need;
};
/** Quests that are open now: not done, every quest they need done. */
export const openQuests = (c: Content, s: Pick<State, 'quests'>) =>
  c.quests.filter((q) => !questDone(s, q.id) && q.requires.every((r) => questDone(s, r)));

/** Places on the map that are open now: free ones once their quest is done (all of them once the game is complete), the others once bought. */
export const openPlaces = (c: Content, s: Pick<State, 'unlocks' | 'quests' | 'completed' | 'places'>) =>
  c.places.filter(
    (p) => (p.unlock === undefined || s.unlocks.includes(p.unlock)) && (p.cost > 0 ? s.places.includes(p.id) : questReached(s, p.quest) || s.completed),
  );

/** Units of `ingredient` the rival hive steals this morning (after relief from errands). */
export function rivalPenalty(c: Content, s: Pick<State, 'quests' | 'day' | 'nodes' | 'errands'>, ingredient: string): number {
  const rival = shopQuest(c, s)?.rival;
  if (!rival || rival.ingredient !== ingredient) return 0;
  if (dayOfWeek(s.day) < rival.startsOnDay) return 0;
  return Math.max(0, rival.amount - modifier(c, s, 'rivalRelief'));
}

/** How many units of an alternate the shop can keep (its base store plus upgrades). */
export const altStore = (c: Content, s: Pick<State, 'nodes' | 'errands'>, alt: { id: string; store: number }) =>
  alt.store + modifier(c, s, `store:${alt.id}`);

/** Candies one batch at this station yields (base capacity plus tree bonuses). */
export const batchSize = (c: Content, s: Pick<State, 'nodes' | 'errands'>, stationType: string, candy?: string) =>
  c.candies.find((x) => x.id === candy)?.batch ?? c.stations.find((x) => x.id === stationType)!.capacity + modifier(c, s, 'capacity');

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
/** What the shop's rating does to prices: 1 at the middle, up to plus or minus `ratingSwing` at the ends. */
export const ratingMult = (c: Content, s: Pick<State, 'rating'>): number => {
  const { ratingSwing, ratingMid, ratingRange } = c.settings;
  return 1 + ratingSwing * Math.max(-1, Math.min(1, (s.rating - ratingMid) / ratingRange));
};

export const salePrice = (
  c: Content,
  s: Pick<State, 'nodes' | 'errands' | 'rating'>,
  cu: Pick<Customer, 'budget'>,
  candy: string,
  quality: string,
): number => {
  const base = Math.min(priceOf(c, candy, quality), cu.budget);
  // Rounded up, so that on cheap candies one level of reputation is worth at least a coin.
  return Math.ceil(base * (1 + modifier(c, s, 'priceBonus') / 100) * ratingMult(c, s) - 1e-9);
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
export function serveChoices(c: Content, s: Pick<State, 'stock' | 'nodes' | 'errands' | 'rating'>, cu: Customer): ServeChoice[] {
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

/** The basic steps (fill, stir, shape) whose helper is not even hired yet: nothing can run the day until they are. */
export const routineMissingHelpers = (c: Content, s: Pick<State, 'unlocks'>): string[] =>
  ['fill', 'stir', 'form'].filter((id) => {
    const by = c.craftSteps.find((x) => x.id === id)?.automatedBy;
    return !by || !s.unlocks.includes(by);
  });

/** The basic steps (fill, stir, shape) that still need the player's hands: the routine cannot make candy while any is left. */
export const routineBlockers = (c: Content, s: Pick<State, 'unlocks' | 'handSteps'>): string[] =>
  ['fill', 'stir', 'form'].filter((id) => !isStepAutomated(c, s, id));

/** Crafting steps a helper could do for the player right now (unlocked, whether or not switched on). */
export const automatableSteps = (c: Content, s: Pick<State, 'unlocks'>) =>
  c.craftSteps.filter((x) => x.automatedBy && s.unlocks.includes(x.automatedBy));

/**
 * Total ingredients one batch of candy at this quality consumes. Fine and the like add units listed in
 * the candy's `extra`; an `alternates` quality (Perfect) is the best ordinary quality's recipe plus one unit of each of
 * the candy's `perfect` alternates.
 */
export function batchCost(c: Content, candy: string, quality: string): Record<string, number> {
  const cd = c.candies.find((x) => x.id === candy);
  const q = c.qualities.find((x) => x.id === quality);
  if (!cd || !q) throw new Error(`unknown candy/quality "${candy}"/"${quality}"`);
  const cost: Record<string, number> = {};
  const add = (ingredient: string, qty: number) => (cost[ingredient] = (cost[ingredient] ?? 0) + qty);
  if (q.alternates) {
    // The best ordinary quality's recipe, plus one unit of each alternate the candy names.
    const below = c.qualities.filter((x) => !x.alternates).sort((a, b) => b.rank - a.rank)[0]!;
    for (const i of [...cd.ingredients, ...(cd.extra[below.id] ?? [])]) add(i.ingredient, i.qty);
    for (const alt of cd.perfect) add(alt, 1);
  } else {
    for (const i of [...cd.ingredients, ...(cd.extra[quality] ?? [])]) add(i.ingredient, i.qty);
  }
  return cost;
}

/** Something somebody is asking for right now: an open contract or one row of a delivery errand under way. */
export interface Demand {
  kind: 'contract' | 'errand';
  id: number | string;
  candy: string;
  /** Minimum quality. */
  quality: string;
  qty: number;
  /** The final quest is never handed in by itself. */
  final: boolean;
}

/** Open demands, soonest deadline first (contracts), then the delivery errands. */
export function openDemands(c: Content, s: Pick<State, 'contracts' | 'errands'>): Demand[] {
  const contracts = [...s.contracts]
    .sort((a, b) => a.deadlineDay - b.deadlineDay || a.id - b.id)
    .map((x): Demand => ({ kind: 'contract', id: x.id, candy: x.candy, quality: x.quality, qty: x.qty, final: false }));
  const errands = c.errands
    .filter((e) => e.kind === 'deliver' && s.errands[e.id]?.status === 'active')
    .flatMap((e) => e.deliver.map((d): Demand => ({ kind: 'errand', id: e.id, candy: d.candy, quality: d.quality, qty: d.qty, final: !!e.final })));
  return [...contracts, ...errands];
}

/**
 * The cheapest quality at or above `minQuality` that an automatic cauldron can make: unlocked, and with no step that only
 * the player's hands can do (the whisper of a Perfect batch). Null when there is none.
 */
export function autoQuality(c: Content, s: Pick<State, 'unlocks'>, minQuality: string): string | null {
  const min = qualityRank(c, minQuality);
  const ok = c.qualities
    .filter((q) => q.rank >= min && isQualityUnlocked(c, s, q.id) && q.extraSteps.every((x) => c.craftSteps.find((r) => r.id === x.id)?.automatedBy))
    .sort((a, b) => a.rank - b.rank);
  return ok[0]?.id ?? null;
}

/** Stocked qualities of `candy` with rank >= minQuality's rank, cheapest first. */
export function stockedAtLeast(c: Content, s: Pick<State, 'stock'>, candy: string, minQuality: string) {
  const min = qualityRank(c, minQuality);
  return c.qualities
    .filter((q) => q.rank >= min && (s.stock[stockKey(candy, q.id)] ?? 0) > 0)
    .sort((a, b) => a.rank - b.rank);
}
