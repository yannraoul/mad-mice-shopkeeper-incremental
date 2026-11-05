# MMSIM-37 — Where to click: sleeping mice, a bobbing arrow, a call-out on a new helper

Motivation: the white glints in the workshop zones (1 px, visible about a fifth of the time, gone as soon as any zone is hovered) do not tell a player that a zone can be clicked or what it does. Design written first in `docs/incremental-game.md` ("Where to click").

- IN (all in `src/ui/Scene.svelte`, no engine or save change):
  - Every hired mouse is always on the scene. One whose step is by hand sleeps (half opacity, desaturated) and wakes with the work preview on hover, so a zone is never an empty spot.
  - A bobbing arrow (accent colour, CSS triangle, 2-step bob) over each zone the player has never clicked; hidden on hover/focus and for good after a click on that zone. Kept in `localStorage` (`zonesTouched`, per browser, wrapped in try/catch), not in the save: a new game on the same browser does not bring the arrows back. It is a hint, not game state.
  - When a helper is hired, its zone pulses and shows its label for 8 s. Zones present at load are not called out (a `known` set filled on the first view). The arrow moves down under the label during the call-out.
  - Reduced motion turns the pulse and the bob off.
- OUT: a toast or sound on hiring, showing the arrow only when the player can afford or has nothing else to do, phone-specific placement (the on/off dot stays).
- Verified: `npm run check`, `npm run check:content`, `npm test`; in the browser with a dev game (`?unlocks=auto-fill,auto-stir,auto-oven,auto-pull,auto-form&stage=2`): five arrows over the five zones, clicking the porter zone stored `fill`, removed its arrow and put that mouse to sleep. Not checked: the hiring call-out in play (no dev hook hires a helper mid-game), phone width.
- Open: whether the arrow should wait until the first batch is started, so it does not compete with the "Start a batch" button.
