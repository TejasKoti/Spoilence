import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: '..',
  cacheDir: fileURLToPath(new URL('./build/cache/vite', import.meta.url)),
  test: {
    fsModuleCachePath: fileURLToPath(new URL('./build/cache/vitest', import.meta.url)),
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'tests/conformance/**/*.test.ts',
      'tests/privacy/**/*.test.ts',
    ],
    environment: 'node',
  },
});
