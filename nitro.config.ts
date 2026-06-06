import { defineConfig } from 'nitro'

export default defineConfig({
  compatibilityDate: '2025-04-01',
  preset: 'cloudflare_pages',
  codeSplitting: false,
  rollupConfig: {
    output: {
      inlineDynamicImports: true,
    },
  },
  scanDirs: ['.'],
  cloudflare: {
    nodeCompat: true,
  },
})