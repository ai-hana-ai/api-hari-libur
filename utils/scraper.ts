import { parseHTML } from 'linkedom'
import { MONTH_NAME } from './constants'

type Holiday = { date: string; name: string }

const MAX_RESPONSE_SIZE = 512 * 1024 // 512KB — tanggalans.com pages are ~50-100KB
const FETCH_TIMEOUT = 10_000 // 10 seconds

const fetcher = async (year: string): Promise<string> => {
  const url = `https://tanggalans.com/kalender-${year}`

  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch tanggalan: ${response.status}`)
  }

  // Guard against oversized responses
  const contentLength = response.headers.get('content-length')
  if (contentLength && Number(contentLength) > MAX_RESPONSE_SIZE) {
    throw new Error(`Response too large: ${contentLength} bytes`)
  }

  const text = await response.text()
  if (text.length > MAX_RESPONSE_SIZE) {
    throw new Error(`Response body too large: ${text.length} bytes`)
  }

  return text
}

export const crawler = async (year: string): Promise<Holiday[]> => {
  // Validate year to prevent URL manipulation
  if (!/^\d{4}$/.test(year)) {
    throw new Error(`Invalid year: ${year}`)
  }

  const html = await fetcher(year)

  const { document } = parseHTML(html)

  const months = document.querySelectorAll('.entry-content .kalender-indo')

  if (!months || months.length === 0) {
    throw new Error('Failed to parse DOM — tanggalans.com structure may have changed')
  }

  return Array.from(months).flatMap((item: any) => {
    const titleEl = item.querySelector('.kal-title .kal-title-link')
    const titleParts = titleEl?.textContent?.split(' ') || []
    const monthName = titleParts[0]
    const calYear = titleParts[1]

    const month = MONTH_NAME[monthName?.toLocaleLowerCase() as keyof typeof MONTH_NAME]

    return Array.from(
      item.querySelectorAll('.kal-libur-list li'),
    )
      .flatMap((holiday: any) => {
        const dayEl = holiday.querySelector('.kal-libur-day')
        const day = dayEl?.textContent?.trim()
        const name = dayEl?.nextSibling?.textContent?.trim()

        if (!day || !name) return

        if (day.includes('-')) {
          const split = day.split('-', 2)
          const start = Number(split[0])
          const end = Number(split[1])

          return Array.from({ length: end - start + 1 })
            .fill(start)
            .flatMap((value, index) => {
              return {
                date: `${calYear}-${month}-${(Number(value) + index).toString().padStart(2, '0')}`,
                name,
              }
            })
        }

        return {
          date: `${calYear}-${month}-${day.padStart(2, '0')}`,
          name,
        }
      })
      .filter((holiday): holiday is Holiday => !!holiday)
  })
}
