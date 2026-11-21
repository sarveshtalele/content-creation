# explainer-studio

Paste an article, essay, URL or GitHub repo and get a narrated Instagram Reel (MP4), an animated LinkedIn GIF (1080x1350 portrait) and a LinkedIn post, all grounded in the source with cited quotes and accuracy metrics. The Claude logo appears only if the source mentions Claude.

One skill folder (`skills/explainer-studio`, open Agent Skills format) works in every agent below. The agent writes a compact `story.json`; scripts do validation, voice, rendering and checks.

## Quick install (all local agents)
```
git clone https://github.com/sarveshtalele/content-creation.git && cd content-creation
sh install.sh [project-dir]        # copies the skill to every supported location
sh skills/explainer-studio/scripts/setup.sh    # one-time: renderer + voice model (needs git, node>=20, python>=3.9, ffmpeg>=7)
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
| **ChatGPT** | Skills > Create > Upload from your computer | `sh install.sh --zip`, upload the created `skills/explainer-studio-skill.zip`. See limits below |

## ChatGPT limits (read this)
ChatGPT skills (Business, Enterprise, Edu and similar plans, admin must enable skill upload) run in a sandbox. Rendering needs a headless browser, ffmpeg 7+, the Kokoro voice model and a clone of the renderer, which ChatGPT's sandbox typically cannot download. In ChatGPT use it for the grounded `story.json`, validation, accuracy report and the LinkedIn post. Run the video and GIF build in Codex, Claude Code, Antigravity or Gemini CLI on your machine.

## Codex plugin manifest
`.codex-plugin/plugin.json` is included but not verified against OpenAI's current plugin spec; the `.agents/skills` install above is the tested route.

## Commands
`studio.py doctor | spec | ingest SRC --out DIR | check DIR | build DIR [--artifacts reel,gif,post|all]`. Outputs land in `DIR/out/`.

## Self-test
`python3 skills/explainer-studio/scripts/selftest.py`

Credits: see CREDITS.md.
