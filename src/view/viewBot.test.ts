import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { createTranslate } from '../i18n/core.ts';
import { GameSession } from '../app/session.ts';
import {
  buildCraftView,
  buildEveningView,
  buildHeaderView,
  buildServeView,
  craftReduce,
  initialCraftUi,
  screenFor,
  type CraftUi,
} from './index.ts';

// A player that touches the game ONLY through what a front end has: the application session, the
// view models and the craft reducer. It never calls the engine or reads the raw state to decide.
// If it can play a whole campaign start, the view layer carries everything a graphic UI would need.

const c = loadContent(readContentFiles(false));
const t = createTranslate(c.strings, 'en');

function playThroughViews(seed: number, days: number) {
  const session = new GameSession({ content: c, start: { seed } });
  let failed = 0;
  const act = (a: Parameters<GameSession['dispatch']>[0]) => {
    if (!session.dispatch(a)) failed += 1;
    return true;
  };
  let ui: CraftUi = initialCraftUi(c);
  const send = (ev: Parameters<typeof craftReduce>[3]) => {
    ui = craftReduce(c, session.state, ui, ev, (a) => {
      const ok = session.dispatch(a);
      if (!ok) failed += 1;
      return ok;
    });
  };

  const morning = () => {
    for (let guard = 0; guard < 14; guard++) {
      let v = buildCraftView(c, session.state, ui, t);
      if (v.mode !== 'idle' || !v.idle) break;
      // rotate through the recipes on offer, always at the best quality the form offers
      const candy = v.idle.candies[guard % v.idle.candies.length]!.value;
      send({ type: 'select', field: 'candy', value: candy });
      send({ type: 'select', field: 'quality', value: v.idle.qualities[v.idle.qualities.length - 1]!.value });
      v = buildCraftView(c, session.state, ui, t);
      if (!v.idle?.start.enabled) {
        send({ type: 'select', field: 'quality', value: v.idle!.qualities[0]!.value });
        v = buildCraftView(c, session.state, ui, t);
        if (!v.idle?.start.enabled) continue;
      }
      send({ type: 'start' });
      for (let i = 0; i < 40; i++) {
        const bench = buildCraftView(c, session.state, ui, t).bench;
        if (!bench) break;
        const missing = bench.contents.find((x) => x.placed < x.need);
        if (missing) {
          send({ type: 'tapShelf', ingredient: missing.ingredient });
          continue;
        }
        const next = bench.steps.find((s) => s.enabled);
        if (!next) break;
        send({ type: 'step', id: next.id });
      }
    }
  };

  const afternoon = () => {
    for (let guard = 0; guard < 80; guard++) {
      const first = buildServeView(c, session.state, t, session.feed).customers[0];
      if (!first) break;
      const offer = first.options.find((o) => o.enabled);
      act(offer ? offer.action : first.refuse.action);
    }
  };

  const evening = () => {
    for (let guard = 0; guard < 30; guard++) {
      const buyable = buildEveningView(c, session.state, t)
        .tree.branches.flatMap((b) => b.nodes)
        .filter((n) => n.buy?.enabled)
        .sort((a, b) => a.buy!.cost - b.buy!.cost)[0];
      if (!buyable) break;
      act(buyable.buy!.action);
    }
  };

  for (let d = 0; d < days; d++) {
    for (let phase = 0; phase < 3; phase++) {
      const screen = screenFor(session.state.phase);
      if (screen === 'craft') morning();
      else if (screen === 'serve') afternoon();
      else evening();
      act(buildHeaderView(c, session.state, t).endPhase.action);
    }
  }
  return { session, failed };
}

describe('a player that only uses the view layer', () => {
  it('plays two weeks without a single refused action, earns money and buys upgrades', () => {
    const { session, failed } = playThroughViews(7, 14);
    expect(failed).toBe(0);
    expect(session.state.day).toBe(15);
    const revenue = session.state.history.reduce((n, d) => n + d.revenue, 0);
    expect(revenue).toBeGreaterThan(300);
    expect(Object.keys(session.state.nodes).length).toBeGreaterThan(2);
    expect(session.state.history.every((d) => d.crafted > 0)).toBe(true);
  });
  it('is deterministic: the same seed plays out identically', () => {
    expect(playThroughViews(3, 8).session.state).toEqual(playThroughViews(3, 8).session.state);
  });
  it('works for many seeds', () => {
    for (let seed = 1; seed <= 6; seed++) expect(playThroughViews(seed, 10).failed, `seed ${seed}`).toBe(0);
  });
});
