#!/usr/bin/env bash
set -euo pipefail

# ================= CONFIGURATION =================
# Default input folder is "Part1" if not provided
TARGET_DIR="${1:-Part1}"
# =================================================

if [[ ! -d "$TARGET_DIR" ]]; then
  echo "Error: Directory '$TARGET_DIR' does not exist."
  exit 1
fi

# Get absolute path safely
IN_DIR="$(cd "$TARGET_DIR" && pwd)"
OUT_DIR="${IN_DIR}_Remuxed"

mkdir -p "$OUT_DIR"

echo "========================================================="
echo "SOURCE:      $IN_DIR"
echo "DESTINATION: $OUT_DIR"
echo "MODE:        ARCHIVAL (Preserve HDR & HEIC)"
echo "========================================================="

# Check tools
for tool in ffmpeg ffprobe exiftool; do
  command -v "$tool" >/dev/null 2>&1 || { echo "Error: $tool is required."; exit 1; }
done

find "$IN_DIR" -maxdepth 1 -type f -not -name '.*' -print0 |
while IFS= read -r -d '' FILE; do
  
  BASE_NAME="$(basename "$FILE")"
  STEM="${BASE_NAME%.*}"
  EXT="${BASE_NAME##*.}"
  # Normalized extension check
  EXT_LOWER="$(echo "$EXT" | tr '[:upper:]' '[:lower:]')"
  
  # ---------------------------------------------------------
  # 1. IMAGE HANDLING (HEIC, JPG, PNG, GIF)
  # Action: Exact Copy + Fix Dates
  # ---------------------------------------------------------
  if [[ "$EXT_LOWER" =~ ^(heic|heif|jpg|jpeg|png|gif)$ ]]; then
    OUT_FILE="$OUT_DIR/$BASE_NAME"
    
    if [[ -e "$OUT_FILE" ]]; then continue; fi
    
    echo "PHOTO: $BASE_NAME -> Copying (Bit-for-bit)..."
    cp "$FILE" "$OUT_FILE"
    
    # Force filesystem dates to match internal EXIF "DateTimeOriginal"
    # This ensures Google Photos sorts it by when you took it, not today.
    exiftool -quiet -overwrite_original -P \
      "-FileModifyDate<DateTimeOriginal" \
      "-FileCreateDate<DateTimeOriginal" \
      "$OUT_FILE"
    continue
  fi

  # ---------------------------------------------------------
  # 2. VIDEO HANDLING (MOV, MP4, M4V)
  # Action: Remux (Swap Container) + Fix Dates + Preserve HDR
  # ---------------------------------------------------------
  if [[ "$EXT_LOWER" =~ ^(mov|mp4|m4v)$ ]]; then
    OUT_FILE="$OUT_DIR/${STEM}.mp4"
    if [[ -e "$OUT_FILE" ]]; then continue; fi

    # Probe Codecs
    VCODEC="$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=nw=1:nk=1 "$FILE" 2>/dev/null || echo "unknown")"
    ACODEC="$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of default=nw=1:nk=1 "$FILE" 2>/dev/null || echo "none")"

    if [[ "$VCODEC" == "unknown" ]]; then
      echo "⚠️ SKIP: Unreadable video $BASE_NAME"
      continue
    fi

    # Strategy: 
    # Video: ALWAYS COPY (-c:v copy). 
    #        This preserves Dolby Vision, HDR10, and 10-bit color exactly.
    # Tag:   Force 'hvc1' if HEVC. Apple uses 'hvc1' or 'hev1'; Android prefers 'hvc1'.
    # Audio: Convert to AAC. Android 10 struggles with Apple's Linear PCM (lpcm) audio.
    #        AAC 256k is transparent for almost all uses. I manually updated to 512k.
    
    if [[ "$VCODEC" == "hevc" ]]; then
      V_FLAGS="-c:v copy -tag:v hvc1"
    elif [[ "$VCODEC" == "h264" ]]; then
      V_FLAGS="-c:v copy -tag:v avc1"
    else
      V_FLAGS="-c:v copy"
    fi

    # Audio Logic
    if [[ "$ACODEC" == "aac" ]]; then
      A_FLAGS="-c:a copy"
      ATYPE="COPY"
    else
      A_FLAGS="-c:a aac -b:a 320k"
      ATYPE="CONVERT"
    fi

    echo "VIDEO: $BASE_NAME [$VCODEC] -> MP4 (HDR Preserved) [Audio:$ATYPE]"

    # -dn drops "data" streams (like GoPro GPMD) that sometimes confuse Android
    if ffmpeg -nostdin -v error -stats -i "$FILE" \
         $V_FLAGS $A_FLAGS \
         -dn -movflags +faststart \
         -map_metadata 0 \
         "$OUT_FILE"; then
      
      # Fix Dates: Prioritize CreationDate (Capture) over MediaCreateDate (Export)
      # We attempt to set the standard 'CreateDate' from 'CreationDate' (the specific Apple tag)
      exiftool -quiet -overwrite_original -api QuickTimeUTC \
        -TagsFromFile "$FILE" \
        "-AllDates<MediaCreateDate" \
        "-AllDates<CreationDate" \
        "-Track*Date<MediaCreateDate" \
        "-Track*Date<CreationDate" \
        "-Media*Date<MediaCreateDate" \
        "-Media*Date<CreationDate" \
        "-FileCreateDate<MediaCreateDate" \
        "-FileCreateDate<CreationDate" \
        "-FileModifyDate<MediaCreateDate" \
        "-FileModifyDate<CreationDate" \
        "$OUT_FILE"
        
    else
      echo "❌ ERROR: Failed to convert $BASE_NAME"
      rm -f "$OUT_FILE" 2>/dev/null
    fi
  fi

done

echo "========================================================="
echo "DONE. Transfer this folder to your Pixel 1: $OUT_DIR"