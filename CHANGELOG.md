# Changelog

## 2.11.0

- **`studio.py cover DIR --hooks "A B" "C D" "E F"`**: video thumbnails in two looks (`face`: your photo, hook and an isometric object; `poster`: dark cinematic) and three sizes (YouTube 1280x720, Reel/Short 1080x1920, grid 1080x1350), one file per hook variant for A/B tests. Hooks are limited to 4 words; text sits clear of the platform UI zones.

## 2.10.0

- **ChatGPT**: `setup.py light` installs only the browser and ffmpeg (no voice model, no Python 3.11-3.13 requirement); `studio.py doctor --for carousel|gif|reel` checks only what the chosen output needs.
- **Motion**: every GIF template now has cards that float gently once they arrive (shared, in `gif_common.js`). A drifting background and camera zoom were tried and dropped: they cut the GIF from 900 px to 640 px and pushed the title out of the safe zone.
- **New `funnel` GIF template**: a real 3D funnel (shaded drums sized by each stage's share, falling beads that drop out stage by stage, flat label cards), 3-5 stages, with a fixture, validator rules and a picker score.

## 2.9.0

- **ChatGPT is supported** through the zipped skill upload; README and install notes updated.
- **`studio.py plan DIR`**: scans the source for figures, steps, loops, contrasts, layers, commands and links, then writes `plan.md` with questions to ask first and a slide-by-slide infographic proposal to approve before building.
- **New `funnel` slide type** (3-5 narrowing stages with values) beside bars, stat ring and waffle.
- **e2e fit gates**: underfilled slides (content under 50% of the body), oversized slides (content into the CTA strip) and an avatar-resolution warning (under 256 px looks soft).
- Shipped avatar replaced with an 800 px photo so the CTA is sharp.

## 2.8.0

- **Carousels no longer look alike.** Four colour themes (`carousel.theme`: paper, midnight, sunrise, mint), three title layouts (`title.layout`: classic, poster, terminal) and four new infographic slide types: `loop` (cycle diagram), `stack` (layered slabs), `terminal` (command transcript) and `shot` (page frame with heading, caption and link).
- **Hook-first covers.** Hooks are capped at 72 characters in the validator and the e2e gate wants 60 or fewer; the SKILL guide lists the viral patterns to use (contrarian reframe, specific audience, "read this before...", number proof, POV).
- **Page cards for links.** `studio.py readercard` renders a labelled summary card with Playwright; `studio.py shot` screenshots a public page. Cards are never presented as screenshots.
- **`studio.py e2e`**: every slide rendered in a real browser; checks PNG size, PDF pages, image loading and upscaling, text contrast, minimum text size, hook length and slide variety.
- Sharper avatar: shown at its native 112 px on the closing slide.

## 2.7.0

- **Carousel (on demand).** 5-7 slides: a title slide with a hook, content slides (points, stat ring + waffle, bars, compare, flow, big), a closing CTA slide from your brand. Every slide has a bottom CTA strip you can edit. Outputs: one PDF (LinkedIn document), a 1080x1350 PNG per slide, and the first-comment text.
- **Resource carousel.** `studio.py resources W URL...` fetches each link (SSRF-guarded, secrets redacted) so the one-liners are grounded in the pages; three per slide, links on the slides and in the comment, CTA "Link in comments".
- **Hook styles:** contradiction, specificity, timeframe, pov (paraphrased patterns).
- **Full control:** `studio.py cta`, `studio.py edit`, `build --slide N`, and `studio.py editor`, a local browser editor for every field of story.json, the brand and the CTAs, with build buttons and previews.
- Not in this release: the shared motion upgrade of the 13 GIF templates and the new data-viz templates (planned next).

## 2.6.0

- **conveyor rebuilt as a data-driven animated infographic.** Each gate now carries a pass rate (`stat{value,pct}`): a ring gauge on the gate, a count-up bar in a tally panel, a light curtain that pulses when a box passes, and a numbered badge. The boxes encode the data too: the share that fails drops off the belt at its gate with a red mark, survivors take the gate's colour. Techniques: staged reveal, count-up numbers, one value shown twice (ring and bar), motion that carries meaning. `conveyor.tally` is the panel heading.
- **Image by default.** `studio.py build` now also writes `<slug>-linkedin.png`, the complete diagram as one 1080x1350 still (the last full frame before the closing fade). It is attested and copied by `finalize` with the GIF. The narrated Reel stays on demand (`--artifacts reel`).
- Fix: Reel "big" scenes could overflow their box for short phrases; the box height now scales with the font size.
- Added a Reel story to the conveyor fixture so the sample video can be rebuilt.

## 2.5.0

- Three new 3D "cutaway city" templates, inspired by isometric building-cutaway infographics (layout idea only, no third-party branding):
  - **tower**: an isometric building, one glass room per floor with a small illustrated scene, numbered markers and side callouts joined by flowing-dot leaders.
  - **skyline**: isometric towers whose height encodes a ranking (`size` 1-10), with a value flag on each roof and lit windows.
  - **conveyor**: an isometric belt running through 3-4 gates, boxes changing colour at each gate.
- A shared scene library (`engine/gif_scenes.js`): 14 flat illustrations (screen, chart, chat, docs, gears, checklist, search, shield, cloud, people, rocket, database, bulb, target) built from plain shapes, so every render is identical.
- `studio.py pick` scores the new templates; `studio.py spec` lists their limits and the scene names. Words stay in flat, axis-aligned cards; only decoration is 3D.

## 2.4.0
- Four 3D motion templates: `exploded` (layers pulled apart), `isoflow` (isometric flow), `orbit` (core with tilted rings and 4-6 cards), `stairs` (isometric levels that climb). CSS 3D transforms and exact isometric blocks for the shapes, flat axis-aligned cards for every word, so the same layout gates apply.
- `engine/gif_3d.js` helpers; `uniformSub` gives every card in a diagram one sub-text size.
- Fixtures, validators, picker skeletons and previews for all four.

## 2.3.0
- `studio.py brand`: change the follow pill (name, follow word, tagline, avatar), the post's closing CTA lines and the voice with one command. Stored in `~/.cache/explainer-studio/brand.json`, so updates never overwrite it; `--reset` restores the defaults.
- New guide `docs/CUSTOMIZE.md`: update the CTA, rewrite the hook, then recreate the GIF, Reel or post.
- README restructured: hero with live demo, navigation, why/features, quick start, FAQ, documentation index.

## 2.2.0
- Windows, macOS and Linux parity: `setup.py` and `install.py` replace the shell-only scripts (the `.sh` files remain as wrappers). Link fallback (symlink, junction, copy), resumable Python download, UTF-8 console and file handling, `py -3` interpreter discovery.
- GIF encoding is now plain ffmpeg from Python (no `sh`); the Reel mux step finds Git for Windows' `sh.exe`, and `doctor` reports it.
- Git clone hardening uses `os.devnull` (was `/dev/null`); `.gitattributes` pins LF endings so shell scripts survive a Windows checkout.
- README badges, install matrix and platform notes; GitHub Actions CI on macOS, Windows and Ubuntu; `tests/test_platform.py`.

## 2.1.1
- Rebuilt `ecosystem` and `framework` with measured text fitting (the browser measures each text, so sizes match the checks): no overflow, no empty cards, no overlapping boxes.
- New Playwright checks on the final frame: `BOX-OVERLAP` (two boxes overlapping without nesting) and `EMPTY-CARD` (a card whose text leaves more than 32% of its height empty). Bands and section headers are marked `bg` and exempt.
- Tightened card sizes and bigger fitted text in `hub`, `columns`, `pipeline` and `lanes`. Ecosystem hub text now fits inside its circle.

## 2.1.0
- New GIF templates: `ecosystem` (core fanning into sections) and `framework` (6 or 9 mini-diagram cards plus takeaways).
- One GIF by default; Reel and post only when requested. Male Reel voice (am_michael).
- Security hardening: SSRF guard, secret redaction, injection warning, symlink and hook-safe cloning, checksummed model downloads, tests.
- Documentation set: architecture, templates, evaluation, security, contributing.
- `pick` prints a fill-in skeleton to cut tokens.

## 2.0.0
- Own bundled runtime, four flow-dot templates (hub, columns, pipeline, lanes), template picker, interactive narration arc, review and finalize gate.
