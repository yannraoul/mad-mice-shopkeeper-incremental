<script lang="ts">
  import type { MapView } from '../view/map.ts';
  import { dispatch } from './game.svelte.ts';

  let { view }: { view: MapView | null } = $props();
</script>

{#if view}
  <section class="frame small">
    <h3>{view.title}</h3>
    <!-- The hex-flower picture (256 x 176); each place has a pin on its hex: open, for sale, or still unknown. -->
    <div class="map">
      <img src="{import.meta.env.BASE_URL}art/scenes/map.png" alt="" width="256" height="176" />
      {#each view.places as p (p.id)}
        {#if p.pin}
          <span class="pin" class:open={p.open} class:sale={!p.open && !!p.buy} style:left="{p.pin.x}%" style:top="{p.pin.y}%" title={p.text}>{p.open ? '★' : p.buy ? '+' : '?'}</span>
        {/if}
      {/each}
    </div>
    <div class="places">
      {#each view.places as p (p.id)}
        <span class="place" class:locked={!p.open && !p.buy}>{p.text}{#if p.income} <span class="muted small">· {p.income}</span>{/if}
          {#if p.buy}<button class="btn sm" disabled={!p.buy.enabled} onclick={() => dispatch(p.buy!.action)}>{p.buy.label}</button>{/if}</span>
      {/each}
    </div>
  </section>
{/if}

<style>
  .frame { display: flex; flex-direction: column; gap: 10px; }
  .map { position: relative; width: 100%; max-width: 384px; align-self: center; aspect-ratio: 256 / 176; }
  .map img { display: block; width: 100%; height: 100%; image-rendering: pixelated; }
  .pin {
    position: absolute; transform: translate(-50%, -50%); display: grid; place-items: center; width: 14px; height: 14px; border-radius: 50%;
    background: #3a2a1d; border: 1.5px solid var(--line); color: var(--muted); font: 700 8px/1 var(--body);
  }
  .pin.open { background: var(--accent); border-color: #fff7e0; color: #2b1c0e; }
  .pin.sale { border: 2px dashed var(--accent); color: var(--accent); }
  .places { display: flex; gap: 8px; flex-wrap: wrap; }
  .place {
    min-height: 36px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid var(--accent);
    color: var(--accent);
    display: inline-flex;
    align-items: center;
    font-size: 14px;
  }
  .place { gap: 8px; }
  .place.locked { border: 1px dashed var(--line); color: var(--muted); }
</style>
