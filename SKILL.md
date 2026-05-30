---
name: dossier
description: >
  Tamper-evident audit logging for agentic workflows. Use when an agent takes
  consequential actions, delegates tasks to other agents, handles personal data,
  or operates in a context where a human principal needs to be able to reconstruct
  what happened and trust the record. Also use for: validating/verifying existing
  JSONL logs, building compliance export packages, managing schema versions.
---

# dossier – Agent Event Log CLI

## Why an agent should care about this

When you act autonomously — browsing, writing code, calling APIs, delegating to sub-agents — the human who authorized you often cannot watch in real time. `dossier` gives them a record they can trust after the fact:

- **Tamper-evident**: SHA-256 hash chaining means any modification to a past event is detectable. The log is a commitment, not a suggestion.
- **Traceable across agents**: Every event carries a `traceId`. If you hand a task to another agent, both of you write to the same trace. A reviewer can reconstruct the full conversation — who decided what, in what order, with what result.
- **Compliant by design**: PII is tokenized out-of-band. If the workflow touched personal data, `dossier privacy shred` removes it without breaking the audit trail.

## When to use

**Use proactively when:**
- You are about to take an action with real-world side effects (API call, file write, database change, external message)
- You are delegating a task to another agent — write a `delegate` event before handing off, and expect the sub-agent to write a `result` event when done
- The operator has said the workflow must be auditable, reproducible, or GDPR-compliant
- Something went wrong and you need to produce a compliance report

**Use reactively when asked to:**
- Verify or validate an existing event log
- Build an audit export package
- Migrate events to a new schema version
- Inspect the Dead Letter Queue for dropped events

**Skip when:**
- The action is ephemeral and inconsequential (e.g. reading a public webpage with no side effects)
- No human principal needs a trust anchor for what you did

## Invocation

Prefer `npx` in agent environments — no version conflicts, always matches the published spec:

```bash
npx @stefanhoth/dossier <command>   # zero-install
dossier <command>                    # if installed globally
```

## Invocation

`dossier` can be called as a global install or via npx — prefer npx in agent environments to avoid Node version conflicts:

```bash
npx @stefanhoth/dossier <command>   # zero-install, always latest
dossier <command>                    # if installed globally
```

## Command reference

| Command | Purpose |
|---|---|
| `dossier init` | Initialize workspace (`events/`, `schemas/`, config) |
| `dossier write` | Write event from stdin — validates, hash-chains, appends |
| `dossier read` | Read/filter events by trace, seqNo range, or date |
| `dossier validate <file>` | Validate JSONL against declared schema versions (read-only) |
| `dossier verify <file>` | Verify hash-chain integrity (read-only) |
| `dossier migrate <file> --to N` | Forward-migrate events to schema version N |
| `dossier schema list\|add\|deprecate` | Manage schema version lifecycle |
| `dossier audit export` | Build compliance package (JSONL + chain report + registry + DLQ) |
| `dossier dlq list\|inspect <n>` | Inspect events that failed validation |
| `dossier privacy shred <subject>` | Delete PII for a subject (GDPR right to erasure) |

## Workflows

### 1. Log a consequential action

Before and after a side-effecting step, write events with the same `traceId`:

```bash
# Before: intent
echo '{"action":"send-email","status":"started","_meta":{"traceId":"wf-42","agent":"notifier"}}' \
  | npx @stefanhoth/dossier write

# After: outcome
echo '{"action":"send-email","status":"completed","output":{"messageId":"msg-99"},"_meta":{"traceId":"wf-42","agent":"notifier"}}' \
  | npx @stefanhoth/dossier write
```

### 2. Agent-to-agent handoff

Orchestrator writes a `delegate` event; sub-agent writes the `result`:

```bash
# Orchestrator
echo '{"action":"delegate","status":"completed","output":{"task":"summarise report"},"_meta":{"traceId":"wf-7","agent":"orchestrator"}}' \
  | npx @stefanhoth/dossier write

# Sub-agent (same traceId, different agent)
echo '{"action":"summarise","status":"completed","output":{"words":320},"_meta":{"traceId":"wf-7","agent":"summariser"}}' \
  | npx @stefanhoth/dossier write
```

### 3. Produce an audit report

```bash
npx @stefanhoth/dossier verify events/2026-05-30.jsonl    # integrity check
npx @stefanhoth/dossier validate events/2026-05-30.jsonl  # schema check
npx @stefanhoth/dossier dlq list                          # review dropped events
npx @stefanhoth/dossier audit export --output ./audit-pkg # full compliance package
```

### 4. Add a new schema version

```bash
npx @stefanhoth/dossier schema add 3     # scaffolds schemas/v3/
# Edit schemas/v3/schema.json and schemas/v3/migration.ts
npx @stefanhoth/dossier schema list      # confirm v3 is Draft
# Update registry.json to activate, then:
npx @stefanhoth/dossier schema deprecate 1  # retire v1 when safe
```

## Reference docs

- Full protocol spec: `references/spec.md`
- Schema authoring guide: `references/schema-authoring.md`
- Step-by-step audit runbook: `references/audit-runbook.md`

## Guardrails

- `dossier verify` and `dossier validate` are **read-only** — they never modify the log
- **Never edit historical events** — the append-only log is the trust anchor; editing it breaks the chain
- **PII must be tokenized** — never write raw personal data inline; use the privacy side-store
- A chain break (exit 1 from `verify`) means the log may have been tampered with — stop the pipeline and investigate before proceeding
- Deprecated schema versions must remain readable for ≥ 6 months before sunset
