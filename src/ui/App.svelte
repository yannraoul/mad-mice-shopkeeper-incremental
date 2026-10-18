<script lang="ts">
  import '@fontsource/young-serif/400.css';
  import '@fontsource-variable/bricolage-grotesque/wght.css';
  import '@fontsource/jetbrains-mono/500.css';
  import './app.css';
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { buildHeaderView, describeFail, screenFor } from '../view/index.ts';
  import { game, dispatch } from './game.svelte.ts';
  import PhaseTransition from './PhaseTransition.svelte';
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

<PhaseTransition />

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
      {#each header.routines as r (r.part)}
        <button class="routine" class:on={r.on} aria-pressed={r.on} title={r.status || r.label} onclick={() => dispatch(r.action)}>
          <span class="switch" aria-hidden="true"><span class="knob"></span></span>
          <span class="txt">
            <b>{r.label}</b>
            {#if r.status}<span class="status">{r.status}</span>{/if}
          </span>
        </button>
      {/each}
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
  .actionbar .inner { max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: 8px; }
  .routine {
    pointer-events: auto;
    display: flex; align-items: center; gap: 10px;
    min-height: 52px; padding: 6px 16px 6px 10px; border-radius: 26px;
    border: 1px solid var(--line); background: var(--panel2); color: var(--muted);
    font: 600 14px/1.2 var(--body);
  }
  /* A switch: a track with a knob that slides to the right when the routine is on. */
  .switch { flex: none; width: 40px; height: 22px; border-radius: 11px; background: var(--line); position: relative; transition: background 0.2s; }
  .knob { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: var(--panel2); transition: transform 0.2s; }
  .routine.on .switch { background: var(--ok); }
  .routine.on .knob { transform: translateX(18px); background: #fff; }
  .txt { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; text-align: center; }
  .routine .status { font-weight: 400; font-size: 12px; }
  .routine.on { border-color: var(--ok); color: var(--ink); background: color-mix(in srgb, var(--ok) 18%, var(--panel2)); }
  .actionbar .btn { min-height: 52px; }
  main.bar { padding-bottom: calc(96px + env(safe-area-inset-bottom)); }
  /* Desktop: no bar, just the button floating at the bottom right of the content column. */
  @media (min-width: 641px) {
    .actionbar { background: none; border: 0; box-shadow: none; pointer-events: none; padding: 0 16px 20px; }
    .actionbar .btn { pointer-events: auto; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5); }
  }
  @media (max-width: 640px) {
    main { padding: 12px 12px 24px; gap: 12px; }
    main.bar { padding-bottom: calc(140px + env(safe-area-inset-bottom)); }
    .actionbar .btn { flex: 1 1 100%; }
    /* Three switches share one row above the phase button: just the names, a small switch each. */
    .routine { flex: 1 1 0; min-width: 0; gap: 6px; padding: 4px 8px 4px 6px; min-height: 44px; }
    .routine .status { display: none; }
    .routine .switch { width: 28px; height: 16px; border-radius: 8px; }
    .routine .knob { top: 2px; left: 2px; width: 12px; height: 12px; }
    .routine.on .knob { transform: translateX(12px); }
    .txt b { font-size: 13px; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .txt { min-width: 0; align-items: flex-start; text-align: left; }
  }
</style>
