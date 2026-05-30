import { Command } from 'commander';
import { mkdirSync, writeFileSync, readFileSync, existsSync, copyFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { verifyChain } from '../integrity/verify.js';
import { loadConfig } from '../shared/config.js';

export function registerAudit(program: Command): void {
  const auditCmd = program.command('audit').description('Audit operations');

  auditCmd
    .command('export')
    .description('Build a complete audit package')
    .option('--from <date>', 'Start date YYYY-MM-DD')
    .option('--to <date>', 'End date YYYY-MM-DD')
    .option('--output <dir>', 'Output directory', `./audit-${new Date().toISOString().slice(0, 10)}`)
    .action(async (opts: { from?: string; to?: string; output: string }) => {
      const config = loadConfig();
      const eventsDir = resolve(config.storage.dir);
      const outDir = resolve(opts.output);
      mkdirSync(outDir, { recursive: true });
      mkdirSync(resolve(outDir, 'schemas'), { recursive: true });

      // 1. Raw JSONL export
      const eventFiles = existsSync(eventsDir)
        ? readdirSync(eventsDir).filter(f => f.endsWith('.jsonl') && !f.startsWith('dlq'))
        : [];

      let allLines: string[] = [];
      for (const f of eventFiles) {
        const date = f.replace('.jsonl', '');
        if (opts.from && date < opts.from) continue;
        if (opts.to && date > opts.to) continue;
        const content = readFileSync(resolve(eventsDir, f), 'utf8');
        writeFileSync(resolve(outDir, f), content, 'utf8');
        allLines = allLines.concat(content.split('\n').filter(l => l.trim().length > 0));
      }

      // 2. Schema registry snapshot
      const registryPath = resolve('schemas', 'registry.json');
      if (existsSync(registryPath)) {
        copyFileSync(registryPath, resolve(outDir, 'schemas', 'registry.json'));
      }

      // 3. Migration functions (copy schema dirs)
      const schemaVersionDirs = existsSync('schemas')
        ? readdirSync('schemas').filter(d => d.startsWith('v'))
        : [];
      for (const vDir of schemaVersionDirs) {
        mkdirSync(resolve(outDir, 'schemas', vDir), { recursive: true });
        const files = readdirSync(resolve('schemas', vDir));
        for (const f of files) {
          copyFileSync(resolve('schemas', vDir, f), resolve(outDir, 'schemas', vDir, f));
        }
      }

      // 4. Chain verification report
      const verifyResult = verifyChain(allLines);
      writeFileSync(
        resolve(outDir, 'chain-verification.json'),
        JSON.stringify({ ...verifyResult, generatedAt: new Date().toISOString(), eventCount: allLines.length }, null, 2),
        'utf8'
      );

      // 5. DLQ summary
      const dlqPath = resolve(eventsDir, 'dlq.jsonl');
      let dlqCount = 0;
      const dlqReasons: Record<string, number> = {};
      if (existsSync(dlqPath)) {
        const dlqLines = readFileSync(dlqPath, 'utf8').split('\n').filter(l => l.trim().length > 0);
        dlqCount = dlqLines.length;
        for (const l of dlqLines) {
          try {
            const entry = JSON.parse(l) as { _dlq: { reason: string } };
            const r = entry._dlq?.reason ?? 'unknown';
            dlqReasons[r] = (dlqReasons[r] ?? 0) + 1;
          } catch { /* skip */ }
        }
        copyFileSync(dlqPath, resolve(outDir, 'dlq.jsonl'));
      }
      writeFileSync(
        resolve(outDir, 'dlq-summary.json'),
        JSON.stringify({ totalEntries: dlqCount, byReason: dlqReasons, generatedAt: new Date().toISOString() }, null, 2),
        'utf8'
      );

      console.log(`Audit package written to: ${outDir}`);
      console.log(`  Events: ${allLines.length}`);
      console.log(`  Chain valid: ${verifyResult.valid}`);
      console.log(`  DLQ entries: ${dlqCount}`);
    });
}
