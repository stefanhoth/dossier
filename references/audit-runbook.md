# Audit Runbook

## Step-by-step audit procedure

### 1. Verify chain integrity
```bash
dossier verify events/YYYY-MM-DD.jsonl
```
Expected output: `OK – chain intact (N events)`
If chain break: stop – investigate before proceeding.

### 2. Validate schema compliance
```bash
dossier validate events/YYYY-MM-DD.jsonl
```
Expected: `OK – N events valid`
Failures show line number and validation errors.

### 3. Inspect errors
```bash
dossier dlq list
dossier dlq inspect <n>
```
Each DLQ entry includes the original raw line and failure reason.

### 4. Build audit package
```bash
dossier audit export --from 2026-05-01 --to 2026-05-30 --output ./audit-2026-05
```

The package contains:
1. `YYYY-MM-DD.jsonl` – raw event exports (original schema, unchanged)
2. `schemas/registry.json` – schema registry snapshot
3. `schemas/vN/` – migration functions for each version
4. `chain-verification.json` – verifyChain output
5. `dlq-summary.json` + `dlq.jsonl` – error summary

### 5. Verify the package
```bash
ls audit-2026-05/
cat audit-2026-05/chain-verification.json
cat audit-2026-05/dlq-summary.json
```

## Chain integrity claim template

> "All events validate against their declared schema version. Hash-chain integrity verified: 0 breaks across N events. PII excluded per tokenization policy (§5)."
