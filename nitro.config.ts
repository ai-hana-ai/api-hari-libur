import { defineConfig } from 'nitro'

export default defineConfig({
  compatibilityDate: '2025-04-01',
  preset: 'cloudflare_pages',
  scanDirs: ['.'],
  cloudflare: {
    nodeCompat: true,
  },
  alias: {
    '@': '/src',
  },
})