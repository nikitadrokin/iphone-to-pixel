#!/usr/bin/env node
import { Command } from 'commander';
import { convert } from './commands/convert.js';
import { randomize } from './commands/randomize.js';

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

async function main() {
  const program = new Command()
    .name('itp')
    .description('Convert iOS media files for Google Pixel 1 compatibility')
    .version('0.0.4');

  program.addCommand(convert);
  program.addCommand(randomize);

  program.parse();
}

main();
