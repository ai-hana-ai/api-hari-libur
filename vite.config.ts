import { defineConfig } from 'vite'
import { nitro } from 'nitro/vite'

export default defineConfig({
  plugins: [
    nitro({
      preset: 'cloudflare_pages',
      serverEntry: './server.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})