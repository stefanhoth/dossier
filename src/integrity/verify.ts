import { computePrevHash } from './hash.js';
import { ChainIntegrityError } from '../shared/errors.js';

export interface VerifyResult {
  valid: boolean;
  eventCount: number;
  breakLine?: number;
  expected?: string;
  got?: string;
}

export function verifyChain(lines: string[]): VerifyResult {
  const nonEmpty = lines.filter(l => l.trim().length > 0);
  for (let i = 1; i < nonEmpty.length; i++) {
    let event: { _meta?: { prevHash?: string } };
    try {
      event = JSON.parse(nonEmpty[i]);
    } catch {
      return { valid: false, eventCount: nonEmpty.length, breakLine: i + 1, expected: '(parse error)', got: '' };
    }
    const expected = computePrevHash(nonEmpty[i - 1]);
    const got = event._meta?.prevHash ?? '';
    if (expected !== got) {
      return { valid: false, eventCount: nonEmpty.length, breakLine: i + 1, expected, got };
    }
  }
  return { valid: true, eventCount: nonEmpty.length };
}

export function assertChain(lines: string[]): void {
  const result = verifyChain(lines);
  if (!result.valid) {
    throw new ChainIntegrityError(result.breakLine!, result.expected!, result.got!);
  }
}
