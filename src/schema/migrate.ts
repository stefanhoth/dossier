import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadRegistry } from './registry.js';

type MigrationFn = (data: unknown) => unknown;

async function loadMigration(schemasDir: string, toVersion: number): Promise<MigrationFn | null> {
  const path = resolve(schemasDir, `v${toVersion}`, 'migration.js');
  const tsPath = resolve(schemasDir, `v${toVersion}`, 'migration.ts');
  if (!existsSync(path) && !existsSync(tsPath)) return null;
  // For runtime, we expect compiled JS in dist or direct TS via tsx
  // In test environment, import the TS directly via vitest transform
  try {
    const mod = await import(path) as { from_v1?: MigrationFn; [key: string]: unknown };
    const key = `from_v${toVersion - 1}`;
    return (mod[key] as MigrationFn) ?? null;
  } catch {
    return null;
  }
}

export async function applyMigrations(
  event: unknown,
  fromVersion: number,
  toVersion: number,
  schemasDir: string
): Promise<unknown> {
  let current = event;
  for (let v = fromVersion + 1; v <= toVersion; v++) {
    const fn = await loadMigration(schemasDir, v);
    if (fn) {
      current = fn(current);
    }
    // Update schemaVersion in _meta
    const e = current as Record<string, unknown>;
    const meta = { ...(e['_meta'] as Record<string, unknown>), schemaVersion: v };
    current = { ...e, _meta: meta };
  }
  return current;
}

export function canMigrate(fromVersion: number, toVersion: number, schemasDir: string): boolean {
  const registry = loadRegistry(schemasDir);
  for (let v = fromVersion + 1; v <= toVersion; v++) {
    if (!registry.versions[String(v)]) return false;
  }
  return true;
}
