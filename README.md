# API Hari Libur Indonesia

A free REST API for Indonesian public holidays (Hari Libur Nasional). Holiday data is scraped from [tanggalans.com](https://www.tanggalans.com/) and cached in-memory for fast responses.

## Tech Stack

- **Runtime:** Cloudflare Workers
- **Language:** TypeScript
- **Framework:** [Hono](https://hono.dev/)
- **Validation:** [Zod](https://zod.dev/) with `@hono/zod-validator`
- **HTML Parsing:** [Linkedom](https://github.com/nicolo-ribaudo/linkedom)
- **Testing:** Node.js built-in test runner (`node:test`)

## Project Structure

```
api-hari-libur/
├── functions/api/          # Cloudflare Pages Function (entry point)
│   └── [[catchall]].ts
├── public/                 # Static landing page (served by Pages)
│   ├── index.html
│   ├── script.js
│   └── style.css
├── src/
│   ├── app.ts              # Hono app: routes, CORS, error handling
│   ├── constants/
│   │   └── month.ts        # Indonesian month name → number mapping
│   ├── libraries/
│   │   ├── holiday.ts      # Holiday logic: getHoliday, getHolidayDate
│   │   └── scraper.ts      # Web scraper for tanggalans.com
│   ├── middleware/
│   │   └── zod.ts          # Custom Zod validator wrapper
│   └── schema/
│       └── date_schema.ts  # Zod schema for date query params
├── test/
│   └── schema.test.mjs     # Unit tests for date validation
├── wrangler.toml           # Cloudflare Workers config
├── tsconfig.json
└── package.json
```

## API Endpoints

Base URL: `https://api-hari-libur.com`

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
curl https://api-hari-libur.com/api?year=2025&month=1
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
curl "https://api-hari-libur.com/api?year=2025&month=1&day=1"
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

**Example Request:**

```bash
curl https://api-hari-libur.com/api/today
```

**Example Response:**

```json
{
  "date": "2025-01-01",
  "is_holiday": true,
  "is_national_holiday": true,
  "holiday_list": ["Tahun Baru"]
}
```

### GET /api/tomorrow

Check if tomorrow is a public holiday. Same response shape as `/api/today` but for the next date.

**Query Parameters:** None.

**Example Request:**

```bash
curl https://api-hari-libur.com/api/tomorrow
```

**Example Response:**

```json
{
  "date": "2025-01-02",
  "is_holiday": false,
  "is_national_holiday": false,
  "holiday_list": []
}
```

## Local Development

1. Clone the repository:

   ```bash
   git clone https://github.com/radyakaze/api-hari-libur.git
   cd api-hari-libur
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the local dev server:

   ```bash
   npm run dev
   ```

   The API will be accessible at `http://localhost:8788`.

## Tests

Run the unit tests with Node.js built-in test runner:

```bash
node --experimental-vm-modules --test test/schema.test.mjs
```

## Type Check

```bash
npm run typecheck
```

## Deploy

Deploy to Cloudflare Pages:

```bash
npm run deploy
```

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Holiday data sourced from [tanggalans.com](https://www.tanggalans.com/)
