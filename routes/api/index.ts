import { defineHandler } from 'nitro'
import { getQuery, setResponseHeader } from 'nitro/h3'

export default defineHandler(async (event) => {
  const query = getQuery(event)
  const parsed = zValidator(dateSchema, query)

  const year = parsed.year?.toString() || new Date().getFullYear().toString()
  const month = parsed.month?.toString()

  // Historical data never changes — override routeRules cache with longer TTL
  const currentYear = new Date().getFullYear()
  if (Number(year) < currentYear) {
    setResponseHeader(event, 'Cache-Control', 'public, max-age=86400, s-maxage=2592000, immutable')
  }

  if (parsed.day) {
    return await getHolidayDate(new Date(`${year}-${month}-${parsed.day}`))
  }

  return await getHoliday(year, month)
})
