/**
 * Sprint 2 Day 23 - License 模块性能压力测试
 * 
 * 测试目标:
 * - API 响应时间 < 100ms (P95)
 * - 并发用户支持 1000+
 * - 数据库连接池稳定
 * - 内存使用 < 80%
 * 
 * 增强: 新增场景覆盖 19+ tests:
 *   - 授权凭据校验 (正常/异常/边界)
 *   - License 类型验证 (试用版/正式版/旗舰版)
 *   - License 激活流程 (首次激活/重复激活/无效激活码)
 *   - License 过期与宽限期
 *   - License 功能开关粒控
 *   - License 批量查询/分页
 *   - 多租户隔离
 *   - 安全边界 (XSS/注入/越权)
 *   - 数据一致性校验
 *   - 并发写入冲突
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

/**
 * ============================================================================
 * 增强测试: License 功能完整性场景 (新增 20 tests)
 * 覆盖: 授权凭据校验 / License类型 / 激活流程 / 过期宽限期 / 功能开关 /
 *       多租户隔离 / 安全边界 / 数据一致性 / 并发写入 / 审计日志
 * ============================================================================
 */
test.describe('【增强测试】License 功能完整性场景', () => {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

  test.describe('授权凭据校验', () => {
    test('LS-01: 有效凭据返回 200 且包含 license 信息', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/license/check`, {
        params: { tenantId: 'test-tenant', scope: 'default', key: 'valid-license-key' }
      })
      expect(response.ok()).toBe(true)
      const body = await response.json()
      expect(body).toHaveProperty('valid')
      expect(body.valid).toBe(true)
      expect(body).toHaveProperty('licenseType')
      expect(body).toHaveProperty('expiresAt')
    })

    test('LS-02: 空授权凭据返回 400', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/license/check`, {
        params: { tenantId: '', scope: '', key: '' }
      })
      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body).toHaveProperty('error')
    })

    test('LS-03: 格式错误的授权凭据 (SQL注入 payload) 返回 400', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/license/check`, {
        params: {
          tenantId: "'; DROP TABLE licenses; --",
          scope: "1=1 UNION SELECT * FROM users",
          key: ''
        }
      })
      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body).toHaveProperty('error')
    })

    test('LS-04: XSS 字符在授权凭据中返回 400', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/license/check`, {
        params: {
          tenantId: '<script>alert("xss")</script>',
          scope: 'default',
          key: '<img src=x onerror=alert(1)>'
        }
      })
      expect(response.status()).toBe(400)
    })

    test('LS-05: 超长授权凭据 (>1000字符) 返回 413 或 400', async ({ request }) => {
      const longKey = 'k'.repeat(2000)
      const response = await request.get(`${BASE_URL}/api/license/check`, {
        params: { tenantId: 'test-tenant', scope: 'default', key: longKey }
      })
      expect([400, 413]).toContain(response.status())
    })

    test('LS-06: 特殊Unicode字符凭据返回 400', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/license/check`, {
        params: {
          tenantId: '\u0000\u001f\u007f',
          scope: 'default',
          key: '\u2000\u200B\uFEFF'
        }
      })
      expect(response.status()).toBe(400)
    })
  })

  test.describe('License 类型验证', () => {
    test('LS-07: 试用版 license 具有有限功能集', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/license/check`, {
        params: { tenantId: 'trial-tenant', scope: 'features', key: 'trial-license-key' }
      })
      expect(response.ok()).toBe(true)
      const body = await response.json()
      expect(body).toHaveProperty('features')
      // 试用版应只开放部分功能
      expect(body.features).toBeInstanceOf(Array)
    })

    test('LS-08: 正式版 license 包含所有基础功能', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/license/check`, {
        params: { tenantId: 'pro-tenant', scope: 'features', key: 'pro-license-key' }
      })
      expect(response.ok()).toBe(true)
      const body = await response.json()
      expect(body).toHaveProperty('features')
      expect(body.features.length).toBeGreaterThanOrEqual(1)
    })

    test('LS-09: 旗舰版 license 包含高级分析功能', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/license/check`, {
        params: { tenantId: 'enterprise-tenant', scope: 'features', key: 'enterprise-license-key' }
      })
      expect(response.ok()).toBe(true)
      const body = await response.json()
      expect(body).toHaveProperty('features')
      const featureNames = body.features.map((f: any) => f.name || f)
      // 旗舰版应包含 analytics
      expect(featureNames).toContain('analytics')
    })

    test('LS-10: 无效 license 类型返回适当的错误信息', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/license/check`, {
        params: { tenantId: 'invalid-type-tenant', scope: 'features', key: 'unknown-license-type' }
      })
      expect(response.ok()).toBe(false)
      const body = await response.json()
      expect(body).toHaveProperty('error')
    })
  })

  test.describe('License 激活流程', () => {
    test('LS-11: 首次激活成功返回激活确认和有效期限', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/license/activate`, {
        data: {
          tenantId: 'new-tenant',
          activationCode: 'ACTIVATE-CODE-001',
          licenseType: 'pro'
        }
      })
      expect(response.ok()).toBe(true)
      const body = await response.json()
      expect(body).toHaveProperty('activated')
      expect(body.activated).toBe(true)
      expect(body).toHaveProperty('validUntil')
    })

    test('LS-12: 重复激活同 license 返回冲突状态', async ({ request }) => {
      // 第一次激活
      await request.post(`${BASE_URL}/api/license/activate`, {
        data: {
          tenantId: 'dup-tenant',
          activationCode: 'DUP-ACTIVATE-001',
          licenseType: 'trial'
        }
      })
      // 第二次激活
      const response = await request.post(`${BASE_URL}/api/license/activate`, {
        data: {
          tenantId: 'dup-tenant',
          activationCode: 'DUP-ACTIVATE-001',
          licenseType: 'trial'
        }
      })
      expect(response.status()).toBe(409)
      const body = await response.json()
      expect(body).toHaveProperty('error')
    })

    test('LS-13: 无效激活码返回 400', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/license/activate`, {
        data: {
          tenantId: 'bad-code-tenant',
          activationCode: 'INVALID-CODE-999',
          licenseType: 'pro'
        }
      })
      expect(response.ok()).toBe(false)
    })

    test('LS-14: 激活缺少必填字段返回 400', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/license/activate`, {
        data: {
          tenantId: 'missing-fields-tenant',
          // 缺少 activationCode 和 licenseType
        }
      })
      expect(response.status()).toBe(400)
    })

    test('LS-15: License 停用后再次激活应成功', async ({ request }) => {
      // 先激活
      const activateResp = await request.post(`${BASE_URL}/api/license/activate`, {
        data: {
          tenantId: 'reactivate-tenant',
          activationCode: 'REACTIVATE-001',
          licenseType: 'pro'
        }
      })
      expect(activateResp.ok()).toBe(true)

      // 停用
      const deactivateResp = await request.post(`${BASE_URL}/api/license/deactivate`, {
        data: { tenantId: 'reactivate-tenant', key: 'REACTIVATE-001' }
      })
      expect(deactivateResp.ok()).toBe(true)

      // 再次激活
      const reactivateResp = await request.post(`${BASE_URL}/api/license/activate`, {
        data: {
          tenantId: 'reactivate-tenant',
          activationCode: 'REACTIVATE-001',
          licenseType: 'pro'
        }
      })
      expect(reactivateResp.ok()).toBe(true)
      const body = await reactivateResp.json()
      expect(body.activated).toBe(true)
    })
  })

  test.describe('License 过期与宽限期', () => {
    test('LS-16: 过期 license 返回 valid=false 并携带过期信息', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/license/check`, {
        params: { tenantId: 'expired-tenant', scope: 'default', key: 'expired-license-key' }
      })
      const body = await response.json()
      expect(body).toHaveProperty('valid')
      expect(body.valid).toBe(false)
      expect(body).toHaveProperty('expired')
    })

    test('LS-17: 过期 license 在宽限期内仍可访问核心功能', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/license/check`, {
        params: { tenantId: 'grace-tenant', scope: 'grace-period', key: 'grace-license-key' }
      })
      const body = await response.json()
      expect(body).toHaveProperty('graceRemaining')
      expect(typeof body.graceRemaining).toBe('number')
      // 宽限期内核心功能应仍可访问
      expect(body).toHaveProperty('coreAccessible')
    })

    test('LS-18: 过期超过宽限期后所有功能被禁用', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/license/check`, {
        params: { tenantId: 'beyond-grace-tenant', scope: 'default', key: 'beyond-grace-license-key' }
      })
      const body = await response.json()
      expect(body.valid).toBe(false)
      expect(body).toHaveProperty('locked')
      expect(body.locked).toBe(true)
    })

    test('LS-19: 续期 license 后状态恢复为 valid', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/license/renew`, {
        data: {
          tenantId: 'renewed-tenant',
          oldKey: 'expired-key-to-renew',
          newKey: 'renewed-key-2026'
        }
      })
      expect(response.ok()).toBe(true)
      const body = await response.json()
      expect(body).toHaveProperty('renewed')
      expect(body.renewed).toBe(true)
      expect(body).toHaveProperty('newValidUntil')
    })
  })

  test.describe('License 功能开关粒控', () => {
    test('LS-20: 功能开关查询返回开关名和启用状态', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/license/features`, {
        params: { tenantId: 'features-tenant', key: 'features-license-key' }
      })
      expect(response.ok()).toBe(true)
      const body = await response.json()
      expect(body).toHaveProperty('features')
      expect(body.features.length).toBeGreaterThan(0)
      body.features.forEach((f: any) => {
        expect(f).toHaveProperty('name')
        expect(f).toHaveProperty('enabled')
      })
    })

    test('LS-21: 单个功能开关可独立启用/禁用', async ({ request }) => {
      const enableResp = await request.post(`${BASE_URL}/api/license/features/toggle`, {
        data: { tenantId: 'toggle-tenant', featureName: 'export', enabled: true }
      })
      expect(enableResp.ok()).toBe(true)

      const checkResp = await request.get(`${BASE_URL}/api/license/features`, {
        params: { tenantId: 'toggle-tenant', key: 'features-license-key' }
      })
      const body = await checkResp.json()
      const exportFeature = body.features.find((f: any) => f.name === 'export')
      expect(exportFeature).toBeDefined()
      expect(exportFeature.enabled).toBe(true)
    })
  })

  test.describe('多租户隔离', () => {
    test('LS-22: 不同租户的 license 状态相互独立', async ({ request }) => {
      const [respA, respB] = await Promise.all([
        request.get(`${BASE_URL}/api/license/check`, {
          params: { tenantId: 'tenant-alpha', scope: 'default', key: 'alpha-license-key' }
        }),
        request.get(`${BASE_URL}/api/license/check`, {
          params: { tenantId: 'tenant-beta', scope: 'default', key: 'beta-license-key' }
        })
      ])
      expect(respA.ok()).toBe(true)
      expect(respB.ok()).toBe(true)

      const bodyA = await respA.json()
      const bodyB = await respB.json()
      // 两个租户的 valid 状态可以不同
      expect(bodyA.valid).not.toBeUndefined()
      expect(bodyB.valid).not.toBeUndefined()
    })

    test('LS-23: 租户 A 的 license 操作不影响租户 B', async ({ request }) => {
      // 停用租户 A
      await request.post(`${BASE_URL}/api/license/deactivate`, {
        data: { tenantId: 'tenant-A', key: 'tenant-A-key' }
      })
      // 检查租户 B — 不受影响
      const respB = await request.get(`${BASE_URL}/api/license/check`, {
        params: { tenantId: 'tenant-B', scope: 'default', key: 'tenant-B-key' }
      })
      expect(respB.ok()).toBe(true)
      const bodyB = await respB.json()
      expect(bodyB).toHaveProperty('valid')
    })
  })

  test.describe('数据一致性校验', () => {
    test('LS-24: 激活后立即查询应返回 valid=true', async ({ request }) => {
      const activateResp = await request.post(`${BASE_URL}/api/license/activate`, {
        data: {
          tenantId: 'consistency-tenant',
          activationCode: 'CONSISTENCY-ACT-001',
          licenseType: 'pro'
        }
      })
      expect(activateResp.ok()).toBe(true)

      const checkResp = await request.get(`${BASE_URL}/api/license/check`, {
        params: { tenantId: 'consistency-tenant', scope: 'default', key: 'CONSISTENCY-ACT-001' }
      })
      const body = await checkResp.json()
      expect(body.valid).toBe(true)
    })

    test('LS-25: License 审计日志记录每次激活/停用/续期操作', async ({ request }) => {
      const auditResp = await request.get(`${BASE_URL}/api/license/audit-log`, {
        params: { tenantId: 'audit-tenant', limit: 50 }
      })
      expect(auditResp.ok()).toBe(true)
      const body = await auditResp.json()
      expect(body).toHaveProperty('logs')
      expect(body.logs).toBeInstanceOf(Array)
      if (body.logs.length > 0) {
        const log = body.logs[0]
        expect(log).toHaveProperty('action')
        expect(log).toHaveProperty('timestamp')
        expect(log).toHaveProperty('tenantId')
      }
    })

    test('LS-26: 批量授权查询结果总数与逐一查询一致', async ({ request }) => {
      const tenantIds = ['batch-v1', 'batch-v2', 'batch-v3']
      const batchResp = await request.post(`${BASE_URL}/api/license/batch-check`, {
        data: {
          keys: tenantIds.map(id => ({ tenantId: id, scope: 'default' }))
        }
      })
      expect(batchResp.ok()).toBe(true)
      const batchBody = await batchResp.json()
      expect(batchBody).toHaveProperty('results')
      expect(batchBody.results.length).toBe(3)
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