import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['app/members/tier-distribution/page.test.tsx'],
  },
  resolve: {
    alias: {
      '@m5/ui': path.resolve(__dirname, '../../packages/ui/src/index.tsx'),
      '@m5/sdk': path.resolve(__dirname, '../../packages/sdk/src/index.ts'),
    },
  },
});
