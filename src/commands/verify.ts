import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { verifyChain } from '../integrity/verify.js';

export function registerVerify(program: Command): void {
  program
    .command('verify <file>')
    .description('Verify hash-chain integrity of a JSONL event log')
    .option('--format <fmt>', 'Output format: json|human', 'human')
    .action((file: string, opts: { format: string }) => {
      const lines = readFileSync(file, 'utf8').split('\n').filter(l => l.trim().length > 0);
      const result = verifyChain(lines);

      if (opts.format === 'json') {
        console.log(JSON.stringify(result));
      } else {
        if (result.valid) {
          console.log(`OK – chain intact (${result.eventCount} events)`);
        } else {
          console.error(
            `Chain break at line ${result.breakLine}: expected ${result.expected}, got ${result.got}`
          );
        }
      }
      process.exit(result.valid ? 0 : 1);
    });
}
