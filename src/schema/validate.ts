import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { loadRegistry, loadSchemaJson } from './registry.js';
import { UnknownSchemaError, SchemaValidationError } from '../shared/errors.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ajv = new (Ajv2020 as any)({ allErrors: true });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(addFormats as any)(ajv);

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
    const errors = (validate.errors ?? []).map((e: { instancePath: string; message?: string }) => `${e.instancePath} ${e.message}`);
    throw new SchemaValidationError(errors);
  }
}
