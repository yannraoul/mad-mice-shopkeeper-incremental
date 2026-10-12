import type { Content } from '../content/schema.ts';
import { nextPhase } from './phases.ts';
import { pick, pickWeighted, rand, randInt } from './rng.ts';
import {
  batchCost,
  batchSize,
  isCandyUnlocked,
  isIngredientUnlocked,
  presentCustomerTypes,
  currentStage,
  isQualityUnlocked,
  modifier,
  rivalPenalty,
  sellableCandies,
  unlockedCandies,
  canAfford,
  priceOf,
  salePrice,
  qualityRank,
  stockKey,
  stockedAtLeast,
  unlockedQualities,
} from './economy.ts';
import type { Action, Customer, DayReport, Fail, FailCode, GameEvent, State, StepResult } from './types.ts';
import type { Effect } from '../content/schema.ts';

// Pure TypeScript, no UI imports. `step` never mutates its input: it clones the
// state, applies one action and returns the new state plus what happened.

export interface NewGameOptions {
  seed: number;
  /** Tree unlocks the game starts with (tests, simulator). */
  unlocks?: string[];
}

export function newGame(c: Content, opts: NewGameOptions): State {
  const s: State = {
    day: 0,
    phase: 'morning',
    rng: opts.seed | 0,
    nextId: 1,
    money: c.settings.startMoney,
    stage: { index: 0, day: 0, revenue: 0 },
    lastWeek: null,
    completed: false,
    errands: {},
    nodes: {},
    unlocks: [...(opts.unlocks ?? [])],
    stations: c.settings.startStations.map((type) => ({ type, batchesLeft: 0 })),
    supply: {},
    supplyToday: {},
    stock: {},
    forecast: '',
    contracts: [],
    delegated: [],
    batchesMade: {},
    pending: [],
    queue: [],
    report: emptyReport(0, 0, ''),
    history: [],
  };
  startDay(c, s, []);
  return s;
}

export function step(c: Content, prev: State, action: Action): StepResult {
  const s = structuredClone(prev);
  const events: GameEvent[] = [];
  const err = apply(c, s, action, events);
  return err ? { ok: false, error: err.message, code: err.code, params: err.params } : { ok: true, state: s, events };
}

// ---------------------------------------------------------------- actions

const fail = (code: FailCode, params: Fail['params'], message: string): Fail => ({ code, params, message });

function apply(c: Content, s: State, a: Action, ev: GameEvent[]): Fail | null {
  switch (a.type) {
    case 'craft':
      return craft(c, s, a, ev);
    case 'fulfill':
      return fulfill(c, s, a.contract, ev);
    case 'serve':
      return serve(c, s, a.customer, a.quality, ev);
    case 'refuse':
      return refuse(c, s, a.customer, ev);
    case 'delegate':
      return delegate(c, s, a.customerType, a.on, ev);
    case 'buy':
      return buy(c, s, a.node, ev);
    case 'acceptErrand':
      return acceptErrand(c, s, a.errand, ev);
    case 'deliverErrand':
      return deliverErrand(c, s, a.errand, ev);
    case 'endPhase':
      return endPhase(c, s, ev);
  }
}

