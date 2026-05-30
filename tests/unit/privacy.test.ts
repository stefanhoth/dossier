import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { tokenize, detokenize } from '../../src/privacy/tokenize.js';
import { shred } from '../../src/privacy/shred.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'ael-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('tokenize', () => {
  it('returns a tok_ prefixed token', () => {
    const token = tokenize(tmpDir, 'user-1', 'email', 'user@example.com');
    expect(token).toMatch(/^tok_[0-9a-f]{8}$/);
  });

  it('returns same token for same input (deterministic)', () => {
    const t1 = tokenize(tmpDir, 'user-1', 'email', 'user@example.com');
    const t2 = tokenize(tmpDir, 'user-1', 'email', 'user@example.com');
    expect(t1).toBe(t2);
  });
});

describe('detokenize', () => {
  it('retrieves the original value', () => {
    const token = tokenize(tmpDir, 'user-1', 'email', 'user@example.com');
    expect(detokenize(tmpDir, token)).toBe('user@example.com');
  });

  it('returns null for unknown token', () => {
    expect(detokenize(tmpDir, 'tok_unknown')).toBeNull();
  });
});

describe('shred', () => {
  it('deletes all PII entries for a subject', () => {
    tokenize(tmpDir, 'user-1', 'email', 'user@example.com');
    tokenize(tmpDir, 'user-1', 'name', 'Alice');
    tokenize(tmpDir, 'user-2', 'email', 'other@example.com');
    const count = shred(tmpDir, 'user-1');
    expect(count).toBe(2);
    // user-2 data still exists
    expect(detokenize(tmpDir, tokenize(tmpDir, 'user-2', 'email', 'other@example.com'))).toBe('other@example.com');
  });
});
