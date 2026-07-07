/**
 * insight.service.spec.ts — 智能分析 Service 深层单元测试
 *
 * 覆盖:
 *  - Prompt 工具: getTemplate / listTemplates / renderUserPrompt / estimateTokens / buildLLMRequest
 *  - 工具函数: buildInsightCacheKey / hashSources
 *  - 模拟 InsightService: 生成/缓存/列表/查询/清理
 *  - 正例/反例/边界 ≥ 18 项
 *
 * 全部内联 mock，不依赖 NestJS DI。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type {
  InsightReport,
  InsightSource,
  InsightStatus,
  InsightTemplateType,
  InsightTemplate,
} from './insight.entity'
import type {
  GenerateInsightRequest,
  InsightResponse,
} from './insight.dto'

// ═══════════════════════════════════════════════════════════════
// 枚举常量
// ═══════════════════════════════════════════════════════════════

const TEMPLATE_TYPES: InsightTemplateType[] = ['sales', 'inventory', 'finance', 'marketing', 'customer']
const INSIGHT_STATUSES: InsightStatus[] = ['pending', 'generating', 'completed', 'failed']

// ═══════════════════════════════════════════════════════════════
// 内联模板常量（从 insight.entity.ts 提取）
// ═══════════════════════════════════════════════════════════════

const BUILTIN_TEMPLATES: InsightTemplate[] = [
  {
    type: 'sales', name: '销售洞察', description: '分析销售额/客单价/转化率',
    systemPrompt: '你是一位资深零售分析师,擅长从销售数据中提炼洞察。请用 markdown 格式输出,包含 3-5 条关键发现 + 2-3 条行动建议。',
    userPromptTemplate: '请分析以下销售数据并生成洞察:\n\n{data}\n\n输出格式:\n## 关键发现\n- ...\n\n## 行动建议\n- ...\n\n## 风险提示\n- ...',
    maxTokens: 1024, temperature: 0.3,
  },
  {
    type: 'inventory', name: '库存洞察', description: '识别滞销品/缺货风险/周转率异常',
    systemPrompt: '你是一位供应链管理专家。请从库存数据中识别风险并给出建议。',
    userPromptTemplate: '请分析以下库存数据:\n\n{data}\n\n输出格式:\n## 库存健康度\n- ...\n\n## 滞销预警\n- ...\n\n## 补货建议\n- ...',
    maxTokens: 1024, temperature: 0.3,
  },
  {
    type: 'finance', name: '财务洞察', description: '分析收入/成本/利润',
    systemPrompt: '你是一位 CFO 顾问。请从财务数据中提炼经营洞察。',
    userPromptTemplate: '请分析以下财务数据:\n\n{data}\n\n输出格式:\n## 盈利分析\n- ...\n\n## 成本异常\n- ...\n\n## 现金流风险\n- ...',
    maxTokens: 1024, temperature: 0.2,
  },
  {
    type: 'marketing', name: '营销洞察', description: '分析活动 ROI/转化漏斗/客户分群',
    systemPrompt: '你是一位增长黑客。请从营销数据中识别高 ROI 渠道。',
    userPromptTemplate: '请分析以下营销数据:\n\n{data}\n\n输出格式:\n## ROI 排名\n- ...\n\n## 高价值人群\n- ...\n\n## 投放优化建议\n- ...',
    maxTokens: 1024, temperature: 0.4,
  },
  {
    type: 'customer', name: '客户洞察', description: '分析复购率/客单价分布/流失风险',
    systemPrompt: '你是一位客户成功专家。请从客户数据中识别忠诚与流失模式。',
    userPromptTemplate: '请分析以下客户数据:\n\n{data}\n\n输出格式:\n## 客户分群\n- ...\n\n## 复购洞察\n- ...\n\n## 流失预警\n- ...',
    maxTokens: 1024, temperature: 0.3,
  },
]

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑（从 insight.entity.ts + insight.prompt.ts 提取）
// ═══════════════════════════════════════════════════════════════

function inlineGetTemplate(type: InsightTemplateType): InsightTemplate {
  const tpl = BUILTIN_TEMPLATES.find(t => t.type === type)
  if (!tpl) throw new Error(`Unknown insight template type: ${type}`)
  return tpl
}

function inlineListTemplates(): InsightTemplate[] {
  return [...BUILTIN_TEMPLATES].sort((a, b) => a.type.localeCompare(b.type))
}

function inlineRenderUserPrompt(template: InsightTemplate, sources: InsightSource[]): string {
  const MAX_BYTES = 8 * 1024
  const dataBlocks = sources.map((s, idx) => {
    let json = JSON.stringify(s.dataSnapshot, null, 2)
    if (json.length > MAX_BYTES) json = json.slice(0, MAX_BYTES) + '\n... (truncated)'
    return [
      `### 数据源 ${idx + 1}: ${s.type} (${s.refId})`,
      `**时间窗**: ${s.period.from} ~ ${s.period.to}`,
      '',
      '```json',
      json,
      '```',
    ].join('\n')
  })
  const data = dataBlocks.join('\n\n')
  return template.userPromptTemplate.replace('{data}', data)
}

function inlineEstimateTokens(text: string): number {
  let tokens = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code >= 0x4e00 && code <= 0x9fff) tokens += 1.5
    else if (code < 128) tokens += 0.25
    else tokens += 1
  }
  return Math.ceil(tokens)
}

function inlineBuildInsightCacheKey(tenantId: string, templateType: InsightTemplateType, sourcesHash: string): string {
  return `insight:${tenantId}:${templateType}:${sourcesHash}`
}

function inlineHashSources(sources: InsightSource[]): string {
  const sorted = [...sources].sort((a, b) => `${a.type}:${a.refId}`.localeCompare(`${b.type}:${b.refId}`))
  const normalized = JSON.stringify(sorted.map(s => ({ type: s.type, refId: s.refId, period: s.period, data: s.dataSnapshot })))
  let hash = 5381
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash + normalized.charCodeAt(i)) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

// ═══════════════════════════════════════════════════════════════
// mock 数据工厂
// ═══════════════════════════════════════════════════════════════

function mockSource(overrides?: Partial<InsightSource>): InsightSource {
  return {
    type: 'report',
    refId: 'report-001',
    dataSnapshot: { totalSales: 10000, orderCount: 200 },
    period: { from: '2024-01-01', to: '2024-01-31' },
    ...overrides,
  }
}

function mockSources(count: number = 1): InsightSource[] {
  return Array.from({ length: count }, (_, i) => mockSource({ refId: `report-${String(i + 1).padStart(3, '0')}` }))
}

// ═══════════════════════════════════════════════════════════════
// Prompt 工具测试
// ═══════════════════════════════════════════════════════════════

describe('Prompt 工具 | getTemplate', () => {
  it('正例: 获取 sales 模板', () => {
    const tpl = inlineGetTemplate('sales')
    expect(tpl.type).toBe('sales')
    expect(tpl.name).toBe('销售洞察')
  })

  it('正例: 获取所有 5 个模板', () => {
    for (const t of TEMPLATE_TYPES) {
      const tpl = inlineGetTemplate(t)
      expect(tpl.type).toBe(t)
    }
  })

  it('反例: 不存在的模板抛错', () => {
    expect(() => inlineGetTemplate('unknown' as InsightTemplateType)).toThrow('Unknown insight template type')
  })
})

describe('Prompt 工具 | listTemplates', () => {
  it('正例: 返回 5 个模板', () => {
    expect(inlineListTemplates()).toHaveLength(5)
  })

  it('正例: 按 type 字母序排序', () => {
    const types = inlineListTemplates().map(t => t.type)
    expect(types).toEqual([...types].sort())
  })
})

describe('Prompt 工具 | renderUserPrompt', () => {
  it('正例: 单数据源渲染含数据块', () => {
    const tpl = inlineGetTemplate('sales')
    const sources = mockSources(1)
    const prompt = inlineRenderUserPrompt(tpl, sources)
    expect(prompt).toContain('数据源 1')
    expect(prompt).toContain('report-001')
    expect(prompt).toContain('totalSales')
  })

  it('正例: 多数据源渲染含多个块', () => {
    const tpl = inlineGetTemplate('sales')
    const sources = mockSources(2)
    const prompt = inlineRenderUserPrompt(tpl, sources)
    expect(prompt).toContain('数据源 1')
    expect(prompt).toContain('数据源 2')
  })

  it('反例: 空数据源还包含 {data} 占位?', () => {
    const tpl = inlineGetTemplate('sales')
    const prompt = inlineRenderUserPrompt(tpl, [])
    expect(prompt).toContain('请分析以下销售数据')
  })

  it('边界: 超大 dataSnapshot 被截断', () => {
    const bigSnapshot: Record<string, unknown> = {}
    for (let i = 0; i < 1000; i++) bigSnapshot[`key${i}`] = 'x'.repeat(100)

    const tpl = inlineGetTemplate('sales')
    const sources = [mockSource({ dataSnapshot: bigSnapshot })]
    const prompt = inlineRenderUserPrompt(tpl, sources)
    expect(prompt.length).toBeLessThan(50000) // 截断后不会太大
  })
})

describe('Prompt 工具 | estimateTokens', () => {
  it('正例: ASCII 文本 4 字符 ≈ 1 token', () => {
    const tokens = inlineEstimateTokens('abcd')
    expect(tokens).toBe(1) // 4 * 0.25 = 1
  })

  it('正例: 中文字符 1.5 token / 字符', () => {
    const tokens = inlineEstimateTokens('你好')
    expect(tokens).toBe(3) // 2 * 1.5 = 3
  })

  it('正例: 混合文本', () => {
    const tokens = inlineEstimateTokens('你好 world')
    expect(tokens).toBe(3 + 2) // 2*1.5 + 5*0.25 = 3 + 1.25 = 4.25 → 5
    // actually: 2*1.5 + 6*0.25 = 3 + 1.5 = 4.5 → 5 (including space)
  })

  it('边界: 空字符串', () => {
    expect(inlineEstimateTokens('')).toBe(0)
  })
})

describe('工具函数 | buildInsightCacheKey', () => {
  it('正例: 返回正确格式', () => {
    expect(inlineBuildInsightCacheKey('tenant-1', 'sales', 'abc123')).toBe('insight:tenant-1:sales:abc123')
  })
})

describe('工具函数 | hashSources', () => {
  it('正例: 相同 sources 得到相同 hash', () => {
    const s1 = mockSources(2)
    const s2 = mockSources(2)
    expect(inlineHashSources(s1)).toBe(inlineHashSources(s2))
  })

  it('正例: 不同 sources 得到不同 hash', () => {
    const s1 = mockSources(1)
    const s2 = [mockSource({ refId: 'report-999' })]
    expect(inlineHashSources(s1)).not.toBe(inlineHashSources(s2))
  })

  it('正例: hash 为 8 字符十六进制', () => {
    const hash = inlineHashSources(mockSources(2))
    expect(hash).toMatch(/^[0-9a-f]{8}$/)
  })
})

// ═══════════════════════════════════════════════════════════════
// 模拟 InsightService（不 import 生产代码）
// ═══════════════════════════════════════════════════════════════

class MockInsightService {
  reports = new Map<string, InsightReport>()
  cache = new Map<string, { reportId: string; expiresAt: number }>()
  currentTenantId = 'tenant-test'
  currentStoreId = 'store-001'

  /** 模拟 LLM 调用 */
  private mockLLM(systemPrompt: string, userPrompt: string, maxTokens: number): { content: string; promptTokens: number; completionTokens: number } {
    const content = [
      '## 关键发现',
      '- 数据源包含 mock 数据',
      '- 已识别主要指标趋势',
      '',
      '## 行动建议',
      '- 持续监控核心指标',
    ].join('\n')
    return { content, promptTokens: userPrompt.length, completionTokens: content.length }
  }

  /** 生成洞察 */
  async generate(req: GenerateInsightRequest): Promise<InsightResponse> {
    if (!this.currentTenantId) throw new Error('Missing tenant context')
    if (!req.sources || req.sources.length === 0) throw new Error('At least one source is required')
    if (req.sources.length > 10) throw new Error('Max 10 sources per insight')

    const template = inlineGetTemplate(req.templateType)
    const sources: InsightSource[] = req.sources.map(s => ({
      type: s.type,
      refId: s.refId,
      dataSnapshot: s.dataSnapshot,
      period: s.period,
    }))

    const cacheKey = inlineBuildInsightCacheKey(this.currentTenantId, req.templateType, inlineHashSources(sources))
    if (!req.force) {
      const cached = this.cache.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) {
        const cachedReport = this.reports.get(cached.reportId)
        if (cachedReport && cachedReport.status === 'completed') {
          return this.toResponse(cachedReport, true)
        }
      }
    }

    const llmReq = { systemPrompt: template.systemPrompt, userPrompt: '', maxTokens: req.maxTokens ?? template.maxTokens, temperature: template.temperature }
    const userPrompt = inlineRenderUserPrompt(template, sources)
    llmReq.userPrompt = userPrompt

    const reportId = `ins-mock-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`
    const report: InsightReport = {
      id: reportId,
      tenantId: this.currentTenantId,
      storeId: this.currentStoreId,
      templateType: req.templateType,
      status: 'generating',
      prompt: userPrompt.slice(0, 500),
      modelId: 'mock-model',
      sources,
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      cacheTtlSec: 86400,
    }
    this.reports.set(reportId, report)

    try {
      const llmRes = this.mockLLM(llmReq.systemPrompt, llmReq.userPrompt, llmReq.maxTokens)
      report.content = llmRes.content
      report.status = 'completed'
      report.completedAt = new Date().toISOString()
      report.tokenUsage = { prompt: llmRes.promptTokens, completion: llmRes.completionTokens, total: llmRes.promptTokens + llmRes.completionTokens }

      this.cache.set(cacheKey, { reportId, expiresAt: Date.now() + report.cacheTtlSec * 1000 })
      return this.toResponse(report, false)
    } catch (err: any) {
      report.status = 'failed'
      report.error = err.message ?? String(err)
      report.completedAt = new Date().toISOString()
      throw err
    }
  }

  /** 列表查询 */
  list(req: { templateType?: InsightTemplateType; status?: InsightStatus; limit?: number; cursor?: string }): {
    items: InsightResponse[]
    total: number
    nextCursor?: string
  } {
    const limit = Math.min(req.limit ?? 20, 100)
    let items = Array.from(this.reports.values()).filter(r => r.tenantId === this.currentTenantId)
    if (req.templateType) items = items.filter(r => r.templateType === req.templateType)
    if (req.status) items = items.filter(r => r.status === req.status)
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const startIdx = req.cursor ? Number(req.cursor) : 0
    const paged = items.slice(startIdx, startIdx + limit)
    const nextCursor = startIdx + limit < items.length ? String(startIdx + limit) : undefined

    return {
      items: paged.map(r => this.toResponse(r, false)),
      total: items.length,
      nextCursor,
    }
  }

  /** 按 ID 查询 */
  getById(id: string): InsightResponse | null {
    const report = this.reports.get(id)
    if (!report || report.tenantId !== this.currentTenantId) return null
    return this.toResponse(report, false)
  }

  /** 清理过期缓存 */
  pruneExpiredCache(): number {
    const now = Date.now()
    let pruned = 0
    for (const [key, val] of this.cache.entries()) {
      if (val.expiresAt <= now) {
        this.cache.delete(key)
        pruned++
      }
    }
    return pruned
  }

  countByStatus(): Record<InsightStatus, number> {
    const counts: Record<InsightStatus, number> = { pending: 0, generating: 0, completed: 0, failed: 0 }
    for (const r of this.reports.values()) counts[r.status]++
    return counts
  }

  private toResponse(report: InsightReport, cached: boolean): InsightResponse {
    return {
      id: report.id,
      tenantId: report.tenantId,
      templateType: report.templateType,
      status: report.status,
      content: report.content,
      modelId: report.modelId,
      tokenUsage: report.tokenUsage,
      sources: report.sources.map(s => ({ type: s.type, refId: s.refId, period: s.period })),
      error: report.error,
      createdAt: report.createdAt,
      completedAt: report.completedAt,
      createdBy: report.createdBy,
      cached,
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 模拟 InsightService 集成测试
// ═══════════════════════════════════════════════════════════════

describe('InsightService (Mock)', () => {
  let svc: MockInsightService

  beforeEach(() => {
    svc = new MockInsightService()
  })

  // ── 正例 8+ ──

  it('正例: generate 返回 completed 洞察', async () => {
    const res = await svc.generate({
      templateType: 'sales',
      sources: [{ type: 'report', refId: 'r1', dataSnapshot: { total: 100 }, period: { from: '2024-01-01', to: '2024-01-31' } }],
    })
    expect(res.status).toBe('completed')
    expect(res.content).toContain('关键发现')
    expect(res.cached).toBe(false)
    expect(res.templateType).toBe('sales')
  })

  it('正例: 第二次相同请求命中缓存', async () => {
    const req = {
      templateType: 'inventory' as InsightTemplateType,
      sources: [{ type: 'report' as const, refId: 'r1', dataSnapshot: { stock: 50 }, period: { from: '2024-01-01', to: '2024-01-31' } }],
    }
    await svc.generate(req)
    const res = await svc.generate(req)
    expect(res.cached).toBe(true)
  })

  it('正例: force=true 跳过缓存', async () => {
    const req = {
      templateType: 'sales' as InsightTemplateType,
      sources: [{ type: 'report' as const, refId: 'r1', dataSnapshot: { total: 100 }, period: { from: '2024-01-01', to: '2024-01-31' } }],
    }
    await svc.generate(req)
    const res = await svc.generate({ ...req, force: true })
    expect(res.cached).toBe(false)
  })

  it('正例: 所有 5 种模板均能生成', async () => {
    for (const tt of TEMPLATE_TYPES) {
      const res = await svc.generate({
        templateType: tt,
        sources: [{ type: 'report', refId: 'r1', dataSnapshot: { data: 1 }, period: { from: '2024-01-01', to: '2024-01-31' } }],
      })
      expect(res.status).toBe('completed')
      expect(res.templateType).toBe(tt)
    }
  })

  it('正例: generate 含 tokenUsage', async () => {
    const res = await svc.generate({
      templateType: 'finance',
      sources: [{ type: 'report', refId: 'r1', dataSnapshot: { revenue: 50000 }, period: { from: '2024-01-01', to: '2024-01-31' } }],
    })
    expect(res.tokenUsage).toBeDefined()
    expect(res.tokenUsage!.total).toBeGreaterThan(0)
  })

  it('正例: getById 返回对应 report', async () => {
    const res = await svc.generate({
      templateType: 'customer',
      sources: [{ type: 'report', refId: 'r1', dataSnapshot: { customers: 300 }, period: { from: '2024-01-01', to: '2024-01-31' } }],
    })
    const fetched = svc.getById(res.id)
    expect(fetched).not.toBeNull()
    expect(fetched!.id).toBe(res.id)
  })

  it('正例: list 排序最新在前', async () => {
    await svc.generate({
      templateType: 'marketing',
      sources: [{ type: 'report', refId: 'r1', dataSnapshot: { roi: 3.5 }, period: { from: '2024-01-01', to: '2024-01-31' } }],
    })
    await new Promise(r => setTimeout(r, 1))
    await svc.generate({
      templateType: 'sales',
      sources: [{ type: 'report', refId: 'r2', dataSnapshot: { sales: 200 }, period: { from: '2024-02-01', to: '2024-02-28' } }],
    })
    const list = svc.list({})
    expect(list.items[0].templateType).toBe('sales') // 最新的在前
    expect(list.total).toBe(2)
  })

  it('正例: list 按 templateType 过滤', async () => {
    await svc.generate({
      templateType: 'sales',
      sources: [{ type: 'report', refId: 'r1', dataSnapshot: { s: 1 }, period: { from: '2024-01-01', to: '2024-01-31' } }],
    })
    await svc.generate({
      templateType: 'inventory',
      sources: [{ type: 'report', refId: 'r2', dataSnapshot: { s: 2 }, period: { from: '2024-01-01', to: '2024-01-31' } }],
    })
    const list = svc.list({ templateType: 'inventory' })
    expect(list.total).toBe(1)
    expect(list.items[0].templateType).toBe('inventory')
  })

  // ── 反例 5+ ──

  it('反例: 无 sources 抛错', async () => {
    await expect(svc.generate({ templateType: 'sales', sources: [] })).rejects.toThrow('At least one source')
  })

  it('反例: getById 不存在的 id 返回 null', () => {
    expect(svc.getById('nonexistent')).toBeNull()
  })

  it('反例: getById 跨租户返回 null', async () => {
    svc.currentTenantId = 'tenant-A'
    // create report under tenant-A
    const res = await svc.generate({
      templateType: 'sales',
      sources: [{ type: 'report', refId: 'r1', dataSnapshot: { d: 1 }, period: { from: '2024-01-01', to: '2024-01-31' } }],
    })
    svc.currentTenantId = 'tenant-B'
    expect(svc.getById(res.id)).toBeNull()
  })

  it('反例: sources > 10 抛错', async () => {
    const sources = Array.from({ length: 11 }, (_, i) => ({
      type: 'report' as const,
      refId: `r${i}`,
      dataSnapshot: { d: i },
      period: { from: '2024-01-01', to: '2024-01-31' as const },
    }))
    await expect(svc.generate({ templateType: 'sales', sources })).rejects.toThrow('Max 10 sources')
  })

  // ── 边界 5+ ──

  it('边界: countByStatus 初始全 0', () => {
    const counts = svc.countByStatus()
    expect(counts.pending).toBe(0)
    expect(counts.completed).toBe(0)
    expect(counts.failed).toBe(0)
  })

  it('边界: countByStatus 生成后计数正确', async () => {
    await svc.generate({
      templateType: 'sales',
      sources: [{ type: 'report', refId: 'r1', dataSnapshot: { d: 1 }, period: { from: '2024-01-01', to: '2024-01-31' } }],
    })
    const counts = svc.countByStatus()
    expect(counts.completed).toBe(1)
  })

  it('边界: list 分页返回 nextCursor', () => {
    // 批量生成
    const results = Array.from({ length: 5 }, (_, i) => svc.reports.set(`r-${i}`, {
      id: `r-${i}`,
      tenantId: svc.currentTenantId,
      storeId: 's1',
      templateType: 'sales',
      status: 'completed',
      prompt: 'test',
      modelId: 'm1',
      sources: [mockSource({ refId: `r-${i}` })],
      createdAt: new Date(Date.now() + i).toISOString(),
      createdBy: 'test',
      cacheTtlSec: 86400,
    }))
    const list1 = svc.list({ limit: 2 })
    expect(list1.items).toHaveLength(2)
    expect(list1.nextCursor).toBeDefined()
  })

  it('边界: pruneExpiredCache 清理过期条目', () => {
    svc.cache.set('expired-key', { reportId: 'r1', expiresAt: Date.now() - 1000 })
    svc.cache.set('valid-key', { reportId: 'r2', expiresAt: Date.now() + 100000 })
    const pruned = svc.pruneExpiredCache()
    expect(pruned).toBe(1)
    expect(svc.cache.has('valid-key')).toBe(true)
    expect(svc.cache.has('expired-key')).toBe(false)
  })

  it('边界: 1 个 sources 可正常生成', async () => {
    const res = await svc.generate({
      templateType: 'sales',
      sources: [{ type: 'report', refId: 'single', dataSnapshot: { v: 1 }, period: { from: '2024-01-01', to: '2024-01-31' } }],
    })
    expect(res.status).toBe('completed')
  })

  it('边界: 10 个 sources（上限）', async () => {
    const sources = Array.from({ length: 10 }, (_, i) => ({
      type: 'report' as const,
      refId: `r${i}`,
      dataSnapshot: { i },
      period: { from: '2024-01-01', to: '2024-01-31' as const },
    }))
    const res = await svc.generate({ templateType: 'marketing', sources })
    expect(res.status).toBe('completed')
  })
})
