import type { Content } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import type { Action, State } from '../engine/types.ts';
import { automatableSteps, isStepAutomated } from '../engine/economy.ts';

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
  /** The step this mouse does, and whether a helper does it for the player right now (otherwise it only shows as a preview). */
  step: string;
  on: boolean;
}
/** An area of the scene that hands a crafting step to its helper or takes it back by hand. */
export interface ZoneView {
  step: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** "Porter mouse: helping" / "Porter mouse: by hand". */
  label: string;
  on: boolean;
  /** The mice that show while the pointer is on the zone (even if the step is by hand), if the art has one. */
  actors: string[];
  action: Action;
}
export interface SceneView {
  file: string;
  width: number;
  height: number;
  alt: string;
  /** The mice whose helper is hired; `on` ones work for the player, the others only show as a preview while their zone is hovered. */
  actors: ActorView[];
  /** Only the steps whose helper is hired. */
  zones: ZoneView[];
}

/** The scene with the mice present, as data: a front end only places and animates what it is given. */
export function buildSceneView(c: Content, s: State, t: Translate, id: string = WORKSHOP_SCENE): SceneView | null {
  const scene = c.scenes.find((x) => x.id === id);
  if (!scene) return null;
  const actors: ActorView[] = [];
  for (const a of scene.actors) {
    const sprite = c.sprites.find((x) => x.id === a.sprite)!;
    // Every mouse whose helper is hired is part of the view: `on` says whether it is working for the player now.
    if (!automatableSteps(c, s).some((x) => x.id === a.step)) continue;
    actors.push({
      step: a.step,
      on: isStepAutomated(c, s, a.step),
      id: a.id,
      width: sprite.width,
      height: sprite.height,
      x: a.x,
      y: a.y,
      idle: sprite.actions.idle!,
      work: sprite.actions.work ?? sprite.actions.idle!,
    });
  }
  const hired = automatableSteps(c, s);
  const zones: ZoneView[] = [];
  for (const z of scene.zones) {
    const row = hired.find((x) => x.id === z.step);
    if (!row) continue;
    const on = isStepAutomated(c, s, z.step);
    zones.push({
      step: z.step,
      x: z.x,
      y: z.y,
      width: z.width,
      height: z.height,
      label: t(on ? 'craft.helperOn' : 'craft.helperOff', { helper: t(row.helperKey) }),
      on,
      actors: scene.actors.filter((a) => a.step === z.step).map((a) => a.id),
      action: { type: 'setStepMode', step: z.step, auto: !on },
    });
  }
  return { file: scene.file, width: scene.width, height: scene.height, alt: t(scene.altKey), actors, zones };
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
