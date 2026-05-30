import {
  mkdirSync,
  appendFileSync,
  readFileSync,
  existsSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import type { AgentEvent, DlqEntry } from '../shared/types.js';
import type { IStore, ReadOptions } from './interface.js';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayFilePath(dir: string, date?: string): string {
  return resolve(dir, `${date ?? todayStr()}.jsonl`);
}

function updateChecksum(filePath: string): void {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath);
  const hash = createHash('sha256').update(content).digest('hex');
  writeFileSync(`${filePath}.sha256`, hash, 'utf8');
}

export class FileStore implements IStore {
  constructor(private readonly dir: string) {
    mkdirSync(dir, { recursive: true });
    mkdirSync(resolve(dir, '.seq'), { recursive: true });
    mkdirSync(resolve(dir, '.pii'), { recursive: true });
    mkdirSync(resolve(dir, 'archive'), { recursive: true });
  }

  async append(event: AgentEvent): Promise<void> {
    const filePath = dayFilePath(this.dir);
    const line = JSON.stringify(event);
    appendFileSync(filePath, line + '\n', 'utf8');
    updateChecksum(filePath);
  }

  async readRawLines(date?: string): Promise<string[]> {
    const filePath = dayFilePath(this.dir, date);
    if (!existsSync(filePath)) return [];
    return readFileSync(filePath, 'utf8')
      .split('\n')
      .filter(l => l.trim().length > 0);
  }

  async readRange(options: ReadOptions): Promise<AgentEvent[]> {
    const lines = await this.readRawLines(options.date);
    return lines
      .map(l => JSON.parse(l) as AgentEvent)
      .filter(e => {
        if (options.traceId && e._meta.traceId !== options.traceId) return false;
        if (options.fromSeq !== undefined && e._meta.seqNo < options.fromSeq) return false;
        if (options.toSeq !== undefined && e._meta.seqNo > options.toSeq) return false;
        return true;
      });
  }

  async appendDlq(rawLine: string, reason: string, errors?: string[], schemaVersion?: number): Promise<void> {
    const entry: DlqEntry = {
      _dlq: {
        reason: reason as DlqEntry['_dlq']['reason'],
        ...(schemaVersion !== undefined ? { schemaVersion } : {}),
        ...(errors ? { errors } : {}),
      },
      _raw: rawLine,
      timestamp: new Date().toISOString(),
    };
    const dlqPath = resolve(this.dir, 'dlq.jsonl');
    appendFileSync(dlqPath, JSON.stringify(entry) + '\n', 'utf8');
  }
}
