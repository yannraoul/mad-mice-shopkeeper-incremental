# MMSIB-10 — Playtest batch 1: action placement, rival pip, empty rail, unclear errors

**Reported (playtest, French UI):** (1) "Ensuite: remuer" looks like a button but only the "Remuer" button works. (2) "Ouvrir/Fermer la boutique" is at the top of the page, far from the workshop. (3) Evening screen is narrower than the header and left-aligned on wide screens. (4) Honey dots overflow their card after the queen's quest raises daily honey. (5) "No more honey" shown while two dots are visible. (6) On day 3 of week 2 the day track after the red rival marker is no longer filled. (7) Week number not shown. (8) "Start over" does not work.

**Root cause:**
1. The bench showed a coloured "Next: X" banner next to a separate step button, and a Cancel button pushed to the right.
2. The phase button lived in the header on desktop (only phones had the bottom bar).
3. The evening's right column rendered even when empty (map and errands not bought), reserving about a third of the width.
4. Round pips never wrapped.
5. Not reproduced as such. The likely reading: "Not enough honey" is raised when a batch needs more than what is left (brittle needs 3, 2 dots left), with no numbers. Empty pips were also grey filled discs that looked like stock.
6. The rival-day pip carried the class `rival`, which collided with the `.rival` rule of the warning chip wrapper (`flex: none`), so that pip collapsed to zero width; completed days also had no style.
7. Only the stage name and day were shown.
8. Not reproduced: the button works with the dialog accepted. Suspect: the native `confirm()` is blocked or dismissed by the browser and then silently returns false.

**Fix:** (1) Cancel left, the next step as one primary button ("Next: Stir →") on the right, always active; while placing ingredients the hint is plain text. (2) The phase button is now in a bottom bar on every screen width. (3) The evening rail is only rendered when it has content. (4) Pips wrap; empty round pips are hollow rings. (5) The error now says what is needed: "Not enough honey: this batch needs 3, you have 2." (6) Pip class renamed `rivalday`, completed days are tinted. (7) The stage strip reads "… · week 2 · day 3 / 7". (8) Confirmation is an in-page panel (New game / Cancel).

**Verified:** `npm run check` 0 errors, 161 tests pass (error params and wording updated), build clean. Browser (dev server): rival-day pip now as wide as the others, bench shows Cancel + "Next: Stir →", evening tree as wide as the header with no map or errands, start over confirms and resets to week 1. Not verified: French screenshots, phone width, the honey dot overflow at 8+ dots, and (5) and (8) on the user's machine.

**Open follow-up:** If "no more honey" was a different message than "Not enough honey", say which one. The evening is still three branches (see the planned 4-branch tree); the bottom bar on desktop is a first try, easy to move back if it feels heavy.
