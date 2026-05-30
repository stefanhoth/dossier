// TODO: PostgresStore implementation (Phase 3 extension)
// Requires: pg driver, connection string in AelConfig
// Tables: agent_events (seq_no, schema_version, trace_id, trace_seq, timestamp, prev_hash, payload)
// See spec §8.2 for full schema

import type { AgentEvent } from '../shared/types.js';
import type { IStore, ReadOptions } from './interface.js';

export class PostgresStore implements IStore {
  constructor(_connectionString: string) {
    throw new Error('PostgresStore not yet implemented. Use FileStore (default).');
  }
  async append(_event: AgentEvent): Promise<void> { throw new Error('Not implemented'); }
  async readRange(_options: ReadOptions): Promise<AgentEvent[]> { throw new Error('Not implemented'); }
  async readRawLines(_date?: string): Promise<string[]> { throw new Error('Not implemented'); }
  async appendDlq(_rawLine: string, _reason: string): Promise<void> { throw new Error('Not implemented'); }
}
