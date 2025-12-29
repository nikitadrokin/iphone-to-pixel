#!/usr/bin/env bash
set -euo pipefail

# === Config (edit these if needed) ===
in_dir="Unexported"
out_dir="UnexportedMOV"
# =====================================

mkdir -p "$out_dir"

# Move all .MOV/.mov files from $in_dir to $out_dir, handling spaces safely
find "$in_dir" -maxdepth 1 -type f -iname "*.mov" -print0 |
while IFS= read -r -d '' f; do
  base="$(basename "$f")"
  name="${base%.*}"
  ext="${base##*.}"

  target="$out_dir/$base"
  if [[ -e "$target" ]]; then
    i=1
    while [[ -e "$out_dir/${name}-$i.$ext" ]]; do
      ((i++))
    done
    target="$out_dir/${name}-$i.$ext"
  fi

  echo "MOVE: $base -> $(basename "$target")"
  mv "$f" "$target"
done

echo "Done. Moved matching files to: $out_dir"