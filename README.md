# ael – Agent Event Log CLI

JSONL audit trail tool implementing [Agent Data Format Spec v2.0](references/spec.md). Append-only, hash-chained, schema-versioned, GDPR-compliant event logs for agent-to-agent communication.

## Features

- Hash-chained tamper-evident JSONL logs
- JSON Schema v2 validation (Ajv, draft-2020-12)
- Forward-compatible schema migration
- GDPR-compliant PII tokenization & crypto-shredding
- Complete audit export packages
- Dead Letter Queue for error handling
- Exit codes: 0 ok, 1 integrity/validation failure, 2 usage error

## Installation

```bash
npm install -g @stefanhoth/ael
```

## Quick start

```bash
# 1. Initialize workspace
ael init

# 2. Write your first event
echo '{"action":"synthesize","status":"completed","_meta":{"traceId":"wf-demo"}}' | ael write

# 3. Verify the chain
ael verify events/$(date +%Y-%m-%d).jsonl
```

## Command reference

| Command | Description |
|---|---|
| `ael init [--dir <path>]` | Initialize workspace |
| `ael write [--trace <id>] [--agent <name>]` | Write event from stdin |
| `ael read [--trace <id>] [--from-seq N] [--to-seq M] [--migrate]` | Read/filter events |
| `ael validate <file>` | Validate schema compliance |
| `ael verify <file>` | Verify hash-chain integrity |
| `ael migrate <file> --to <version> [--output <file>]` | Forward-migrate events |
| `ael schema list\|add\|deprecate` | Manage schema versions |
| `ael audit export [--from <date>] [--to <date>] [--output <dir>]` | Build audit package |
| `ael dlq list\|inspect <n>` | Inspect Dead Letter Queue |
| `ael privacy shred <subject>` | Delete PII (right to be forgotten) |

## Configuration

`ael.config.yaml` (created by `ael init`):

```yaml
storage:
  backend: file       # file | postgres (postgres is a stub)
  dir: ./events       # event log directory
  retentionDays: 30   # hot tier retention
privacy:
  enabled: false      # set true to enforce tokenization
  piiStoreDir: ./events/.pii
currentSchemaVersion: 2
```

## Event format

Every event line MUST include `_meta.schemaVersion`, `timestamp`, `traceId`, `seqNo`, `prevHash` plus top-level `action` and `status`.

See [references/spec.md](references/spec.md) for full specification.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
