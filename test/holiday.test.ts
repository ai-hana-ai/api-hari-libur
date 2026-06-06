import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the crawler before module import
const mockCrawler = vi.fn()
vi.mock('../utils/scraper', () => ({
  crawler: mockCrawler,
}))

// Dynamically import so mock is in effect
const { getHoliday, getHolidayDate, getHolidayYearly } = await import('../utils/holiday')

/**
 * NOTE: holiday.ts has an in-memory Map cache at module level.
 * Each test must use a unique year to avoid cache pollution across tests.
 */

describe('getHolidayYearly', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array when crawler returns empty', async () => {
    mockCrawler.mockResolvedValue([])
    const result = await getHolidayYearly('2026')
    expect(result).toEqual([])
    expect(mockCrawler).toHaveBeenCalledWith('2026')
  })

  it('returns data from crawler', async () => {
    const mockData = [
      { date: '2026-01-01', name: 'Tahun Baru 2026 Masehi' },
      { date: '2026-01-29', name: 'Tahun Baru Imlek 2577 Kongzili' },
      { date: '2026-03-29', name: 'Hari Paskah' },
    ]
    mockCrawler.mockResolvedValue(mockData)
    const result = await getHolidayYearly('2027')
    expect(result).toEqual(mockData)
    expect(mockCrawler).toHaveBeenCalledTimes(1)
  })

  it('caches result on second call (no extra crawler call)', async () => {
    const mockData = [{ date: '2028-05-01', name: 'Hari Buruh Internasional' }]
    mockCrawler.mockResolvedValue(mockData)

    await getHolidayYearly('2028')
    await getHolidayYearly('2028')

    // Called once for first call, second uses cache
    expect(mockCrawler).toHaveBeenCalledTimes(1)
  })
})

describe('getHoliday', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds is_national_holiday flag', async () => {
    mockCrawler.mockResolvedValue([
      { date: '2029-01-01', name: 'Tahun Baru 2029 Masehi' },
      { date: '2029-01-02', name: 'Cuti Bersama Tahun Baru' },
    ])

    const result = await getHoliday('2029')

    expect(result).toHaveLength(2)
    expect(result[0].is_national_holiday).toBe(true)   // Tahun Baru
    expect(result[1].is_national_holiday).toBe(false)  // Cuti Bersama
  })

  it('filters by month when month param provided', async () => {
    mockCrawler.mockResolvedValue([
      { date: '2030-01-01', name: 'Tahun Baru' },
      { date: '2030-02-14', name: 'Valentine' },
      { date: '2030-02-28', name: 'Hari Besar Februari' },
    ])

    const result = await getHoliday('2030', '02')

    expect(result).toHaveLength(2)
    expect(result[0].date).toBe('2030-02-14')
    expect(result[1].date).toBe('2030-02-28')
  })

  it('returns all months when no month param', async () => {
    mockCrawler.mockResolvedValue([
      { date: '2031-01-01', name: 'Hari A' },
      { date: '2031-06-01', name: 'Hari B' },
      { date: '2031-12-25', name: 'Hari C' },
    ])

    const result = await getHoliday('2031')

    expect(result).toHaveLength(3)
  })
})

describe('getHolidayDate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns is_holiday=true when date has holidays', async () => {
    mockCrawler.mockResolvedValue([
      { date: '2032-01-01', name: 'Tahun Baru 2032 Masehi' },
    ])

    const date = new Date('2032-01-01T00:00:00+07:00')
    const result = await getHolidayDate(date)

    expect(result.date).toBe('2032-01-01')
    expect(result.is_holiday).toBe(true)
    expect(result.holiday_list).toEqual(['Tahun Baru 2032 Masehi'])
    expect(result.is_national_holiday).toBe(true)
  })

  it('returns is_holiday=false when no holidays', async () => {
    mockCrawler.mockResolvedValue([])

    const date = new Date('2033-06-15T00:00:00+07:00')
    const result = await getHolidayDate(date)

    expect(result.date).toBe('2033-06-15')
    expect(result.is_holiday).toBe(false)
    expect(result.holiday_list).toEqual([])
    expect(result.is_national_holiday).toBe(false)
  })

  it('distinguishes cuti bersama from national holiday', async () => {
    mockCrawler.mockResolvedValue([
      { date: '2034-01-02', name: 'Cuti Bersama Tahun Baru' },
    ])

    const date = new Date('2034-01-02T00:00:00+07:00')
    const result = await getHolidayDate(date)

    expect(result.is_holiday).toBe(true)
    expect(result.is_national_holiday).toBe(false)
  })
})