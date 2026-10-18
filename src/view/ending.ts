import type { Content } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import type { State } from '../engine/types.ts';
import type { ActorView } from './scene.ts';
import { WORKSHOP_SCENE } from './scene.ts';

/** How many lines the ending has at most: `ending.beat.1` to `ending.beat.5`, in the optional ending pack. */
const MAX_BEATS = 5;

export interface EndingView {
  /** The title and the lines, in the pack; empty when the pack is not part of this build (the preview build has none). */
  title: string;
  beats: string[];
  /** The ending is available to watch (the campaign is completed and the pack is here). */
  available: boolean;
  /** It should play now: completed, not yet seen, and there is something to show. */
  due: boolean;
  /** The workshop with all its mice, whether or not they were hired, for the sequence to play over. */
  scene: { file: string; width: number; height: number; actors: ActorView[] } | null;
  skipLabel: string;
  continueLabel: string;
  replayLabel: string;
  /** The art slot of what is offered to Sweet Tooth. */
  offering: string;
}

/**
 * The end of the campaign as data: the lines come from the ending pack (nothing is shown, and nothing is lost, when it is
 * absent), the scene is the workshop, and `due` says whether to play it unasked. A front end plays the beats in order.
 */
export function buildEndingView(c: Content, s: State, t: Translate): EndingView {
  const strings = c.strings[t.locale];
  const beats = Array.from({ length: MAX_BEATS }, (_, i) => strings[`ending.beat.${i + 1}`]).filter((x): x is string => !!x);
  const scene = c.scenes.find((x) => x.id === WORKSHOP_SCENE);
  const available = s.completed && beats.length > 0;
  return {
    title: strings['ending.title'] ?? '',
    beats,
    available,
    due: available && !s.endingSeen,
    scene: scene
      ? {
          file: scene.file,
          width: scene.width,
          height: scene.height,
          actors: scene.actors.map((a) => {
            const sprite = c.sprites.find((x) => x.id === a.sprite)!;
            return { id: a.id, width: sprite.width, height: sprite.height, x: a.x, y: a.y, idle: sprite.actions.idle!, work: sprite.actions.work ?? sprite.actions.idle!, step: a.step, on: true };
          }),
        }
      : null,
    skipLabel: t('ending.skip'),
    continueLabel: t('ending.continue'),
    replayLabel: t('ending.replay'),
    offering: 'candy-sweet-tooth',
  };
}
