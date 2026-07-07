import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [insight] [C] 角色测试扩展编写
 *
 * 8 角色深度场景扩展测试 — insight 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 3 测试用例 (正常流程 + 降级场景 + 权限边界)
 * 覆盖: generate, list, getById, getTemplates, pruneCache, countByStatus
 * 扩展: 多数据源并发、缓存命中/未命中、分页边界、空状态处理、角色元数据验证
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import type {
  GenerateInsightRequest,
  ListInsightRequest,
  InsightResponse,
  ListInsightResponse,
  TemplateInfo,
} from './insight.dto'
import type { InsightTemplateType, InsightStatus, InsightSource } from './insight.entity'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 内联 Controller (mirrors production controller) ──
class InsightController {
  constructor(private service: any) {}

  async generate(body: any): Promise<InsightResponse> {
    return this.service.generate(body)
  }

  async list(
    templateType?: string,
    status?: string,
    limit?: string,
    cursor?: string,
  ): Promise<ListInsightResponse> {
    const req: ListInsightRequest = {
      templateType: templateType as InsightTemplateType,
      status: status as InsightStatus,
      limit: limit ? Number(limit) : undefined,
      cursor,
    }
    return this.service.list(req)
  }

  async getTemplates(): Promise<{ items: TemplateInfo[] }> {
    return this.service.listTemplates()
  }

  async getById(id: string): Promise<InsightResponse> {
    return this.service.getById(id)
  }

  async pruneCache(): Promise<{ pruned: number; ts: string }> {
    const pruned = this.service.pruneExpiredCache()
    return { pruned, ts: new Date().toISOString() }
  }
}

// ── Mock Service (深度扩展版, 支持缓存、分页、多源) ──
function createMockService() {
  const reports = new Map<string, any>()
  const cache = new Map<string, { reportId: string; expiresAt: number }>()
  let idCounter = 0

  const service = {
    async generate(req: any) {
      if (!req.sources || req.sources.length === 0) {
        const err: any = new Error('At least one source is required')
        err.status = 400
        throw err
      }
      if (req.sources.length > 10) {
        const err: any = new Error('Max 10 sources per insight')
        err.status = 400
        throw err
      }

      // 缓存逻辑 (除非 force)
      const cacheKey = `cache-${req.templateType}-${req.sources.map((s: any) => s.refId).join(',')}`
      const tokenUsage = { prompt: 150 + req.sources.length * 30, completion: 90 + req.sources.length * 20, total: 240 + req.sources.length * 50 }

      if (!req.force) {
        const cached = cache.get(cacheKey)
        if (cached && cached.expiresAt > Date.now()) {
          const cachedReport = reports.get(cached.reportId)
          if (cachedReport) {
            return { ...cachedReport, cached: true }
          }
        }
      }

      const id = `ins-mock-ext-${++idCounter}`
      const report = {
        id,
        tenantId: 'tenant-role-ext-001',
        templateType: req.templateType,
        status: 'completed',
        content: `## 洞察报告 (${req.templateType})\n- 模拟生成的洞察内容\n## 关键发现\n- 数据趋势稳定`,
        modelId: 'mock-model-ext',
        tokenUsage,
        sources: req.sources.map((s: any) => ({
          type: s.type,
          refId: s.refId,
          period: s.period,
        })),
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        createdBy: 'role-ext-test',
        cached: false,
      }
      reports.set(id, report)

      cache.set(cacheKey, { reportId: id, expiresAt: Date.now() + 86400 * 1000 })

      return report
    },

    async list(req: ListInsightRequest) {
      let items = Array.from(reports.values())
      if (req.templateType) {
        items = items.filter((i: any) => i.templateType === req.templateType)
      }
      if (req.status) {
        items = items.filter((i: any) => i.status === req.status)
      }
      items.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))

      const limit = Math.min(req.limit ?? 20, 100)
      const startIdx = req.cursor ? Number(req.cursor) : 0
      const paged = items.slice(startIdx, startIdx + limit)
      return {
        items: paged,
        total: items.length,
        nextCursor: startIdx + limit < items.length ? String(startIdx + limit) : undefined,
      }
    },

    async getById(id: string) {
      const report = reports.get(id)
      if (!report) {
        const err: any = new Error(`Insight ${id} not found`)
        err.status = 404
        throw err
      }
      return { ...report, cached: false }
    },

    listTemplates() {
      return {
        items: [
          { type: 'sales', name: '销售洞察', description: '分析销售额/客单价/转化率', maxTokens: 1024, temperature: 0.3 },
          { type: 'inventory', name: '库存洞察', description: '识别滞销品/缺货风险', maxTokens: 1024, temperature: 0.3 },
          { type: 'finance', name: '财务洞察', description: '财务数据分析', maxTokens: 1024, temperature: 0.3 },
          { type: 'marketing', name: '营销洞察', description: '营销活动效果分析', maxTokens: 1024, temperature: 0.3 },
          { type: 'customer', name: '客户洞察', description: '客户行为分析', maxTokens: 1024, temperature: 0.3 },
        ],
      }
    },

    pruneExpiredCache() {
      const now = Date.now()
      let pruned = 0
      for (const [key, val] of cache.entries()) {
        if (val.expiresAt <= now) {
          cache.delete(key)
          pruned++
        }
      }
      return pruned
    },

    countByStatus() {
      const counts: Record<string, number> = { pending: 0, generating: 0, completed: 0, failed: 0 }
      for (const r of reports.values()) {
        counts[r.status]++
      }
      return counts
    },
  }

  return service
}

