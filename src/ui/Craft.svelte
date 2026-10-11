<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { buildCraftView, craftReduce, initialCraftUi, type CraftEvent, type CraftUi } from '../view/craft.ts';
  import { game, dispatch } from './game.svelte.ts';
  import ImageSlot from './ImageSlot.svelte';

  // The only state here is the small hand-crafting interaction; everything else is in the view.
  let ui = $state.raw<CraftUi>(initialCraftUi(content));
  const v = $derived(buildCraftView(content, game.s, ui, t));
  const send = (ev: CraftEvent) => (ui = craftReduce(content, game.s, ui, ev, dispatch));
</script>

<section class="panel workshop">
  <h2>{v.title}</h2>

  {#if v.mode === 'idle'}
    {#if v.noBatches}
      <p class="muted">{v.noBatches}</p>
    {:else if v.idle}
      {@const f = v.idle}
      <h3>{f.newBatchTitle}</h3>
      <div class="row">
        {#if f.stations.length > 0}
          <label>
            {f.stationLabel}
            <select value={ui.station} onchange={(e) => send({ type: 'select', field: 'station', value: Number(e.currentTarget.value) })}>
              {#each f.stations as o}<option value={o.value}>{o.label}</option>{/each}
            </select>
          </label>
        {/if}
        <label>
          {f.candyLabel}
          <select value={ui.candy} onchange={(e) => send({ type: 'select', field: 'candy', value: e.currentTarget.value })}>
            {#each f.candies as o}<option value={o.value}>{o.label}</option>{/each}
          </select>
        </label>
        <label>
          {f.qualityLabel}
          <select value={ui.quality} onchange={(e) => send({ type: 'select', field: 'quality', value: e.currentTarget.value })}>
            {#each f.qualities as o}<option value={o.value}>{o.label}</option>{/each}
          </select>
        </label>
        <button class="primary" onclick={() => send({ type: 'start' })} disabled={!f.start.enabled}>{f.start.label}</button>
      </div>
      {#if f.blocked}<p class="blocked">{f.blocked}</p>{/if}
      <p class="muted">{f.batchesLeft}</p>
      <h3>{f.suppliesTitle}</h3>
      <ul class="contents">
        {#each f.supplies as line}<li>{line}</li>{/each}
      </ul>
    {/if}
  {:else if v.bench}
    {@const b = v.bench}
    <div class="bench">
      <div class="shelf">
        <h3>{b.shelfTitle}</h3>
        <div class="items">
          {#each b.shelf as item (item.ingredient)}
            <button
              class="item"
              class:selected={item.held}
              disabled={!item.enabled}
              onclick={() => send({ type: 'tapShelf', ingredient: item.ingredient })}
            >
              <ImageSlot id={item.art} />
              <span>{item.name}</span>
              <span class="muted">{item.supply}</span>
            </button>
          {/each}
        </div>
      </div>

      <div class="station">
        <h3>{b.stationTitle}</h3>
        <button class="stationbtn" class:armed={b.stationArmed} onclick={() => send({ type: 'tapStation' })}>
          <ImageSlot id={b.stationArt} />
        </button>
        <ul class="contents">
          {#each b.contents as line (line.ingredient)}<li>{line.text}</li>{/each}
        </ul>
      </div>
    </div>

    <p class="hint">{b.hint}</p>
    <div class="row">
      {#each b.steps as st (st.id)}
        <button class:primary={st.primary} disabled={!st.enabled} onclick={() => send({ type: 'step', id: st.id })}>
          {st.label}
        </button>
      {/each}
      <button onclick={() => send({ type: 'cancel' })}>{b.cancelLabel}</button>
    </div>
  {/if}

  {#if v.made}<p class="message">{v.made}</p>{/if}
</section>

<style>
  .workshop { display: grid; gap: var(--gap); }
  label { display: grid; gap: 0.2rem; font-size: 0.9rem; }
  .bench { display: grid; gap: var(--gap); grid-template-columns: 1fr; }
  @media (min-width: 640px) { .bench { grid-template-columns: 1fr 1fr; } }
  .items { display: flex; flex-wrap: wrap; gap: var(--gap); }
  .item { display: grid; justify-items: center; gap: 0.15rem; padding: 0.5rem; }
  .stationbtn { padding: 0.25rem; border-width: 2px; }
  .stationbtn.armed { border-color: var(--accent); outline: 3px dashed var(--accent); }
  .contents { list-style: none; padding: 0; margin: 0.5rem 0 0; }
  .hint { margin: 0; font-weight: 600; }
  .message { margin: 0; color: var(--ok); }
  .blocked { margin: 0; color: var(--warn); }
</style>
