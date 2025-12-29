#!/usr/bin/env bash
# Delete every file in DIR except those listed in KEEP

set -euo pipefail

DIR="${1:-Part1}"                   # default Part1
KEEP="${2:-Part1Untransferred.txt}" # default Part1Untransferred.txt

# Load keep list into a shell array (strip backslashes for spaces/parens)
keep=()
while IFS= read -r line || [ -n "$line" ]; do
  line="${line//\\}"   # remove backslashes
  [ -n "$line" ] && keep+=("$line")
done < "$KEEP"

# Walk directory and delete anything not in keep[]
find "$DIR" -type f -print0 |
  while IFS= read -r -d '' f; do
    bn=$(basename "$f")
    match=false
    for k in "${keep[@]}"; do
      if [[ "$bn" == "$k" ]]; then
        match=true
        break
      fi
    done
    if ! $match; then
      rm -v -- "$f"
    fi
  done