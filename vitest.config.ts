import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    // Mirror tsconfig's "@/*" path alias so vitest loads the same modules the app does.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/tests/**/*.test.ts'],
  },
});
