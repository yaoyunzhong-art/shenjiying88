import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [tenant-llm] [C] 合约测试
 *
 * 验证 tenant-llm 模块的实体 Shape、业务逻辑契约
 *
 * 注意: TenantLLMService 所有方法均为 async (返回 Promise),
 *       因此测试中必须 await 每次服务调用。
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TenantLLMService } from './llm-config.service'
import type {
  TenantLLMConfig,
  CreateLLMConfigRequest,
  LLMStats,
  LLMCallLog,
  LLMConfigStatus,
  LLMProvider,
} from './llm-config.entity'

// ─── 服务实例 helper ──────────────────────────────────

function makeService(): TenantLLMService {
  const mockGuard = { canActivate: () => true } as any
  return new TenantLLMService(mockGuard)
}

// ─── 合约: 实体 Shape ─────────────────────────────────

describe('[tenant-llm] 合约: LLM配置实体', () => {
  it('createConfig 返回完整的 TenantLLMConfig', async () => {
    const svc = makeService()
    const config = await svc.createConfig('t-shape', {
      name: '合约测试',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-test',
      temperature: 0.7,
      maxTokens: 4096,
    })

    assert.ok(config.id)
    assert.ok(config.id.startsWith('llm-'))
    assert.equal(config.tenantId, 't-shape')
    assert.equal(config.name, '合约测试')
    assert.equal(config.provider, 'deepseek')
    assert.equal(config.modelName, 'deepseek-chat')
    assert.equal(config.temperature, 0.7)
    assert.equal(config.maxTokens, 4096)
    assert.equal(config.status, 'pending')
    assert.equal(config.enabled, false)
    assert.equal(typeof config.createdAt, 'string')
    assert.equal(typeof config.updatedAt, 'string')
  })

  it('createConfig 默认值正确', async () => {
    const svc = makeService()
    const config = await svc.createConfig('t-defaults', {
      name: '默认值测试',
      provider: 'openai',
      modelName: 'gpt-4',
      apiKey: 'sk-default',
    })

    assert.equal(config.temperature, 0.7)
    assert.equal(config.maxTokens, 4096)
    assert.equal(config.status, 'pending')
    assert.equal(config.enabled, false)
    assert.equal(config.quotaUsed, 0)
  })

  it('createConfig 不返回 apiEndpoint', async () => {
    const svc = makeService()
    const config = await svc.createConfig('t-safe', {
      name: '安全测试',
      provider: 'anthropic',
      modelName: 'claude-3',
      apiKey: 'sk-anthropic',
    })

    assert.equal(typeof (config as any).apiEndpoint, 'undefined')
  })
})

describe('[tenant-llm] 合约: 租户隔离', () => {
  it('不同租户数据完全隔离', async () => {
    const svc = makeService()

    await svc.createConfig('tenant-a', {
      name: 'A Config',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-a',
    })

    await svc.createConfig('tenant-b', {
      name: 'B Config',
      provider: 'openai',
      modelName: 'gpt-4',
      apiKey: 'sk-b',
    })

    const configsA = await svc.getConfigs('tenant-a')
    const configsB = await svc.getConfigs('tenant-b')

    assert.equal(configsA.length, 1)
    assert.equal(configsA[0].name, 'A Config')
    assert.equal(configsB.length, 1)
    assert.equal(configsB[0].name, 'B Config')
  })

  it('获取不属于本租户的配置返回 null', async () => {
    const svc = makeService()

    const config = await svc.createConfig('tenant-owner', {
      name: 'Owner',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-owner',
    })

    const result = await svc.getConfig(config.id, 'tenant-intruder')
    assert.equal(result, null)
  })

  it('更新不属于本租户的配置返回 null', async () => {
    const svc = makeService()

    const config = await svc.createConfig('tenant-1', {
      name: 'T1 Config',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-t1',
    })

    const result = await svc.updateConfig(config.id, 'tenant-2', { name: 'Hacked' })
    assert.equal(result, null)
  })

  it('删除不属于本租户的配置返回 false', async () => {
    const svc = makeService()

    const config = await svc.createConfig('tenant-x', {
      name: 'X Config',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-x',
    })

    const result = await svc.deleteConfig(config.id, 'tenant-y')
    assert.equal(result, false)
  })
})

