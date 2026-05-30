import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import { applyMigrations } from '../schema/migrate.js';

export function registerMigrate(program: Command): void {
  program
    .command('migrate <file>')
    .description('Forward-migrate all events in a JSONL file to target schema version')
    .requiredOption('--to <version>', 'Target schema version', parseInt)
    .option('--output <file>', 'Write migrated events to file (default: stdout)')
    .action(async (file: string, opts: { to: number; output?: string }) => {
      const lines = readFileSync(file, 'utf8').split('\n').filter(l => l.trim().length > 0);
      const migrated: string[] = [];
      for (const line of lines) {
        const event = JSON.parse(line);
        const from = (event as { _meta: { schemaVersion: number } })._meta.schemaVersion;
        const result = await applyMigrations(event, from, opts.to, 'schemas');
        migrated.push(JSON.stringify(result));
      }
      const output = migrated.join('\n') + '\n';
      if (opts.output) {
        writeFileSync(opts.output, output, 'utf8');
        console.log(`Migrated ${lines.length} events → ${opts.output}`);
      } else {
        process.stdout.write(output);
      }
    });
}
