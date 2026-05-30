import { v4 as uuidv4 } from 'uuid';
import type { AgentEvent, Meta } from '../shared/types.js';

export interface BuildEventInput {
  traceId: string;
  action: string;
  status: 'pending' | 'completed' | 'failed';
  schemaVersion?: number;
  agent?: string;
  seqNo: number;
  prevHash: string;
  payload?: Record<string, unknown>;
}

export function buildEvent(input: BuildEventInput): AgentEvent {
  const meta: Meta = {
    schemaVersion: input.schemaVersion ?? 2,
    timestamp: new Date().toISOString(),
    traceId: input.traceId,
    seqNo: input.seqNo,
    prevHash: input.prevHash,
    eventId: uuidv4(),
    ...(input.agent ? { agent: input.agent } : {}),
  };
  return {
    _meta: meta,
    action: input.action,
    status: input.status,
    ...(input.payload ?? {}),
  };
}
