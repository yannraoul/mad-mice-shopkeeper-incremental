<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { buildErrandsView } from '../view/errands.ts';
  import { game } from './game.svelte.ts';
  import Board from './Board.svelte';
  import Craft from './Craft.svelte';
  import Errands from './Errands.svelte';

  const errands = $derived(buildErrandsView(content, game.s, t));
  // The board and the errands wait in a drawer so the workshop has the room.
  let open = $state(false);
</script>

<!-- Morning: the workshop is the screen. Today's board and the errands slide in from the right on request. -->
<Craft ondrawer={() => (open = !open)} drawerLabel={t('craft.openBoard')} />

{#if open}
  <button class="scrim" aria-label={t('craft.closeBoard')} onclick={() => (open = false)}></button>
  <aside class="drawer" aria-label={t('craft.openBoard')}>
    <button class="btn3 close" onclick={() => (open = false)}>{t('craft.closeBoard')}</button>
    <Board variant="craft" />
    <Errands view={errands} />
  </aside>
{/if}

<style>
  .scrim { position: fixed; inset: 0; z-index: 20; border: 0; background: rgba(0, 0, 0, 0.45); cursor: default; }
  .drawer {
    position: fixed; z-index: 21; top: 0; right: 0; bottom: 0; width: min(380px, 100%);
    overflow-y: auto; padding: 16px; background: var(--bg); display: flex; flex-direction: column; gap: 16px;
    box-shadow: -8px 0 24px rgba(0, 0, 0, 0.4); animation: slide 0.2s ease-out;
  }
  .close { align-self: flex-end; }
  @keyframes slide { from { transform: translateX(100%); } }
  @media (max-width: 640px) {
    .drawer { top: auto; left: 0; width: auto; max-height: 85vh; border-radius: 16px 16px 0 0; animation-name: rise; }
    @keyframes rise { from { transform: translateY(100%); } }
  }
  @media (prefers-reduced-motion: reduce) { .drawer { animation: none; } }
</style>
