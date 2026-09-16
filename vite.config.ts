import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { URL, fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// Branches on NODE_ENV (not Vite's `command`) so `vite build --watch` and
// `vite build` both take the library path, and only `vite` (dev server)
// serves the demo app.
const isProduction = process.env.NODE_ENV === 'production';

const pkg = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('./package.json', import.meta.url)),
    'utf8',
  ),
) as { peerDependencies?: Record<string, string> };

const peerDependencies = Object.keys(pkg.peerDependencies ?? {});

// Every peer dependency is external, and so is every subpath of one:
// `react/jsx-runtime` and `monaco-editor/esm/vs/.../ts.worker` are entry
// points a literal package-name list would miss, which is how a multi-MB
// worker ends up inlined. Derived from package.json rather than duplicated
// here, so the two can't drift. See docs/dependency-policy.md.
const isExternal = (id: string) =>
  peerDependencies.some(name => id === name || id.startsWith(`${name}/`));

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
          external: isExternal,
        },
      }
    : undefined,
});
