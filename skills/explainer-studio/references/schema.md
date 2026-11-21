# story.json reference
Authoritative, current limits: `python3 scripts/studio.py spec` (and `pick DIR` for the GIF template shape). Examples that pass `check`: `fixtures/*.story.json` (https = Reel+GIF hub, catalog = columns, pipeline, layers = lanes).
- beats: `{id,role,say,cite:[[chunk,"verbatim quote"]],tts?,asr?}`. `tts` = respelling for the voice; `asr` = expected transcript if it differs. Last beat role is `engage`.
- scenes (Reel): `{id,type,beats:[ids],p:{...}}`. Types: hook, flow, map, cards, list, chips, dialog, big. Items may carry `cue` (a phrase from the scene's narration).
- gif: `template` (hub|columns|pipeline|lanes|ecosystem|framework), `title`, `subtitle`, plus the template block (`hub`+`cards`, `columns`, `pipeline`, `lanes`, `ecosystem`, `framework`; `studio.py pick DIR` prints the skeleton). GIF-only stories need no beats/scenes.
- post: `hook` (question) + `bullets[{t,c:[chunkIds]}]`.
Icons: `studio.py spec --icons`.
