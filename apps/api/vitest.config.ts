import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 120_000,
    pool: 'forks',
    maxConcurrency: 8,
    maxConcurrencyPerFile: 1,
    isolate: false,
    hookTimeout: 60_000,
    forceExit: true,
    fileParallelism: true,
    poolOptions: {
      forks: {
        singleFork: false,
        maxForks: 4,
        minForks: 1,
      },
    },
    teardownTimeout: 5000,
    alias: {
      'pg': path.resolve(__dirname, 'src/__mocks__/pg.ts'),
      '../../agent/tenant.guard': path.resolve(__dirname, 'src/__mocks__/tenant.guard.ts'),
    },
  },
  resolve: {
    alias: {
      '@m5/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      '@m5/domain': path.resolve(__dirname, '../../packages/domain/src'),
      '@m5/sdk': path.resolve(__dirname, '../../packages/sdk/src'),
    },
  },
})
