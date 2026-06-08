# API Hari Libur Indonesia

[![CI](https://github.com/ai-hana-ai/api-hari-libur/actions/workflows/ci.yml/badge.svg)](https://github.com/ai-hana-ai/api-hari-libur/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-48%20passing-brightgreen)](https://github.com/ai-hana-ai/api-hari-libur)
[![Runtime](https://img.shields.io/badge/runtime-Cloudflare%20Workers-orange)](https://workers.cloudflare.com/)

Free REST API for Indonesian public holidays (Hari Libur Nasional). Data is scraped from [tanggalans.com](https://www.tanggalans.com/) and cached via [unstorage](https://unstorage.unjs.io/) — memory in dev/test, Cloudflare KV in production.

**Production:** https://api-hari-libur.pages.dev

## Quick Start

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # 48 tests
pnpm build        # → dist/
pnpm deploy       # → Cloudflare Pages
```

## Tech Stack

- **Runtime** — Cloudflare Workers (Pages)
- **Server** — Nitro v3 + h3
- **Build** — Vite 8 + Rolldown
- **Cache** — unstorage (memory / Cloudflare KV)
- **Scraping** — linkedom
- **Validation** — Zod
- **Tests** — Vitest

## API

Base: `https://api-hari-libur.pages.dev`

**`GET /api`** — Query: `year` (2011–current+1), `month` (1–12), `day` (1–31)
```bash
curl "https://api-hari-libur.pages.dev/api?year=2026&month=1"
```

**`GET /api/today`** — Hari ini (Asia/Jakarta)
```bash
curl https://api-hari-libur.pages.dev/api/today
```

**`GET /api/tomorrow`** — Besok
```bash
curl https://api-hari-libur.pages.dev/api/tomorrow
```

### Response

```json
// /api — array
[{ "date": "2026-01-01", "name": "Tahun Baru 2026 Masehi", "is_national_holiday": true }]

// /api?year=2026&month=1&day=1 — object
{ "date": "2026-01-01", "is_holiday": true, "is_national_holiday": true, "holiday_list": ["Tahun Baru 2026 Masehi"] }
```

## Deployment

Push ke `main` auto-deploy ke Cloudflare Pages. Manual:

```bash
pnpm build && pnpm deploy
```

## License

MIT

## Acknowledgments

- Data: [tanggalans.com](https://www.tanggalans.com/)
- Stack: [Nitro](https://nitro.build/), [Vite+](https://viteplus.dev/), [unstorage](https://unstorage.unjs.io/)
