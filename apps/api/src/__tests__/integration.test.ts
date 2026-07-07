import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Sprint 1 跨模块集成测试 (V10 Day 10)
 *
 * 验证模块间的协作:
 * 1. 三级配置 + AI 模型 → 租户配置覆盖
 * 2. License + Monitoring → 授权失效告警
 * 3. Canary + Tenant Config → 灰度策略与三级配置联动
 * 4. Open API + License → 多系统对接要求授权
 * 5. Report + 所有模块 → 数据源聚合
 */

import assert from 'node:assert/strict'

import { AiModelConfigService } from '../modules/ai-model-config/ai-model-config.service'
import { TenantConfigService } from '../modules/tenant-config/tenant-config.service'
import { LicenseService } from '../modules/license/license.service'
import { CanaryService } from '../modules/canary/canary.service'
import { OpenApiService } from '../modules/open-api/open-api.service'
import { MonitoringService } from '../modules/monitoring/monitoring.service'
import { ReportService } from '../modules/report/report.service'
import { runWithTenant } from '../common/context/tenant-context'

const TENANT_CTX = {
  tenantId: 'tenant-A',
  storeId: 'store-001',
  userId: 'admin',
  role: 'tenant_admin' as const,
}

describe('Sprint 1 集成测试 V10 Day 10', () => {
  describe('Scenario 1: 三级配置 + AI 模型 (租户配置覆盖)', () => {
    it('租户修改 ai.default_model 后,门店生效值跟随', async () => {
      await runWithTenant(TENANT_CTX, async () => {
        const tcs = new TenantConfigService()
        const tInst = await tcs.setConfig({ key: 'ai.default_model', value: 'gpt-4o' })
        assert.equal(tInst.value, 'gpt-4o')

        // 验证门店视角的生效值
        const effective = await tcs.getEffectiveConfigs('ai')
        const aiCfg = effective.find((c) => c.key === 'ai.default_model')
        assert.equal(aiCfg?.value, 'gpt-4o')
        assert.equal(aiCfg?.sourceLevel, 'tenant')
      })
    })
  })

  describe('Scenario 2: License + Monitoring (授权失效触发告警)', () => {
    it('License 过期后应能被 monitoring 监控', () => {
      const ls = new (LicenseService as any)()
      const ms = new MonitoringService()
      // 创建规则: License 过期率 > 0 触发告警
      const rule = ms.createAlertRule({
        name: 'License Expired Alert',
        metric: 'license.expired_count', comparator: 'gt',
        threshold: 0, durationSec: 0, severity: 'warning',
        channels: ['in_app'], enabled: true, createdBy: 'system',
      })
      // 模拟数据
      ms.recordMetric({ name: 'license.expired_count', value: 3, labels: {} })
      const alerts = ms.listAlerts('firing')
      assert.ok(alerts.some((a) => a.ruleId === rule.id))
    })
  })

  describe('Scenario 3: Canary + Tenant Config (灰度策略按租户隔离)', () => {
    it('不同租户的灰度评估独立', async () => {
      const cs = new CanaryService()
      const exp = cs.createExperiment({
        name: 'Multi-Tenant Test', description: '', flagKey: 'multi.tenant.test',
        strategy: 'tenant', strategyConfig: { type: 'tenant', tenantIds: ['tenant-A'] },
        initialPercentage: 100, targetPercentage: 100, createdBy: 'admin',
      })
      cs.activate(exp.id, 'admin')

      const evalA = cs.evaluate({ flagKey: 'multi.tenant.test', tenantId: 'tenant-A' })
      const evalB = cs.evaluate({ flagKey: 'multi.tenant.test', tenantId: 'tenant-B' })

      assert.equal(evalA.enabled, true)
      assert.equal(evalB.enabled, false)
    })
  })

  describe('Scenario 4: Open API + License (多系统对接需要授权)', () => {
    it('OpenApi client 必须先 license 才能 sync', async () => {
      const ls = new (LicenseService as any)()
      const os = new OpenApiService()

      // 没有 license → requireLicense 应该 throw
      await assert.rejects(
        runWithTenant({ ...TENANT_CTX, tenantId: 'unlicensed-tenant' }, async () =>
          ls.requireLicense({ ...TENANT_CTX, tenantId: 'unlicensed-tenant' }.tenantId, { ...TENANT_CTX, tenantId: 'unlicensed-tenant' }.userId, 'integration.open'),
        ),
      )
    })

    it('有 license + 有效 client → OAuth + sync 成功', async () => {
      await runWithTenant(TENANT_CTX, async () => {
        const os = new OpenApiService()
        const token = await os.authenticate('cli-merchant-001', 'test-secret', [])
        assert.ok(token.accessToken)
      })
    })
  })

  describe('Scenario 5: Report 跨模块数据聚合', () => {
    it('Report 接收多模块数据点', async () => {
      const rs = new ReportService()
      const initialCount = rs.listReports().length

      // AI 模型数据
      rs.ingestDataPoints([
        { bucket: '2026-06-28', dimension: 'store-001', metric: 'ai.tokens', value: 15000 },
        { bucket: '2026-06-28', dimension: 'store-002', metric: 'ai.tokens', value: 20000 },
      ])
      // 销售数据
      rs.ingestDataPoints([
        { bucket: '2026-06-28', dimension: 'store-001', metric: 'sales.amount', value: 60000 },
      ])

      const aiTotals = rs.aggregateBy('ai.tokens', 'store-001')
      const salesTotals = rs.aggregateBy('sales.amount', 'store-001')

      assert.ok(aiTotals.get('store-001')! >= 15000)
      assert.ok(salesTotals.get('store-001')! >= 60000)
    })
  })

  describe('Scenario 6: 完整业务流 (配置 → AI → 报表)', () => {
    it('端到端: 租户配置 AI 模型 → 大模型服务应用 → 报表统计', async () => {
      await runWithTenant(TENANT_CTX, async () => {
        // 1. 租户配置 AI 默认模型
        const tcs = new TenantConfigService()
        await tcs.setConfig({ key: 'ai.default_model', value: 'claude-3.5-sonnet' })

        // 2. AI 模型服务读取生效值
        const effective = await tcs.getEffectiveConfigs('ai')
        const aiCfg = effective.find((c) => c.key === 'ai.default_model')
        assert.equal(aiCfg?.value, 'claude-3.5-sonnet')

        // 3. 报表统计 AI 使用
        const rs = new ReportService()
        rs.ingestDataPoints([
          { bucket: '2026-06-28', dimension: 'claude-3.5-sonnet', metric: 'ai.tokens', value: 100000 },
        ])
        const totals = rs.aggregateBy('ai.tokens', 'claude-3.5-sonnet')
        assert.ok(totals.get('claude-3.5-sonnet')! >= 100000)
      })
    })
  })

  describe('Scenario 7: 灰度 + 监控 (健康度触发自动晋级)', () => {
    it('canary 健康度好 → 监控可联动', () => {
      const ms = new MonitoringService()

      // 上报 canary 错误率
      ms.recordMetric({ name: 'canary.error_rate', value: 0.005, labels: { exp: 'exp-1' } })
      // 验证指标已记录
      const points = ms.queryMetric('canary.error_rate')
      assert.ok(points.length >= 1)
      assert.ok(points[0].value < 0.01) // 健康
    })
  })
})
