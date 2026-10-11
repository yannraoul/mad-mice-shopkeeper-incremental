<script lang="ts">
  import type { ErrandsView } from '../view/errands.ts';
  import { dispatch } from './game.svelte.ts';

  let { view }: { view: ErrandsView | null } = $props();
</script>

{#if view}
  <section class="panel">
    <h2>{view.title}</h2>
    {#each view.items as e (e.id)}
      <article class="errand" class:done={e.status === 'done'}>
        <strong>{e.name}</strong>
        {#if e.tag}<span class="tag">{e.tag}</span>{/if}
        <div class="muted">{e.description}</div>
        {#each e.requirements as line}<div>{line}</div>{/each}
        {#if e.status === 'done'}
          <div class="ok">{e.statusText}</div>
        {:else if e.status === 'mission'}
          <div>{e.statusText}</div>
        {:else if e.status === 'locked'}
          <div class="muted">{e.statusText}</div>
        {:else if e.button}
          {@const b = e.button}
          <button class="primary" disabled={!b.enabled} onclick={() => dispatch(b.action)}>{b.label}</button>
        {/if}
      </article>
    {:else}
      <p class="muted">{view.none}</p>
    {/each}
  </section>
{/if}

<style>
  .errand { border-top: 1px solid var(--line); padding: 0.6rem 0; display: grid; gap: 0.35rem; }
  .errand.done { opacity: 0.6; }
  .ok { color: var(--ok); }
  .tag { justify-self: start; font-size: 0.8rem; border: 1px solid var(--warn); color: var(--warn); border-radius: 999px; padding: 0 0.5rem; }
</style>
