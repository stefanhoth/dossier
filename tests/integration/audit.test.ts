import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { FileStore } from '../../src/store/file.js';

let tmpDir: string;
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'ael-audit-')); });
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }); });

describe('DLQ', () => {
  it('appends bad events to DLQ', async () => {
    const store = new FileStore(tmpDir);
    await store.appendDlq('not valid json', 'parse_error');
    await store.appendDlq('{"bad":"event"}', 'schema_validation', ['missing action']);
    // Check dlq.jsonl directly
    const dlqPath = resolve(tmpDir, 'dlq.jsonl');
    expect(existsSync(dlqPath)).toBe(true);
    const { readFileSync } = await import('node:fs');
    const dlqContent = readFileSync(dlqPath, 'utf8').split('\n').filter((l: string) => l.trim().length > 0);
    expect(dlqContent.length).toBe(2);
    const entry = JSON.parse(dlqContent[0]) as { _dlq: { reason: string }; _raw: string };
    expect(entry._dlq.reason).toBe('parse_error');
    expect(entry._raw).toBe('not valid json');
  });
});
