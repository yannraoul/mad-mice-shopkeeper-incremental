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
  /** The buy button, absent once maxed. `enabled`/`why` come from the engine's own refusal. */
  buy: { label: string; cost: number; action: Action; enabled: boolean; why: string | null } | null;
}

export interface TreeBranch {
  id: string;
  name: string;
  nodes: TreeNode[];
}

export interface EveningView {
  report: { title: string; lines: string[] };
  journal: { title: string; text: string } | null;
  tree: { title: string; branches: TreeBranch[] };
  map: MapView | null;
  errands: ErrandsView | null;
}

const BRANCHES = ['kitchen', 'shop', 'temple'] as const;

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
    return {
      id: n.id,
      name: t(n.nameKey),
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
    },
    journal: journal ? { title: t('journal.title'), text: t(journal) } : null,
    tree: {
      title: `${t('tree.title')} · ${t('ui.money', { n: s.money })}`,
      branches: BRANCHES.map((id) => ({
        id,
        name: t(`branch.${id}`),
        nodes: c.skillNodes.filter((n) => n.branch === id).map(node),
      })),
    },
    map: buildMapView(c, s, t),
    errands: buildErrandsView(c, s, t),
  };
}
