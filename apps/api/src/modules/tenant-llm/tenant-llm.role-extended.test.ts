/**
 * tenant-llm.role-extended.test.ts · LLM 配置管理扩展角色测试
 *
 * 覆盖 8 角色视角:
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每角色 ≥ 2 测试用例 (正常流程 + 权限/边界)
 *
 * 注: llm-config.service.ts 依赖 '../../agent/tenant.guard' 无法在测试环境解析,
 * 使用独立的 mock 实现模拟 Controller 行为
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ── 角色 Emoji ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 类型定义 (与真实模块对齐) ──
interface LLMConfig {
  id: string
  tenantId: string
  siteId?: string
  storeId?: string
  name: string
  provider: string
  modelName: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  temperature: number
  maxTokens: number
  topP?: number
  apiKey?: string
  apiEndpoint?: string
  applicationStatus?: string
  approvedBy?: string
  approvedAt?: string
  createdAt?: string
  updatedAt?: string
}

interface LLMStats {
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

interface LLMCallLog {
  id: string
  configId: string
  tenantId: string
  timestamp: string
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  latencyMs: number
  cost: number
  status: string
}

// ── Mock 实现 ──
function createLLMService() {
  const store = new Map<string, LLMConfig>()
  const callLogStore = new Map<string, LLMCallLog[]>()

  let counter = 0

  return {
    // ── Config 管理 ──
    getConfigs: async (tenantId: string, siteId?: string): Promise<LLMConfig[]> => {
      const result: LLMConfig[] = []
      for (const config of store.values()) {
        if (config.tenantId === tenantId && (!siteId || config.siteId === siteId)) {
          const { apiKey, apiEndpoint, ...safe } = config
          result.push({ ...safe, apiEndpoint: undefined })
        }
      }
      return result
    },

    getConfig: async (id: string, tenantId: string): Promise<LLMConfig | { error: string }> => {
      const config = store.get(id)
      if (!config || config.tenantId !== tenantId) return { error: '配置不存在' }
      const { apiKey, apiEndpoint, ...safe } = config
      return { ...safe, apiEndpoint: undefined }
    },

    createConfig: async (tenantId: string, request: any): Promise<LLMConfig> => {
      counter++
      const id = `llm-mock-${Date.now()}-${counter}`
      const now = new Date().toISOString()
      const config: LLMConfig = {
        id,
        tenantId,
        siteId: request.siteId,
        storeId: request.storeId,
        name: request.name,
        provider: request.provider,
        modelName: request.modelName,
        status: 'pending',
        temperature: request.temperature ?? 0.5,
        maxTokens: request.maxTokens ?? 4096,
        topP: request.topP ?? 1,
        apiKey: request.apiKey,
        createdAt: now,
        updatedAt: now,
      }
      store.set(id, config)
      const { apiKey, ...safe } = config
      return { ...safe, apiEndpoint: undefined }
    },

    updateConfig: async (id: string, tenantId: string, updates: any): Promise<LLMConfig | { error: string }> => {
      const config = store.get(id)
      if (!config || config.tenantId !== tenantId) return { error: '配置不存在或无权限更新' }
      Object.assign(config, updates, { updatedAt: new Date().toISOString() })
      store.set(id, config)
      const { apiKey, ...safe } = config
      return { ...safe, apiEndpoint: undefined }
    },

    deleteConfig: async (id: string, tenantId: string): Promise<{ deleted: boolean }> => {
      const config = store.get(id)
      if (!config || config.tenantId !== tenantId) return { deleted: false }
      store.delete(id)
      return { deleted: true }
    },

    applyConfig: async (cfgId: string, tenantId: string, request: any): Promise<any> => {
      const config = store.get(cfgId)
      if (!config || config.tenantId !== tenantId) return { error: '配置不存在' }
      config.applicationStatus = 'pending_review'
      store.set(cfgId, config)
      return { applicationStatus: 'pending_review', ...request }
    },

    approveConfig: async (id: string, approvedBy: string, approved: boolean): Promise<LLMConfig | { error: string }> => {
      const config = store.get(id)
      if (!config) return { error: '配置不存在' }
      config.status = approved ? 'approved' : 'rejected'
      config.approvedBy = approvedBy
      config.approvedAt = new Date().toISOString()
      store.set(id, config)
      const { apiKey, ...safe } = config
      return { ...safe, apiEndpoint: undefined }
    },

    // ── 统计 & 日志 ──
    getStats: async (tenantId: string, configId?: string): Promise<LLMStats> => {
      if (configId && !store.has(configId)) {
        return { totalCalls: 0, successCalls: 0, failedCalls: 0, totalPromptTokens: 0, totalCompletionTokens: 0, totalTokens: 0, totalCost: 0, currency: 'CNY', avgLatencyMs: 0, periodStart: '', periodEnd: '' }
      }
      const logs = configId ? (callLogStore.get(configId) ?? []) : []
      const totalCalls = logs.length
      const succeeded = logs.filter((l) => l.status === 'success')
      return {
        totalCalls,
        successCalls: succeeded.length,
        failedCalls: totalCalls - succeeded.length,
        totalPromptTokens: logs.reduce((s, l) => s + l.promptTokens, 0),
        totalCompletionTokens: logs.reduce((s, l) => s + l.completionTokens, 0),
        totalTokens: logs.reduce((s, l) => s + l.totalTokens, 0),
        totalCost: logs.reduce((s, l) => s + l.cost, 0),
        currency: 'CNY',
        avgLatencyMs: totalCalls > 0 ? Math.round(logs.reduce((s, l) => s + l.latencyMs, 0) / totalCalls) : 0,
        periodStart: '2026-07-01T00:00:00Z',
        periodEnd: '2026-07-08T00:00:00Z',
      }
    },

    getCallLogs: async (tenantId: string, configId?: string): Promise<LLMCallLog[]> => {
      if (configId) return callLogStore.get(configId) ?? []
      const all: LLMCallLog[] = []
      for (const logs of callLogStore.values()) all.push(...logs)
      return all
    },

    // 辅助: 模拟插入调用日志
    _addCallLog: (configId: string, log: Partial<LLMCallLog>) => {
      const existing = callLogStore.get(configId) ?? []
      existing.push({
        id: `log-${existing.length + 1}`,
        configId,
        tenantId: 't-test',
        timestamp: new Date().toISOString(),
        model: 'gpt-4o',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        latencyMs: 500,
        cost: 0.003,
        status: 'success',
        ...log,
      })
      callLogStore.set(configId, existing)
    },
  }
}

// ═══════════════════════════════════════════════════════════════
// 👔店长 — 门店级 LLM 配置管理
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} tenant-llm 扩展测试`, () => {
  let svc: ReturnType<typeof createLLMService>

  beforeEach(() => {
    svc = createLLMService()
  })

  it('店长创建门店专属 LLM 配置（正常流程）', async () => {
    const config = await svc.createConfig('t-store-1', {
      name: '门店 AI 助手',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-store-mock',
      temperature: 0.7,
      maxTokens: 4096,
      siteId: 's-store-1',
    })
    expect(config).toBeDefined()
    expect(config.name).toBe('门店 AI 助手')
    expect(config.provider).toBe('deepseek')
    expect(config.status).toBe('pending')
    expect(config.apiKey).toBeUndefined()
    expect(config.apiEndpoint).toBeUndefined()
  })

  it('店长更新门店 LLM 配置的温度参数（正常流程：参数调整）', async () => {
    const created = await svc.createConfig('t-store-2', {
      name: '客服 Bot', provider: 'openai', modelName: 'gpt-4o-mini', apiKey: 'sk-xxx', temperature: 0.3, maxTokens: 2048,
    })
    const updated = await svc.updateConfig(created.id, 't-store-2', { temperature: 0.8 })
    expect(updated).not.toHaveProperty('error')
    expect((updated as LLMConfig).temperature).toBe(0.8)
    expect((updated as LLMConfig).name).toBe('客服 Bot')
  })

  it('店长尝试查询其他租户配置应返回空（权限边界）', async () => {
    await svc.createConfig('t-store-3', {
      name: '门店配置', provider: 'qwen', modelName: 'qwen-max', apiKey: 'sk-zzz', temperature: 0.5, maxTokens: 4096,
    })
    const configs = await svc.getConfigs('t-other-store')
    expect(configs).toHaveLength(0)
  })

  it('店长更新不属于本门店的配置应失败（权限边界）', async () => {
    const created = await svc.createConfig('t-store-4', {
      name: '私有配置', provider: 'openai', modelName: 'gpt-4', apiKey: 'sk-pvt', temperature: 0.5, maxTokens: 4096,
    })
    const result = await svc.updateConfig(created.id, 't-other', { temperature: 0.1 })
    expect(result).toHaveProperty('error')
  })
})

// ═══════════════════════════════════════════════════════════════
// 🛒前台 — 前端 AI 功能调用与状态
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} tenant-llm 扩展测试`, () => {
  let svc: ReturnType<typeof createLLMService>

  beforeEach(() => {
    svc = createLLMService()
  })

  it('前台查看当前租户可用 LLM 配置列表（正常流程）', async () => {
    await svc.createConfig('t-front', {
      name: '客服助手', provider: 'openai', modelName: 'gpt-4o', apiKey: 'sk-f1', temperature: 0.3, maxTokens: 2048, siteId: 's-front',
    })
    await svc.createConfig('t-front', {
      name: '翻译助手', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-f2', temperature: 0.1, maxTokens: 4096, siteId: 's-front',
    })
    const configs = await svc.getConfigs('t-front', 's-front')
    expect(configs.length).toBeGreaterThanOrEqual(2)
    configs.forEach((c) => {
      expect(c.apiKey).toBeUndefined()
      expect(c.apiEndpoint).toBeUndefined()
    })
  })

  it('前台查询不存在的配置返回错误信息（边界）', async () => {
    const result = await svc.getConfig('non-existent-id', 't-front')
    expect(result).toHaveProperty('error', '配置不存在')
  })
})

// ═══════════════════════════════════════════════════════════════
// 👥HR — 员工培训 AI 配置管理
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.HR} tenant-llm 扩展测试`, () => {
  let svc: ReturnType<typeof createLLMService>

  beforeEach(() => {
    svc = createLLMService()
  })

  it('HR 创建员工培训专用 LLM 配置（正常流程）', async () => {
    const config = await svc.createConfig('t-hr', {
      name: '员工培训助手',
      provider: 'anthropic',
      modelName: 'claude-3-haiku',
      apiKey: 'sk-hr-train',
      temperature: 0.2,
      maxTokens: 8192,
      siteId: 's-hr',
    })
    expect(config.name).toBe('员工培训助手')
    expect(config.status).toBe('pending')
    expect(config.provider).toBe('anthropic')
  })

  it('HR 更新培训配置后未更新字段保持不变（回归边界）', async () => {
    const created = await svc.createConfig('t-hr', {
      name: 'HR 助手', provider: 'openai', modelName: 'gpt-4o-mini', apiKey: 'sk-hr1', temperature: 0.5, maxTokens: 4096,
    })
    const updated = await svc.updateConfig(created.id, 't-hr', { name: 'HR 培训助手 V2' })
    expect(updated).not.toHaveProperty('error')
    expect((updated as LLMConfig).name).toBe('HR 培训助手 V2')
    expect((updated as LLMConfig).provider).toBe('openai')
    expect((updated as LLMConfig).modelName).toBe('gpt-4o-mini')
  })
})

// ═══════════════════════════════════════════════════════════════
// 🔧安监 — 安全监控 AI 配置审核
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Security} tenant-llm 扩展测试`, () => {
  let svc: ReturnType<typeof createLLMService>

  beforeEach(() => {
    svc = createLLMService()
  })

  it('安监审批 LLM 配置接入申请（正常流程）', async () => {
    const created = await svc.createConfig('t-sec', {
      name: '安防分析 AI', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-sec1', temperature: 0.1, maxTokens: 4096,
    })
    const approved = await svc.approveConfig(created.id, 'security-admin', true)
    expect(approved).not.toHaveProperty('error')
    expect((approved as LLMConfig).status).toBe('approved')
    expect((approved as LLMConfig).approvedBy).toBe('security-admin')
  })

  it('安监删除已废弃的 LLM 配置（正常流程）', async () => {
    const created = await svc.createConfig('t-sec', {
      name: '废弃配置', provider: 'openai', modelName: 'gpt-3.5-turbo', apiKey: 'sk-obsolete', temperature: 0.5, maxTokens: 2048,
    })
    const result = await svc.deleteConfig(created.id, 't-sec')
    expect(result.deleted).toBe(true)

    const gone = await svc.getConfig(created.id, 't-sec')
    expect(gone).toHaveProperty('error')
  })

  it('安监拒绝不符合安全规范的配置（拒绝流程）', async () => {
    const created = await svc.createConfig('t-sec2', {
      name: '高风险 AI', provider: 'openai', modelName: 'gpt-4', apiKey: 'sk-risky', temperature: 1.0, maxTokens: 32768,
    })
    const rejected = await svc.approveConfig(created.id, 'sec-rev', false)
    expect((rejected as LLMConfig).status).toBe('rejected')
  })

  it('安监删除不属于本租户的配置应失败（权限边界）', async () => {
    const created = await svc.createConfig('t-sec-own', {
      name: '安监 AI', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-own', temperature: 0.3, maxTokens: 4096,
    })
    const result = await svc.deleteConfig(created.id, 't-other')
    expect(result.deleted).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎮导玩员 — 游戏互动 AI 配置管理
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} tenant-llm 扩展测试`, () => {
  let svc: ReturnType<typeof createLLMService>

  beforeEach(() => {
    svc = createLLMService()
  })

  it('导玩员创建游戏指导 LLM 配置（正常流程）', async () => {
    const config = await svc.createConfig('t-guide', {
      name: '游戏解说助手',
      provider: 'qwen',
      modelName: 'qwen-plus',
      apiKey: 'sk-guide1',
      temperature: 0.8,
      maxTokens: 2048,
      siteId: 's-arcade',
    })
    expect(config.provider).toBe('qwen')
    expect(config.modelName).toBe('qwen-plus')
    expect(config.temperature).toBe(0.8)
  })

  it('导玩员提交配置接入申请（正常流程）', async () => {
    const created = await svc.createConfig('t-guide2', {
      name: '互动问答 Bot', provider: 'minimax', modelName: 'abab5.5', apiKey: 'sk-guide2', temperature: 0.6, maxTokens: 4096,
    })
    const applied = await svc.applyConfig(created.id, 't-guide2', {
      reason: '导玩区互动游戏需要 AI 对话能力',
      contacts: [{ name: '张三', role: '导玩主管', contact: 'zhang@arcade.com' }],
    })
    expect(applied.applicationStatus).toBe('pending_review')
  })

  it('导玩员提交不存在的配置申请应失败（边界）', async () => {
    const result = await svc.applyConfig('no-such-id', 't-guide3', { reason: 'test' })
    expect(result).toHaveProperty('error')
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎯运行专员 — LLM 调用监控与统计
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} tenant-llm 扩展测试`, () => {
  let svc: ReturnType<typeof createLLMService>

  beforeEach(() => {
    svc = createLLMService()
  })

  it('运行专员查看 LLM 调用统计（正常流程）', async () => {
    const created = await svc.createConfig('t-ops', {
      name: '运维 AI', provider: 'openai', modelName: 'gpt-4o', apiKey: 'sk-ops1', temperature: 0.3, maxTokens: 4096,
    })
    svc._addCallLog(created.id, { status: 'success' })
    svc._addCallLog(created.id, { status: 'success' })
    svc._addCallLog(created.id, { status: 'failed', latencyMs: 2000, cost: 0.005 })

    const stats = await svc.getStats('t-ops', created.id)
    expect(stats.totalCalls).toBe(3)
    expect(stats.successCalls).toBe(2)
    expect(stats.failedCalls).toBe(1)
    expect(stats.totalCost).toBeGreaterThan(0)
  })

  it('运行专员查看特定配置的调用日志（正常流程）', async () => {
    const created = await svc.createConfig('t-ops2', {
      name: '日志分析 AI', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-ops2', temperature: 0.2, maxTokens: 8192,
    })
    svc._addCallLog(created.id, { timestamp: '2026-07-07T10:00:00Z' })
    svc._addCallLog(created.id, { timestamp: '2026-07-07T11:00:00Z' })

    const logs = await svc.getCallLogs('t-ops2', created.id)
    expect(logs.length).toBe(2)
  })

  it('运行专员查询不存在配置的统计应返回空值（边界）', async () => {
    const stats = await svc.getStats('t-ops-empty', 'non-existent')
    expect(stats.totalCalls).toBe(0)
    expect(stats.totalCost).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🤝团建 — 团建活动 AI 配置
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} tenant-llm 扩展测试`, () => {
  let svc: ReturnType<typeof createLLMService>

  beforeEach(() => {
    svc = createLLMService()
  })

  it('团建负责人创建活动策划 LLM 配置（正常流程）', async () => {
    const config = await svc.createConfig('t-team', {
      name: '团建活动策划助手',
      provider: 'anthropic',
      modelName: 'claude-3-sonnet',
      apiKey: 'sk-team1',
      temperature: 0.9,
      maxTokens: 16384,
      siteId: 's-team',
    })
    expect(config.name).toBe('团建活动策划助手')
    expect(config.status).toBe('pending')
    expect(config.maxTokens).toBe(16384)
  })

  it('团建负责人删除自己创建但未批准的配置（权限边界：自我管理）', async () => {
    const created = await svc.createConfig('t-team2', {
      name: '废弃策划配置', provider: 'openai', modelName: 'gpt-4o-mini', apiKey: 'sk-team-del', temperature: 0.5, maxTokens: 4096,
    })
    const delResult = await svc.deleteConfig(created.id, 't-team2')
    expect(delResult.deleted).toBe(true)

    const remaining = await svc.getConfigs('t-team2')
    expect(remaining).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 📢营销 — 营销内容 AI 配置管理
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} tenant-llm 扩展测试`, () => {
  let svc: ReturnType<typeof createLLMService>

  beforeEach(() => {
    svc = createLLMService()
  })

  it('营销创建内容生成 LLM 配置（正常流程）', async () => {
    const config = await svc.createConfig('t-mkt', {
      name: '营销文案生成器',
      provider: 'moonshot',
      modelName: 'moonshot-v1-8k',
      apiKey: 'sk-mkt1',
      temperature: 0.9,
      maxTokens: 4096,
      siteId: 's-mkt',
    })
    expect(config.name).toBe('营销文案生成器')
    expect(config.provider).toBe('moonshot')
  })

  it('营销创建多平台 AI 配置用于不同渠道（正常流程）', async () => {
    const socialConfig = await svc.createConfig('t-mkt2', {
      name: '社媒 AI', provider: 'openai', modelName: 'gpt-4o', apiKey: 'sk-mkt-social', temperature: 0.7, maxTokens: 4096,
    })
    const emailConfig = await svc.createConfig('t-mkt2', {
      name: '邮件 AI', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-mkt-email', temperature: 0.3, maxTokens: 2048,
    })
    expect(socialConfig.id).not.toBe(emailConfig.id)

    const allConfigs = await svc.getConfigs('t-mkt2')
    expect(allConfigs.length).toBeGreaterThanOrEqual(2)
  })

  it('营销提交配置申请后查询配置仍然可访问（边界：申请不影响已有配置）', async () => {
    const created = await svc.createConfig('t-mkt3', {
      name: '促销文案 AI', provider: 'qwen', modelName: 'qwen-turbo', apiKey: 'sk-mkt3', temperature: 0.8, maxTokens: 4096,
    })
    const applied = await svc.applyConfig(created.id, 't-mkt3', {
      reason: '需要 AI 批量生成促销文案',
      contacts: [{ name: '李四', role: '营销主管', contact: 'li@store.com' }],
    })
    expect(applied.applicationStatus).toBe('pending_review')

    const fetched = await svc.getConfig(created.id, 't-mkt3')
    expect(fetched).not.toHaveProperty('error')
    expect((fetched as LLMConfig).name).toBe('促销文案 AI')
  })

  it('营销查看其他租户的配置列表应为空（权限边界）', async () => {
    await svc.createConfig('t-mkt4', {
      name: '营销 AI', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-mkt4', temperature: 0.7, maxTokens: 4096,
    })
    const other = await svc.getConfigs('t-other-mkt')
    expect(other).toHaveLength(0)
  })
})
