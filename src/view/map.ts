import type { Content } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import type { State } from '../engine/types.ts';

export interface MapView {
  title: string;
  /** Art slot id of the strip image. */
  art: string;
  places: { id: string; open: boolean; text: string }[];
}

/** The map strip, or null until the player has bought it. Locked places read "Unknown place". */
export function buildMapView(c: Content, s: State, t: Translate): MapView | null {
  if (!s.unlocks.includes('map')) return null;
  return {
    title: t('map.title'),
    art: 'map-strip',
    places: c.places.map((p) => {
      const open = (p.unlock === undefined || s.unlocks.includes(p.unlock)) && (s.stage.index >= p.minStage || s.completed);
      return { id: p.id, open, text: open ? t(p.nameKey) : `🔒 ${t('map.locked')}` };
    }),
  };
}
