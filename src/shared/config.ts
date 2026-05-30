import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { AelConfig } from './types.js';

export const DEFAULT_CONFIG: AelConfig = {
  storage: {
    backend: 'file',
    dir: './events',
    retentionDays: 30,
  },
  privacy: {
    enabled: false,
    piiStoreDir: './events/.pii',
  },
  currentSchemaVersion: 2,
};

export function loadConfig(dir = '.'): AelConfig {
  const configPath = resolve(dir, 'ael.config.yaml');
  if (!existsSync(configPath)) return DEFAULT_CONFIG;
  const raw = readFileSync(configPath, 'utf8');
  const parsed = parseYaml(raw) as Partial<AelConfig>;
  return {
    storage: { ...DEFAULT_CONFIG.storage, ...parsed.storage },
    privacy: { ...DEFAULT_CONFIG.privacy, ...parsed.privacy },
    currentSchemaVersion: parsed.currentSchemaVersion ?? DEFAULT_CONFIG.currentSchemaVersion,
  };
}
