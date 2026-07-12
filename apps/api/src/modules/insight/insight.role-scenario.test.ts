import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
/**
 * 🐜 自动: [insight] [C] 角色场景联合测试
 *
 * 8 角色跨场景协作测试 — insight 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色代表一个真实业务场景，测试洞察模块在实际门店运营中的使用流程。
 * 覆盖：generate、list、getById、templates、cache/prune、delete
 * 测试类型：正常流程、拦截器/中间件边界、角色数据隔离、空状态、并发竞争
 */

import 'reflect-metadata'
import {
  InsightService,
  type LLMProvider,
} from './insight.service'
import { AiModelConfigService } from '../ai-model-config/ai-model-config.service'
import { requireTenantContext } from '../../common/context/tenant-context'
import type { GenerateInsightRequest, InsightResponse } from './insight.dto'
import type { InsightTemplateType, InsightStatus } from './insight.entity'

// ── Role Emoji ──
// ── 角色定义（仅字符串值包含 emoji，变量名不含 emoji）──
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

// =============================================================
// Mock 基础设施
// =============================================================

/** Fixed LLM provider that returns a predictable response */
class FixedLLMProvider implements LLMProvider {
  async complete(req: {
    systemPrompt: string
    userPrompt: string
    maxTokens: number
    temperature: number
    apiKey: string
    endpointUrl: string
    modelName: string
  }) {
    return {
      content: `# 洞察报告 (${req.modelName})\n\n## 关键发现\n- 模拟 ${req.systemPrompt.slice(0, 20)}\n\n## 行动建议\n- 持续监控核心指标`,
      promptTokens: req.userPrompt.length,
      completionTokens: 120,
    }
  }
}

/** Deterministic clock for testing */
let mockNow = 1700000000000

/** Tenant context stub */
interface TenantStub {
  tenantId: string
  storeId: string
  userId: string
}

let currentTenant: TenantStub = {
  tenantId: 'tenant-test-001',
  storeId: 'store-arcade-001',
  userId: 'user-role-test',
}

vi.mock('../../common/context/tenant-context', () => ({
  requireTenantContext: () => currentTenant,
}))

/** Mock AiModelConfigService */
function createMockAiConfig() {
  return {
    getCurrentConfig: vi.fn().mockResolvedValue({
      id: 'config-mock-llm',
      provider: 'deepseek-chat',
      modelName: 'deepseek-chat',
      endpointUrl: 'https://api.deepseek.com/v1',
      storeId: currentTenant.storeId,
      tenantId: currentTenant.tenantId,
    }),
    getDecryptedApiKey: vi.fn().mockResolvedValue('sk-mock-decrypted-key'),
  } as unknown as AiModelConfigService
}

/** Factory to create fresh InsightService for each test */
function createService() {
  const service = new InsightService(createMockAiConfig())
  service.setLLMProvider(new FixedLLMProvider())
  return service
}

// =============================================================
// 辅助 Builder
// =============================================================

function genSources(type: string = 'report', count: number = 1) {
  return Array.from({ length: count }, (_, i) => ({
    type: type as 'report' | 'canary' | 'monitoring',
    refId: `ref-${type}-${i + 1}`,
    dataSnapshot: { value: 100 * (i + 1), label: `source-${i + 1}` },
    period: { from: '2026-06-01', to: '2026-06-30' },
  }))
}

function makeRequest(
  overrides: Partial<GenerateInsightRequest> = {},
): GenerateInsightRequest {
  return {
    templateType: 'sales' as InsightTemplateType,
    sources: genSources('report', 2),
    ...overrides,
  } as GenerateInsightRequest
}

async function generate(
  service: InsightService,
  req: GenerateInsightRequest,
): Promise<InsightResponse> {
  // Simulate endpoint call
  return service.generate(req)
}

