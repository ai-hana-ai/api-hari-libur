import { defineConfig } from 'nitro'

export default defineConfig({
  compatibilityDate: '2025-04-01',
  preset: 'cloudflare_pages',
  rollupConfig: {
    output: {
      inlineDynamicImports: true,
    },
  },
  scanDirs: ['routes', 'middleware', 'utils'],
  imports: {
    dirs: ['utils'],
  },
  cloudflare: {
    nodeCompat: true,
  },
})