function craft(c: Content, s: State, a: Extract<Action, { type: 'craft' }>, ev: GameEvent[]): Fail | null {
  if (s.phase !== 'morning') return fail('wrong-phase', { phase: 'morning' }, 'crafting is only possible in the morning');
  const station = s.stations[a.station];
  if (!station) return fail('no-station', {}, `no station #${a.station}`);
  const type = c.stations.find((x) => x.id === station.type)!;
  if (type.auto) return fail('station-automated', {}, 'this station runs by itself');
  if (!c.candies.some((x) => x.id === a.candy)) return fail('unknown-candy', { candy: a.candy }, `unknown candy "${a.candy}"`);
  if (!c.qualities.some((x) => x.id === a.quality)) return fail('unknown-quality', { quality: a.quality }, `unknown quality "${a.quality}"`);
  if (!isCandyUnlocked(c, s, a.candy)) return fail('candy-locked', { candy: a.candy }, `candy "${a.candy}" is locked`);
  if (!isQualityUnlocked(c, s, a.quality)) return fail('quality-locked', { quality: a.quality }, `quality "${a.quality}" is locked`);
  if (station.batchesLeft <= 0) return fail('no-batches', {}, 'station has no batches left today');
  const cost = batchCost(c, a.candy, a.quality);
  for (const [ing, qty] of Object.entries(cost))
    if ((s.supply[ing] ?? 0) < qty)
      return fail('not-enough-ingredient', { ingredient: ing, need: String(qty), have: String(s.supply[ing] ?? 0) }, `not enough ${ing}`);

  for (const [ing, qty] of Object.entries(cost)) s.supply[ing] = (s.supply[ing] ?? 0) - qty;
  station.batchesLeft -= 1;
  s.batchesMade[a.candy] = (s.batchesMade[a.candy] ?? 0) + 1;
  const key = stockKey(a.candy, a.quality);
  const qty = batchSize(c, s, station.type);
  s.stock[key] = (s.stock[key] ?? 0) + qty;
  s.report.crafted += qty;
  ev.push({ type: 'crafted', candy: a.candy, quality: a.quality, qty });
  return null;
}

function fulfill(c: Content, s: State, contractId: number, ev: GameEvent[]): Fail | null {
  if (s.phase === 'evening') return fail('wrong-phase', { phase: 'morning' }, 'contracts are delivered in the morning or afternoon');
  const idx = s.contracts.findIndex((x) => x.id === contractId);
  if (idx < 0) return fail('no-contract', {}, `no contract #${contractId}`);
  const ct = s.contracts[idx]!;
  let need = ct.qty;
  const available = stockedAtLeast(c, s, ct.candy, ct.quality);
  if (available.reduce((n, q) => n + s.stock[stockKey(ct.candy, q.id)]!, 0) < need) return fail('not-enough-stock', {}, 'not enough stock');
  for (const q of available) {
    const key = stockKey(ct.candy, q.id);
    const take = Math.min(need, s.stock[key]!);
    s.stock[key]! -= take;
    need -= take;
    if (need === 0) break;
  }
  s.contracts.splice(idx, 1);
  s.money += ct.reward;
  s.report.revenue += ct.reward;
  s.report.contractsDone += 1;
  ev.push({ type: 'contractDone', contract: ct.id, reward: ct.reward });
  return null;
}

function serve(c: Content, s: State, customerId: number, quality: string, ev: GameEvent[]): Fail | null {
  if (s.phase !== 'afternoon') return fail('wrong-phase', { phase: 'afternoon' }, 'serving is only possible in the afternoon');
  const idx = s.queue.findIndex((x) => x.id === customerId);
  if (idx < 0) return fail('no-customer', {}, `customer #${customerId} is not at the counter`);
  const cu = s.queue[idx]!;
  if (!c.qualities.some((x) => x.id === quality)) return fail('unknown-quality', { quality }, `unknown quality "${quality}"`);
  if (qualityRank(c, quality) < qualityRank(c, cu.minQuality)) return fail('quality-too-low', {}, 'quality too low for this customer');
  const key = stockKey(cu.wants, quality);
  if ((s.stock[key] ?? 0) < 1) return fail('not-in-stock', {}, 'not in stock');
  if (!canAfford(c, cu)) return fail('over-budget', {}, 'over this customer budget');
  const price = salePrice(c, cu, quality);

  s.stock[key]! -= 1;
  s.money += price;
  s.report.revenue += price;
  s.report.served += 1;
  ev.push({ type: 'sold', customer: cu.id, customerType: cu.type, candy: cu.wants, quality, price, auto: false });
  removeFromQueue(c, s, idx, ev);
  return null;
}

function refuse(c: Content, s: State, customerId: number, ev: GameEvent[]): Fail | null {
  if (s.phase !== 'afternoon') return fail('wrong-phase', { phase: 'afternoon' }, 'refusing is only possible in the afternoon');
  const idx = s.queue.findIndex((x) => x.id === customerId);
  if (idx < 0) return fail('no-customer', {}, `customer #${customerId} is not at the counter`);
  s.report.refused += 1;
  ev.push({ type: 'refused', customer: customerId, customerType: s.queue[idx]!.type });
  removeFromQueue(c, s, idx, ev);
  return null;
}

