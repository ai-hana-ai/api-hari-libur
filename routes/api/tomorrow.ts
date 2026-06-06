import { defineHandler } from 'nitro'
import { getHolidayDate } from '../../src/libraries/holiday'

export default defineHandler(async () => {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return await getHolidayDate(date)
})