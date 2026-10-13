<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { buildCraftView, craftReduce, initialCraftUi, type CraftEvent, type CraftUi } from '../view/craft.ts';
  import { game, dispatch } from './game.svelte.ts';
  import type { ShelfItem } from '../view/craft.ts';
  import ImageSlot from './ImageSlot.svelte';
  import Pips from './Pips.svelte';

  // The only state here is the small hand-crafting interaction; everything else is in the view.
  let ui = $state.raw<CraftUi>(initialCraftUi(content));
  const v = $derived(buildCraftView(content, game.s, ui, t));
  const send = (ev: CraftEvent) => (ui = craftReduce(content, game.s, ui, ev, dispatch));
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
    <span class="strip" aria-hidden="true"><Pips n={item.left} total={item.total} height={9} round /></span>
  </span>
  <b class="name">{item.name}</b>
  <span class="sr">{item.supply}</span>
{/snippet}

<section class="frame workshop" aria-labelledby="workshop-title">
  <h2 id="workshop-title">{v.title}</h2>

  <div class="scene" class:many={sc.shelfPairs.length > 2}>
    <div class="col">
      <div class="overline">{sc.shelfTitle} · {sc.shelfSub}</div>
      <!-- Responsive: with three or more bases on a wide enough shelf, one column per base (the alternate under it);
           otherwise rows of two (base left, alternate right), or just the bases two to a row before any alternate exists. -->
      <div class="shelfbox">
        <div class="shelf" class:paired={sc.shelfHasAlternates} class:cols={sc.shelfPairs.length > 2} style:--pairs={Math.min(sc.shelfPairs.length, 4)}>
          {#each sc.shelfPairs as p (p.base.ingredient)}
            <div class="pair">
              {@render slot(p.base)}
              {#if p.alt}
                {@render slot(p.alt)}
              {:else if sc.shelfHasAlternates}
                <span class="tile ghost" aria-hidden="true"></span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
      {#if sc.surplusNote}<p class="surplus">{sc.surplusNote}</p>{/if}
    </div>

    <div class="col stagecol">
      <div class="overline heads"><span>{sc.cauldronTitle}</span><span>{sc.batchesTitle}</span></div>
      <div class="stage">
        <div class="cauldron"><ImageSlot id={sc.stationArt} /></div>
        <div class="meta">
          <div class="circles" aria-hidden="true">
            {#each Array.from({ length: sc.batches.total }, (_, i) => i) as i (i)}
              <span class="circle" class:on={i < sc.batches.left}></span>
            {/each}
          </div>
          <div class="small muted">{sc.batchInfo}</div>
          {#if sc.inCauldron}
            <div class="inside">
              <span class="muted small">{sc.inCauldron.title}</span>
              {#each sc.inCauldron.lines as line}<b>{line}</b>{/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  {#if v.mode === 'idle'}
    {#if v.noBatches}
      <p class="muted">{v.noBatches}</p>
    {:else if v.idle}
      {@const f = v.idle}
      <div class="start">
        <h3>{f.newBatchTitle}</h3>
        {#if f.stations.length > 0}
          <label class="stationpick">
            <span class="overline">{f.stationLabel}</span>
            <select value={ui.station} onchange={(e) => send({ type: 'select', field: 'station', value: Number(e.currentTarget.value) })}>
              {#each f.stations as o}<option value={o.value}>{o.label}</option>{/each}
            </select>
          </label>
        {/if}
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
                  <span class="price mono">{r.priceText}</span>
                </span>
              </span>
              <span class="radio" aria-hidden="true"></span>
            </button>
          {/each}
        </div>
        {#if f.helpers.length > 0}
          <div class="helpers" role="group" aria-label={f.helpersTitle}>
            <span class="overline">{f.helpersTitle}</span>
            {#each f.helpers as h (h.step)}
              <button class="chip helper" class:on={h.on} aria-pressed={h.on} onclick={() => send({ type: 'setStepMode', step: h.step, auto: !h.on })}>{h.label}</button>
            {/each}
          </div>
        {/if}
        <div class="controls">
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
          <button class="btn big start-btn" onclick={() => send({ type: 'start' })} disabled={!f.start.enabled}>{f.start.label}</button>
        </div>
        {#if f.blocked}<p class="blocked">{f.blocked}</p>{/if}
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

  {#if v.made}<p class="made" role="status">{v.made}</p>{/if}
</section>

<style>
  .workshop { display: flex; flex-direction: column; gap: 20px; }
  .small { font-size: 13px; }
  .scene { display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 24px; }
  /* Three or more base ingredients: a wider shelf on desktop. */
  @media (min-width: 900px) {
    .scene.many { grid-template-columns: 370px minmax(0, 1fr); }
  }
  .col { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
  .heads { display: flex; justify-content: space-between; gap: 8px; }

  .shelfbox { container-type: inline-size; }
  .shelf { background: var(--shelf); border-radius: 14px; padding: 10px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-content: start; gap: 4px; border-bottom: 6px solid var(--shelfEdge); }
  /* Rows of two: a pair is just its two tiles in the grid, base left and alternate right. */
  .pair { display: contents; }
  .tile.ghost { visibility: hidden; }
  /* A shelf wide enough for a column per base: the alternate sits under its base. */
  @container (min-width: 290px) {
    .shelf.cols { grid-template-columns: repeat(var(--pairs), minmax(0, 1fr)); gap: 2px; padding: 8px 6px; }
    .shelf.cols .pair { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .shelf.cols .tile.ghost { display: none; }
  }
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
  .strip :global(.pips) { flex: none; flex-wrap: wrap; justify-content: center; gap: 3px; }
  .strip :global(.pip.round) { border-color: rgba(255, 255, 255, 0.6) !important; }
  .name { font-size: 14px; line-height: 1.15; overflow-wrap: break-word; }
  .surplus { margin: 0; padding: 4px 4px 0; font-size: 12px; line-height: 1.35; color: var(--muted); }
  button.tile:disabled { opacity: 1; }
  .tile.dim { opacity: 0.45; }
  button.tile:not(:disabled):hover { background: var(--panel); }

  .stage {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    align-items: center;
    justify-content: center;
    background: var(--scene);
    border-radius: 14px;
    padding: 18px;
    border-bottom: 6px solid var(--shelfEdge);
  }
  .cauldron { border-radius: 14px; padding: 6px; border: 3px solid transparent; background: transparent; display: block; }
  .meta { display: flex; flex-direction: column; gap: 10px; min-width: 150px; }
  .circles { display: flex; gap: 6px; }
  .circle { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--line); }
  .circle.on { background: var(--accent); border-color: var(--accent); }
  .inside { display: flex; flex-direction: column; font-size: 14px; }
  .inside b { font: 400 20px/1.2 var(--display); }

  .start { display: flex; flex-direction: column; gap: 12px; }
  .start h3 { font-size: 20px; }
  .recipes { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 8px; }
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

  .controls { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
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
  .stationpick { display: flex; flex-direction: column; gap: 4px; align-self: flex-start; }
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
  .track { display: flex; margin: 0; padding: 0; list-style: none; }
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
  .track li:first-child { border-radius: 12px 0 0 12px; }
  .track li:last-child { border-radius: 0 12px 12px 0; }
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
  .autonote { color: var(--ok); }
  .helpers { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; }
  .chip.helper { min-height: 36px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel2); color: var(--muted); font: 600 13px/1.2 var(--body); }
  .chip.helper.on { background: color-mix(in srgb, var(--ok) 18%, var(--panel2)); border-color: var(--ok); color: var(--ink); }
  .made { color: var(--ok); font-size: 14px; }

  /* Phone: shelf as a 2-column grid, recipes as a list with a radio, steps in columns. */
  @media (max-width: 640px) {
    .scene { grid-template-columns: minmax(0, 1fr); gap: 16px; }
    .name { font-size: 12px; }
    .stage { padding: 14px; flex-direction: column; }
    .meta { align-items: center; min-width: 0; }
    .circle { width: 26px; height: 26px; }
    .recipes { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .seg { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); width: 100%; }
    .opt { flex-direction: column; justify-content: center; min-height: 52px; padding: 4px; gap: 0; }
    .controls { flex-direction: column; align-items: stretch; gap: 12px; }
    .start-btn { min-height: 52px; width: 100%; }
    .track li { flex-direction: column; text-align: center; padding: 8px 4px; gap: 4px; }
    .lab { align-items: center; }
    .lab b { font-size: 14px; }
    .actions { gap: 10px; }
    .next { flex: 1; min-height: 52px; }
    .hint { flex: 1; font-size: 15px; }
  }
</style>
