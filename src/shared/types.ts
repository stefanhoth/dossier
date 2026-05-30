export interface Meta {
  schemaVersion: number;
  timestamp: string;
  traceId: string;
  seqNo: number;
  prevHash: string;
  eventId?: string;
  agent?: string;
}

export interface AgentEvent {
  _meta: Meta;
  action: string;
  status: 'pending' | 'completed' | 'failed';
  [key: string]: unknown;
}

export interface DlqEntry {
  _dlq: {
    reason: 'parse_error' | 'unknown_schema_version' | 'schema_validation' | 'chain_break';
    schemaVersion?: number;
    errors?: string[];
  };
  _raw: string;
  timestamp: string;
}

export interface SchemaVersionMeta {
  state: 'draft' | 'active' | 'deprecated' | 'sunset';
  activatedAt?: string;
  deprecatedAt?: string;
  sunsetAt?: string;
}

export interface SchemaRegistry {
  currentVersion: number;
  versions: Record<string, SchemaVersionMeta>;
}

export interface AelConfig {
  storage: {
    backend: 'file' | 'postgres';
    dir: string;
    retentionDays: number;
  };
  privacy: {
    enabled: boolean;
    piiStoreDir: string;
  };
  currentSchemaVersion: number;
}
