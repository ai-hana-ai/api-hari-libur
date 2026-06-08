import { definePlugin } from 'nitro'
import { createStorage } from 'unstorage'
import cfDriver from 'unstorage/drivers/cloudflare-kv-binding'

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    if ((globalThis as any).__holidayStorage) return

    // @ts-ignore
    const env = event.req?.runtime?.cloudflare?.env
    const binding = env?.HOLIDAY_CACHE

    if (binding) {
      try {
        ;(globalThis as any).__holidayStorage = createStorage({
          driver: cfDriver({ binding, base: 'api-hari-libur:' }),
        })
      } catch (e) {
        console.error('[kv-init] Failed:', e)
      }
    }
  })
})
