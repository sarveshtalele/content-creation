# Migrating from explainer-studio (3.x) to content-creation (4.0)

In 4.0 the plugin takes the name of its GitHub repository, `sarveshtalele/content-creation`. Every name was changed to match. Your brand, photo, library and runtime move over automatically.

## Name map

| 3.x (explainer-studio) | 4.0 (content-creation) |
|---|---|
| plugin and skill `explainer-studio` | `content-creation` |
| marketplace `explainer-studio-marketplace` | `content-creation-marketplace` |
| `claude plugin install explainer-studio@explainer-studio-marketplace` | `claude plugin install content-creation@content-creation-marketplace` |
| skill folder `skills/explainer-studio/` | `skills/content-creation/` |
| `~/.claude/skills/explainer-studio` | `~/.claude/skills/content-creation` |
| `~/.agents/skills/explainer-studio` | `~/.agents/skills/content-creation` |
| `~/.gemini/config/skills/explainer-studio` | `~/.gemini/config/skills/content-creation` |
| `/explainer` | `/content-creation` |
| `/explainer-studio` (web app) | `/content-creation-studio` |
| `/explainer-setup`, `-walkthrough`, `-update`, `-clean`, `-uninstall` | `/content-creation-setup`, `-walkthrough`, `-update`, `-clean`, `-uninstall` |
| `/prompts:explainer` (Codex) | `/prompts:content-creation` |
| data folder `~/.cache/explainer-studio` | `~/.cache/content-creation` |
| `EXPLAINER_HOME`, `EXPLAINER_OUTPUTS`, `EXPLAINER_MODELS`, `EXPLAINER_ASR_MODEL` | `CONTENT_CREATION_HOME`, `CONTENT_CREATION_OUTPUTS`, `CONTENT_CREATION_MODELS`, `CONTENT_CREATION_ASR_MODEL` (old names still read) |
| Antigravity hook entry `explainer-studio-gates` | `content-creation-gates` |
| `dist/explainer-studio-plugin.zip`, `-skill.zip` | `dist/content-creation-plugin-<version>.zip`, `-skill-<version>.zip`, `SHA256SUMS.txt` |
| e2e showcase `~/Downloads/explainer-studio-showcase` | `~/Downloads/content-creation-showcase` |
| web app title "Explainer Studio" | "Design Studio" |

Unchanged: the GitHub repository URL, every design ID, `story.json`, `studio.py` and its commands, the outputs folder layout and your work folders.

## Upgrade

```bash
cd content-creation          # your clone
git pull --ff-only
python3 install.py install   # or: install --for claude,codex,antigravity
```

What `install` does on the first 4.0 run:

1. **Moves your data folder** `~/.cache/explainer-studio` to `~/.cache/content-creation`, once, if the new one does not exist yet. That covers your brand, avatar, banner photo, library index, Design Studio jobs, voice model and node runtime. The repository's `runtime/node_modules` link is pointed at the new place.
2. **Removes the old copies**: the `explainer-studio` skill folder and the `explainer*.md` commands in each agent it installs for. It removes only files that belong to explainer-studio.
3. **Replaces the old hook entries** in `~/.claude/settings.json`, `~/.codex/hooks.json` and `~/.gemini/config/hooks.json` with the new ones.
4. **Installs `content-creation`** for each agent.

If you used the **Claude Code plugin route**, remove the old plugin and add the new one:

```bash
claude plugin uninstall explainer-studio@explainer-studio-marketplace
claude plugin marketplace remove explainer-studio-marketplace
claude plugin marketplace add sarveshtalele/content-creation
claude plugin install content-creation@content-creation-marketplace
```

Then restart your agents. In Codex, trust the new hooks once in `/hooks`.

## After upgrading

- Type `/content-creation-setup`. It should print `READY`.
- If `doctor` reports the renderer missing, run `python3 skills/content-creation/scripts/setup.py` once. It reuses what is already in the data folder.
- Scripts or CI that set `EXPLAINER_*` variables keep working. Rename them when convenient.
