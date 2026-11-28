# Command reference

`S` = `skills/content-creation` (or the installed copy, such as `~/.claude/skills/content-creation`). `W` = a work folder.
On Windows, use `py -3` instead of `python3`. Every command is standard-library Python. Renders run through the shared runtime that `setup.py` installs.

## The pipeline, in order

```bash
python3 S/scripts/studio.py doctor                     # once: READY, or exactly what is missing
python3 S/scripts/studio.py ingest SRC --out W         # URL | owner/repo | file | dir | - (stdin)  -> W/source.md
python3 S/scripts/studio.py pick W                     # ranked designs for this source (decision matrix)
python3 S/scripts/studio.py catalog                    # every design with its ID and sample
python3 S/scripts/studio.py pick W --template NAME     # limits + skeleton for the chosen GIF template
python3 S/scripts/studio.py plan W                     # plan.md: questions, then the Agreed section
python3 S/scripts/studio.py gate W                     # stamps plan.md; you type: approve plan XXXX
python3 S/scripts/studio.py check W                    # grounding, limits, numbers, logos (repeat until CHECK OK)
python3 S/scripts/studio.py build W [--artifacts gif|carousel|reel|post|all] [--background]
python3 S/scripts/studio.py review W                   # gates + contact sheets; prints approve final XXXX
python3 S/scripts/studio.py finalize W                 # only after approve final and attest.json
```

## `studio.py` commands

| Command | Options | What it does |
|---|---|---|
| `doctor` | `--for carousel\|gif\|reel\|all` | Environment check. Exit 0 means ready for those artifacts |
| `spec` | `--icons`, `--logos [QUERY]` | Compact `story.json` limits; the line-icon names; official logos matching QUERY |
| `logos` | `[QUERY]`, `--add NAME[,NAME]`, `--import DIR` | Search, fetch or import official logos ([LOGOS.md](LOGOS.md)) |
| `ingest SRC` | `--out W`, `--max-chars N` (36000) | Reads a URL, GitHub repo, file, folder or stdin once into cited chunks. SSRF guard, secrets redacted |
| `pick W` | `--template NAME` | Decision matrix: ranked GIF templates, carousel charts, Reel motion and hooks, with the reason. Never chooses for you |
| `plan W` | | Writes `plan.md` with the questions and the **Agreed** section ([APPROVAL_GATES.md](APPROVAL_GATES.md)) |
| `gate W` | | Stamps `plan.md` with its approval code, makes `W` the active project, shows both gates |
| `check W` (or `eval`) | | Validates `story.json`; prints only what to fix |
| `build W` | `--artifacts gif,carousel,reel,post,all`, `--format pdf\|images\|both`, `--slide N`, `--background` | Renders. Needs an approved plan (exit 3 otherwise). Copies finished files to `./outputs/<slug>/` |
| `jobstatus W` | | Status of a `--background` build |
| `review W` | | Review gates (layout, legibility, file size, speech) and contact sheets; prints the token and `approve final XXXX` |
| `finalize W` | | Copies the reviewed files to `W/final/` with a manifest. Needs `approve final` and a matching `attest.json` |
| `thumbs W` | `--sizes youtube,og,newsletter,devto,hashnode`, `--layouts face,number,diagram,versus,editorial,banner`, `--text "3-6 words"` | Thumbnails, blog covers and the LinkedIn newsletter banner ([THUMBNAILS.md](THUMBNAILS.md)). Needs an approved plan |
| `cover W` | `--layout hero\|question\|number\|split\|face`, `--hook TEXT` | Designed Reel covers without rebuilding the Reel. Needs an approved plan |
| `walkthrough W` | `--steps steps.json`, `--device mobile\|desktop`, `--strict` | Runs a step-by-step guide in a real browser, verifies every step, renders the walkthrough Reel and an E2E report |
| `brand` | `--name`, `--tagline`, `--follow`, `--avatar FILE`, `--photo FILE`, `--cta LINE` (repeat), `--voice`, `--speed`, `--reset` | Your CTA, avatar, banner photo and narrator ([CUSTOMIZE.md](CUSTOMIZE.md)) |
| `hooks [TEXT\|W]` | `--kind carousel\|line\|visual\|format\|structure`, `-n N` | Hook patterns that fit the topic |
| `resources W URL...` | `--title`, `--per-link N` | Builds a source from several links, for a resource carousel |
| `edit W PATH VALUE` | `--build ARTIFACT`, `--slide N` | Changes one field of `story.json`, then optionally rebuilds |
| `editor W` | `--port`, `--no-open`, `--status`, `--stop` | Local browser editor for every field (private link) |
| `studio` | `--port`, `--no-open`, `--status`, `--stop` | Design Studio web app in the background ([STUDIO.md](STUDIO.md)) |
| `readercard W NAME SPEC` | | A labelled summary card image for a link carousel |
| `shot W NAME URL` | `--size WxH` | A framed screenshot of a public page |
| `e2e W` | | Carousel quality check: underfilled, oversized, low contrast, small text, soft images |
| `catalog` | | Regenerates `studio/catalog.html` and prints its path |

