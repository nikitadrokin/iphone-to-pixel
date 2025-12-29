#!/usr/bin/env bash
set -euo pipefail

# Default to "Unexported" if no argument is provided
TARGET_DIR="${1:-Unexported}"

if [[ ! -d "$TARGET_DIR" ]]; then
  echo "Error: Directory '$TARGET_DIR' does not exist."
  exit 1
fi

echo "Updating filesystem dates from internal metadata for: $TARGET_DIR"

# -r                  : Recursive (process subfolders)
# -overwrite_original : Don't create '_original' backup files (cleaner)
# -api QuickTimeUTC   : Fixes timezone shifts so 10am recording stays 10am
# -ext                : Only process video/image extensions (optional but safer)

exiftool -r -overwrite_original -api QuickTimeUTC \
  -ext mov -ext mp4 -ext m4v -ext jpg -ext png -ext heic \
  '-FileCreateDate<MediaCreateDate' \
  '-FileModifyDate<MediaCreateDate' \
  '-FileCreateDate<CreationDate' \
  '-FileModifyDate<CreationDate' \
  '-FileCreateDate<DateTimeOriginal' \
  '-FileModifyDate<DateTimeOriginal' \
  "$TARGET_DIR"

echo "Done! Filesystem dates now match internal metadata."


# OLD VERSION

# #!/usr/bin/env bash
# set -euo pipefail

# TARGET_DIR="${1:-Unexported}"

# if [[ ! -d "$TARGET_DIR" ]]; then
#   echo "Error: Directory '$TARGET_DIR' does not exist."
#   exit 1
# fi

# find "$TARGET_DIR" -type f -print0 |
# while IFS= read -r -d '' f; do
#   touch -m -t "$(date -r "$(stat -f %B "$f")" +%Y%m%d%H%M.%S)" "$f"
# done


