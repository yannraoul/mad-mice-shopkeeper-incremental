<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';

  let { id }: { id: string } = $props();
  const slot = $derived(content.artSlots.find((s) => s.id === id));
  // Resolved against the app base, not the current page path, so it works from any URL.
  const src = $derived(slot ? `${import.meta.env.BASE_URL}${slot.file}` : '');

  let failedSrc = $state('');
  const failed = $derived(failedSrc === src);

  function onerror() {
    failedSrc = src;
    console.warn(`art slot "${id}": could not load ${new URL(src, document.baseURI).href}`);
  }
</script>

{#if slot}
  {#if failed}
    <!-- Same fixed size as the real art, so layout never shifts when the file is missing. -->
    <div class="slot missing" style:width="{slot.width}px" style:height="{slot.height}px" role="img" aria-label={t(slot.altKey)}>
      <span>{slot.id}<br />{slot.width}×{slot.height}</span>
    </div>
  {:else}
    <img
      {src}
      width={slot.width}
      height={slot.height}
      style:aspect-ratio="{slot.width} / {slot.height}"
      style:width="{slot.width}px"
      alt={t(slot.altKey)}
      class="slot"
      {onerror}
    />
  {/if}
{/if}

<style>
  /* The box is sized from the slot (aspect-ratio + width) so nothing moves when the file arrives. */
  .slot { display: block; max-width: 100%; height: auto; background: var(--line); }
  .missing {
    display: grid;
    place-items: center;
    max-width: 100%;
    border: 2px dashed var(--line);
    border-radius: 8px;
    color: var(--muted);
    font-size: 0.7rem;
    text-align: center;
    overflow: hidden;
  }
</style>
