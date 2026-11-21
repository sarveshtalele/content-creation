#!/bin/sh
# usage: sh install.sh [project-dir]   Installs the skill for Codex, Antigravity and Claude Code.
set -e
if [ "$1" = "--zip" ]; then # ChatGPT upload: zip with ONE top-level folder
  D="$(cd "$(dirname "$0")" && pwd)/skills"; (cd "$D" && rm -f ../explainer-studio-skill.zip && zip -qr ../explainer-studio-skill.zip explainer-studio -x "*/__pycache__/*" "*/.cache/*" "*/node_modules/*") && echo "created explainer-studio-skill.zip"; exit 0
fi
HERE="$(cd "$(dirname "$0")" && pwd)"; SRC="$HERE/skills/explainer-studio"; P="${1:-}"
put() { mkdir -p "$(dirname "$1")"; rm -rf "$1"; cp -R "$SRC" "$1"; rm -rf "$1/runtime/node_modules" "$1"/scripts/__pycache__ "$1"/tests/__pycache__; echo "installed: $1"; }
put "$HOME/.agents/skills/explainer-studio"            # Codex (user)
put "$HOME/.gemini/config/skills/explainer-studio"     # Antigravity (global)
put "$HOME/.claude/skills/explainer-studio"            # Claude Code (user skill)
[ -d "$HOME/.gemini" ] && put "$HOME/.gemini/antigravity-cli/skills/explainer-studio"  # Antigravity CLI (global)
[ -n "$P" ] && { put "$P/.agents/skills/explainer-studio"; }  # Codex + Antigravity (workspace)
echo "Next (once, shared by every installed copy): sh $SRC/scripts/setup.sh && python3 $SRC/scripts/studio.py doctor"
echo "Claude Code plugin route: claude plugin marketplace add $HERE"
