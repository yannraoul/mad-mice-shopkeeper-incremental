import type { Content } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import { canAfford, qualityRank, salePrice, stockKey } from '../engine/economy.ts';
import type { Action, GameEvent, State } from '../engine/types.ts';

export interface ServeOption {
  quality: string;
  label: string;
  price: number;
  enabled: boolean;
  action: Action;
}

export interface CustomerCard {
  id: number;
  type: string;
  name: string;
  /** Art slot id of the candy they want. */
  art: string;
  wants: string;
  minQuality: string;
  budget: number;
  patience: number;
  /** "At least Plain · Budget: 6 · Patience: 8" */
  details: string;
  /** One button per stocked quality that satisfies them, cheapest first. */
  options: ServeOption[];
  refuse: { label: string; action: Action };
  nothingFits: string | null;
}

export interface ClerkPanel {
  id: string;
  name: string;
  art: string;
  /** One switch per customer type this worker can take over. */
  toggles: { customerType: string; label: string; on: boolean; setOn: Action; setOff: Action }[];
  /** Per recipe: has the worker been taught it yet (by hand-crafting it)? */
  training: { candy: string; text: string; trained: boolean }[];
}

export interface ServeView {
  title: string;
  /** "At the counter: 3 / 4 · Today: 5 served, 0 lost, 25 coins" */
  summary: string;
  customers: CustomerCard[];
  nobody: string;
  /** Warning that waiting customers leave if the shop closes now. */
  closeWarning: string | null;
  workers: ClerkPanel[];
  feed: { title: string; lines: string[] } | null;
}

/** One line of the "latest events" feed. */
export function feedLine(t: Translate, e: GameEvent): string {
  switch (e.type) {
    case 'sold':
      return t(e.auto ? 'feed.sold.auto' : 'feed.sold', {
        type: t(`customer.${e.customerType}`),
        candy: t(`candy.${e.candy}`),
        quality: t(`quality.${e.quality}`),
        price: e.price,
      });
    case 'refused':
      return t('feed.refused', { type: t(`customer.${e.customerType}`) });
    case 'left':
      return t('feed.left', { type: t(`customer.${e.customerType}`) });
    default:
      return '';
  }
}

export function buildServeView(c: Content, s: State, t: Translate, feed: GameEvent[] = []): ServeView {
  const need = c.settings.delegateAfterBatches;
  const customers = s.queue.map((cu): CustomerCard => {
    const min = qualityRank(c, cu.minQuality);
    const affordable = canAfford(c, cu);
    const options = c.qualities
      .filter((q) => q.rank >= min && (s.stock[stockKey(cu.wants, q.id)] ?? 0) > 0)
      .sort((a, b) => a.rank - b.rank)
      .map((q): ServeOption => {
        const price = salePrice(c, cu, q.id);
        return {
          quality: q.id,
          label: t('serve.serve', { quality: t(q.nameKey), price }),
          price,
          enabled: affordable,
          action: { type: 'serve', customer: cu.id, quality: q.id },
        };
      });
    return {
      id: cu.id,
      type: cu.type,
      name: t(`customer.${cu.type}`),
      art: `candy-${cu.wants}`,
      wants: t('serve.wants', { candy: t(`candy.${cu.wants}`) }),
      minQuality: t('serve.minQuality', { quality: t(`quality.${cu.minQuality}`) }),
      budget: cu.budget,
      patience: cu.patience,
      details: [
        t('serve.minQuality', { quality: t(`quality.${cu.minQuality}`) }),
        t('serve.budget', { n: cu.budget }),
        t('serve.patience', { n: cu.patience }),
      ].join(' · '),
      options,
      refuse: { label: t('serve.refuse'), action: { type: 'refuse', customer: cu.id } },
      nothingFits: options.length === 0 ? t('serve.nothingFits') : null,
    };
  });

  const workers = c.workers
    .filter((w) => s.unlocks.includes(w.unlock))
    .map((w): ClerkPanel => ({
      id: w.id,
      name: t(w.nameKey),
      art: `worker-${w.id}`,
      toggles: w.serves.map((type) => ({
        customerType: type,
        label: t('clerk.handles', { type: t(`customer.${type}`) }),
        on: s.delegated.includes(type),
        setOn: { type: 'delegate', customerType: type, on: true },
        setOff: { type: 'delegate', customerType: type, on: false },
      })),
      training: c.candies.map((cd) => {
        const made = s.batchesMade[cd.id] ?? 0;
        return {
          candy: cd.id,
          trained: made >= need,
          text:
            made >= need
              ? t('clerk.trained', { candy: t(cd.nameKey) })
              : t('clerk.training', { candy: t(cd.nameKey), n: made, need }),
        };
      }),
    }));

  return {
    title: t('serve.title'),
    summary: [
      t('serve.waiting', { n: s.queue.length, max: c.settings.counterSpace }),
      t('serve.today', { served: s.report.served, lost: s.report.lost, revenue: s.report.revenue }),
    ].join(' · '),
    customers,
    nobody: t('serve.nobody'),
    closeWarning: s.queue.length > 0 ? t('serve.closeWarning', { n: s.queue.length }) : null,
    workers,
    feed: feed.length > 0 ? { title: t('feed.title'), lines: feed.map((e) => feedLine(t, e)) } : null,
  };
}
