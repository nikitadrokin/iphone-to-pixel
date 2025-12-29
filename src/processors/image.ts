import { promises as fs } from 'fs';
import path from 'path';
import { execa } from 'execa';
import { logger } from '../utils/logger.js';

/**
 * Process an image file by copying it and fixing metadata dates
 */
export async function processImage(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const baseName = path.basename(inputPath);

  logger.log(`PHOTO: ${baseName} -> Copying (Bit-for-bit)...`);

  // Copy file exactly
  await fs.copyFile(inputPath, outputPath);

  // Fix filesystem dates to match EXIF DateTimeOriginal
  // This ensures Google Photos sorts by capture date, not today
  await execa('exiftool', [
    '-quiet',
    '-overwrite_original',
    '-P',
    '-FileModifyDate<DateTimeOriginal',
    '-FileCreateDate<DateTimeOriginal',
    outputPath,
  ]);
}
