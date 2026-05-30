import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import lockfile from 'proper-lockfile';

export async function assignSeqNo(eventsDir: string, traceId: string): Promise<number> {
  const seqDir = resolve(eventsDir, '.seq');
  mkdirSync(seqDir, { recursive: true });
  const seqFile = resolve(seqDir, traceId.replace(/[^a-zA-Z0-9_-]/g, '_'));
  if (!existsSync(seqFile)) {
    writeFileSync(seqFile, '0', 'utf8');
  }
  let release: (() => Promise<void>) | null = null;
  try {
    release = await lockfile.lock(seqFile, { retries: { retries: 5, minTimeout: 50 } });
    const current = parseInt(readFileSync(seqFile, 'utf8').trim(), 10) || 0;
    const next = current + 1;
    writeFileSync(seqFile, String(next), 'utf8');
    return next;
  } finally {
    if (release) await release();
  }
}
