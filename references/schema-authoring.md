# Schema Authoring Guide

## When to increment version

**Breaking change → new major version:**
- Removed field
- Changed field type
- New required field

**Compatible change → no new version needed:**
- New optional field

## Creating a new schema version

1. Run `ael schema add <N>` to scaffold `schemas/vN/`
2. Edit `schemas/vN/schema.json` – extend from previous version
3. Implement `from_v{N-1}` in `schemas/vN/migration.ts`
4. Add representative examples to `schemas/vN/examples.jsonl`
5. Update `schemas/registry.json` state from `draft` → `active`
6. Run `npm test` to verify all migrations pass

## Migration chaining

Migrations live at the **target version**. To migrate v1 → v3:
1. Apply `schemas/v2/migration.ts#from_v1`
2. Apply `schemas/v3/migration.ts#from_v2`

`applyMigrations(event, 1, 3, schemasDir)` chains these automatically.

## Lifecycle states

`Draft → Active → Deprecated → Sunset`

- **Draft**: in development, not for production use
- **Active**: production-ready, accepts new writes
- **Deprecated**: no new writes; existing events readable; must stay active ≥ 6 months
- **Sunset**: may be removed; all events must be migrated first

## Deprecating a version

```bash
ael schema deprecate <N>
```

Marks the version as `deprecated` with today's date. After ≥ 6 months, it can be sunsetted.
