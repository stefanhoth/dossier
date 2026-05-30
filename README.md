# dossier – Agent Event Log CLI

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
npm install -g @stefanhoth/dossier
```

## Quick start

```bash
# 1. Initialize workspace
dossier init

# 2. Write your first event
echo '{"action":"synthesize","status":"completed","_meta":{"traceId":"wf-demo"}}' | dossier write

# 3. Verify the chain
dossier verify events/$(date +%Y-%m-%d).jsonl
```

## Command reference

| Command | Description |
|---|---|
| `dossier init [--dir <path>]` | Initialize workspace |
| `dossier write [--trace <id>] [--agent <name>]` | Write event from stdin |
| `dossier read [--trace <id>] [--from-seq N] [--to-seq M] [--migrate]` | Read/filter events |
| `dossier validate <file>` | Validate schema compliance |
| `dossier verify <file>` | Verify hash-chain integrity |
| `dossier migrate <file> --to <version> [--output <file>]` | Forward-migrate events |
| `dossier schema list\|add\|deprecate` | Manage schema versions |
| `dossier audit export [--from <date>] [--to <date>] [--output <dir>]` | Build audit package |
| `dossier dlq list\|inspect <n>` | Inspect Dead Letter Queue |
| `dossier privacy shred <subject>` | Delete PII (right to be forgotten) |

## Configuration

`dossier.config.yaml` (created by `dossier init`):

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