/** One customer is done: everyone still waiting loses 1 patience, then the counter refills. */
function removeFromQueue(c: Content, s: State, idx: number, ev: GameEvent[]) {
  s.queue.splice(idx, 1);
  for (const cu of s.queue) cu.patience -= 1;
  const stay: Customer[] = [];
  for (const cu of s.queue) {
    if (cu.patience <= 0) {
      s.report.lost += 1;
      ev.push({ type: 'left', customer: cu.id, customerType: cu.type });
    } else stay.push(cu);
  }
  s.queue = stay;
  settle(c, s, ev);
}

function refill(c: Content, s: State) {
  const space = c.settings.counterSpace + modifier(c, s, 'counterSpace');
  while (s.queue.length < space && s.pending.length > 0) s.queue.push(s.pending.shift()!);
}

/** Fill the counter, let workers sell to the customer types handed to them, repeat until stable. */
function settle(c: Content, s: State, ev: GameEvent[]) {
  for (;;) {
    refill(c, s);
    let sold = false;
    for (let i = 0; i < s.queue.length && !sold; i++) {
      const quality = workerChoice(c, s, s.queue[i]!);
      if (quality) {
        sellByWorker(c, s, i, quality, ev);
        sold = true;
      }
    }
    if (!sold) return;
  }
}

/** Worker sale: cheapest stocked quality that satisfies the customer, only for trained recipes. */
function workerChoice(c: Content, s: State, cu: Customer): string | null {
  if (!s.delegated.includes(cu.type)) return null;
  if (workerAway(c, s, cu.type)) return null;
  if ((s.batchesMade[cu.wants] ?? 0) < c.settings.delegateAfterBatches) return null;
  if (!canAfford(c, cu)) return null;
  const fit = stockedAtLeast(c, s, cu.wants, cu.minQuality)[0]; // cheapest quality that satisfies them
  return fit ? fit.id : null;
}

/** Unlike a player action, a worker serving does not make the other customers wait longer. */
function sellByWorker(c: Content, s: State, idx: number, quality: string, ev: GameEvent[]) {
  const cu = s.queue.splice(idx, 1)[0]!;
  const price = salePrice(c, cu, quality);
  s.stock[stockKey(cu.wants, quality)]! -= 1;
  s.money += price;
  s.report.revenue += price;
  s.report.served += 1;
  s.report.autoServed += 1;
  ev.push({ type: 'sold', customer: cu.id, customerType: cu.type, candy: cu.wants, quality, price, auto: true });
}

/** Spend money on a skill tree node (evening only). Unlock and station effects apply at level 1. */
function buy(c: Content, s: State, nodeId: string, ev: GameEvent[]): Fail | null {
  if (s.phase !== 'evening') return fail('wrong-phase', { phase: 'evening' }, 'upgrades are bought in the evening');
  const node = c.skillNodes.find((n) => n.id === nodeId);
  if (!node) return fail('unknown-node', {}, `unknown node "${nodeId}"`);
  const level = s.nodes[nodeId] ?? 0;
  if (level >= node.costs.length) return fail('node-maxed', {}, `"${nodeId}" is at its maximum level`);
  const missing = node.requires.find((r) => (s.nodes[r] ?? 0) < 1);
  if (missing) return fail('node-locked', { node: missing }, `"${nodeId}" requires "${missing}"`);
  const cost = node.costs[level]!;
  if (s.money < cost) return fail('not-enough-money', {}, `needs ${cost} coins`);

  s.money -= cost;
  s.nodes[nodeId] = level + 1;
  if (level === 0) applyEffects(c, s, node.effects);
  ev.push({ type: 'bought', node: nodeId, level: level + 1 });
  return null;
}

// ------------------------------------------------------- stages & errands

/** Ingredients delivered this morning: base + upgrades, minus the rival hive (never below the floor). */
function morningSupply(c: Content, s: State, ingredient: string, base: number): number {
  const raw = base + modifier(c, s, `supply:${ingredient}`);
  const penalty = rivalPenalty(c, s, ingredient);
  return penalty > 0 ? Math.max(Math.min(raw, c.settings.rivalMinSupply), raw - penalty) : raw;
}

