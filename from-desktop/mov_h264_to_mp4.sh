#!/usr/bin/env bash
# Remux MOV(H.264) -> MP4 without re-encoding (Pixel 1 / Google Photos friendly)
# Configure "in_dir" and "out_dir" below (same style as your convert_hevc.sh).

set -euo pipefail

in_dir="Part1"         # INPUT directory with .mov (H.264) files
out_dir="Part1Edited"  # OUTPUT directory for .mp4 files

# Optional: if a remux fails due to an incompatible audio codec, set to "true"
# to retry with audio encoded to AAC (video stays copy). Default keeps audio lossless.
fallback_transcode_audio=false
aac_bitrate="192k"

mkdir -p "$out_dir"

# Process only top-level files (like your existing script)
find "$in_dir" -maxdepth 1 -type f \( -iname "*.mov" -o -iname "*.MOV" \) -print0 |
while IFS= read -r -d '' f; do
  base="$(basename "${f%.*}")"
  out="$out_dir/$base.mp4"

  # Skip if output exists
  [[ -e "$out" ]] && { echo "SKIP (exists): $out"; continue; }

  # Require H.264 video
  vcodec="$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name \
             -of default=nw=1:nk=1 "$f" || true)"
  [[ -z "${vcodec:-}" ]] && { echo "SKIP (no video): $f"; continue; }
  [[ "$vcodec" != "h264" ]] && { echo "SKIP (non-H.264: $vcodec): $f"; continue; }

  # Probe audio (may be empty)
  acodec="$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name \
             -of default=nw=1:nk=1 "$f" || true)"

  echo "REMUX: $base  (v:$vcodec  a:${acodec:-none})"

  # First try: stream copy everything we map (no quality change)
  if [[ -n "${acodec:-}" ]]; then
    if ffmpeg -y -loglevel error -stats -i "$f" \
         -map 0:v:0 -map 0:a:0 -c copy \
         -tag:v avc1 -movflags +faststart -map_metadata 0 -map_chapters -1 \
         "$out"; then
      :
    else
      # Optional fallback only if enabled
      if $fallback_transcode_audio; then
        echo "RETRY with AAC audio (video still copy): $base"
        ffmpeg -y -loglevel error -stats -i "$f" \
          -map 0:v:0 -map 0:a:0 -c:v copy -tag:v avc1 \
          -c:a aac -b:a "$aac_bitrate" \
          -movflags +faststart -map_metadata 0 -map_chapters -1 \
          "$out"
      else
        echo "ERROR: Remux failed (likely audio/container). Enable fallback_transcode_audio=true to retry. File: $f"
        rm -f -- "$out" || true
        continue
      fi
    fi
  else
    # Video-only
    ffmpeg -y -loglevel error -stats -i "$f" \
      -map 0:v:0 -c:v copy -tag:v avc1 \
      -movflags +faststart -map_metadata 0 -map_chapters -1 \
      "$out"
  fi

  # Preserve original timestamps on the new file
  touch -r "$f" "$out"
  echo "OK   : $f -> $out"
done

echo "Done. Outputs in: $out_dir"