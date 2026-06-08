import { defineConfig } from 'nitro'

export default defineConfig({
  compatibilityDate: '2025-04-01',
  preset: 'cloudflare_pages',
  plugins: ['./plugins/kv-init.ts'],
  scanDirs: ['routes'],
  imports: {
    dirs: ['utils'],
    exclude: [/useStorage/],
  },
  routeRules: {
    '/api/**': {
      cors: true,
      headers: {
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Accept, Content-Type',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
      },
    },
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
