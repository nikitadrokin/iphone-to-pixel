import { promises as fs } from 'fs';
import path from 'path';
import { Command } from 'commander';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { validateTools } from '../utils/validation.js';
import { fixDatesInPlace, hasValidCreateDate } from '../utils/dates.js';

const optionsSchema = z.object({
  cwd: z.string(),
});

const VIDEO_EXTENSIONS = ['mov', 'mp4', 'm4v', 'mpg', 'mpeg'];

export const fixDates = new Command()
  .name('fix-dates')
  .description('recover/fix creation dates on video files without remuxing')
  .argument('[paths...]', 'directories or files to fix', ['.'])
  .option(
    '-c, --cwd <cwd>',
    'the working directory. defaults to the current directory.',
    process.cwd(),
  )
  .action(async (paths: string[], opts) => {
    try {
      const options = optionsSchema.parse({
        cwd: path.resolve(opts.cwd),
      });

      const resolvedPaths = paths.map((p) => path.resolve(options.cwd, p));

      const pathStats = await Promise.all(
        resolvedPaths.map(async (p) => {
          try {
            const stat = await fs.stat(p);
            return { path: p, stat, exists: true };
          } catch {
            return { path: p, stat: null, exists: false };
          }
        }),
      );

      const existingPaths = pathStats.filter((p) => p.exists);
      if (existingPaths.length === 0) {
        logger.error('No valid paths provided.');
        process.exit(1);
      }

      const files = existingPaths.filter((p) => p.stat?.isFile());
      const directories = existingPaths.filter((p) => p.stat?.isDirectory());

      // Collect all video files
      let videoFiles: string[] = [];

      for (const dir of directories) {
        const dirFiles = await fs.readdir(dir.path, { withFileTypes: true });
        const videos = dirFiles
          .filter((f) => {
            if (!f.isFile() || f.name.startsWith('.')) return false;
            const ext = path.extname(f.name).toLowerCase().slice(1);
            return VIDEO_EXTENSIONS.includes(ext);
          })
          .map((f) => path.join(dir.path, f.name));
        videoFiles.push(...videos);
      }

      for (const file of files) {
        const ext = path.extname(file.path).toLowerCase().slice(1);
        if (VIDEO_EXTENSIONS.includes(ext)) {
          videoFiles.push(file.path);
        }
      }

      if (videoFiles.length === 0) {
        logger.error('No video files found.');
        process.exit(1);
      }

      logger.break();
      logger.log('=========================================================');
      logger.info(`Fixing dates on ${videoFiles.length} video file(s)`);
      logger.log('=========================================================');
      logger.break();

      await validateTools();

      let fixedCount = 0;
      let alreadyOkCount = 0;
      let failedCount = 0;

      for (const file of videoFiles) {
        const baseName = path.basename(file);

        // Check if already has valid date
        if (await hasValidCreateDate(file)) {
          logger.log(`${baseName}`);
          alreadyOkCount++;
          continue;
        }

        // Try to fix
        await fixDatesInPlace(file);

        // Verify if it worked
        if (await hasValidCreateDate(file)) {
          logger.success(`Fixed: ${baseName}`);
          fixedCount++;
        } else {
          logger.warn(
            `Could not recover date: ${baseName} - no valid source date found`,
          );
          failedCount++;
        }
      }

      logger.break();
      logger.log('=========================================================');
      logger.success(
        `DONE. Fixed: ${fixedCount}, Already OK: ${alreadyOkCount}, Failed: ${failedCount}`,
      );
      logger.log('=========================================================');
      logger.break();
    } catch (error) {
      logger.break();
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });
