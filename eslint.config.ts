import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';
import { globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config([
  globalIgnores(['dist/**', 'node_modules/**', 'demo/**']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  // Feature-Sliced Design layer boundaries.
  //
  // Layers, high to low: widgets > features > entities > shared. A layer may
  // only depend on itself or the layers below it, so dependencies point one
  // way and never back up (shared can never reach into entities, etc.). Every
  // cross-slice import must go through the slice's public barrel (index.ts) —
  // reaching into an internal file is not allowed.
  //
  // `src/index.ts` is the package's public entry point: it belongs to no layer
  // and re-exports from all of them, so it is exempt from the layer rule.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/index.ts'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'widgets', pattern: 'src/widgets/*' },
        { type: 'features', pattern: 'src/features/*' },
        { type: 'entities', pattern: 'src/entities/*' },
        { type: 'shared', pattern: 'src/shared/*' },
      ],
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.app.json',
        },
      },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          // Each layer may import itself and every layer below it, and only
          // ever through the target slice's index.ts barrel.
          policies: [
            {
              from: { element: { type: 'widgets' } },
              allow: {
                to: {
                  element: {
                    type: ['widgets', 'features', 'entities', 'shared'],
                    fileInternalPath: 'index.ts',
                  },
                },
              },
            },
            {
              from: { element: { type: 'features' } },
              allow: {
                to: {
                  element: {
                    type: ['features', 'entities', 'shared'],
                    fileInternalPath: 'index.ts',
                  },
                },
              },
            },
            {
              from: { element: { type: 'entities' } },
              allow: {
                to: {
                  element: {
                    type: ['entities', 'shared'],
                    fileInternalPath: 'index.ts',
                  },
                },
              },
            },
            {
              from: { element: { type: 'shared' } },
              allow: {
                to: {
                  element: { type: 'shared', fileInternalPath: 'index.ts' },
                },
              },
            },
          ],
        },
      ],
    },
  },
  eslintConfigPrettier,
]);
