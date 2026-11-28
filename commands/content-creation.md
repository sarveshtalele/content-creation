---
description: Turn an article, URL, repo or notes into a GIF, carousel, Reel, Reel cover or post with content-creation
argument-hint: <url | file | pasted text> [gif|carousel|reel|cover|thumbnail|architecture|post]
---
Use the **content-creation** skill on: $ARGUMENTS

1. Ingest the source (`studio.py ingest`) and run `studio.py pick DIR` (the decision matrix).
2. Run `studio.py catalog` and give me the path to the design catalogue page (every design with its ID and a real sample). Show me the ranked options for the media I asked for (GIF templates, carousel cover and chart slides, Reel cover layout, look and motion, hooks). **Ask me which design IDs to use and wait for my answer. Never build before I choose.** Build only what I asked for; with no media named, ask which media I want.
3. Write `story.json` from the source only, run `studio.py check` until it passes, build in the background, review the sheets, then finalize and list the files in `final/`.
