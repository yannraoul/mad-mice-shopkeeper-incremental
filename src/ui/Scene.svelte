<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { buildSceneView } from '../view/scene.ts';
  import { game, dispatch, sceneClock } from './game.svelte.ts';

  // The pixel-art workshop with its mice. The scene is drawn at its own small size and scaled by a whole number where
  // there is room (a fraction on a phone), so the pixels stay crisp. A mouse is a CSS sprite: a strip of frames
  // stepped through by an animation. Everything it shows comes from the scene view.
  const MAX_SCALE = 3; // keeps the scene to a maximum height on a wide screen
  const v = $derived(buildSceneView(content, game.s, t));

  let box = $state<HTMLDivElement>();
  let width = $state(0);
  $effect(() => {
    if (!box) return;
    const ro = new ResizeObserver(([e]) => (width = e!.contentRect.width));
    ro.observe(box);
    return () => ro.disconnect();
  });
  const scale = $derived(v && width > 0 ? Math.min(MAX_SCALE, width / v.width >= 2 ? Math.floor(width / v.width) : width / v.width) : 1);
  const base = import.meta.env.BASE_URL;

  // The zone under the pointer or focus: it lights up and its mouse shows (as a preview if the step is by hand).
  const SPARKS = [[24, 30], [68, 22], [52, 68]]; // where the glints sit in a zone, in percent
  let hot = $state<string | null>(null);
  // Every hired mouse is on the scene: one whose step is by hand sleeps (dim) until its zone is pointed at.
  const shown = $derived(v ? v.actors : []);

  // Where to click (MMSIM-37): a bobbing arrow over each zone the player has never clicked, and a few seconds of
  // call-out (pulse and label) on a zone that has just appeared because its helper was hired. Per-browser, not saved.
  const TOUCHED_KEY = 'zonesTouched';
  const FRESH_MS = 8000;
  const readTouched = (): string[] => {
    try {
      const x = JSON.parse(localStorage.getItem(TOUCHED_KEY) ?? '[]');
      return Array.isArray(x) ? x.filter((i) => typeof i === 'string') : [];
    } catch {
      return [];
    }
  };
  let touched = $state<string[]>(readTouched());
  const touch = (step: string) => {
    if (touched.includes(step)) return;
    touched = [...touched, step];
    try {
      localStorage.setItem(TOUCHED_KEY, JSON.stringify(touched));
    } catch {
      /* private window: the arrow just comes back next time */
    }
  };
  let fresh = $state<string[]>([]);
  let known: Set<string> | null = null; // the zones already seen, so a loaded game does not call everything out
  $effect(() => {
    const steps = (v?.zones ?? []).map((z) => z.step);
    if (known === null) {
      if (v) known = new Set(steps);
      return;
    }
    for (const step of steps) {
      if (known.has(step)) continue;
      known.add(step);
      fresh = [...fresh, step];
      setTimeout(() => (fresh = fresh.filter((x) => x !== step)), FRESH_MS);
    }
  });
</script>

