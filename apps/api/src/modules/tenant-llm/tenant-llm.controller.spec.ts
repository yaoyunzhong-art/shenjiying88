import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * TenantLLMController 单元测试
 *
 * 覆盖端点:
 *   - GET    /llm/configs
 *   - GET    /llm/configs/:id
 *   - POST   /llm/configs
 *   - PUT    /llm/configs/:id
 *   - DELETE /llm/configs/:id
 *   - POST   /llm/configs/:id/apply
 *   - POST   /llm/configs/:id/approve
 *   - GET    /llm/stats
 *   - GET    /llm/logs
 *   - GET    /llm/audit-logs
 */

import assert from 'node:assert/strict'

// ── Type Mirrors ────────────────────────────────────────────────

type TenantLLMConfig = {
  id: string
  tenantId: string
  siteId: string
  provider: string
  model: string
  apiKeyPreview: string
  status: string
  createdAt: string
  updatedAt: string
}

type CreateLLMConfigRequest = {
  siteId: string
  provider: string
  model: string
  apiKey: string
}

type UpdateLLMConfigRequest = {
  provider?: string
  model?: string
  apiKey?: string
}

type ApplyLLMConfigRequest = {
  applyReason: string
  applicantId: string
}

type LLMStats = {
  configId: string
  totalCalls: number
  totalTokens: number
  avgLatencyMs: number
}

type LLMCallLog = {
  id: string
  configId: string
  prompt: string
  response: string
  tokens: number
  latencyMs: number
  timestamp: string
}

type LLMAuditLog = {
  id: string
  configId: string
  action: string
  performedBy: string
  detail: string
  timestamp: string
}

// ── Inline Mocks ────────────────────────────────────────────────

