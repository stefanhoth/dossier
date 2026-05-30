import { Command } from 'commander';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_CONFIG = `storage:
  backend: file
  dir: ./events
  retentionDays: 30
privacy:
  enabled: false
  piiStoreDir: ./events/.pii
currentSchemaVersion: 2
`;

const REGISTRY = {
  currentVersion: 2,
  versions: {
    '1': { state: 'deprecated', deprecatedAt: new Date().toISOString().slice(0, 10) },
    '2': { state: 'active', activatedAt: new Date().toISOString().slice(0, 10) },
  },
};

export function registerInit(program: Command): void {
  program
    .command('init')
    .description('Initialize schema registry and storage backend')
    .option('--dir <path>', 'Working directory', '.')
    .action((opts: { dir: string }) => {
      const dir = resolve(opts.dir);
      const eventsDir = resolve(dir, 'events');
      const schemasDir = resolve(dir, 'schemas');

      [eventsDir, resolve(eventsDir, '.seq'), resolve(eventsDir, '.pii'),
       resolve(eventsDir, 'archive'), schemasDir].forEach(d => mkdirSync(d, { recursive: true }));

      const configPath = resolve(dir, 'dossier.config.yaml');
      if (!existsSync(configPath)) writeFileSync(configPath, DEFAULT_CONFIG, 'utf8');

      const registryPath = resolve(schemasDir, 'registry.json');
      if (!existsSync(registryPath)) {
        writeFileSync(registryPath, JSON.stringify(REGISTRY, null, 2), 'utf8');
      }

      console.log('Initialized dossier workspace.');
      console.log(`  Events:  ${eventsDir}`);
      console.log(`  Schemas: ${schemasDir}`);
      console.log(`  Config:  ${configPath}`);
    });
}
