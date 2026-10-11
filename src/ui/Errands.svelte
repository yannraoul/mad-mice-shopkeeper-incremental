<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { step } from '../engine/engine.ts';
  import { game, dispatch } from './game.svelte.ts';

  const s = $derived(game.s);
  const shown = $derived(
    content.errands
      .filter((e) => s.stage.index >= e.minStage || s.errands[e.id])
      .map((e) => {
        const state = s.errands[e.id];
        const missing = e.requires.filter((u) => !s.unlocks.includes(u));
        return {
          e,
          state,
          missing,
          canAccept: !state && step(content, s, { type: 'acceptErrand', errand: e.id }).ok,
          canDeliver: state?.status === 'active' && e.kind === 'deliver' && step(content, s, { type: 'deliverErrand', errand: e.id }).ok,
        };
      }),
  );

  /** Name of the upgrade that grants an unlock id, for "Needs: ..." lines. */
  function unlockName(id: string): string {
    const node = content.skillNodes.find((n) => n.effects.some((ef) => ef.type === 'unlock' && ef.id === id));
    return node ? t(node.nameKey) : id;
  }
</script>

{#if s.unlocks.includes('errandsBoard')}
  <section class="panel">
    <h2>{t('errands.title')}</h2>
    {#each shown as { e, state, missing, canAccept, canDeliver } (e.id)}
      <article class="errand" class:done={state?.status === 'done'}>
        <strong>{t(e.nameKey)}</strong>
        <div class="muted">{t(e.descKey)}</div>
        {#each e.deliver as d}
          <div>{t('errands.deliverLine', { qty: d.qty, candy: t(`candy.${d.candy}`), quality: t(`quality.${d.quality}`) })}</div>
        {/each}
        {#if state?.status === 'done'}
          <div class="ok">{t('errands.done')}</div>
        {:else if state?.status === 'active' && e.kind === 'mission' && e.mission}
          <div>{t('errands.missionLine', { worker: t(`worker.${e.mission.worker}`), n: state.daysLeft ?? 0 })}</div>
        {:else if state?.status === 'active'}
          <button class="primary" disabled={!canDeliver} onclick={() => dispatch({ type: 'deliverErrand', errand: e.id })}>
            {t('errands.deliver')}
          </button>
        {:else if missing.length > 0}
          <div class="muted">{t('errands.locked', { unlock: missing.map(unlockName).join(', ') })}</div>
        {:else}
          <button class="primary" disabled={!canAccept} onclick={() => dispatch({ type: 'acceptErrand', errand: e.id })}>
            {t('errands.accept')}
          </button>
        {/if}
      </article>
    {:else}
      <p class="muted">{t('errands.none')}</p>
    {/each}
  </section>
{/if}

<style>
  .errand { border-top: 1px solid var(--line); padding: 0.6rem 0; display: grid; gap: 0.35rem; }
  .errand.done { opacity: 0.6; }
  .ok { color: var(--ok); }
</style>
