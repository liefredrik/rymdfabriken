import { defineConfig } from 'vite'

// Built as a sub-application of rymdfabriken.se, published at /megastar/.
// The site's root build runs first; this build writes into its dist/megastar/.
export default defineConfig({
  base: '/megastar/',
  server: { host: '127.0.0.1', port: 5174, strictPort: true },
  build: { outDir: '../dist/megastar', emptyOutDir: true, target: 'es2022' },
})
