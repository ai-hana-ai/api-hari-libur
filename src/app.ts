import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { getHoliday, getHolidayDate } from './libraries/holiday'
import { dateSchema } from './schema/date_schema'
import { zValidator } from './middleware/zod'

type Bindings = {
  [key: string]: unknown
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET'],
}))

app.get(
  '/api',
  zValidator('query', dateSchema),
  async (c) => {
    const year = c.req.query('year') || new Date().getFullYear().toString()
    const month = c.req.query('month')
    const day = c.req.query('day')

    if (day) {
      return c.json(
        await getHolidayDate(new Date(`${year}-${month}-${day}`))
      )
    }

    return c.json(
      await getHoliday(year, month)
    )
  },
)

app.get(
  '/api/today',
  async (c) => {
    return c.json(
      await getHolidayDate(new Date())
    )
  },
)

app.get(
  '/api/tomorrow',
  async (c) => {
    const date = new Date()
    date.setDate(date.getDate() + 1)

    return c.json(
      await getHolidayDate(date)
    )
  },
)

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({
      message: err.message.toString(),
      errors: err.cause,
    }, err.status)
  }

  return c.json({
    message: err.message.toString(),
  }, 500)
})

export default app
