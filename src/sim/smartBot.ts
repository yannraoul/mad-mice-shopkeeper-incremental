import type { Content } from '../content/schema.ts';
import { unlockedCandies, unlockedQualities, serveChoices, stockKey } from '../engine/economy.ts';
import { step } from '../engine/engine.ts';
import type { State } from '../engine/types.ts';
import { botErrands, must, type Bot } from './bot.ts';

// A competent player: buys upgrades in a sensible order, keeps every recipe stocked, serves the
// impatient first, and delegates what it can. It stands for "someone who has understood the game";
// the cheap bot stands for "someone who is not trying very hard". Balance should work for both.

/** Upgrades in the order a thoughtful player would want them (a node id repeats once per level). */
export const SMART_ORDER = [
  'counter-space', 'clerk', 'cauldron-size', 'oven', 'honey-yield', 'faithful',
  'errands-board', 'sunflower-patch', 'honey-yield', 'patience', 'contract-board', 'cauldron-size',
  'sunflower-yield', 'auto-cauldron', 'hive-bond', 'counter-space', 'honey-yield', 'pulling-machine',
  'cauldron-size', 'faithful', 'patience', 'sunflower-yield', 'hive-bond', 'map', 'dark-garden',
  'counter-space', 'patience', 'faithful', 'hive-bond', 'honey-yield', 'sunflower-yield',
];

const total = (s: State, candy: string) =>
  Object.entries(s.stock).reduce((n, [k, v]) => n + (k.startsWith(`${candy}:`) ? v : 0), 0);

function smartMorning(c: Content, s: State): State {
  for (const w of c.workers) {
    if (!s.unlocks.includes(w.unlock)) continue;
    for (const type of w.serves) {
      const r = step(c, s, { type: 'delegate', customerType: type, on: true });
      if (r.ok) s = r.state;
    }
  }
  s = botErrands(c, s);
  for (const ct of [...s.contracts]) {
    const r = step(c, s, { type: 'fulfill', contract: ct.id });
    if (r.ok) s = r.state;
  }
  // Fill each hand station: always craft the recipe with the least stock on hand.
  for (let i = 0; i < s.stations.length; i++) {
    if (c.stations.find((x) => x.id === s.stations[i]!.type)?.auto) continue;
    while (s.stations[i]!.batchesLeft > 0) {
      const candies = unlockedCandies(c, s).sort((a, b) => total(s, a.id) - total(s, b.id));
      const qualities = unlockedQualities(c, s).sort((a, b) => b.rank - a.rank); // best first
      let crafted = false;
      for (const candy of candies) {
        // Cheap customers (Faithful) need plain drops: keep a plain reserve before going fancy.
        const needPlain = candy.id === candies.find((x) => x.basePrice === Math.min(...candies.map((y) => y.basePrice)))?.id &&
          (s.stock[stockKey(candy.id, 'plain')] ?? 0) < 4;
        const order = needPlain ? [...qualities].reverse() : qualities;
        for (const q of order) {
          const r = step(c, s, { type: 'craft', station: i, candy: candy.id, quality: q.id });
          if (r.ok) {
            s = r.state;
            crafted = true;
            break;
          }
        }
        if (crafted) break;
      }
      if (!crafted) break; // out of ingredients
    }
  }
  return s;
}

/** Serve the impatient first (their wait is the scarcest thing), taking the best payout (tip included) for each. */
function smartAfternoon(c: Content, s: State): State {
  while (s.queue.length > 0) {
    const order = [...s.queue].sort((a, b) => a.patience - b.patience || b.budget - a.budget);
    let served = false;
    for (const cu of order) {
      const best = serveChoices(c, s, cu)[0];
      if (best) {
        s = must(c, s, { type: 'serve', customer: cu.id, candy: best.candy, quality: best.quality });
        served = true;
        break;
      }
    }
    if (!served) s = must(c, s, { type: 'refuse', customer: s.queue[0]!.id });
  }
  return s;
}

/** Buy the first upgrade in SMART_ORDER that is still wanted; wait (do not skip ahead) if too poor. */
function smartEvening(c: Content, s: State): State {
  const counts: Record<string, number> = {};
  for (const id of SMART_ORDER) {
    counts[id] = (counts[id] ?? 0) + 1;
    if ((s.nodes[id] ?? 0) >= counts[id]!) continue; // this level is already owned
    const r = step(c, s, { type: 'buy', node: id });
    if (!r.ok) {
      // Locked behind something later in the list? keep going. Too poor or maxed? stop and save up.
      if (r.code === 'node-locked' || r.code === 'node-maxed' || r.code === 'unknown-node') continue;
      return s;
    }
    s = r.state;
  }
  return s;
}

/** Serve strictly in queue order, taking the first (best paying) option the counter offers: what a casual player does. */
function casualAfternoon(c: Content, s: State): State {
  while (s.queue.length > 0) {
    const cu = s.queue[0]!;
    const best = serveChoices(c, s, cu)[0];
    s = best
      ? must(c, s, { type: 'serve', customer: cu.id, candy: best.candy, quality: best.quality })
      : must(c, s, { type: 'refuse', customer: cu.id });
  }
  return s;
}

/** An average player: plans production and purchases sensibly, but serves strictly in queue order. */
export const casualBot: Bot = { name: 'casual', morning: smartMorning, afternoon: casualAfternoon, evening: smartEvening };

export const smartBot: Bot = { name: 'smart', morning: smartMorning, afternoon: smartAfternoon, evening: smartEvening };
