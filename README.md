# API Hari Libur Indonesia

[![CI](https://github.com/ai-hana-ai/api-hari-libur/actions/workflows/ci.yml/badge.svg)](https://github.com/ai-hana-ai/api-hari-libur/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-49%20passing-brightgreen)](https://github.com/ai-hana-ai/api-hari-libur)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Runtime](https://img.shields.io/badge/runtime-Cloudflare%20Workers-orange)](https://workers.cloudflare.com/)
[![Stack](https://img.shields.io/badge/stack-Vite%2B%20Nitro%20Hono-purple)](https://viteplus.dev)

A free REST API for Indonesian public holidays (Hari Libur Nasional). Holiday data is scraped from [tanggalans.com](https://www.tanggalans.com/) and cached via [unstorage](https://unstorage.unjs.io/) — **memory in dev/test, Cloudflare KV in production**.

**Production:** https://api-hari-libur.pages.dev

---

## Tech Stack

| Layer | Tech |
|-------|------|
| **Runtime** | Cloudflare Workers (via Pages) |
| **Server Engine** | [Nitro](https://nitro.build/) v3 (beta) |
| **Framework** | [Hono](https://hono.dev/) |
| **Build Tool** | [Vite](https://vite.dev/) 8 + [Rolldown](https://rolldown.rs/) |
| **Toolchain** | [Vite+](https://viteplus.dev/) (`vp` CLI) |
| **Package** | [pnpm](https://pnpm.io/) |
| **Validation** | [Zod](https://zod.dev/) / `@hono/zod-validator` |
| **Parsing** | [Linkedom](https://github.com/nicolo-ribaudo/linkedom) |
| **Cache** | [unstorage](https://unstorage.unjs.io/) — memory/Cloudflare KV |
| **Testing** | [Vitest](https://vitest.dev/) — 49 tests |
| **Lint/Check** | `tsc --noEmit` |

## Architecture

```
                     ┌──────────────────────┐
                     │   Cloudflare Pages    │
                     │  (dist/ via wrangler) │
                     └──────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │   _worker.js (Nitro)  │
                    │  auto-detects server.ts│
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │   server.ts (entry)   │
                    │  Hono app + unstorage │
                    │  init via useStorage  │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │   src/app.ts (Hono)   │
                    │  /api  /api/today     │
                    │  /api/tomorrow        │
                    └───────────┬───────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
     src/schema/     src/libraries/      /api-hari-libur
    date_schema.ts  holiday.ts (cache)  scraper.ts
       (Zod)        (unstorage: KV/KV)  (linkedom)
                        │
                        ▼
                Cloudflare KV
             (HOLIDAY_CACHE ns)
```

Nitro auto-detects `server.ts` at the project root as the server entry point. The Hono app handles all routing, validation, and error handling. **unstorage** is initialized in `server.ts` using Nitro's `useStorage('holidays')` — in development it falls back to memory, in production it uses the Cloudflare KV binding.

## Cache Architecture

| Environment | Driver | Notes |
|------------|--------|-------|
| **Production** | `cloudflareKVBinding` | KV namespace `HOLIDAY_CACHE` |
| **Dev (`vite dev`)** | `memory` | Nitro's `devStorage` override |
| **Tests (Vitest)** | `memory` | Direct unstorage, no Nitro dependency |

**Initialization flow:**

```ts
// server.ts — runs at module init time
import { useStorage } from 'nitro/storage'
import { prefixStorage } from 'unstorage'
import { setHolidayStorage } from './src/libraries/holiday'

setHolidayStorage(prefixStorage(useStorage('holidays'), 'api-hari-libur:'))
```

Key prefix `api-hari-libur:` avoids namespace collisions in KV.

**TTL:**
- Current/future years: 30 days (seconds, KV-compatible)
- Past years: permanent

## Project Structure

```
api-hari-libur/
├── .github/workflows/
│   └── ci.yml               # CI: typecheck → test → build
├── public/                   # Static assets (served at root /)
│   ├── index.html
│   ├── script.js
│   └── style.css
├── src/
│   ├── app.ts                # Hono app: routes, CORS, error handler
│   ├── constants/month.ts    # MONTH_NAME: Indonesian → number
│   ├── libraries/
│   │   ├── holiday.ts        # Business logic: unstorage cache + filter
│   │   └── scraper.ts        # HTML parser (linkedom → tanggalans.com)
│   ├── middleware/zod.ts     # Zod validator wrapper (422 errors)
│   └── schema/date_schema.ts # Zod schema — dynamic getMaxYear()
├── test/
│   ├── api.test.ts           # 11 integration tests (mocked fetch)
│   ├── constants.test.ts     # 5 month name tests
│   ├── date_schema.test.ts   # 24 schema tests
│   └── holiday.test.ts       # 9 business logic tests (mocked scraper)
├── server.ts                 # Nitro server entry + unstorage init
├── vite.config.ts            # Vite + Nitro plugin config
├── nitro.config.ts           # Nitro preset: cloudflare_pages + storage
├── wrangler.toml             # Cloudflare Pages config + KV binding
├── tsconfig.json
├── pnpm-workspace.yaml       # pnpm v11 build allowlist
└── package.json
```

## Best Practices

### Vite+ / Nitro / Cloudflare / unstorage

| Practice | Status | Notes |
|----------|--------|-------|
| **`server.ts` auto-detect** | ✅ | Nitro picks it up automatically |
| **Nitro plugin in vite.config.ts** | ✅ | `nitro({ preset: 'cloudflare_pages' })` |
| **`nodeCompat: true`** | ✅ | Required for `linkedom` |
| **Dynamic `getMaxYear()`** | ✅ | Function, not top-level const |
| **unstorage** | ✅ | Memory in dev/test, Cloudflare KV in prod |
| **KV namespace** | ✅ | `HOLIDAY_CACHE` created via wrangler |
| **`useStorage` bridge** | ✅ | `server.ts` inits via `nitro/storage` |
| **Key prefix** | ✅ | `api-hari-libur:` in `prefixStorage` |
| **`tsc --noEmit`** | ✅ | Strict mode |
| **Unique years per test** | ✅ | Prevents cache pollution |
| **Vitest inline config** | ✅ | In `vite.config.ts` |
| **pnpm `allowBuilds`** | ✅ | `pnpm-workspace.yaml` |
| **Oxlint** | ⏳ Planned | Replace `tsc` type-check-only |
| **Vite+ CLI (`vp`)** | ⏳ Partially | Native binding issue on VPS |

### Config Files

```ts
// nitro.config.ts — unstorage config
export default defineConfig({
  compatibilityDate: '2025-04-01',
  preset: 'cloudflare_pages',
  cloudflare: { nodeCompat: true },
  alias: { '@': '/src' },
  storage: {
    holidays: {
      driver: 'cloudflareKVBinding',
      binding: 'HOLIDAY_CACHE',
    },
  },
  devStorage: {
    holidays: {
      driver: 'memory',
    },
  },
})
```

```toml
# wrangler.toml — KV binding
name = "api-hari-libur"
compatibility_date = "2025-01-01"
pages_build_output_dir = "dist"

[[kv_namespaces]]
binding = "HOLIDAY_CACHE"
id = "670c1bf9959b404f8c2650668969f74c"
```

```ts
// server.ts — unstorage init
import { useStorage } from 'nitro/storage'
import { prefixStorage } from 'unstorage'
import { setHolidayStorage } from './src/libraries/holiday'

setHolidayStorage(prefixStorage(useStorage('holidays'), 'api-hari-libur:'))
export { default } from './src/app'
```

### Do NOT

- ❌ Set `serverEntry` in vite.config.ts — Nitro auto-detects `server.ts`
- ❌ Set `serverDir` in nitro.config.ts — `server.ts` IS the entry
- ❌ Use top-level `new Date()` — build cache freezes it
- ❌ Try importing `useStorage` from `nitro/runtime` — use `nitro/storage`
- ❌ Use `.output/public/` — Nitro v3 outputs to `dist/`

## API Endpoints

Base: `https://api-hari-libur.pages.dev`

### `GET /api`

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `year` | number | No | 2011 — current+1. Defaults to current year. |
| `month` | number | No | 1–12. |
| `day` | number | No | 1–31. Requires `month`. |

```bash
curl "https://api-hari-libur.pages.dev/api?year=2026&month=1"
```

```json
[
  { "date": "2026-01-01", "name": "Tahun Baru 2026 Masehi", "is_national_holiday": true },
  { "date": "2026-01-29", "name": "Tahun Baru Imlek 2577 Kongzili", "is_national_holiday": true }
]
```

With `day` — returns object:

```bash
curl "https://api-hari-libur.pages.dev/api?year=2026&month=1&day=1"
```

```json
{
  "date": "2026-01-01",
  "is_holiday": true,
  "is_national_holiday": true,
  "holiday_list": ["Tahun Baru 2026 Masehi"]
}
```

### `GET /api/today`

```bash
curl https://api-hari-libur.pages.dev/api/today
```

Returns same shape as `/api` with `day`. Uses `Asia/Jakarta` timezone.

### `GET /api/tomorrow`

```bash
curl https://api-hari-libur.pages.dev/api/tomorrow
```

### Error Responses

```json
// 422 — Validation error
{ "message": "The given data was invalid.", "errors": { "year": ["Minimum year is 2011"] } }

// 500 — Server error
{ "message": "Failed to fetch tanggalan" }
```

## Local Development

```bash
pnpm install
pnpm dev          # → http://localhost:3000 (memory cache)
pnpm test         # 49 tests (memory cache)
pnpm build        # → dist/
pnpm deploy       # → Cloudflare Pages (KV cache)
```

## CI Pipeline

Every push to `main`:

1. `tsc --noEmit` — type check
2. `vitest run` — 49 tests (including mocked fetch/crawler + unstorage cache)
3. `vite build` — production build via Nitro + Rolldown

## KV Namespace

Created 5 June 2026:

```
wrangler kv namespace create HOLIDAY_CACHE
→ id: 670c1bf9959b404f8c2650668969f74c
```

Bound in `wrangler.toml` as `[[kv_namespaces]]`. Nitro's `cloudflare_pages` preset automatically exposes the binding to the runtime.

## Deployment

Each push triggers auto-deploy. The **latest production deployment** is always at:

**https://api-hari-libur.pages.dev**

To manually deploy:

```bash
pnpm build
pnpm deploy
```

Preview deployments get a unique hash URL (e.g. `https://{hash}.api-hari-libur.pages.dev`) that Cloudflare promotes to the production domain after a few minutes.

## Migrating from Wrangler Pages Functions

If you're coming from the old setup (pre-June 2026):

1. `functions/api/[[catchall]].ts` → `server.ts` (Nitro auto-detect)
2. `wrangler pages dev` → `vite dev` (Vite + Nitro + HMR)
3. `npm` → `pnpm` (2× faster installs)
4. ESLint + vitest.config.ts → config in vite.config.ts
5. In-memory Map → unstorage (memory dev / KV prod)
6. Build output: `public/` → `dist/` (Nitro v3 generates `_worker.js`)

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgments

- Holiday data: [tanggalans.com](https://www.tanggalans.com/)
- Built with [Vite+](https://viteplus.dev/), [Nitro](https://nitro.build/), [Hono](https://hono.dev/)
- Cache via [unstorage](https://unstorage.unjs.io/) — part of the [unjs](https://unjs.io/) ecosystem