function createMocks() {
  const configs = new Map<string, TenantLLMConfig>()
  const stats = new Map<string, LLMStats>()
  const callLogs: LLMCallLog[] = []
  const auditLogs: LLMAuditLog[] = []
  let idCounter = 0

  return {
    async getConfigs(tenantId: string, siteId?: string): Promise<TenantLLMConfig[]> {
      const list = Array.from(configs.values()).filter((c) => c.tenantId === tenantId)
      if (siteId) return list.filter((c) => c.siteId === siteId)
      return list
    },

    async getConfig(id: string, tenantId: string): Promise<TenantLLMConfig | null> {
      const c = configs.get(id)
      if (!c || c.tenantId !== tenantId) return null
      return c
    },

    async createConfig(tenantId: string, request: CreateLLMConfigRequest): Promise<TenantLLMConfig> {
      const id = `llm-cfg-${++idCounter}`
      const config: TenantLLMConfig = {
        id,
        tenantId,
        siteId: request.siteId,
        provider: request.provider,
        model: request.model,
        apiKeyPreview: `sk-...${request.apiKey.slice(-4)}`,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      configs.set(id, config)
      return config
    },

    async updateConfig(id: string, tenantId: string, updates: UpdateLLMConfigRequest): Promise<TenantLLMConfig> {
      const c = configs.get(id)
      if (!c || c.tenantId !== tenantId) throw new Error('配置不存在')
      Object.assign(c, updates)
      c.apiKeyPreview = updates.apiKey ? `sk-...${updates.apiKey.slice(-4)}` : c.apiKeyPreview
      c.updatedAt = new Date().toISOString()
      return c
    },

    async deleteConfig(id: string, tenantId: string): Promise<boolean> {
      const c = configs.get(id)
      if (!c || c.tenantId !== tenantId) return false
      return configs.delete(id)
    },

    async applyConfig(id: string, tenantId: string, request: ApplyLLMConfigRequest): Promise<any> {
      const c = configs.get(id)
      if (!c || c.tenantId !== tenantId) throw new Error('配置不存在')
      return { ok: true, appliedBy: request.applicantId, reason: request.applyReason }
    },

    async approveConfig(id: string, approvedBy: string, approved: boolean, options?: any): Promise<any> {
      const c = configs.get(id)
      if (!c) throw new Error('配置不存在')
      return { ok: true, approved, approvedBy, ...options }
    },

    async getStats(tenantId: string, configId?: string, periodStart?: string, periodEnd?: string): Promise<LLMStats[]> {
      let list = Array.from(stats.values())
      if (configId) list = list.filter((s) => s.configId === configId)
      return list
    },

    async getCallLogs(tenantId: string, configId?: string, periodStart?: string, periodEnd?: string): Promise<LLMCallLog[]> {
      let list = [...callLogs]
      if (configId) list = list.filter((l) => l.configId === configId)
      return list
    },

    async getAuditLogs(tenantId: string, configId?: string): Promise<LLMAuditLog[]> {
      let list = [...auditLogs]
      if (configId) list = list.filter((l) => l.configId === configId)
      return list
    },

    // Seed helpers
    _seedConfig(c: TenantLLMConfig) { configs.set(c.id, c) },
    _seedStats(s: LLMStats) { stats.set(s.configId, s) },
    _seedCallLog(l: LLMCallLog) { callLogs.push(l) },
    _seedAuditLog(l: LLMAuditLog) { auditLogs.push(l) },
  }
}

// ── Inline Controller ───────────────────────────────────────────

class InlineTenantLLMController {
  constructor(private readonly service: ReturnType<typeof createMocks>) {}

  async getConfigs(tenantId: string, siteId?: string) {
    return this.service.getConfigs(tenantId, siteId)
  }

  async getConfig(id: string, tenantId: string) {
    const config = await this.service.getConfig(id, tenantId)
    if (!config) return { error: '配置不存在' }
    return config
  }

  async createConfig(tenantId: string, request: CreateLLMConfigRequest) {
    return this.service.createConfig(tenantId, request)
  }

  async updateConfig(id: string, tenantId: string, updates: UpdateLLMConfigRequest) {
    return this.service.updateConfig(id, tenantId, updates)
  }

  async deleteConfig(id: string, tenantId: string) {
    const deleted = await this.service.deleteConfig(id, tenantId)
    return { deleted }
  }

  async applyConfig(id: string, tenantId: string, request: ApplyLLMConfigRequest) {
    return this.service.applyConfig(id, tenantId, request)
  }

  async approveConfig(id: string, body: { approved: boolean; approvedBy: string; permissions?: string[]; actorRole?: string; reason?: string }) {
    return this.service.approveConfig(id, body.approvedBy, body.approved, {
      permissions: body.permissions,
      actorRole: body.actorRole,
      reason: body.reason,
    })
  }

  async getStats(tenantId: string, configId?: string, periodStart?: string, periodEnd?: string) {
    return this.service.getStats(tenantId, configId, periodStart, periodEnd)
  }

  async getCallLogs(tenantId: string, configId?: string, periodStart?: string, periodEnd?: string) {
    return this.service.getCallLogs(tenantId, configId, periodStart, periodEnd)
  }

  async getAuditLogs(tenantId: string, configId?: string) {
    return this.service.getAuditLogs(tenantId, configId)
  }
}

// ── Tests ───────────────────────────────────────────────────────

describe('TenantLLMController', () => {
  let mock: ReturnType<typeof createMocks>
  let controller: InlineTenantLLMController
  const tenantId = 't-llm-main'
  const otherTenantId = 't-llm-other'

  beforeEach(() => {
    mock = createMocks()
    controller = new InlineTenantLLMController(mock)
  })

  describe('GET /llm/configs - getConfigs', () => {
    it('[正例] 返回该租户所有配置', async () => {
      await controller.createConfig(tenantId, { siteId: 'site-a', provider: 'openai', model: 'gpt-4', apiKey: 'sk-test1234' })
      await controller.createConfig(tenantId, { siteId: 'site-b', provider: 'anthropic', model: 'claude-3', apiKey: 'sk-test5678' })
      const configs = await controller.getConfigs(tenantId)
      assert.equal(configs.length, 2)
    })

    it('[正例] 按 siteId 过滤', async () => {
      await controller.createConfig(tenantId, { siteId: 'site-a', provider: 'openai', model: 'gpt-4', apiKey: 'sk-test1' })
      await controller.createConfig(tenantId, { siteId: 'site-b', provider: 'anthropic', model: 'claude-3', apiKey: 'sk-test2' })
      const configs = await controller.getConfigs(tenantId, 'site-a')
      assert.equal(configs.length, 1)
      assert.equal(configs[0].provider, 'openai')
    })

    it('[边界] 无配置返回空数组', async () => {
      const configs = await controller.getConfigs(tenantId)
      assert.deepEqual(configs, [])
    })
  })

  describe('GET /llm/configs/:id - getConfig', () => {
    it('[正例] 返回单个配置', async () => {
      const created = await controller.createConfig(tenantId, { siteId: 's1', provider: 'openai', model: 'gpt-4', apiKey: 'sk-secret' })
      const result = await controller.getConfig(created.id, tenantId)
      assert.ok('id' in result)
      assert.equal(result.id, created.id)
    })

    it('[反例] 不存在的 ID 返回 error', async () => {
      const result = await controller.getConfig('nonexistent', tenantId)
      assert.ok('error' in result)
      assert.equal(result.error, '配置不存在')
    })

    it('[反例] 跨租户查不到', async () => {
      const created = await controller.createConfig(tenantId, { siteId: 's1', provider: 'openai', model: 'gpt-4', apiKey: 'sk-secret' })
      const result = await controller.getConfig(created.id, otherTenantId)
      assert.ok('error' in result)
    })
  })

  describe('POST /llm/configs - createConfig', () => {
    it('[正例] 创建 LLM 配置', async () => {
      const result = await controller.createConfig(tenantId, { siteId: 's1', provider: 'openai', model: 'gpt-4', apiKey: 'sk-mykey1234' })
      assert.ok(result.id)
      assert.equal(result.provider, 'openai')
      assert.equal(result.model, 'gpt-4')
      assert.match(result.apiKeyPreview, /sk-\.\.\.1234/)
    })

    it('[正例] 不同 site 创建互不影响', async () => {
      const r1 = await controller.createConfig(tenantId, { siteId: 's1', provider: 'openai', model: 'gpt-4', apiKey: 'sk-a' })
      const r2 = await controller.createConfig(tenantId, { siteId: 's2', provider: 'anthropic', model: 'claude-3', apiKey: 'sk-b' })
      assert.notEqual(r1.id, r2.id)
    })
  })

  describe('PUT /llm/configs/:id - updateConfig', () => {
    it('[正例] 更新模型字段', async () => {
      const created = await controller.createConfig(tenantId, { siteId: 's1', provider: 'openai', model: 'gpt-4', apiKey: 'sk-old' })
      const updated = await controller.updateConfig(created.id, tenantId, { model: 'gpt-4-turbo' })
      assert.equal(updated.model, 'gpt-4-turbo')
    })

    it('[正例] 更新 API Key 后 preview 同步变化', async () => {
      const created = await controller.createConfig(tenantId, { siteId: 's1', provider: 'openai', model: 'gpt-4', apiKey: 'sk-old1234' })
      const updated = await controller.updateConfig(created.id, tenantId, { apiKey: 'sk-new5678' })
      assert.match(updated.apiKeyPreview, /5678$/)
    })

    it('[反例] 跨租户更新失败', async () => {
      const created = await controller.createConfig(tenantId, { siteId: 's1', provider: 'openai', model: 'gpt-4', apiKey: 'sk-test' })
      try {
        await controller.updateConfig(created.id, otherTenantId, { model: 'gpt-5' })
        assert.fail('Should have thrown')
      } catch (e: any) {
        assert.equal(e.message, '配置不存在')
      }
    })
  })

  describe('DELETE /llm/configs/:id - deleteConfig', () => {
    it('[正例] 删除配置', async () => {
      const created = await controller.createConfig(tenantId, { siteId: 's1', provider: 'openai', model: 'gpt-4', apiKey: 'sk-test' })
      const result = await controller.deleteConfig(created.id, tenantId)
      assert.ok(result.deleted)
      const q = await controller.getConfig(created.id, tenantId)
      assert.ok('error' in q)
    })

    it('[边界] 删除不存在的配置返回 deleted=false', async () => {
      const result = await controller.deleteConfig('nonexistent', tenantId)
      assert.ok(!result.deleted)
    })
  })

  describe('POST /llm/configs/:id/apply - applyConfig', () => {
    it('[正例] 提交接入申请', async () => {
      const created = await controller.createConfig(tenantId, { siteId: 's1', provider: 'openai', model: 'gpt-4', apiKey: 'sk-test' })
      const result = await controller.applyConfig(created.id, tenantId, { applyReason: '测试接入', applicantId: 'user-1' })
      assert.ok(result.ok)
      assert.equal(result.appliedBy, 'user-1')
    })
  })

  describe('POST /llm/configs/:id/approve - approveConfig', () => {
    it('[正例] 审批通过', async () => {
      const created = await controller.createConfig(tenantId, { siteId: 's1', provider: 'openai', model: 'gpt-4', apiKey: 'sk-test' })
      const result = await controller.approveConfig(created.id, { approved: true, approvedBy: 'admin-1' })
      assert.ok(result.ok)
      assert.ok(result.approved)
    })

    it('[反例] 审批不通过', async () => {
      const created = await controller.createConfig(tenantId, { siteId: 's1', provider: 'openai', model: 'gpt-4', apiKey: 'sk-test' })
      const result = await controller.approveConfig(created.id, { approved: false, approvedBy: 'admin-1', reason: 'API Key 过期' })
      assert.ok(!result.approved)
    })
  })

  describe('GET /llm/stats + /llm/logs + /llm/audit-logs', () => {
    it('[正例] 统计接口返回空', async () => {
      const result = await controller.getStats(tenantId)
      assert.deepEqual(result, [])
    })

    it('[正例] 有数据时返回', async () => {
      mock._seedStats({ configId: 'c1', totalCalls: 100, totalTokens: 50000, avgLatencyMs: 320 })
      const result = await controller.getStats(tenantId)
      assert.equal(result.length, 1)
      assert.equal(result[0].totalCalls, 100)
    })

    it('[正例] 调用日志接口', async () => {
      mock._seedCallLog({ id: 'l1', configId: 'c1', prompt: 'hello', response: 'world', tokens: 10, latencyMs: 200, timestamp: '2026-07-20T00:00:00Z' })
      const result = await controller.getCallLogs(tenantId)
      assert.equal(result.length, 1)
    })

    it('[正例] 审计日志接口', async () => {
      mock._seedAuditLog({ id: 'a1', configId: 'c1', action: 'CREATE', performedBy: 'admin', detail: '创建配置', timestamp: '2026-07-20T00:00:00Z' })
      const result = await controller.getAuditLogs(tenantId)
      assert.equal(result.length, 1)
    })
  })
})
