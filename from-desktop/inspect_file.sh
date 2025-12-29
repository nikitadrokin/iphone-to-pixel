#!/usr/bin/env bash
set -euo pipefail

# Responsive media inspector (Bash 3.2 compatible)
# Usage: ./inspect_file.sh <file-or-directory>

command -v ffprobe >/dev/null 2>&1 || { echo "ffprobe not found. Install ffmpeg."; exit 1; }
shopt -s nullglob

cols() { tput cols 2>/dev/null || echo "${COLUMNS:-120}"; }
ELL="..."
cutfit() { # cutfit <string> <width>
  local s="${1:-}" w="${2:-0}"
  (( w <= 0 )) && { printf ""; return; }
  local sl=${#s}
  if (( sl <= w )); then printf "%s" "$s"
  elif (( w <= 3 )); then printf "%.*s" "$w" "$s"
  else printf "%s%s" "${s:0:w-3}" "$ELL"
  fi
}

MODE="standard"; F=32; K=5; C=10; VV=10; AA=8; WH=12; DU=7; FP=6; AU=5; MP=8; IF=7; LP=9; NT=30
set_layout() {
  local W; W="$(cols)"
  if   (( W < 90 )); then MODE="compact";  F=26; K=5; WH=11; DU=7; FP=6; VV=8;  AA=7
  elif (( W < 130)); then MODE="standard"; F=32; K=5; C=10; VV=10; AA=8; WH=12; DU=7; FP=6; AU=5; MP=8
  else                    MODE="wide";     F=40; K=5; C=12; VV=10; AA=8; WH=12; DU=7; FP=6; AU=5; MP=8; IF=7; LP=9; NT=30
  fi
}

hr() { local W; W="$(cols)"; printf '%*s\n' "$W" '' | tr ' ' '-'; }

print_header() {
  case "$MODE" in
    compact)
      printf "%-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s\n" \
        "$F" "FILE" "$K" "KIND" "$WH" "WxH" "$DU" "DUR(s)" "$FP" "FPS" "$VV" "VCODEC" "$AA" "ACODEC"
      hr
      ;;
    standard)
      printf "%-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s\n" \
        "$F" "FILE" "$K" "KIND" "$C" "CONTAINER" "$VV" "VCODEC" "$AA" "ACODEC" "$WH" "WxH" "$DU" "DUR(s)" "$FP" "FPS" "$AU" "AUDIO" "$MP" "MP4-SAFE"
      hr
      ;;
    wide)
      printf "%-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s\n" \
        "$F" "FILE" "$K" "KIND" "$C" "CONTAINER" "$VV" "VCODEC" "$AA" "ACODEC" "$WH" "WxH" "$DU" "DUR(s)" "$FP" "FPS" "$AU" "AUDIO" "$MP" "MP4-SAFE" "$IF" "IMG_FMT" "$LP" "LIVE_PAIR" "$NT" "NOTES"
      hr
      ;;
  esac
}

row_compact() {
  local file="$1" kind="$2" container="$3" vcodec="$4" acodec="$5" wh="$6" dur="$7" fps="$8"
  printf "%-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s\n" \
    "$F"  "$(cutfit "$file" $F)" \
    "$K"  "$kind" \
    "$WH" "$(cutfit "$wh" $WH)" \
    "$DU" "$(cutfit "$dur" $DU)" \
    "$FP" "$(cutfit "$fps" $FP)" \
    "$VV" "$(cutfit "$vcodec" $VV)" \
    "$AA" "$(cutfit "$acodec" $AA)"
}

row_standard() {
  local file="$1" kind="$2" container="$3" vcodec="$4" acodec="$5" wh="$6" dur="$7" fps="$8" audio="$9" mp4="${10}"
  printf "%-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s\n" \
    "$F"  "$(cutfit "$file" $F)" \
    "$K"  "$kind" \
    "$C"  "$(cutfit "$container" $C)" \
    "$VV" "$(cutfit "$vcodec" $VV)" \
    "$AA" "$(cutfit "$acodec" $AA)" \
    "$WH" "$(cutfit "$wh" $WH)" \
    "$DU" "$(cutfit "$dur" $DU)" \
    "$FP" "$(cutfit "$fps" $FP)" \
    "$AU" "$(cutfit "$audio" $AU)" \
    "$MP" "$(cutfit "$mp4" $MP)"
}

