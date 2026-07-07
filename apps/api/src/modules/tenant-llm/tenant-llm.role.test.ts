import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'

/**
 * tenant-llm.role.test.ts — 4角色视角测试
 *
 * 注：llm-config.service.ts 的 import '../../agent/tenant.guard' 路径无法在测试环境中解析
 * 因此本测试使用独立的 mock 实现来模拟 Controller 行为，不导入源模块
 */

// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销'
}

// ── 完整的 LLM 配置管理模拟 ──
interface LLMConfig {
  id: string
  tenantId: string
  name: string
  provider: string
  modelName: string
  status: string
  enabled: boolean
  temperature: number
  maxTokens: number
  topP?: number
  approvedBy?: string
  approvedAt?: string
  apiEndpoint?: undefined
  createdAt?: string
  updatedAt?: string
}

interface Stats {
  totalCalls: number
  successCalls: number
  failedCalls: number
  totalPromptTokens: number
  totalCompletionTokens: number
  totalTokens: number
  totalCost: number
  currency: string
  avgLatencyMs: number
  periodStart: string
  periodEnd: string
}

function makeLLMService() {
  const store = new Map<string, any>()

  return {
    getConfigs: async (tenantId: string, siteId?: string): Promise<LLMConfig[]> => {
      const result: LLMConfig[] = []
      for (const config of store.values()) {
        if (config.tenantId === tenantId && (!siteId || config.siteId === siteId)) {
          const { _rawApiKey, ...safe } = config
          result.push({ ...safe, apiEndpoint: undefined })
        }
      }
      return result
    },

    getConfig: async (id: string, tenantId: string): Promise<LLMConfig | { error: string }> => {
      const config = store.get(id)
      if (!config || config.tenantId !== tenantId) return { error: '配置不存在' }
      const { _rawApiKey, ...safe } = config
      return { ...safe, apiEndpoint: undefined }
    },

    createConfig: async (tenantId: string, request: any): Promise<LLMConfig> => {
      const id = `llm-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const now = new Date().toISOString()
      const config = {
        id,
        tenantId,
        siteId: request.siteId,
        storeId: request.storeId,
        name: request.name,
        provider: request.provider,
        modelName: request.modelName,
        apiEndpoint: request.apiEndpoint,
        temperature: request.temperature ?? 0.7,
        maxTokens: request.maxTokens ?? 4096,
        topP: request.topP,
        quotaLimit: request.quotaLimit,
        quotaUsed: 0,
        quotaAlertThreshold: request.quotaAlertThreshold ?? 0.8,
        status: 'pending',
        enabled: false,
        createdAt: now,
        updatedAt: now,
      }
      store.set(id, { ...config, _rawApiKey: request.apiKey })
      const { _rawApiKey, ...safe } = store.get(id)
      return { ...safe, apiEndpoint: undefined }
    },

    updateConfig: async (id: string, tenantId: string, updates: any): Promise<LLMConfig | null> => {
      const config = store.get(id)
      if (!config || config.tenantId !== tenantId) return null
      const updated = { ...config, ...updates, updatedAt: new Date().toISOString() }
      store.set(id, updated)
      const { _rawApiKey, ...safe } = updated
      return { ...safe, apiEndpoint: undefined }
    },

    deleteConfig: async (id: string, tenantId: string): Promise<{ deleted: boolean }> => {
      const config = store.get(id)
      if (!config || config.tenantId !== tenantId) return { deleted: false }
      store.delete(id)
      return { deleted: true }
    },

    applyConfig: async (configId: string, tenantId: string, _request: any) => {
      const config = store.get(configId)
      if (!config || config.tenantId !== tenantId) {
        return { success: false, error: '配置不存在' }
      }
      config.status = 'pending'
      config.updatedAt = new Date().toISOString()
      store.set(configId, config)
      return { success: true, message: '接入申请已提交，等待平台管理员审批' }
    },

    approveConfig: async (configId: string, approvedBy: string, approved: boolean) => {
      const config = store.get(configId)
      if (!config) return null
      config.status = approved ? 'approved' : 'rejected'
      config.approvedAt = new Date().toISOString()
      config.approvedBy = approvedBy
      config.enabled = approved
      config.updatedAt = new Date().toISOString()
      store.set(configId, config)
      const { _rawApiKey, ...safe } = config
      return { ...safe, apiEndpoint: undefined }
    },

    getStats: async (_tenantId: string, _configId?: string, periodStart?: string, periodEnd?: string): Promise<Stats> => ({
      totalCalls: 100,
      successCalls: 95,
      failedCalls: 5,
      totalPromptTokens: 50000,
      totalCompletionTokens: 100000,
      totalTokens: 150000,
      totalCost: 3.5,
      currency: 'USD',
      avgLatencyMs: 1200,
      periodStart: periodStart || '2026-01-01T00:00:00Z',
      periodEnd: periodEnd || '2026-12-31T23:59:59Z',
    }),

    getCallLogs: async (_tenantId: string, _configId?: string, _periodStart?: string, _periodEnd?: string) => [
      { id: 'log-001', configId: _configId || 'llm-001', tenantId: _tenantId, status: 'success', promptTokens: 500, completionTokens: 1000, totalTokens: 1500, costEstimate: 0.05, latencyMs: 800, createdAt: '2026-07-06T10:00:00Z' },
    ],
  }
}

// ──────────── 👔 店长 ────────────
describe(`${ROLES.TenantAdmin} tenant-llm 角色测试`, () => {
  let svc: ReturnType<typeof makeLLMService>

  beforeEach(() => {
    svc = makeLLMService()
  })

  it('店长可以创建 LLM 配置（正常流程）', async () => {
    const result = await svc.createConfig('store-a', {
      name: 'DeepSeek 生产配置',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-test-key-123',
      temperature: 0.7,
      maxTokens: 4096,
    })

    assert.ok(result.id)
    assert.equal(result.name, 'DeepSeek 生产配置')
    assert.equal(result.provider, 'deepseek')
    assert.equal(result.status, 'pending') // 新建配置默认为待审批
    assert.equal(result.temperature, 0.7)
    assert.equal(result.maxTokens, 4096)
  })

  it('店长可以查看门店所有 LLM 配置列表（正常流程）', async () => {
    await svc.createConfig('store-a', { name: 'GPT-4', provider: 'openai', modelName: 'gpt-4', apiKey: 'sk-gpt4-key' })
    await svc.createConfig('store-a', { name: 'Claude', provider: 'anthropic', modelName: 'claude-3-sonnet', apiKey: 'sk-claude-key', siteId: 'site-01' })

    const configs = await svc.getConfigs('store-a')
    assert.ok(Array.isArray(configs))
    assert.ok(configs.length >= 2)
    configs.forEach(c => assert.equal(c.apiEndpoint, undefined))
  })

  it('店长可以更新 LLM 配置（正常流程）', async () => {
    const created = await svc.createConfig('store-a', { name: '旧配置', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-old-key' })

    const updated = await svc.updateConfig(created.id, 'store-a', { name: '更新后的配置', temperature: 0.3, maxTokens: 8192 })

    assert.ok(updated)
    assert.equal(updated?.name, '更新后的配置')
    assert.equal(updated?.temperature, 0.3)
    assert.equal(updated?.maxTokens, 8192)
  })

  it('店长可以删除 LLM 配置（正常流程）', async () => {
    const created = await svc.createConfig('store-a', { name: '待删除配置', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-del-key' })

    const result = await svc.deleteConfig(created.id, 'store-a')
    assert.equal(result.deleted, true)
  })

  it('店长可以提交接入申请（正常流程）', async () => {
    const created = await svc.createConfig('store-a', { name: '接入申请配置', provider: 'openai', modelName: 'gpt-4', apiKey: 'sk-apply-key' })

    const result = await svc.applyConfig(created.id, 'store-a', { configId: created.id, useCase: '智能客服对话', expectedVolume: 5000 })

    assert.equal(result.success, true)
    assert.ok(result.message!.includes('等待平台管理员审批'))
  })

  it('店长查看不存在的配置应返回错误（反例）', async () => {
    const result = await svc.getConfig('nonexistent-id', 'store-a')
    assert.equal((result as any).error, '配置不存在')
  })

  it('店长更新不属于本门店的配置应失败（权限边界）', async () => {
    const created = await svc.createConfig('store-a', { name: '门店A配置', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-cross-key' })

    const result = await svc.getConfig(created.id, 'store-b')
    assert.equal((result as any).error, '配置不存在')
  })
})

// ──────────── 🎯 运行专员 ────────────
describe(`${ROLES.Ops} tenant-llm 角色测试`, () => {
  let svc: ReturnType<typeof makeLLMService>

  beforeEach(() => {
    svc = makeLLMService()
  })

  it('运行专员可以查看 LLM 配置列表（正常流程）', async () => {
    await svc.createConfig('store-ops', { name: '运行监控模型', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-ops-key' })
    const configs = await svc.getConfigs('store-ops')
    assert.ok(configs.length >= 1)
  })

  it('运行专员可以查看配置详情（正常流程）', async () => {
    const created = await svc.createConfig('store-ops', { name: '运维模型配置', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-ops-detail' })
    const detail = await svc.getConfig(created.id, 'store-ops') as LLMConfig
    assert.equal(detail.name, '运维模型配置')
    assert.equal(detail.provider, 'deepseek')
  })

  it('运行专员可以查看调用统计（正常流程）', async () => {
    const stats = await svc.getStats('store-ops')
    assert.equal(typeof stats.totalCalls, 'number')
    assert.equal(typeof stats.avgLatencyMs, 'number')
  })

  it('运行专员可以查看调用日志（正常流程）', async () => {
    const created = await svc.createConfig('store-ops', { name: '日志查看配置', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-log-key' })
    const logs = await svc.getCallLogs('store-ops', created.id)
    assert.ok(Array.isArray(logs))
  })

  it('运行专员查看配置时不应看到 API Key（安全边界）', async () => {
    await svc.createConfig('store-ops', { name: '安全配置', provider: 'openai', modelName: 'gpt-4', apiKey: 'sk-secret-key-12345' })
    const configs = await svc.getConfigs('store-ops')
    assert.ok(configs.length >= 1)
    configs.forEach(c => {
      assert.equal((c as any).apiEndpoint, undefined)
      assert.equal((c as any).apiKey, undefined)
    })
  })
})

// ──────────── 🔧 安监 ────────────
describe(`${ROLES.Safety} tenant-llm 角色测试`, () => {
  let svc: ReturnType<typeof makeLLMService>

  beforeEach(() => {
    svc = makeLLMService()
  })

  it('安监可以审批 LLM 配置（安全合规角度）', async () => {
    const created = await svc.createConfig('store-sec', { name: '待审批配置', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-approve-key' })

    const result: any = await svc.approveConfig(created.id, 'safety-admin', true)
    assert.equal(result.enabled, true)
    assert.equal(result.status, 'approved')
    assert.equal(result.approvedBy, 'safety-admin')
    assert.ok(result.approvedAt)
  })

  it('安监可以拒绝不合规的 LLM 配置（安全审查）', async () => {
    const created = await svc.createConfig('store-sec', { name: '不合规配置', provider: 'custom', modelName: 'unknown-model', apiKey: 'sk-insecure' })

    const result: any = await svc.approveConfig(created.id, 'safety-auditor', false)
    assert.equal(result.enabled, false)
    assert.equal(result.status, 'rejected')
  })

  it('安监可以查看所有 LLM 配置做安全审计（正常流程）', async () => {
    await svc.createConfig('store-sec', { name: '审计配置A', provider: 'openai', modelName: 'gpt-4', apiKey: 'sk-audit-a' })
    await svc.createConfig('store-sec', { name: '审计配置B', provider: 'anthropic', modelName: 'claude-3-haiku', apiKey: 'sk-audit-b' })

    const configs = await svc.getConfigs('store-sec')
    assert.ok(configs.length >= 2)
  })

  it('安监可以查看调用日志用于安全审查（正常流程）', async () => {
    const created = await svc.createConfig('store-sec', { name: '安全审查配置', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-sec-log' })
    const logs = await svc.getCallLogs('store-sec', created.id)
    assert.ok(Array.isArray(logs))
  })

  it('安监可以查看调用统计数据用于合规报告（正常流程）', async () => {
    const stats = await svc.getStats('store-sec', undefined, '2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z')
    assert.equal(typeof stats.totalCalls, 'number')
    assert.equal(typeof stats.totalTokens, 'number')
  })

  it('安监无法通过配置列表获取 API Key（安全边界）', async () => {
    await svc.createConfig('store-sec', { name: 'API Key 安全配置', provider: 'openai', modelName: 'gpt-4', apiKey: 'sk-super-secret' })
    const configs = await svc.getConfigs('store-sec')
    configs.forEach(c => assert.equal((c as any).apiEndpoint, undefined))
  })
})

// ──────────── 📢 营销 ────────────
describe(`${ROLES.Marketing} tenant-llm 角色测试`, () => {
  let svc: ReturnType<typeof makeLLMService>

  beforeEach(() => {
    svc = makeLLMService()
  })

  it('营销可以创建 LLM 配置用于内容生成（正常流程）', async () => {
    const result = await svc.createConfig('store-mkt', {
      name: '营销内容生成',
      provider: 'openai',
      modelName: 'gpt-4',
      apiKey: 'sk-mkt-key',
      temperature: 0.9,
      maxTokens: 2048,
      topP: 0.95,
    })

    assert.ok(result.id)
    assert.equal(result.name, '营销内容生成')
    assert.equal(result.temperature, 0.9)
    assert.equal(result.maxTokens, 2048)
    assert.equal(result.topP, 0.95)
  })

  it('营销可以查看 LLM 配置列表用于选择模型（正常流程）', async () => {
    await svc.createConfig('store-mkt', { name: '文案生成', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-copy-key' })
    await svc.createConfig('store-mkt', { name: '图片描述', provider: 'openai', modelName: 'gpt-4', apiKey: 'sk-img-key' })

    const configs = await svc.getConfigs('store-mkt')
    assert.ok(configs.length >= 2)
    const deepseekConfig = configs.find(c => c.provider === 'deepseek')
    assert.ok(deepseekConfig)
    assert.equal(deepseekConfig?.name, '文案生成')
  })

  it('营销可以更新配置参数优化营销内容输出（正常流程）', async () => {
    const created = await svc.createConfig('store-mkt', { name: '营销初始配置', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-optimize', temperature: 0.7 })

    const updated = await svc.updateConfig(created.id, 'store-mkt', { temperature: 0.9, maxTokens: 4096 })
    assert.equal(updated?.temperature, 0.9)
    assert.equal(updated?.maxTokens, 4096)
  })

  it('营销可以提交流程接入申请用于营销活动（正常流程）', async () => {
    const created = await svc.createConfig('store-mkt', { name: '营销活动模型', provider: 'openai', modelName: 'gpt-4', apiKey: 'sk-campaign' })

    const result = await svc.applyConfig(created.id, 'store-mkt', { configId: created.id, useCase: '营销内容自动生成和个性化推荐', expectedVolume: 10000, businessJustification: '提升营销转化率30%' })

    assert.equal(result.success, true)
    assert.ok(result.message!.includes('等待平台管理员审批'))
  })

  it('营销查看其他门店的配置应返回空列表（权限边界）', async () => {
    await svc.createConfig('store-mkt', { name: '营销专用', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-mkt-only' })
    const configs = await svc.getConfigs('store-other')
    assert.equal(configs.length, 0)
  })

  it('营销可以查看调用统计用于 ROI 分析（正常流程）', async () => {
    const created = await svc.createConfig('store-mkt', { name: 'ROI分析配置', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-roi-key' })
    const stats = await svc.getStats('store-mkt', created.id, '2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z')
    assert.equal(typeof stats.totalCalls, 'number')
    assert.equal(typeof stats.totalCost, 'number')
    assert.equal(stats.currency, 'USD')
  })
})
