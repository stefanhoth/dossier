---
name: dossier
description: >
  Use when working with agent audit trails, event logs, or the Agent Data
  Format Spec. Triggers: "write an agent event", "validate this JSONL",
  "verify the audit chain", "add a schema version", "build an audit export",
  "migrate events". Covers writing, validating, integrity-checking,
  migrating, and auditing JSONL event logs.
---

# dossier – Agent Event Log CLI

## When to use

Use this skill when asked to:
- Write, validate, or verify agent event logs (JSONL format)
- Check audit trail integrity (hash chain verification)
- Add, migrate, or deprecate schema versions
- Build an audit export package for compliance
- Inspect or manage the Dead Letter Queue

## Invocation

`dossier` can be called as a global install or via npx — prefer npx in agent environments to avoid Node version conflicts:

```bash
npx @stefanhoth/dossier <command>   # zero-install, always latest
dossier <command>                    # if installed globally
```

## Command reference

| Command | Purpose |
|---|---|
| `dossier init` | Initialize workspace (events/, schemas/, config) |
| `dossier write` | Write event from stdin to log (validates, hash-chains, appends) |
| `dossier read` | Read/filter events from log |
| `dossier validate <file>` | Validate JSONL against declared schema versions (read-only) |
| `dossier verify <file>` | Verify hash-chain integrity (read-only) |
| `dossier migrate <file> --to N` | Forward-migrate events to schema version N |
| `dossier schema list` | List schema versions with lifecycle state |
| `dossier schema add <N>` | Scaffold new schema version |
| `dossier schema deprecate <N>` | Mark version as Deprecated |
| `dossier audit export` | Build complete audit package (export + chain report + registry snapshot + DLQ summary) |
| `dossier dlq list` | List Dead Letter Queue entries |
| `dossier dlq inspect <n>` | Inspect DLQ entry at line N |
| `dossier privacy shred <subject>` | Delete PII records for subject (right to be forgotten) |

## Workflows

### 1. Write an event
```bash
echo '{"action":"synthesize","status":"completed","_meta":{"traceId":"wf-1"}}' | dossier write --agent researcher
```

### 2. Audit a log file
```bash
dossier verify events/2026-05-30.jsonl       # check integrity
dossier validate events/2026-05-30.jsonl     # check schema compliance
dossier dlq list                              # review errors
dossier audit export --output ./audit-pkg    # build complete package
```

### 3. Add a new schema version
```bash
dossier schema add 3            # scaffolds schemas/v3/
# Edit schemas/v3/schema.json and schemas/v3/migration.ts
dossier schema list             # confirm v3 is Draft
# After testing, update registry.json to activate
dossier schema deprecate 1      # deprecate v1 if 6+ months old
```

## Reference docs

- Full protocol spec: `references/spec.md`
- Schema authoring guide: `references/schema-authoring.md`
- Step-by-step audit runbook: `references/audit-runbook.md`

## Guardrails

- `dossier verify` and `dossier validate` are **read-only** – they never modify files
- **Never edit historical events** – the append-only log is immutable
- **PII must always be tokenized** – use `--pii-fields` on write or pre-tokenize
- A hash chain break halts the pipeline (exit 1) – investigate before proceeding
- Deprecated versions must remain active ≥ 6 months before sunset
