# dossier – Agent Event Log CLI

> Every agent leaves a paper trail.

`dossier` is a tamper-evident, append-only audit log for **agentic workflows**. It implements the [Agent Data Format Spec v2.0](references/spec.md) and is designed around one principle: when autonomous agents act on your behalf — or on each other's behalf — you need a record you can trust.

## Why it exists

Modern AI pipelines chain multiple agents together. An orchestrator calls a sub-agent, which calls another, which writes to a database, sends an email, or triggers a deployment. When something goes wrong (or goes right), you want to know:

- **What happened?** Every action and its outcome, in order.
- **Who said what to whom?** Which agent initiated a task, which completed it, what was passed between them.
- **Can I trust this log?** SHA-256 hash chaining means any tampering — even a single byte — breaks the chain and is detected by `dossier verify`.
- **Is this compliant?** PII tokenization and crypto-shredding support GDPR right-to-erasure without breaking the audit trail.

## Use cases

**Agent-to-agent communication audit trail**
When Agent A hands a task to Agent B, both agents append events to the shared log. The `traceId` groups all events for a single workflow run; `seqNo` and `prevHash` make the sequence tamper-evident. A reviewer or compliance tool can reconstruct the full conversation from the JSONL file.

**Automated pipeline observability**
Log every `action`/`status` pair from your pipeline steps. Use `dossier read --trace <id>` to replay exactly what happened during a specific run, or `dossier audit export` to produce a compliance package with chain verification report included.

**GDPR-compliant agent memory**
Agents often handle personal data. `dossier` tokenizes PII into `tok_<hex>` references stored in a separate side-store. Call `dossier privacy shred <subject>` to delete all PII for a user without altering the audit trail — dead-reference tokens remain in the log, proving the record existed without exposing the data.

**Schema-versioned event evolution**
As your agent protocol evolves, `dossier migrate` forward-migrates old log files (v1 → v2 → …) and `dossier schema` manages the Draft → Active → Deprecated → Sunset lifecycle so older readers stay compatible.

## Installation

**Zero-install via npx** (recommended — no version conflicts):
```bash
npx @stefanhoth/dossier --help
```

**Global install** (for frequent use):
```bash
npm install -g @stefanhoth/dossier
```

## Quick start

```bash
# 1. Initialize workspace
npx @stefanhoth/dossier init

# 2. Write an event (e.g. from an orchestrator handing off to a sub-agent)
echo '{"action":"delegate","status":"completed","agent":"planner","_meta":{"traceId":"wf-001"}}' | npx @stefanhoth/dossier write

# 3. Sub-agent appends its result to the same trace
echo '{"action":"execute","status":"completed","agent":"executor","_meta":{"traceId":"wf-001"}}' | npx @stefanhoth/dossier write

# 4. Verify the chain is intact
npx @stefanhoth/dossier verify events/$(date +%Y-%m-%d).jsonl
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

Every event line MUST include `_meta.schemaVersion`, `timestamp`, `traceId`, `seqNo`, `prevHash` (SHA-256 of the previous raw line, or `"genesis"` for the first event), plus top-level `action` and `status`.

```jsonc
{
  "_meta": {
    "schemaVersion": 2,
    "timestamp": "2026-05-30T10:00:00.000Z",
    "traceId": "wf-001",
    "seqNo": 1,
    "prevHash": "genesis",
    "eventId": "uuid-v4",
    "agent": "orchestrator"
  },
  "action": "delegate",
  "status": "completed",
  "output": { "assignedTo": "executor" }
}
```

See [references/spec.md](references/spec.md) for the full specification.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
