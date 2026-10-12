<script lang="ts">
  import type { MapView } from '../view/map.ts';
  import { media } from './media.svelte.ts';
  import ImageSlot from './ImageSlot.svelte';

  let { view }: { view: MapView | null } = $props();
</script>

{#if view}
  <section class="frame small">
    <h3>{view.title}</h3>
    <div class="strip"><ImageSlot id={view.art} height={media.narrow ? 72 : 96} /></div>
    <div class="places">
      {#each view.places as p (p.id)}
        <span class="place" class:locked={!p.open}>{p.text}{#if p.income} <span class="muted small">· {p.income}</span>{/if}</span>
      {/each}
    </div>
  </section>
{/if}

<style>
  .frame { display: flex; flex-direction: column; gap: 10px; }
  .strip { display: flex; justify-content: center; overflow: hidden; border-radius: 12px; }
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
  .place.locked { border: 1px dashed var(--line); color: var(--muted); }
</style>
