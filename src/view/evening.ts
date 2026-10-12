import type { Content } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import { step } from '../engine/engine.ts';
import { journalKey } from '../engine/journal.ts';
import type { Action, State } from '../engine/types.ts';
import { buildErrandsView, type ErrandsView } from './errands.ts';
import { buildMapView, type MapView } from './map.ts';
import { describeFail } from './text.ts';

export interface TreeNode {
  id: string;
  name: string;
  description: string;
  /** "Level 1 / 3" for repeatable nodes, "Owned" for owned unlocks, else empty. */
  level: string;
  owned: boolean;
  maxed: boolean;
  /** Shown instead of the buy button when maxed ("Maximum level" for repeatable nodes). */
  maxedText: string;
  /** Presentation state of the card: owned (one-time unlock), maxed (top level), affordable, short of coins, or locked. */
  state: 'owned' | 'maxed' | 'afford' | 'short' | 'locked';
  /** "Can afford", "Locked", "Owned", "Maxed" or empty for the corner label. */
  stateLabel: string;
  /** Level pips for repeatable nodes (null for one-time unlocks). */
  pips: { level: number; max: number } | null;
  /** "Requires X first." for locked nodes. */
  lockReason: string | null;
  /** "Short by 12 coins" for nodes that are not locked but unaffordable. */
  shortBy: string | null;
  /** The buy button, absent once maxed. `enabled`/`why` come from the engine's own refusal. */
  buy: { label: string; cost: number; action: Action; enabled: boolean; why: string | null } | null;
}

export interface TreeBranch {
  id: string;
  name: string;
  /** A small symbol standing for the branch. */
  glyph: string;
  /** "2 can afford" for tab labels. */
  affordText: string;
  nodes: TreeNode[];
}

export interface EveningView {
  report: {
    title: string;
    lines: string[];
    /** The same numbers as big figures with captions; `highlight` marks the coins earned. */
    stats: { value: number; label: string; highlight: boolean }[];
  };
  journal: { title: string; dayLine: string; text: string } | null;
  tree: { title: string; branches: TreeBranch[] };
  map: MapView | null;
  errands: ErrandsView | null;
}

const BRANCHES = ['kitchen', 'shop', 'temple'] as const;
const STATE_LABEL: Record<TreeNode['state'], string> = {
  afford: 'tree.state.afford',
  locked: 'tree.state.locked',
  owned: 'tree.owned',
  maxed: 'tree.state.maxed',
  short: '',
};
const GLYPHS: Record<(typeof BRANCHES)[number], string> = { kitchen: '♨', shop: '⌂', temple: '☾' };

export function buildEveningView(c: Content, s: State, t: Translate): EveningView {
  const r = s.report;
  const journal = journalKey(c, s);
  const node = (n: Content['skillNodes'][number]): TreeNode => {
    const level = s.nodes[n.id] ?? 0;
    const max = n.costs.length;
    const maxed = level >= max;
    // The engine decides what can be bought: dry-run the purchase and read its refusal.
    const action: Action = { type: 'buy', node: n.id };
    const probe = maxed ? null : step(c, s, action);
    const cost = n.costs[level] ?? 0;
    const buyable = probe?.ok ?? false;
    const locked = !maxed && !probe!.ok && probe!.code === 'node-locked';
    const state: TreeNode['state'] = maxed ? (max > 1 ? 'maxed' : 'owned') : locked ? 'locked' : buyable ? 'afford' : 'short';
    return {
      id: n.id,
      name: t(n.nameKey),
      state,
      stateLabel: STATE_LABEL[state] ? t(STATE_LABEL[state]) : '',
      pips: max > 1 ? { level, max } : null,
      lockReason: locked ? describeFail(t, probe!.code, probe!.params) : null,
      shortBy: state === 'short' ? t('tree.shortBy', { n: Math.max(0, cost - s.money) }) : null,
      description: t(n.descKey),
      level: max > 1 ? t('tree.level', { n: level, max }) : level > 0 ? t('tree.owned') : '',
      owned: level > 0,
      maxed,
      maxedText: max > 1 ? t('tree.maxed') : '',
      buy: maxed
        ? null
        : {
            label: t('tree.buy', { cost }),
            cost,
            action,
            enabled: probe!.ok,
            why: probe!.ok ? null : describeFail(t, probe!.code, probe!.params),
          },
    };
  };
  return {
    report: {
      title: t('evening.report'),
      lines: [
        t('evening.revenue', { n: r.revenue }),
        t('evening.served', { n: r.served, auto: r.autoServed }),
        t('evening.lost', { n: r.lost }),
        t('evening.refused', { n: r.refused }),
        t('evening.contracts', { n: r.contractsDone, expired: r.contractsExpired }),
      ],
      stats: [
        { value: r.revenue, label: t('evening.k.revenue'), highlight: true },
        { value: r.served, label: t('evening.k.served', { auto: r.autoServed }), highlight: false },
        { value: r.lost, label: t('evening.k.lost'), highlight: false },
        { value: r.refused, label: t('evening.k.refused'), highlight: false },
        { value: r.contractsDone, label: t('evening.k.contractsDone'), highlight: false },
        { value: r.contractsExpired, label: t('evening.k.contractsExpired'), highlight: false },
      ],
    },
    journal: journal ? { title: t('journal.title'), dayLine: t('ui.day', { n: s.day }), text: t(journal) } : null,
    tree: {
      title: `${t('tree.title')} · ${t('ui.money', { n: s.money })}`,
      branches: BRANCHES.map((id) => {
        const nodes = c.skillNodes.filter((n) => n.branch === id).map(node);
        return {
          id,
          name: t(`branch.${id}`),
          glyph: GLYPHS[id],
          affordText: t('tree.canAffordN', { n: nodes.filter((n) => n.state === 'afford').length }),
          nodes,
        };
      }),
    },
    map: buildMapView(c, s, t),
    errands: buildErrandsView(c, s, t),
  };
}
