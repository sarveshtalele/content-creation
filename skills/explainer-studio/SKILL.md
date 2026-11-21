---
name: explainer-studio
description: Turn any pasted article, essay, URL or GitHub repo into a narrated Instagram Reel (MP4), an animated LinkedIn diagram GIF and a LinkedIn post, grounded in the source and reviewed before delivery. Use when the user shares content and wants a video, GIF, diagram or post.
---
# explainer-studio

Source in, grounded artifacts out. You write ONE compact `story.json`; scripts do everything else (deterministic, cached, validated, reviewed).

## 0. Which artifact?
If the user did not say which, ask once with the platform's question tool: **Reel (MP4) / GIF / LinkedIn post / All**. Never guess. Never use a frontend-design skill without asking first. Never add Co-Authored-By trailers to commits.

## 1. Run (S = this skill's folder, W = work dir)
```
python3 S/scripts/studio.py doctor                  # once; if NOT READY: sh S/scripts/setup.sh
python3 S/scripts/studio.py ingest SRC --out W      # SRC = URL | owner/repo | file | dir | - (stdin)
python3 S/scripts/studio.py pick W                  # GIF only: best diagram template + its field shape
python3 S/scripts/studio.py spec                    # limits for story.json (read once; --icons for icon names)
# read W/source.md once, write W/story.json (sections for the chosen artifacts only)
python3 S/scripts/studio.py check W                 # repeat until CHECK OK (prints only what to fix)
python3 S/scripts/studio.py build W --artifacts reel,gif,post   # or all
python3 S/scripts/studio.py review W                # gates + contact sheets; fix and rebuild until 100%
# LOOK at W/out/review/*.png, then write W/out/review/attest.json exactly as review prints it
python3 S/scripts/studio.py finalize W              # copies to W/final only if every gate passes AND the attestation matches
```
Deliver ONLY files from `W/final/` (send the files; put the post text in the reply). If `finalize` refuses, fix the cause and rebuild; never edit scripts, gates or the attestation to get past it, and never tick a checklist item you did not verify on the sheets.

## 2. story.json (details: references/schema.md, `studio.py spec`)
`meta{title,slug,url?,source_label}`, `beats[]` + `scenes[]` (Reel), `gif{}`, `post{}`. Include only what the requested artifacts need.
Arc, roles in order: **hook** (a question drawn from the source) -> **stakes** -> **answer** -> **how** (1-4) -> **proof** -> **takeaway** -> **engage** (last beat: ask the viewer a question or give a one-step challenge).
Narration: talk TO the viewer (you/your in 3+ beats), short spoken sentences (<=22 words), one idea per beat, contractions fine, no markdown, symbols or file extensions. `tts` only for pronunciation. 7-15 beats, 90-215 words; the Reel must stay <=90 s.
Grounding (enforced by `check`): every claim beat has `cite:[[chunkId, verbatim quote]]`; only facts, names and numbers from the source; on-screen text reuses source words.
Fix every FIX line, ignore nothing; do not edit scripts to pass checks.

## 3. GIF diagram (always 1080x1350, LinkedIn portrait, flowing-dot arrows, personal CTA footer)
Run `pick W` and use its template unless the source clearly fits another (then set `gif.template` and keep the reason in mind for the report):
- `pipeline` ordered steps / workflow / request path | `columns` catalogue grouped by category | `lanes` layers of a stack or ecosystem | `hub` one concept with named parts (files, settings, guarantees).
Every GIF text must reuse the source's own words. Pick icons by meaning (`spec --icons`). No source line is drawn. The Claude spark appears only when the source mentions Claude.

## 4. LinkedIn post
Built by script from `post{hook,bullets[{t,c}]}`: question hook, 3-6 arrow bullets (each cites chunks), link line if a URL exists, then the exact closing CTA lines. Do not rewrite the CTA.

## 5. Review gate (what "100% confident" means here)
`review` runs deterministic gates: story + accuracy metrics, GIF 4:5 size/readability/layout/animation, Reel 1080x1920, audio present, <=90 s, loudness and peak, speech-to-text match of every line, exact post CTA. It prints the failed gates only. At 100% it writes contact sheets; you view them and confirm legibility, no overlap/clipping, fidelity to the source, arrows following the logic. `finalize` also requires the attestation token to match the current files.

## 6. Report
List the final files plus `eval.md` headline numbers (claim support, recall@3, MRR, coverage). State plainly that the metrics are lexical proxies, not proof of truth, and that the visual check is a reviewer's look at stills.
