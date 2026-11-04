import type { Content } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import type { Action, State } from '../engine/types.ts';
import { openPlaces, questReached } from '../engine/economy.ts';

export interface MapView {
  title: string;
  places: {
    id: string;
    open: boolean;
    /** Pin on the map picture, in percent of its width and height; null when the place has no spot on it. */
    pin: { x: number; y: number } | null;
    text: string;
    income: string;
    /** For sale: open it with coins (in the evening). */
    buy: { label: string; enabled: boolean; action: Action } | null;
  }[];
}

/** The map picture (`art/scenes/map.png`, a hex flower) is 256 x 176; places carry a pixel position on it. */
export const MAP_W = 256;
export const MAP_H = 176;

/** The map, or null until the player has bought it. Places not yet reached read "Unknown place". */
export function buildMapView(c: Content, s: State, t: Translate): MapView | null {
  if (!s.unlocks.includes('map')) return null;
  const open = openPlaces(c, s);
  return {
    title: t('map.title'),
    places: c.places.map((p) => {
      const isOpen = open.some((x) => x.id === p.id);
      const forSale = !isOpen && p.cost > 0 && questReached(s, p.quest);
      return {
        id: p.id,
        open: isOpen,
        pin: p.at ? { x: (p.at.x / MAP_W) * 100, y: (p.at.y / MAP_H) * 100 } : null,
        text: isOpen || forSale ? t(p.nameKey) : `🔒 ${t('map.locked')}`,
        income: (isOpen || forSale) && p.income > 0 ? t('map.income', { n: p.income }) : '',
        buy: forSale ? { label: t('map.buy', { n: p.cost }), enabled: s.phase === 'evening' && s.money >= p.cost, action: { type: 'buyPlace', place: p.id } } : null,
      };
    }),
  };
}
