<script lang="ts">
  import './app.css';
  import { i18n, setLang, t } from '../i18n/i18n.svelte.ts';
  import { LANGS, type Lang } from '../content/schema.ts';
  import { game, dispatch } from './game.svelte.ts';
  import { describeFail } from './errors.ts';
  import Board from './Board.svelte';
  import Craft from './Craft.svelte';
  import Serve from './Serve.svelte';

  const endLabel = $derived(
    game.s.phase === 'morning' ? 'ui.endMorning' : game.s.phase === 'afternoon' ? 'ui.endAfternoon' : 'ui.endEvening',
  );
</script>

<main>
  <header class="row">
    <h1>{t('game.title')}</h1>
    <label class="lang">
      <span class="muted">{t('ui.language')}</span>
      <select value={i18n.lang} onchange={(e) => setLang(e.currentTarget.value as Lang)}>
        {#each LANGS as l}<option value={l}>{l.toUpperCase()}</option>{/each}
      </select>
    </label>
  </header>

  <div class="status row">
    <strong>{t('ui.day', { n: game.s.day })}</strong>
    <span>{t(`phase.${game.s.phase}`)}</span>
    <span>{t('ui.money', { n: game.s.money })}</span>
  </div>

  {#if game.s.phase === 'morning'}
    <div class="screen">
      <Board />
      <Craft />
    </div>
  {:else if game.s.phase === 'afternoon'}
    <div class="screen">
      <Board />
      <Serve />
    </div>
  {:else}
    <section class="panel"><p class="muted">{t('ui.comingSoon')}</p></section>
  {/if}

  {#if game.error}<p class="error" role="alert">{describeFail(game.error.code, game.error.params)}</p>{/if}

  <footer>
    <button class="primary" onclick={() => dispatch({ type: 'endPhase' })}>{t(endLabel)}</button>
  </footer>
</main>

<style>
  main { max-width: 56rem; margin: 0 auto; padding: 1rem; display: grid; gap: var(--gap); }
  header { justify-content: space-between; }
  h1 { font-size: 1.4rem; margin: 0; }
  .lang { display: flex; gap: 0.4rem; align-items: center; }
  .status { gap: 1rem; }
  .screen { display: grid; gap: var(--gap); }
  @media (min-width: 800px) { .screen { grid-template-columns: 18rem 1fr; align-items: start; } }
  .error { margin: 0; color: var(--warn); font-weight: 600; }
  footer { display: flex; justify-content: flex-end; }
</style>
