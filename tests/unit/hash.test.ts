import { describe, it, expect } from 'vitest';
import { computePrevHash } from '../../src/integrity/hash.js';
import { verifyChain } from '../../src/integrity/verify.js';
import { createHash } from 'node:crypto';

describe('computePrevHash', () => {
  it('returns genesis for null input', () => {
    expect(computePrevHash(null)).toBe('genesis');
  });

  it('returns sha256 hex for a line', () => {
    const line = '{"x":1}';
    const expected = createHash('sha256').update(line, 'utf8').digest('hex');
    expect(computePrevHash(line)).toBe(expected);
  });
});

describe('verifyChain', () => {
  it('returns valid for empty array', () => {
    expect(verifyChain([])).toMatchObject({ valid: true, eventCount: 0 });
  });

  it('returns valid for single event with genesis', () => {
    const event = JSON.stringify({
      _meta: { prevHash: 'genesis', schemaVersion: 2, traceId: 'x', seqNo: 1, timestamp: 't' },
      action: 'a', status: 'completed'
    });
    expect(verifyChain([event])).toMatchObject({ valid: true });
  });

  it('detects chain break', () => {
    const line1 = JSON.stringify({ _meta: { prevHash: 'genesis', schemaVersion: 2, traceId: 'x', seqNo: 1, timestamp: 't' }, action: 'a', status: 'completed' });
    const line2 = JSON.stringify({ _meta: { prevHash: 'wronghash', schemaVersion: 2, traceId: 'x', seqNo: 2, timestamp: 't' }, action: 'b', status: 'completed' });
    const result = verifyChain([line1, line2]);
    expect(result.valid).toBe(false);
    expect(result.breakLine).toBe(2);
  });

  it('validates correct two-event chain', () => {
    const line1 = JSON.stringify({ _meta: { prevHash: 'genesis', schemaVersion: 2, traceId: 'x', seqNo: 1, timestamp: 't' }, action: 'a', status: 'completed' });
    const correctPrevHash = createHash('sha256').update(line1, 'utf8').digest('hex');
    const line2 = JSON.stringify({ _meta: { prevHash: correctPrevHash, schemaVersion: 2, traceId: 'x', seqNo: 2, timestamp: 't' }, action: 'b', status: 'completed' });
    expect(verifyChain([line1, line2])).toMatchObject({ valid: true, eventCount: 2 });
  });
});
