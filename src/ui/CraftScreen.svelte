<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { buildErrandsView } from '../view/errands.ts';
  import { game } from './game.svelte.ts';
  import { media } from './media.svelte.ts';
  import Board from './Board.svelte';
  import Craft from './Craft.svelte';
  import Errands from './Errands.svelte';

  const errands = $derived(buildErrandsView(content, game.s, t));
</script>

<!-- Morning. Desktop: workshop left, board and errands on the right. Phone: today card, workshop, errands. -->
<div class="cols">
  {#if media.narrow}<Board variant="craft" />{/if}
  <div class="main"><Craft /></div>
  <aside class="rail">
    {#if !media.narrow}<Board variant="craft" />{/if}
    <Errands view={errands} />
  </aside>
</div>

<style>
  .cols { display: flex; flex-wrap: wrap; gap: var(--gap); align-items: flex-start; }
  .cols > :global(.today) { flex: 1 1 100%; }
  .main { flex: 3 1 560px; min-width: 0; }
  .rail { flex: 1 1 280px; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
  @media (max-width: 640px) {
    .main, .rail { flex-basis: 100%; }
  }
</style>
