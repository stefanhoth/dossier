import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { validateEvent } from '../schema/validate.js';

export function registerValidate(program: Command): void {
  program
    .command('validate <file>')
    .description('Validate all events in a JSONL file against their declared schema version')
    .option('--format <fmt>', 'Output format: json|human', 'human')
    .action((file: string, opts: { format: string }) => {
      const lines = readFileSync(file, 'utf8').split('\n').filter(l => l.trim().length > 0);
      const errors: Array<{ line: number; error: string }> = [];

      for (let i = 0; i < lines.length; i++) {
        try {
          const event = JSON.parse(lines[i]);
          validateEvent(event, 'schemas');
        } catch (err) {
          errors.push({ line: i + 1, error: (err as Error).message });
        }
      }

      if (opts.format === 'json') {
        console.log(JSON.stringify({ valid: errors.length === 0, errors }));
      } else {
        if (errors.length === 0) {
          console.log(`OK – ${lines.length} events valid`);
        } else {
          errors.forEach(e => console.error(`Line ${e.line}: ${e.error}`));
        }
      }
      process.exit(errors.length > 0 ? 1 : 0);
    });
}
