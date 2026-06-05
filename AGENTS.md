# AGENTS.md — api-hari-libur

## Architecture Overview

Vite+ + Nitro + Hono on Cloudflare Pages:

```
Client
  ↓  request
Cloudflare Pages (dist/ via wrangler)
  ├─ / (root)      → serves public/ static assets
  └─ /api/*        → _worker.js (Nitro runtime)
                         ↓
                    server.ts → src/app.ts (Hono)
                         ↓
                    GET /api?year=&month=&day=  → getHoliday()
                    GET /api/today              → getHolidayDate(now)
                    GET /api/tomorrow           → getHolidayDate(tomorrow)
                         ↓
                    src/libraries/scraper.ts → fetch("https://tanggalans.com/...")
                         ↓
                    Response JSON
```

## Tech Stack

| Layer | Tech |
|-------|------|
| **Runtime** | Cloudflare Workers (via Pages) |
| **Server** | Nitro v3 (auto-detect `server.ts`) |
| **Framework** | Hono (`src/app.ts`) |
| **Build** | Vite 8 + Rolldown |
| **Toolchain** | Vite+ (`vp` CLI) |
| **Package** | pnpm |
| **Test** | Vitest (49 tests) |
| **Lint/Check** | tsc + Oxlint |

## Key Files

| File | Role |
|------|------|
| `server.ts` | Nitro entry point — re-exports Hono app. Auto-detected by Nitro. |
| `vite.config.ts` | Vite config with Nitro plugin (`preset: cloudflare_pages`) |
| `nitro.config.ts` | Nitro config: `nodeCompat: true` (for linkedom), `@/` alias |
| `src/app.ts` | Hono app: routes, CORS, error handler |
| `src/schema/date_schema.ts` | Zod schema — dynamic `getMaxYear()` (must be function, not const!) |
| `src/libraries/holiday.ts` | Business logic + in-memory Map cache |
| `src/libraries/scraper.ts` | HTML parser using linkedom |
| `dist/` | Build output (Nitro generates `_worker.js` + static assets) |

## Commands

| Command | What |
|---------|------|
| `pnpm dev` | Vite dev server (Nitro + HMR) at :3000 |
| `pnpm build` | Production build → `dist/` |
| `pnpm test` | Vitest (49 tests) |
| `pnpm deploy` | `wrangler pages deploy dist/` |

## Critical Notes

- **`getMaxYear()` must be a function** — Wrangler/Rolldown freezes top-level `new Date()` at build time
- **linkedom uses node:html** — enabled via `nitro.config.ts` → `nodeCompat: true`
- **Cache is module-level** — each worker invocation starts with fresh cache (consider unstorage for persistent KV)
- **Tests mock fetcher** — `api.test.ts` uses `vi.stubGlobal('fetch')`, `holiday.test.ts` uses `vi.mock('scraper')`