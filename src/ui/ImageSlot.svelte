<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';

  // `width` / `height` only scale how big the slot is drawn (the aspect ratio of the real art slot
  // is kept); the slot's own size is what the art must be delivered in.
  let { id, width, height }: { id: string; width?: number; height?: number } = $props();
  const slot = $derived(content.artSlots.find((s) => s.id === id));
  // Resolved against the app base, not the current page path, so it works from any URL.
  const src = $derived(slot ? `${import.meta.env.BASE_URL}${slot.file}` : '');
  const w = $derived(slot ? (width ?? (height ? (height * slot.width) / slot.height : slot.width)) : 0);

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
    <div class="slot missing" style:width="{w}px" style:aspect-ratio="{slot.width} / {slot.height}" role="img" aria-label={t(slot.altKey)}>
      <span>{slot.id}<br />{slot.width}×{slot.height}</span>
    </div>
  {:else}
    <img
      {src}
      width={slot.width}
      height={slot.height}
      style:aspect-ratio="{slot.width} / {slot.height}"
      style:width="{w}px"
      alt={t(slot.altKey)}
      class="slot"
      {onerror}
    />
  {/if}
{/if}

<style>
  /* The box is sized from the slot (aspect-ratio + width) so nothing moves when the file arrives. */
  .slot { display: block; max-width: 100%; height: auto; background: var(--stripeBase); border-radius: 12px; flex: none; }
  .missing {
    display: grid;
    place-items: center;
    max-width: 100%;
    background-color: var(--stripeBase);
    background-image: repeating-linear-gradient(135deg, var(--stripe) 0 8px, transparent 8px 16px);
    color: var(--slotInk);
    font: 500 10px/1.3 var(--mono);
    text-align: center;
    overflow: hidden;
  }
</style>
