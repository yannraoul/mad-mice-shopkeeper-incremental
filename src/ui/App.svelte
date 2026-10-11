<script lang="ts">
  import './app.css';
  import { content } from '../content/index.ts';
  import { setLang, t } from '../i18n/i18n.svelte.ts';
  import type { Lang } from '../content/schema.ts';
  import { buildHeaderView, describeFail, screenFor } from '../view/index.ts';
  import { game, dispatch } from './game.svelte.ts';
  import Board from './Board.svelte';
  import Craft from './Craft.svelte';
  import Serve from './Serve.svelte';
  import Evening from './Evening.svelte';
  import Settings from './Settings.svelte';
  import StageBar from './StageBar.svelte';

  const header = $derived(buildHeaderView(content, game.s, t));
  const screen = $derived(screenFor(game.s.phase));
  // Navigation between the game and the settings page is a UI concern, so it lives here.
  let page = $state<'game' | 'settings'>('game');
</script>

<main>
  <header class="row">
    <h1>{header.title}</h1>
    <div class="row tools">
      <label class="lang">
        <span class="muted">{header.languageLabel}</span>
        <select value={header.language} onchange={(e) => setLang(e.currentTarget.value as Lang)}>
          {#each header.languages as l}<option value={l.value}>{l.label}</option>{/each}
        </select>
      </label>
      <button onclick={() => (page = page === 'settings' ? 'game' : 'settings')}>{header.settingsLabel}</button>
    </div>
  </header>

  {#if page === 'settings'}
    <Settings onclose={() => (page = 'game')} />
  {:else}
    <div class="status row">
      <strong>{header.day}</strong>
      <span>{header.phase}</span>
      <span>{header.money}</span>
    </div>

    <StageBar />

    {#if screen === 'craft'}
      <div class="screen">
        <Board />
        <Craft />
      </div>
    {:else if screen === 'serve'}
      <div class="screen">
        <Board />
        <Serve />
      </div>
    {:else}
      <Evening />
    {/if}

    {#if game.error}<p class="error" role="alert">{describeFail(t, game.error.code, game.error.params)}</p>{/if}

    <footer>
      <button class="primary" onclick={() => dispatch(header.endPhase.action)}>{header.endPhase.label}</button>
    </footer>
  {/if}
</main>

<style>
  main { max-width: 56rem; margin: 0 auto; padding: 1rem; display: grid; gap: var(--gap); }
  header { justify-content: space-between; }
  h1 { font-size: 1.4rem; margin: 0; }
  .tools { gap: 0.75rem; }
  .lang { display: flex; gap: 0.4rem; align-items: center; }
  .status { gap: 1rem; }
  .screen { display: grid; gap: var(--gap); }
  @media (min-width: 800px) { .screen { grid-template-columns: 18rem 1fr; align-items: start; } }
  .error { margin: 0; color: var(--warn); font-weight: 600; }
  footer { display: flex; justify-content: flex-end; }
</style>
