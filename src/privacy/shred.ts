import { existsSync, readdirSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

export function shred(piiDir: string, subject: string): number {
  if (!existsSync(piiDir)) return 0;
  const files = readdirSync(piiDir).filter(f => f.endsWith('.json'));
  let count = 0;
  for (const file of files) {
    const filePath = resolve(piiDir, file);
    try {
      const data = JSON.parse(readFileSync(filePath, 'utf8')) as { subject: string };
      if (data.subject === subject) {
        unlinkSync(filePath);
        count++;
      }
    } catch {
      // skip corrupt entries
    }
  }
  return count;
}
