# explainer-studio

Paste an article, essay, URL or GitHub repo and get a narrated Instagram Reel (MP4), an animated LinkedIn diagram GIF (1080x1350 portrait, flowing-dot arrows, your personal CTA) and a LinkedIn post, all grounded in the source with cited quotes and accuracy metrics, and delivered only after a review gate. The GIF picks one of four diagram templates (hub, columns, pipeline, lanes) from the shape of the source. The Claude logo appears only if the source mentions Claude.

One skill folder (`skills/explainer-studio`, open Agent Skills format) works in every agent below. The agent writes a compact `story.json`; scripts do validation, voice, rendering and checks.

## Quick install (all local agents)
```
git clone https://github.com/sarveshtalele/content-creation.git && cd content-creation
sh install.sh [project-dir]        # copies the skill to every supported location
sh skills/explainer-studio/scripts/setup.sh    # one-time: renderer + voice model (needs node>=20, python>=3.9, ffmpeg>=7; the render runtime is bundled in the skill, setup only fetches the browser, voice model and python packages)
python3 skills/explainer-studio/scripts/studio.py doctor   # must print READY
```
Then, in your agent, say: *"Make a Reel, GIF and LinkedIn post from <paste or link>"*. If you don't name the artifact, it asks.

## Per platform
| Platform | Where the skill goes | How |
|---|---|---|
| **Claude Code** | `~/.claude/skills/explainer-studio` or plugin | `claude plugin marketplace add ./content-creation` then `/plugin install explainer-studio@explainer-studio-marketplace` (or `sh install.sh`) |
| **Codex** (CLI/app) | `~/.agents/skills/` (user) or `<repo>/.agents/skills/` | `sh install.sh /path/to/project`; restart Codex; invoke with `$explainer-studio` or just describe the task |
| **Antigravity** (IDE) | `~/.gemini/config/skills/` global, `<workspace>/.agents/skills/` | `sh install.sh /path/to/project`; Antigravity CLI global path is `~/.gemini/antigravity-cli/skills/` (installed if `~/.gemini` exists) |
| **Gemini CLI** | `~/.gemini/skills/` or `~/.agents/skills/` (user); `.gemini/skills/` or `.agents/skills/` (workspace) | `sh install.sh` (uses `~/.agents/skills`) or `gemini skills link ./content-creation/skills`; check with `/skills list` |
| **ChatGPT** | Skills > Create > Upload from your computer | `sh install.sh --zip`, upload the created `explainer-studio-skill.zip` (repo root). See limits below |

## ChatGPT limits (read this)
ChatGPT skills (Business, Enterprise, Edu and similar plans, admin must enable skill upload) run in a sandbox. Rendering needs a headless browser, ffmpeg 7+ and the Kokoro voice model, which ChatGPT's sandbox typically cannot download. In ChatGPT use it for the grounded `story.json`, validation, accuracy report and the LinkedIn post. Run the video and GIF build in Codex, Claude Code, Antigravity or Gemini CLI on your machine.

## Codex plugin manifest
`.codex-plugin/plugin.json` is included but not verified against OpenAI's current plugin spec; the `.agents/skills` install above is the tested route.

## Commands
`studio.py doctor | spec | ingest SRC --out DIR | pick DIR | check DIR | build DIR [--artifacts reel,gif,post|all] | review DIR | finalize DIR`.
Outputs land in `DIR/out/`; the deliverables, copied only after every gate is 100% and the visual attestation matches, land in `DIR/final/`.

## GIF templates
| Template | Use when the source is... |
|---|---|
| `pipeline` | ordered steps, a workflow, a request path |
| `columns` | a catalogue grouped by category |
| `lanes` | layers of a stack or ecosystem |
| `hub` | one concept with named parts (files, settings, guarantees) |

All share the same header, personal-brand colours, flowing-dot arrows and the "Follow Sarvesh Talele" footer. `studio.py pick DIR` scores the source and suggests one; the agent may override.

## Review gate
`review` checks story accuracy metrics, GIF size/layout/animation, Reel format/duration/loudness/speech-to-text match and the post CTA, then writes contact sheets to `out/review/`. The agent looks at them and writes `attest.json`; `finalize` refuses unless gates are 100% and the attestation matches the current files. This is an automated plus visual check, not a guarantee of truth: grounding metrics are lexical proxies.

## Self-test
`python3 skills/explainer-studio/scripts/selftest.py`

Credits: see CREDITS.md.
