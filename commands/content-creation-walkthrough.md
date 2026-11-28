---
description: Record a verified step-by-step guide of a website as a Reel (Playwright runs and checks every step)
argument-hint: <url and the steps to show>
---
Use the content-creation skill to make a walkthrough video for: $ARGUMENTS

1. Write `steps.json` (`title`, `sub`, 2-12 `steps` with `say`, `action` goto|click|fill|press|hover|scroll|wait, `target`/`url`/`value`, and an `expect` check per step where the result is visible). Show it to me and wait for my OK.
2. Never type real passwords or personal data: use test accounts and `"secret": true` for anything typed that must not appear.
3. Run `studio.py walkthrough DIR --steps steps.json` in the background. Report the verified count and the E2E report; failed steps stay visible as failed.
