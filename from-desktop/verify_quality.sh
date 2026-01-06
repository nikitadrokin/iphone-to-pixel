#!/usr/bin/env bash
set -euo pipefail

INPUT_FILE="$1"

if [[ -z "$INPUT_FILE" ]]; then
  echo "Usage: ./verify_quality_m3.sh <path_to_video>"
  exit 1
fi

echo "========================================================="
echo "INSPECTING: $INPUT_FILE"
echo "========================================================="

# 1. READ METADATA (Fixed the parsing bug)
# We use 'grep' to find the digits specifically to avoid trailing characters like 'x'
WIDTH=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=s=x:p=0 "$INPUT_FILE" | grep -oE '[0-9]+')
HEIGHT=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=s=x:p=0 "$INPUT_FILE" | grep -oE '[0-9]+')

echo "Detected Resolution: ${WIDTH}x${HEIGHT}"

if (( WIDTH > 3000 || HEIGHT > 3000 )); then
  echo "✅ STATUS: TRUE 4K DETECTED."
else
  echo "⚠️ STATUS: NOT 4K."
fi

echo "========================================================="
echo "GENERATING 1080p CHECK (Apple Silicon Hardware Accel)..."
echo "========================================================="

BASENAME="$(basename "$INPUT_FILE")"
STEM="${BASENAME%.*}"
OUT_FILE="${STEM}_1080p_check.mp4"

# KEY CHANGES FOR M3 MAX:
# -c:v h264_videotoolbox  -> Uses the M3 media engine
# -b:v 8000k              -> Sets a high bitrate (8Mbps) to ensure the 1080p looks crisp
#                            (Hardware encoders don't use 'crf' the same way software does)

ffmpeg -hide_banner -loglevel error -stats -i "$INPUT_FILE" \
  -vf "scale=1920:-2" \
  -c:v h264_videotoolbox -b:v 8000k \
  -c:a copy \
  "$OUT_FILE"

echo ""
echo "DONE."
echo "Created: $OUT_FILE"
