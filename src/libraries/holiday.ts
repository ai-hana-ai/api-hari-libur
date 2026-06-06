import { createStorage, type Storage } from 'unstorage'
import memoryDriver from 'unstorage/drivers/memory'
import { crawler } from './scraper'

type Holiday = { name: string; date: string }

let _storage: Storage | null = null

// Called once from middleware on first request (production only)
// Uses the KV binding object directly — no globalThis.__env__ needed
export async function initKvStorage(binding: any) {
  if (_storage) return // already initialized

  const { default: cfDriver } = await import('unstorage/drivers/cloudflare-kv-binding')
  _storage = createStorage({
    driver: cfDriver({ binding, base: 'api-hari-libur:' }),
  }) as unknown as Storage
}

function getStorage(): Storage {
  if (!_storage) {
    // Dev / tests — memory fallback
    _storage = createStorage({ driver: memoryDriver() })
  }
  return _storage
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
  const storage = getStorage()
  const cached = await storage.getItem<Holiday[]>(year)

  if (cached) return cached

  const data = await getData(year)

  if (data.length === 0) return data

  const currentYear = new Date().getFullYear()
  const ttlSec = Number(year) >= currentYear
    ? 60 * 60 * 24 * 30  // 30 days in seconds (KV-compatible)
    : undefined

  await storage.setItem(year, data, { ttl: ttlSec })

  return data
}

const getData = async (year: string): Promise<Holiday[]> => {
  try {
    return await crawler(year)
  } catch (error) {
    console.error('[getData] Scraper failed:', error)
    return []
  }
}