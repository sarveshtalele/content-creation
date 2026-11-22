---
description: Turn an article, URL, repo or notes into a GIF, carousel, Reel, Reel cover or post with explainer-studio
argument-hint: <url | file | pasted text> [gif|carousel|reel|cover|post]
---
Use the **explainer-studio** skill on: $ARGUMENTS

1. Ingest the source (`studio.py ingest`) and run `studio.py pick DIR` (the decision matrix).
2. Show me the ranked options for the media I asked for (GIF templates, carousel chart slides, Reel motion, hooks) and **ask me to choose**. Build only what I asked for; with no media named, build the GIF.
3. Write `story.json` from the source only, run `studio.py check` until it passes, build in the background, review the sheets, then finalize and list the files in `final/`.
