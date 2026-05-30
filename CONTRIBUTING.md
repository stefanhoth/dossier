# Contributing

## Commit convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(scope): ...` – new feature
- `fix(scope): ...` – bug fix
- `test(scope): ...` – tests only
- `chore: ...` – tooling, deps
- `docs: ...` – documentation only
- `refactor(scope): ...` – no behavior change

Scopes: `core`, `schema`, `integrity`, `privacy`, `store`, `commands`, `shared`

## Adding a schema version

1. `ael schema add <N>` – scaffolds `schemas/vN/`
2. Edit `schemas/vN/schema.json` – add/remove fields per breaking/compatible change rules
3. Edit `schemas/vN/migration.ts` – implement `from_v{N-1}`
4. Add examples to `schemas/vN/examples.jsonl`
5. Update `schemas/registry.json` – set version state to `active`
6. Run `npm test` to verify migration unit tests pass
7. Deprecate old version if ≥ 6 months old: `ael schema deprecate <N-1>`

## Running tests

```bash
npm test              # unit + integration
npm run test:coverage # with coverage report
npm run typecheck     # TypeScript strict check
npm run lint          # ESLint
```

## Branching

- Feature branches: `feat/<description>`
- Fix branches: `fix/<description>`
- All changes via PR; CI must pass before merge
