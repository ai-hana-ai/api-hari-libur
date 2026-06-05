# AGENTS.md — api-hari-libur

## Team

| Name     | Role                        | Description                                                  |
|----------|-----------------------------|--------------------------------------------------------------|
| Hana     | User-facing                 | Receives feature requests, reports results to stakeholders.  |
| Maestro  | PM / Orchestrator           | Decomposes requests into tasks, assigns work, manages flow.  |
| Rin      | Coder                       | Implements features, writes code, fixes bugs.                |
| Kira     | QA                          | Reviews code, runs tests, verifies acceptance criteria.      |

## Task Flow

```
Hana receives request
       ↓
Maestro decomposes into tasks
       ↓
Rin implements each task
       ↓
Kira reviews and verifies
       ↓
Hana reports to requester
```

## Code Quality

- **TypeScript:** strict mode via tsconfig, type check via `tsc --noEmit`
- **Linting:** ESLint v10 flat config with `@typescript-eslint` rules
- **Testing:** Vitest with 49 tests across 4 test files
- **CI:** GitHub Actions — runs typecheck + lint + test on every push to `main`

## Test Files

| File                  | Count | What it tests                          |
|-----------------------|-------|----------------------------------------|
| `test/constants.test.ts`  | 5  | Month name mappings                    |
| `test/date_schema.test.ts`| 24 | Zod validation: year/month/day/edge    |
| `test/holiday.test.ts`    | 9  | Cache, filtering, holiday detection    |
| `test/api.test.ts`        | 11 | Full integration via `app.request()`   |
