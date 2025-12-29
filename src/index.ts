#!/usr/bin/env node
import { Command } from 'commander';
import { convert } from './commands/convert.js';

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

async function main() {
  const program = new Command()
    .name('iphone-to-pixel')
    .description('Convert iOS media files for Pixel compatibility')
    .version('0.0.0');

  program.addCommand(convert);

  program.parse();
}

main();
