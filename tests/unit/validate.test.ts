import { describe, it, expect } from 'vitest';
import { validateEvent } from '../../src/schema/validate.js';
import { SchemaValidationError, UnknownSchemaError } from '../../src/shared/errors.js';

const schemasDir = 'schemas';

const validV2 = {
  _meta: {
    schemaVersion: 2,
    timestamp: '2026-05-30T12:00:00Z',
    traceId: 'wf-1',
    seqNo: 1,
    prevHash: 'genesis',
  },
  action: 'test',
  status: 'completed',
};

describe('validateEvent', () => {
  it('passes for a valid v2 event', () => {
    expect(() => validateEvent(validV2, schemasDir)).not.toThrow();
  });

  it('throws SchemaValidationError for missing action', () => {
    const bad = { ...validV2, action: undefined };
    expect(() => validateEvent(bad, schemasDir)).toThrow(SchemaValidationError);
  });

  it('throws SchemaValidationError for invalid status', () => {
    const bad = { ...validV2, status: 'unknown' };
    expect(() => validateEvent(bad, schemasDir)).toThrow(SchemaValidationError);
  });

  it('throws UnknownSchemaError for unknown version', () => {
    const bad = { ...validV2, _meta: { ...validV2._meta, schemaVersion: 99 } };
    expect(() => validateEvent(bad, schemasDir)).toThrow(UnknownSchemaError);
  });
});
