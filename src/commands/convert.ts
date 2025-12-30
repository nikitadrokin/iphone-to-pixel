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

const IMAGE_EXTENSIONS = ['heic', 'heif', 'jpg', 'jpeg', 'png', 'gif', 'dng'];
const VIDEO_EXTENSIONS = ['mov', 'mp4', 'm4v'];

export const convert = new Command()
  .name('convert')
  .description('convert iOS media files to Pixel-compatible format')
  .argument('[paths...]', 'directory or files to convert', ['Part1'])
  .option(
    '-c, --cwd <cwd>',
    'the working directory. defaults to the current directory.',
    process.cwd(),
  )
  .action(async (paths: string[], opts) => {
    try {
      const options = convertOptionsSchema.parse({
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

      if (directories.length > 1) {
        logger.error(
          'Multiple directories provided. Please provide only one directory.',
        );
        process.exit(1);
      }

      if (directories.length === 1 && files.length === 0) {
        await processDirectory(directories[0].path);
      } else if (files.length > 0) {
        await processIndividualFiles(files.map((f) => f.path));
      } else {
        logger.error('No valid files or directories provided.');
        process.exit(1);
      }
    } catch (error) {
      logger.break();
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

async function processDirectory(dirPath: string): Promise<void> {
  const inDir = path.resolve(dirPath);
  const outDir = `${inDir}_Remuxed`;

  await fs.mkdir(outDir, { recursive: true });

  logger.break();
  logger.log('=========================================================');
  logger.info(`SOURCE:      ${inDir}`);
  logger.info(`DESTINATION: ${outDir}`);
  // logger.info('MODE:        ARCHIVAL (Preserve HDR & HEIC)');
  logger.log('=========================================================');
  logger.break();

  await validateTools();

  const files = await fs.readdir(inDir, { withFileTypes: true });
  const regularFiles = files
    .filter((f) => f.isFile() && !f.name.startsWith('.'))
    .map((f) => path.join(inDir, f.name));

  const { processedCount, skippedCount } = await processFiles(
    regularFiles,
    outDir,
  );

  logger.break();
  logger.log('=========================================================');
  logger.success(
    `DONE. Processed ${processedCount} files, skipped ${skippedCount}.`,
  );
  logger.info(`Transfer this folder to your Pixel: ${outDir}`);
  logger.log('=========================================================');
  logger.break();
}

async function processIndividualFiles(filePaths: string[]): Promise<void> {
  logger.break();
  logger.warn(
    '⚠️  NOTE: For better organization, please provide a directory instead of individual files.',
  );
  logger.break();

  const firstFileDir = path.dirname(filePaths[0]);
  const firstFileBaseName = path.basename(firstFileDir);
  const outDir = path.join(firstFileDir, `${firstFileBaseName}_Remuxed`);

  const regularFiles = filePaths.filter((f) => {
    const ext = path.extname(f).toLowerCase().slice(1);
    return IMAGE_EXTENSIONS.includes(ext) || VIDEO_EXTENSIONS.includes(ext);
  });

  if (regularFiles.length === 0) {
    logger.error('No supported media files provided.');
    process.exit(1);
  }

  await fs.mkdir(outDir, { recursive: true });

  logger.break();
  logger.log('=========================================================');
  logger.info(`SOURCE:      ${regularFiles.length} file(s)`);
  logger.info(`DESTINATION: ${outDir}`);
  logger.info('MODE:        ARCHIVAL (Preserve HDR & HEIC)');
  logger.log('=========================================================');
  logger.break();

  await validateTools();

  const { processedCount, skippedCount } = await processFiles(
    regularFiles,
    outDir,
  );

  logger.break();
  logger.log('=========================================================');
  logger.success(
    `DONE. Processed ${processedCount} files, skipped ${skippedCount}.`,
  );
  logger.info(`Transfer this folder to your Pixel: ${outDir}`);
  logger.log('=========================================================');
  logger.break();
}

async function processFiles(
  files: string[],
  outDir: string,
): Promise<{ processedCount: number; skippedCount: number }> {
  let processedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const baseName = path.basename(file);
    const ext = path.extname(file).toLowerCase().slice(1);

    if (IMAGE_EXTENSIONS.includes(ext)) {
      const outFile = path.join(outDir, baseName);

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

    if (VIDEO_EXTENSIONS.includes(ext)) {
      const stem = path.basename(file, path.extname(file));
      const outFile = path.join(outDir, `${stem}.mp4`);

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

  return { processedCount, skippedCount };
}