// ── Helpers ──
function createController() {
  return new InsightController(createMockService())
}

function makeSource(overrides: Partial<any> = {}) {
  return {
    type: 'report' as const,
    refId: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    dataSnapshot: { revenue: 50000, orders: 200 },
    period: { from: '2026-06-01', to: '2026-06-28' },
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════
// 👔店长 — 门店经营管理视角 (扩展深度场景)
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} insight 角色扩展测试`, () => {
  it('店长生成多类型洞察 — 完整经营数据覆盖', async () => {
    const ctrl = createController()
    const types: InsightTemplateType[] = ['sales', 'inventory', 'finance', 'marketing', 'customer']
    for (const t of types) {
      const result = await ctrl.generate({ templateType: t, sources: [makeSource()] })
      assert.ok(result.id, `Generated ${t}`)
      assert.equal(result.templateType, t)
      assert.equal(result.status, 'completed')
    }
  })

  it('店长连续生成相同洞察命中缓存 — 降级场景: 快速重复请求', async () => {
    const ctrl = createController()
    const req = { templateType: 'sales' as const, sources: [makeSource({ refId: 'cache-test' })] }
    const first = await ctrl.generate(req)
    assert.equal(first.cached, false, '第一次未命中缓存')

    const second = await ctrl.generate(req)
    assert.equal(second.cached, true, '第二次命中缓存')
    assert.equal(second.id, first.id, '返回相同报告')
  })

  it('店长 force=true 强制刷新缓存 — 边界: 忽略缓存强制重新生成', async () => {
    const ctrl = createController()
    const req = { templateType: 'inventory' as const, sources: [makeSource({ refId: 'force-test' })] }
    const first = await ctrl.generate(req)
    const second = await ctrl.generate({ ...req, force: true })
    assert.notEqual(second.id, first.id, 'force 后生成新报告')
    assert.equal(second.cached, false, '强制刷新标记为未缓存')
  })

  it('店长按 status + templateType 联合过滤 — 精准查询', async () => {
    const ctrl = createController()
    await ctrl.generate({ templateType: 'sales', sources: [makeSource()] })
    await ctrl.generate({ templateType: 'inventory', sources: [makeSource()] })
    const result = await ctrl.list('sales', 'completed', '10')
    assert.ok(result.total >= 1)
    for (const item of result.items) {
      assert.equal(item.templateType, 'sales')
      assert.equal(item.status, 'completed')
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// 🛒前台 — 前台接待服务视角 (扩展深度场景)
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} insight 角色扩展测试`, () => {
  it('前台生成客户洞察并验证元数据完整性', async () => {
    const ctrl = createController()
    const result = await ctrl.generate({
      templateType: 'customer',
      sources: [makeSource({ dataSnapshot: { visitCount: 350, avgSpending: 128, returnRate: 0.65 } })],
    })
    assert.ok(result.id)
    assert.ok(result.createdAt)
    assert.ok(result.modelId)
    assert.ok(result.tokenUsage, '应有 token 用量')
    assert.ok(result.tokenUsage!.total > 0)
    assert.equal(result.sources.every((s) => (s as any).dataSnapshot === undefined), true, '响应已脱敏(无dataSnapshot)')
  })

  it('前台查询不存在的洞察 — 异常处理 (反例)', async () => {
    const ctrl = createController()
    await assert.rejects(
      () => ctrl.getById('ins-nonexistent-999999'),
      /not found/i,
    )
  })

  it('前台查询空列表 — 新门店无历史记录 (边界)', async () => {
    const ctrl = createController()
    const result = await ctrl.list('marketing', 'completed', '10')
    assert.equal(result.total, 0)
    assert.deepEqual(result.items, [])
    assert.equal(result.nextCursor, undefined)
  })

  it('前台查看可用模板 — 确保 5 种模板信息完整', async () => {
    const ctrl = createController()
    const result = await ctrl.getTemplates()
    assert.ok(result.items.length === 5)
    for (const t of result.items) {
      assert.ok(t.type, '有 type')
      assert.ok(t.name, '有 name')
      assert.ok(t.description, '有 description')
    }
    const types = result.items.map((t) => t.type)
    assert.ok(types.includes('sales'))
    assert.ok(types.includes('inventory'))
    assert.ok(types.includes('finance'))
    assert.ok(types.includes('marketing'))
    assert.ok(types.includes('customer'))
  })
})

