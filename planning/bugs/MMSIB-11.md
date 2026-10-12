# MMSIB-11 — Recipe cost ignored the chosen quality; shelf pips moved mid-day; bar and Cancel placement

**Reported (playtest, follow-up to MMSIB-10):** (1) Recipe cards always said "2 honey" whatever quality was selected. (2) "No more honey" with dots visible: the user had completed the queen's quest during the same workshop phase. (3) Cancel should have a fixed place, aligned fully left. (4) The permanent bottom bar feels heavy on desktop.

**Root cause:** (1) `costText` was always computed for Plain. (2) The shelf drew `total` pips from today's modifiers; the queen's reward adds +2 honey a day immediately, but the stock only changes next morning, so the card suddenly showed more (empty) pips than the morning's delivery. (3) Cancel shared a row with a growing hint. (4) A full-width wood bar was reused from the phone layout.

**Fix:** (1) The card shows the cost at the selected quality. (2) The state remembers the morning delivery (`supplyToday`, save version 3 with a migration) and the pips use it, so a bonus bought mid-day does not move them. (3) Cancel is pinned to the left edge of the bench, the next step to the right. (4) On desktop the phase button floats at the bottom right of the content column with no bar; the phone keeps its bar.

**Verified:** Tests added for the cost text, the pip total after a mid-day bonus, and the v2 to v3 save migration; `npm run check` 0 errors, 163 tests, build clean. Not visually re-checked on a phone or in French.

**Open follow-up:** The floating button can cover the last line of a long page on small laptop heights (the page has bottom padding for it); say if it still feels in the way.
