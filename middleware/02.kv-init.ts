import { defineHandler } from 'nitro'

export default defineHandler(async (event) => {
  // Dynamic import to avoid bundling holiday.ts into index.js
  // This lets route chunks import holiday functions without circular deps
  // @ts-ignore — runtime.cloudflare.env is injected by Nitro's cloudflare preset
  const env = event.req?.runtime?.cloudflare?.env
  if (env?.HOLIDAY_CACHE) {
    const { initKvStorage } = await import('../src/libraries/holiday')
    await initKvStorage(env.HOLIDAY_CACHE)
  }
})
