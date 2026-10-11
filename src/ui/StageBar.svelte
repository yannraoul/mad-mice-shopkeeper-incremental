<script lang="ts">
  import { content } from '../content/index.ts';
  import { i18n, t } from '../i18n/i18n.svelte.ts';
  import { currentStage, modifier, rivalPenalty } from '../engine/economy.ts';
  import { game } from './game.svelte.ts';
  import { rivalErrands, unlockName } from './names.ts';

  const s = $derived(game.s);
  const stage = $derived(currentStage(content, s));
  // Revenue shown includes today's sales so far (the week is judged after its last day).
  const earned = $derived(s.stage.revenue + s.report.revenue);
  const pct = $derived(Math.min(100, Math.round((earned / stage.target) * 100)));
  const dayNo = $derived(Math.min(s.stage.day + 1, stage.days));
  const rival = $derived(stage.rival);
  const relief = $derived(modifier(content, s, 'rivalRelief'));
  const today = $derived(s.stage.day + 1);
  const stolen = $derived(rival ? rivalPenalty(content, s, rival.ingredient) : 0);
  // The rival is announced before it starts (grace period) and a week ahead, so it is never a surprise.
  const startingSoon = $derived(rival && today < rival.startsOnDay && rival.amount - relief > 0 ? rival : null);
  const nextRival = $derived(content.stages[s.stage.index + 1]?.rival);
  const nextWeek = $derived(!rival && nextRival && today > stage.days - 3 && nextRival.amount - relief > 0);
  const threatened = $derived(stolen > 0 || !!startingSoon || !!nextWeek);
  const ingredientOf = (id: string) => t(`ingredient.${id}`).toLocaleLowerCase(i18n.lang);

  /** How the player can make the threat go away: one line per errand that relieves it. */
  const help = $derived(
    !threatened
      ? []
      : !s.unlocks.includes('errandsBoard')
        ? [t('stage.rivalHelp.needBoard')]
        : rivalErrands
            .filter((e) => s.errands[e.id]?.status !== 'done')
            .map((e) => {
              const name = t(e.nameKey);
              if (s.errands[e.id]?.status === 'active') return t('stage.rivalHelp.active', { name });
              const missing = e.requires.filter((u) => !s.unlocks.includes(u));
              return missing.length > 0
                ? t('stage.rivalHelp.locked', { name, unlock: missing.map(unlockName).join(', ') })
                : t('stage.rivalHelp.available', { name });
            }),
  );
  const week = $derived(s.stage.day === 0 ? s.lastWeek : null);
  // The ending text lives in an optional content pack (absent from preview builds).
  const ending = $derived(content.strings[i18n.lang]['ending.text']);
</script>

<section class="panel stage">
  <div class="line">
    {t('stage.progress', { name: t(stage.nameKey), day: dayNo, days: stage.days, revenue: earned, target: stage.target })}
  </div>
  <progress max="100" value={pct} aria-label={t(stage.nameKey)}></progress>

  {#if stolen > 0 && rival}
    <p class="warn">{t('stage.rival', { amount: stolen, ingredient: ingredientOf(rival.ingredient) })}</p>
  {:else if startingSoon}
    <p class="warn">
      {t('stage.rivalSoon', { amount: startingSoon.amount - relief, ingredient: ingredientOf(startingSoon.ingredient), day: startingSoon.startsOnDay })}
    </p>
  {:else if nextWeek}
    <p class="warn">{t('stage.rivalNextWeek')}</p>
  {/if}
  {#each help as line}<p class="hint">{line}</p>{/each}
  {#if week}
    <p class={week.passed ? 'ok' : 'note'}>
      {week.passed
        ? t('stage.lastWeekPassed')
        : t('stage.lastWeekMissed', { revenue: week.revenue, target: week.target })}
    </p>
  {/if}
  {#if s.completed}<p class="ok">{ending ?? t('stage.complete')}</p>{/if}
</section>

<style>
  .stage { display: grid; gap: 0.4rem; }
  progress { width: 100%; height: 0.7rem; accent-color: var(--accent); }
  p { margin: 0; }
  .ok { color: var(--ok); }
  .warn { color: var(--warn); }
  .hint { color: var(--accent); }
  .note { color: var(--muted); }
</style>
