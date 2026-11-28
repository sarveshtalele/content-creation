# content-creation audit (v3, Phase 1)

Date: 2026-11-22. Scope: every renderer in `skills/content-creation/engine`, the carousel/cover/GIF/Reel samples, the Design Studio web app and the test suites.

## Fixed in Phase 1

| # | Area | Problem | Fix |
|---|---|---|---|
| 1 | Reel cover | `<slug>-poster.jpg` was a frame grabbed 2 s into scene 3: half-built diagram, cut caption ("reads code,"), ~40% empty canvas | New designed cover (`engine/cover.js`, `scripts/cover.py`): 5 layouts (hero, question, number, split, face), safe zone y 300-1560, rendered after every Reel build and on demand with `studio.py cover W --layout X` |
| 2 | Carousel funnels | `tower` (cut-away building with crowd, plants, railings, sharp 2-3 px corners) unreadable at phone size; `ring` and flat `funnel` looked unrelated | One glossy 3D `cone` funnel: rounded slices with gaps, lit gradient, numbered slices, curved leaders to cards (icon, title, line, figure). `ring`, `tower`, `funnel` slides are drawn as the cone |
| 3 | GIF funnel | Flat drums, near-black opening, no stage numbers | Same cone look: glossy gradient, slice gaps with lids, rim light, numbers fade in with each slice |
| 4 | Corners | SVG polygons (iso boxes, conveyor, skyline, tower) and every L/H/V connector had sharp corners | `kit.path()` now rounds every elbow (`roundD`), polygon helpers draw rounded paths (`roundPts`), and all SVG joins are round via CSS |
| 5 | Text wrapping | Long URLs and commands (`irm https://claude.ai/install.ps1 \| iex`) broke mid-word or overflowed | `kit.brk()` adds break points after `/ . : _ - ? = &` in tokens of 18+ characters, in both `tx` and `measure` |
| 6 | Compare slide | Cards filled ~45% of the slide; `fitBody` could not scale it up because it is already full width | Cards stretch to at least 640 px tall and spread their items; item text up to 42 px |
| 7 | Number cover | Would count list items to invent a figure | Offered only when the story has a real figure |

## Fixed in Phase 2

| # | Area | Fix |
|---|---|---|
| 8 | GIF picker | `studio.py pick` prints every template ranked with a reason (matrix + structure + variety penalty for the last three builds) and tells the agent to ask; `--template NAME` prints the skeleton for the person's choice |
| 9 | Hooks | `data/hooks.json` adds 12 visual hooks, 16 Reel formats and 37 carousel structures; `studio.py hooks DIR --kind line|carousel|visual|format|structure` boosts the families the matrix chose |
| 10 | Chart types | 21 chart slides in `engine/charts.js` (comparison, flow/network, composition/hierarchy, time/process), each with limits in the validator and a rendered sample (`studio/samples/chart-*.jpg`) |
| 11 | Decision matrix | `data/matrix.json`: 19 content shapes x carousel slides, GIF templates, Reel motion, hook families, visual hook, structure; `docs/DESIGN_MATRIX.md` generated from it; `studio.py plan` uses it |
| 15 | Terminal slide | Lines and gaps grow until the window fills about 90% of the space |
| new | Invented figures | Data charts are refused when a shown or plotted number is not in the source |

## Fixed in Phase 3

| # | Area | Fix |
|---|---|---|
| 12 | Reel motion | Kinetic word-by-word hook with a highlight sweep, masked scene reveals, camera push and drift, background parallax, animated counters (10 and up), particles on flow and map connectors; Claude light is the default look |
| 13 | Web app | Rebuilt as plain JS modules with one workspace per media (GIF, Carousel, Reel, Reel cover, Walkthrough video, Post), Home analysis and Library |
| new | Walkthrough video | Playwright runs a guide, verifies each step and renders a Reel with before/after screenshots, cursor, highlight, zoom and an E2E report |
| new | CTA | The text CTA strip is gone; the brand CTA pill is on every slide and frame of every media |
| new | Packaging | `commands/` for Claude Code, Codex and Antigravity; `install.py install|update|reinstall|uninstall|clean|status|zip`; example outputs moved out of the repository |
| new | Contrast | Sunburst inner labels and mid-tone heatmap cells failed the contrast check; label colour now follows the cell's luminance |
| new | Walkthrough form | Step rows were cramped at 1440 px (seen in the recorded app tour); each step now uses two lines |
| 14 | `test_studio.py` | Passes outside the sandbox; inside it, local port binding is blocked (environment, not code) |

Verification: `tests/e2e/run_all.py` 11/11 (GIF x2, story carousel, 21 chart slides in 5 carousels, Reel + covers + post, walkthrough, web app tour with 13 checks); unit suites and self-test pass.
