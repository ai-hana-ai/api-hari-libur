# API Hari Libur Indonesia

[![CI](https://github.com/ai-hana-ai/api-hari-libur/actions/workflows/ci.yml/badge.svg)](https://github.com/ai-hana-ai/api-hari-libur/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-49%20passing-brightgreen)](https://github.com/ai-hana-ai/api-hari-libur)
| ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Runtime](https://img.shields.io/badge/runtime-Cloudflare%20Workers-orange)](https://workers.cloudflare.com/)
[![Stack](https://img.shields.io/badge/stack-Vite%2B%20Nitro%20Hono-purple)](https://viteplus.dev)

A free REST API for Indonesian public holidays (Hari Libur Nasional). Holiday data is scraped from [tanggalans.com](https://www.tanggalans.com/) and cached in-memory for fast responses.

**Live demo:** [api-hari-libur.pages.dev](https://api-hari-libur.pages.dev)

## Tech Stack

- **Runtime:** Cloudflare Workers (via Pages Functions + Nitro)
- **Language:** TypeScript
- **Server Engine:** [Nitro](https://nitro.build/) v3
- **Framework:** [Hono](https://hono.dev/)
- **Build Tool:** [Vite](https://vite.dev/) + [Rolldown](https://rolldown.rs/)
- **Toolchain:** [Vite+](https://viteplus.dev/) (`vp` CLI)
- **Package Manager:** [pnpm](https://pnpm.io/)
- **Validation:** [Zod](https://zod.dev/) with `@hono/zod-validator`
- **HTML Parsing:** [Linkedom](https://github.com/nicolo-ribaudo/linkedom)
- **Testing:** [Vitest](https://vitest.dev/) — 49 tests
- **Linting:** [Oxc](https://oxc.rs/) (Oxlint)
- **Deploy:** Cloudflare Pages

## Project Structure

```
api-hari-libur/
├── .github/workflows/
│   └── ci.yml            # CI pipeline: typecheck, test, build
├── public/                # Static landing page (served by Pages)
│   ├── index.html
│   ├── script.js
│   └── style.css
├── src/
│   ├── app.ts             # Hono app: routes, CORS, error handling
│   ├── constants/
│   │   └── month.ts       # Indonesian month name → number mapping
│   ├── libraries/
│   │   ├── holiday.ts     # Holiday logic: cache, filtering, date checks
│   │   └── scraper.ts     # Web scraper for tanggalans.com
│   ├── middleware/
│   │   └── zod.ts         # Custom Zod validator wrapper
│   └── schema/
│       └── date_schema.ts # Zod schema for date query params
├── test/
│   ├── api.test.ts        # API integration tests
│   ├── constants.test.ts  # Month name constant tests
│   ├── date_schema.test.ts# Date schema validation tests (24 cases)
│   └── holiday.test.ts    # Holiday business logic tests (mocked scraper)
├── server.ts              # Nitro server entry (re-exports Hono app)
├── vite.config.ts         # Vite + Nitro plugin config
├── nitro.config.ts        # Nitro deployment config
├── wrangler.toml           # Cloudflare Pages config
├── tsconfig.json
├── pnpm-workspace.yaml    # pnpm workspace config
└── package.json
```

## API Endpoints

Base URL: `https://api-hari-libur.pages.dev`

### GET /api

Retrieve public holidays for a given year, optionally filtered by month and day.

**Query Parameters:**

| Param   | Type   | Required | Description                                                  |
|---------|--------|----------|--------------------------------------------------------------|
| `year`  | number | No       | Year to query. Range: 2011 – current year + 1. Defaults to current year. |
| `month` | number | No       | Month filter. Range: 1 – 12.                                |
| `day`   | number | No       | Day filter. Range: 1 – 31. Requires `month` to be set.      |

**Example Request:**

```bash
curl https://api-hari-libur.pages.dev/api?year=2025&month=1
```

**Example Response:**

```json
[
  {
    "name": "Tahun Baru",
    "date": "2025-01-01",
    "is_national_holiday": true
  },
  {
    "name": "Harbolnas",
    "date": "2025-01-27",
    "is_national_holiday": false
  }
]
```

When `day` is specified, returns a single-date object:

```bash
curl "https://api-hari-libur.pages.dev/api?year=2025&month=1&day=1"
```

```json
{
  "date": "2025-01-01",
  "is_holiday": true,
  "is_national_holiday": true,
  "holiday_list": ["Tahun Baru"]
}
```

### GET /api/today

Check if today is a public holiday. Uses the server's current date in the Asia/Jakarta timezone.

**Query Parameters:** None.

```bash
curl https://api-hari-libur.pages.dev/api/today
```

### GET /api/tomorrow

Check if tomorrow is a public holiday.

```bash
curl https://api-hari-libur.pages.dev/api/tomorrow
```

## Local Development

```bash
# 1. Clone
git clone https://github.com/ai-hana-ai/api-hari-libur.git
cd api-hari-libur

# 2. Install dependencies (pnpm)
pnpm install

# 3. Start local dev server (API at http://localhost:3000)
pnpm dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start Vite dev server (Nitro + Hono + HMR) |
| `pnpm build` | Build for production (Vite + Rolldown + Nitro) |
| `pnpm preview` | Preview production build locally |
| `pnpm test` | Run 49 unit/integration tests (Vitest) |
| `pnpm deploy` | Deploy to Cloudflare Pages |

## Test Coverage

- **constants.test.ts** (5) — Month name mappings
- **date_schema.test.ts** (24) — Date validation: year, month, day, edge cases
- **holiday.test.ts** (9) — Cache logic, filtering, holiday detection (mocked scraper)
- **api.test.ts** (11) — Full API integration via `app.request()` (mocked fetch)

## CI Pipeline

Every push to `main` triggers:

1. **Type check** — `tsc --noEmit`
2. **Test** — Vitest (49 tests)
3. **Build** — `vite build` (Vite + Nitro + Rolldown)

## Deploy

```bash
pnpm build     # Build with Vite + Nitro
pnpm deploy    # Deploy to Cloudflare Pages (dist/)
```

Build output goes to `dist/` (Nitro v3 generates `_worker.js` + static assets).

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Holiday data sourced from [tanggalans.com](https://www.tanggalans.com/)
