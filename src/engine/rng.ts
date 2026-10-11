// mulberry32 over a state number kept inside the game state, so runs are reproducible.

/** Advance the generator held in `holder.rng` and return a float in [0, 1). */
export function rand(holder: { rng: number }): number {
  holder.rng = (holder.rng + 0x6d2b79f5) | 0;
  let t = holder.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Integer in [min, max] inclusive. */
export function randInt(holder: { rng: number }, min: number, max: number): number {
  return min + Math.floor(rand(holder) * (max - min + 1));
}

export function pick<T>(holder: { rng: number }, items: readonly T[]): T {
  return items[Math.floor(rand(holder) * items.length)]!;
}

/** Weighted pick; weights must be positive. */
export function pickWeighted<T>(holder: { rng: number }, items: readonly T[], weight: (t: T) => number): T {
  const total = items.reduce((s, i) => s + weight(i), 0);
  let r = rand(holder) * total;
  for (const i of items) {
    r -= weight(i);
    if (r < 0) return i;
  }
  return items[items.length - 1]!;
}
