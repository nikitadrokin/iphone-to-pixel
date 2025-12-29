#!/usr/bin/env bash
set -euo pipefail

in_dir="${in_dir:-500 Items Part 6}"
out_dir="${out_dir:-500 Items Part 6 Edited}"

# Output container: mp4 (default) or mov
CONTAINER="${CONTAINER:-mp4}"   # mp4|mov
VCODEC="${VCODEC:-hevc}"        # hevc|h264  (hevc smaller; h264 most compatible)

mkdir -p "$out_dir"

is_hdr() {
  # args: file
  ffprobe -v error -select_streams v:0 \
    -show_entries stream=color_primaries,color_transfer,pix_fmt,codec_name \
    -of default=nw=1:nk=1 "$1" | paste -sd, - | \
    grep -qiE '(arib-std-b67|smpte2084|bt2020)'
}

has_aac_audio() {
  # args: file
  ffprobe -v error -select_streams a:0 -show_entries stream=codec_name \
    -of default=nw=1:nk=1 "$1" | grep -qi '^aac$'
}

video_sig() {
  # args: file
  ffprobe -v error -select_streams v:0 \
    -show_entries stream=codec_name,pix_fmt \
    -of default=nw=1:nk=1 "$1" | paste -sd, -
}

remux_mp4() {
  # args: in out
  ffmpeg -y -loglevel error -stats -i "$1" \
    -map 0 -c copy -movflags +faststart -tag:v hvc1 \
    -map_metadata 0 -map_chapters -1 "$2"
}

remux_mov() {
  # args: in out
  ffmpeg -y -loglevel error -stats -i "$1" \
    -map 0 -c copy -tag:v hvc1 \
    -map_metadata 0 -map_chapters -1 "$2"
}

transcode_to_sdr_hevc() {
  # args: in out   (HEVC 8-bit yuv420p, SDR bt709)
  ffmpeg -y -loglevel error -stats -i "$1" \
    -map 0 \
    -vf "zscale=transferin=arib-std-b67:matrixin=bt2020nc:primariesin=bt2020,\
tonemap=mobius,\
zscale=transfer=bt709:matrix=bt709:primaries=bt709,format=yuv420p" \
    -c:v libx265 -tag:v hvc1 -preset medium -crf 24 \
    -c:a aac -b:a 192k -ac 2 -ar 48000 \
    -movflags +faststart \
    -map_metadata 0 -map_chapters -1 "$2"
}

transcode_to_sdr_h264() {
  # args: in out   (H.264 8-bit yuv420p, SDR bt709)
  ffmpeg -y -loglevel error -stats -i "$1" \
    -map 0 \
    -vf "zscale=transferin=arib-std-b67:matrixin=bt2020nc:primariesin=bt2020,\
tonemap=mobius,\
zscale=transfer=bt709:matrix=bt709:primaries=bt709,format=yuv420p" \
    -c:v libx264 -profile:v high -level 4.1 -preset medium -crf 18 \
    -c:a aac -b:a 192k -ac 2 -ar 48000 \
    -movflags +faststart \
    -map_metadata 0 -map_chapters -1 "$2"
}

audiocopy_or_aac() {
  # args: in out  (video already copy; only fix audio)
  if has_aac_audio "$1"; then
    # Copy everything, just faststart/tag
    if [[ "$CONTAINER" == "mp4" ]]; then
      remux_mp4 "$1" "$2"
    else
      remux_mov "$1" "$2"
    fi
  else
    # Copy video; transcode audio to AAC
    ffmpeg -y -loglevel error -stats -i "$1" \
      -map 0:v:0 -map 0:a:0 -c:v copy -tag:v hvc1 \
      -c:a aac -b:a 192k -ac 2 -ar 48000 \
      -movflags +faststart \
      -map_metadata 0 -map_chapters -1 "$2"
  fi
}

find "$in_dir" -maxdepth 1 -type f \( -iname "*.mov" -o -iname "*.mp4" \) -print0 |
while IFS= read -r -d '' f; do
  # Identify video stream
  vsig="$(video_sig "$f" || true)"
  [[ -z "${vsig:-}" ]] && { echo "SKIP (no video): $f"; continue; }

  vcodec="${vsig%%,*}"
  pixfmt="${vsig##*,}"

  base="$(basename "$f")"
  ext="$CONTAINER"
  out="$out_dir/${base%.*}.$ext"
  [[ -f "$out" ]] && { echo "EXISTS: $out (skipping)"; continue; }

  # Case A: Already SDR-friendly, AVC/HEVC + yuv420p → remux; fix audio if needed
  if [[ "$pixfmt" == "yuv420p" && ( "$vcodec" == "hevc" || "$vcodec" == "h264" ) ]]; then
    echo "REMUX or AUDIO FIX: $base  ($vcodec,$pixfmt)"
    audiocopy_or_aac "$f" "$out"
    touch -r "$f" "$out"
    continue
  fi

  # Case B: HDR/10-bit/BT2020 → tone-map to SDR and encode chosen codec
  if is_hdr "$f" || [[ "$pixfmt" =~ ^yuv420p10 ]]; then
    echo "TRANSCODE (HDR→SDR): $base  ($vcodec,$pixfmt)"
    if [[ "$VCODEC" == "hevc" ]]; then
      transcode_to_sdr_hevc "$f" "$out"
    else
      transcode_to_sdr_h264 "$f" "$out"
    fi
    touch -r "$f" "$out"
    continue
  fi

  # Fallback: unknown combos → safest path is H.264 SDR
  echo "TRANSCODE (fallback): $base  ($vcodec,$pixfmt)"
  transcode_to_sdr_h264 "$f" "$out"
  touch -r "$f" "$out"
done

echo "Done. Outputs in: $out_dir"