#!/bin/sh
# One-time setup: clones the Lemo-Opuscar renderer (MIT) and fetches the voice model. Needs git, node>=20, python>=3.9.
set -e
LIB="${LEMO_OPUSCAR_HOME:-$HOME/lemo-opuscar}"
[ -d "$LIB/.git" ] || git clone --depth 1 https://github.com/lemomo-ai/lemo-opuscar.git "$LIB"
cd "$LIB"
[ -f setup.sh ] && sh setup.sh
[ -f tools/fetch.sh ] && sh tools/fetch.sh voice
echo "Need ffmpeg >= 7 on PATH (or put it in ~/.cache/explainer-studio/bin). Then run: python3 $(dirname "$0")/studio.py doctor"
