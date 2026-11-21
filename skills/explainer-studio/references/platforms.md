# Same skill, three platforms
One folder (SKILL.md + scripts + assets) follows the open Agent Skills layout.
- Claude Code: plugin (`.claude-plugin/`), `claude plugin marketplace add <path>` then install; or copy to `~/.claude/skills/`.
- Codex: `.agents/skills/explainer-studio` (repo) or `~/.agents/skills/` (user).
- Antigravity: `.agents/skills/` (workspace) or `~/.gemini/config/skills/` (global).
`install.sh` does the copying. Codex plugin manifest (`.codex-plugin/plugin.json`) is unverified against the official spec; the skill-folder install is the reliable route.
