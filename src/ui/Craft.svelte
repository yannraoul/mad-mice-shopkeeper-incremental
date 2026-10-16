<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { buildCraftView, craftReduce, initialCraftUi, type CraftEvent, type CraftUi } from '../view/craft.ts';
  import { game, dispatchPlayed, sceneClock } from './game.svelte.ts';
  import type { ShelfItem } from '../view/craft.ts';
  import ImageSlot from './ImageSlot.svelte';
  import Pips from './Pips.svelte';
  import Scene from './Scene.svelte';

  let { ondrawer, drawerLabel = '' }: { ondrawer?: () => void; drawerLabel?: string } = $props();

  // The only state here is the small hand-crafting interaction; everything else is in the view.
  let ui = $state.raw<CraftUi>(initialCraftUi(content));
  const v = $derived(buildCraftView(content, game.s, ui, t));
  const send = (ev: CraftEvent) => (ui = craftReduce(content, game.s, ui, ev, dispatchPlayed));
  const sc = $derived(v.scene);
  const next = $derived(v.bench?.steps.find((st) => st.primary));
</script>

{#snippet slot(item: ShelfItem)}
  {#if v.mode === 'bench'}
    <button class="tile" class:dim={!item.enabled} disabled={!item.enabled} onclick={() => send({ type: 'tapShelf', ingredient: item.ingredient })}>
      {@render ingredient(item)}
    </button>
  {:else}
    <div class="tile">{@render ingredient(item)}</div>
  {/if}
{/snippet}

{#snippet ingredient(item: ShelfItem)}
  <span class="pic">
    <ImageSlot id={item.art} width={80} />
    <span class="strip" aria-hidden="true">
      {#if item.total > 4}<span class="frac mono">{item.left}/{item.total}</span>{:else}<Pips n={item.left} total={item.total} height={9} round />{/if}
    </span>
  </span>
  <b class="name">{item.name}</b>
  <span class="sr">{item.supply}</span>
{/snippet}

<section class="frame workshop" aria-labelledby="workshop-title">
  <div class="titlebar">
    <h2 id="workshop-title">{v.title}</h2>
    {#if ondrawer}<button class="btn3 drawerbtn" onclick={ondrawer}>{drawerLabel}</button>{/if}
  </div>
  <div class="topbar">
    {#if v.mode === 'idle' && !v.noBatches && v.idle}
      {@const f = v.idle}
      {#if f.stations.length > 0}
        <label class="stationpick">
          <span class="overline">{f.stationLabel}</span>
          <select value={ui.station} onchange={(e) => send({ type: 'select', field: 'station', value: Number(e.currentTarget.value) })}>
            {#each f.stations as o}<option value={o.value}>{o.label}</option>{/each}
          </select>
        </label>
      {/if}
      <div class="seg" role="radiogroup" aria-label={f.qualityLabel}>
        {#each f.qualityOptions as q (q.value)}
          <button
            class="opt"
            class:selected={q.selected}
            role="radio"
            aria-checked={q.selected}
            disabled={!q.enabled}
            onclick={() => send({ type: 'select', field: 'quality', value: q.value })}
          >
            <b>{q.label}</b><span class="note2">{q.note}</span>
          </button>
        {/each}
      </div>
      <button class="btn big start-btn" onclick={() => send({ type: 'start' })} disabled={!f.start.enabled || sceneClock.busy}>{f.start.label}</button>
    {/if}
  </div>
  {#if v.mode === 'idle' && v.idle?.blocked}<p class="blocked">{v.idle.blocked}</p>{/if}

  <div class="main">
    <div class="leftcol">
    <div class="stagewrap">
      <Scene />
      <div class="hud">
        <div class="circles" aria-hidden="true">
          {#each Array.from({ length: sc.batches.total }, (_, i) => i) as i (i)}
            <span class="circle" class:on={i < sc.batches.left}></span>
          {/each}
        </div>
        <span class="small">{sc.batchInfo}</span>
        {#if sc.inCauldron}
          <span class="inside"><span class="muted small">{sc.inCauldron.title}</span>{#each sc.inCauldron.lines as line}<b>{line}</b>{/each}</span>
        {/if}
      </div>
    </div>
    <div class="shelfrow">
      <div class="overline">{sc.shelfTitle} · {sc.shelfSub}</div>
      <div class="shelf">
        {#each sc.shelfPairs as p (p.base.ingredient)}
          {@render slot(p.base)}
          {#if p.alt}{@render slot(p.alt)}{/if}
        {/each}
      </div>
      {#if sc.surplusNote}<p class="surplus">{sc.surplusNote}</p>{/if}
    </div>
    </div>

    <aside class="side"><div class="sidein">
      {#if v.mode === 'idle'}
        {#if v.noBatches}
          <p class="muted">{v.noBatches}</p>
        {:else if v.idle}
          {@const f = v.idle}
          <div class="rhead"><h3>{f.newBatchTitle}</h3><span class="legend mono muted" title={f.stockLegend}>{f.stockLegend}</span></div>
          <div class="recipes" role="radiogroup" aria-label={f.candyLabel}>
            {#each f.recipes as r (r.value)}
              <button
                class="recipe"
                class:selected={r.selected}
                role="radio"
                aria-checked={r.selected}
                onclick={() => send({ type: 'select', field: 'candy', value: r.value })}
              >
                <ImageSlot id={r.art} width={44} />
                <span class="rinfo">
                  <b class="rname">{r.name}</b>
                  <span class="rrow">
                    <span class="cost" title={r.costText}>
                      {#each r.cost as ci (ci.ingredient)}
                        <span class="ci"><ImageSlot id={ci.art} width={22} /><i>{ci.qty}</i></span>
                      {/each}
                      <span class="sr">{r.costText}</span>
                    </span>
                    <span class="pricecol">
                      <span class="stock mono muted" aria-hidden="true">{r.stockText}</span>
                      <span class="sr">{r.stockLabel}</span>
                      <span class="price mono">{r.priceText}</span>
                    </span>
                  </span>
                </span>
                <span class="radio" aria-hidden="true"></span>
              </button>
            {/each}
          </div>
        {/if}
      {:else if v.bench}
        {@const b = v.bench}
        <div class="bench">
          <ol class="track" aria-label={b.hint}>
            {#each b.track as st (st.id)}
              <li class:current={st.state === 'current'} class:done={st.state === 'done'} class:dimmed={st.dimmed} aria-current={st.state === 'current' ? 'step' : undefined}>
                <span class="dotn" aria-hidden="true">{st.n}</span>
                <span class="lab"><b>{st.label}</b><span class="muted small" class:autonote={st.auto}>{st.note}</span></span>
              </li>
            {/each}
          </ol>
          <!-- Cancel on the left; the one possible next move always on the right, and always active. -->
          <div class="actions">
            <button class="btn3 cancel" onclick={() => send({ type: 'cancel' })}>{b.cancelLabel}</button>
            {#if b.canFillAll}<button class="btn3 fillall" onclick={() => send({ type: 'fillAll' })}>{b.fillAllLabel}</button>{/if}
            {#if next}
              <button class="btn big next" onclick={() => send({ type: 'step', id: next.id })}>{b.hint}<span aria-hidden="true">→</span></button>
            {:else}
              <div class="hint" role="status">{b.hint}</div>
            {/if}
          </div>
        </div>
      {/if}
    </div></aside>
  </div>

  {#if v.autoNote && v.mode === 'idle'}<p class="made" role="status">{v.autoNote}</p>{/if}

  {#if v.orders && v.mode === 'idle'}
    {@const o = v.orders}
    <div class="orders">
      <h3>{o.title}</h3>
      {#if o.none}<p class="muted small">{o.none}</p>{/if}
      {#if o.lines.length > 0}
        <ul>{#each o.lines as line}<li>{line}</li>{/each}</ul>
      {/if}
      <label class="prefer">
        <span class="overline">{o.preferLabel}</span>
        <select onchange={(e) => send({ type: 'setAutoCandy', candy: e.currentTarget.value })}>
          {#each o.candies as cd (cd.value)}<option value={cd.value} selected={cd.selected}>{cd.label}</option>{/each}
        </select>
      </label>
      {#if o.mouseNote}<p class="muted small">{o.mouseNote}</p>{/if}
    </div>
  {/if}

  {#if v.made && !sceneClock.busy}<p class="made" role="status">{v.made}</p>{/if}
</section>

<style>
  .workshop { display: flex; flex-direction: column; gap: 16px; }
  .topbar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 16px; }
  .titlebar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .topbar .start-btn { margin-left: auto; }
  .leftcol { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
  .drawerbtn { flex: none; }
  .main { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 16px; align-items: stretch; }
  .stagewrap { position: relative; min-width: 0; }
  .hud {
    position: absolute; left: 10px; bottom: 10px; display: flex; flex-direction: column; gap: 4px; align-items: flex-start;
    padding: 6px 10px; border-radius: 10px; background: rgba(0, 0, 0, 0.6); color: #fff; pointer-events: none;
  }
  .hud .muted { color: rgba(255, 255, 255, 0.75); }
  .hud .circle { width: 16px; height: 16px; border-color: rgba(255, 255, 255, 0.6); }
  .hud .inside b { font-size: 15px; }
  /* The recipe column is as tall as the workshop on its left, and scrolls inside that height. */
  .side { position: relative; min-width: 0; }
  .sidein { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 10px; min-height: 0; }
  .recipes { overflow-y: auto; min-height: 0; padding-right: 4px; }
  .side h3 { margin: 0; font-size: 18px; }
  .rhead { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding-right: 4px; }
  .legend, .stock { font-size: 12px; }
  .pricecol { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
  .shelfrow { display: flex; flex-direction: column; gap: 6px; }
  .shelf { display: flex; flex-wrap: wrap; gap: 4px; background: var(--shelf); border-radius: 14px; padding: 8px; border-bottom: 6px solid var(--shelfEdge); }
  .shelf .tile { width: 96px; }
  .small { font-size: 13px; }
  .tile {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    padding: 8px 4px;
    border-radius: 12px;
    background: transparent;
    border: 2px solid transparent;
    color: var(--ink);
    text-align: center;
    min-width: 0;
  }
  /* The picture with the counter dots laid over its bottom edge; the name sits under it. */
  .pic { position: relative; display: block; line-height: 0; }
  .strip {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    padding: 5px 4px;
    background: rgba(0, 0, 0, 0.55);
    border-radius: 0 0 12px 12px;
  }
  .frac { font-size: 12px; line-height: 1; color: #fff; }
  .strip :global(.pips) { flex: none; flex-wrap: wrap; justify-content: center; gap: 3px; }
  .strip :global(.pip.round) { border-color: rgba(255, 255, 255, 0.6) !important; }
  .name { font-size: 14px; line-height: 1.15; overflow-wrap: break-word; }
  .surplus { margin: 0; padding: 4px 4px 0; font-size: 12px; line-height: 1.35; color: var(--muted); }
  button.tile:disabled { opacity: 1; }
  .tile.dim { opacity: 0.45; }
  button.tile:not(:disabled):hover { background: var(--panel); }

  .circles { display: flex; gap: 6px; }
  .circle { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--line); }
  .circle.on { background: var(--accent); border-color: var(--accent); }
  .inside { display: flex; flex-direction: column; font-size: 14px; }
  .inside b { font: 400 20px/1.2 var(--display); }

  .recipes { display: flex; flex-direction: column; gap: 8px; }
  .recipe {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 6px 8px;
    border-radius: 12px;
    background: var(--panel2);
    border: 2px solid transparent;
    color: var(--ink);
    text-align: left;
    min-width: 0;
  }
  .recipe.selected { background: var(--panel); border-color: var(--accent); }
  .recipe .price { color: var(--accent); font-size: 12px; white-space: nowrap; }
  .rinfo { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
  .rrow { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
  .rname { font-size: 13px; line-height: 1.15; overflow-wrap: break-word; }
  .cost { display: flex; flex-wrap: wrap; gap: 4px; }
  .ci { position: relative; display: block; line-height: 0; }
  .ci i { position: absolute; right: -3px; bottom: -3px; min-width: 13px; height: 13px; padding: 0 2px; border-radius: 7px; background: var(--ink); color: var(--bg); font: 700 10px/13px var(--mono); text-align: center; box-sizing: border-box; }
  .radio { display: none; width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--line); flex: none; margin-left: auto; }
  .recipe.selected .radio { border-color: var(--accent); background: radial-gradient(var(--accent) 0 45%, transparent 50%); }

  .seg { display: flex; background: var(--panel2); border-radius: 12px; padding: 4px; gap: 2px; }
  .opt {
    min-height: 44px;
    padding: 0 16px;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: var(--ink);
    font: 500 15px/1.15 var(--body);
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .opt .note2 { font-size: 12px; opacity: 0.8; }
  .opt.selected { background: var(--accent); color: var(--accentInk); }
  .opt.selected b { font-weight: 700; }
  .opt:disabled { opacity: 0.4; }
  .stationpick { display: flex; flex-direction: column; gap: 4px; }
  select {
    min-height: 44px;
    padding: 0 12px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: var(--panel2);
    color: var(--ink);
  }
  .blocked { color: var(--warn); font-size: 14px; }

  .bench { display: flex; flex-direction: column; gap: 14px; }
  .track { display: flex; flex-direction: column; gap: 2px; margin: 0; padding: 0; list-style: none; }
  .track li {
    flex: 1;
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 10px 14px;
    background: var(--panel2);
    border: 2px solid transparent;
    min-width: 0;
  }
  .track li { border-radius: 12px; }
  .track li.current { background: var(--panel); border-color: var(--accent); }
  .track li.dimmed { opacity: 0.5; }
  .dotn { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; font: 700 14px/1 var(--body); background: var(--line); color: var(--ink); flex: none; }
  .current .dotn { background: var(--accent); color: var(--accentInk); }
  .done .dotn { background: var(--ok); color: var(--accentInk); }
  .lab { display: flex; flex-direction: column; min-width: 0; }
  .lab b { font-size: 15px; }
  .lab .small { font-size: 12px; }
  .actions { display: flex; align-items: center; gap: 16px; align-self: stretch; }
  .hint { font: 700 16px/1.3 var(--body); text-align: right; margin-left: auto; }
  .next { margin-left: auto; }
  .cancel { border-color: var(--ink); margin-right: auto; flex: none; }
  .fillall { flex: none; }
  .orders { display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--panel2); }
  .orders h3 { margin: 0; }
  .orders ul { margin: 0; padding-left: 18px; font-size: 14px; }
  .prefer { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .autonote { color: var(--ok); }
  .made { color: var(--ok); font-size: 14px; }

  /* Phone: shelf as a 2-column grid, recipes as a list with a radio, steps in columns. */
  @media (max-width: 640px) {
    .main { grid-template-columns: minmax(0, 1fr); }
    .side { position: static; }
    .sidein { position: static; }
    .recipes { max-height: 300px; }
    .name { font-size: 12px; }
    .shelf .tile { width: calc(25% - 3px); }
    .recipes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .seg { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); width: 100%; order: 3; }
    .opt { flex-direction: column; justify-content: center; min-height: 52px; padding: 4px; gap: 0; }
    .start-btn { min-height: 52px; width: 100%; order: 4; }
    .hud .circle { width: 12px; height: 12px; }
    .actions { gap: 10px; }
    .next { flex: 1; min-height: 52px; }
    .hint { flex: 1; font-size: 15px; }
  }
</style>
