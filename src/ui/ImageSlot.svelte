<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';

  let { id }: { id: string } = $props();
  const slot = $derived(content.artSlots.find((s) => s.id === id));
</script>

{#if slot}
  <img src={slot.file} width={slot.width} height={slot.height} alt={t(slot.altKey)} class="slot" />
{/if}

<style>
  .slot { max-width: 100%; height: auto; }
</style>
