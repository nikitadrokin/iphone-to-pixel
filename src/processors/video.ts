import path from 'path';
import { promises as fs } from 'fs';
import { execa } from 'execa';
import { logger } from '../utils/logger.js';

interface CodecInfo {
  video: string;
  audio: string;
}

/**
 * Probe video file to get codec information
 */
async function probeCodecs(inputPath: string): Promise<CodecInfo> {
  try {
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

    return {
      video: vcodec.trim() || 'unknown',
      audio: acodec.trim() || 'none',
    };
  } catch {
    return { video: 'unknown', audio: 'none' };
  }
}

/**
 * Process a video file by remuxing to MP4 and fixing metadata
 */
export async function processVideo(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const baseName = path.basename(inputPath);

  // Probe codecs
  const codecs = await probeCodecs(inputPath);

  if (codecs.video === 'unknown') {
    logger.warn(`⚠️  SKIP: Unreadable video ${baseName}`);
    return;
  }

  // Video flags: Always copy to preserve HDR/Dolby Vision
  let videoFlags: string[];
  if (codecs.video === 'hevc') {
    videoFlags = ['-c:v', 'copy', '-tag:v', 'hvc1'];
  } else if (codecs.video === 'h264') {
    videoFlags = ['-c:v', 'copy', '-tag:v', 'avc1'];
  } else {
    videoFlags = ['-c:v', 'copy'];
  }

  // Audio flags: Convert to AAC if needed
  let audioFlags: string[];
  let audioType: string;
  if (codecs.audio === 'aac') {
    audioFlags = ['-c:a', 'copy'];
    audioType = 'COPY';
  } else {
    audioFlags = ['-c:a', 'aac', '-b:a', '320k'];
    audioType = 'CONVERT';
  }

  logger.log(
    `VIDEO: ${baseName} [${codecs.video}] -> MP4 (HDR Preserved) [Audio:${audioType}]`,
  );

  try {
    // Remux video
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
        stdio: 'inherit',
      },
    );

    // Fix dates: Prioritize CreationDate over MediaCreateDate
    await execa('exiftool', [
      '-quiet',
      '-overwrite_original',
      '-api',
      'QuickTimeUTC',
      '-TagsFromFile',
      inputPath,
      '-AllDates<MediaCreateDate',
      '-AllDates<CreationDate',
      '-Track*Date<MediaCreateDate',
      '-Track*Date<CreationDate',
      '-Media*Date<MediaCreateDate',
      '-Media*Date<CreationDate',
      '-FileCreateDate<MediaCreateDate',
      '-FileCreateDate<CreationDate',
      '-FileModifyDate<MediaCreateDate',
      '-FileModifyDate<CreationDate',
      outputPath,
    ]);
  } catch (error) {
    logger.error(`❌ ERROR: Failed to convert ${baseName}`);
    // Clean up failed output file
    try {
      await fs.unlink(outputPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}
