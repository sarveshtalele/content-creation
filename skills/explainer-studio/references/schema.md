# story.json reference
Run `python3 scripts/studio.py spec` for the authoritative, current limits. Example: `fixtures/sample_story.json` (passes `check`).
- beats: `{id,role,say,cite:[[chunk,"verbatim quote"]],tts?,asr?}`. `tts` = respelling for the voice; `asr` = expected transcript if it differs.
- scenes: `{id,type,beats:[ids],p:{...}}`. Types: hook, flow, map, cards, list, chips, dialog, big. Items may carry `cue` (a phrase from the scene's narration) so they appear when spoken.
- gif: title, subtitle, groups{blue,green,clay -> label}, hub{title,steps[3],tagline}, cards[5|7|9] (slot 0-2 top, 3-6 sides, 7 wide, 8 narrow), source{label}. Card text limits differ by slot (check tells you).
- post: hook (question) + bullets[{t,c:[chunkIds]}].
Icons: `studio.py spec --icons`.
