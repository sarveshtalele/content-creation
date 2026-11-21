#!/bin/sh
# make_gif.sh in.mp4 out.gif [width=900] [fps=10] [colors=128]: flat-colour palette GIF, looping forever
set -e
IN="$1"; OUT="$2"; SZ="${3:-900}"; FPS="${4:-10}"; COL="${5:-128}"
ffmpeg -y -v error -i "$IN" -vf "fps=$FPS,scale=$SZ:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=$COL:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle" -loop 0 "$OUT"
