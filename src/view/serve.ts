import type { Content } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import { modifier, serveChoices } from '../engine/economy.ts';
import type { Action, GameEvent, State } from '../engine/types.ts';

export interface ServeOption {
  candy: string;
  quality: string;
  /** "Candy cane · Fine · 9": what they hand over, tip included. */
  label: string;
  price: number;
  tip: number;
  /** 1 to 3. */
  hearts: number;
  /** "♥♥♡" */
  heartsText: string;
  /** "+2 tip", empty without one. */
  tipText: string;
  enabled: boolean;
  action: Action;
}

export interface CustomerCard {
  id: number;
  type: string;
  name: string;
  /** Art slot id of what they want (a candy or an ingredient); null for "a rich candy". */
  art: string | null;
  /** Art slot id of the customer's own portrait. */
  portrait: string;
  /** Short labels for the "Wants" row: "Wants" / "Candy cane" or "Something with honey" / "At least" / "Plain". */
  wantsLabel: string;
  candyName: string;
  atLeastLabel: string;
  qualityName: string;
  /** "6 coins max" */
  budgetText: string;
  /** Patience as a segmented meter: `left` of `max` segments, `tier` picks the colour. */
  patienceMeter: { left: number; max: number; tier: 'ok' | 'low' | 'urgent'; label: string };
  /** "Wants Candy cane" / "Wants something with honey". */
  wants: string;
  minQuality: string;
  budget: number;
  patience: number;
  /** "At least Plain · Budget: 6 · Patience: 8" */
  details: string;
  /** The best few stocked candies that satisfy them, most rewarding first. */
  options: ServeOption[];
  refuse: { label: string; action: Action };
  nothingFits: string | null;
}

export interface ClerkPanel {
  id: string;
  name: string;
  art: string;
  /** One switch per customer type this worker can take over. */
  toggles: { customerType: string; label: string; shortLabel: string; on: boolean; setOn: Action; setOff: Action }[];
  /** Per recipe: has the worker been taught it yet (by hand-crafting it)? */
  training: { candy: string; name: string; text: string; trained: boolean; made: number; need: number; byHand: string }[];
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
      }) + (e.tip > 0 ? ` ${t('feed.tip', { n: e.tip })}` : '');
    case 'refused':
      return t('feed.refused', { type: t(`customer.${e.customerType}`) });
    case 'left':
      return t('feed.left', { type: t(`customer.${e.customerType}`) });
    default:
      return '';
  }
}

/** The most patience a customer of this type can have today (their type's base plus upgrades). */
export function maxPatience(c: Content, s: State, type: string): number {
  return (c.customerTypes.find((x) => x.id === type)?.patience ?? 0) + modifier(c, s, 'patience');
}

/** One segment per unit of patience; at most half left is "low", one left is "urgent". */
function patienceMeter(c: Content, s: State, t: Translate, cu: { type: string; patience: number }) {
  const max = Math.max(cu.patience, maxPatience(c, s, cu.type));
  const tier = cu.patience <= 1 ? 'urgent' : cu.patience / max <= 0.5 ? 'low' : 'ok';
  return {
    left: cu.patience,
    max,
    tier,
    label: tier === 'urgent' ? t('serve.leaving') : t('serve.patienceN', { n: cu.patience }),
  } as const;
}

const MAX_OPTIONS = 4;

export function buildServeView(c: Content, s: State, t: Translate, feed: GameEvent[] = []): ServeView {
  const need = c.settings.delegateAfterBatches;
  const customers = s.queue.map((cu): CustomerCard => {
    const options = serveChoices(c, s, cu)
      .slice(0, MAX_OPTIONS)
      .map((o): ServeOption => ({
        candy: o.candy,
        quality: o.quality,
        label: t('serve.option', { candy: t(`candy.${o.candy}`), quality: t(`quality.${o.quality}`), total: o.total }),
        price: o.price,
        tip: o.tip,
        hearts: o.hearts,
        heartsText: '♥'.repeat(o.hearts) + '♡'.repeat(3 - o.hearts),
        tipText: o.tip > 0 ? t('feed.tip', { n: o.tip }) : '',
        enabled: true,
        action: { type: 'serve', customer: cu.id, candy: o.candy, quality: o.quality },
      }));
    const w = cu.want;
    const title =
      w.kind === 'candy' ? t(`candy.${w.candy}`)
      : w.kind === 'ingredient' ? t('serve.want.ingredient', { ingredient: t(`ingredient.${w.ingredient}`).toLocaleLowerCase(t.locale) })
      : t('serve.want.rich', { n: w.minIngredients });
    return {
      id: cu.id,
      type: cu.type,
      name: t(`customer.${cu.type}`),
      art: w.kind === 'candy' ? `candy-${w.candy}` : w.kind === 'ingredient' ? `ingredient-${w.ingredient}` : null,
      portrait: `customer-${cu.type}`,
      wantsLabel: t('serve.wantsLabel'),
      candyName: title,
      atLeastLabel: t('serve.atLeast'),
      qualityName: t(`quality.${cu.minQuality}`),
      budgetText: t('serve.budgetMax', { n: cu.budget }),
      patienceMeter: patienceMeter(c, s, t, cu),
      wants: t('serve.wants', { candy: title }),
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
        shortLabel: t('clerk.handlesShort', { type: t(`customer.${type}`) }),
        on: s.delegated.includes(type),
        setOn: { type: 'delegate', customerType: type, on: true },
        setOff: { type: 'delegate', customerType: type, on: false },
      })),
      training: c.candies.map((cd) => {
        const made = s.batchesMade[cd.id] ?? 0;
        return {
          candy: cd.id,
          name: t(cd.nameKey),
          made: Math.min(made, need),
          need,
          byHand: t('clerk.byHand', { n: Math.min(made, need), need }),
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
