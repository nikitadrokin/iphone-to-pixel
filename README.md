# iphone-to-pixel

Convert iOS media files (HEIC, HEVC, MOV) to Pixel-compatible formats while preserving HDR, metadata, and quality.

## Features

- **Lossless conversion**: Copies video streams without re-encoding (preserves HDR10, Dolby Vision)
- **Smart audio handling**: Converts incompatible LPCM audio to AAC 320k
- **Metadata preservation**: Fixes dates so Google Photos sorts by capture time
- **HEIC support**: Copies HEIC images as-is (Pixel supports them natively)

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
iphone-to-pixel convert ./MyPhotos

# Default directory is "Part1"
iphone-to-pixel convert
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

## Technical Details

- **Video codec**: Always copied (never re-encoded) to preserve HDR
- **Audio codec**: Converted to AAC 320k for Android compatibility
- **Container**: MP4 with `faststart` flag
- **Metadata**: Syncs all date fields to capture time

## License

MIT
