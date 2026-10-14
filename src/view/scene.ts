import type { Content } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import type { Action, State } from '../engine/types.ts';
import { isStepAutomated } from '../engine/economy.ts';

/** The scene that sits behind the workshop. */
export const WORKSHOP_SCENE = 'workshop';

export interface SpriteActionView {
  /** Path of the horizontal strip, relative to the app base. */
  file: string;
  frames: number;
  fps: number;
  loop: boolean;
}
export interface ActorView {
  id: string;
  /** Frame size in the scene's own pixels. */
  width: number;
  height: number;
  /** Top-left corner of the frame in the scene's own pixels. */
  x: number;
  y: number;
  /** The animation to play when nothing is going on, and the one for work. */
  idle: SpriteActionView;
  work: SpriteActionView;
}
export interface SceneView {
  file: string;
  width: number;
  height: number;
  alt: string;
  /** Only the mice whose crafting step a helper does for the player (the player does the others by hand). */
  actors: ActorView[];
}

/** The scene with the mice present, as data: a front end only places and animates what it is given. */
export function buildSceneView(c: Content, s: State, t: Translate, id: string = WORKSHOP_SCENE): SceneView | null {
  const scene = c.scenes.find((x) => x.id === id);
  if (!scene) return null;
  const actors: ActorView[] = [];
  for (const a of scene.actors) {
    const sprite = c.sprites.find((x) => x.id === a.sprite)!;
    if (!isStepAutomated(c, s, a.step)) continue;
    actors.push({
      id: a.id,
      width: sprite.width,
      height: sprite.height,
      x: a.x,
      y: a.y,
      idle: sprite.actions.idle!,
      work: sprite.actions.work ?? sprite.actions.idle!,
    });
  }
  return { file: scene.file, width: scene.width, height: scene.height, alt: t(scene.altKey), actors };
}

/** One piece of a beat: a mouse of the scene works for a while. */
export interface Clip {
  actor: string;
  ms: number;
}

/**
 * What the scene plays before an action of the routine is applied: for a batch, each step's mouse works in turn
 * (fill, stir, the quality's extra steps such as the oven, then shape). Other actions have no animation.
 * Pure: the engine decides what happens, the scene only decides how long it takes to show it.
 */
export function describeBeat(c: Content, s: State, a: Action, sceneId: string = WORKSHOP_SCENE): Clip[] {
  if (a.type !== 'craft') return [];
  const scene = c.scenes.find((x) => x.id === sceneId);
  const quality = c.qualities.find((q) => q.id === a.quality);
  if (!scene || !quality) return [];
  const steps = ['fill', 'stir', ...quality.extraSteps.map((x) => x.id), 'form'];
  const clips: Clip[] = [];
  for (const step of steps) {
    const actor = scene.actors.find((x) => x.step === step);
    if (actor && isStepAutomated(c, s, step)) clips.push({ actor: actor.id, ms: c.settings.sceneStepMs });
  }
  return clips;
}
