<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { buildSceneView } from '../view/scene.ts';
  import { game, sceneClock } from './game.svelte.ts';

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
</script>

{#if v}
  <div class="box" bind:this={box}>
    <div class="scene" role="img" aria-label={v.alt} style:width="{v.width * scale}px" style:height="{v.height * scale}px">
      <img class="bg" src="{base}{v.file}" alt="" width={v.width * scale} height={v.height * scale} />
      {#each v.actors as a (a.id)}
        {@const act = sceneClock.working.includes(a.id) ? a.work : a.idle}
        <div
          class="actor"
          style:left="{a.x * scale}px"
          style:top="{a.y * scale}px"
          style:width="{a.width * scale}px"
          style:height="{a.height * scale}px"
          style:background-image="url({base}{act.file})"
          style:background-size="{act.frames * a.width * scale}px {a.height * scale}px"
          style:--sheet="{act.frames * a.width * scale}px"
          style:animation="{`sheet ${act.frames / act.fps}s steps(${act.frames}) ${act.loop ? 'infinite' : '1 forwards'}`}"
        ></div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .box { display: flex; justify-content: center; background: var(--scene); border-radius: 12px; overflow: hidden; }
  .scene { position: relative; image-rendering: pixelated; flex: none; }
  .bg { display: block; image-rendering: pixelated; }
  .actor { position: absolute; image-rendering: pixelated; background-repeat: no-repeat; }
  @keyframes -global-sheet { to { background-position-x: calc(var(--sheet) * -1); } }
  @media (prefers-reduced-motion: reduce) { .actor { animation: none !important; } }
</style>
