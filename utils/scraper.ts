import { parseHTML } from 'linkedom'
import { MONTH_NAME } from './constants'

type Holiday = { date: string; name: string }

const fetcher = async (year: string): Promise<string> => {
  const response = await fetch(`https://tanggalans.com/kalender-${year}`)

  if (!response.ok) {
    throw new Error('Failed to fetch tanggalan')
  }

  return await response.text()
}

export const crawler = async (year: string): Promise<Holiday[]> => {
  const html = await fetcher(year)

  const { document } = parseHTML(html)

  const months = document.querySelectorAll('.entry-content .kalender-indo')

  if (!months || months.length === 0) {
    throw new Error('Failed to parse DOM')
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