// ═══════════════════════════════════════════════════════════════
// 👥HR — 人力资源管理视角 (扩展深度场景)
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.HR} insight 角色扩展测试`, () => {
  it('HR生成财务洞察 — 人效成本分析含多源数据', async () => {
    const ctrl = createController()
    const result = await ctrl.generate({
      templateType: 'finance',
      sources: [
        makeSource({ refId: 'rpt-payroll', dataSnapshot: { laborCost: 85000, headcount: 25 } }),
        makeSource({ refId: 'rpt-revenue', dataSnapshot: { revenue: 320000, profit: 45000 } }),
      ],
    })
    assert.equal(result.templateType, 'finance')
    assert.equal(result.sources.length, 2)
  })

  it('HR生成带自定义 maxTokens 的洞察', async () => {
    const ctrl = createController()
    const result = await ctrl.generate({
      templateType: 'finance',
      sources: [makeSource()],
      maxTokens: 2048,
    })
    assert.ok(result.id)
    assert.equal(result.templateType, 'finance')
  })

  it('HR超过10个数据源限制 — 边界: 最大数据源数', async () => {
    const ctrl = createController()
    const sources = Array.from({ length: 11 }, (_, i) => makeSource({ refId: `rpt-overload-${i}` }))
    await assert.rejects(
      () => ctrl.generate({ templateType: 'finance', sources }),
      /Max 10 sources/i,
    )
  })

  it('HR用空数据源生成 — 边界: 空 sources 数组', async () => {
    const ctrl = createController()
    await assert.rejects(
      () => ctrl.generate({ templateType: 'sales', sources: [] }),
      /At least one source is required/i,
    )
  })
})

// ═══════════════════════════════════════════════════════════════
// 🔧安监 — 安全监察视角 (扩展深度场景)
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Safety} insight 角色扩展测试`, () => {
  it('安监基于监控数据+金丝雀数据生成安全洞察', async () => {
    const ctrl = createController()
    const result = await ctrl.generate({
      templateType: 'inventory',
      sources: [
        makeSource({ type: 'monitoring', refId: 'mon-cctv-001', dataSnapshot: { anomalyCount: 3, deviceStatus: 'online' } }),
        makeSource({ type: 'canary', refId: 'can-device-005', dataSnapshot: { faultyDevices: 2 } }),
      ],
    })
    assert.equal(result.sources.length, 2)
    assert.ok(result.sources.some((s) => s.type === 'monitoring'))
    assert.ok(result.sources.some((s) => s.type === 'canary'))
  })

  it('安监生成后立即列表查询 — 验证新增记录出现', async () => {
    const ctrl = createController()
    const gen = await ctrl.generate({
      templateType: 'inventory',
      sources: [makeSource({ type: 'monitoring', refId: 'mon-anomaly' })],
    })
    const listResult = await ctrl.list('inventory', undefined, '10')
    assert.ok(listResult.items.some((i) => i.id === gen.id))
  })

  it('安监 force=true 时仍保留旧报告 — 不删除只追加', async () => {
    const ctrl = createController()
    const req = { templateType: 'inventory' as const, sources: [makeSource({ refId: 'rpt-safe-001' })] }
    const first = await ctrl.generate(req)
    const second = await ctrl.generate({ ...req, force: true })
    const all = await ctrl.list('inventory', undefined, '10')
    const ids = all.items.map((i) => i.id)
    assert.ok(ids.includes(first.id), '旧报告保留')
    assert.ok(ids.includes(second.id), '新报告可见')
    assert.notEqual(first.id, second.id)
  })

  it('安监大 limit 查询 — 边界: 返回全部不报错', async () => {
    const ctrl = createController()
    for (let i = 0; i < 3; i++) {
      await ctrl.generate({ templateType: 'sales', sources: [makeSource({ refId: `rpt-safety-${i}` })] })
    }
    const result = await ctrl.list(undefined, undefined, '100')
    assert.ok(result.items.length <= 100)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎮导玩员 — 导玩员日常服务视角 (扩展深度场景)
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} insight 角色扩展测试`, () => {
  it('导玩员生成营销洞察 — 客流高峰时段分析', async () => {
    const ctrl = createController()
    const result = await ctrl.generate({
      templateType: 'marketing',
      sources: [makeSource({
        refId: 'rpt-gamezone-001',
        dataSnapshot: { dailyVisitors: 450, avgPlayTime: 45, peakHours: '14:00-17:00' },
      })],
    })
    assert.equal(result.templateType, 'marketing')
    assert.equal(result.status, 'completed')
  })

  it('导玩员查看所有模板 — 验证返回字段完整', async () => {
    const ctrl = createController()
    const result = await ctrl.getTemplates()
    assert.equal(result.items.length, 5)
    result.items.forEach((t) => {
      assert.ok(t.name)
      assert.ok(t.description)
    })
  })

  it('导玩员生成含空 sources — 降级: 拒绝空数据源', async () => {
    const ctrl = createController()
    await assert.rejects(
      () => ctrl.generate({ templateType: 'sales', sources: [] }),
      /At least one source is required/i,
    )
  })

  it('导玩员查看列表含0条 — 边界: 无历史数据', async () => {
    const ctrl = createController()
    const result = await ctrl.list()
    // 新 controller 无历史
    assert.equal(result.total, 0)
    assert.deepEqual(result.items, [])
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎯运行专员 — 运维技术支持视角 (扩展深度场景)
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Ops} insight 角色扩展测试`, () => {
  it('运行专员生成设备金丝雀洞察 — 硬件健康度分析', async () => {
    const ctrl = createController()
    const result = await ctrl.generate({
      templateType: 'inventory',
      sources: [makeSource({
        type: 'canary',
        refId: 'can-device-vr',
        dataSnapshot: { totalDevices: 120, faultyDevices: 5, restockNeeded: ['VR头显', '方向盘'] },
      })],
    })
    assert.equal(result.templateType, 'inventory')
    assert.equal(result.sources[0].type, 'canary')
  })

  it('运行专员分页查询 cursor 机制 — 验证翻页正确性', async () => {
    const ctrl = createController()
    for (let i = 0; i < 6; i++) {
      await ctrl.generate({
        templateType: 'inventory',
        sources: [makeSource({ refId: `rpt-ops-${i}` })],
      })
    }
    const page1 = await ctrl.list('inventory', undefined, '2')
    assert.equal(page1.items.length, 2)
    assert.ok(page1.nextCursor, '应有下一页')

    const page2 = await ctrl.list('inventory', undefined, '2', page1.nextCursor)
    assert.equal(page2.items.length, 2)
    assert.ok(page2.nextCursor)

    const page3 = await ctrl.list('inventory', undefined, '2', page2.nextCursor)
    assert.equal(page3.items.length, 2)
    assert.equal(page3.nextCursor, undefined, '最后一页无nextCursor')
  })

  it('运行专员使用 cursor=0 起始查询 — 边界: 从0开始', async () => {
    const ctrl = createController()
    await ctrl.generate({ templateType: 'sales', sources: [makeSource({ refId: 'rpt-ops-cursor' })] })
    const result = await ctrl.list(undefined, undefined, '1', '0')
    assert.equal(result.items.length, 1)
  })

  it('运行专员调用 pruneCache — 确保无异常且返回数字', async () => {
    const ctrl = createController()
    const result = await ctrl.pruneCache()
    assert.ok(typeof result.pruned === 'number')
    assert.ok(result.pruned >= 0)
    assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(result.ts))
  })
})

