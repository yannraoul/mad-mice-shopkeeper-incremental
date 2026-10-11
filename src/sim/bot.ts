import type { Content } from '../content/schema.ts';
import { batchSize, sellableCandies, stockedAtLeast, unlockedQualities, canAfford, stockKey } from '../engine/economy.ts';
import { step } from '../engine/engine.ts';
import type { Action, State } from '../engine/types.ts';

// A simple "reasonable player": the baseline the simulator measures balance with.

function must(c: Content, s: State, a: Action): State {
  const r = step(c, s, a);
  if (!r.ok) throw new Error(`bot made an illegal move ${JSON.stringify(a)}: ${r.error}`);
  return r.state;
}

/** Craft one batch by hand at the first station that can do it; null if none can. */
function craftOnce(c: Content, s: State, candy: string, quality: string): State | null {
  for (let i = 0; i < s.stations.length; i++) {
    if (c.stations.find((x) => x.id === s.stations[i]!.type)?.auto) continue;
    const r = step(c, s, { type: 'craft', station: i, candy, quality });
    if (r.ok) return r.state;
  }
  return null;
}

/** Take every errand that is available, then make and deliver what the delivery errands ask for. */
function botErrands(c: Content, s: State): State {
  for (const e of c.errands) {
    const r = step(c, s, { type: 'acceptErrand', errand: e.id });
    if (r.ok) s = r.state;
  }
  for (const e of c.errands) {
    if (e.kind !== 'deliver' || s.errands[e.id]?.status !== 'active') continue;
    for (const d of e.deliver) {
      for (;;) {
        const have = stockedAtLeast(c, s, d.candy, d.quality).reduce((n, q) => n + s.stock[stockKey(d.candy, q.id)]!, 0);
        if (have >= d.qty) break;
        const made = craftOnce(c, s, d.candy, d.quality);
        if (!made) break;
        s = made;
      }
    }
    const r = step(c, s, { type: 'deliverErrand', errand: e.id });
    if (r.ok) s = r.state;
  }
  return s;
}

/** Morning: spread batches across candies and unlocked qualities, then deliver contracts. */
export function botMorning(c: Content, s: State): State {
  // Hand over every customer type a hired worker can take.
  for (const w of c.workers) {
    if (!s.unlocks.includes(w.unlock)) continue;
    for (const type of w.serves) {
      const r = step(c, s, { type: 'delegate', customerType: type, on: true });
      if (r.ok) s = r.state;
    }
  }
  s = botErrands(c, s);
  let n = 0;
  for (let i = 0; i < s.stations.length; i++) {
    if (c.stations.find((x) => x.id === s.stations[i]!.type)?.auto) continue; // runs by itself
    while (s.stations[i]!.batchesLeft > 0) {
      const qualities = unlockedQualities(c, s);
      // Try qualities starting from a rotating index; take the first one that is affordable.
      const order = qualities.map((_, k) => qualities[(n + k) % qualities.length]!);
      const candies = sellableCandies(c, s);
      const candy = candies[n % candies.length]!;
      let crafted = false;
      for (const q of order) {
        const r = step(c, s, { type: 'craft', station: i, candy: candy.id, quality: q.id });
        if (r.ok) {
          s = r.state;
          crafted = true;
          break;
        }
      }
      n++;
      if (!crafted) break; // out of ingredients
    }
  }
  for (const ct of [...s.contracts]) {
    const r = step(c, s, { type: 'fulfill', contract: ct.id });
    if (r.ok) s = r.state;
  }
  return s;
}

/** Afternoon: serve each customer with the cheapest stocked quality that fits, else refuse. */
export function botAfternoon(c: Content, s: State): State {
  while (s.queue.length > 0) {
    const cu = s.queue[0]!;
    const fit = stockedAtLeast(c, s, cu.wants, cu.minQuality).find(
      (q) => canAfford(c, cu) && (s.stock[stockKey(cu.wants, q.id)] ?? 0) > 0,
    );
    s = fit
      ? must(c, s, { type: 'serve', customer: cu.id, quality: fit.id })
      : must(c, s, { type: 'refuse', customer: cu.id });
  }
  return s;
}

/** Evening: keep buying the cheapest upgrade that is available and affordable. */
export function botEvening(c: Content, s: State): State {
  for (;;) {
    const options = c.skillNodes
      .map((n) => ({ n, cost: n.costs[s.nodes[n.id] ?? 0] }))
      .filter((o): o is { n: typeof o.n; cost: number } => o.cost !== undefined)
      .sort((a, b) => a.cost - b.cost);
    let bought = false;
    for (const o of options) {
      const r = step(c, s, { type: 'buy', node: o.n.id });
      if (r.ok) {
        s = r.state;
        bought = true;
        break;
      }
    }
    if (!bought) return s;
  }
}

/** Play one full day (morning, afternoon, evening) and return the state at the next morning. */
export function botDay(c: Content, s: State): State {
  s = botMorning(c, s);
  s = must(c, s, { type: 'endPhase' });
  s = botAfternoon(c, s);
  s = must(c, s, { type: 'endPhase' });
  s = botEvening(c, s);
  return must(c, s, { type: 'endPhase' });
}
