import { defineConfig } from 'vite';

// Built as a sub-application of rymdfabriken.se, published at /paramotor/.
// The site's root build runs first; this build writes into its dist/paramotor/.
export default defineConfig({
  base: '/paramotor/',
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  build: {
    outDir: '../dist/paramotor',
    emptyOutDir: true,
    rollupOptions: { output: { manualChunks: { three: ['three'] } } },
  },
});
