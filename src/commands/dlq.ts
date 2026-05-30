import { Command } from 'commander';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadConfig } from '../shared/config.js';

export function registerDlq(program: Command): void {
  const dlqCmd = program.command('dlq').description('Dead Letter Queue operations');

  dlqCmd
    .command('list')
    .description('List all DLQ entries')
    .option('--format <fmt>', 'Output format: json|human', 'human')
    .action((opts: { format: string }) => {
      const config = loadConfig();
      const dlqPath = resolve(config.storage.dir, 'dlq.jsonl');
      if (!existsSync(dlqPath)) {
        console.log('DLQ is empty.');
        return;
      }
      const lines = readFileSync(dlqPath, 'utf8').split('\n').filter(l => l.trim().length > 0);
      if (opts.format === 'json') {
        console.log(JSON.stringify(lines.map(l => JSON.parse(l)), null, 2));
      } else {
        console.log(`DLQ entries: ${lines.length}`);
        lines.forEach((l, i) => {
          const entry = JSON.parse(l) as { _dlq: { reason: string }; timestamp: string };
          console.log(`  [${i + 1}] ${entry.timestamp} – ${entry._dlq?.reason}`);
        });
      }
    });

  dlqCmd
    .command('inspect <n>')
    .description('Show full DLQ entry at line N (1-indexed)')
    .action((n: string) => {
      const config = loadConfig();
      const dlqPath = resolve(config.storage.dir, 'dlq.jsonl');
      if (!existsSync(dlqPath)) { console.error('DLQ not found'); process.exit(1); }
      const lines = readFileSync(dlqPath, 'utf8').split('\n').filter(l => l.trim().length > 0);
      const idx = parseInt(n, 10) - 1;
      if (idx < 0 || idx >= lines.length) {
        console.error(`Entry ${n} not found (DLQ has ${lines.length} entries)`);
        process.exit(1);
      }
      console.log(JSON.stringify(JSON.parse(lines[idx]), null, 2));
    });
}
