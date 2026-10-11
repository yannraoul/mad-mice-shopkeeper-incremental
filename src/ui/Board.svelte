<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { buildBoardView } from '../view/board.ts';
  import { game, dispatch } from './game.svelte.ts';
  import Errands from './Errands.svelte';

  const v = $derived(buildBoardView(content, game.s, t));
</script>

<div class="col">
<section class="panel">
  <h2>{v.title}</h2>
  <p>{v.forecast}</p>

  <h3>{v.contractsTitle}</h3>
  {#each v.contracts as ct (ct.id)}
    <div class="row">
      <span>{ct.text}</span>
      <button onclick={() => dispatch(ct.deliver.action)}>{ct.deliver.label}</button>
    </div>
  {:else}
    <p class="muted">{v.noContracts}</p>
  {/each}

  <h3>{v.stockTitle}</h3>
  {#each v.stock as r (r.key)}
    <div>{r.text}</div>
  {:else}
    <p class="muted">{v.stockEmpty}</p>
  {/each}
</section>

<Errands view={v.errands} />
</div>

<style>
  .col { display: grid; gap: var(--gap); align-content: start; }
</style>
