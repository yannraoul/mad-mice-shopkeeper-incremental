<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { unlockedQualities } from '../engine/economy.ts';
  import {
    doStep,
    hold,
    isComplete,
    nextStep,
    place,
    remaining,
    startSession,
    type CraftSession,
  } from '../craft/session.ts';
  import { game, dispatch } from './game.svelte.ts';
  import { describeFail } from './errors.ts';
  import ImageSlot from './ImageSlot.svelte';

  let station = $state(0);
  let candy = $state(content.candies[0]!.id);
  let quality = $state('plain');
  let session = $state<CraftSession | null>(null);
  // Stored as data, not text, so it is translated at render time and follows a language switch.
  type Note = { kind: 'made'; station: number; candy: string; quality: string };
  let note = $state.raw<Note | null>(null);

  const qualities = $derived(unlockedQualities(content, game.s));
  const st = $derived(game.s.stations[station]);
  const stType = $derived(content.stations.find((x) => x.id === st?.type));
  const batchesLeft = $derived(game.s.stations.reduce((n, x) => n + x.batchesLeft, 0));
  const stepName = (id: string) => {
    if (id === 'stir' || id === 'form') return t(`step.${id}`);
    const extra = content.qualities.flatMap((q) => q.extraSteps).find((x) => x.id === id);
    return extra ? t(extra.nameKey) : id;
  };
  const upcoming = $derived(session ? nextStep(session) : null);
  // Dry-run of Start for the current selection: disables the button and says why.
  const check = $derived(startSession(content, game.s, station, candy, quality));
  const blocked = $derived('error' in check ? check : null);
  const madeText = $derived(
    note
      ? t('craft.made', {
          qty: content.stations.find((x) => x.id === game.s.stations[note!.station]!.type)!.capacity,
          candy: t(`candy.${note.candy}`),
          quality: t(`quality.${note.quality}`),
        })
      : '',
  );

  function start() {
    if ('error' in check) return;
    note = null;
    session = check;
  }

  function tapShelf(ingredient: string) {
    if (session) session = hold(session, ingredient);
  }
  function tapStation() {
    if (session) session = place(session);
  }
  function runStep(id: string) {
    if (!session) return;
    session = doStep(session, id);
    if (isComplete(session)) {
      const { station: s, candy: c, quality: q } = session;
      session = null;
      if (dispatch({ type: 'craft', station: s, candy: c, quality: q })) note = { kind: 'made', station: s, candy: c, quality: q };
    }
  }
</script>

<section class="panel workshop">
  <h2>{t('craft.title')}</h2>

  {#if !session}
    {#if batchesLeft === 0}
      <p class="muted">{t('craft.noBatches')}</p>
    {:else}
      <h3>{t('craft.newBatch')}</h3>
      <div class="row">
        {#if game.s.stations.length > 1}
          <label>
            {t('craft.station')}
            <select bind:value={station}>
              {#each game.s.stations as inst, i}
                <option value={i}>{t(`station.${inst.type}`)} #{i + 1}</option>
              {/each}
            </select>
          </label>
        {/if}
        <label>
          {t('craft.candy')}
          <select bind:value={candy}>
            {#each content.candies as cd}<option value={cd.id}>{t(cd.nameKey)}</option>{/each}
          </select>
        </label>
        <label>
          {t('craft.quality')}
          <select bind:value={quality}>
            {#each qualities as q}<option value={q.id}>{t(q.nameKey)}</option>{/each}
          </select>
        </label>
        <button class="primary" onclick={start} disabled={!!blocked}>{t('craft.start')}</button>
      </div>
      {#if blocked}
        <p class="blocked">{t('craft.cannot', { error: describeFail(blocked.code, blocked.params) })}</p>
      {/if}
      <p class="muted">{t('craft.batchesLeft', { n: st?.batchesLeft ?? 0 })}</p>
      <h3>{t('craft.suppliesToday')}</h3>
      <ul class="contents">
        {#each content.ingredients as ing (ing.id)}
          <li>{t(ing.nameKey)}: {game.s.supply[ing.id] ?? 0}</li>
        {/each}
      </ul>
    {/if}
  {:else}
    <div class="bench">
      <div class="shelf">
        <h3>{t('craft.shelf')}</h3>
        <div class="items">
          {#each content.ingredients as ing (ing.id)}
            <button
              class="item"
              class:selected={session.held === ing.id}
              disabled={remaining(session, ing.id) <= 0}
              onclick={() => tapShelf(ing.id)}
            >
              <ImageSlot id={`ingredient-${ing.id}`} />
              <span>{t(ing.nameKey)}</span>
              <span class="muted">{t('craft.supply', { n: (game.s.supply[ing.id] ?? 0) - (session.placed[ing.id] ?? 0) })}</span>
            </button>
          {/each}
        </div>
      </div>

      <div class="station">
        <h3>{t('craft.inCauldron')}</h3>
        <button class="stationbtn" class:armed={!!session.held} onclick={tapStation}>
          <ImageSlot id={`station-${stType?.id}`} />
        </button>
        <ul class="contents">
          {#each Object.entries(session.need) as [ing, need]}
            <li>{t(`ingredient.${ing}`)}: {session.placed[ing] ?? 0} / {need}</li>
          {/each}
        </ul>
      </div>
    </div>

    <p class="hint">
      {#if upcoming}
        {t('craft.hint.step', { step: stepName(upcoming) })}
      {:else if session.held}
        {t('craft.hint.place', { station: t(`station.${stType?.id}`) })}
      {:else}
        {t('craft.hint.pick')}
      {/if}
    </p>
    <div class="row">
      {#each session.steps as id, i (id)}
        <button class:primary={upcoming === id} disabled={upcoming !== id} onclick={() => runStep(id)}>
          {i < session.done ? '✓ ' : ''}{stepName(id)}
        </button>
      {/each}
      <button onclick={() => (session = null)}>{t('craft.cancel')}</button>
    </div>
  {/if}

  {#if madeText && !session}<p class="message">{madeText}</p>{/if}
</section>

<style>
  .workshop { display: grid; gap: var(--gap); }
  label { display: grid; gap: 0.2rem; font-size: 0.9rem; }
  .bench { display: grid; gap: var(--gap); grid-template-columns: 1fr; }
  @media (min-width: 640px) { .bench { grid-template-columns: 1fr 1fr; } }
  .items { display: flex; flex-wrap: wrap; gap: var(--gap); }
  .item { display: grid; justify-items: center; gap: 0.15rem; padding: 0.5rem; }
  .stationbtn { padding: 0.25rem; border-width: 2px; }
  .stationbtn.armed { border-color: var(--accent); outline: 3px dashed var(--accent); }
  .contents { list-style: none; padding: 0; margin: 0.5rem 0 0; }
  .hint { margin: 0; font-weight: 600; }
  .message { margin: 0; color: var(--ok); }
  .blocked { margin: 0; color: var(--warn); }
</style>
