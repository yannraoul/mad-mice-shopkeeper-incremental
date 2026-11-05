<script lang="ts">
  import type { FinaleView } from '../view/finale.ts';

  // The end of the preview build: no story, a name field and the code the player sends back (MMSIM-38).
  let { finale, onclose }: { finale: FinaleView; onclose: () => void } = $props();

  let name = $state('');
  let copied = $state(false);
  const code = $derived(finale.codeFor(name));

  let input = $state<HTMLInputElement>();
  $effect(() => input?.focus());

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      /* the code is selectable text: copying by hand still works */
    }
  };
  const onkey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onclose();
  };
</script>

<svelte:window onkeydown={onkey} />

<div class="finale" role="dialog" aria-modal="true" aria-label={finale.title}>
  <div class="panel">
    <h2>{finale.title}</h2>
    {#each finale.lines as line}<p class="line">{line}</p>{/each}

    <label class="field">
      <span>{finale.nameLabel}</span>
      <input bind:this={input} bind:value={name} maxlength="40" autocomplete="off" spellcheck="false" placeholder={finale.nameHint} />
    </label>

    <div class="codebox" aria-live="polite">
      <span class="label">{finale.codeLabel}</span>
      <output class="code" class:empty={!code}>{code ?? '····-····-····-····'}</output>
      <button class="btn sm" onclick={copy} disabled={!code}>{copied ? finale.copiedLabel : finale.copyLabel}</button>
    </div>

    <button class="btn big go" onclick={onclose}>{finale.closeLabel}</button>
  </div>
</div>

<style>
  .finale { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; padding: 16px; background: #1a1008; color: #fff7e0; overflow-y: auto; animation: appear 0.8s ease-out; }
  .panel { width: min(480px, 100%); display: flex; flex-direction: column; gap: 14px; text-align: center; }
  h2 { margin: 0; font: 700 26px/1.2 var(--display, var(--body)); }
  .line { margin: 0; line-height: 1.5; opacity: 0.9; }
  .field { display: flex; flex-direction: column; gap: 6px; text-align: left; font-weight: 600; }
  input { min-height: 44px; padding: 0 12px; border-radius: 10px; border: 1px solid rgba(255, 247, 224, 0.4); background: rgba(255, 255, 255, 0.08); color: inherit; font: 600 16px var(--body); }
  .codebox { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px; border-radius: 12px; background: rgba(0, 0, 0, 0.35); border: 1px dashed rgba(255, 247, 224, 0.4); }
  .label { font-size: 13px; opacity: 0.75; }
  .code { font: 700 26px/1.2 ui-monospace, Consolas, monospace; letter-spacing: 0.08em; user-select: all; }
  .code.empty { opacity: 0.35; }
  .go { align-self: center; margin-top: 6px; }
  @keyframes appear { from { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .finale { animation: none; } }
</style>
