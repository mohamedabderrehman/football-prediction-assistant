import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: { FIXTURE_MODE: '1', NODE_ENV: 'test' },
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/']
    }
  },
});
