import path from 'path';
import { promises as fs } from 'fs';
import { execa } from 'execa';
import { logger } from '../utils/logger.js';

/**
 * Process a legacy video file (e.g. MPEG-1/2) by transcoding to H.264/AAC MP4
 */
export async function processLegacyVideo(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const baseName = path.basename(inputPath);

  logger.log(`LEGACY VIDEO: ${baseName} -> MP4 (Transcoding to H.264/AAC)`);

  try {
    await execa(
      'ffmpeg',
      [
        '-nostdin',
        '-v',
        'error',
        '-stats',
        '-i',
        inputPath,
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-preset',
        'slow',
        '-crf',
        '18',
        '-c:a',
        'aac',
        '-b:a',
        '320k',
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

    // Fix dates
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
    try {
      await fs.unlink(outputPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}