/**
 * The morning delivery. Only unlocked ingredients arrive. Once an alternate is unlocked, each delivered unit of
 * its base ingredient has a chance to arrive as the alternate instead, so alternates trickle in without ever being guaranteed.
 */
function deliverSupply(c: Content, s: State): Record<string, number> {
  const supply: Record<string, number> = {};
  for (const i of c.ingredients) {
    if (i.alternateOf || !isIngredientUnlocked(c, s, i.id)) continue;
    supply[i.id] = morningSupply(c, s, i.id, i.dailySupply);
  }
  for (const alt of c.ingredients) {
    if (!alt.alternateOf || !isIngredientUnlocked(c, s, alt.id)) continue;
    const chance = Math.min(1, alt.chance + modifier(c, s, `altChance:${alt.id}`));
    let n = 0;
    for (let k = 0; k < (supply[alt.alternateOf] ?? 0); k++) if (rand(s) < chance) n++;
    supply[alt.id] = n;
    supply[alt.alternateOf] = (supply[alt.alternateOf] ?? 0) - n;
  }
  return supply;
}

/** End of a played day: count it toward the week; on the last day of the week, judge the target. */
function closeDay(c: Content, s: State, ev: GameEvent[]) {
  const stage = currentStage(c, s);
  s.stage.revenue += s.report.revenue;
  s.stage.day += 1;
  if (s.stage.day < stage.days) return;
  const passed = s.stage.revenue >= stage.target;
  const result = { stage: s.stage.index, passed, revenue: s.stage.revenue, target: stage.target };
  s.lastWeek = result;
  ev.push({ type: 'weekEnded', ...result });
  // No fail state: a missed week simply repeats the same stage; everything bought is kept.
  if (passed) {
    if (s.stage.index + 1 < c.stages.length) s.stage.index += 1;
    else s.completed = true;
  }
  s.stage.day = 0;
  s.stage.revenue = 0;
}

function applyEffects(c: Content, s: State, effects: Effect[]) {
  for (const e of effects) {
    if (e.type === 'unlock' && !s.unlocks.includes(e.id)) s.unlocks.push(e.id);
    if (e.type === 'addStation')
      s.stations.push({ type: e.station, batchesLeft: c.stations.find((x) => x.id === e.station)!.batchesPerDay });
  }
}

function errandAvailable(c: Content, s: State, e: Content['errands'][number]): boolean {
  return s.stage.index >= e.minStage && e.requires.every((u) => s.unlocks.includes(u));
}

/** A worker on a mission cannot sell to customers meanwhile. */
function workerAway(c: Content, s: State, customerType: string): boolean {
  const worker = c.workers.find((w) => s.unlocks.includes(w.unlock) && w.serves.includes(customerType));
  return (
    !!worker && c.errands.some((e) => e.mission?.worker === worker.id && s.errands[e.id]?.status === 'active')
  );
}

function acceptErrand(c: Content, s: State, id: string, ev: GameEvent[]): Fail | null {
  const e = c.errands.find((x) => x.id === id);
  if (!e) return fail('unknown-errand', {}, `unknown errand "${id}"`);
  if (s.errands[id]) return fail('errand-taken', {}, `errand "${id}" was already taken`);
  if (!errandAvailable(c, s, e)) return fail('errand-unavailable', {}, `errand "${id}" is not available yet`);
  s.errands[id] = e.kind === 'mission' ? { status: 'active', daysLeft: e.mission!.days } : { status: 'active' };
  applyEffects(c, s, e.onAccept);
  ev.push({ type: 'errandAccepted', errand: id });
  return null;
}

