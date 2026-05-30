import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { SchemaRegistry } from '../shared/types.js';
import { UnknownSchemaError } from '../shared/errors.js';

export function loadRegistry(schemasDir: string): SchemaRegistry {
  const path = resolve(schemasDir, 'registry.json');
  if (!existsSync(path)) {
    throw new Error(`Schema registry not found at ${path}. Run 'dossier init' first.`);
  }
  return JSON.parse(readFileSync(path, 'utf8')) as SchemaRegistry;
}

export function loadSchemaJson(schemasDir: string, version: number): unknown {
  const path = resolve(schemasDir, `v${version}`, 'schema.json');
  if (!existsSync(path)) throw new UnknownSchemaError(version);
  return JSON.parse(readFileSync(path, 'utf8'));
}
