import type { Content } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import { step } from '../engine/engine.ts';
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
}

export interface ErrandsView {
  title: string;
  none: string;
  items: ErrandItem[];
}

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
        requirements: e.deliver.map((d) =>
          t('errands.deliverLine', { qty: d.qty, candy: t(`candy.${d.candy}`), quality: t(`quality.${d.quality}`) }),
        ),
      };
      if (state?.status === 'done') return { ...base, status: 'done', statusText: t('errands.done'), button: null };
      if (state?.status === 'active' && e.kind === 'mission' && e.mission)
        return {
          ...base,
          status: 'mission',
          statusText: t('errands.missionLine', { worker: t(`worker.${e.mission.worker}`), n: state.daysLeft ?? 0 }),
          button: null,
        };
      if (state?.status === 'active') {
        const action: Action = { type: 'deliverErrand', errand: e.id };
        return {
          ...base,
          status: 'deliver',
          statusText: null,
          button: { label: t('errands.deliver'), action, enabled: step(c, s, action).ok },
        };
      }
      if (missing.length > 0)
        return {
          ...base,
          status: 'locked',
          statusText: t('errands.locked', { unlock: missing.map((u) => unlockName(c, t, u)).join(', ') }),
          button: null,
        };
      const action: Action = { type: 'acceptErrand', errand: e.id };
      return {
        ...base,
        status: 'available',
        statusText: null,
        button: { label: t('errands.accept'), action, enabled: step(c, s, action).ok },
      };
    });
  return { title: t('errands.title'), none: t('errands.none'), items };
}
