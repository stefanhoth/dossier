import { Command } from 'commander';
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadRegistry } from '../schema/registry.js';

export function registerSchema(program: Command): void {
  const schemaCmd = program.command('schema').description('Manage schema versions');

  schemaCmd
    .command('list')
    .description('List all schema versions with lifecycle state')
    .action(() => {
      const registry = loadRegistry('schemas');
      console.log(`Current version: ${registry.currentVersion}\n`);
      for (const [v, meta] of Object.entries(registry.versions)) {
        console.log(`  v${v}: ${meta.state}`);
      }
    });

  schemaCmd
    .command('add <version>')
    .description('Scaffold a new schema version from template')
    .action((version: string) => {
      const vDir = resolve('schemas', `v${version}`);
      mkdirSync(vDir, { recursive: true });
      const templatePath = resolve('assets', 'schema-template.json');
      const schemaPath = resolve(vDir, 'schema.json');
      if (existsSync(templatePath)) {
        copyFileSync(templatePath, schemaPath);
      } else {
        writeFileSync(schemaPath, JSON.stringify({
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "title": `Agent Event v${version}`,
          "type": "object",
          "required": ["_meta","action","status"]
        }, null, 2), 'utf8');
      }
      writeFileSync(
        resolve(vDir, 'migration.ts'),
        `// Migration from v${parseInt(version) - 1} to v${version}\nexport const from_v${parseInt(version) - 1} = (event: unknown): unknown => ({\n  ...(event as Record<string, unknown>),\n  // TODO: apply migration\n});\n`,
        'utf8'
      );
      writeFileSync(resolve(vDir, 'examples.jsonl'), '', 'utf8');

      // Update registry
      const registryPath = resolve('schemas', 'registry.json');
      const registry = loadRegistry('schemas');
      registry.versions[version] = { state: 'draft' };
      writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf8');
      console.log(`Scaffolded schema v${version} – edit schemas/v${version}/schema.json`);
    });

  schemaCmd
    .command('deprecate <version>')
    .description('Mark a schema version as Deprecated')
    .action((version: string) => {
      const registryPath = resolve('schemas', 'registry.json');
      const registry = loadRegistry('schemas');
      if (!registry.versions[version]) {
        console.error(`Unknown version: ${version}`); process.exit(1);
      }
      registry.versions[version].state = 'deprecated';
      registry.versions[version].deprecatedAt = new Date().toISOString().slice(0, 10);
      writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf8');
      console.log(`Schema v${version} marked as deprecated.`);
    });
}
