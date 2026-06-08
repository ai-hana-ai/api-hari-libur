import { defineHandler } from 'nitro'
import { initKvStorage } from '../utils/holiday'

export default defineHandler(async (event) => {
  // @ts-ignore — runtime.cloudflare.env is injected by Nitro's cloudflare preset
  const env = event.req?.runtime?.cloudflare?.env
  if (env?.HOLIDAY_CACHE) {
    await initKvStorage(env.HOLIDAY_CACHE)
  }
})