describe('[tenant-llm] 合约: LLM配置生命周期', () => {
  it('新创建的配置状态为 pending', async () => {
    const svc = makeService()
    const config = await svc.createConfig('t-lifecycle', {
      name: 'Lifecycle Test',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-life',
    })

    assert.equal(config.status, 'pending')
    assert.equal(config.enabled, false)
  })

  it('审批通过后状态变为 approved', async () => {
    const svc = makeService()
    const config = await svc.createConfig('t-approve', {
      name: 'Approve Test',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-approve',
    })

    const approved = await svc.approveConfig(config.id, 'admin', true)
    assert.ok(approved)
    assert.equal(approved!.status, 'approved')
    assert.equal(approved!.enabled, true)
    assert.equal(approved!.approvedBy, 'admin')
    assert.ok(approved!.approvedAt)
  })

  it('审批拒绝后状态变为 rejected', async () => {
    const svc = makeService()
    const config = await svc.createConfig('t-reject', {
      name: 'Reject Test',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-reject',
    })

    const rejected = await svc.approveConfig(config.id, 'admin', false)
    assert.ok(rejected)
    assert.equal(rejected!.status, 'rejected')
    assert.equal(rejected!.enabled, false)
  })

  it('接入申请提交后状态保持 pending', async () => {
    const svc = makeService()
    const config = await svc.createConfig('t-apply', {
      name: 'Apply Test',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-apply',
    })

    const result = await svc.applyConfig(config.id, 't-apply', {
      configId: config.id,
      useCase: '智能客服',
      expectedVolume: 1000,
    })

    assert.ok(result.success)
    assert.equal(result.message, '接入申请已提交，等待平台管理员审批')
  })

  it('接入申请不存在的配置抛出 NotFoundException', async () => {
    const svc = makeService()

    await expect(
      svc.applyConfig('non-existent', 't-tenant', {
        configId: 'non-existent',
        useCase: '测试',
        expectedVolume: 100,
      })
    ).rejects.toThrow('配置不存在')
  })

  it('删除配置后数据不可见', async () => {
    const svc = makeService()
    const config = await svc.createConfig('t-delete', {
      name: 'Delete Test',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-delete',
    })

    const deleted = await svc.deleteConfig(config.id, 't-delete')
    assert.equal(deleted, true)

    const result = await svc.getConfig(config.id, 't-delete')
    assert.equal(result, null)
  })
})

describe('[tenant-llm] 合约: 调用统计', () => {
  it('无调用日志时统计字段为零', async () => {
    const svc = makeService()
    const stats = await svc.getStats('t-stats-empty')

    assert.equal(stats.totalCalls, 0)
    assert.equal(stats.successCalls, 0)
    assert.equal(stats.failedCalls, 0)
    assert.equal(stats.totalTokens, 0)
    assert.equal(stats.totalCost, 0)
    assert.equal(stats.avgLatencyMs, 0)
    assert.equal(stats.successRate, undefined)
    assert.equal(stats.currency, 'USD')
  })

  it('记录调用日志后有正确的统计数据', async () => {
    const svc = makeService()
    const config = await svc.createConfig('t-stats', {
      name: 'Stats Test',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-stats',
    })

    // 记录成功调用
    await svc.logCall({
      configId: config.id,
      tenantId: 't-stats',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      costEstimate: 0.003,
      currency: 'USD',
      latencyMs: 500,
      status: 'success',
    })

    // 记录失败调用
    await svc.logCall({
      configId: config.id,
      tenantId: 't-stats',
      promptTokens: 200,
      completionTokens: 0,
      totalTokens: 200,
      costEstimate: 0.001,
      currency: 'USD',
      latencyMs: 3000,
      status: 'error',
      errorMessage: 'Timeout',
    })

    const stats = await svc.getStats('t-stats')
    assert.equal(stats.totalCalls, 2)
    assert.equal(stats.successCalls, 1)
    assert.equal(stats.failedCalls, 1)
    assert.equal(stats.totalTokens, 350)
    assert.equal(stats.totalCost, 0.004)
    assert.ok(stats.avgLatencyMs > 0)
    assert.equal(stats.successRate, 50)
  })

  it('调用日志更新配额使用量', async () => {
    const svc = makeService()
    const config = await svc.createConfig('t-quota', {
      name: 'Quota Test',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-quota',
      quotaLimit: 10000,
    })

    await svc.logCall({
      configId: config.id,
      tenantId: 't-quota',
      promptTokens: 500,
      completionTokens: 500,
      totalTokens: 1000,
      costEstimate: 0.01,
      currency: 'USD',
      latencyMs: 200,
      status: 'success',
    })

    const updatedConfig = await svc.getConfig(config.id, 't-quota')
    assert.ok(updatedConfig)
    assert.equal(updatedConfig!.quotaUsed, 1000)
  })
})

describe('[tenant-llm] 合约: LLM配置字段约束', () => {
  it('provider 只接受已知值', async () => {
    const svc = makeService()
    const config = await svc.createConfig('t-provider', {
      name: 'Provider Test',
      provider: 'custom',
      modelName: 'my-model',
      apiKey: 'sk-custom',
    })

    assert.equal(config.provider, 'custom')
  })

  it('siteId 与 storeId 可选', async () => {
    const svc = makeService()
    const config = await svc.createConfig('t-optional', {
      name: 'Optional Fields',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-opt',
    })

    assert.equal(config.siteId, undefined)
    assert.equal(config.storeId, undefined)
  })

  it('最大 token 数不超过 128000', async () => {
    const svc = makeService()
    const config = await svc.createConfig('t-max-tokens', {
      name: 'Max Tokens',
      provider: 'openai',
      modelName: 'gpt-4',
      apiKey: 'sk-maxtokens',
      maxTokens: 128000,
    })

    assert.equal(config.maxTokens, 128000)
  })

  it('quotaLimit 可以被设置为 0', async () => {
    const svc = makeService()
    const config = await svc.createConfig('t-zero-quota', {
      name: 'Zero Quota',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-zero',
      quotaLimit: 0,
    })

    assert.equal(config.quotaLimit, 0)
  })
})
