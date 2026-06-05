import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'

// Mock global fetch so scraper works without hitting real API
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const { default: app } = await import('../src/app')

// Minimal HTML that mimics tanggalan.com structure for 1 month
const MOCK_HTML = `<!DOCTYPE html>
<html><body><div class="entry-content">
<div class="kalender-indo">
  <div class="kal-title">
    <a class="kal-title-link">Januari 2026</a>
  </div>
  <ul class="kal-libur-list">
    <li><span class="kal-libur-day">1</span> Tahun Baru 2026 Masehi</li>
    <li><span class="kal-libur-day">29</span> Tahun Baru Imlek 2577 Kongzili</li>
  </ul>
</div>
<div class="kalender-indo">
  <div class="kal-title">
    <a class="kal-title-link">Februari 2026</a>
  </div>
  <ul class="kal-libur-list">
    <li><span class="kal-libur-day">14</span> Hari Besar February</li>
  </ul>
</div>
</div></body></html>`

describe('API — /api endpoint', () => {
  beforeAll(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(MOCK_HTML),
    })
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('returns 200 with holiday data for year-only query', async () => {
    const res = await app.request('/api?year=2026')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThanOrEqual(2)
    expect(body[0]).toHaveProperty('date')
    expect(body[0]).toHaveProperty('name')
    expect(body[0]).toHaveProperty('is_national_holiday')
  })

  it('filters by month with ?year=2026&month=2', async () => {
    const res = await app.request('/api?year=2026&month=2')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].date).toBe('2026-02-14')
  })

  it('returns 422 for invalid year (below min)', async () => {
    const res = await app.request('/api?year=2000')
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.message).toBe('The given data was invalid.')
  })

  it('returns 422 for month=13', async () => {
    const res = await app.request('/api?year=2026&month=13')
    expect(res.status).toBe(422)
  })

  it('returns 422 for day without month', async () => {
    const res = await app.request('/api?year=2026&day=15')
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.errors?.month).toBeDefined()
  })

  it('returns 422 for invalid date (Feb 30)', async () => {
    const res = await app.request('/api?year=2026&month=2&day=30')
    expect(res.status).toBe(422)
  })

  it('works without any params (defaults to current year)', async () => {
    const res = await app.request('/api')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('returns holiday detail when day is provided', async () => {
    const res = await app.request('/api?year=2026&month=1&day=1')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty('date', '2026-01-01')
    expect(body).toHaveProperty('is_holiday', true)
    expect(body).toHaveProperty('holiday_list')
  })
})

describe('API — /api/today', () => {
  beforeAll(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(MOCK_HTML),
    })
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('returns 200 with today data', async () => {
    const res = await app.request('/api/today')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty('date')
    expect(body).toHaveProperty('is_holiday')
    expect(body).toHaveProperty('holiday_list')
    expect(body).toHaveProperty('is_national_holiday')
  })
})

describe('API — /api/tomorrow', () => {
  beforeAll(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(MOCK_HTML),
    })
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('returns 200 with tomorrow data', async () => {
    const res = await app.request('/api/tomorrow')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty('date')
    expect(body).toHaveProperty('is_holiday')
    expect(body).toHaveProperty('holiday_list')
  })
})

describe('API — CORS headers', () => {
  beforeAll(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(MOCK_HTML),
    })
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('includes Access-Control-Allow-Origin: *', async () => {
    const res = await app.request('/api?year=2026')
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })
})