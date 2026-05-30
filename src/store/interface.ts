import type { AgentEvent } from '../shared/types.js';

export interface ReadOptions {
  traceId?: string;
  fromSeq?: number;
  toSeq?: number;
  date?: string;
}

export interface IStore {
  append(event: AgentEvent): Promise<void>;
  readRange(options: ReadOptions): Promise<AgentEvent[]>;
  readRawLines(date?: string): Promise<string[]>;
  appendDlq(rawLine: string, reason: string, errors?: string[], schemaVersion?: number): Promise<void>;
}