Exit codes: `0` ok, `1` failed, `2` invalid input, `3` refused by a gate (approval missing, or a strict walkthrough with failed steps).

## Other scripts

| Script | What it does |
|---|---|
| `scripts/setup.py [light\|asr]` | One-time install: Chromium, voice model (checksummed), node modules, Python deps. `light` = GIF and carousel only; `asr` = the optional speech check |
| `scripts/selftest.py` | Offline self-test: every fixture ingests, checks and picks; a build without an approved plan is refused |
| `scripts/gate_hook.py prompt\|tool --harness ...` | The approval hook ([APPROVAL_GATES.md](APPROVAL_GATES.md)); your agent runs it, you do not |
| `scripts/logos.py` | Logo library self-check |
| `scripts/studio_jobs.py [design-id\|reelcovers\|thumbs]` | Regenerates Design Studio samples |
| `scripts/gif_samples.py [fixture]` | Regenerates GIF samples (still + motion clip) |
| `tests/e2e/run_all.py [--only gif,carousel,charts,arch,thumbs,banner,reel,walkthrough,app]` | The end-to-end suite ([EVALUATION.md](EVALUATION.md)) |

## `install.py`

| Command | Options | What it does |
|---|---|---|
| `install` | `--for claude,codex,antigravity\|all`, `--project DIR`, `--setup` | Skill, commands and approval hooks for each agent; removes old `explainer-studio` copies |
| `update` | `--no-pull` | `git pull --ff-only`, then reinstall for the same agents |
| `reinstall` | | Install again for the same agents and projects |
| `status` | | Version and install locations |
| `clean` | `--jobs`, `--dry-run` | Remove render folders and caches |
| `uninstall` | `--for ...`, `--purge`, `--yes`, `--dry-run` | Remove the skill, commands and our hooks (`--purge` also removes your data folder) |
| `zip` | | Builds `dist/content-creation-plugin-<version>.zip`, `dist/content-creation-skill-<version>.zip` and `dist/SHA256SUMS.txt` |

## Environment variables

| Variable | Default | Used for |
|---|---|---|
| `CONTENT_CREATION_HOME` | `~/.cache/content-creation` | brand, photo, library index, runtime, approval context |
| `CONTENT_CREATION_OUTPUTS` | `./outputs` | where `build` and `thumbs` copy the finished files |
| `CONTENT_CREATION_MODELS` | `<home>/models` | the voice model |
| `CONTENT_CREATION_ASR_MODEL` | `<home>/asr/...` | the optional speech-check model |

The pre-4.0 names (`EXPLAINER_HOME`, `EXPLAINER_OUTPUTS`, `EXPLAINER_MODELS`, `EXPLAINER_ASR_MODEL`) are still read.