{#if v}
  <div class="box" bind:this={box}>
    <div class="scene" class:calm={hot === null} role="img" aria-label={v.alt} style:width="{v.width * scale}px" style:height="{v.height * scale}px">
      <img class="bg" src="{base}{v.file}" alt="" width={v.width * scale} height={v.height * scale} />
      {#each shown as a (a.id)}
        {@const act = a.on && sceneClock.working.includes(a.id) ? a.work : hot === a.step && !a.on ? a.work : a.idle}
        <div class="pop" class:ghost={!a.on && hot === a.step} class:asleep={!a.on && hot !== a.step} class:dim={a.on && sceneClock.working.length > 0 && !sceneClock.working.includes(a.id)} style:left="{a.x * scale}px" style:top="{a.y * scale}px">
          <div
            class="actor"
            style:width="{a.width * scale}px"
            style:height="{a.height * scale}px"
            style:background-image="url({base}{act.file})"
            style:background-size="{act.frames * a.width * scale}px {a.height * scale}px"
            style:--sheet="{act.frames * a.width * scale}px"
            style:animation="{`sheet ${act.frames / act.fps}s steps(${act.frames}) ${act.loop ? 'infinite' : '1 forwards'}`}"
          ></div>
        </div>
      {/each}
      {#each v.zones as z, i (z.step)}
        <button
          class="zone"
          class:on={z.on}
          class:hot={hot === z.step}
          class:fresh={fresh.includes(z.step)}
          style:left="{z.x * scale}px"
          style:top="{z.y * scale}px"
          style:width="{z.width * scale}px"
          style:height="{z.height * scale}px"
          aria-pressed={z.on}
          aria-label={z.label}
          onpointerenter={() => (hot = z.step)}
          onpointerleave={() => (hot = null)}
          onfocus={() => (hot = z.step)}
          onblur={() => (hot = null)}
          onclick={() => {
            touch(z.step);
            dispatch(z.action);
          }}
        >
          {#each SPARKS as sp, k}
            <span class="spark" style:left="{sp[0]}%" style:top="{sp[1]}%" style:--px="{scale}px" style:--d="{(i * 1.3 + k * 1.7) % 4.8}s" aria-hidden="true"></span>
          {/each}
          {#if !touched.includes(z.step)}<span class="hint" aria-hidden="true"></span>{/if}
          <span class="tag">{z.label}</span>
          <span class="dot" aria-hidden="true"></span>
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .box { display: flex; justify-content: center; background: var(--scene); border-radius: 12px; overflow: hidden; }
  .scene { position: relative; image-rendering: pixelated; flex: none; }
  .bg { display: block; image-rendering: pixelated; }
  .actor { image-rendering: pixelated; background-repeat: no-repeat; }
  .pop { position: absolute; }
  .pop.ghost { opacity: 0.75; }
  .pop.asleep { opacity: 0.5; filter: saturate(0.4); }
  /* While one mouse works, the others fade back: the eye follows the active step. */
  .pop { transition: opacity 0.3s; }
  .pop.dim { opacity: 0.3; }

  /* A zone is invisible until the pointer or focus is on it; then it shows the area and what a click does. */
  .zone {
    position: absolute;
    padding: 0;
    border: 2px dashed transparent;
    border-radius: 8px;
    background: transparent;
    color: #fff;
    cursor: pointer;
    min-height: 0;
  }
  /* Nothing hovered: a few pixel glints twinkle inside each area, like a faraway star, to say it can be pointed at. */
  .spark { position: absolute; width: var(--px); height: var(--px); background: #fff; opacity: 0; pointer-events: none; display: none;
    box-shadow: var(--px) 0 #fff, calc(var(--px) * -1) 0 #fff, 0 var(--px) #fff, 0 calc(var(--px) * -1) #fff; }
  .calm .spark { display: block; animation: glint 4.8s ease-in-out infinite; animation-delay: var(--d); }
  @keyframes glint { 0%, 70%, 100% { opacity: 0; transform: scale(0.3); } 80% { opacity: 1; transform: scale(1); } 90% { opacity: 0.5; transform: scale(0.7); } }
  .zone:hover, .zone:focus-visible, .zone.hot { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 22%, transparent); }
  .zone:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
  .tag {
    position: absolute; left: 50%; top: 4px; transform: translateX(-50%);
    padding: 2px 8px; border-radius: 999px; background: rgba(0, 0, 0, 0.75); font: 600 12px/1.3 var(--body);
    white-space: nowrap; opacity: 0; pointer-events: none;
  }
  .zone:hover .tag, .zone:focus-visible .tag, .zone.fresh .tag { opacity: 1; }
  /* "Click here": a rounded honey tile with a pointer, like the primary button, bobbing over a zone the player has never clicked. */
  .hint { position: absolute; left: 50%; top: 2px; width: 22px; height: 18px; margin-left: -11px; pointer-events: none;
    border-radius: 7px; background: var(--btn); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 3px 0 #8f5c0e;
    animation: bob 0.9s steps(2) infinite; }
  .hint::after { content: ''; position: absolute; left: 50%; bottom: -4px; width: 10px; height: 10px; margin-left: -5px; z-index: -1;
    transform: rotate(45deg); border-radius: 0 0 3px 0; background: #eba526; box-shadow: 2px 2px 0 #8f5c0e; }
  .zone:hover .hint, .zone:focus-visible .hint, .zone.hot .hint { display: none; }
  .zone.fresh .hint { top: 26px; }
  @keyframes bob { 50% { transform: translateY(6px); } }
  /* A helper just hired: the zone pulses until the call-out ends. */
  .zone.fresh { animation: pulse 1.2s ease-in-out infinite; }
  @keyframes pulse { 0%, 100% { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, transparent); }
    50% { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 30%, transparent); } }
  .dot { position: absolute; right: 4px; bottom: 4px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff; background: #a33; display: none; }
  .zone.on .dot { background: var(--ok); }
  /* A touch screen has no hover: the dot says which steps a helper does. */
  @media (hover: none) { .dot { display: block; } }
  @keyframes -global-sheet { to { background-position-x: calc(var(--sheet) * -1); } }
  @media (prefers-reduced-motion: reduce) { .actor, .pop, .spark, .hint, .zone { animation: none !important; } }
</style>
