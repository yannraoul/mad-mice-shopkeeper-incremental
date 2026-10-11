<script lang="ts">
  import type { MapView } from '../view/map.ts';
  import ImageSlot from './ImageSlot.svelte';

  let { view }: { view: MapView | null } = $props();
</script>

{#if view}
  <section class="panel">
    <h2>{view.title}</h2>
    <ImageSlot id={view.art} />
    <div class="row places">
      {#each view.places as p (p.id)}
        <span class="chip" class:locked={!p.open}>{p.text}</span>
      {/each}
    </div>
  </section>
{/if}

<style>
  .places { margin-top: 0.5rem; gap: 0.5rem; }
  .chip { border: 1px solid var(--accent); border-radius: 999px; padding: 0.2rem 0.7rem; }
  .chip.locked { border-color: var(--line); color: var(--muted); }
</style>
