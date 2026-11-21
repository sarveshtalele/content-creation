#!/bin/sh
# One-time setup (safe to re-run). Installs: node deps + headless browser, Python voice env, voice model, ffmpeg >= 7.
# Needs: node >= 20, npm, python 3.11-3.13, curl. Everything heavy lives in ~/.cache/explainer-studio (override: EXPLAINER_HOME).
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"; RT="$HERE/../runtime"; EH="${EXPLAINER_HOME:-$HOME/.cache/explainer-studio}"
mkdir -p "$EH/models" "$EH/bin" "$EH/node"; ND="$EH/node"; cp "$RT/package.json" "$ND/package.json"   # node deps live once in the cache and are linked into every installed copy
echo "[1/5] node dependencies"; (cd "$ND" && npm install --no-audit --no-fund --silent) && { [ -d "$RT/node_modules" ] && [ ! -L "$RT/node_modules" ] || ln -sfn "$ND/node_modules" "$RT/node_modules"; }
echo "[2/5] headless browser"; node "$ND/node_modules/playwright-core/cli.js" install chromium-headless-shell || echo "WARNING: browser download failed; set PLAYWRIGHT_CHROME to a chrome-headless-shell binary or fix network, then re-run"
echo "[3/5] python voice environment"
PY=""; for c in python3.12 python3.13 python3.11 python3; do command -v "$c" >/dev/null 2>&1 && PY="$c" && break; done
[ -n "$PY" ] || { echo "python 3.11-3.13 is required"; exit 1; }
[ -x "$EH/venv/bin/python" ] || "$PY" -m venv "$EH/venv"
"$EH/venv/bin/python" -m pip install -q --upgrade pip
"$EH/venv/bin/python" -m pip install -q kokoro-onnx numpy soundfile soxr scipy
echo "[4/5] voice model (about 350 MB, resumable)"
B=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
sha_of() { if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | cut -d' ' -f1; else shasum -a 256 "$1" | cut -d' ' -f1; fi; }
want_sha() { case "$1" in
  kokoro-v1.0.onnx) echo 7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5;;
  voices-v1.0.bin) echo bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d;; esac; }
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s "$EH/models/$f" ] || curl -L --fail --retry 3 -C - -o "$EH/models/$f" "$B/$f"
  [ "$(sha_of "$EH/models/$f")" = "$(want_sha "$f")" ] || { echo "CHECKSUM MISMATCH for $f: deleting it. Re-run setup, or check your network/proxy."; rm -f "$EH/models/$f"; exit 1; }
done
echo "[5/5] ffmpeg >= 7"
V=0; if command -v ffmpeg >/dev/null 2>&1; then V=$(ffmpeg -version | sed -n '1s/^ffmpeg version [nN]\{0,1\}\([0-9]*\).*/\1/p'); fi
if [ "${V:-0}" -lt 7 ]; then
  (cd "$ND" && npm install --no-audit --no-fund --silent ffmpeg-static)
  ln -sf "$ND/node_modules/ffmpeg-static/ffmpeg" "$EH/bin/ffmpeg"
  command -v ffprobe >/dev/null 2>&1 && ln -sf "$(command -v ffprobe)" "$EH/bin/ffprobe" || (cd "$ND" && npm install --no-audit --no-fund --silent ffprobe-static && ln -sf "$ND/node_modules/ffprobe-static/bin/$(node -p 'process.platform')/$(node -p 'process.arch')/ffprobe" "$EH/bin/ffprobe")
fi
echo "Optional speech-to-text verification: sh $HERE/setup.sh asr   (not required)"
[ "$1" = asr ] && "$EH/venv/bin/python" -m pip install -q sherpa-onnx
echo "Done. Next: python3 $HERE/studio.py doctor"
