<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { game } from './game.svelte.ts';
  import ImageSlot from './ImageSlot.svelte';

  const s = $derived(game.s);
  const places = $derived(
    content.places.map((p) => ({
      p,
      open: (p.unlock === undefined || s.unlocks.includes(p.unlock)) && (s.stage.index >= p.minStage || s.completed),
    })),
  );
</script>

{#if s.unlocks.includes('map')}
  <section class="panel">
    <h2>{t('map.title')}</h2>
    <ImageSlot id="map-strip" />
    <div class="row places">
      {#each places as { p, open } (p.id)}
        <span class="chip" class:locked={!open}>{open ? t(p.nameKey) : `🔒 ${t('map.locked')}`}</span>
      {/each}
    </div>
  </section>
{/if}

<style>
  .places { margin-top: 0.5rem; gap: 0.5rem; }
  .chip { border: 1px solid var(--accent); border-radius: 999px; padding: 0.2rem 0.7rem; }
  .chip.locked { border-color: var(--line); color: var(--muted); }
</style>