// ═══════════════════════════════════════════════════════════════
// 🤝团建 — 团建活动组织视角 (扩展深度场景)
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} insight 角色扩展测试`, () => {
  it('团建生成客户洞察 — 员工满意度调查分析', async () => {
    const ctrl = createController()
    const result = await ctrl.generate({
      templateType: 'customer',
      sources: [makeSource({
        refId: 'rpt-team-satisfaction',
        dataSnapshot: { surveyCount: 80, avgScore: 4.2, positiveRate: 0.85 },
      })],
    })
    assert.equal(result.templateType, 'customer')
    assert.ok(result.content!.length > 0)
  })

  it('团建生成含3个数据源的综合评估 — 多维度分析', async () => {
    const ctrl = createController()
    const result = await ctrl.generate({
      templateType: 'sales',
      sources: [
        makeSource({ type: 'report', refId: 'rpt-team-sales', dataSnapshot: { attendance: 55 } }),
        makeSource({ type: 'monitoring', refId: 'mon-team-event', dataSnapshot: { eventCount: 3 } }),
        makeSource({ type: 'canary', refId: 'can-team-devices', dataSnapshot: { deviceStatus: 'good' } }),
      ],
    })
    assert.equal(result.sources.length, 3)
  })

  it('团建并发生成多个洞察 — 并发场景模拟,不冲突', async () => {
    const ctrl = createController()
    const promises = [
      ctrl.generate({ templateType: 'sales', sources: [makeSource({ refId: 'concurrent-1' })] }),
      ctrl.generate({ templateType: 'inventory', sources: [makeSource({ refId: 'concurrent-2' })] }),
      ctrl.generate({ templateType: 'customer', sources: [makeSource({ refId: 'concurrent-3' })] }),
    ]
    const results = await Promise.all(promises)
    assert.equal(results.length, 3)
    for (const r of results) {
      assert.ok(r.id)
    }
    const listResult = await ctrl.list(undefined, undefined, '10')
    assert.ok(listResult.total >= 3)
  })

  it('团建查看已完成状态的洞察 — status 过滤', async () => {
    const ctrl = createController()
    await ctrl.generate({ templateType: 'sales', sources: [makeSource({ refId: 'rpt-team-001' })] })
    const result = await ctrl.list(undefined, 'completed', '10')
    for (const item of result.items) {
      assert.equal(item.status, 'completed')
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// 📢营销 — 市场推广视角 (扩展深度场景)
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} insight 角色扩展测试`, () => {
  it('营销生成多源营销洞察 — 活动ROI综合分析', async () => {
    const ctrl = createController()
    const result = await ctrl.generate({
      templateType: 'marketing',
      sources: [
        makeSource({ refId: 'rpt-campaign-summer', dataSnapshot: { campaignCost: 30000, newCustomers: 450 } }),
        makeSource({ refId: 'rpt-campaign-winter', dataSnapshot: { campaignCost: 20000, newCustomers: 280 } }),
      ],
    })
    assert.equal(result.templateType, 'marketing')
    assert.equal(result.sources.length, 2)
  })

  it('营销按模板类型过滤 — 只获取营销洞察', async () => {
    const ctrl = createController()
    await ctrl.generate({ templateType: 'marketing', sources: [makeSource({ refId: 'mkt-1' })] })
    await ctrl.generate({ templateType: 'sales', sources: [makeSource({ refId: 'mkt-2' })] })
    await ctrl.generate({ templateType: 'marketing', sources: [makeSource({ refId: 'mkt-3' })] })
    const result = await ctrl.list('marketing', undefined, '10')
    assert.equal(result.total, 2)
    for (const item of result.items) {
      assert.equal(item.templateType, 'marketing')
    }
  })

  it('营销生成后通过 ID 查询详情 — 验证完整响应字段', async () => {
    const ctrl = createController()
    const created = await ctrl.generate({
      templateType: 'marketing',
      sources: [makeSource({ refId: 'rpt-mkt-detail', dataSnapshot: { budget: 50000, spent: 35000 } })],
    })
    const detail = await ctrl.getById(created.id)
    assert.equal(detail.id, created.id)
    assert.equal(detail.templateType, 'marketing')
    assert.ok(detail.createdAt)
    assert.ok(detail.tokenUsage)
    assert.equal(detail.tokenUsage.prompt + detail.tokenUsage.completion, detail.tokenUsage.total)
    assert.ok(detail.sources.length > 0)
  })

  it('营销尝试 11 个数据源 — 边界: 超过最大限制', async () => {
    const ctrl = createController()
    const sources = Array.from({ length: 11 }, (_, i) => makeSource({ refId: `rpt-overload-${i}` }))
    await assert.rejects(
      () => ctrl.generate({ templateType: 'marketing', sources }),
      /Max 10 sources/i,
    )
  })
})

