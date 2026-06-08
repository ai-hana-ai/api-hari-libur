import { definePlugin } from 'nitro'
import { initKvStorage } from '../utils/holiday'

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook('request', async (event) => {
    // @ts-ignore
    const env = event.req?.runtime?.cloudflare?.env
    if (env?.HOLIDAY_CACHE) {
      initKvStorage(env.HOLIDAY_CACHE)
    }
  })
})
