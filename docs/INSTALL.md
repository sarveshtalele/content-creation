# Install, update and uninstall

content-creation is one plugin for three agents: **Claude Code**, **Codex** and **Antigravity**, plus a skill-only package for ChatGPT. One Python script, `install.py`, installs it into each agent's own folders, registers the approval hooks, and later updates or removes it. It uses only the Python standard library and works the same on macOS, Linux and Windows.

## Names at a glance

| What | Name |
|---|---|
| GitHub repository | `sarveshtalele/content-creation` |
| Plugin and skill | `content-creation` |
| Claude Code marketplace | `content-creation-marketplace` |
| Main slash command | `/content-creation` |
| Other commands | `/content-creation-studio`, `-setup`, `-walkthrough`, `-update`, `-clean`, `-uninstall` |
| Your data folder (brand, photo, library, runtime) | `~/.cache/content-creation` (override: `CONTENT_CREATION_HOME`) |
| Where finished files go | `./outputs/<slug>/` (override: `CONTENT_CREATION_OUTPUTS`) |
| Release packages | `content-creation-plugin-<version>.zip`, `content-creation-skill-<version>.zip`, `SHA256SUMS.txt` |

Upgrading from 3.x, when the plugin was called `explainer-studio`? See [MIGRATION.md](MIGRATION.md). The installer handles it for you.

## Requirements

| Need | Version | Why |
|---|---|---|
| Python | 3.11 to 3.13 (the installer itself runs on 3.9+) | orchestration, checks, voice |
| Node.js | 20 or newer, with npm | the renderer (headless Chromium through Playwright) |
| ffmpeg | any recent | GIF, MP4 and Reel encoding (setup can fetch a static build) |
| Disk | about 1.5 GB | Chromium, the voice model, node modules |
| macOS only, optional | Xcode command line tools (`xcode-select --install`) | cutting your photo out for the newsletter banner |

## 1. Get the plugin

```bash
git clone https://github.com/sarveshtalele/content-creation.git
cd content-creation
```

No git? Download `content-creation-plugin-<version>.zip` from the [latest release](https://github.com/sarveshtalele/content-creation/releases/latest), check it against `SHA256SUMS.txt`, and unzip it:

```bash
shasum -a 256 -c SHA256SUMS.txt --ignore-missing        # Windows: certutil -hashfile content-creation-plugin-<version>.zip SHA256
```

## 2. Install for your agents

| Agent | macOS / Linux | Windows |
|---|---|---|
| All three | `python3 install.py install` (or `./install.sh install`) | `py -3 install.py install` (or `.\install.ps1 install` in PowerShell) |
| Claude Code only | `python3 install.py install --for claude` | `py -3 install.py install --for claude` |
| Codex only | `python3 install.py install --for codex` | `py -3 install.py install --for codex` |
| Antigravity only | `python3 install.py install --for antigravity` | `py -3 install.py install --for antigravity` |
| A team workspace copy | add `--project ~/work/my-app` | add `--project %USERPROFILE%\work\my-app` |
| Also run setup | add `--setup` | add `--setup` |

What each agent gets:

| Agent | Skill | Commands | Approval hooks |
|---|---|---|---|
| Claude Code | `~/.claude/skills/content-creation` | `~/.claude/commands/content-creation*.md` | `~/.claude/settings.json` |
| Codex | `~/.agents/skills/content-creation` | `~/.codex/prompts/content-creation*.md` | `~/.codex/hooks.json` |
| Antigravity | `~/.gemini/config/skills/content-creation` | `~/.gemini/antigravity/global_workflows/content-creation*.md` | `~/.gemini/config/hooks.json` |
| `--project DIR` | `DIR/.agents/skills/content-creation` | - | - |

The hooks are merged into those files. Your own hooks and settings are kept, and running the installer again does not add duplicates. See [APPROVAL_GATES.md](APPROVAL_GATES.md) for what they do.

### Claude Code: the plugin route instead of a copy

```bash
claude plugin marketplace add sarveshtalele/content-creation      # or a local path: /path/to/content-creation
claude plugin install content-creation@content-creation-marketplace
```

The plugin brings its own hooks (`hooks/hooks.json`), so you do not need `install.py install --for claude` as well. Use one route or the other, not both: both would answer `/content-creation`.

### Codex: trust the hooks once

Codex runs a new or changed hook only after you trust it. After installing, open Codex, type `/hooks`, and trust the two `content-creation` hooks (prompt and tool). Until you do, Codex skips them and approvals are not recorded.

### Antigravity

Restart Antigravity, or reload the window, so it reads the new skill, workflows and hooks. Antigravity has no prompt-submit event. Its hook reads your last message (`lastUserInput`) before every step instead.

## 3. One-time setup and health check

```bash
python3 skills/content-creation/scripts/setup.py          # Chromium, voice model (checksummed), node modules, python deps
python3 skills/content-creation/scripts/studio.py doctor  # prints READY, or exactly what is missing
```

`setup.py light` installs only what GIFs and carousels need (no voice). Everything heavy lives in your data folder, so every agent copy shares one runtime.

## 4. Your brand

```bash
python3 skills/content-creation/scripts/studio.py brand --name "Your Name" --tagline "What you post about" --avatar ~/Pictures/me.png
python3 skills/content-creation/scripts/studio.py brand --photo ~/Pictures/me.jpg   # the cut-out photo on the newsletter banner
```

See [CUSTOMIZE.md](CUSTOMIZE.md) for every option.

## 5. Check it works

In your agent, type `/content-creation-setup`. The agent runs `doctor` and fixes anything missing. Then try:

```text
/content-creation https://example.com/some-article gif
```

The agent brainstorms with you, writes `plan.md`, and waits for you to type `approve plan XXXX` before it builds anything.

## ChatGPT (skill only)

```bash
python3 install.py zip        # builds dist/content-creation-skill-<version>.zip (also attached to every release)
```

Upload the skill zip under **Skills > Create > Upload**, then run `python3 scripts/setup.py light` in ChatGPT's sandbox. That covers GIFs and carousels. Reels and the approval hooks need a local agent.

## Update, reinstall, status, clean, uninstall

| Command | What it does |
|---|---|
| `python3 install.py update` | `git pull --ff-only`, then reinstalls for the same agents (refuses if you have local changes) |
| `python3 install.py reinstall` | installs again for the same agents and projects |
| `python3 install.py status` | the version, and what is installed where |
| `python3 install.py clean [--jobs] [--dry-run]` | removes render folders and caches; `--jobs` also removes Design Studio jobs older than 30 days. Never touches your library or brand |
| `python3 install.py uninstall [--for ...] [--dry-run]` | removes the skill, the commands and the hooks (only ours). Also removes leftovers from the old `explainer-studio` name |
| `python3 install.py uninstall --purge --yes` | also deletes your data folder (brand, photo, library index, jobs) |
| `python3 install.py zip` | builds the release packages in `dist/` ([RELEASING.md](RELEASING.md)) |

From inside an agent: `/content-creation-update`, `/content-creation-clean` and `/content-creation-uninstall` do the same, and ask before deleting anything.
