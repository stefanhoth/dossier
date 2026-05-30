import { describe, it, expect } from 'vitest';
import { from_v1 } from '../../schemas/v2/migration.js';

describe('v1 → v2 migration', () => {
  it('renames result to output', () => {
    const v1event = { _meta: { schemaVersion: 1 }, action: 'a', status: 'completed', result: { score: 0.9 } };
    const v2event = from_v1(v1event) as Record<string, unknown>;
    expect(v2event['output']).toEqual({ score: 0.9 });
  });

  it('adds empty metadata when not present', () => {
    const v1event = { _meta: { schemaVersion: 1 }, action: 'a', status: 'completed' };
    const v2event = from_v1(v1event) as Record<string, unknown>;
    expect(v2event['metadata']).toEqual({});
  });

  it('preserves existing metadata', () => {
    const v1event = { _meta: { schemaVersion: 1 }, action: 'a', status: 'completed', metadata: { x: 1 } };
    const v2event = from_v1(v1event) as Record<string, unknown>;
    expect(v2event['metadata']).toEqual({ x: 1 });
  });
});
