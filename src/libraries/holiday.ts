import { crawler } from '../libraries/scraper'

type Holiday = { name: string; date: string }

// In-memory cache replacing Deno.Kv
interface CacheEntry {
  data: Holiday[]
  expiresAt: number | null
}

const cache = new Map<string, CacheEntry>()

const getCached = (key: string): Holiday[] | null => {
  const entry = cache.get(key)
  if (!entry) return null
  if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.data
}

const setCached = (key: string, data: Holiday[], ttlMs?: number): void => {
  cache.set(key, {
    data,
    expiresAt: ttlMs ? Date.now() + ttlMs : null,
  })
}

export const getHoliday = async (
  year: string,
  month?: string
): Promise<(Holiday & { is_national_holiday: boolean })[]> => {
  const holidays = await getHolidayYearly(year)

  const result = holidays.map((h) => ({
    ...h,
    is_national_holiday: !h.name.toLowerCase().includes('cuti bersama'),
  }))

  if (!month) return result

  const monthPadded = month.padStart(2, '0')
  const prefix = `${year}-${monthPadded}`

  return result.filter((item) => item.date.startsWith(prefix))
}

export const getHolidayDate = async (
  date: Date
) => {
  const current = new Date(
    date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
  )

  const year = current.getFullYear().toString()
  const month = (current.getMonth() + 1).toString().padStart(2, '0')
  const day = current.getDate().toString().padStart(2, '0')
  const formattedDate = `${year}-${month}-${day}`

  const holidays = await getHolidayYearly(year)
  const dayHolidays = holidays.filter(item => item.date === formattedDate)
  const holidayList = dayHolidays.map(item => item.name)

  return {
    date: formattedDate,
    is_holiday: holidayList.length > 0,
    is_national_holiday: dayHolidays.some(
      (holiday) => !holiday.name.toLowerCase().includes('cuti bersama')
    ),
    holiday_list: holidayList,
  }
}

export const getHolidayYearly = async (
  year: string
): Promise<Holiday[]> => {
  const cached = getCached(year)

  if (cached) return cached

  const data = await getData(year)

  if (data.length === 0) return data

  const currentYear = new Date().getFullYear()
  const ttlMs = Number(year) >= currentYear
    ? 1000 * 60 * 60 * 24 * 30
    : undefined

  setCached(year, data, ttlMs)

  return data
}

const getData = (year: string): Promise<Holiday[]> => {
  try {
    return crawler(year)
  } catch {
    return Promise.resolve([])
  }
}