function deliverErrand(c: Content, s: State, id: string, ev: GameEvent[]): Fail | null {
  if (s.phase === 'evening') return fail('wrong-phase', { phase: 'morning' }, 'errands are delivered in the morning or afternoon');
  const e = c.errands.find((x) => x.id === id);
  if (!e) return fail('unknown-errand', {}, `unknown errand "${id}"`);
  if (e.kind !== 'deliver' || s.errands[id]?.status !== 'active')
    return fail('errand-not-active', {}, `errand "${id}" is not a delivery under way`);
  // All rows must be satisfiable before anything is taken.
  const probe = structuredClone(s);
  for (const d of e.deliver) if (!takeStock(c, probe, d.candy, d.quality, d.qty)) return fail('not-enough-stock', {}, 'not enough stock');
  for (const d of e.deliver) takeStock(c, s, d.candy, d.quality, d.qty);
  completeErrand(c, s, e.id, ev);
  return null;
}

/** Remove `qty` candies of at least `minQuality` (cheapest qualities first); false if there are not enough. */
function takeStock(c: Content, s: State, candy: string, minQuality: string, qty: number): boolean {
  const available = stockedAtLeast(c, s, candy, minQuality);
  if (available.reduce((n, q) => n + s.stock[stockKey(candy, q.id)]!, 0) < qty) return false;
  let need = qty;
  for (const q of available) {
    const key = stockKey(candy, q.id);
    const take = Math.min(need, s.stock[key]!);
    s.stock[key]! -= take;
    need -= take;
    if (need === 0) break;
  }
  return true;
}

function completeErrand(c: Content, s: State, id: string, ev: GameEvent[]) {
  const e = c.errands.find((x) => x.id === id)!;
  s.errands[id] = { status: 'done' };
  applyEffects(c, s, e.reward);
  ev.push({ type: 'errandDone', errand: id });
}

/** A new day: missions get one day closer; finished ones pay out. */
function progressMissions(c: Content, s: State, ev: GameEvent[]) {
  for (const e of c.errands) {
    const st = s.errands[e.id];
    if (e.kind !== 'mission' || st?.status !== 'active') continue;
    st.daysLeft = (st.daysLeft ?? 1) - 1;
    if (st.daysLeft <= 0) completeErrand(c, s, e.id, ev);
  }
}

/** Automated stations make their candy at the start of the day, before the player acts. */
function runAutoStations(c: Content, s: State, ev: GameEvent[]) {
  for (const st of s.stations) {
    const type = c.stations.find((x) => x.id === st.type)!;
    if (!type.auto) continue;
    const { candy, quality } = type.auto;
    const cost = batchCost(c, candy, quality);
    while (st.batchesLeft > 0 && Object.entries(cost).every(([ing, qty]) => (s.supply[ing] ?? 0) >= qty)) {
      for (const [ing, qty] of Object.entries(cost)) s.supply[ing] = (s.supply[ing] ?? 0) - qty;
      st.batchesLeft -= 1;
      const qty = batchSize(c, s, st.type);
      const key = stockKey(candy, quality);
      s.stock[key] = (s.stock[key] ?? 0) + qty;
      s.report.crafted += qty;
      ev.push({ type: 'crafted', candy, quality, qty });
    }
  }
}

function delegate(c: Content, s: State, customerType: string, on: boolean, ev: GameEvent[]): Fail | null {
  const worker = c.workers.find((w) => s.unlocks.includes(w.unlock) && w.serves.includes(customerType));
  if (!worker) return fail('cannot-delegate', { customerType }, `nobody can serve "${customerType}" customers`);
  s.delegated = s.delegated.filter((t) => t !== customerType);
  if (on) s.delegated.push(customerType);
  ev.push({ type: 'delegated', customerType, on });
  if (s.phase === 'afternoon') settle(c, s, ev);
  return null;
}

// ------------------------------------------------------------ day cycle

function endPhase(c: Content, s: State, ev: GameEvent[]): Fail | null {
  const { phase, newDay } = nextPhase(s.phase);
  if (s.phase === 'morning') {
    spawnCustomers(c, s, ev);
  } else if (s.phase === 'afternoon') {
    const left = s.queue.length + s.pending.length;
    s.report.lost += left;
    for (const cu of [...s.queue, ...s.pending]) ev.push({ type: 'left', customer: cu.id, customerType: cu.type });
    s.queue = [];
    s.pending = [];
  }
  if (newDay) {
    s.history.push(s.report);
    closeDay(c, s, ev);
    startDay(c, s, ev);
  } else {
    s.phase = phase;
    ev.push({ type: 'phase', phase, day: s.day });
  }
  return null;
}

