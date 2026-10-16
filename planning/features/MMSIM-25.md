# MMSIM-25 — Day transitions: the shop sign and the night sky

Motivation: the day moves between morning, afternoon and evening with no sense of passing time (playtest ideas, 2026-10-16; see `planning/BACKLOG.md`). CSS placeholders to feel the pacing; the final look will be pixel art.

- IN:
  - `src/ui/PhaseTransition.svelte`, mounted in `App.svelte`: a fixed, non-blocking overlay (pointer events pass through, the game runs underneath) that plays when the phase changes. Morning to afternoon: the shop sign drops, flips from Closed to Open and goes back up (2.4 s). Afternoon to evening: Open to Closed. Evening to the next morning: dusk, the sun sets, the moon crosses the sky, the sun rises (4.2 s). Only for those exact changes on the same day (or day + 1 for the night), so New game or an import does not play one. `prefers-reduced-motion` skips them. A newer change replaces a running one.
  - Strings `transition.open` / `transition.closed` (EN, FR).
  - `docs/art/prompt-accounting-mouse.md`: the Pixellab prompts and sizes for the accounting mouse picture behind the journal card (208 x 128, with and without the mouse).
- OUT: the accounting mouse itself and the journal card background (waiting for the art), the counter scene, pixel art for the sign and the sky, sounds.
- Verified: `npm run check`; in the browser (`?endgame=1`) all three transitions appear on the matching phase change and clear themselves. Not checked: phone layout, dark and light, the full night sequence visually.
