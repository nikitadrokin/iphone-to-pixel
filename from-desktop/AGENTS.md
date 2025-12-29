# iOS to Pixel Transfer CLI Tool

## Tech Stack Recommendation

### Runtime: **Bun** (or Node.js as fallback)

- **Why Bun:**

  - 3-4x faster than Node.js for file operations
  - Native TypeScript support (no build step needed)
  - Drop-in replacement for Node.js (npm compatible)
  - Fast process spawning (critical for ffmpeg/exiftool calls)
  - Single binary distribution option via `bun build --compile`

- **Fallback to Node.js:**
  - Wider compatibility if Bun adoption is a concern
  - Same codebase works on both runtimes

### Language: **TypeScript**

- Type safety for file paths, codec names, metadata
- Better DX for CLI argument parsing
- Self-documenting code

### Core Dependencies

#### CLI Framework

- **`commander`** - Simple, battle-tested CLI argument parsing
  - Alternative: `oclif` (more opinionated, includes plugin system)

#### Process Management

- **`execa`** - Better than child_process, handles stdio elegantly
  - Needed for spawning: ffmpeg, ffprobe, exiftool

#### UI/UX

- **`chalk`** - Colored terminal output
- **`ora`** - Spinners for long operations
- **`cli-progress`** - Progress bars for batch processing
- **`prompts`** - Interactive mode (ask user for folder, options)

#### File Operations

- **`fast-glob`** - Faster than native glob, consistent across platforms
- **`fs-extra`** - Promisified fs with extras (copy, move, ensureDir)

#### Utilities

- **`zod`** - Runtime validation for config files
- **`cosmiconfig`** - Load config from multiple sources (.rc files, package.json)

---

## Architecture

### Project Structure

```
ios-to-pixel-cli/
├── src/
│   ├── commands/
│   │   ├── convert.ts       # Main conversion command
│   │   ├── preflight.ts     # Date fixing only
│   │   └── analyze.ts       # Dry-run: show what would happen
│   ├── processors/
│   │   ├── image.ts         # HEIC/JPG handling
│   │   ├── video.ts         # MOV/MP4 remuxing
│   │   └── metadata.ts      # exiftool operations
│   ├── utils/
│   │   ├── ffmpeg.ts        # ffmpeg/ffprobe wrappers
│   │   ├── logger.ts        # Colored output utilities
│   │   └── validation.ts    # Check for required tools
│   ├── types/
│   │   └── index.ts         # Codec, FileInfo, ConversionOptions types
│   └── index.ts             # CLI entry point
├── package.json
├── tsconfig.json
└── README.md
```

### Key Features to Implement

#### 1. **Multi-mode Operation**

```bash
# Basic usage (like current script)
ios-to-pixel convert ./Part1

# Interactive mode
ios-to-pixel convert --interactive

# Dry-run
ios-to-pixel analyze ./Part1

# Config-driven
ios-to-pixel convert --config ./ios-to-pixel.config.json
```

#### 2. **Configuration File Support**

```json
{
  "audio": {
    "bitrate": "320k",
    "preserveChannels": true
  },
  "video": {
    "preserveHDR": true,
    "faststart": true
  },
  "output": {
    "suffix": "_Remuxed",
    "skipExisting": true
  }
}
```

#### 3. **Parallel Processing**

- Use `p-queue` or `p-limit` to process N files concurrently
- Current bash script is sequential (slow for large batches)
- Limit concurrency to avoid overwhelming system (default: 4)

#### 4. **Progress Reporting**

```
Converting 47 files...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 32/47 (68%)

[✓] IMG_1234.HEIC → Copied (0.1s)
[⚙] VID_5678.MOV → Remuxing [hevc/lpcm→aac]...
[✓] IMG_9012.JPG → Copied (0.05s)
```

#### 5. **Error Handling & Resume**

- Log failed files to `.ios-to-pixel-errors.json`
- Offer `--resume` flag to retry only failed files
- Validate tool availability before starting (ffmpeg, exiftool)

#### 6. **Platform Detection**

- Detect if running on macOS vs Linux
- Use `stat -f %B` on macOS, `stat -c %W` on Linux
- Warn if exiftool/ffmpeg not found with install instructions

---

## Distribution Strategy

### 1. **npm Package** (Primary)

```bash
npm install -g ios-to-pixel
# or
npx ios-to-pixel convert ./Part1
```

