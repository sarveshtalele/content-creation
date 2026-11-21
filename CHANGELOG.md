# Changelog

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
