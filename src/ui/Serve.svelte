<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { buildServeView } from '../view/serve.ts';
  import { game, dispatch } from './game.svelte.ts';
  import ImageSlot from './ImageSlot.svelte';

  const v = $derived(buildServeView(content, game.s, t, game.feed));
</script>

<section class="panel serve">
  <h2>{v.title}</h2>
  <p class="muted">{v.summary}</p>

  {#each v.customers as cu (cu.id)}
    <article class="customer">
      <div class="who">
        <ImageSlot id={cu.art} />
        <div>
          <strong>{cu.name}</strong>
          <div>{cu.wants}</div>
          <div class="muted">{cu.details}</div>
        </div>
      </div>
      <div class="row">
        {#each cu.options as o (o.quality)}
          <button class="primary" disabled={!o.enabled} onclick={() => dispatch(o.action)}>{o.label}</button>
        {/each}
        <button onclick={() => dispatch(cu.refuse.action)}>{cu.refuse.label}</button>
      </div>
      {#if cu.nothingFits}<p class="muted">{cu.nothingFits}</p>{/if}
    </article>
  {:else}
    <p class="muted">{v.nobody}</p>
  {/each}

  {#if v.closeWarning}<p class="warn">{v.closeWarning}</p>{/if}

  {#each v.workers as w (w.id)}
    <div class="worker">
      <h3>{w.name}</h3>
      <div class="who">
        <ImageSlot id={w.art} />
        <div>
          {#each w.toggles as tg (tg.customerType)}
            <label class="check">
              <input
                type="checkbox"
                checked={tg.on}
                onchange={(e) => dispatch(e.currentTarget.checked ? tg.setOn : tg.setOff)}
              />
              {tg.label}
            </label>
          {/each}
          {#each w.training as tr (tr.candy)}
            <div class="muted">{tr.text}</div>
          {/each}
        </div>
      </div>
    </div>
  {/each}

  {#if v.feed}
    <div class="feed">
      <h3>{v.feed.title}</h3>
      {#each v.feed.lines as line, i (i)}<div class:muted={i > 0}>{line}</div>{/each}
    </div>
  {/if}
</section>

<style>
  .serve { display: grid; gap: var(--gap); }
  .customer { border: 1px solid var(--line); border-radius: 10px; padding: 0.6rem; display: grid; gap: 0.5rem; }
  .who { display: flex; gap: var(--gap); align-items: center; }
  .warn { margin: 0; color: var(--warn); }
  .worker { border-top: 1px solid var(--line); padding-top: var(--gap); }
  .check { display: flex; gap: 0.5rem; align-items: center; min-height: 44px; }
  .check input { width: 1.4rem; height: 1.4rem; }
  .feed div { font-size: 0.9rem; }
</style>
