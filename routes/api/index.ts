import { defineHandler } from 'nitro'
import { getQuery, createError } from 'nitro/h3'

export default defineHandler(async (event) => {
  const query = getQuery(event)
  const parsed = zValidator(dateSchema, query)

  const year = parsed.year?.toString() || new Date().getFullYear().toString()
  const month = parsed.month?.toString()

  if (parsed.day) {
    return await getHolidayDate(new Date(`${year}-${month}-${parsed.day}`))
  }

  return await getHoliday(year, month)
})