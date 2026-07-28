import { promises as fs } from 'node:fs';
import {
  fixDatesFromFilesystemFallback,
  fixDatesOnPhoto,
  photoEmbeddedFileDatesAlreadyOk,
} from '../utils/dates.js';

/** Copies the image and restores filesystem dates from the best embedded photo date. */
export async function processImage(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  await fs.copyFile(inputPath, outputPath);
  await fixDatesOnPhoto(outputPath);
  // Screenshots and other images without any embedded capture date: fall back
  // to the source file's filesystem date so uploads don't default to today.
  if (!(await photoEmbeddedFileDatesAlreadyOk(outputPath))) {
    await fixDatesFromFilesystemFallback(outputPath, inputPath);
  }
}
