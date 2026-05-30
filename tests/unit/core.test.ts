import { describe, it, expect } from 'vitest';
import { buildEvent } from '../../src/core/event.js';

describe('buildEvent', () => {
  it('builds a valid event with all required _meta fields', () => {
    const event = buildEvent({
      traceId: 'trace-1',
      action: 'test',
      status: 'completed',
      seqNo: 1,
      prevHash: 'genesis',
    });
    expect(event._meta.traceId).toBe('trace-1');
    expect(event._meta.seqNo).toBe(1);
    expect(event._meta.prevHash).toBe('genesis');
    expect(event._meta.schemaVersion).toBe(2);
    expect(event._meta.eventId).toBeDefined();
    expect(event._meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(event.action).toBe('test');
    expect(event.status).toBe('completed');
  });

  it('includes agent when provided', () => {
    const event = buildEvent({
      traceId: 't', action: 'a', status: 'pending', seqNo: 1, prevHash: 'genesis', agent: 'bot'
    });
    expect(event._meta.agent).toBe('bot');
  });

  it('includes extra payload fields', () => {
    const event = buildEvent({
      traceId: 't', action: 'a', status: 'completed', seqNo: 1, prevHash: 'genesis',
      payload: { confidence: 0.9 }
    });
    expect(event.confidence).toBe(0.9);
  });
});