// ══════════════════════════════════════════════════════════════════
// 👔 店长 — 门店营收洞察与经营决策
// ══════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} insight 场景测试`, () => {
  let service: InsightService

  beforeEach(() => {
    service = createService()
    currentTenant = { tenantId: 'store-owner-tenant', storeId: 'store-001', userId: 'manager-01' }
  })

  it('店长生成月度销售洞察 → 成功返回结构化报告', async () => {
    const res = await generate(service, {
      templateType: 'sales',
      sources: genSources('report', 3),
    })
    expect(res.status).toBe('completed')
    expect(res.templateType).toBe('sales')
    expect(res.content).toContain('洞察报告')
    expect(res.sources).toHaveLength(3)
    expect(res.tokenUsage?.total).toBeGreaterThan(0)
    expect(res.cached).toBe(false)
  })

  it('店长查询相同数据源两次 → 第二次命中缓存', async () => {
    const req = makeRequest({ templateType: 'sales', sources: genSources('report', 2) })
    const first = await generate(service, req)
    expect(first.cached).toBe(false)

    const second = await generate(service, req)
    expect(second.cached).toBe(true)
    expect(second.id).toBe(first.id)
  })

  it('店长查询不存在的 insight → 抛出 404', async () => {
    await expect(service.getById('non-existent-id')).rejects.toThrow(/not found/i)
  })

  it('店长无法看到其他门店的洞察数据（租户隔离）', async () => {
    const res = await generate(service, makeRequest())
    // Switch tenant
    currentTenant = { tenantId: 'other-store-tenant', storeId: 'store-999', userId: 'manager-02' }
    await expect(service.getById(res.id)).rejects.toThrow(/not found/i)
  })
})

// ══════════════════════════════════════════════════════════════════
// 🛒 前台 — 日常运营数据查看
// ══════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} insight 场景测试`, () => {
  let service: InsightService

  beforeEach(() => {
    service = createService()
    currentTenant = { tenantId: 'front-desk-tenant', storeId: 'store-002', userId: 'frontdesk-01' }
  })

  it('前台列出所有洞察模板 → 返回 5 种模板', async () => {
    const { listTemplates } = await import('./insight.prompt')
    const items = listTemplates()
    expect(items).toHaveLength(5)
    const types = items.map(t => t.type)
    expect(types).toContain('sales')
    expect(types).toContain('inventory')
    expect(types).toContain('finance')
    expect(types).toContain('marketing')
    expect(types).toContain('customer')
  })

  it('前台分页查看已有洞察 → 正确分页', async () => {
    const ids: string[] = []
    for (let i = 0; i < 5; i++) {
      const res = await generate(service, makeRequest({
        templateType: (['sales','inventory','finance','marketing','customer'] as const)[i],
        sources: genSources('report', 1),
      }))
      ids.push(res.id)
    }
    expect(ids).toHaveLength(5)

    const page1 = await service.list({ limit: 3 })
    expect(page1.items.length).toBeLessThanOrEqual(3)
    expect(page1.total).toBeGreaterThanOrEqual(3)

    if (page1.nextCursor) {
      const page2 = await service.list({ limit: 3, cursor: page1.nextCursor })
      expect(page2.items.length).toBeGreaterThanOrEqual(0)
    }
  })

  it('前台无洞察时列表为空', async () => {
    const res = await service.list({ limit: 10 })
    expect(res.items).toHaveLength(0)
    expect(res.total).toBe(0)
    expect(res.nextCursor).toBeUndefined()
  })
})

// ══════════════════════════════════════════════════════════════════
// 👥HR — 洞察管理合规与审计
// ══════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} insight 场景测试`, () => {
  let service: InsightService

  beforeEach(() => {
    service = createService()
    currentTenant = { tenantId: 'hr-tenant', storeId: 'store-003', userId: 'hr-admin-01' }
  })

  it('HR 删除已完成的洞察 → 成功并清缓存', async () => {
    const res = await generate(service, makeRequest())
    expect(res.status).toBe('completed')

    const delResult = service.deleteInsight(res.id)
    expect(delResult.deleted).toBe(true)

    await expect(service.getById(res.id)).rejects.toThrow(/not found/i)
  })

  it('HR 删除不存在的洞察 → 抛出 404', async () => {
    try {
      service.deleteInsight('no-such-id')
      expect.unreachable('should have thrown')
    } catch (e: any) {
      expect(e.message).toMatch(/not found/i)
    }
  })

  it('HR 不能删除其他门店的洞察', async () => {
    const res = await generate(service, makeRequest())
    currentTenant = { tenantId: 'other-hr', storeId: 'store-003', userId: 'hr-diff-01' }
    try {
      service.deleteInsight(res.id)
      expect.unreachable('should have thrown')
    } catch (e: any) {
      expect(e.message).toMatch(/not found/i)
    }
  })
})

