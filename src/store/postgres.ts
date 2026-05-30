// TODO: PostgresStore implementation (Phase 3 extension)
// Requires: pg driver, connection string in AelConfig
// Tables: agent_events (seq_no, schema_version, trace_id, trace_seq, timestamp, prev_hash, payload)
// See spec §8.2 for full schema

import type { AgentEvent } from '../shared/types.js';
import type { IStore, ReadOptions } from './interface.js';

export class PostgresStore implements IStore {
  constructor(connectionString: string) {
    void connectionString;
    throw new Error('PostgresStore not yet implemented. Use FileStore (default).');
  }
  async append(event: AgentEvent): Promise<void> { void event; throw new Error('Not implemented'); }
  async readRange(options: ReadOptions): Promise<AgentEvent[]> { void options; throw new Error('Not implemented'); }
  async readRawLines(date?: string): Promise<string[]> { void date; throw new Error('Not implemented'); }
  async appendDlq(rawLine: string, reason: string): Promise<void> { void rawLine; void reason; throw new Error('Not implemented'); }
}
