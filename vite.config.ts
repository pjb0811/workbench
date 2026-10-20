import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { URL, fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

import { demoMockApi } from './scripts/demo-mock-api.ts';

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
// `react/jsx-runtime` and `@jbpark/ui-kit/CodeEditor` are entry points a
// literal package-name list would miss, which is how a peer ends up inlined.
// Derived from package.json rather than duplicated here, so the two can't
// drift. See docs/dependency-policy.md.
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
      : [demoMockApi()]),
  ],
  build: isProduction
    ? {
        lib: {
          // `code-editor` is its own entry so that importing the main entry
          // never resolves the optional editor peers.
          entry: {
            index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
            'code-editor': fileURLToPath(
              new URL('./src/code-editor.ts', import.meta.url),
            ),
          },
          formats: ['es', 'cjs'],
          fileName: (format, entryName) =>
            `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
        },
        rollupOptions: {
          external: isExternal,
        },
      }
    : undefined,
});
