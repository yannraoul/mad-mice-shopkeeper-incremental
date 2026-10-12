<script lang="ts">
  import type { ErrandsView } from '../view/errands.ts';
  import { dispatch } from './game.svelte.ts';
  import Pips from './Pips.svelte';

  let { view }: { view: ErrandsView | null } = $props();
  const tone = (x: string) => (x === 'ready' ? 'var(--ok)' : 'var(--accent)');
</script>

{#if view}
  <section class="frame small">
    <h3>{view.title}</h3>
    {#each view.items as e (e.id)}
      {#if e.tone === 'available' || e.tone === 'underway' || e.tone === 'ready'}
        <!-- A collapsed row: name, requirement, optional rival chip and the action; the description opens on tap. -->
        <details class="errand {e.tone}" class:rival={!!e.tag && e.tone === 'available'}>
          <summary>
            <span class="title">
              <b>{e.name}</b>
              {#each e.requirements as line}<span class="req mono">{line}</span>{/each}
              {#if e.tag}<span class="chip warn tag">{e.tag}</span>{/if}
            </span>
            {#if e.chip}<span class="chip state" style:color={tone(e.tone)}>{e.chip}</span>{/if}
            {#if e.button}
              {@const b = e.button}
              <button class="btn sm" disabled={!b.enabled} onclick={(ev) => { ev.stopPropagation(); dispatch(b.action); }}>{b.label}</button>
            {/if}
          </summary>
          <p class="desc">{e.description}</p>
          {#if e.progress}
            <div class="progress">
              <span class="row"><span>{e.progress.label}</span><span class="mono">{e.progress.n} / {e.progress.max}</span></span>
              <Pips n={e.progress.n} total={e.progress.max} color={tone(e.tone)} />
            </div>
          {/if}
        </details>
      {:else}
        <article class="errand {e.tone} static">
          <span class="title">
            <b>{e.name}</b>
            {#each e.requirements as line}<span class="req mono">{line}</span>{/each}
            {#if e.tag}<span class="chip warn tag">{e.tag}</span>{/if}
          </span>
          {#if e.chip}<span class="chip ok">{e.chip}</span>{/if}
          {#if e.tone === 'done'}
            <span class="ok line">✓ {e.statusText}</span>
          {:else}
            <span class="muted line"><span aria-hidden="true">🔒</span> {e.statusText}</span>
          {/if}
        </article>
      {/if}
    {:else}
      <p class="muted">{view.none}</p>
    {/each}
  </section>
{/if}

<style>
  .frame { display: flex; flex-direction: column; gap: 10px; }
  .errand { background: var(--panel2); border-radius: 12px; padding: 0 12px; }
  .errand.rival, .errand.ready, .errand.underway { padding-bottom: 0; }
  .errand.rival { box-shadow: inset 0 0 0 1px var(--warn); }
  .errand.underway { box-shadow: inset 0 0 0 1px var(--accent); }
  .errand.ready { box-shadow: inset 0 0 0 1px var(--ok); }
  details > summary { list-style: none; cursor: pointer; display: flex; align-items: center; gap: 8px; min-height: 56px; padding: 10px 0; }
  details > summary::-webkit-details-marker { display: none; }
  summary:focus-visible { border-radius: 12px; }
  .title { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; align-items: flex-start; }
  .title b { font-size: 15px; }
  .req { font-size: 12px; color: var(--muted); }
  .tag { margin-top: 3px; align-self: flex-start; white-space: normal; }
  .state { align-self: flex-start; margin-top: 2px; }
  .desc { margin: 0 0 12px; font-size: 13px; line-height: 1.45; color: var(--muted); }
  .progress { display: flex; flex-direction: column; gap: 4px; margin: 0 0 12px; font-size: 13px; }
  .row { display: flex; justify-content: space-between; }
  summary .btn { flex: none; min-height: 36px; }
  summary .btn:disabled { min-height: 36px; }
  .static { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 6px 8px; padding: 12px; opacity: 0.6; min-height: 56px; }
  .static .line { flex-basis: 100%; font-size: 13px; }
  .static .ok { color: var(--ok); }
</style>
