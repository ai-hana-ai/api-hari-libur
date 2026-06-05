# API Hari Libur Indonesia

[![CI](https://github.com/ai-hana-ai/api-hari-libur/actions/workflows/ci.yml/badge.svg)](https://github.com/ai-hana-ai/api-hari-libur/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-49%20passing-brightgreen)](https://github.com/ai-hana-ai/api-hari-libur)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Runtime](https://img.shields.io/badge/runtime-Cloudflare%20Workers-orange)](https://workers.cloudflare.com/)
[![Stack](https://img.shields.io/badge/stack-Vite%2B%20Nitro%20Hono-purple)](https://viteplus.dev)

A free REST API for Indonesian public holidays (Hari Libur Nasional). Holiday data is scraped from [tanggalans.com](https://www.tanggalans.com/) and cached in-memory (with optional [unstorage](https://unstorage.unjs.io/) + Cloudflare KV for persistent cache).

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
| **Storage** | [unstorage](https://unstorage.unjs.io/) (optional — KV binding) |
| **Testing** | [Vitest](https://vitest.dev/) — 49 tests |
| **Lint/Check** | `tsc --noEmit` + `oxlint` (planned) |

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
                    │  re-exports Hono app  │
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
     src/schema/     src/libraries/      src/libraries/
    date_schema.ts  holiday.ts (cache)  scraper.ts
       (Zod)         (unstorage KV)     (linkedom)
```

Nitro auto-detects `server.ts` at the project root as the server entry point. The Hono app handles all routing, validation, and error handling. Build output goes to `dist/` — a single `_worker.js` bundle + static assets.

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
│   │   ├── holiday.ts        # Business logic: cache, filter, date check
│   │   └── scraper.ts        # HTML parser (linkedom → tanggalans.com)
│   ├── middleware/zod.ts     # Zod validator wrapper (422 errors)
│   └── schema/date_schema.ts # Zod schema — dynamic getMaxYear()
├── test/
│   ├── api.test.ts           # 11 integration tests (mocked fetch)
│   ├── constants.test.ts     # 5 month name tests
│   ├── date_schema.test.ts   # 24 schema tests
│   └── holiday.test.ts       # 9 business logic tests (mocked scraper)
├── server.ts                 # Nitro server entry (Hono re-export)
├── vite.config.ts            # Vite + Nitro plugin config
├── nitro.config.ts           # Nitro preset: cloudflare_pages
├── wrangler.toml             # Cloudflare Pages config
├── tsconfig.json
├── pnpm-workspace.yaml       # pnpm v11 build allowlist
├── .dev.vars                 # Local KV binding emulation (optional)
└── package.json
```

## Best Practices

### Vite+ / Nitro / Cloudflare

| Practice | Status | Notes |
|----------|--------|-------|
| **`server.ts` auto-detect** | ✅ | Nitro picks it up automatically — no need for explicit `serverEntry` |
| **Nitro plugin in vite.config.ts** | ✅ | `nitro({ preset: 'cloudflare_pages' })` |
| **`nodeCompat: true`** | ✅ | Required for `linkedom` (uses `node:html`) |
| **Dynamic `getMaxYear()`** | ✅ | Must be function, not top-level `const` (build cache freeze) |
| **`tsc --noEmit` type check** | ✅ | Strict mode — catches unknown types early |
| **Each test = unique year** | ✅ | Prevents cache pollution across tests |
| **Vitest inline config** | ✅ | Test config in `vite.config.ts` — no separate `vitest.config.ts` |
| **pnpm `allowBuilds`** | ✅ | `pnpm-workspace.yaml` whitelists `esbuild`, `workerd`, `sharp` |
| **unstorage** | ⏳ Planned | Replace in-memory `Map` with `cloudflare-kv-binding` driver |
| **Oxlint** | ⏳ Planned | Replace `tsc` type-check-only with full Oxc lint+format+typecheck |
| **Vite+ CLI (`vp`)** | ⏳ Partially | `vp` installed globally; native binding issue on VPS blocks full use |

### unstorage Setup (Planned)

Replace the in-memory cache in `src/libraries/holiday.ts`:

```ts
import { createStorage } from 'unstorage'
import cloudflareKVBinding from 'unstorage/drivers/cloudflare-kv-binding'
import memoryDriver from 'unstorage/drivers/memory'

export const storage = createStorage({
  driver: import.meta.dev
    ? memoryDriver()
    : cloudflareKVBinding({ binding: 'HOLIDAY_CACHE' }),
})

// Usage:
await storage.setItem(`holiday:${year}`, data, { ttl: 30 * 86400 })
const cached = await storage.getItem(`holiday:${year}`)
```

Requires:
- KV namespace `HOLIDAY_CACHE` in Cloudflare dashboard
- `wrangler.toml` binding: `[[kv_namespaces]] binding = "HOLIDAY_CACHE" id = "..."`

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
pnpm dev          # → http://localhost:3000
pnpm test         # 49 tests
pnpm build        # → dist/
pnpm deploy       # → Cloudflare Pages
```

## CI Pipeline

Every push to `main`:

1. `tsc --noEmit` — type check
2. `vitest run` — 49 tests (including mocked fetch/crawler)
3. `vite build` — production build via Nitro + Rolldown

## Deployment

Each push triggers auto-deploy. The **latest production deployment** is always at:

**https://api-hari-libur.pages.dev**

To manually deploy:

```bash
pnpm build
pnpm deploy
```

Preview deployments get a unique hash URL (e.g. `https://65168982.api-hari-libur.pages.dev`) that Cloudflare promotes to the production domain after a few minutes.

## Migrating from Wrangler Pages Functions

If you're coming from the old setup (pre-June 2026):

1. `functions/api/[[catchall]].ts` → `server.ts` (Nitro auto-detect)
2. `wrangler pages dev` → `vite dev` (Vite + Nitro + HMR)
3. `npm` → `pnpm` (2× faster installs)
4. ESLint + vitest.config.ts → config in vite.config.ts
5. Build output: `public/` → `dist/` (Nitro v3 generates `_worker.js`)

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgments

- Holiday data: [tanggalans.com](https://www.tanggalans.com/)
- Built with [Vite+](https://viteplus.dev/), [Nitro](https://nitro.build/), [Hono](https://hono.dev/)
- Part of the [unjs](https://unjs.io/) ecosystem