function emptyReport(day: number, stage: number, forecast: string): DayReport {
  return {
    day,
    stage,
    forecast,
    crafted: 0,
    arrivals: 0,
    served: 0,
    autoServed: 0,
    refused: 0,
    lost: 0,
    contractsDone: 0,
    contractsExpired: 0,
    revenue: 0,
  };
}

function startDay(c: Content, s: State, ev: GameEvent[]) {
  s.day += 1;
  s.phase = 'morning';
  s.forecast = pick(s, c.forecasts).id;
  s.report = emptyReport(s.day, s.stage.index, s.forecast);
  progressMissions(c, s, ev);
  s.supply = deliverSupply(c, s);
  s.supplyToday = { ...s.supply };
  for (const st of s.stations) st.batchesLeft = c.stations.find((x) => x.id === st.type)!.batchesPerDay;
  runAutoStations(c, s, ev);

  s.contracts = s.contracts.filter((ct) => {
    if (ct.deadlineDay >= s.day) return true;
    s.report.contractsExpired += 1;
    ev.push({ type: 'contractExpired', contract: ct.id });
    return false;
  });
  if (s.unlocks.includes('contractBoard') && rand(s) < c.settings.contractChance) postContract(c, s, ev);
  ev.push({ type: 'phase', phase: 'morning', day: s.day });
}

function postContract(c: Content, s: State, ev: GameEvent[]) {
  const [qMin, qMax] = c.settings.contractQty;
  const [dMin, dMax] = c.settings.contractDeadlineDays;
  const candy = pick(s, sellableCandies(c, s));
  const quality = pick(s, unlockedQualities(c, s).filter((q) => !q.alternates));
  const qty = randInt(s, qMin, qMax);
  const contract = {
    id: s.nextId++,
    candy: candy.id,
    quality: quality.id,
    qty,
    deadlineDay: s.day + randInt(s, dMin, dMax),
    reward: Math.round(priceOf(c, candy.id, quality.id) * qty * c.settings.contractMult),
  };
  s.contracts.push(contract);
  ev.push({ type: 'contractPosted', contract: contract.id });
}

/** The real afternoon: the forecast shifts the odds, it does not fix the outcome. */
function spawnCustomers(c: Content, s: State, ev: GameEvent[]) {
  const fc = c.forecasts.find((f) => f.id === s.forecast)!;
  const spread = 1 + c.settings.arrivalNoise * (rand(s) * 2 - 1);
  const wanted = Math.max(0, Math.round((c.settings.baseArrivals + modifier(c, s, 'arrivals')) * currentStage(c, s).arrivalsMult * fc.arrivalsMult * spread));
  // The shop can only welcome so many people a day: counter space is what lets later stages pay off.
  const count = Math.min(wanted, (c.settings.counterSpace + modifier(c, s, 'counterSpace')) * c.settings.customersPerSpace);
  // Customer types that need a quality the shop cannot make yet do not show up.
  const types = presentCustomerTypes(c, s).filter((t) => isQualityUnlocked(c, s, t.minQuality));
  const regular = sellableCandies(c, s);
  const special = unlockedCandies(c, s);
  const patienceBonus = modifier(c, s, 'patience');
  let arrived = 0;
  for (let i = 0; i < count; i++) {
    const t = pickWeighted(s, types, (x) => Math.max(0.1, x.weight + modifier(c, s, `weight:${x.id}`)) * (fc.weights[x.id] ?? 1));
    // Customers only ask for recipes they could afford at their minimum quality.
    const pool = t.onlyWants ? special.filter((cd) => t.onlyWants!.includes(cd.id)) : regular;
    const wanted = pool.filter((cd) => priceOf(c, cd.id, t.minQuality) <= t.budget);
    if (wanted.length === 0) continue;
    s.pending.push({
      id: s.nextId++,
      type: t.id,
      wants: pick(s, wanted).id,
      minQuality: t.minQuality,
      patience: t.patience + patienceBonus,
      budget: t.budget,
    });
    arrived++;
  }
  s.report.arrivals = arrived;
  settle(c, s, ev);
}