// ══════════════════════════════════════════════════════════════════
// 🔧安监 — 系统安全与异常监控
// ══════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} insight 场景测试`, () => {
  let service: InsightService

  beforeEach(() => {
    service = createService()
    currentTenant = { tenantId: 'security-tenant', storeId: 'store-004', userId: 'security-01' }
  })

  it('安监生成带有异常数据的洞察 → 仍返回 completed（降级机制）', async () => {
    const req = makeRequest({
      templateType: 'inventory',
      sources: genSources('report', 1).map(s => ({
        ...s,
        dataSnapshot: { value: -1, alert: 'NEGATIVE_STOCK', label: 'stock-error' },
      })),
    })
    const res = await generate(service, req)
    expect(res.status).toBe('completed')
    expect(res.content).toBeTruthy()
  })

  it('安监强制刷新缓存（force=true）→ 忽略缓存生成新报告', async () => {
    const req = makeRequest({ templateType: 'marketing' })
    const first = await generate(service, req)
    expect(first.cached).toBe(false)

    const second = await generate(service, req)
    expect(second.cached).toBe(true)

    const forced = await generate(service, { ...req, force: true } as GenerateInsightRequest)
    expect(forced.cached).toBe(false)
    expect(forced.id).not.toBe(first.id)
  })

  it('安监清理过期缓存 → 返回清理数量', async () => {
    // 生成报告（放入缓存）
    await generate(service, makeRequest())
    const pruned = service.pruneExpiredCache()
    expect(typeof pruned).toBe('number')
  })
})

// ══════════════════════════════════════════════════════════════════
// 🎮导玩员 — 游戏区运营数据分析
// ══════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} insight 场景测试`, () => {
  let service: InsightService

  beforeEach(() => {
    service = createService()
    currentTenant = { tenantId: 'arcade-tenant', storeId: 'store-005', userId: 'guide-01' }
  })

  it('导玩员生成顾客洞察 → 成功返回客户分析', async () => {
    const res = await generate(service, {
      templateType: 'customer',
      sources: genSources('report', 2),
    })
    expect(res.status).toBe('completed')
    expect(res.templateType).toBe('customer')
    expect(res.content).toBeTruthy()
  })

  it('导玩员按客户洞察模板类型筛选列表', async () => {
    const r1 = await generate(service, { templateType: 'customer', sources: genSources('report', 1) })
    await generate(service, { templateType: 'sales', sources: genSources('report', 1) })
    const r2 = await generate(service, { templateType: 'customer', sources: genSources('report', 1) })

    expect(r1.templateType).toBe('customer')
    expect(r2.templateType).toBe('customer')

    const filtered = await service.list({ templateType: 'customer' })
    expect(filtered.items.length).toBeGreaterThanOrEqual(1)
    expect(filtered.items.every(i => i.templateType === 'customer')).toBe(true)
  })

  it('导玩员提供空 sources → 被拒绝 400', async () => {
    await expect(generate(service, makeRequest({ sources: [] }))).rejects.toThrow(
      /At least one source is required/i,
    )
  })
})

