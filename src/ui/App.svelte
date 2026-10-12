<script lang="ts">
  import '@fontsource/young-serif/400.css';
  import '@fontsource-variable/bricolage-grotesque/wght.css';
  import '@fontsource/jetbrains-mono/500.css';
  import './app.css';
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { buildHeaderView, describeFail, screenFor } from '../view/index.ts';
  import { game, dispatch } from './game.svelte.ts';
  import CraftScreen from './CraftScreen.svelte';
  import Serve from './Serve.svelte';
  import Evening from './Evening.svelte';
  import Header from './Header.svelte';
  import Settings from './Settings.svelte';
  import StageStrip from './StageStrip.svelte';

  const header = $derived(buildHeaderView(content, game.s, t));
  const screen = $derived(screenFor(game.s.phase));
  // Navigation between the game and the settings page is a UI concern, so it lives here.
  let page = $state<'game' | 'settings'>('game');
</script>

<main class:bar={page === 'game'}>
  <Header {header} onsettings={() => (page = page === 'settings' ? 'game' : 'settings')} />

  {#if page === 'settings'}
    <Settings onclose={() => (page = 'game')} />
  {:else}
    <StageStrip />

    {#if screen === 'craft'}
      <CraftScreen />
    {:else if screen === 'serve'}
      <Serve />
    {:else}
      <Evening />
    {/if}

    {#if game.error}<p class="error" role="alert">{describeFail(t, game.error.code, game.error.params)}</p>{/if}
  {/if}
</main>

<!-- The phase button lives in a wood bar fixed to the bottom edge, close to the last action. -->
{#if page === 'game'}
  <footer class="actionbar">
    <div class="inner">
      <button class="btn big pill" onclick={() => dispatch(header.endPhase.action)}>
        {header.endPhase.label}<span aria-hidden="true">→</span>
      </button>
    </div>
  </footer>
{/if}

<style>
  main { max-width: 1200px; margin: 0 auto; padding: 20px 16px 48px; display: flex; flex-direction: column; gap: 16px; }
  .error { color: var(--warn); font-weight: 700; }
  .actionbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10;
    padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
    background: var(--wood);
    border-top: 1px solid var(--line);
    box-shadow: 0 -8px 20px rgba(0, 0, 0, 0.3);
  }
  .actionbar .inner { max-width: 1200px; margin: 0 auto; display: flex; justify-content: flex-end; }
  .actionbar .btn { min-height: 52px; }
  main.bar { padding-bottom: calc(96px + env(safe-area-inset-bottom)); }
  /* Desktop: no bar, just the button floating at the bottom right of the content column. */
  @media (min-width: 641px) {
    .actionbar { background: none; border: 0; box-shadow: none; pointer-events: none; padding: 0 16px 20px; }
    .actionbar .btn { pointer-events: auto; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5); }
  }
  @media (max-width: 640px) {
    main { padding: 12px 12px 24px; gap: 12px; }
    main.bar { padding-bottom: calc(96px + env(safe-area-inset-bottom)); }
    .actionbar .btn { width: 100%; }
  }
</style>
