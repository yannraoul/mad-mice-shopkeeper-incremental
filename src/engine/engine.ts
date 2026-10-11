import type { Content } from '../content/schema.ts';
import { nextPhase } from './phases.ts';
import { pick, pickWeighted, rand, randInt } from './rng.ts';
import {
  batchCost,
  isQualityUnlocked,
  priceOf,
  qualityRank,
  stockKey,
  stockedAtLeast,
  unlockedQualities,
} from './economy.ts';
import type { Action, Customer, DayReport, GameEvent, State, StepResult } from './types.ts';

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
    unlocks: [...(opts.unlocks ?? [])],
    stations: c.settings.startStations.map((type) => ({ type, batchesLeft: 0 })),
    supply: {},
    stock: {},
    forecast: '',
    contracts: [],
    pending: [],
    queue: [],
    report: emptyReport(0, ''),
    history: [],
  };
  startDay(c, s, []);
  return s;
}

export function step(c: Content, prev: State, action: Action): StepResult {
  const s = structuredClone(prev);
  const events: GameEvent[] = [];
  const err = apply(c, s, action, events);
  return err ? { ok: false, error: err } : { ok: true, state: s, events };
}

// ---------------------------------------------------------------- actions

function apply(c: Content, s: State, a: Action, ev: GameEvent[]): string | null {
  switch (a.type) {
    case 'craft':
      return craft(c, s, a, ev);
    case 'fulfill':
      return fulfill(c, s, a.contract, ev);
    case 'serve':
      return serve(c, s, a.customer, a.quality, ev);
    case 'refuse':
      return refuse(c, s, a.customer, ev);
    case 'endPhase':
      return endPhase(c, s, ev);
  }
}

function craft(c: Content, s: State, a: Extract<Action, { type: 'craft' }>, ev: GameEvent[]): string | null {
  if (s.phase !== 'morning') return 'crafting is only possible in the morning';
  const station = s.stations[a.station];
  if (!station) return `no station #${a.station}`;
  const type = c.stations.find((x) => x.id === station.type)!;
  if (!c.candies.some((x) => x.id === a.candy)) return `unknown candy "${a.candy}"`;
  if (!c.qualities.some((x) => x.id === a.quality)) return `unknown quality "${a.quality}"`;
  if (!isQualityUnlocked(c, s, a.quality)) return `quality "${a.quality}" is locked`;
  if (station.batchesLeft <= 0) return 'station has no batches left today';
  const cost = batchCost(c, a.candy, a.quality);
  for (const [ing, qty] of Object.entries(cost))
    if ((s.supply[ing] ?? 0) < qty) return `not enough ${ing}`;

  for (const [ing, qty] of Object.entries(cost)) s.supply[ing] = (s.supply[ing] ?? 0) - qty;
  station.batchesLeft -= 1;
  const key = stockKey(a.candy, a.quality);
  s.stock[key] = (s.stock[key] ?? 0) + type.capacity;
  s.report.crafted += type.capacity;
  ev.push({ type: 'crafted', candy: a.candy, quality: a.quality, qty: type.capacity });
  return null;
}

function fulfill(c: Content, s: State, contractId: number, ev: GameEvent[]): string | null {
  if (s.phase === 'evening') return 'contracts are delivered in the morning or afternoon';
  const idx = s.contracts.findIndex((x) => x.id === contractId);
  if (idx < 0) return `no contract #${contractId}`;
  const ct = s.contracts[idx]!;
  let need = ct.qty;
  const available = stockedAtLeast(c, s, ct.candy, ct.quality);
  if (available.reduce((n, q) => n + s.stock[stockKey(ct.candy, q.id)]!, 0) < need) return 'not enough stock';
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

function serve(c: Content, s: State, customerId: number, quality: string, ev: GameEvent[]): string | null {
  if (s.phase !== 'afternoon') return 'serving is only possible in the afternoon';
  const idx = s.queue.findIndex((x) => x.id === customerId);
  if (idx < 0) return `customer #${customerId} is not at the counter`;
  const cu = s.queue[idx]!;
  if (!c.qualities.some((x) => x.id === quality)) return `unknown quality "${quality}"`;
  if (qualityRank(c, quality) < qualityRank(c, cu.minQuality)) return 'quality too low for this customer';
  const key = stockKey(cu.wants, quality);
  if ((s.stock[key] ?? 0) < 1) return 'not in stock';
  const price = priceOf(c, cu.wants, quality);
  if (price > cu.budget) return 'over this customer budget';

  s.stock[key]! -= 1;
  s.money += price;
  s.report.revenue += price;
  s.report.served += 1;
  ev.push({ type: 'sold', customer: cu.id, candy: cu.wants, quality, price });
  removeFromQueue(c, s, idx, ev);
  return null;
}

function refuse(c: Content, s: State, customerId: number, ev: GameEvent[]): string | null {
  if (s.phase !== 'afternoon') return 'refusing is only possible in the afternoon';
  const idx = s.queue.findIndex((x) => x.id === customerId);
  if (idx < 0) return `customer #${customerId} is not at the counter`;
  s.report.refused += 1;
  ev.push({ type: 'refused', customer: customerId });
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
      ev.push({ type: 'left', customer: cu.id });
    } else stay.push(cu);
  }
  s.queue = stay;
  refill(c, s);
}

function refill(c: Content, s: State) {
  while (s.queue.length < c.settings.counterSpace && s.pending.length > 0) s.queue.push(s.pending.shift()!);
}

// ------------------------------------------------------------ day cycle

function endPhase(c: Content, s: State, ev: GameEvent[]): string | null {
  const { phase, newDay } = nextPhase(s.phase);
  if (s.phase === 'morning') {
    spawnCustomers(c, s);
  } else if (s.phase === 'afternoon') {
    const left = s.queue.length + s.pending.length;
    s.report.lost += left;
    for (const cu of [...s.queue, ...s.pending]) ev.push({ type: 'left', customer: cu.id });
    s.queue = [];
    s.pending = [];
  }
  if (newDay) {
    s.history.push(s.report);
    startDay(c, s, ev);
  } else {
    s.phase = phase;
    ev.push({ type: 'phase', phase, day: s.day });
  }
  return null;
}

function emptyReport(day: number, forecast: string): DayReport {
  return {
    day,
    forecast,
    crafted: 0,
    arrivals: 0,
    served: 0,
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
  s.report = emptyReport(s.day, s.forecast);
  s.supply = Object.fromEntries(c.ingredients.map((i) => [i.id, i.dailySupply]));
  for (const st of s.stations) st.batchesLeft = c.stations.find((x) => x.id === st.type)!.batchesPerDay;

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
  const candy = pick(s, c.candies);
  const quality = pick(s, unlockedQualities(c, s));
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
function spawnCustomers(c: Content, s: State) {
  const fc = c.forecasts.find((f) => f.id === s.forecast)!;
  const spread = 1 + c.settings.arrivalNoise * (rand(s) * 2 - 1);
  const count = Math.max(0, Math.round(c.settings.baseArrivals * fc.arrivalsMult * spread));
  // Customer types that need a quality the shop cannot make yet do not show up.
  const types = c.customerTypes.filter((t) => isQualityUnlocked(c, s, t.minQuality));
  for (let i = 0; i < count; i++) {
    const t = pickWeighted(s, types, (x) => x.weight * (fc.weights[x.id] ?? 1));
    s.pending.push({
      id: s.nextId++,
      type: t.id,
      wants: pick(s, c.candies).id,
      minQuality: t.minQuality,
      patience: t.patience,
      budget: t.budget,
    });
  }
  s.report.arrivals = count;
  refill(c, s);
}
