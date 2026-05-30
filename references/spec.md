# Agent Data Format Specification v2.0

## Overview

The Agent Data Format (ADF) is a JSONL audit trail format for agent-to-agent communication. It provides:

- **Append-only** event log in JSONL format (one JSON object per line)
- **Hash chaining** for tamper evidence
- **Schema versioning** with forward-migration support
- **GDPR compliance** via PII tokenization and crypto-shredding
- **Dead Letter Queue** for error handling

## Event Format

Each event is a single JSON object on one line:

```json
{
  "_meta": {
    "schemaVersion": 2,
    "timestamp": "2026-05-30T14:22:00Z",
    "traceId": "wf-abc",
    "seqNo": 1,
    "prevHash": "genesis",
    "eventId": "evt-001",
    "agent": "researcher"
  },
  "action": "synthesize",
  "status": "completed"
}
```

### `_meta` fields

| Field | Required | Type | Description |
|---|---|---|---|
| `schemaVersion` | yes | integer | Schema version number |
| `timestamp` | yes | string (date-time) | ISO 8601 UTC timestamp |
| `traceId` | yes | string | Workflow/trace identifier |
| `seqNo` | yes | integer ≥ 1 | Per-trace sequence number |
| `prevHash` | yes | string | SHA-256 of previous line, or `"genesis"` |
| `eventId` | no | string (UUIDv4) | Unique event identifier |
| `agent` | no | string | Agent identifier |

### Top-level fields

| Field | Required | Type | Description |
|---|---|---|---|
| `action` | yes | string | What the agent did |
| `status` | yes | enum | `pending` \| `completed` \| `failed` |

## Hash Chaining

- First event: `prevHash = "genesis"`
- Event N: `prevHash = SHA-256(hex string of raw JSON line N-1)`
- Algorithm: `crypto.createHash('sha256').update(rawLine, 'utf8').digest('hex')`

A chain break means tampered or missing events. The CLI exits with code 1.

## Storage Layout

```
events/
├── YYYY-MM-DD.jsonl         ← one file per day
├── YYYY-MM-DD.jsonl.sha256  ← SHA-256 of entire day file
├── .seq/                    ← per-trace sequence number files
│   └── <traceId>            ← plain integer text file
├── .pii/                    ← PII side-store
│   └── tok_<hex8>.json      ← {value, subject, field, createdAt}
└── dlq.jsonl               ← Dead Letter Queue
schemas/
├── registry.json
├── v1/  schema.json  examples.jsonl  migration.ts
└── v2/  schema.json  examples.jsonl  migration.ts
```

## Schema Registry

`schemas/registry.json` tracks all schema versions and their lifecycle state.

Lifecycle: `Draft → Active → Deprecated → Sunset`

## Error Handling

### Dead Letter Queue

Invalid events are appended to `events/dlq.jsonl`:

```json
{"_dlq":{"reason":"schema_validation","schemaVersion":2,"errors":["..."]},"_raw":"...original line...","timestamp":"2026-05-30T14:22:00Z"}
```

DLQ reasons:
- `parse_error` – invalid JSON
- `unknown_schema_version` – schemaVersion not in registry
- `schema_validation` – fails JSON Schema validation
- `chain_break` – hash chain integrity failure

## Exit Codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Integrity or validation failure |
| 2 | Usage error |

## GDPR Compliance

PII must be tokenized before writing to the event log. Tokens are stored in the `.pii/` side-store. The `ael privacy shred <subject>` command deletes all PII for a subject (right to erasure).

## Migration

Schema migrations live at the **target version** (`schemas/vN/migration.ts`). The `from_v{N-1}` export function transforms events from the previous version.

Example v1→v2 migration:
```typescript
export const from_v1 = (event: unknown): unknown => ({
  ...event,
  output: event.result,
  metadata: event.metadata ?? {}
});
```
