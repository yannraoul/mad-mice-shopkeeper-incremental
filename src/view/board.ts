import { isQualityUnlocked, stockedAtLeast, stockKey, weekdayOf } from '../engine/economy.ts';
import type { Content } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import type { Action, State } from '../engine/types.ts';
import { buildErrandsView, type ErrandsView } from './errands.ts';

export interface BoardView {
  title: string;
  forecast: string;
  /** Today's special weekday (market day...): its name and what it does, or null on an ordinary day. */
  weekday: { name: string; note: string } | null;
  contractsTitle: string;
  noContracts: string;
  contracts: { id: number; text: string; deliver: { label: string; action: Action; enabled: boolean } }[];
  stockTitle: string;
  stockEmpty: string;
  stock: { key: string; count: number; candy: string; quality: string; text: string }[];
  stockLabel: string;
  /** One chip per candy in stock; `rings` is the quality rank (0 Plain, 1 Fine, 2 Perfect). */
  stockChips: { key: string; art: string; count: number; rings: number; text: string }[];
  /** Candy rows and quality columns (cheapest first): how many of each are in stock. */
  stockTable: {
    cols: { id: string; short: string; name: string }[];
    rows: { candy: string; art: string; name: string; cells: number[] }[];
  };
  ringLegend: string;
  errands: ErrandsView | null;
}

/** The shared "board": today's forecast, contracts, what is in stock, and the errands. */
export function buildBoardView(c: Content, s: State, t: Translate): BoardView {
  const forecast = c.forecasts.find((f) => f.id === s.forecast)!;
  const wd = weekdayOf(c, s);
  const nameOf = (rows: { id: string; nameKey: string }[], id: string) => t(rows.find((r) => r.id === id)!.nameKey);
  return {
    title: t('board.title'),
    forecast: t(forecast.nameKey),
    weekday: wd ? { name: t(wd.nameKey), note: t(wd.noteKey) } : null,
    contractsTitle: t('board.contracts'),
    noContracts: t('board.noContracts'),
    contracts: s.contracts.map((ct) => ({
      id: ct.id,
      text: t('board.contract', {
        qty: ct.qty,
        candy: nameOf(c.candies, ct.candy),
        quality: t('quality.orBetter', { quality: nameOf(c.qualities, ct.quality) }),
        week: Math.floor((ct.deadlineDay - 1) / 7) + 1,
        day: ((ct.deadlineDay - 1) % 7) + 1,
        reward: Math.round(ct.reward * (wd?.contractMult ?? 1)),
      }),
      deliver: {
        label: t('board.deliver'),
        action: { type: 'fulfill', contract: ct.id },
        // enough candy of that quality or better in stock
        enabled: stockedAtLeast(c, s, ct.candy, ct.quality).reduce((n, q) => n + (s.stock[stockKey(ct.candy, q.id)] ?? 0), 0) >= ct.qty,
      },
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
    stockTable: stockTable(c, s, t),
    ringLegend: t('board.ringLegend'),
    errands: buildErrandsView(c, s, t),
  };
}

/** Only candies with stock get a row; only qualities that are unlocked (or have stock) get a column. */
function stockTable(c: Content, s: State, t: Translate): BoardView['stockTable'] {
  const have = (candy: string, quality: string) => s.stock[stockKey(candy, quality)] ?? 0;
  const cols = c.qualities
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .filter((q) => isQualityUnlocked(c, s, q.id) || c.candies.some((cd) => have(cd.id, q.id) > 0));
  const rows = c.candies
    .filter((cd) => cols.some((q) => have(cd.id, q.id) > 0))
    .map((cd) => ({ candy: cd.id, art: `candy-${cd.id}`, name: t(cd.nameKey), cells: cols.map((q) => have(cd.id, q.id)) }));
  return { cols: cols.map((q) => ({ id: q.id, short: t(`quality.short.${q.id}`), name: t(q.nameKey) })), rows };
}
