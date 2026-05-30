import { Command } from 'commander';
import { loadConfig } from '../shared/config.js';
import { validateEvent } from '../schema/validate.js';
import { computePrevHash } from '../integrity/hash.js';
import { assignSeqNo } from '../core/seqno.js';
import { FileStore } from '../store/file.js';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

export function registerWrite(program: Command): void {
  program
    .command('write')
    .description('Write an event from stdin to the log')
    .option('--trace <id>', 'Override traceId')
    .option('--agent <name>', 'Set agent identifier')
    .option('--format <fmt>', 'Output format: json|human', 'human')
    .action(async (opts: { trace?: string; agent?: string; format: string }) => {
      const config = loadConfig();
      const eventsDir = resolve(config.storage.dir);
      const schemasDir = resolve('schemas');
      const store = new FileStore(eventsDir);

      const rawInput = readFileSync('/dev/stdin', 'utf8').trim();

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(rawInput) as Record<string, unknown>;
      } catch {
        await store.appendDlq(rawInput, 'parse_error');
        console.error('Invalid JSON – sent to DLQ');
        process.exit(1);
      }

      // Inject meta overrides
      const meta = (parsed['_meta'] as Record<string, unknown>) ?? {};
      if (opts.trace) meta['traceId'] = opts.trace;
      if (opts.agent) meta['agent'] = opts.agent;
      if (!meta['timestamp']) meta['timestamp'] = new Date().toISOString();
      if (!meta['schemaVersion']) meta['schemaVersion'] = config.currentSchemaVersion;
      parsed['_meta'] = meta;

      const traceId = meta['traceId'] as string;
      if (!traceId) {
        console.error('Error: traceId required (in _meta or via --trace)');
        process.exit(2);
      }

      // Validate
      try {
        validateEvent(parsed, schemasDir);
      } catch (err) {
        const errors = (err as { errors?: string[] }).errors ?? [(err as Error).message];
        await store.appendDlq(rawInput, 'schema_validation', errors, meta['schemaVersion'] as number);
        console.error(`Schema validation failed – sent to DLQ: ${errors.join(', ')}`);
        process.exit(1);
      }

      // Compute prevHash
      const todayLines = await store.readRawLines();
      const traceLines = todayLines.filter(l => {
        try { return (JSON.parse(l) as { _meta: { traceId: string } })._meta.traceId === traceId; }
        catch { return false; }
      });
      const prevLine = traceLines.length > 0 ? traceLines[traceLines.length - 1] : null;
      const prevHash = computePrevHash(prevLine);

      // Assign seqNo
      const seqNo = await assignSeqNo(eventsDir, traceId);

      // Build final event
      const finalMeta: Record<string, unknown> = { ...meta, seqNo, prevHash };
      const event = { ...parsed, _meta: finalMeta };

      await store.append(event as unknown as Parameters<typeof store.append>[0]);

      if (opts.format === 'json') {
        console.log(JSON.stringify({ seqNo, eventId: finalMeta['eventId'] }));
      } else {
        console.log(`Written: seqNo=${seqNo} trace=${traceId}`);
      }
    });
}
