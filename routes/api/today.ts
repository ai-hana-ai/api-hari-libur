import { defineHandler } from 'nitro'
import { getHolidayDate } from '../../src/libraries/holiday'

export default defineHandler(async () => {
  return await getHolidayDate(new Date())
})