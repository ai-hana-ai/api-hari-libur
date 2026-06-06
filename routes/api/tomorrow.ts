import { defineHandler } from 'nitro'

export default defineHandler(async () => {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return await getHolidayDate(date)
})