#!/usr/bin/env bash
set -euo pipefail
in_dir="VideoPart2"
out_dir="VideoPart2Edited"

mkdir -p "$out_dir"

find "$in_dir" -maxdepth 1 -type f \( -iname "*.mov" -o -iname "*.mp4" \) -print0 |
while IFS= read -r -d '' f; do
  vcodec=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name \
    -of default=nw=1:nk=1 "$f" || true)
  [[ -z "${vcodec:-}" ]] && { echo "SKIP (no video): $f"; continue; }
  [[ "$vcodec" != "hevc" ]] && { echo "SKIP (non-HEVC: $vcodec): $f"; continue; }

  acodec=$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name \
    -of default=nw=1:nk=1 "$f" || true)

  base="$(basename "$f")"
  out="$out_dir/${base%.*}.mp4"
  [[ -f "$out" ]] && { echo "EXISTS: $out (skipping)"; continue; }

  if [[ -n "${acodec:-}" && "$acodec" == "aac" ]]; then
    echo "REMUX  : $base  (hevc + aac)"
    ffmpeg -y -loglevel error -stats -i "$f" \
      -map 0:v:0 -map 0:a:0 -c copy -tag:v hvc1 -movflags +faststart \
      -map_metadata 0 -map_chapters -1 "$out"
  elif [[ -n "${acodec:-}" ]]; then
    echo "COPY V : $base  (hevc)  |  AUDIO -> AAC"
    ffmpeg -y -loglevel error -stats -i "$f" \
      -map 0:v:0 -map 0:a:0 -c:v copy -tag:v hvc1 -c:a aac -b:a 192k \
      -movflags +faststart -map_metadata 0 -map_chapters -1 "$out"
  else
    echo "VIDEO ONLY: $base"
    ffmpeg -y -loglevel error -stats -i "$f" \
      -map 0:v:0 -c:v copy -tag:v hvc1 -movflags +faststart \
      -map_metadata 0 -map_chapters -1 "$out"
  fi

  touch -r "$f" "$out"
done

echo "Done. Outputs in: $out_dir"