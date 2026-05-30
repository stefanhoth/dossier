import { Command } from 'commander';
import { loadConfig } from '../shared/config.js';
import { FileStore } from '../store/file.js';
import { applyMigrations } from '../schema/migrate.js';
import { resolve } from 'node:path';

export function registerRead(program: Command): void {
  program
    .command('read')
    .description('Read and filter events from the log')
    .option('--trace <id>', 'Filter by traceId')
    .option('--from-seq <n>', 'Start sequence number', parseInt)
    .option('--to-seq <n>', 'End sequence number', parseInt)
    .option('--date <YYYY-MM-DD>', 'Read from specific day (default: today)')
    .option('--migrate', 'Migrate events to current schema version')
    .option('--format <fmt>', 'Output format: json|jsonl|human', 'jsonl')
    .action(async (opts: {
      trace?: string; fromSeq?: number; toSeq?: number;
      date?: string; migrate?: boolean; format: string;
    }) => {
      const config = loadConfig();
      const store = new FileStore(resolve(config.storage.dir));
      let events = await store.readRange({
        traceId: opts.trace,
        fromSeq: opts.fromSeq,
        toSeq: opts.toSeq,
        date: opts.date,
      });

      if (opts.migrate) {
        events = await Promise.all(
          events.map(e =>
            applyMigrations(e, e._meta.schemaVersion, config.currentSchemaVersion, 'schemas')
              .then(r => r as typeof e)
          )
        );
      }

      if (opts.format === 'json') {
        console.log(JSON.stringify(events, null, 2));
      } else if (opts.format === 'jsonl') {
        events.forEach(e => console.log(JSON.stringify(e)));
      } else {
        events.forEach(e => console.log(`[${e._meta.seqNo}] ${e._meta.traceId} – ${e.action} (${e.status})`));
      }
    });
}
