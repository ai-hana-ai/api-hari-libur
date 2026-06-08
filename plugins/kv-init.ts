import { definePlugin } from "nitro";
import { useStorage } from "nitro/storage";
import cfDriver from "unstorage/drivers/cloudflare-kv-binding";

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook("request", (event) => {
    if ((globalThis as any).__holidayStorage) return;

    // @ts-ignore
    const env = event.req?.runtime?.cloudflare?.env;
    const binding = env?.HOLIDAY_CACHE;

    if (binding) {
      try {
        const storage = useStorage();
        storage.mount("holidays", cfDriver({ binding, base: "api-hari-libur:" }));
        // Scoped storage — getItem("2011") routes to holidays:2011 → CF KV
        (globalThis as any).__holidayStorage = useStorage("holidays");
      } catch (e) {
        console.error("[kv-init] Failed:", e);
      }
    }
  });
});
