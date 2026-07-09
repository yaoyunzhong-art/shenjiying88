import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist'],
    // 根因修复: 去掉 singleFork → 恢复多 fork 并行
    // 之前 singleFork=true 导致 1319 测试串行 → 一卡全卡 → 用户重试 → 累积 27 个 hang 进程
    testTimeout: 120_000,    // NestJS DI 编译耗时, 30s 不够
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,       // 并行执行, 不让一个卡死全挂
      },
    },
    maxConcurrency: 8,           // 限制并行度, 避免 CPU 打架
    maxConcurrencyPerFile: 1,    // 单个文件内串行, 避免状态冲突
    isolate: false,              // 不隔离进程环境, 减少开销
    hookTimeout: 60_000,         // beforeAll/afterAll 超时
    // pg 包未实际安装 (workspace 阻塞), vitest 测试时用 mock 替身
    alias: {
      'pg': path.resolve(__dirname, 'src/__mocks__/pg.ts'),
      // tenant.guard 实际只 export TenantGuard, 但 llm-config 用 @ts-ignore 引入了 TenantScopeGuard
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
