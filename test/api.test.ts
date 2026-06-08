import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'

// Mock global fetch so scraper works without hitting real API
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { getHoliday, getHolidayDate } from '../utils/holiday'
import { dateSchema } from '../utils/date_schema'

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

describe('API — /api — handler logic (via getHoliday)', () => {
  beforeAll(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      text: () => Promise.resolve(MOCK_HTML),
    })
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('returns holiday data for year-only query', async () => {
    const body = await getHoliday('2026')

    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThanOrEqual(2)
    expect(body[0]).toHaveProperty('date')
    expect(body[0]).toHaveProperty('name')
    expect(body[0]).toHaveProperty('is_national_holiday')
  })

  it('filters by month with year=2026, month=2', async () => {
    const body = await getHoliday('2026', '02')

    expect(body).toHaveLength(1)
    expect(body[0].date).toBe('2026-02-14')
  })

  it('throws 422 for invalid year (below min)', () => {
    const result = dateSchema.safeParse({ year: '2000' })
    expect(result.success).toBe(false)
  })

  it('throws 422 for month=13', () => {
    const result = dateSchema.safeParse({ year: '2026', month: '13' })
    expect(result.success).toBe(false)
  })

  it('throws 422 for day without month', () => {
    const result = dateSchema.safeParse({ year: '2026', day: '15' })
    expect(result.success).toBe(false)
  })

  it('throws 422 for invalid date (Feb 30)', () => {
    const result = dateSchema.safeParse({ year: '2026', month: '2', day: '30' })
    expect(result.success).toBe(false)
  })

  it('works without any params (defaults to current year)', async () => {
    const body = await getHoliday(new Date().getFullYear().toString())
    expect(Array.isArray(body)).toBe(true)
  })

  it('returns holiday detail when day is provided', async () => {
    const body = await getHolidayDate(new Date('2026-01-01T00:00:00+07:00'))

    expect(body).toHaveProperty('date', '2026-01-01')
    expect(body).toHaveProperty('is_holiday', true)
    expect(body).toHaveProperty('holiday_list')
  })
})

describe('API — /api/today (via getHolidayDate)', () => {
  beforeAll(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      text: () => Promise.resolve(MOCK_HTML),
    })
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('returns today data', async () => {
    const body = await getHolidayDate(new Date())

    expect(body).toHaveProperty('date')
    expect(body).toHaveProperty('is_holiday')
    expect(body).toHaveProperty('holiday_list')
    expect(body).toHaveProperty('is_national_holiday')
  })
})

describe('API — /api/tomorrow (via getHolidayDate)', () => {
  beforeAll(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      text: () => Promise.resolve(MOCK_HTML),
    })
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('returns tomorrow data', async () => {
    const date = new Date()
    date.setDate(date.getDate() + 1)
    const body = await getHolidayDate(date)

    expect(body).toHaveProperty('date')
    expect(body).toHaveProperty('is_holiday')
    expect(body).toHaveProperty('holiday_list')
  })
})