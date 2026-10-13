import { describe, expect, it } from 'vitest';
import { loadContent } from './load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { unlockedCandies } from '../engine/economy.ts';

// The recipe design (docs/recipes-and-ingredients-v2.md) as checks on the content, so a new ingredient or candy cannot
// quietly break the pattern: every combination of base ingredients is one candy, prices follow one formula, every
// ingredient has its rare alternate and its own way in.
const c = loadContent(readContentFiles(false));
const bases = c.ingredients.filter((i) => !i.alternateOf);
const VALUE: Record<string, number> = { honey: 5, 'sunflower-seed': 6, milk: 7, blueberry: 8 };

describe('recipes', () => {
  it('has one candy for every non-empty combination of the base ingredients', () => {
    expect(bases.map((b) => b.id).sort()).toEqual(Object.keys(VALUE).sort());
    const combos = c.candies.map((cd) => cd.ingredients.map((i) => i.ingredient).sort().join('+'));
    expect(new Set(combos).size).toBe(combos.length); // no two candies share a combination
    expect(combos).toHaveLength(2 ** bases.length - 1); // 15 for four ingredients
  });
  it('plain recipes take one unit of each ingredient', () => {
    for (const cd of c.candies) for (const i of cd.ingredients) expect(i.qty, cd.id).toBe(1);
  });
  it('prices follow the formula: ingredient values x (1 + 25% per extra ingredient), give or take a few percent', () => {
    for (const cd of c.candies) {
      const n = cd.ingredients.length;
      const formula = cd.ingredients.reduce((sum, i) => sum + VALUE[i.ingredient]!, 0) * (1 + 0.25 * (n - 1));
      expect(Math.abs(cd.basePrice - formula) / formula, cd.id).toBeLessThan(0.08);
    }
  });
  it('every base ingredient has exactly one rare alternate, and a way in through a quest or an upgrade', () => {
    for (const b of bases) {
      expect(c.ingredients.filter((i) => i.alternateOf === b.id), b.id).toHaveLength(1);
    }
    const grants = (unlock: string) =>
      c.skillNodes.some((n) => n.effects.some((e) => e.type === 'unlock' && e.id === unlock)) ||
      c.errands.some((e) => e.reward.some((r) => r.type === 'unlock' && r.id === unlock));
    for (const i of c.ingredients) if (i.unlock) expect(grants(i.unlock), i.id).toBe(true);
  });
  it('alternates open only after the magic cauldron, and the final quest needs every one of them', () => {
    const final = c.errands.find((e) => e.final)!;
    for (const alt of c.ingredients.filter((i) => i.alternateOf)) {
      expect(final.requires, alt.id).toContain(alt.unlock);
      const quest = c.errands.find((e) => e.reward.some((r) => r.type === 'unlock' && r.id === alt.unlock));
      const node = c.skillNodes.find((n) => n.effects.some((e) => e.type === 'unlock' && e.id === alt.unlock));
      const gate = quest ? quest.requires : node!.needs;
      expect(gate, alt.id).toContain('magic-cauldron');
    }
    expect(final.deliver).toEqual([{ candy: 'sweet-tooth', quality: 'perfect', qty: 3 }]);
  });
  it('opens candies as ingredients arrive: 4 with the starter ingredients unlocked step by step, all 15 at the end', () => {
    const open = (unlocks: string[]) => unlockedCandies(c, { unlocks }).length;
    expect(open([])).toBe(1); // candy cane
    expect(open(['sunflower'])).toBe(3); // brittle, nougat
    expect(open(['sunflower', 'milk'])).toBe(7); // 3 ingredients choose non-empty: 2^3 - 1
    expect(open(['sunflower', 'milk', 'blueberry'])).toBe(15);
  });
});
