# Changelog

## 2.17.0

- **Plugin zip for GitHub**: `python install.py --zip` now also builds `explainer-studio-plugin.zip` with `.claude-plugin/`, `.codex-plugin/`, `.agent-plugin/` and `skills/explainer-studio/` at the root, which is what GitHub and plugin uploaders accept (the old zip, with the skill folder at the root, is only for ChatGPT).
- **A call to action on every carousel slide**: the cover says "Swipe for the next one", middle slides say "Next: <title of the next slide>", the last slide asks for the follow, and a single image says "Follow for more like this". Your own per-slide `cta` still wins.
- **Review fixes**: the Reel camera push no longer moves titles outside the safe margin; Reels are read at video pace (20 characters a second) and the pauses between scenes are shorter, so the sample Reel runs 56 s instead of 68 s and the narration cap is 115 words. The contrast check now understands text drawn over SVG shapes, small kickers and card captions were darkened, tower tags are at least 20 px (max 18 characters), the tower funnel uses the brand colours, and the studio home page no longer scrolls sideways. New `tests/test_content.py`; CI now runs it, the carousel end-to-end check and a grid GIF build.
- **Card grid poster** ("20 AI algorithms visualised" style): a title banner, group legend and 4, 6 or 9 numbered cards, each with a small diagram (`bars curve tree flow cluster network loop steps split pixels`), a caption, a title and one line, in the Claude light theme with your branding. Available as a PNG infographic, as a carousel slide (`type: grid`) and as a GIF template (`gif.template: grid`, cards pop in and each diagram's highlight pulses).
- **Choose by design**: the GIF page shows a preview of every GIF style and the Post page shows every image design; the pick goes into the request for your agent.
- **Reel narration**: capitalised words in code or text (SKILL, NEVER) are spoken as words instead of letter by letter; only known initialisms (API, CLI, ...) are spelled. Faster voice (1.12), tighter pauses, narration capped at about 130 words so reels stay short.
- **Carousel workflow**: you choose an infographic for each slide; the cover is made from your headline (no template step). The PDF and separate PNG images are always both delivered.
- **3D ring funnel** redrawn as lit cylinders in the Claude light palette.

## 2.16.0

- **Two new funnel infographics** built from the reference designs: **3D Ring Funnel** (`ring`: icons feed a stack of blue rings that narrow to a glowing spout, with a numbered list) and **Cut-away Tower Funnel** (`tower`: floors are stages, with banners, a note and a figure on the right and altitude notes on the left). They replace the flat bar funnel in the studio.
- **Viral hook library** (`data/hooks.json`, from the research text): 15 carousel first-slide formulas and 65 opening lines across 9 types, with a best-fit picker. `studio.py hooks "topic or project folder" [--kind carousel|line]` returns the patterns that fit the concept. In the studio, every cover headline has "Show viral hook ideas" and the Post, GIF and Reel pages suggest opening lines as you type.
- **Infographic-first carousels**: the studio asks you to choose the infographic types before it will generate a carousel, and agents must ask which infographic types to use before building.

## 2.15.0

- **The local app now launches from any agent** (Antigravity, Codex, Gemini CLI, Claude Code): `studio.py studio` and `studio.py editor` start the server detached and return at once with `APP_URL=...`. A second call reuses the running app. `--status` and `--stop` manage it. Cause of the old failure: the server ran in the foreground, so the agent's terminal call never returned.
- **Reels and GIFs run in the background**: `studio.py build W --artifacts reel --background` returns at once; poll with `studio.py jobstatus W`. A Reel takes about three minutes, which agent terminals kill.
- **Cinematic Reel look** (default; `reel.look: "light"` restores the old one): dark grade, every scene scaled and centred to fill the frame (the old reel left the lower half empty), slow camera push, light sweep at each scene change, vignette, impact shake and flash on key moments. Content is measured from painted pixels, not layout boxes.
- **Carousel quality**: slide heading pinned at the top of every slide; underfilled slides scale up and centre below it; funnel rows enlarged; closing slide rebuilt (large question, next-step rows, profile card, follow button).
- **Claude light is the default carousel theme.** Cover photo removed everywhere (your photo stays in the header avatar and the CTA). Four selectable cover templates: Poster Bold, Gradient Stage, Editorial Masthead, Terminal.
- **Design Studio is now a full web app**: Home, Library of everything made on this computer (studio jobs and every project a build ran in), and a creation page per artifact: Carousel, Infographic or cover, GIF, Post, Reel. GIF, Post and Reel pages prepare a request for your agent and show whether this computer is ready.

## 2.14.0

- **Design Studio** (`studio.py studio`): a local web app where you pick the design, see a preloaded sample of each, fill in your content and generate. 5 covers and 6 infographics, as one image or a carousel (PDF, images or both, always asked). See `docs/STUDIO.md`.
- New cover layouts: **Poster Bold with your photo**, **Gradient Stage**, **Editorial Masthead**. Cover photo is a separate transparent PNG (`assets/photo_cutout.png`, replaceable in the studio); the profile photo is unchanged.
- Carousel shots now wait for every image to decode (large photos could come out blank).
- `carousel.single` (no pager) and `carousel.short` (2-7 slides) story flags for studio output.

## 2.13.1

- **Bold poster cover** (`title.layout: "bold"`): giant headline, one accent word on a colour box (`title.accent`), swoosh, 3D slab stack with topic icon tiles and a chip row (`title.chips`, 2-4). No photo or character on the cover.
- New light **`sky`** carousel theme (blue/white, from the poster references).
- CTA pill and carousel header show your profile photo (rounded square; `brand.avatar_shape: "circle"` to change). The 3D character is removed entirely.
- `studio.py build --artifacts carousel` now requires `--format pdf|images|both` and stops with a question otherwise; the plan asks it first.
- Loop-slide label contrast fixed so e2e passes.

## 2.12.0

- **3D character** (`assets/character.png`) replaces the round photo in the CTA pill, the carousel header and the closing slide; `pageshot.mjs --transparent` added.
- **Conveyor** restyled: grey studio floor and an orange belt (from the reference reel screenshot).
- `docs/DESIGN_MATRIX.md`: which design fits which content, and `studio.py plan` points to it.

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
