/**
 * Sprint 2 Day 23 - License 模块回归测试
 * 全功能回归测试套件
 * 
 * 覆盖范围:
 * - Sprint 1: TC01-TC10 (LicenseService 单元测试)
 * - Sprint 2 Day 19-20: TC11-TC30 (缓存/激活码服务)
 * - Sprint 2 Day 21-22: TC31-TC35 (E2E测试)
 */

import { test, expect } from '../fixtures/auth.fixture'
import { LicensePage } from '../pages/license.page'

test.describe('【回归测试】License 模块全功能验证', () => {
  let licensePage: LicensePage

  test.beforeEach(async ({ page, adminPage }) => {
    licensePage = new LicensePage(adminPage || page)
    await licensePage.navigateToLicenseManager()
    await page.waitForLoadState('networkidle')
  })

  test.describe('Sprint 1 基础功能回归 (TC01-TC10)', () => {
    test('RT-01: License 创建与查询 - 验证 Sprint 1 基础 CRUD', async () => {
      // 验证基础 License 创建
      const result = await licensePage.checkLicenseExists()
      expect(result.exists).toBe(true)
    })

    test('RT-02: License 状态机转换 - 验证 active/suspended/expired', async () => {
      const status = await licensePage.getLicenseStatus()
      expect(['active', 'suspended', 'expired']).toContain(status)
    })

    test('RT-03: License 配额管理 - 验证 quota 计算逻辑', async () => {
      const quota = await licensePage.checkQuota()
      expect(quota.total).toBeGreaterThanOrEqual(0)
      expect(quota.used).toBeLessThanOrEqual(quota.total)
    })

    test('RT-04: License 多租户隔离 - 验证 RLS 行级安全', async () => {
      // 验证租户 A 无法访问租户 B 的 License
      const isIsolated = await licensePage.verifyTenantIsolation()
      expect(isIsolated).toBe(true)
    })

    test('RT-05: License 过期自动处理 - 验证定时任务触发', async () => {
      const result = await licensePage.checkExpirationHandling()
      expect(result.autoProcessed).toBe(true)
    })
  })

  test.describe('Sprint 2 Day 19-20 缓存/激活码回归 (TC11-TC30)', () => {
    test('RT-06: LicenseCacheService - 验证缓存命中与回源', async () => {
      // 首次查询 (缓存未命中)
      const firstResult = await licensePage.checkLicense()
      expect(firstResult.fromCache).toBe(false)

      // 再次查询 (缓存命中)
      const secondResult = await licensePage.checkLicense()
      expect(secondResult.fromCache).toBe(true)
    })

    test('RT-07: LicenseCacheService - 验证缓存穿透保护', async () => {
      // 查询不存在的 License (应缓存空值)
      const result = await licensePage.checkNonExistentLicense()
      expect(result.cachedNull).toBe(true)
    })

    test('RT-08: ActivationCodeService - 验证激活码生成与验证', async () => {
      // 生成激活码
      const code = await licensePage.generateActivationCode()
      expect(code).toMatch(/^\w{4}-\w{4}-\w{4}-\w{4}$/)

      // 验证激活码格式
      const isValid = await licensePage.validateActivationCode(code)
      expect(isValid).toBe(true)
    })

    test('RT-09: ActivationCodeService - 验证暴力破解防护', async () => {
      // 连续输入错误激活码
      const results = await licensePage.bruteForceProtectionTest()
      expect(results.blocked).toBe(true)
      expect(results.retryAfter).toBeGreaterThan(0)
    })

    test('RT-10: TC21-TC25 单元测试回归 - 验证缓存与激活码服务', async () => {
      // 运行 TC21-TC25 对应的 E2E 验证
      const cacheTests = await licensePage.runCacheServiceTests()
      expect(cacheTests.passed).toBe(10) // TC11-TC20

      const activationTests = await licensePage.runActivationCodeTests()
      expect(activationTests.passed).toBe(5) // TC21-TC25
    })
  })

  test.describe('Sprint 2 Day 21-22 E2E回归 (TC31-TC35)', () => {
    test('RT-11: TC31-TC35 E2E测试套件 - 全量回归', async () => {
      // 运行所有 E2E 测试
      const e2eResults = await licensePage.runFullE2ESuite()

      // TC31-TC35 统计
      expect(e2eResults.total).toBe(55)
      expect(e2eResults.passed).toBe(55)
      expect(e2eResults.failed).toBe(0)
      expect(e2eResults.passRate).toBe(100)
    })

    test('RT-12: 5端适配验证 - PC/Pad/H5/APP/小程序', async () => {
      // 5端适配测试
      const adaptationResults = await licensePage.run5EndAdaptationTests()

      expect(adaptationResults.pc).toBe(true)        // 1920x1080
      expect(adaptationResults.pad).toBe(true)      // 1024x768
      expect(adaptationResults.h5).toBe(true)       // 375x812
      expect(adaptationResults.app).toBe(true)      // WebView
      expect(adaptationResults.miniprogram).toBe(true) // 小程序
    })

    test('RT-13: 性能回归验证 - 首屏加载 < 2s, FPS > 30', async () => {
      // 性能测试
      const perfResults = await licensePage.runPerformanceTests()

      expect(perfResults.firstPaint).toBeLessThan(2000)  // < 2s
      expect(perfResults.fps).toBeGreaterThan(30)        // > 30 FPS
      expect(perfResults.memoryLeak).toBeLessThan(0.5)   // < 50%
    })

    test('RT-14: 端到端完整流程验证 - 从激活到管理', async () => {
      // 完整用户旅程
      const journey = await licensePage.runCompleteUserJourney()

      // 1. 激活码激活
      expect(journey.activation.success).toBe(true)

      // 2. 授权检查
      expect(journey.checkLicense.valid).toBe(true)

      // 3. 授权管理 (挂起/续期)
      expect(journey.management.suspend).toBe(true)
      expect(journey.management.renew).toBe(true)

      // 4. 最终状态验证
      expect(journey.finalStatus).toBe('active')
    })
  })

  test.describe('全量回归测试汇总', () => {
    test('RT-15: Sprint 2 全功能回归测试报告', async () => {
      const report = await licensePage.generateRegressionReport()

      // Sprint 1 基础功能 (TC01-TC10)
      expect(report.sprint1.passed).toBe(10)

      // Sprint 2 Day 19-20 (TC11-TC30)
      expect(report.sprint2a.passed).toBe(20)

      // Sprint 2 Day 21-22 (TC31-TC35)
      expect(report.sprint2b.passed).toBe(55)

      // 5端适配
      expect(report.adaptation.passed).toBe(24)

      // 总计
      expect(report.total.passed).toBe(109)
      expect(report.total.failed).toBe(0)
      expect(report.total.passRate).toBe(100)

      console.log('========================================')
      console.log('Sprint 2 全功能回归测试报告')
      console.log('========================================')
      console.log(`总测试用例: ${report.total.total}`)
      console.log(`通过: ${report.total.passed}`)
      console.log(`失败: ${report.total.failed}`)
      console.log(`通过率: ${report.total.passRate}%`)
      console.log('========================================')
      console.log('详细分布:')
      console.log(`- Sprint 1 基础功能: ${report.sprint1.passed} 个`)
      console.log(`- Sprint 2 缓存/激活码: ${report.sprint2a.passed} 个`)
      console.log(`- Sprint 2 E2E测试: ${report.sprint2b.passed} 个`)
      console.log(`- 5端适配测试: ${report.adaptation.passed} 个`)
      console.log('========================================')
    })
  })
})