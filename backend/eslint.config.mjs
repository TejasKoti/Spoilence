import js from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/build/**', 'Trash/**', 'tests/results/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        crypto: 'readonly',
        performance: 'readonly',
        TextEncoder: 'readonly',
        AbortController: 'readonly',
        URL: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: [
      'backend/browser-extension/**/*.ts',
      'backend/tools/extension-smoke.mjs',
      'backend/tools/benchmark-runner/browser.mjs',
      'backend/setup-guide/**/*.js',
      'website/public/**/*.js',
    ],
    languageOptions: {
      globals: {
        document: 'readonly',
        navigator: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        history: 'readonly',
        window: 'readonly',
        chrome: 'readonly',
        location: 'readonly',
        Element: 'readonly',
        HTMLElement: 'readonly',
        MutationObserver: 'readonly',
        innerHeight: 'readonly',
        PerformanceObserver: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
      },
    },
  },
  {
    files: ['backend/packages/rule-engine/src/rule-import.ts'],
    rules: { 'no-control-regex': 'off' },
  },
);
