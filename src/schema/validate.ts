import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { loadRegistry, loadSchemaJson } from './registry.js';
import { UnknownSchemaError, SchemaValidationError } from '../shared/errors.js';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const schemaCache = new Map<number, ReturnType<typeof ajv.compile>>();

export function getValidator(schemasDir: string, version: number): ReturnType<typeof ajv.compile> {
  if (!schemaCache.has(version)) {
    const registry = loadRegistry(schemasDir);
    if (!registry.versions[String(version)]) throw new UnknownSchemaError(version);
    const schema = loadSchemaJson(schemasDir, version);
    schemaCache.set(version, ajv.compile(schema));
  }
  return schemaCache.get(version)!;
}

export function validateEvent(event: unknown, schemasDir: string): void {
  const e = event as Record<string, unknown>;
  const meta = e['_meta'] as Record<string, unknown> | undefined;
  const version = meta?.['schemaVersion'];
  if (typeof version !== 'number') {
    throw new SchemaValidationError(['_meta.schemaVersion must be an integer']);
  }
  const registry = loadRegistry(schemasDir);
  if (!registry.versions[String(version)]) throw new UnknownSchemaError(version);
  const validate = getValidator(schemasDir, version);
  const valid = validate(event);
  if (!valid) {
    const errors = (validate.errors ?? []).map(e => `${e.instancePath} ${e.message}`);
    throw new SchemaValidationError(errors);
  }
}
