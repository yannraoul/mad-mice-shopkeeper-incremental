<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { buildBoardView } from '../view/board.ts';
  import { game, dispatch } from './game.svelte.ts';
  import { media } from './media.svelte.ts';
  import ImageSlot from './ImageSlot.svelte';

  // The parchment note of the day: forecast, contracts and stock. On the phone it collapses into a
  // summary card (forecast + stock chips) that expands to the full note and, while serving, the
  // latest events. `variant` only changes the desktop order (the serve rail leads with the stock).
  let {
    variant = 'craft',
    feed = null,
  }: { variant?: 'craft' | 'serve'; feed?: { title: string; lines: string[] } | null } = $props();

  const v = $derived(buildBoardView(content, game.s, t));
  let open = $state(false);
</script>

{#snippet stockTable()}
  {#if v.stockTable.rows.length === 0}
    <span class="small">{v.stockEmpty}</span>
  {:else}
    <div class="stable" style:--cols={v.stockTable.cols.length} role="table" aria-label={v.stockTitle}>
      <div class="srow head" role="row">
        <span role="columnheader"></span>
        {#each v.stockTable.cols as q (q.id)}<span class="q mono" role="columnheader" title={q.name}>{q.short}</span>{/each}
      </div>
      {#each v.stockTable.rows as r (r.candy)}
        <div class="srow" role="row">
          <span class="cname" role="rowheader"><ImageSlot id={r.art} width={22} /><span>{r.name}</span></span>
          {#each r.cells as n, i (i)}
            <span class="q mono" class:zero={n === 0} role="cell" title={v.stockTable.cols[i]!.name}>{n === 0 ? '·' : n}</span>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
{/snippet}

{#snippet contracts()}
  <div class="block">
    <span class="overline">{v.contractsTitle}</span>
    {#each v.contracts as ct (ct.id)}
      <div class="contract">
        <span>{ct.text}</span>
        <button class="btn sm" disabled={!ct.deliver.enabled} onclick={() => dispatch(ct.deliver.action)}>{ct.deliver.label}</button>
      </div>
    {:else}
      <span class="small">{v.noContracts}</span>
    {/each}
  </div>
{/snippet}

{#if media.narrow}
  <section class="note today" aria-label={v.title}>
    <button class="head" aria-expanded={open} onclick={() => (open = !open)}>
      <span class="sun" aria-hidden="true">☀</span>
      <span class="forecast">{v.weekday ? `${v.weekday.name} · ` : ''}{v.forecast}</span>
      <span class="dot" aria-hidden="true"></span>
      <span class="chev" aria-hidden="true">{open ? '▴' : '▾'}</span>
    </button>
    <div class="stockrow">
      <span class="overline">{v.stockLabel}</span>
      {#each v.stockChips as ch (ch.key)}
        <span class="schip" title={ch.text}>
          <span class="icon rings{ch.rings}"><ImageSlot id={ch.art} width={22} /></span>
          <span class="mono">{ch.count}</span>
          <span class="sr">{ch.text}</span>
        </span>
      {:else}
        <span class="small">{v.stockEmpty}</span>
      {/each}
    </div>
    {#if open}
      <div class="more">
        {@render contracts()}
        <div class="block">
          <span class="overline">{v.stockTitle}</span>
          {@render stockTable()}
          <span class="small legend">{v.ringLegend}</span>
        </div>
        {#if feed}
          <div class="block">
            <span class="overline">{feed.title}</span>
            {#each feed.lines as line, i (i)}<span class="small" class:dim={i > 0}>{line}</span>{/each}
          </div>
        {/if}
      </div>
    {/if}
  </section>
{:else}
  <section class="note board" aria-label={v.title}>
    <div class="top">
      <h3>{variant === 'craft' ? v.title : v.stockTitle}</h3>
      {#if variant === 'craft'}<span class="dot" aria-hidden="true"></span>{/if}
    </div>
    {#if variant === 'craft'}
      <div class="forecast big">{v.forecast}</div>
      {#if v.weekday}<div class="small"><strong>{v.weekday.name}</strong> {v.weekday.note}</div>{/if}
      {@render contracts()}
      <div class="block">
        <span class="overline">{v.stockTitle}</span>
        {@render stockTable()}
      </div>
    {:else}
      <div class="block">
        {@render stockTable()}
      </div>
      {@render contracts()}
    {/if}
  </section>
{/if}

<style>
  .note { display: flex; flex-direction: column; gap: 12px; }
  .board { padding: 18px 20px 20px; transform: rotate(-0.6deg); }
  .top { display: flex; justify-content: space-between; align-items: baseline; }
  .top h3 { font: 400 20px/1.2 var(--display); }
  .dot { width: 12px; height: 12px; border-radius: 50%; background: var(--warn); flex: none; }
  .forecast { font: 400 17px/1.2 var(--display); }
  .forecast.big { font-size: 17px; }
  .block { display: flex; flex-direction: column; gap: 2px; }
  .small { font-size: 14px; opacity: 0.8; }
  .small.dim { opacity: 0.6; }
  .legend { font-size: 12px; margin-top: 4px; }
  .contract { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 14px; }

  .today { padding: 12px 14px 14px; gap: 8px; transform: rotate(-0.4deg); }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
  }
  .head .forecast { flex: 1; font-size: 16px; }
  .sun { font-size: 18px; }
  .chev { font-size: 14px; }
  .stockrow { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; }
  .schip { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; }
  .icon { width: 22px; height: 22px; border-radius: 50%; overflow: hidden; display: grid; place-items: center; background: rgba(0, 0, 0, 0.12); }
  .icon :global(.slot) { border-radius: 50%; }
  .icon.rings1 { box-shadow: 0 0 0 2px var(--paper-ring, #fff5d6), 0 0 0 3.5px var(--paperInk); margin: 3px; }
  .icon.rings2 { box-shadow: 0 0 0 2px #fff5d6, 0 0 0 3.5px var(--paperInk), 0 0 0 5.5px #fff5d6, 0 0 0 7px var(--paperInk); margin: 5px; }
  .stable { display: flex; flex-direction: column; gap: 3px; font-size: 14px; }
  .srow { display: grid; grid-template-columns: minmax(0, 1fr) repeat(var(--cols), 2.4em); align-items: center; gap: 4px; }
  .srow.head { font-size: 12px; opacity: 0.7; border-bottom: 1px solid color-mix(in srgb, var(--paperInk) 30%, transparent); padding-bottom: 2px; }
  .cname { display: flex; align-items: center; gap: 6px; min-width: 0; }
  .cname span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .q { text-align: center; }
  .q.zero { opacity: 0.35; }
  .icon.rings3 { box-shadow: 0 0 0 2px #fff5d6, 0 0 0 3.5px var(--paperInk), 0 0 0 5.5px #fff5d6, 0 0 0 7px var(--paperInk), 0 0 0 9px #fff5d6, 0 0 0 10.5px var(--paperInk); margin: 7px; }
  .more { display: flex; flex-direction: column; gap: 12px; padding-top: 6px; }
</style>
