import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FileStore } from '../../src/store/file.js';
import { assignSeqNo } from '../../src/core/seqno.js';
import type { AgentEvent } from '../../src/shared/types.js';

let tmpDir: string;
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'ael-read-')); });
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }); });

describe('FileStore readRange', () => {
  it('filters by traceId', async () => {
    const store = new FileStore(tmpDir);
    for (const traceId of ['trace-A', 'trace-A', 'trace-B']) {
      const seqNo = await assignSeqNo(tmpDir, traceId);
      const event: AgentEvent = {
        _meta: { schemaVersion: 2, timestamp: new Date().toISOString(), traceId, seqNo, prevHash: 'genesis' },
        action: 'act', status: 'completed',
      };
      await store.append(event);
    }
    const result = await store.readRange({ traceId: 'trace-A' });
    expect(result.length).toBe(2);
    expect(result.every(e => e._meta.traceId === 'trace-A')).toBe(true);
  });

  it('filters by seqNo range', async () => {
    const store = new FileStore(tmpDir);
    const traceId = 'trace-seq';
    for (let i = 1; i <= 5; i++) {
      const event: AgentEvent = {
        _meta: { schemaVersion: 2, timestamp: new Date().toISOString(), traceId, seqNo: i, prevHash: 'genesis' },
        action: 'act', status: 'completed',
      };
      await store.append(event);
    }
    const result = await store.readRange({ traceId, fromSeq: 2, toSeq: 4 });
    expect(result.length).toBe(3);
    expect(result.map(e => e._meta.seqNo)).toEqual([2, 3, 4]);
  });
});
