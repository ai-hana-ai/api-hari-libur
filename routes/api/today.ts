import { defineHandler } from 'nitro'
import { getHolidayDate } from '../../utils/holiday'

export default defineHandler(async () => {
  return await getHolidayDate(new Date())
})