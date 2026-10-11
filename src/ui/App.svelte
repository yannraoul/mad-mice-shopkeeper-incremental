<script lang="ts">
  import { i18n, setLang, t } from '../i18n/i18n.svelte.ts';
  import { LANGS, type Lang } from '../content/schema.ts';
  import ImageSlot from './ImageSlot.svelte';
</script>

<main>
  <h1>{t('game.title')}</h1>
  <p>{t('game.tagline')}</p>
  <ImageSlot id="shop-counter" />
  <label>
    {t('ui.language')}
    <select value={i18n.lang} onchange={(e) => setLang(e.currentTarget.value as Lang)}>
      {#each LANGS as l}<option value={l}>{l.toUpperCase()}</option>{/each}
    </select>
  </label>
</main>

<style>
  main { max-width: 40rem; margin: 0 auto; padding: 1rem; font-family: system-ui, sans-serif; }
</style>
