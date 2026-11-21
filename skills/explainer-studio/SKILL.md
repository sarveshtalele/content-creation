---
name: explainer-studio
description: Turn any pasted article, essay, URL or GitHub repo into a narrated Instagram Reel (MP4), an animated LinkedIn GIF and a LinkedIn post, grounded in the source. Use when the user shares content and wants a video, GIF or post.
---
# explainer-studio

Source in, grounded artifacts out. You write ONE compact `story.json`; scripts do everything else (deterministic, cached, validated).

## 0. Which artifact?
If the user did not say which, ask once with the platform's question tool: **Reel (MP4) / GIF / LinkedIn post / All**. Never guess. Never use a frontend-design skill without asking first. Never add Co-Authored-By trailers to commits.

## 1. Run (S = this skill's folder)
```
python3 S/scripts/studio.py doctor                  # once; if NOT READY: sh S/scripts/setup.sh
python3 S/scripts/studio.py ingest SRC --out W      # SRC = URL | owner/repo | file | dir | - (stdin). W = work dir
python3 S/scripts/studio.py spec                    # limits for story.json (read once; add --icons for icon names)
# read W/source.md once, write W/story.json (see below)
python3 S/scripts/studio.py check W                 # repeat until CHECK OK (prints only what to fix)
python3 S/scripts/studio.py build W --artifacts reel,gif,post   # or all
```
Pasted text: save to a file or pipe to `ingest -`. Outputs land in `W/out/`: `<slug>-reel.mp4`, `-linkedin.gif`, `-subtitles.srt`, `-poster.jpg`, `-linkedin-post.txt`, `eval.md`. Deliver them to the user (send the files), plus the post text in the reply.

## 2. story.json (details: references/schema.md, `studio.py spec`)
`meta{title,slug,url?,source_label}`, `beats[]` (narration), `scenes[]` (Reel visuals), `gif{}`, `post{}`.
Storytelling arc, roles in order: **hook** (a question drawn from the source) → **stakes** → **answer** → **how** (1-4) → **proof** → **takeaway**. 6-14 beats, 7-32 words each, 90-210 words total.
Grounding rules (enforced by `check`):
- Every claim beat has `cite:[[chunkId, verbatim quote]]` from source.md. The hook needs none.
- Use only facts, names and numbers in the source. No outside knowledge, no invented stats.
- On-screen text (scene props, GIF, post) reuses source words.
- Narration is plain spoken English: no markdown, no file extensions, no symbols; contractions fine. Use `tts` override only for pronunciation.
Fix every FIX line, ignore nothing; re-run `check`. Do not edit scripts to pass checks.

GIF rules (enforced): always 1080x1350 LinkedIn portrait (4:5), exactly 9 cards, hub tagline required. Every GIF text must reuse the source's own words (check fails otherwise); group labels too. Pick icons that match the meaning (`spec --icons`). Card order follows the narration order. The Claude spark logo shows only when the source mentions Claude.

## 3. LinkedIn post
Built by script from `post{hook,bullets[{t,c}]}`: question hook, 3-6 arrow bullets (each cites chunks), source link line if a URL exists, then the exact closing CTA lines. Do not rewrite the CTA.

## 4. Report
Tell the user the artifacts plus the `eval.md` headline numbers (claim support, recall@3, MRR, coverage). State plainly that metrics are lexical proxies, not proof of truth.
