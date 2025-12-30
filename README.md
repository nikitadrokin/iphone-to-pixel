# iphone-to-pixel

Convert iOS media files (HEIC, HEVC, MOV) to Pixel-compatible formats while preserving HDR, metadata, and quality.

## Features

1. Lossless conversion for HEIC photos (Google Pixel 1 supports them)
2. Near-lossless conversion from MOV and M4A videos to mp4
3. Metadata preservation (iOS Photos sometimes sets time metadata weirdly)

## Installation

### Prerequisites

```bash
# macOS
brew install ffmpeg exiftool
```

> Note: This is currently only tested for macOS. I don't know if this will support Windows or Linux.

### Install CLI

```bash
npm install -g iphone-to-pixel
# or
bun install -g iphone-to-pixel
```

## Usage

```bash
# Convert all files in a directory
itp convert ./MyPhotos
```

Output will be created in `{directory}_Remuxed`

## What it does

### Images (HEIC, JPG, PNG, GIF)

- Copies files bit-for-bit
- Fixes filesystem dates to match EXIF capture date

### Videos (MOV, MP4, M4V)

- Remuxes to MP4 container (no quality loss)
- Preserves HEVC/H.264 video streams (keeps HDR)
- Converts audio to AAC 320k if needed
- Adds `faststart` flag for faster playback
- Fixes all metadata dates

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Run locally
bun run start convert ./test-folder
```

## License

MIT
