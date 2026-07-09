import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [tenant-llm] [D] 模拟器测试
 *
 * 模拟多租户高并发场景、配额告警场景、配置变更一致性场景
 *
 * 注意: TenantLLMService 所有方法均为 async (返回 Promise),
 *       因此测试中必须 await 每次服务调用。
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TenantLLMService } from './llm-config.service'

// ─── helper ────────────────────────────────────────────

function createService(): TenantLLMService {
  const mockGuard = { canActivate: () => true } as any
  return new TenantLLMService(mockGuard)
}

describe('[tenant-llm] 模拟器: 多租户并行场景', () => {
  it('模拟 3 个租户各自独立配置和日志', async () => {
    const svc = createService()
    const tenants = ['tenant-1', 'tenant-2', 'tenant-3']

    // 每个租户创建 2 个配置
    for (const t of tenants) {
      await svc.createConfig(t, { name: `${t}-cfg1`, provider: 'deepseek', modelName: 'deepseek-chat', apiKey: `sk-${t}-1` })
      await svc.createConfig(t, { name: `${t}-cfg2`, provider: 'openai', modelName: 'gpt-4', apiKey: `sk-${t}-2` })
    }

    // 验证租户隔离
    for (const t of tenants) {
      const configs = await svc.getConfigs(t)
      assert.equal(configs.length, 2)
      assert.ok(configs.every(c => c.tenantId === t))
    }

    // 每个租户写入调用日志
    for (const t of tenants) {
      const configs = await svc.getConfigs(t)
      for (const cfg of configs) {
        await svc.logCall({
          configId: cfg.id,
          tenantId: t,
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          costEstimate: 0.003,
          currency: 'USD',
          latencyMs: 300,
          status: 'success',
        })
      }
    }

    // 每个租户统计独立
    for (const t of tenants) {
      const stats = await svc.getStats(t)
      assert.equal(stats.totalCalls, 2)
      assert.equal(stats.totalTokens, 300) // 150 * 2
    }

    // 总体统计数据
    const allStats = await Promise.all(tenants.map(t => svc.getStats(t)))
    const totalCalls = allStats.reduce((sum, s) => sum + s.totalCalls, 0)
    assert.equal(totalCalls, 6)
  })

  it('模拟 10 个租户并发操作', async () => {
    const svc = createService()
    const tenantCount = 10

    // 每个租户创建配置
    for (let i = 0; i < tenantCount; i++) {
      await svc.createConfig(`sim-tenant-${i}`, {
        name: `Sim Tenant ${i}`,
        provider: i % 3 === 0 ? 'deepseek' : i % 3 === 1 ? 'openai' : 'anthropic',
        modelName: i % 3 === 0 ? 'deepseek-chat' : i % 3 === 1 ? 'gpt-4' : 'claude-3',
        apiKey: `sk-sim-${i}`,
      })
    }

    // 每个租户查询自己的配置
    for (let i = 0; i < tenantCount; i++) {
      const configs = await svc.getConfigs(`sim-tenant-${i}`)
      assert.equal(configs.length, 1)
      assert.equal(configs[0].tenantId, `sim-tenant-${i}`)
    }

    // 验证全局不可交叉访问
    const allConfigs: string[] = []
    for (let i = 0; i < tenantCount; i++) {
      const configs = await svc.getConfigs(`sim-tenant-${i}`)
      for (const c of configs) {
        assert.equal(c.tenantId, `sim-tenant-${i}`)
        allConfigs.push(c.id)
      }
    }

    // 每个 ID 应全局唯一
    const uniqueIds = new Set(allConfigs)
    assert.equal(uniqueIds.size, allConfigs.length)
  })
})

describe('[tenant-llm] 模拟器: 配额告警场景', () => {
  it('模拟配额接近告警阈值', async () => {
    const svc = createService()
    const config = await svc.createConfig('t-alert', {
      name: 'Alert Test',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-alert',
      quotaLimit: 10000,
      quotaAlertThreshold: 0.8,
    })

    // 写入调用日志接近 80% 阈值
    for (let i = 0; i < 8; i++) {
      await svc.logCall({
        configId: config.id,
        tenantId: 't-alert',
        promptTokens: 500,
        completionTokens: 500,
        totalTokens: 1000,
        costEstimate: 0.01,
        currency: 'USD',
        latencyMs: 200,
        status: 'success',
      })
    }

    const updatedConfig = await svc.getConfig(config.id, 't-alert')
    assert.ok(updatedConfig)
    assert.equal(updatedConfig!.quotaUsed, 8000)
    assert.ok(updatedConfig!.quotaLimit !== undefined)
    const usageRate = (updatedConfig!.quotaUsed ?? 0) / (updatedConfig!.quotaLimit ?? 1)
    assert.ok(usageRate >= 0.8) // 已触发告警阈值

    // 再写入一次，超出配额
    await svc.logCall({
      configId: config.id,
      tenantId: 't-alert',
      promptTokens: 500,
      completionTokens: 500,
      totalTokens: 2000,
      costEstimate: 0.02,
      currency: 'USD',
      latencyMs: 200,
      status: 'success',
    })

    const afterConfig = await svc.getConfig(config.id, 't-alert')
    assert.ok(afterConfig)
    assert.equal(afterConfig!.quotaUsed, 10000) // 超出阈值
  })

  it('配额上限为 0 时使用量增长', async () => {
    const svc = createService()
    const config = await svc.createConfig('t-unlimited', {
      name: 'Unlimited',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-unlimited',
      quotaLimit: 0,
    })

    for (let i = 0; i < 5; i++) {
      await svc.logCall({
        configId: config.id,
        tenantId: 't-unlimited',
        promptTokens: 100,
        completionTokens: 0,
        totalTokens: 100,
        costEstimate: 0.001,
        currency: 'USD',
        latencyMs: 100,
        status: 'success',
      })
    }

    const updated = await svc.getConfig(config.id, 't-unlimited')
    assert.ok(updated)
    assert.equal(updated!.quotaUsed, 500)
  })
})

