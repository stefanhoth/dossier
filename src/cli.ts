import { Command } from 'commander';
import { registerInit } from './commands/init.js';
import { registerWrite } from './commands/write.js';
import { registerValidate } from './commands/validate.js';
import { registerVerify } from './commands/verify.js';
import { AppError } from './shared/errors.js';

const program = new Command();
program.name('dossier').description('Agent Event Log CLI – implements Agent Data Format Spec v2.0').version('0.0.0');

registerInit(program);
registerWrite(program);
registerValidate(program);
registerVerify(program);

program.parseAsync().catch((err: unknown) => {
  if (err instanceof AppError) { console.error(`Error: ${err.message}`); process.exit(err.code); }
  console.error(err); process.exit(1);
});
