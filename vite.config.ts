import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// Branches on NODE_ENV (not Vite's `command`) so `vite build --watch` and
// `vite build` both take the library path, and only `vite` (dev server)
// serves the demo app.
const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  root: isProduction ? undefined : 'demo',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    ...(isProduction
      ? [dts({ tsconfigPath: './tsconfig.app.json', bundleTypes: true })]
      : []),
  ],
  build: isProduction
    ? {
        lib: {
          entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
          formats: ['es', 'cjs'],
          fileName: format => (format === 'es' ? 'index.js' : 'index.cjs'),
        },
        rollupOptions: {
          external: ['react', 'react-dom', 'react/jsx-runtime'],
        },
      }
    : undefined,
});