row_wide() {
  local file="$1" kind="$2" container="$3" vcodec="$4" acodec="$5" wh="$6" dur="$7" fps="$8" audio="$9" mp4="${10}" img="${11}" live="${12}" notes="${13}"
  printf "%-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s | %-*s\n" \
    "$F"  "$(cutfit "$file" $F)" \
    "$K"  "$kind" \
    "$C"  "$(cutfit "$container" $C)" \
    "$VV" "$(cutfit "$vcodec" $VV)" \
    "$AA" "$(cutfit "$acodec" $AA)" \
    "$WH" "$(cutfit "$wh" $WH)" \
    "$DU" "$(cutfit "$dur" $DU)" \
    "$FP" "$(cutfit "$fps" $FP)" \
    "$AU" "$(cutfit "$audio" $AU)" \
    "$MP" "$(cutfit "$mp4" $MP)" \
    "$IF" "$(cutfit "$img" $IF)" \
    "$LP" "$(cutfit "$live" $LP)" \
    "$NT" "$(cutfit "$notes" $NT)"
}

# ---- core media logic ----
if [[ $# -ne 1 ]]; then echo "Usage: $0 <file-or-directory>" >&2; exit 1; fi
INPUT="$1"

is_live_pair() {
  local path="$1" dir base stem ext
  dir="$(dirname "$path")"; base="$(basename "$path")"; stem="${base%.*}"; ext="${base##*.}"
  shopt -s nocasematch
  if [[ "$ext" =~ ^(heic|heif|jpg|jpeg|png)$ ]]; then
    [[ -e "$dir/$stem.MOV" || -e "$dir/$stem.mov" ]] && { echo "YES"; return; }
  fi
  if [[ "$ext" =~ ^(mov)$ ]]; then
    for cand in heic HEIC heif HEIF jpg JPG jpeg JPEG png PNG; do [[ -e "$dir/$stem.$cand" ]] && { echo "YES"; return; }; done
  fi
  echo "NO"
}

mov_mp4_safe() {
  local file="$1" vcodec acodec v_ok="NO" a_ok="NO"
  vcodec="$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=nw=1:nk=1 "$file" || true)"
  acodec="$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of default=nw=1:nk=1 "$file" || true)"
  [[ "$vcodec" == "h264" || "$vcodec" == "hevc" ]] && v_ok="YES"
  [[ "$acodec" == "aac" || -z "$acodec" ]] && a_ok="YES"
  [[ "$v_ok" == "YES" && "$a_ok" == "YES" ]] && echo "YES" || echo "NO"
}

inspect_one() {
  local f="$1" mime container kind notes=""
  mime="$(file -b --mime-type "$f" 2>/dev/null || echo "")"
  container="$(ffprobe -v error -show_entries format=format_name -of default=nw=1:nk=1 "$f" 2>/dev/null || echo "")"

  if [[ "$mime" == video/* ]] || [[ "$container" =~ ^(mov|mp4|matroska|quicktime)$ ]]; then kind="video"
  elif [[ "$mime" == image/* ]]; then kind="photo"
  else case "${f##*.}" in MOV|mov|MP4|mp4|mkv) kind="video" ;; HEIC|heic|HEIF|heif|jpg|jpeg|png|tif|tiff|gif) kind="photo" ;; *) kind="unknown" ;; esac
  fi

  local vcodec="" acodec="" wh="" dur="" fps="" audio="NO" mp4safe="" fmt=""

  if [[ "$kind" == "video" ]]; then
    vcodec="$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,profile -of default=nw=1:nk=1 "$f" 2>/dev/null | head -n1 || true)"
    acodec="$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of default=nw=1:nk=1 "$f" 2>/dev/null | head -n1 || true)"
    [[ -n "$acodec" ]] && audio="YES"
    local w h fr
    w="$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of default=nw=1:nk=1 "$f" 2>/dev/null || echo "")"
    h="$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of default=nw=1:nk=1 "$f" 2>/dev/null || echo "")"
    [[ -n "$w" && -n "$h" ]] && wh="${w}x${h}"
    dur="$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$f" 2>/dev/null || echo "")"
    [[ -n "$dur" ]] && dur="$(awk -v d="$dur" 'BEGIN{printf("%.2f", d)}')"
    fr="$(ffprobe -v error -select_streams v:0 -show_entries stream=avg_frame_rate -of default=nw=1:nk=1 "$f" 2>/dev/null || echo "")"
    if [[ "$fr" == */* ]]; then fps="$(awk -F/ '{if ($2==0) print ""; else printf("%.3f",$1/$2)}' <<<"$fr")"; else fps="$fr"; fi
    [[ -z "$container" ]] && container="${mime#*/}"
    if [[ "$container" =~ (mov|quicktime) ]]; then mp4safe="$(mov_mp4_safe "$f")"; [[ "$mp4safe" == "NO" ]] && notes="Non-standard tracks/codecs"; fi

    case "$MODE" in
      compact)  row_compact   "$(basename "$f")" "video" "$container" "$vcodec" "$acodec" "$wh" "$dur" "$fps" ;;
      standard) row_standard  "$(basename "$f")" "video" "$container" "$vcodec" "$acodec" "$wh" "$dur" "$fps" "$audio" "$mp4safe" ;;
      wide)     row_wide      "$(basename "$f")" "video" "$container" "$vcodec" "$acodec" "$wh" "$dur" "$fps" "$audio" "$mp4safe" "" "$(is_live_pair "$f")" "$notes" ;;
    esac

  elif [[ "$kind" == "photo" ]]; then
    fmt="$(sips -g format "$f" 2>/dev/null | awk -F': ' '/format:/{print tolower($2)}')"
    local w h; w="$(sips -g pixelWidth "$f" 2>/dev/null | awk -F': ' '/pixelWidth:/{print $2}')" ; h="$(sips -g pixelHeight "$f" 2>/dev/null | awk -F': ' '/pixelHeight:/{print $2}')"
    [[ -z "$fmt" ]] && fmt="$(mdls -name kMDItemContentType "$f" 2>/dev/null | awk -F' = ' '{print tolower($2)}' | tr -d '"')"
    [[ -n "$mime" ]] && container="${mime#*/}" || container="${fmt}"
    [[ "$fmt" == "heic" || "$fmt" == "heif" ]] && notes="HEIF/HEIC (OK)"
    [[ -n "$w" && -n "$h" ]] && wh="${w}x${h}"

    case "$MODE" in
      compact)  row_compact  "$(basename "$f")" "photo" "$container" "" "" "$wh" "" "" ;;
      standard) row_standard "$(basename "$f")" "photo" "$container" "" "" "$wh" "" "" "" "" ;;
      wide)     row_wide     "$(basename "$f")" "photo" "$container" "" "" "$wh" "" "" "" "" "$fmt" "$(is_live_pair "$f")" "$notes" ;;
    esac
  fi
}

collect_targets() {
  local p="$1"
  if [[ -d "$p" ]]; then
    find "$p" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.heic" -o -iname "*.heif" -o \
                         -iname "*.tif" -o -iname "*.tiff" -o -iname "*.gif"  -o -iname "*.mov" -o -iname "*.mp4" -o -iname "*.m4v" -o -iname "*.mkv" \) -print0
  elif [[ -f "$p" ]]; then printf "%s\0" "$p"; fi
}

# run
set_layout
print_header
collect_targets "$INPUT" | while IFS= read -r -d '' f; do inspect_one "$f"; done