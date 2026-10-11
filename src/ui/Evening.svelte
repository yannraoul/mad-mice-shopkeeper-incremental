<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { buildEveningView } from '../view/evening.ts';
  import { game, dispatch } from './game.svelte.ts';
  import Errands from './Errands.svelte';
  import MapStrip from './MapStrip.svelte';

  const v = $derived(buildEveningView(content, game.s, t));
</script>

<div class="screen">
  <section class="panel report">
    <h2>{v.report.title}</h2>
    {#each v.report.lines as line}<div>{line}</div>{/each}
  </section>

  {#if v.journal}
    <section class="panel journalbox">
      <h2>{v.journal.title}</h2>
      <p class="journal">{v.journal.text}</p>
    </section>
  {/if}

  <section class="panel tree">
    <h2>{v.tree.title}</h2>
    {#each v.tree.branches as branch (branch.id)}
      <h3>{branch.name}</h3>
      <div class="nodes">
        {#each branch.nodes as n (n.id)}
          <article class="node" class:owned={n.owned}>
            <strong>{n.name}</strong>
            <div class="muted">{n.description}</div>
            <div>{n.level}</div>
            {#if n.buy}
              {@const b = n.buy}
              <button class="primary" disabled={!b.enabled} onclick={() => dispatch(b.action)}>{b.label}</button>
              {#if b.why}<div class="muted why">{b.why}</div>{/if}
            {:else}
              <div class="muted">{n.maxedText}</div>
            {/if}
          </article>
        {/each}
      </div>
    {/each}
  </section>

  <div class="extras">
    <MapStrip view={v.map} />
    <Errands view={v.errands} />
  </div>
</div>

<style>
  .screen { display: grid; gap: var(--gap); }
  @media (min-width: 800px) {
    .screen { grid-template-columns: 20rem 1fr; grid-template-rows: repeat(3, auto) 1fr; align-items: start; }
    .report { grid-column: 1; grid-row: 1; }
    .journalbox { grid-column: 1; grid-row: 2; }
    .extras { grid-column: 1; grid-row: 3; }
    .tree { grid-column: 2; grid-row: 1 / span 4; }
  }
  .extras { display: grid; gap: var(--gap); }
  .journal { font-style: italic; margin: 0; }
  .nodes { display: grid; gap: var(--gap); grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr)); margin-bottom: var(--gap); }
  .node { border: 1px solid var(--line); border-radius: 10px; padding: 0.6rem; display: grid; gap: 0.35rem; align-content: start; }
  .node.owned { border-color: var(--accent); }
  .why { font-size: 0.85rem; }
</style>
