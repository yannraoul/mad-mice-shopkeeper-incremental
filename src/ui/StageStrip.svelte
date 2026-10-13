<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { buildStageView } from '../view/stage.ts';
  import { game } from './game.svelte.ts';

  const v = $derived(buildStageView(content, game.s, t));
  let open = $state(false);
  let goalsOpen = $state(false);
</script>

<section class="strip" aria-label={v.name}>
  <div class="main">
    <div class="line">
      <span><b>{v.name}</b> <span class="muted">· {v.dayText}</span></span>
      <span class="mono earned">{v.earnedText}{#if v.more} · <button class="more" aria-expanded={goalsOpen} onclick={() => (goalsOpen = !goalsOpen)}>{v.more} {goalsOpen ? '▴' : '▾'}</button>{/if}</span>
    </div>
    <div class="days" aria-hidden="true">
      {#each v.pips as p, i (i)}
        <span class="day" class:done={p.state !== 'todo'} class:current={p.state === 'current'} class:rivalday={p.rival}></span>
      {/each}
    </div>
    <progress class="sr" max="100" value={v.pct} aria-label={v.earnedText}></progress>
  </div>

  {#if v.chip}
    <div class="rival">
      <button class="chipbtn" aria-expanded={open} onclick={() => (open = !open)}>
        <span aria-hidden="true">▲</span> {v.chip.label}
        <span class="hint">· {v.chip.hintLabel} {open ? '▴' : '▾'}</span>
      </button>
      {#if open}
        <div class="pop" role="note">
          {#if v.warning}<div class="first">{v.warning}</div>{/if}
          {#each v.hints as line}<div class="second">{line}</div>{/each}
        </div>
      {/if}
    </div>
  {/if}
</section>

{#if goalsOpen && v.open.length > 0}
  <ul class="goals">
    {#each v.open as q (q.id)}
      <li>
        <b>{q.name}</b> <span class="muted small">{q.desc}</span>
        {#each q.goals as g}<div class="small goal" class:done={g.done}>{g.text}</div>{/each}
        {#if q.reward}<div class="small reward">{q.reward}</div>{/if}
      </li>
    {/each}
  </ul>
{/if}

{#if v.newThings}
  <p class="week ok">{v.newThings}</p>
{/if}
{#if v.complete}<p class="week ok">{v.complete}</p>{/if}

<style>
  .more { background: none; border: 0; padding: 0; color: inherit; font: inherit; text-decoration: underline; cursor: pointer; min-height: 0; }
  .goals { list-style: none; margin: 0; padding: 10px 14px; display: flex; flex-direction: column; gap: 10px; border: 1px solid var(--line); border-radius: 12px; background: var(--panel2); font-size: 14px; }
  .goal.done { text-decoration: line-through; opacity: 0.6; }
  .reward { color: var(--ok); }
  .strip { display: flex; align-items: center; gap: 16px; padding: 0 6px; }
  .main { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
  .line { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; font-size: 14px; }
  .earned { font-size: 13px; }
  .days { display: flex; gap: 4px; }
  .day { flex: 1; height: 10px; border-radius: 5px; background: var(--line); }
  .day.done { background: color-mix(in srgb, var(--accent) 45%, var(--line)); }
  .day.current { background: var(--accent); }
  .day.rivalday { outline: 2px solid var(--warn); outline-offset: 1px; }
  .rival { position: relative; flex: none; }
  .chipbtn {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid var(--warn);
    color: var(--warn);
    background: var(--panel);
    font: 700 13px/1.2 var(--body);
  }
  .hint { color: var(--muted); font-weight: 500; }
  .pop {
    position: absolute;
    right: 0;
    top: 52px;
    width: 340px;
    max-width: calc(100vw - 32px);
    z-index: 5;
    background: var(--panel);
    border: 1px solid var(--warn);
    border-radius: 14px;
    padding: 14px 16px;
    font-size: 14px;
    line-height: 1.45;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
  }
  .first { color: var(--warn); font-weight: 700; }
  .second { margin-top: 6px; }
  .week { padding: 0 6px; color: var(--muted); font-size: 14px; }
  .week.ok { color: var(--ok); }

  /* Phone: the rival warning is a full-width collapsible row under the strip. */
  @media (max-width: 640px) {
    .strip { flex-direction: column; align-items: stretch; gap: 10px; padding: 0 2px; }
    .rival { width: 100%; }
    .chipbtn { width: 100%; min-height: 44px; border-radius: 14px; }
    .chipbtn .hint { margin-left: auto; }
    .pop { position: static; width: auto; max-width: none; margin-top: 8px; box-shadow: none; }
  }
</style>
