import { createHash } from 'node:crypto';

export function computePrevHash(prevLine: string | null): string {
  if (prevLine === null) return 'genesis';
  return createHash('sha256').update(prevLine, 'utf8').digest('hex');
}