### 2. **Bun Binary** (Optional)

```bash
# Compile to single binary (no runtime needed)
bun build --compile src/index.ts --outfile ios-to-pixel

# Distribute via GitHub releases
curl -L https://github.com/user/ios-to-pixel/releases/latest/download/ios-to-pixel-macos -o ios-to-pixel
chmod +x ios-to-pixel
```

### 3. **Homebrew** (Future)

```bash
brew install ios-to-pixel
```

---

## Performance Optimizations

### 1. **Batch exiftool Calls**

- Current script calls exiftool once per file
- exiftool supports batch mode: process 100 files in one invocation
- 10-50x faster for large batches

### 2. **Smart Skipping**

- Hash source files, store in `.ios-to-pixel-cache.json`
- Skip re-processing if source hasn't changed

### 3. **Parallel ffmpeg**

- Process multiple videos simultaneously (CPU/GPU permitting)
- Use `p-limit` to cap concurrency

### 4. **Streaming Progress**

- Parse ffmpeg stderr for progress percentage
- Show real-time progress per file (not just spinner)

---

## Testing Strategy

### Unit Tests (Vitest)

- Test codec detection logic
- Test file path handling (spaces, special chars)
- Test config validation (zod schemas)

### Integration Tests

- Use fixture files (small test videos/images)
- Verify output files have correct codecs
- Verify metadata preservation

### E2E Tests

- Mock ffmpeg/exiftool (too slow for CI)
- Or use Docker with real tools

---

## Example Usage

```typescript
// src/processors/video.ts
import { execa } from 'execa';
import { logger } from '../utils/logger';

interface VideoConversionOptions {
  audioBitrate: string;
  preserveChannels: boolean;
  preserveHDR: boolean;
}

export async function convertVideo(
  inputPath: string,
  outputPath: string,
  options: VideoConversionOptions,
): Promise<void> {
  const { stdout: vcodec } = await execa('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=codec_name',
    '-of',
    'default=nw=1:nk=1',
    inputPath,
  ]);

  const { stdout: acodec } = await execa('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'a:0',
    '-show_entries',
    'stream=codec_name',
    '-of',
    'default=nw=1:nk=1',
    inputPath,
  ]);

  const videoFlags =
    vcodec === 'hevc' ? ['-c:v', 'copy', '-tag:v', 'hvc1'] : ['-c:v', 'copy'];

  const audioFlags =
    acodec === 'aac'
      ? ['-c:a', 'copy']
      : ['-c:a', 'aac', '-b:a', options.audioBitrate];

  if (options.preserveChannels && acodec !== 'aac') {
    audioFlags.push('-ac', '0');
  }

  logger.info(`Converting ${inputPath} [${vcodec}/${acodec}]`);

  await execa(
    'ffmpeg',
    [
      '-nostdin',
      '-v',
      'error',
      '-stats',
      '-i',
      inputPath,
      ...videoFlags,
      ...audioFlags,
      '-dn',
      '-movflags',
      '+faststart',
      '-map_metadata',
      '0',
      outputPath,
    ],
    {
      stdio: 'inherit', // Show ffmpeg progress
    },
  );
}
```

---

## Advantages Over Bash Script

| Feature            | Bash Script | CLI Tool                     |
| ------------------ | ----------- | ---------------------------- |
| **Speed**          | Sequential  | Parallel processing          |
| **Error handling** | Basic       | Retry, resume, detailed logs |
| **Progress**       | Text output | Progress bars, spinners      |
| **Config**         | Hardcoded   | Config files, flags          |
| **Cross-platform** | macOS only  | macOS + Linux                |
| **Distribution**   | Copy file   | `npm install -g`             |
| **Testing**        | Manual      | Automated tests              |
| **Maintenance**    | Bash quirks | Type-safe TypeScript         |

---

## Estimated Development Time

- **MVP (basic conversion):** 2-3 days
- **Full features (parallel, config, resume):** 1 week
- **Polish (tests, docs, CI/CD):** 2-3 days

**Total:** ~2 weeks for production-ready tool

---

## Similar Projects for Inspiration

- **`shadcn`** - CLI for copying component templates
- **`create-t3-app`** - Interactive project scaffolder
- **`wrangler`** - Cloudflare's CLI (good UX patterns)
- **`turbo`** - Monorepo tool (excellent progress UI)
