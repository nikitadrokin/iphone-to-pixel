import { Command } from 'commander';
import { execa } from 'execa';

export const pushToPixel = new Command()
    .name('push-to-pixel')
    .alias('push')
    .description('Push files to Pixel Camera folder')
    .argument('<paths...>', 'files to push')
    .action(async (paths: string[]) => {
        for (const p of paths) {
            // Simply execute adb push for each path
            // We let adb handle the output and error reporting by inheriting stdio
            try {
                await execa('adb', ['push', p, '/sdcard/DCIM/Camera'], { stdio: 'inherit' });
            } catch (error) {
                // adb will have printed the error already due to stdio: inherit
                // We just proceed to the next file or exit code 1 if strict checks are needed
                // But simplified request implies just trying to push.
            }
        }
    });
