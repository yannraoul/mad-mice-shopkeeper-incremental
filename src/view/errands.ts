import type { Content } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import { step } from '../engine/engine.ts';
import { stockedAtLeast, stockKey } from '../engine/economy.ts';
import type { Action, State } from '../engine/types.ts';
import { rivalErrands, unlockName } from './text.ts';

export interface ErrandItem {
  id: string;
  name: string;
  description: string;
  /** "Against the rival hive" when the errand relieves the rival, else null. */
  tag: string | null;
  /** What it asks for, one line per requirement. */
  requirements: string[];
  status: 'done' | 'mission' | 'deliver' | 'locked' | 'available';
  /** Text for the current status (done / mission countdown / missing unlocks); null otherwise. */
  statusText: string | null;
  /** Present for `available` (accept) and `deliver` (hand over the goods). */
  button: { label: string; action: Action; enabled: boolean } | null;
  /** Presentation state: `underway` (goods or mission) / `ready` (can hand over now) / `locked` / `done` / `available`. */
  tone: 'available' | 'underway' | 'ready' | 'locked' | 'done';
  /** The chip at the top right ("Under way", "Clerk away", "Ready", "Done"); null when there is none. */
  chip: string | null;
  /** Progress while under way: "In stock" 3 / 8, or "Day" 1 / 2. */
  progress: { label: string; n: number; max: number } | null;
}

export interface ErrandsView {
  title: string;
  none: string;
  items: ErrandItem[];
}

/** How many of `candy` at `quality` or better are in stock. */
const inStock = (c: Content, s: State, candy: string, quality: string) =>
  stockedAtLeast(c, s, candy, quality).reduce((n, q) => n + (s.stock[stockKey(candy, q.id)] ?? 0), 0);

/** The errands board, or null while the player has not bought it. */
export function buildErrandsView(c: Content, s: State, t: Translate): ErrandsView | null {
  if (!s.unlocks.includes('errandsBoard')) return null;
  const relieving = new Set(rivalErrands(c).map((e) => e.id));
  const items = c.errands
    .filter((e) => s.stage.index >= e.minStage || s.errands[e.id])
    .map((e): ErrandItem => {
      const state = s.errands[e.id];
      const missing = e.requires.filter((u) => !s.unlocks.includes(u));
      const base = {
        id: e.id,
        name: t(e.nameKey),
        description: t(e.descKey),
        tag: relieving.has(e.id) ? t('errands.tagRival') : null,
        requirements: [
          ...e.deliver.map((d) =>
            t('errands.deliverLine', { qty: d.qty, candy: t(`candy.${d.candy}`), quality: t(`quality.${d.quality}`) }),
          ),
          ...(e.mission
            ? [t('errands.missionReq', { worker: t(`worker.${e.mission.worker}`).toLocaleLowerCase(t.locale), n: e.mission.days })]
            : []),
        ],
      };
      const none = { chip: null, progress: null };
      if (state?.status === 'done')
        return {
          ...base,
          status: 'done',
          statusText: t('errands.rewardReceived'),
          button: null,
          tone: 'done',
          chip: t('errands.done'),
          progress: null,
        };
      if (state?.status === 'active' && e.kind === 'mission' && e.mission)
        return {
          ...base,
          status: 'mission',
          statusText: t('errands.missionLine', { worker: t(`worker.${e.mission.worker}`), n: state.daysLeft ?? 0 }),
          button: null,
          tone: 'underway',
          chip: t('errands.state.away', { worker: t(`worker.${e.mission.worker}`) }),
          progress: {
            label: t('errands.progress.day'),
            n: e.mission.days - (state.daysLeft ?? 0),
            max: e.mission.days,
          },
        };
      if (state?.status === 'active') {
        const action: Action = { type: 'deliverErrand', errand: e.id };
        const ready = step(c, s, action).ok;
        const max = e.deliver.reduce((n, d) => n + d.qty, 0);
        const have = e.deliver.reduce((n, d) => n + Math.min(d.qty, inStock(c, s, d.candy, d.quality)), 0);
        return {
          ...base,
          status: 'deliver',
          statusText: null,
          button: { label: t('errands.deliver'), action, enabled: ready },
          tone: ready ? 'ready' : 'underway',
          chip: ready ? t('errands.state.ready') : t('errands.state.underway'),
          progress: { label: t('errands.progress.stock'), n: have, max },
        };
      }
      if (missing.length > 0)
        return {
          ...base,
          status: 'locked',
          statusText: t('errands.locked', { unlock: missing.map((u) => unlockName(c, t, u)).join(', ') }),
          button: null,
          tone: 'locked',
          chip: null,
          progress: null,
        };
      const action: Action = { type: 'acceptErrand', errand: e.id };
      return {
        ...base,
        status: 'available',
        statusText: null,
        button: { label: t('errands.accept'), action, enabled: step(c, s, action).ok },
        tone: 'available',
        ...none,
      };
    });
  return { title: t('errands.title'), none: t('errands.none'), items };
}
