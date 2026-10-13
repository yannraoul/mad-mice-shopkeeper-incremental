import type { Content } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import type { Action, State } from '../engine/types.ts';
import { openPlaces, questReached } from '../engine/economy.ts';

export interface MapView {
  title: string;
  /** Art slot id of the strip image. */
  art: string;
  places: {
    id: string;
    open: boolean;
    text: string;
    income: string;
    /** For sale: open it with coins (in the evening). */
    buy: { label: string; enabled: boolean; action: Action } | null;
  }[];
}

/** The map strip, or null until the player has bought it. Places not yet reached read "Unknown place". */
export function buildMapView(c: Content, s: State, t: Translate): MapView | null {
  if (!s.unlocks.includes('map')) return null;
  const open = openPlaces(c, s);
  return {
    title: t('map.title'),
    art: 'map-strip',
    places: c.places.map((p) => {
      const isOpen = open.some((x) => x.id === p.id);
      const forSale = !isOpen && p.cost > 0 && questReached(s, p.quest);
      return {
        id: p.id,
        open: isOpen,
        text: isOpen || forSale ? t(p.nameKey) : `🔒 ${t('map.locked')}`,
        income: (isOpen || forSale) && p.income > 0 ? t('map.income', { n: p.income }) : '',
        buy: forSale ? { label: t('map.buy', { n: p.cost }), enabled: s.phase === 'evening' && s.money >= p.cost, action: { type: 'buyPlace', place: p.id } } : null,
      };
    }),
  };
}
