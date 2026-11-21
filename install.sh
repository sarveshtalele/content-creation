#!/bin/sh
# Thin wrapper kept for macOS/Linux. The real installer is install.py (works on Windows too).
HERE="$(cd "$(dirname "$0")" && pwd)"
for p in python3 python; do command -v "$p" >/dev/null 2>&1 && exec "$p" "$HERE/install.py" "$@"; done
echo "Python 3 is required"; exit 1
