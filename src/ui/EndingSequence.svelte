<script lang="ts">
  import type { EndingView } from '../view/ending.ts';
  import ImageSlot from './ImageSlot.svelte';

  // The ending (placeholder look, built from what the game already has): the workshop darkens, the offering glows on the
  // cauldron, a flash, and the mice turn to candy, one line of the ending pack per beat. Click, Enter or the arrow moves on,
  // Escape or Skip leaves; the lines also advance by themselves. Everything is CSS over the workshop picture and the mice's
  // own sheets, so it needs no new art.
  let { ending, onclose }: { ending: EndingView; onclose: () => void } = $props();

  const BEAT_MS = 5500;
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let beat = $state(0);
  const last = $derived(beat >= ending.beats.length - 1);
  const base = import.meta.env.BASE_URL;

  let box = $state<HTMLDivElement>();
  let width = $state(0);
  $effect(() => {
    if (!box) return;
    const ro = new ResizeObserver(([e]) => (width = e!.contentRect.width));
    ro.observe(box);
    return () => ro.disconnect();
  });
  const scale = $derived(ending.scene && width > 0 ? width / ending.scene.width : 1);

  // The beats follow each other by themselves, slowly; the last one waits for the player.
  $effect(() => {
    if (reduced || last) return;
    const id = setTimeout(() => (beat += 1), BEAT_MS);
    return () => clearTimeout(id);
  });
  const next = () => (last ? onclose() : (beat += 1));

  let primary = $state<HTMLButtonElement>();
  $effect(() => primary?.focus());
  const onkey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onclose();
    else if (e.key === 'ArrowRight' && !last) beat += 1;
  };
</script>

<svelte:window onkeydown={onkey} />

<div class="ending" role="dialog" aria-modal="true" aria-label={ending.title} class:b0={beat === 0} class:b1={beat === 1} class:b2={beat === 2} class:b3={beat === 3} class:b4={beat >= 4}>
  <div class="stagebox" bind:this={box} style:aspect-ratio={ending.scene ? `${ending.scene.width} / ${ending.scene.height}` : '16 / 9'}>
    {#if ending.scene}
      {@const sc = ending.scene}
      <img class="bg" src="{base}{sc.file}" alt="" />
      <div class="dark"></div>
      <div class="glow" style:left="{(173 / sc.width) * 100}%" style:top="{(60 / sc.height) * 100}%"></div>
      {#each sc.actors as a (a.id)}
        <div class="mouse" style:left="{a.x * scale}px" style:top="{a.y * scale}px" style:width="{a.width * scale}px" style:height="{a.height * scale}px">
          <div
            class="sprite"
            style:background-image="url({base}{a.idle.file})"
            style:background-size="{a.idle.frames * a.width * scale}px {a.height * scale}px"
            style:--sheet="{a.idle.frames * a.width * scale}px"
            style:animation="{`sheet ${a.idle.frames / a.idle.fps}s steps(${a.idle.frames}) infinite`}"
          ></div>
          <span class="candy"><ImageSlot id={ending.offering} width={Math.max(24, a.width * scale * 0.5)} /></span>
        </div>
      {/each}
      <div class="offering" style:left="{(160 / sc.width) * 100}%" style:top="{(34 / sc.height) * 100}%">
        <ImageSlot id={ending.offering} width={Math.max(20, 22 * scale)} />
        <ImageSlot id={ending.offering} width={Math.max(20, 22 * scale)} />
        <ImageSlot id={ending.offering} width={Math.max(20, 22 * scale)} />
      </div>
      <div class="flash"></div>
    {/if}
  </div>

  <div class="words">
    <h2>{ending.title}</h2>
    {#key beat}<p class="line">{ending.beats[beat]}</p>{/key}
    <div class="controls">
      <button class="btn3 skip" onclick={onclose}>{ending.skipLabel}</button>
      <button class="btn big go" bind:this={primary} onclick={next}>{last ? ending.continueLabel : '→'}</button>
    </div>
  </div>
</div>

<style>
  .ending { position: fixed; inset: 0; z-index: 60; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; padding: 16px; background: #1a1008; color: #fff7e0; overflow-y: auto; animation: appear 0.8s ease-out; }
  @keyframes appear { from { opacity: 0; } }
  .stagebox { position: relative; width: min(100%, 960px); border-radius: 14px; overflow: hidden; box-shadow: 0 0 60px rgba(255, 210, 90, 0.18); }
  .bg { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
  .dark { position: absolute; inset: 0; background: #120a1e; opacity: 0.35; transition: opacity 2s; }
  .b1 .dark, .b2 .dark { opacity: 0.7; }
  .b3 .dark { opacity: 0.55; }
  .b4 .dark { opacity: 0.12; }

  .offering { position: absolute; display: flex; gap: 4px; opacity: 0; transform: translateY(8px); transition: opacity 1.4s, transform 1.4s; filter: drop-shadow(0 0 8px #ffd25a); }
  .b1 .offering, .b2 .offering, .b3 .offering { opacity: 1; transform: none; }
  .b3 .offering, .b4 .offering { opacity: 0; transition-duration: 0.8s; }
  .glow { position: absolute; width: 36%; aspect-ratio: 1; transform: translate(-50%, -50%) scale(0.2); border-radius: 50%; background: radial-gradient(#fff7e0, #ffd25a 35%, rgba(232, 116, 44, 0) 70%); opacity: 0; transition: opacity 1.6s, transform 2.4s; }
  .b2 .glow { opacity: 0.85; transform: translate(-50%, -50%) scale(1); animation: pulse 1.6s ease-in-out infinite; }
  .b3 .glow { opacity: 0.4; transform: translate(-50%, -50%) scale(2.2); }
  @keyframes pulse { 50% { transform: translate(-50%, -50%) scale(1.15); } }
  .flash { position: absolute; inset: 0; background: #fff7e0; opacity: 0; pointer-events: none; }
  .b3 .flash { animation: flash 2.2s ease-out; }
  @keyframes flash { 0% { opacity: 0; } 18% { opacity: 0.95; } 100% { opacity: 0; } }

  .mouse { position: absolute; }
  .sprite { position: absolute; inset: 0; image-rendering: pixelated; background-repeat: no-repeat; transition: filter 2.4s, opacity 1.6s 1.4s; }
  .candy { position: absolute; inset: 0; display: grid; place-items: center; opacity: 0; transform: scale(0.4); transition: opacity 1.6s 1.4s, transform 1.6s 1.4s; filter: drop-shadow(0 0 6px #ee8fa3); }
  .b3 .sprite, .b4 .sprite { filter: sepia(1) saturate(4) hue-rotate(-50deg) brightness(1.2); }
  .b4 .sprite { opacity: 0; }
  .b3 .candy, .b4 .candy { opacity: 1; transform: none; }
  @keyframes -global-sheet { to { background-position-x: calc(var(--sheet) * -1); } }

  .words { width: min(100%, 720px); display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
  .words h2 { font: 400 30px/1.1 var(--display); color: #ffd25a; margin: 0; }
  .line { margin: 0; min-height: 3.6em; font: italic 400 22px/1.35 var(--display); animation: appear 1.2s ease-out; }
  .controls { display: flex; gap: 12px; align-items: center; justify-content: center; margin-top: 4px; }
  .go { min-width: 64px; }
  @media (max-width: 640px) {
    .words h2 { font-size: 24px; }
    .line { font-size: 19px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .ending, .line, .dark, .offering, .glow, .sprite, .candy { transition: none; animation: none; }
    .b3 .flash { animation: none; }
    .sprite { animation: none !important; }
  }
</style>
