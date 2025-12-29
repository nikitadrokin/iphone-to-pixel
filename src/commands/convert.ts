import { promises as fs } from 'fs';
import path from 'path';
import { Command } from 'commander';
import { z } from 'zod';
import { processImage } from '../processors/image.js';
import { processVideo } from '../processors/video.js';
import { logger } from '../utils/logger.js';
import { validateTools } from '../utils/validation.js';

const convertOptionsSchema = z.object({
  cwd: z.string(),
});

const IMAGE_EXTENSIONS = ['heic', 'heif', 'jpg', 'jpeg', 'png', 'gif'];
const VIDEO_EXTENSIONS = ['mov', 'mp4', 'm4v'];

export const convert = new Command()
  .name('convert')
  .description('convert iOS media files to Pixel-compatible format')
  .argument('[directory]', 'directory containing media files', 'Part1')
  .option(
    '-c, --cwd <cwd>',
    'the working directory. defaults to the current directory.',
    process.cwd(),
  )
  .action(async (directory: string, opts) => {
    try {
      const options = convertOptionsSchema.parse({
        cwd: path.resolve(opts.cwd),
      });

      const targetDir = path.resolve(options.cwd, directory);

      // Check if directory exists
      try {
        await fs.access(targetDir);
      } catch {
        logger.error(`Directory '${directory}' does not exist.`);
        process.exit(1);
      }

      const inDir = path.resolve(targetDir);
      const outDir = `${inDir}_Remuxed`;

      // Create output directory
      await fs.mkdir(outDir, { recursive: true });

      logger.break();
      logger.info('=========================================================');
      logger.info(`SOURCE:      ${inDir}`);
      logger.info(`DESTINATION: ${outDir}`);
      logger.info('MODE:        ARCHIVAL (Preserve HDR & HEIC)');
      logger.info('=========================================================');
      logger.break();

      // Validate required tools
      await validateTools();

      // Get all files in directory
      const files = await fs.readdir(inDir, { withFileTypes: true });
      const regularFiles = files
        .filter((f) => f.isFile() && !f.name.startsWith('.'))
        .map((f) => path.join(inDir, f.name));

      let processedCount = 0;
      let skippedCount = 0;

      for (const file of regularFiles) {
        const baseName = path.basename(file);
        const ext = path.extname(file).toLowerCase().slice(1);

        // Handle images
        if (IMAGE_EXTENSIONS.includes(ext)) {
          const outFile = path.join(outDir, baseName);

          // Skip if already exists
          try {
            await fs.access(outFile);
            skippedCount++;
            continue;
          } catch {
            // File doesn't exist, proceed
          }

          await processImage(file, outFile);
          processedCount++;
          continue;
        }

        // Handle videos
        if (VIDEO_EXTENSIONS.includes(ext)) {
          const stem = path.basename(file, path.extname(file));
          const outFile = path.join(outDir, `${stem}.mp4`);

          // Skip if already exists
          try {
            await fs.access(outFile);
            skippedCount++;
            continue;
          } catch {
            // File doesn't exist, proceed
          }

          await processVideo(file, outFile);
          processedCount++;
          continue;
        }
      }

      logger.break();
      logger.info('=========================================================');
      logger.success(
        `DONE. Processed ${processedCount} files, skipped ${skippedCount}.`,
      );
      logger.info(`Transfer this folder to your Pixel: ${outDir}`);
      logger.info('=========================================================');
      logger.break();
    } catch (error) {
      logger.break();
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });
