import type { Content } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import type { Action, State } from '../engine/types.ts';
import { buildErrandsView, type ErrandsView } from './errands.ts';

export interface BoardView {
  title: string;
  forecast: string;
  contractsTitle: string;
  noContracts: string;
  contracts: { id: number; text: string; deliver: { label: string; action: Action } }[];
  stockTitle: string;
  stockEmpty: string;
  stock: { key: string; count: number; candy: string; quality: string; text: string }[];
  stockLabel: string;
  /** One chip per candy in stock; `rings` is the quality rank (0 Plain, 1 Fine, 2 Perfect). */
  stockChips: { key: string; art: string; count: number; rings: number; text: string }[];
  ringLegend: string;
  errands: ErrandsView | null;
}

/** The shared "board": today's forecast, contracts, what is in stock, and the errands. */
export function buildBoardView(c: Content, s: State, t: Translate): BoardView {
  const forecast = c.forecasts.find((f) => f.id === s.forecast)!;
  const nameOf = (rows: { id: string; nameKey: string }[], id: string) => t(rows.find((r) => r.id === id)!.nameKey);
  return {
    title: t('board.title'),
    forecast: t(forecast.nameKey),
    contractsTitle: t('board.contracts'),
    noContracts: t('board.noContracts'),
    contracts: s.contracts.map((ct) => ({
      id: ct.id,
      text: t('board.contract', {
        qty: ct.qty,
        candy: nameOf(c.candies, ct.candy),
        quality: nameOf(c.qualities, ct.quality),
        day: ct.deadlineDay,
        reward: ct.reward,
      }),
      deliver: { label: t('board.deliver'), action: { type: 'fulfill', contract: ct.id } },
    })),
    stockTitle: t('ui.stock'),
    stockEmpty: t('ui.stockEmpty'),
    stock: Object.entries(s.stock)
      .filter(([, n]) => n > 0)
      .map(([key, count]) => {
        const [candy, quality] = key.split(':') as [string, string];
        const candyName = t(`candy.${candy}`);
        const qualityName = t(`quality.${quality}`);
        return { key, count, candy: candyName, quality: qualityName, text: `${count} × ${candyName} (${qualityName})` };
      }),
    stockLabel: t('board.stockLabel'),
    stockChips: Object.entries(s.stock)
      .filter(([, n]) => n > 0)
      .map(([key, count]) => {
        const [candy, quality] = key.split(':') as [string, string];
        const rank = c.qualities.find((q) => q.id === quality)?.rank ?? 0;
        return {
          key,
          art: `candy-${candy}`,
          count,
          rings: rank,
          text: `${count} × ${t(`candy.${candy}`)} (${t(`quality.${quality}`)})`,
        };
      }),
    ringLegend: t('board.ringLegend'),
    errands: buildErrandsView(c, s, t),
  };
}
