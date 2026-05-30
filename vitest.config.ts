import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: process.env.GITHUB_ACTIONS ? ['text', 'lcov', 'github-actions'] : ['text', 'lcov'],
      include: ['src/**/*.ts'],
    },
  },
});
