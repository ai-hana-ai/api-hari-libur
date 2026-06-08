import { defineConfig } from 'nitro'

export default defineConfig({
  compatibilityDate: '2025-04-01',
  preset: 'cloudflare_pages',
  plugins: ['./plugins/kv-init.ts'],
  scanDirs: ['routes', 'middleware', 'utils'],
  imports: {
    dirs: ['utils'],
  },
  rollupConfig: {
    output: {
      inlineDynamicImports: true,
    },
  },
  cloudflare: {
    nodeCompat: true,
  },
})
