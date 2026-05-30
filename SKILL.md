---
name: agent-event-log
description: >
  Use when working with agent audit trails, event logs, or the Agent Data
  Format Spec. Triggers: "write an agent event", "validate this JSONL",
  "verify the audit chain", "add a schema version", "build an audit export",
  "migrate events". Covers writing, validating, integrity-checking,
  migrating, and auditing JSONL event logs.
---

# Agent Event Log (ael)

## When to use

Use this skill when asked to:
- Write, validate, or verify agent event logs (JSONL format)
- Check audit trail integrity (hash chain verification)
- Add, migrate, or deprecate schema versions
- Build an audit export package for compliance
- Inspect or manage the Dead Letter Queue

## Command reference

| Command | Purpose |
|---|---|
| `ael init` | Initialize workspace (events/, schemas/, config) |
| `ael write` | Write event from stdin to log (validates, hash-chains, appends) |
| `ael read` | Read/filter events from log |
| `ael validate <file>` | Validate JSONL against declared schema versions (read-only) |
| `ael verify <file>` | Verify hash-chain integrity (read-only) |
| `ael migrate <file> --to N` | Forward-migrate events to schema version N |
| `ael schema list` | List schema versions with lifecycle state |
| `ael schema add <N>` | Scaffold new schema version |
| `ael schema deprecate <N>` | Mark version as Deprecated |
| `ael audit export` | Build complete audit package (export + chain report + registry snapshot + DLQ summary) |
| `ael dlq list` | List Dead Letter Queue entries |
| `ael dlq inspect <n>` | Inspect DLQ entry at line N |
| `ael privacy shred <subject>` | Delete PII records for subject (right to be forgotten) |

## Workflows

### 1. Write an event
```bash
echo '{"action":"synthesize","status":"completed","_meta":{"traceId":"wf-1"}}' | ael write --agent researcher
```

### 2. Audit a log file
```bash
ael verify events/2026-05-30.jsonl       # check integrity
ael validate events/2026-05-30.jsonl     # check schema compliance
ael dlq list                              # review errors
ael audit export --output ./audit-pkg    # build complete package
```

### 3. Add a new schema version
```bash
ael schema add 3            # scaffolds schemas/v3/
# Edit schemas/v3/schema.json and schemas/v3/migration.ts
ael schema list             # confirm v3 is Draft
# After testing, update registry.json to activate
ael schema deprecate 1      # deprecate v1 if 6+ months old
```

## Reference docs

- Full protocol spec: `references/spec.md`
- Schema authoring guide: `references/schema-authoring.md`
- Step-by-step audit runbook: `references/audit-runbook.md`

## Guardrails

- `ael verify` and `ael validate` are **read-only** – they never modify files
- **Never edit historical events** – the append-only log is immutable
- **PII must always be tokenized** – use `--pii-fields` on write or pre-tokenize
- A hash chain break halts the pipeline (exit 1) – investigate before proceeding
- Deprecated versions must remain active ≥ 6 months before sunset