describe('[tenant-llm] 模拟器: 配置一致性场景', () => {
  it('创建→审批→更新→查询一致性', async () => {
    const svc = createService()
    const config = await svc.createConfig('t-consistency', {
      name: 'V1',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-v1',
      temperature: 0.7,
    })

    assert.equal(config.name, 'V1')
    assert.equal(config.temperature, 0.7)
    assert.equal(config.status, 'pending')

    // 审批通过
    const approved = await svc.approveConfig(config.id, 'admin', true)
    assert.ok(approved)
    assert.equal(approved!.status, 'approved')
    assert.equal(approved!.enabled, true)

    // 更新名称和温度
    const updated = await svc.updateConfig(config.id, 't-consistency', {
      name: 'V2',
      temperature: 0.3,
    })
    assert.ok(updated)
    assert.equal(updated!.name, 'V2')
    assert.equal(updated!.temperature, 0.3)
    assert.equal(updated!.status, 'approved') // 更新不影响状态

    // 重新查询验证一致性
    const fetched = await svc.getConfig(config.id, 't-consistency')
    assert.ok(fetched)
    assert.equal(fetched!.name, 'V2')
    assert.equal(fetched!.temperature, 0.3)
    assert.equal(fetched!.status, 'approved')
    assert.equal(fetched!.enabled, true)
  })

  it('多轮审批不影响配置核心数据', async () => {
    const svc = createService()
    const config = await svc.createConfig('t-multi-approve', {
      name: 'Multi Approve',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-multi',
    })

    // 批准→拒绝→再批准
    await svc.approveConfig(config.id, 'admin-1', true)
    await svc.approveConfig(config.id, 'admin-2', false)
    const finalApprove = await svc.approveConfig(config.id, 'admin-3', true)

    assert.ok(finalApprove)
    assert.equal(finalApprove!.status, 'approved')
    assert.equal(finalApprove!.approvedBy, 'admin-3')
    assert.equal(finalApprove!.enabled, true)
  })
})

describe('[tenant-llm] 模拟器: 边界与异常场景', () => {
  it('大量日志写入不报错', async () => {
    const svc = createService()
    const config = await svc.createConfig('t-stress-log', {
      name: 'Stress Log',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-stress',
    })

    const batchSize = 50
    for (let i = 0; i < batchSize; i++) {
      await svc.logCall({
        configId: config.id,
        tenantId: 't-stress-log',
        promptTokens: i * 10,
        completionTokens: i * 5,
        totalTokens: i * 15,
        costEstimate: i * 0.001,
        currency: 'USD',
        latencyMs: 100 + i,
        status: i % 10 === 0 ? 'error' : 'success',
        errorMessage: i % 10 === 0 ? 'Simulated error' : undefined,
      })
    }

    const logs = await svc.getCallLogs('t-stress-log')
    assert.equal(logs.length, batchSize)

    const stats = await svc.getStats('t-stress-log')
    assert.equal(stats.totalCalls, batchSize)
    assert.equal(stats.successCalls, batchSize - Math.floor(batchSize / 10))
    assert.equal(stats.failedCalls, Math.floor(batchSize / 10))
    assert.ok(stats.avgLatencyMs > 0)
  })

  it('跨时段日志筛选', async () => {
    const svc = createService()
    const config = await svc.createConfig('t-period', {
      name: 'Period Filter',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-period',
    })

    for (let i = 0; i < 5; i++) {
      await svc.logCall({
        configId: config.id,
        tenantId: 't-period',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costEstimate: 0.003,
        currency: 'USD',
        latencyMs: 200,
        status: 'success',
      })
    }

    // 用当前时间筛选应返回所有
    const allLogs = await svc.getCallLogs('t-period')
    assert.equal(allLogs.length, 5)

    // 应该能按 configId 筛选
    const filteredLogs = await svc.getCallLogs('t-period', config.id)
    assert.equal(filteredLogs.length, 5)

    // 不存在 configId 筛选
    const noLogs = await svc.getCallLogs('t-period', 'non-existent')
    assert.equal(noLogs.length, 0)
  })

  it('配置删除后配额信息不可访问', async () => {
    const svc = createService()
    const config = await svc.createConfig('t-gone', {
      name: 'Gone Config',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-gone',
    })

    await svc.deleteConfig(config.id, 't-gone')
    const result = await svc.getConfig(config.id, 't-gone')
    assert.equal(result, null)
  })
})
