#!/usr/bin/env bash
# convert_hevc.sh
# -----------------------------------------------------------------------------
# Remux/transcode **HEVC** source files to MP4 while preserving:
#   • Video stream (copied when already HEVC)
#   • Audio (remux if AAC; otherwise transcode to AAC 192k)
#   • Container metadata (map_metadata 0; strip chapters)
#   • File timestamps:
#       - mtime/atime cloned via `touch -r`
#       - **creation (birth) time** cloned from the SOURCE to the OUTPUT
#         using SetFile on macOS (preferred) or exiftool as a fallback.
#
# USAGE:
#   ./convert_hevc.sh [INPUT_DIR] [OUTPUT_DIR]
# Defaults:
#   INPUT_DIR="VideoPart2"
#   OUTPUT_DIR="VideoPart2Edited"
#
# DEPENDENCIES:
#   ffmpeg, ffprobe (required)
#   macOS birth-time setter (any of):
#     - SetFile (Xcode CLT)    -> best for APFS/HFS+
#     - exiftool               -> fallback for FileCreateDate on macOS
# Notes:
#   • Birth time may not exist on some filesystems (e.g., exFAT). In that case,
#     we still clone mtime/atime and attempt the exiftool fallback.
# -----------------------------------------------------------------------------

set -euo pipefail

in_dir="${1:-VideoPart2}"
out_dir="${2:-VideoPart2Edited}"

mkdir -p "$out_dir"

# ---------- Helpers -----------------------------------------------------------

log() { printf '%s\n' "$*" >&2; }

require() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "ERROR: '$1' is required but not found in PATH."
    exit 1
  fi
}

# Copy filesystem creation time (birth time) from $1 -> $2.
# Works best on macOS APFS/HFS+ with SetFile installed. Falls back to exiftool.
clone_creation_time() {
  local src="$1" dst="$2" ok=0

  # Always clone mtime/atime first so Finder's “Modified” is preserved.
  # (We keep this here too in case caller forgets; harmless if duplicated.)
  touch -r "$src" "$dst" || true

  # macOS preferred path: SetFile -d (creation)
  if [[ "${OSTYPE:-}" == darwin* ]]; then
    # %B = birth time (epoch seconds) on macOS
    local birth_epoch
    birth_epoch=$(stat -f %B "$src" 2>/dev/null || echo "")
    if [[ -n "$birth_epoch" && "$birth_epoch" != "0" ]]; then
      local set_ts
      # SetFile expects: MM/DD/YYYY HH:MM:SS
      set_ts=$(date -r "$birth_epoch" "+%m/%d/%Y %H:%M:%S")
      if command -v SetFile >/dev/null 2>&1; then
        # Creation date
        if SetFile -d "$set_ts" "$dst" 2>/dev/null; then
          ok=1
        fi
      fi
    fi
  fi

  # Fallback (also macOS): exiftool can set FileCreateDate for many formats
  if [[ $ok -eq 0 ]] && command -v exiftool >/dev/null 2>&1; then
    # -P preserves filesystem times except those we overwrite explicitly.
    # We copy FILE creation to FILE creation (not media CreateDate).
    exiftool -overwrite_original -P -TagsFromFile "$src" \
      "-FileCreateDate<FileCreateDate" "$dst" >/dev/null 2>&1 && ok=1
  fi

  if [[ $ok -eq 0 ]]; then
    log "WARN: Could not set creation time for: $dst (filesystem or tools may not support birth time)."
  fi
}

# Optional: quick verification (macOS only). Prints both creation dates.
verify_creation_time() {
  local src="$1" dst="$2"
  if [[ "${OSTYPE:-}" == darwin* ]] && command -v mdls >/dev/null 2>&1; then
    log "Verify (Created):"
    mdls -name kMDItemFSCreationDate -raw "$src" 2>/dev/null || true
    mdls -name kMDItemFSCreationDate -raw "$dst" 2>/dev/null || true
  fi
}

# ---------- Checks ------------------------------------------------------------

require ffmpeg
require ffprobe

# ---------- Main --------------------------------------------------------------

# We only scan top-level files by default; adjust -maxdepth if desired.
find "$in_dir" -maxdepth 1 -type f \( -iname "*.mov" -o -iname "*.mp4" \) -print0 |
while IFS= read -r -d '' f; do
  # Probe primary video codec
  vcodec=$(
    ffprobe -v error -select_streams v:0 -show_entries stream=codec_name \
      -of default=nw=1:nk=1 "$f" || true
  )
  [[ -z "${vcodec:-}" ]] && { log "SKIP (no video): $f"; continue; }
  [[ "$vcodec" != "hevc" ]] && { log "SKIP (non-HEVC: $vcodec): $f"; continue; }

  # Probe primary audio codec (may be empty for silent video)
  acodec=$(
    ffprobe -v error -select_streams a:0 -show_entries stream=codec_name \
      -of default=nw=1:nk=1 "$f" || true
  )

  base="$(basename "$f")"
  out="$out_dir/${base%.*}.mp4"

  # Skip if already exists
  if [[ -f "$out" ]]; then
    log "EXISTS: $out (skipping)"
    continue
  fi

  # Write to a temp file first for atomicity
  tmp="$(mktemp "$out_dir/.${base%.*}.XXXXXX.mp4")"

  if [[ -n "${acodec:-}" && "$acodec" == "aac" ]]; then
    log "REMUX  : $base  (video=HEVC copy, audio=AAC copy)"
    ffmpeg -y -loglevel error -stats -i "$f" \
      -map 0:v:0 -map 0:a:0 \
      -c copy \
      -tag:v hvc1 \
      -movflags +faststart \
      -map_metadata 0 -map_chapters -1 \
      "$tmp"
  elif [[ -n "${acodec:-}" ]]; then
    log "AUDIO→AAC: $base  (video=HEVC copy, audio transcode)"
    ffmpeg -y -loglevel error -stats -i "$f" \
      -map 0:v:0 -map 0:a:0 \
      -c:v copy \
      -tag:v hvc1 \
      -c:a aac -b:a 192k \
      -movflags +faststart \
      -map_metadata 0 -map_chapters -1 \
      "$tmp"
  else
    log "VIDEO ONLY: $base  (no audio stream)"
    ffmpeg -y -loglevel error -stats -i "$f" \
      -map 0:v:0 \
      -c:v copy \
      -tag:v hvc1 \
      -movflags +faststart \
      -map_metadata 0 -map_chapters -1 \
      "$tmp"
  fi

  # Clone timestamps (mtime/atime + birth/creation)
  touch -r "$f" "$tmp" || true
  clone_creation_time "$f" "$tmp"

  # Move into place atomically
  mv -f "$tmp" "$out"

  # Optional: print Created verification on macOS
  verify_creation_time "$f" "$out"
done

log "Done. Outputs in: $out_dir"