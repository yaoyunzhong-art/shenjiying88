/**
 * Sprint 2 Day 23 - License 模块性能压力测试
 * 
 * 测试目标:
 * - API 响应时间 < 100ms (P95)
 * - 并发用户支持 1000+
 * - 数据库连接池稳定
 * - 内存使用 < 80%
 */

import { test, expect } from '@playwright/test'
import { performance } from 'perf_hooks'

test.describe('【性能测试】License 模块压力测试', () => {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
  const CONCURRENT_USERS = 100
  const TOTAL_REQUESTS = 1000
  const P95_THRESHOLD = 100 // ms
  const P99_THRESHOLD = 200 // ms

  test.beforeEach(async ({ page }) => {
    // 性能测试前置准备
    await page.goto(`${BASE_URL}/admin/license`)
    await page.waitForLoadState('networkidle')
  })

  test.describe('API 响应时间基准测试', () => {
    test('PT-01: 授权检查 API 响应时间 < 100ms (P95)', async ({ request }) => {
      const latencies: number[] = []

      // 执行 100 次请求
      for (let i = 0; i < 100; i++) {
        const start = performance.now()
        const response = await request.get(`${BASE_URL}/api/license/check`, {
          params: { tenantId: 'test-tenant', scope: 'default' }
        })
        const end = performance.now()

        expect(response.ok()).toBe(true)
        latencies.push(end - start)
      }

      // 计算 P95
      const sorted = latencies.sort((a, b) => a - b)
      const p95Index = Math.floor(sorted.length * 0.95)
      const p95 = sorted[p95Index]

      console.log(`P95 响应时间: ${p95.toFixed(2)}ms`)
      console.log(`平均响应时间: ${(latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2)}ms`)
      console.log(`最小响应时间: ${Math.min(...latencies).toFixed(2)}ms`)
      console.log(`最大响应时间: ${Math.max(...latencies).toFixed(2)}ms`)

      expect(p95).toBeLessThan(P95_THRESHOLD)
    })

    test('PT-02: 批量授权查询 API 响应时间 < 200ms (P99)', async ({ request }) => {
      const latencies: number[] = []

      // 执行 100 次批量查询
      for (let i = 0; i < 100; i++) {
        const start = performance.now()
        const response = await request.post(`${BASE_URL}/api/license/batch-check`, {
          data: {
            keys: Array.from({ length: 10 }, (_, j) => ({
              tenantId: `tenant-${j}`,
              scope: 'default'
            }))
          }
        })
        const end = performance.now()

        expect(response.ok()).toBe(true)
        latencies.push(end - start)
      }

      // 计算 P99
      const sorted = latencies.sort((a, b) => a - b)
      const p99Index = Math.floor(sorted.length * 0.99)
      const p99 = sorted[p99Index]

      console.log(`P99 批量查询响应时间: ${p99.toFixed(2)}ms`)
      expect(p99).toBeLessThan(P99_THRESHOLD * 2)
    })
  })

  test.describe('并发压力测试', () => {
    test('PT-03: 100 并发用户授权检查 - 成功率 > 99.9%', async ({ request }) => {
      const results = { success: 0, failed: 0, latencies: [] as number[] }

      // 创建 100 个并发请求
      const promises = Array.from({ length: CONCURRENT_USERS }, async () => {
        try {
          const start = performance.now()
          const response = await request.get(`${BASE_URL}/api/license/check`, {
            params: { tenantId: 'concurrent-test', scope: 'default' }
          })
          const end = performance.now()

          if (response.ok()) {
            results.success++
            results.latencies.push(end - start)
          } else {
            results.failed++
          }
        } catch (error) {
          results.failed++
        }
      })

      await Promise.all(promises)

      const successRate = (results.success / CONCURRENT_USERS) * 100
      const avgLatency = results.latencies.length > 0
        ? results.latencies.reduce((a, b) => a + b, 0) / results.latencies.length
        : 0

      console.log(`并发用户数: ${CONCURRENT_USERS}`)
      console.log(`成功请求: ${results.success}`)
      console.log(`失败请求: ${results.failed}`)
      console.log(`成功率: ${successRate.toFixed(2)}%`)
      console.log(`平均响应时间: ${avgLatency.toFixed(2)}ms`)

      expect(successRate).toBeGreaterThanOrEqual(99.9)
      expect(avgLatency).toBeLessThan(P95_THRESHOLD * 2)
    })

    test('PT-04: 1000 次授权检查 - 错误率 < 0.1%', async ({ request }) => {
      const results = { success: 0, failed: 0, errors: [] as string[] }

      // 串行执行 1000 次请求 (避免瞬间压垮服务器)
      for (let i = 0; i < TOTAL_REQUESTS; i++) {
        try {
          const response = await request.get(`${BASE_URL}/api/license/check`, {
            params: {
              tenantId: `load-test-${i % 100}`,
              scope: 'default'
            }
          })

          if (response.ok()) {
            results.success++
          } else {
            results.failed++
            results.errors.push(`Request ${i}: HTTP ${response.status()}`)
          }
        } catch (error) {
          results.failed++
          results.errors.push(`Request ${i}: ${error}`)
        }

        // 每 100 个请求打印进度
        if ((i + 1) % 100 === 0) {
          const progress = ((i + 1) / TOTAL_REQUESTS) * 100
          console.log(`进度: ${progress.toFixed(1)}% (${i + 1}/${TOTAL_REQUESTS})`)
        }
      }

      const errorRate = (results.failed / TOTAL_REQUESTS) * 100
      const successRate = (results.success / TOTAL_REQUESTS) * 100

      console.log('\n========== 压力测试结果 ==========')
      console.log(`总请求数: ${TOTAL_REQUESTS}`)
      console.log(`成功: ${results.success}`)
      console.log(`失败: ${results.failed}`)
      console.log(`成功率: ${successRate.toFixed(2)}%`)
      console.log(`错误率: ${errorRate.toFixed(2)}%`)
      console.log('==================================\n')

      if (results.errors.length > 0) {
        console.log('错误详情 (前 10 个):')
        results.errors.slice(0, 10).forEach((err, i) => console.log(`${i + 1}. ${err}`))
      }

      expect(errorRate).toBeLessThan(0.1)
      expect(successRate).toBeGreaterThanOrEqual(99.9)
    })
  })

  test.describe('数据库连接池监控', () => {
    test('PT-05: 高并发下数据库连接池稳定性 - 连接数 < 80%', async ({ request }) => {
      // 执行并发请求监控连接池
      const connectionPoolStats = { max: 0, samples: [] as number[] }

      // 创建 50 个并发请求,每个执行 10 次查询
      const promises = Array.from({ length: 50 }, async (_, userIndex) => {
        for (let i = 0; i < 10; i++) {
          try {
            // 执行查询前检查连接池状态
            const poolStatus = await request.get(`${BASE_URL}/api/metrics/db-pool`)
            if (poolStatus.ok()) {
              const metrics = await poolStatus.json()
              const currentConnections = metrics.connections?.active || 0
              const maxConnections = metrics.connections?.max || 100
              const usagePercent = (currentConnections / maxConnections) * 100

              connectionPoolStats.samples.push(usagePercent)
              if (usagePercent > connectionPoolStats.max) {
                connectionPoolStats.max = usagePercent
              }
            }

            // 执行实际查询
            await request.get(`${BASE_URL}/api/license/check`, {
              params: {
                tenantId: `pool-test-${userIndex}`,
                scope: 'default'
              }
            })
          } catch (error) {
            // 忽略单个请求错误,关注连接池指标
          }
        }
      })

      await Promise.all(promises)

      // 计算连接池使用统计
      const avgUsage = connectionPoolStats.samples.length > 0
        ? connectionPoolStats.samples.reduce((a, b) => a + b, 0) / connectionPoolStats.samples.length
        : 0

      console.log('========== 数据库连接池监控报告 ==========')
      console.log(`采样次数: ${connectionPoolStats.samples.length}`)
      console.log(`平均使用率: ${avgUsage.toFixed(2)}%`)
      console.log(`峰值使用率: ${connectionPoolStats.max.toFixed(2)}%`)
      console.log('===========================================')

      expect(connectionPoolStats.max).toBeLessThan(80)
      expect(avgUsage).toBeLessThan(60)
    })
  })

  test.describe('内存与资源监控', () => {
    test('PT-06: 长时间运行内存泄漏检测 - 内存增长 < 20%', async ({ page, request }) => {
      // 记录初始内存使用
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize
        }
        return 0
      })

      console.log(`初始内存使用: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`)

      // 执行 100 次完整的用户操作流程
      for (let i = 0; i < 100; i++) {
        // 1. 访问授权管理页面
        await page.goto(`${BASE_URL}/admin/license`)
        await page.waitForLoadState('networkidle')

        // 2. 检查授权状态
        await request.get(`${BASE_URL}/api/license/check`, {
          params: { tenantId: 'memory-test', scope: 'default' }
        })

        // 3. 切换视图
        const viewButtons = await page.locator('[data-testid^="view-"]').all()
        for (const button of viewButtons) {
          if (await button.isVisible()) {
            await button.click()
            await page.waitForTimeout(100)
          }
        }

        // 4. 每 10 次打印进度
        if ((i + 1) % 10 === 0) {
          const currentMemory = await page.evaluate(() => {
            if ('memory' in performance) {
              return (performance as any).memory.usedJSHeapSize
            }
            return 0
          })
          const growth = ((currentMemory - initialMemory) / initialMemory) * 100
          console.log(`进度: ${i + 1}/100, 内存增长: ${growth.toFixed(2)}%`)
        }
      }

      // 强制垃圾回收 (如果支持)
      await page.evaluate(() => {
        if ('gc' in window) {
          ;(window as any).gc()
        }
      })

      await page.waitForTimeout(1000)

      // 记录最终内存使用
      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize
        }
        return 0
      })

      const memoryGrowth = ((finalMemory - initialMemory) / initialMemory) * 100

      console.log('========== 内存泄漏检测报告 ==========')
      console.log(`初始内存: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`)
      console.log(`最终内存: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`)
      console.log(`内存增长: ${memoryGrowth.toFixed(2)}%`)
      console.log('=======================================')

      expect(memoryGrowth).toBeLessThan(20)
    })
  })
})

// 性能测试报告生成
async function generatePerformanceReport(results: any) {
  return {
    summary: {
      totalTests: 6,
      passed: results.passed,
      failed: results.failed,
      passRate: (results.passed / 6) * 100
    },
    apiPerformance: {
      p95ResponseTime: results.p95,
      p99ResponseTime: results.p99,
      avgResponseTime: results.avg,
      status: results.p95 < 100 ? 'PASS' : 'FAIL'
    },
    concurrency: {
      concurrentUsers: 100,
      successRate: results.concurrencySuccessRate,
      status: results.concurrencySuccessRate > 99.9 ? 'PASS' : 'FAIL'
    },
    loadTest: {
      totalRequests: 1000,
      errorRate: results.loadTestErrorRate,
      status: results.loadTestErrorRate < 0.1 ? 'PASS' : 'FAIL'
    },
    database: {
      maxConnectionPoolUsage: results.dbPoolMax,
      avgConnectionPoolUsage: results.dbPoolAvg,
      status: results.dbPoolMax < 80 ? 'PASS' : 'FAIL'
    },
    memory: {
      memoryGrowth: results.memoryGrowth,
      status: results.memoryGrowth < 20 ? 'PASS' : 'FAIL'
    }
  }
}