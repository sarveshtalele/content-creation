#!/bin/sh
# usage: sh install.sh [project-dir]   Installs the skill for Codex, Antigravity and Claude Code.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"; SRC="$HERE/skills/explainer-studio"; P="${1:-}"
put() { mkdir -p "$(dirname "$1")"; rm -rf "$1"; cp -R "$SRC" "$1"; echo "installed: $1"; }
put "$HOME/.agents/skills/explainer-studio"            # Codex (user)
put "$HOME/.gemini/config/skills/explainer-studio"     # Antigravity (global)
put "$HOME/.claude/skills/explainer-studio"            # Claude Code (user skill)
[ -n "$P" ] && { put "$P/.agents/skills/explainer-studio"; }  # Codex + Antigravity (workspace)
echo "Next: sh $SRC/scripts/setup.sh && python3 $SRC/scripts/studio.py doctor"
echo "Claude Code plugin route: claude plugin marketplace add $HERE"