// ══════════════════════════════════════════════════════════════════
// 🎯运行专员 — 系统运维与性能监控
// ══════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} insight 场景测试`, () => {
  let service: InsightService

  beforeEach(() => {
    service = createService()
    currentTenant = { tenantId: 'ops-tenant', storeId: 'store-006', userId: 'ops-01' }
  })

  it('运行专员统计各状态洞察数量', async () => {
    const counts = service.countByStatus()
    expect(counts).toHaveProperty('pending', 0)
    expect(counts).toHaveProperty('generating', 0)
    expect(counts).toHaveProperty('completed', 0)
    expect(counts).toHaveProperty('failed', 0)
  })

  it('运行专员检查未配置 AI 模型时的报错 → 友好提示', async () => {
    // Override the getCurrentConfig to return null
    const badService = createService()
    vi.spyOn(badService as any, 'getActiveAiConfig').mockResolvedValue(null)

    await expect(
      generate(badService, makeRequest({ templateType: 'finance' })),
    ).rejects.toThrow(/No active AI model configured/i)
  })

  it('运行专员生成大量洞察后分页 → 分页不超过 limit', async () => {
    const ids: string[] = []
    for (let i = 0; i < 5; i++) {
      const res = await generate(service, makeRequest({
        templateType: (['sales', 'inventory', 'finance', 'marketing', 'customer'] as const)[i % 5],
        sources: genSources('report', 1),
      }))
      ids.push(res.id)
    }
    expect(ids.length).toBe(5)
    const listRes = await service.list({ limit: 100 })
    expect(listRes.total).toBe(5)
    expect(listRes.items.length).toBeLessThanOrEqual(100)
  })
})

// ══════════════════════════════════════════════════════════════════
// 🤝团建 — 员工活动策划支持
// ══════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} insight 场景测试`, () => {
  let service: InsightService

  beforeEach(() => {
    service = createService()
    currentTenant = { tenantId: 'teambuilding-tenant', storeId: 'store-007', userId: 'tb-01' }
  })

  it('团建查看所有模板列表以决定分析类型', async () => {
    const { listTemplates } = await import('./insight.prompt')
    const templates = listTemplates()
    expect(templates.map(t => t.name)).toContain('客户洞察')
    expect(templates.map(t => t.name)).toContain('营销洞察')
  })

  it('团建生成带 marketing 类型的洞察 → 视图正常', async () => {
    const res = await generate(service, {
      templateType: 'marketing',
      sources: genSources('monitoring', 2),
    })
    expect(res.status).toBe('completed')
    expect(res.sources).toHaveLength(2)
  })

  it('团建用 force=true 重复生成 → 两次都用新 ID', async () => {
    const req = makeRequest({ templateType: 'customer', sources: genSources('report', 1) })
    const a = await generate(service, { ...req, force: true } as GenerateInsightRequest)
    const b = await generate(service, { ...req, force: true } as GenerateInsightRequest)
    expect(a.id).not.toBe(b.id)
  })
})

// ══════════════════════════════════════════════════════════════════
// 📢营销 — 营销活动洞察
// ══════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} insight 场景测试`, () => {
  let service: InsightService

  beforeEach(() => {
    service = createService()
    currentTenant = { tenantId: 'marketing-tenant', storeId: 'store-008', userId: 'mkt-01' }
  })

  it('营销生成营销类型洞察 → 成功', async () => {
    const res = await generate(service, {
      templateType: 'marketing',
      sources: genSources('report', 2).map(s => ({
        ...s,
        dataSnapshot: { campaignName: '夏日促销', roi: 3.5, spend: 10000, revenue: 35000 },
      })),
    })
    expect(res.status).toBe('completed')
    expect(res.templateType).toBe('marketing')
  })

  it('营销请求 11 个数据源 → 被拒绝 400', async () => {
    const req = makeRequest({ sources: genSources('report', 11) })
    await expect(generate(service, req)).rejects.toThrow(/Max 10 sources/)
  })

  it('营销删除洞察后列表不包含已删除项', async () => {
    const res = await generate(service, makeRequest({ templateType: 'marketing' }))
    service.deleteInsight(res.id)
    const list = await service.list({ templateType: 'marketing' })
    expect(list.items.find(i => i.id === res.id)).toBeUndefined()
  })
})