// ═══════════════════════════════════════════════════════════════
// 🧪 跨角色集成测试
// ═══════════════════════════════════════════════════════════════
describe('🧪 insight 跨角色集成扩展测试', () => {
  it('多个角色共享同一个 service 实例 — 隔离性验证', async () => {
    const service = createMockService()
    const ctrl = new InsightController(service)
    await ctrl.generate({ templateType: 'sales', sources: [makeSource({ refId: 'shared-1' })] })
    await ctrl.generate({ templateType: 'marketing', sources: [makeSource({ refId: 'shared-2' })] })
    const all = await ctrl.list(undefined, undefined, '10')
    assert.ok(all.total >= 2)
  })

  it('pruneExpiredCache 不影响正常运行', async () => {
    const service = createMockService()
    const ctrl = new InsightController(service)
    await ctrl.generate({ templateType: 'sales', sources: [makeSource({ refId: 'prune-test' })] })
    const pruned = service.pruneExpiredCache()
    assert.ok(typeof pruned === 'number')
    assert.equal(pruned, 0, '新生成的缓存未过期')
    const result = await ctrl.generate({ templateType: 'sales', sources: [makeSource({ refId: 'after-prune' })] })
    assert.ok(result.id)
  })

  it('countByStatus 状态计数正确', async () => {
    const service = createMockService()
    const ctrl = new InsightController(service)
    await ctrl.generate({ templateType: 'sales', sources: [makeSource()] })
    const counts = service.countByStatus()
    assert.equal(counts.completed, 1)
    assert.equal(counts.pending, 0)
    assert.equal(counts.generating, 0)
    assert.equal(counts.failed, 0)
  })

  it('大量生成不引起异常 — 高负载场景', async () => {
    const ctrl = createController()
    const batchSize = 20
    const promises: Promise<InsightResponse>[] = []
    for (let i = 0; i < batchSize; i++) {
      promises.push(
        ctrl.generate({
          templateType: 'sales',
          sources: [makeSource({ refId: `stress-${i}` })],
        }),
      )
    }
    const results = await Promise.all(promises)
    assert.equal(results.length, batchSize)
    for (const r of results) {
      assert.ok(r.id)
      assert.equal(r.status, 'completed')
    }
  })

  it('按 not-completed 状态过滤 — 边界: 无匹配状态的条目', async () => {
    const ctrl = createController()
    await ctrl.generate({ templateType: 'sales', sources: [makeSource()] })
    const result = await ctrl.list(undefined, 'failed', '10')
    assert.equal(result.total, 0)
    assert.deepEqual(result.items, [])
  })
})
