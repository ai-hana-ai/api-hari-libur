import { defineHandler } from 'nitro'

export default defineHandler(async () => {
  return await getHolidayDate(new Date())
})