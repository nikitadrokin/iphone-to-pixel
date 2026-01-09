import { Command } from 'commander';
import { execa } from 'execa';

export const pullFromPixel = new Command()
  .name('pull-from-pixel')
  .alias('pull')
  .description('Pull files from Pixel Camera folder')
  .argument('[destination]', 'destination directory', '.')
  .action(async (destination: string) => {
    // Pull the entire Camera folder contents to the destination
    try {
      await execa('adb', ['pull', '/sdcard/DCIM/Camera/', destination], {
        stdio: 'inherit',
      });
    } catch (error) {
      // adb will have printed the error already due to stdio: inherit
    }
  });
