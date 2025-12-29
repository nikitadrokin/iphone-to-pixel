#!/usr/bin/env bash
# remux_video_normalize_dates.sh  (v2: map only v+a; drop data streams)
set -euo pipefail

ROOT="${1:?Give the input folder}"
PARENT="$(dirname "$ROOT")"
OUT="$PARENT/REMUX_MP4"
mkdir -p "$OUT"

find "$ROOT" -type f \( -iname '*.mov' -o -iname '*.m4v' -o -iname '*.mp4' \) -print0 |
while IFS= read -r -d '' SRC; do
  base="$(basename "$SRC")"; stem="${base%.*}"; dir="$(dirname "$SRC")"
  TMP_MP4="$dir/$stem.mp4"

  echo "Remuxing: $SRC -> $TMP_MP4"

  # Pass 1: copy only video+audio, drop data streams (-dn). Keep metadata.
  if ffmpeg -v error -y -i "$SRC" \
      -map 0:v:0 -map 0:a? -dn \
      -c copy -movflags +faststart -tag:v hvc1 -map_metadata 0 \
      "$TMP_MP4"; then

    # Sanity check
    if [ -s "$TMP_MP4" ]; then
      echo "Normalizing QuickTime/FS dates on: $TMP_MP4"
      exiftool -api QuickTimeUTC -overwrite_original -P \
        "-CreateDate<MediaCreateDate" \
        "-ModifyDate<CreateDate" \
        "-TrackCreateDate<CreateDate" \
        "-TrackModifyDate<CreateDate" \
        "-FileCreateDate<CreateDate" \
        "-FileModifyDate<CreateDate" \
        "$TMP_MP4" >/dev/null

      # Preserve subfolders under ROOT
      rel="${SRC#$ROOT/}"; rel_dir="$(dirname "$rel")"
      mkdir -p "$OUT/$rel_dir"
      mv -f "$TMP_MP4" "$OUT/$rel_dir/"

      # Remove original only after success
      rm -f "$SRC"
      echo "Done: $OUT/$rel_dir/$stem.mp4 (original deleted)"
    else
      echo "Empty output, skipping: $SRC" >&2
      rm -f "$TMP_MP4" 2>/dev/null || true
    fi

  else
    echo "Remux failed (likely unsupported codec), leaving original: $SRC" >&2
    rm -f "$TMP_MP4" 2>/dev/null || true
  fi
done

echo "All done. Remuxed files are in: $OUT"