#!/bin/sh
# Thin wrapper kept for macOS/Linux muscle memory. The real script is setup.py (works on Windows too).
HERE="$(cd "$(dirname "$0")" && pwd)"
for p in python3 python; do command -v "$p" >/dev/null 2>&1 && exec "$p" "$HERE/setup.py" "$@"; done
echo "Python 3 is required"; exit 1
