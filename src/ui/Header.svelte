<script lang="ts">
  import type { Lang } from '../content/schema.ts';
  import type { HeaderView } from '../view/header.ts';
  import { setLang } from '../i18n/i18n.svelte.ts';
  import { media } from './media.svelte.ts';

  let { header, onsettings }: { header: HeaderView; onsettings: () => void } = $props();

  const logo = `${import.meta.env.BASE_URL}brand/app-icon.svg`;
  // The language button shows the current language and switches to the next one.
  function nextLang() {
    const i = header.languages.findIndex((l) => l.value === header.language);
    setLang(header.languages[(i + 1) % header.languages.length]!.value as Lang);
  }
</script>

<header class="hud">
  <div class="brand">
    <img src={logo} alt="" width={media.narrow ? 40 : 48} height={media.narrow ? 40 : 48} />
    <h1>{header.title}</h1>
  </div>

  <div class="tools">
    <div class="day">
      <span class="overline">{header.dayLabel}</span>
      <span class="num">{header.dayNo}<span class="of"> / {header.dayOf}</span></span>
    </div>
    <ol class="phases" aria-label={header.phase}>
      {#each header.phases as p (p.id)}
        <li class:active={p.active} aria-current={p.active ? 'step' : undefined}>{p.label}</li>
      {/each}
    </ol>
    <div class="coins" role="status">
      <span class="coin" aria-hidden="true"></span>
      <span class="num">{header.coins}</span><span class="unit">{header.coinsLabel}</span>
    </div>
    {#if !media.narrow}
      <button class="btn2" onclick={nextLang} aria-label={header.languageLabel}>{header.language.toUpperCase()}</button>
    {/if}
    <span class="break" aria-hidden="true"></span>
    <button class="btn2 settings" onclick={onsettings} aria-label={header.settingsLabel}>
      {#if media.narrow}<span aria-hidden="true" class="gear">⚙</span>{:else}{header.settingsLabel}{/if}
    </button>
  </div>
</header>

<style>
  .hud {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 16px;
    background: var(--wood);
    border: 1px solid var(--line);
    border-radius: 18px;
    box-shadow: var(--frameShadow);
    padding: 12px 16px 12px 20px;
  }
  .brand { display: flex; align-items: center; gap: 12px; flex: none; }
  .brand img { display: block; border-radius: 13px; box-shadow: 0 3px 0 rgba(0, 0, 0, 0.35); }
  h1 { font: 400 19px/1 var(--display); white-space: nowrap; }
  .tools { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-left: auto; }
  .break { display: none; }
  .day { display: flex; flex-direction: column; gap: 2px; }
  .day .overline { letter-spacing: 0.08em; }
  .num { font: 400 22px/1 var(--display); }
  .of { color: var(--muted); font-size: 14px; }
  .phases {
    display: flex;
    gap: 2px;
    margin: 0;
    padding: 4px;
    list-style: none;
    background: var(--panel2);
    border-radius: 999px;
  }
  .phases li { padding: 9px 13px; border-radius: 999px; font: 700 14px/1.2 var(--body); color: var(--muted); }
  .phases li.active { background: var(--btn); box-shadow: var(--btnShadow); color: var(--accentInk); }
  .coins {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--panel2);
    border-radius: 999px;
    padding: 6px 16px 6px 8px;
  }
  .coin { width: 26px; height: 26px; border-radius: 50%; background: var(--accent); box-shadow: inset 0 0 0 3px var(--accentInk); opacity: 0.95; flex: none; }
  .unit { font-size: 13px; color: var(--muted); }

  @media (max-width: 640px) {
    .hud { border-radius: 18px; padding: 10px 12px; gap: 10px; }
    .brand { flex: 1; min-width: 0; }
    h1 { font-size: 17px; white-space: normal; flex: 1; line-height: 1.1; }
    /* Row 1: logo, title, coins, settings. Row 2: day + phase pill. */
    .tools { display: contents; }
    .coins { order: 2; padding: 4px 12px 4px 6px; }
    .coins .num { font-size: 18px; }
    .coin { width: 22px; height: 22px; }
    .coins .unit { display: none; }
    .settings { order: 3; width: 44px; padding: 0; }
    .gear { font-size: 22px; line-height: 1; }
    .break { display: block; order: 4; flex-basis: 100%; height: 0; }
    .day { order: 5; flex-direction: row; align-items: baseline; gap: 6px; flex: none; }
    .phases { order: 6; flex: 1; min-width: 0; }
    .phases li { flex: 1; text-align: center; padding: 10px 4px; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  }
</style>
