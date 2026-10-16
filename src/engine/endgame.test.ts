import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { endgameGame, step } from './engine.ts';
import { parseDevOptions } from '../app/dev.ts';

const c = loadContent(readContentFiles(false));

describe('the developer end-game shop', () => {
  const s = endgameGame(c, { seed: 1 });
  it('has every quest, errand and upgrade done, and every helper', () => {
    expect(c.quests.every((q) => s.quests[q.id])).toBe(true);
    expect(c.errands.every((e) => s.errands[e.id]?.status === 'done')).toBe(true);
    expect(c.skillNodes.every((n) => s.nodes[n.id] === n.costs.length)).toBe(true);
    expect(s.completed).toBe(true);
    for (const u of ['auto-fill', 'auto-stir', 'auto-oven', 'auto-pull', 'auto-form', 'routine']) expect(s.unlocks).toContain(u);
    expect(s.stations.map((x) => x.type)).toContain('auto-cauldron');
  });
  it('has the fourth batch ready and can be played on', () => {
    expect(s.stations[0]!.batchesLeft).toBe(4);
    expect(step(c, s, { type: 'endPhase' }).ok).toBe(true);
  });
  it('is switched on by the ?endgame hook', () => {
    expect(parseDevOptions('?endgame=1')).toMatchObject({ active: true, endgame: true });
    expect(parseDevOptions('?seed=1').endgame).toBe(false);
  });
});
