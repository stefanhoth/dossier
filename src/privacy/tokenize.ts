import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

function makeToken(subject: string, field: string, value: string): string {
  const hash = createHash('sha256')
    .update(`${subject}:${field}:${value}`)
    .digest('hex')
    .slice(0, 8);
  return `tok_${hash}`;
}

export function tokenize(
  piiDir: string,
  subject: string,
  field: string,
  value: string
): string {
  mkdirSync(piiDir, { recursive: true });
  const token = makeToken(subject, field, value);
  const piiFile = resolve(piiDir, `${token}.json`);
  if (!existsSync(piiFile)) {
    writeFileSync(
      piiFile,
      JSON.stringify({ token, subject, field, value, createdAt: new Date().toISOString() }),
      'utf8'
    );
  }
  return token;
}

export function detokenize(piiDir: string, token: string): string | null {
  const piiFile = resolve(piiDir, `${token}.json`);
  if (!existsSync(piiFile)) return null;
  const data = JSON.parse(readFileSync(piiFile, 'utf8')) as { value: string };
  return data.value;
}
