<div align="center">

# explainer-studio

**Turn any article, docs page, repository or notes into scroll-stopping visuals, grounded in the source.**

Ranked GIF diagrams · chart carousels · narrated Reels with designed covers · verified walkthrough videos · LinkedIn posts

![Version](https://img.shields.io/badge/version-3.0.0-D97757)
![Python](https://img.shields.io/badge/python-3.11%20%7C%203.12%20%7C%203.13-3776AB?logo=python&logoColor=white)
![Node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=nodedotjs&logoColor=white)
![Agents](https://img.shields.io/badge/agents-Claude%20Code%20%7C%20Codex%20%7C%20Antigravity-141413)
![License](https://img.shields.io/badge/license-MIT-788C5D)

<img src="docs/img/demo.gif" alt="An animated funnel GIF made by explainer-studio" width="380">

</div>

---

## Contents

1. [What it makes](#what-it-makes)
2. [How it works](#how-it-works)
3. [Requirements](#requirements)
4. [Install](#install) · [Claude Code](#claude-code) · [Codex](#codex) · [Antigravity](#antigravity)
5. [First run](#first-run)
6. [Use it](#use-it): [slash commands](#slash-commands) · [Design Studio web app](#design-studio-web-app) · [command line](#command-line)
7. [Update, reinstall, clean, uninstall](#update-reinstall-clean-uninstall)
8. [Quality: checks, evaluations and end-to-end tests](#quality-checks-evaluations-and-end-to-end-tests)
9. [Project structure](#project-structure)
10. [Privacy and security](#privacy-and-security)
11. [Troubleshooting](#troubleshooting)
12. [Documentation](#documentation) · [Contributing](#contributing) · [License](#license)

---

## What it makes

| Media | Output | Highlights |
|---|---|---|
| **GIF** | 1080x1350 looping GIF (under 5 MB) + still PNG | 15 diagram templates (funnel, pipeline, orbit, exploded layers, skyline, conveyor, card grid…), **ranked for your content**; you choose |
| **Carousel** | PDF + one PNG per slide + first-comment text | 5 cover layouts and over 30 slide types, including **21 chart slides**: lollipop, dumbbell, slope, bullet, radar, sankey, alluvial, network, arc, flowchart, donut, waffle, treemap, sunburst, mind map, decision tree, timeline, Gantt, waterfall, line/area, heatmap |
| **Reel** | 1080x1920 MP4 with offline narration and subtitles | Claude light theme by default, kinetic word-by-word hook, masked scene reveals, camera push, animated counters, particles on connectors |
| **Reel cover** | 1080x1920 PNG per layout + poster JPG | Designed (not a video frame): hero, question, number, split, face; safe for the profile-grid crop and the Reels buttons |
| **Walkthrough video** | 1080x1920 MP4 + E2E report | A real guide run in a browser by **Playwright**: every step is performed, checked (expected vs actual) and shown with a cursor, a highlight and a Verified/Failed badge |
| **Post** | LinkedIn post text | Hook, short points with their sources, your exact closing CTA |

Every frame and slide carries **your brand CTA** (photo, name, tagline) at the bottom. Every word and every number comes from the source: the validator refuses text it cannot find there and data charts refuse invented figures.

## How it works

```mermaid
flowchart LR
  A[Source: URL, file, repo, text] --> B[ingest<br/>clean text + chunks]
  B --> C[decision matrix<br/>content shapes]
  C --> D{You choose<br/>template, charts,<br/>hooks, motion}
  D --> E[story.json<br/>written by your agent]
  E --> F[check<br/>grounding, limits, numbers]
  F --> G[render<br/>headless Chromium]
  G --> H[review gates<br/>layout, legibility, speech]
  H --> I[final/ files]
```

1. **Ingest** reads the source once and splits it into cited chunks.
2. **The decision matrix** (`data/matrix.json`) scores 19 content shapes, such as narrowing numbers, agent loops, A versus B, hierarchy or trends. It then ranks the GIF templates, carousel charts, Reel motion, hook families, the opening visual and the carousel structure that fit those shapes ([docs/DESIGN_MATRIX.md](docs/DESIGN_MATRIX.md)).
3. **You choose.** The agent shows the ranked options and asks before it builds anything.
4. **The agent writes one compact `story.json`** from the source. That is the only step that uses the model. Everything else is deterministic code.
5. **Check, render, review.** Text grounding, length limits and number grounding run first. The engine then renders in headless Chromium. Finally, the review gates check layout (overflow, overlap, empty cards), reading time, file size and speech-to-text.

## Requirements

| | Version | Notes |
|---|---|---|
| Python | 3.11 – 3.13 | standard library only for the installer |
| Node.js | 20 or newer (with npm) | rendering engine and Playwright |
| git | any | for `install.py update` |
| ffmpeg | 7 or newer | downloaded by setup when missing |
| Disk | about 600 MB | browser, voice model (350 MB) and runtime, in `~/.cache/explainer-studio` |

Works the same on macOS, Linux and Windows.

## Install

```bash
git clone https://github.com/<you>/explainer-studio.git
cd explainer-studio
python3 install.py install          # all agents; or --for claude | codex | antigravity
```

The installer copies the skill and the slash commands to each agent and records what it installed, so `update`, `reinstall` and `uninstall` know where to look. Run `python3 install.py status` at any time.

### Claude Code

**Option A: plugin (recommended).** You get automatic updates through the marketplace.

```bash
claude plugin marketplace add /path/to/explainer-studio
claude plugin install explainer-studio@explainer-studio-marketplace
```

**Option B: copy.** `python3 install.py install --for claude` writes:
- the skill to `~/.claude/skills/explainer-studio`
- the commands to `~/.claude/commands/explainer*.md`

Use one option, not both.

### Codex

```bash
python3 install.py install --for codex                    # ~/.agents/skills + ~/.codex/prompts
python3 install.py install --for codex --project ~/work/app   # also a workspace copy in .agents/skills
```

### Antigravity

```bash
python3 install.py install --for antigravity    # ~/.gemini/config/skills + ~/.gemini/antigravity/global_workflows
```

**ChatGPT (skill only).** Run `python3 install.py zip`, then upload `dist/explainer-studio-skill.zip` under Skills > Create > Upload. In its sandbox, run `python3 scripts/setup.py light`. That mode covers GIFs and carousels; Reels need a local agent.

## First run

```bash
python3 skills/explainer-studio/scripts/setup.py      # once: runtime, headless browser, voice model, ffmpeg
python3 skills/explainer-studio/scripts/studio.py doctor
```

`doctor` prints READY or exactly what is missing. In an agent, `/explainer-setup` does both.

Set your brand once. It is stored outside the repository:

```bash
python3 skills/explainer-studio/scripts/studio.py brand --name "Your Name" --tagline "What you post about" --avatar photo.png
```

## Use it

### Slash commands

| Command | What it does |
|---|---|
| `/explainer <url or text> [gif\|carousel\|reel\|cover\|post]` | Ingests the source, shows ranked options, asks you to choose, then builds and reviews |
| `/explainer-walkthrough <site and steps>` | Writes `steps.json`, asks for your OK, runs and verifies the guide, then renders the walkthrough Reel |
| `/explainer-studio` | Opens the Design Studio web app in the background |
| `/explainer-setup` | Runs setup and the health check |
| `/explainer-update` | Pulls the latest version and reinstalls for the same agents |
| `/explainer-clean` | Removes render folders and caches |
| `/explainer-uninstall` | Shows what will be removed, asks, then removes it |

These are the same commands in Claude Code (`/`), Codex prompts and Antigravity workflows.

### Design Studio web app

```bash
python3 skills/explainer-studio/scripts/studio.py studio    # prints a private 127.0.0.1 link
```

| Workspace | What you do there |
|---|---|
| **Home** | Paste a source. The decision matrix shows its shapes and the top picks for each media |
| **GIF** | Pick from all 15 templates, ranked with a fit bar and a reason. Choose a hook, then hand the request to your agent |
| **Carousel** | Pick a cover and up to five chart slides (ranked) and edit the content. Builds the PDF and PNGs directly |
| **Reel** | Pick a spoken hook, an opening visual, a format and a look. The matrix shows the motion it chose |
| **Reel cover** | Write a hook and render every layout directly |
| **Walkthrough video** | Build the steps in a form, then run, verify and render. Live progress, the video and the E2E report appear on the page |
| **Post** | Pick a hook and an optional image design |
| **Library** | Everything made on this computer, with previews and downloads |

The app is local only: it listens on 127.0.0.1, uses a random token for each session and refuses requests from other hosts.

### Command line

```bash
S=skills/explainer-studio/scripts
python3 $S/studio.py ingest https://example.com/article --out work
python3 $S/studio.py pick work                       # ranked GIF templates, carousel charts, Reel motion, hooks
python3 $S/studio.py pick work --template funnel     # limits + skeleton for your choice
python3 $S/studio.py hooks work --kind line|carousel|visual|format|structure
# write work/story.json, then:
python3 $S/studio.py check work
python3 $S/studio.py build work --artifacts gif,carousel,reel,post --background
python3 $S/studio.py review work && python3 $S/studio.py finalize work
python3 $S/studio.py cover work --layout hero        # Reel covers without rebuilding the Reel
python3 $S/studio.py walkthrough demo --steps steps.json --device mobile
```

A minimal `steps.json` for a walkthrough:

```json
{"title": "Add your first task", "sub": "Checked in a real browser",
 "steps": [
  {"say": "Open the app", "action": "goto", "url": "https://app.example.com", "expect": {"text": "No tasks yet"}},
  {"say": "Tap New task", "action": "click", "target": "#new", "expect": {"visible": "#title"}},
  {"say": "Type the task", "action": "fill", "target": "#title", "value": "Write release notes"},
  {"say": "Save it", "action": "click", "target": "Add task", "expect": {"text": "Write release notes"}}
 ]}
```

## Update, reinstall, clean, uninstall

| Command | Effect |
|---|---|
| `python3 install.py update` | `git pull --ff-only`, then reinstalls for the same agents. Stops if you have local changes |
| `python3 install.py reinstall` | Removes and installs again for the recorded agents and projects |
| `python3 install.py clean [--jobs] [--dry-run]` | Removes render folders (`.film-*`), caches and `__pycache__`. `--jobs` also removes Design Studio jobs older than 30 days |
| `python3 install.py uninstall [--for codex] [--dry-run]` | Removes the skill copies and commands |
| `python3 install.py uninstall --purge --yes` | Also removes your brand, the library index and the Design Studio jobs |
| `python3 install.py status` | Shows what is installed where, the version and the data folder |
| `python3 install.py zip` | Builds `dist/explainer-studio-plugin.zip` and `dist/explainer-studio-skill.zip` |

## Quality: checks, evaluations and end-to-end tests

| Layer | What runs | Where |
|---|---|---|
| Story check | text grounded in the source, length limits, chart schemas, **every chart figure found in the source** | `studio.py check` |
| Accuracy evaluation | claim support, overlap, recall@3, precision@3, MRR, coverage (lexical proxies) | `out/eval.md` |
| Review gates | 4:5 / 9:16 sizes, GIF under 5 MB, overflow, overlap, empty cards, reading time, animation present, speech-to-text match | `studio.py review` |
| Carousel quality | underfilled, oversized, low-contrast, small-text and soft-image checks | `studio.py e2e` |
| Walkthrough | each step performed and verified by Playwright, with a report (expected, actual, result, time) | `out/*-walkthrough-report.md` |
| Unit tests | content, matrix, platform, security, studio server | `skills/explainer-studio/tests/test_*.py` |
| End-to-end | builds every media, runs every gate and evaluation, drives the web app with Playwright and records a video | `tests/e2e/run_all.py` |

```bash
python3 skills/explainer-studio/tests/e2e/run_all.py              # writes ~/Downloads/explainer-studio-showcase/REPORT.md
```

The showcase folder holds every output (GIFs, carousels and the 21 chart slides, Reel, covers, walkthrough video, post), the review contact sheets, the evaluation reports and `app/app-tour.mp4`, a screen recording of the Playwright tour of the web app.

## Project structure

```
explainer-studio/
├── .claude-plugin/          plugin.json, marketplace.json (Claude Code)
├── .codex-plugin/           plugin.json (Codex)
├── commands/                slash commands, shared by Claude Code, Codex prompts and Antigravity workflows
├── skills/explainer-studio/
│   ├── SKILL.md             what the agent follows
│   ├── scripts/             CLI (studio.py), ingest, matrix, validator, hooks, cover, library, web app server, setup
│   ├── engine/              renderers: GIF templates, carousel + charts.js, reel.js, cover.js, walk.js, walk_run.mjs (Playwright)
│   ├── studio/              Design Studio web app (index.html + js/ modules) and sample thumbnails
│   ├── editor/              per-project story editor
│   ├── data/                matrix.json (decision matrix), hooks.json (hook library)
│   ├── config/  assets/     brand defaults, pronunciation, fonts, default avatar
│   ├── fixtures/            sources used by the tests (including a demo app for walkthroughs)
│   ├── runtime/             Node runtime (Playwright, ffmpeg-static), installed by setup
│   └── tests/               unit tests and tests/e2e (run_all.py, app_tour.mjs)
├── docs/                    architecture, templates, carousel schemas, design matrix, studio, customise, evaluation
├── install.py · install.sh  installer and lifecycle manager
└── README.md · CHANGELOG.md · SECURITY.md · CONTRIBUTING.md · CREDITS.md · LICENSE
```

## Privacy and security

- **Local by default.** Rendering, voice, checks and the web app run on your computer. The network is used only to fetch the sources you give and for the one-time setup downloads.
- **Sources are data.** Instructions found inside an article, repo or web page are never followed.
- **Walkthroughs** run only the steps you write, on `http(s)` pages (and local `file://` pages from the command line). Use test accounts: `"secret": true` blurs typed values in the video and keeps them out of the report.
- **The web app** binds to 127.0.0.1, checks a per-session token on every request, refuses other Host headers and serves only its own files, samples and jobs.

See [SECURITY.md](SECURITY.md) to report a problem.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `doctor` says a part is missing | run `setup.py`, then `doctor` again |
| `python` not found on Windows | use `py -3` |
| Voice install fails on Python 3.14 | install Python 3.12; setup picks it up |
| Browser download blocked by a proxy | set `PLAYWRIGHT_CHROME` to a `chrome-headless-shell` binary |
| A check fails with `not in the source` | use the source's own words and numbers, or a non-data chart |
| A walkthrough step fails | read `out/*-walkthrough-report.md`: it shows the expected and actual result for each step |
| Long Windows paths break the voice engine | keep the folder near the drive root or set `EXPLAINER_HOME` to a short path |

## Documentation

| Document | Topic |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | pipeline and components |
| [DESIGN_MATRIX.md](docs/DESIGN_MATRIX.md) | content shapes and how each media is chosen |
| [TEMPLATES.md](docs/TEMPLATES.md) | the GIF templates and their fields |
| [CAROUSEL.md](docs/CAROUSEL.md) | carousel slides, the 21 chart schemas and hook styles |
| [STUDIO.md](docs/STUDIO.md) | the Design Studio web app |
| [CUSTOMIZE.md](docs/CUSTOMIZE.md) | brand CTA, avatar, voice and hooks |
| [EVALUATION.md](docs/EVALUATION.md) | metrics and review gates |
| [AUDIT.md](docs/AUDIT.md) | v3 audit: what was fixed and why |

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). Before opening a pull request:

```bash
for t in skills/explainer-studio/tests/test_*.py; do python3 "$t"; done
python3 skills/explainer-studio/scripts/selftest.py
python3 skills/explainer-studio/tests/e2e/run_all.py --only gif,carousel,app
```

## License

MIT, see [LICENSE](LICENSE). Third-party components and their licences are listed in [CREDITS.md](CREDITS.md).
