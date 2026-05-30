import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FileStore } from '../../src/store/file.js';
import { verifyChain } from '../../src/integrity/verify.js';
import { computePrevHash } from '../../src/integrity/hash.js';
import { assignSeqNo } from '../../src/core/seqno.js';
import type { AgentEvent } from '../../src/shared/types.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'ael-integration-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

async function writeEvent(store: FileStore, eventsDir: string, i: number, prevLine: string | null): Promise<string> {
  const traceId = 'trace-test';
  const seqNo = await assignSeqNo(eventsDir, traceId);
  const prevHash = computePrevHash(prevLine);
  const event: AgentEvent = {
    _meta: {
      schemaVersion: 2,
      timestamp: new Date().toISOString(),
      traceId,
      seqNo,
      prevHash,
      eventId: `evt-${i}`,
    },
    action: `action-${i}`,
    status: 'completed',
  };
  await store.append(event);
  return JSON.stringify(event);
}

describe('write + verify integration', () => {
  it('verifies a chain of 5 events', async () => {
    const store = new FileStore(tmpDir);
    let prevLine: string | null = null;
    for (let i = 1; i <= 5; i++) {
      prevLine = await writeEvent(store, tmpDir, i, prevLine);
    }
    const lines = await store.readRawLines();
    expect(lines.length).toBe(5);
    expect(verifyChain(lines).valid).toBe(true);
  });

  it('detects tampering at correct line', async () => {
    const store = new FileStore(tmpDir);
    let prevLine: string | null = null;
    for (let i = 1; i <= 3; i++) {
      prevLine = await writeEvent(store, tmpDir, i, prevLine);
    }
    const lines = await store.readRawLines();
    // Tamper line 2
    const tampered = [...lines];
    const ev2 = JSON.parse(tampered[1]) as AgentEvent;
    ev2.action = 'TAMPERED';
    tampered[1] = JSON.stringify(ev2);
    const result = verifyChain(tampered);
    expect(result.valid).toBe(false);
    expect(result.breakLine).toBe(3);
  });
});
