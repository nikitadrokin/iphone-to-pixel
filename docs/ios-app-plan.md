# Photo Bridge for iOS — build plan

Status: sketch, nothing built. Supersedes the remux-based design.

## The shape of it

The photo library is not a filesystem you can hand to another app. Bytes have to be
exported out of it into your own container before anything else can touch them. That
export is one write, and it takes a destination filename.

So the `.mov` → `.mp4` conversion is not a step. It is the name you pass to the write
you were already doing.

```
PHAsset ──export raw resource bytes──▶ outbox/IMG_1234.mp4 ──copy──▶ Resilio folder
                                              ▲
                                    the only decision made here
                                       is what to call it
```

No AVFoundation. No codec probing. No container rewrite. No re-encode.

## Why not rename on the Pixel

Possible, but worse on every axis:

- Resilio syncs verbatim; it will not rename for you. You would need an automation app
  or Termux script watching the folder on an Android 10 phone with no security patches
  since 2019, staying alive through Doze.
- Renaming inside a synced folder fights the sync — Resilio sees delete + create and may
  propagate it back or re-pull the original.
- It saves nothing. The iOS write happens either way.

## What you build

**1. LibraryReader**
`PHAsset` fetch with a date predicate. Filter to images and videos. Ask the ledger what
it has already sent.

**2. Exporter**
`PHAssetResourceManager.writeData(for:toFile:options:)` with
`isNetworkAccessAllowed = true`, writing to a filename chosen by type:

| Source | Written as | Why |
| --- | --- | --- |
| `.mov` (HEVC or H.264, 8- or 10-bit) | `.mp4` | MediaStore indexes on extension |
| `.heic` / `.jpg` / `.png` | unchanged | Android 10 handles HEIF natively |

Set the file's modification date to the asset's `creationDate` afterward — Google Photos
falls back to it when embedded metadata is missing, and this is a `FileManager` attribute
write, not a metadata parse.

Note: iCloud originals may not be on the device. With Optimize iPhone Storage on, this
step is a network download and is the slowest thing the app does. It needs real progress,
not a spinner.

**3. Ledger**
SwiftData or SQLite keyed on `PHAsset.localIdentifier`, plus a SHA-256 of the source bytes
for dedupe. States: `discovered → exported → handedOff → settled`, with `failed` and
`skipped`. This is what makes the app resumable and stops it re-sending the library on
every launch.

**4. Outbox**
Resolve a stored security-scoped bookmark, copy the staged file into the Resilio folder,
release. Stage inside your own container first and copy only complete files — Resilio will
happily start syncing a truncated video.

**5. Batcher**
Pause on two limits: free space on the iPhone, and free space on the Pixel (~20 GB usable).
Resume when space returns.

**6. Setup flow**
One-time, and every step is silent when it fails:
- Photos permission
- Pick the Resilio folder → persist the bookmark
- Confirm the Pixel folder is toggled on under Google Photos → Backup → Back up device folders
- First upload verified against the storage counter (see below)

## What Resilio handles

Everything between the two folders:

- Peer discovery on the LAN
- Encrypted transport
- Chunking, resume, retry after interruption
- Conflict handling
- Its own SAF grant on the Android side

Set the **Pixel as a read-only peer**. When Google Photos' *Free up space* deletes local
copies after upload, a two-way sync would propagate those deletions back to the iPhone.

## What disappeared from the earlier design

| Dropped | Reason |
| --- | --- |
| AVFoundation remux layer | Rename at export replaces it |
| Codec probing | Nothing branches on codec anymore |
| Audio transcode fallback | Nothing rewrites the container |
| Metadata rewriting (the `utils/dates.ts` port) | Byte copy preserves EXIF and QuickTime `creation_time` |
| 10-bit HEVC concern | Confirmed: uploads fine, only on-device rendering fails |

Only the file modification date still needs setting.

## Open items

- **Does Resilio expose a writable File Provider on iOS?** The whole design hangs on this.
  Ten minutes with the App Store build answers it. If not, Layer 4 becomes `URLSession`
  background `PUT` to a WebDAV server app on the Pixel — same SAF-granted folder, and you
  get a response code per file instead of inferring success.
- **Live Photos.** Two resources per asset. Still only, or muxed Google Motion Photo?
  Decide before the ledger schema, because it changes what "one asset" means.
- **`ftyp` brand stays `qt`.** A renamed file claims `.mp4` but its brand box still says
  QuickTime. Demuxers that sniff content don't care, and Google Photos evidently doesn't.
  Anything downstream that validates the brand rather than the bitstream would.
- **Background execution won't carry a large batch.** `BGProcessingTask` runs when iOS
  decides, not when asked. Plan for foreground-on-charger and design the UI so that reads
  as deliberate.

## Build order

| | Milestone | Done when |
| --- | --- | --- |
| M0 | Prove the path | A file saved from iOS Files reaches Google Photos and **the storage counter does not move** |
| M1 | One asset, end to end | Newest video exported as `.mp4`, lands in the folder, uploads |
| M2 | Ledger | Kill the app mid-batch; it resumes without duplicating |
| M3 | Scale | Free-space backpressure both ends, iCloud download progress, a few thousand assets |

M0 is the only one that can invalidate the design. Do it before writing Swift.
