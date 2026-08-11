import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/services/**', 'src/utils/**'],
      thresholds: { lines: 85, functions: 80, branches: 80, statements: 85 },
    },
  },
})
