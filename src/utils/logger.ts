import * as kleur from 'kleur';

export const logger = {
  error(...args: unknown[]) {
    console.log(kleur.red(args.join(' ')));
  },
  warn(...args: unknown[]) {
    console.log(kleur.yellow(args.join(' ')));
  },
  info(...args: unknown[]) {
    console.log(kleur.cyan(args.join(' ')));
  },
  success(...args: unknown[]) {
    console.log(kleur.green(args.join(' ')));
  },
  log(...args: unknown[]) {
    console.log(args.join(' '));
  },
  break() {
    console.log('');
  },
};
