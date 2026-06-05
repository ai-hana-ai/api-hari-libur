# AGENTS.md — api-hari-libur

## Architecture Overview

Cloudflare Pages **Functions** — satu project dengan dua layer:

```
public/        → static assets (landing page HTML/CSS/JS)
functions/api/ → worker functions (API endpoint routing via Hono)
```

Request flow:

```
Client
  ↓  request
Cloudflare Pages
  ├─ / (root)      → serves public/index.html
  └─ /api/*        → functions/api/[[catchall]].ts → src/app.ts
                         ↓
                    Hono router
                         ├─ GET /api?year=&month=&day=  → getHoliday()
                         ├─ GET /api/today              → getHolidayDate(now)
                         └─ GET /api/tomorrow           → getHolidayDate(tomorrow)
                         ↓
                    src/libraries/scraper.ts → fetch("https://tanggalans.com/...")
                         ↓
                    Response JSON
```

## File Map & Responsibilities

| File | Role | Key Exports |
|------|------|-------------|
| `functions/api/[[catchall]].ts` | Pages Functions entry point. Bridges CF Pages `context` → Hono `app.fetch()`. | `onRequest` |
| `src/app.ts` | Hono app definition. Routes, CORS, error handler. Imports everything. | `app` (default export) |
| `src/schema/date_schema.ts` | Zod schema untuk validasi query params (`year`, `month`, `day`). **Dynamic `getMaxYear()`** — must be a function, not a const, because wrangler/esbuild freezes top-level values at build time. | `dateSchema`, `getMaxYear` |
| `src/middleware/zod.ts` | Wrapper around `@hono/zod-validator`. On validation failure: throws `HTTPException(422)` with structured field errors. | `zValidator` |
| `src/libraries/holiday.ts` | Business logic. In-memory `Map` cache (replacing Deno.Kv). Cache TTL: 30 days for current/future years, infinite for past years. | `getHoliday`, `getHolidayDate`, `getHolidayYearly` |
| `src/libraries/scraper.ts` | HTML parser using `linkedom`. Fetches `tanggalans.com/kalender-{year}`, parses `.kalender-indo` blocks. | `crawler` |
| `src/constants/month.ts` | Indonesian month name → zero-padded number mapping (`'januari' → '01'`). `as const` for type safety. | `MONTH_NAME` |

## Request/Response Patterns

### Error Responses
Validation errors (`422`):
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "year": ["Minimum year is 2011"],
    "day": ["The provided date is not valid"]
  }
}
```

Unexpected errors (`500`):
```json
{
  "message": "Something went wrong"
}
```

### Holiday Response Shapes
**List** (`GET /api?year=2026&month=1`):
```json
[
  { "date": "2026-01-01", "name": "Tahun Baru 2026 Masehi", "is_national_holiday": true },
  { "date": "2026-01-02", "name": "Cuti Bersama Tahun Baru", "is_national_holiday": false }
]
```

**Single date** (`GET /api?year=2026&month=1&day=1` or `/api/today`):
```json
{
  "date": "2026-01-01",
  "is_holiday": true,
  "is_national_holiday": true,
  "holiday_list": ["Tahun Baru 2026 Masehi"]
}
```

National holiday rules:
- `is_national_holiday: true` — name does NOT contain "cuti bersama" (case-insensitive)
- `is_national_holiday: false` — name contains "cuti bersama"
- In single-date response: `is_national_holiday` is `true` if ANY holiday on that date is national

## Critical Codegotchas (Must Read Before Editing)

### ⚠️ 1. Never freeze `new Date()` at module scope
```ts
// ❌ WRONG — wrangler/esbuild evaluates this at BUILD TIME
const maxYear = new Date().getFullYear() + 1   // freezes to 1970/1971!

// ✅ RIGHT — wrap in a function so it runs per-request
export const getMaxYear = () => new Date().getFullYear() + 1
```
This applies to ANY top-level `new Date()` or `Date.now()` in source files under `src/` or `functions/`.

### ⚠️ 2. Cache is module-level, shared across tests
`holiday.ts` uses an in-memory `Map<string, CacheEntry>`. In vitest, module state persists across tests. **Each test must use a unique year** to avoid cache pollution.

### ⚠️ 3. Mock strategy for tests
- **API tests** (`api.test.ts`): mock `globalThis.fetch` via `vi.stubGlobal('fetch', mockFn)` — tests the full stack including Hono routing, validation, and scraper parsing
- **Holiday tests** (`holiday.test.ts`): mock `crawler` from scraper module via `vi.mock()` — isolates business logic
- Never mock partial imports; vitest hoists `vi.mock()` calls

### ⚠️ 4. Timezone handling
`getHolidayDate()` converts input dates to `Asia/Jakarta` timezone explicitly:
```ts
new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
```
This prevents UTC vs WIB date shifts. Always use this pattern when dealing with date boundaries.

### ⚠️ 5. Import path convention
Source files use path alias `@/` in tsconfig:
```ts
import { dateSchema } from '@/schema/date_schema'  // resolves to src/schema/date_schema.ts
```
But vitest.config.ts also mirrors this alias. When adding new source files, update both tsconfig paths and vitest resolve.alias if needed.

### ⚠️ 6. Wrangler deploy vs build cache
After modifying `src/schema/date_schema.ts` or any file with dynamic date logic, **delete `.wrangler/` cache** if deploy behaves unexpectedly:
```bash
rm -rf .wrangler/ dist/
```
Or just use `wrangler pages deploy --no-build`.

## Testing Conventions

| Pattern | When to Use |
|---------|-------------|
| `vitest` with `describe`/`it`/`expect` | All tests |
| `vi.mock()` | Mock internal modules (scraper→crawler) |
| `vi.stubGlobal()` | Mock Web APIs (fetch, Request, Response) |
| `app.request()` | Integration tests — no server needed |
| Unique years per test | Always — cache persists module-wide |

Test commands:
```bash
npm test           # vitest run (CI mode)
npm run test:watch # vitest watch (dev mode)
```

## Deployment

```bash
npm run deploy     # wrangler pages deploy
```

Auto-deploys to **https://api-hari-libur.pages.dev**.

CI runs on every push (`.github/workflows/ci.yml`):
1. `npm ci`
2. `npm run typecheck` — `tsc --noEmit`
3. `npm run lint` — ESLint
4. `npm test` — Vitest
5. `npx wrangler pages deploy --dry-run` — validates wrangler config

## Endpoints Quick Reference

| Method | Path | Query Params | Response Shape | Notes |
|--------|------|-------------|----------------|-------|
| GET | `/api` | `year`, `month`, `day` | Array or Object | Day requires month |
| GET | `/api/today` | None | Object | Uses Asia/Jakarta TZ |
| GET | `/api/tomorrow` | None | Object | Uses Asia/Jakarta TZ |