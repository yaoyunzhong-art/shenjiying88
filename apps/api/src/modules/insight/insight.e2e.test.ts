import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase 94 智能分析 E2E 测试 (node:test)
 *
 * 测试 InsightService 实际集成路径 (使用 MockLLMProvider)
 * 覆盖: generate / list / getById / templates / cache/prune
 */

import assert from 'node:assert/strict'
import { InsightService } from './insight.service'
import type { LLMProvider } from './insight.service'
import { AiModelConfigService } from '../ai-model-config/ai-model-config.service'
import type { StoreConfigResponse } from '../ai-model-config/ai-model-config.service'
import { listTemplates as listPromptTemplates } from './insight.prompt'
import type { InsightTemplate } from './insight.entity'

// ── Mock AiModelConfigService ─────────────────────────────────
class MockAiModelConfigService {
  async getCurrentConfig(_storeId?: string): Promise<StoreConfigResponse | null> {
    return {
      id: 'model-deepseek-v4',
      tenantId: 'tenant-001',
      storeId: 'store-001',
      configName: 'DeepSeek V4',
      provider: 'deepseek',
      endpointUrl: 'https://api.deepseek.com/v1',
      apiKeyMasked: 'sk-***123',
      contextWindow: 8192,
      temperature: 0.3,
      maxTokens: 2048,
      isCurrent: true,
      createdBy: 'test',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    }
  }

  async getDecryptedApiKey(_configId: string): Promise<string | null> {
    return 'sk-mock-decrypted-key-12345'
  }
}

// ── Custom LLM Provider 用于 E2E 测试 ─────────────────────
class TestLLMProvider implements LLMProvider {
  async complete(req: {
    systemPrompt: string
    userPrompt: string
    maxTokens: number
    temperature: number
    apiKey: string
    endpointUrl: string
    modelName: string
  }) {
    // 根据 templateType 生成可测试的模拟响应
    const isSales = req.systemPrompt.includes('零售分析师')
    const isInventory = req.systemPrompt.includes('供应链管理')
    const isFinance = req.systemPrompt.includes('CFO')
    const isMarketing = req.systemPrompt.includes('增长黑客')
    const isCustomer = req.systemPrompt.includes('客户成功')

    let title = '通用分析'
    if (isSales) title = '销售洞察报告'
    else if (isInventory) title = '库存洞察报告'
    else if (isFinance) title = '财务洞察报告'
    else if (isMarketing) title = '营销洞察报告'
    else if (isCustomer) title = '客户洞察报告'

    const content = [
      `# ${title}`,
      '',
      '## 关键发现',
      '- 数据源包含多行原始数据',
      '- 已识别主要指标趋势',
      '',
      '## 行动建议',
      '- 持续监控核心指标波动',
      '',
      '## 风险提示',
      '- 当前为测试环境输出',
    ].join('\n')

    return {
      content,
      promptTokens: req.userPrompt.length,
      completionTokens: content.length,
    }
  }
}

function createE2eEnv() {
  const aiConfigService = new MockAiModelConfigService() as unknown as AiModelConfigService
  const service = new InsightService(aiConfigService)
  service.setLLMProvider(new TestLLMProvider())
  return { service }
}

describe('[E2E] InsightService 集成测试', () => {
  let ctx: ReturnType<typeof createE2eEnv>

  beforeEach(() => {
    ctx = createE2eEnv()
  })

  // ── generate ────────────────────────────────────────────────
  describe('generate', () => {
    it('正向: 生成销售洞察成功', async () => {
      const { service } = ctx
      const result = await service.generate({
        templateType: 'sales',
        sources: [{
          type: 'report',
          refId: 'rpt-sales-001',
          dataSnapshot: { dailyRevenue: [100, 200, 150], totalMonth: 4500 },
          period: { from: '2026-06-01', to: '2026-06-28' },
        }],
      })
      assert.ok(result.id.startsWith('ins-'), `id 格式不对: ${result.id}`)
      assert.equal(result.templateType, 'sales')
      assert.equal(result.status, 'completed')
      assert.ok(result.content!.includes('销售洞察'), `content 缺少预期标题: ${result.content}`)
      assert.ok(result.tokenUsage)
      assert.ok(result.tokenUsage!.total > 0)
      assert.equal(result.cached, false)
      assert.equal(result.sources.length, 1)
    })

    it('正向: 5 种 templateType 均能生成', async () => {
      const { service } = ctx
      for (const tt of ['sales', 'inventory', 'finance', 'marketing', 'customer'] as const) {
        const result = await service.generate({
          templateType: tt,
          sources: [{
            type: 'report',
            refId: `rpt-${tt}-001`,
            dataSnapshot: { test: true },
            period: { from: '2026-06-01', to: '2026-06-28' },
          }],
        })
        assert.equal(result.templateType, tt)
        assert.equal(result.status, 'completed')
        assert.ok(result.content)
        assert.ok(result.content.length > 50, `content 太短: ${tt}`)
      }
    })

    it('正向: force=true 跳过缓存', async () => {
      const { service } = ctx
      // 第一次生成
      const first = await service.generate({
        templateType: 'sales',
        sources: [{
          type: 'report', refId: 'rpt-force-001', dataSnapshot: { x: 1 },
          period: { from: '2026-06-01', to: '2026-06-28' },
        }],
      })
      assert.equal(first.cached, false)

      // 第二次相同请求,应命中缓存
      const second = await service.generate({
        templateType: 'sales',
        sources: [{
          type: 'report', refId: 'rpt-force-001', dataSnapshot: { x: 1 },
          period: { from: '2026-06-01', to: '2026-06-28' },
        }],
      })
      assert.equal(second.cached, true)

      // force=true 跳过缓存
      const third = await service.generate({
        templateType: 'sales',
        sources: [{
          type: 'report', refId: 'rpt-force-001', dataSnapshot: { x: 1 },
          period: { from: '2026-06-01', to: '2026-06-28' },
        }],
        force: true,
      })
      assert.equal(third.cached, false)
      assert.notEqual(third.id, second.id)
    })

    it('正向: 自定义 maxTokens 生效', async () => {
      const { service } = ctx
      const result = await service.generate({
        templateType: 'customer',
        sources: [{
          type: 'monitoring',
          refId: 'mon-cust-001',
          dataSnapshot: { users: 5000 },
          period: { from: '2026-06-01', to: '2026-06-28' },
        }],
        maxTokens: 4096,
      })
      assert.equal(result.status, 'completed')
      assert.ok(result.content)
    })

    it('反例: 空 sources 抛 BadRequest', async () => {
      const { service } = ctx
      await assert.rejects(
        () => service.generate({ templateType: 'finance', sources: [] }),
        { message: /At least one source is required/ },
      )
    })

    it('反例: 超过 10 个 sources 抛 BadRequest', async () => {
      const { service } = ctx
      const sources = Array.from({ length: 11 }, (_, i) => ({
        type: 'report' as const,
        refId: `rpt-${i}`,
        dataSnapshot: { idx: i },
        period: { from: 'a', to: 'b' },
      }))
      await assert.rejects(
        () => service.generate({ templateType: 'marketing', sources }),
        { message: /Max 10 sources/ },
      )
    })

    it('边界: sources 刚好 10 个通过', async () => {
      const { service } = ctx
      const sources = Array.from({ length: 10 }, (_, i) => ({
        type: 'report' as const,
        refId: `rpt-${i}`,
        dataSnapshot: { idx: i },
        period: { from: 'a', to: 'b' },
      }))
      const result = await service.generate({ templateType: 'inventory', sources })
      assert.equal(result.sources.length, 10)
      assert.equal(result.status, 'completed')
    })

    it('边界: 多种 source type 支持 (report/canary/monitoring)', async () => {
      const { service } = ctx
      const sources = [
        { type: 'report' as const, refId: 'rpt-001', dataSnapshot: { a: 1 }, period: { from: 'a', to: 'b' } },
        { type: 'canary' as const, refId: 'can-001', dataSnapshot: { b: 2 }, period: { from: 'a', to: 'b' } },
        { type: 'monitoring' as const, refId: 'mon-001', dataSnapshot: { c: 3 }, period: { from: 'a', to: 'b' } },
      ]
      const result = await service.generate({ templateType: 'marketing', sources })
      assert.equal(result.sources.length, 3)
      assert.equal(result.status, 'completed')
    })
  })

  // ── list ────────────────────────────────────────────────────
  describe('list', () => {
    it('正向: 空列表返回空', async () => {
      const { service } = ctx
      const result = await service.list({})
      assert.deepEqual(result.items, [])
      assert.equal(result.total, 0)
    })

    it('正向: 多个洞察返回正确顺序 (按 createdAt 降序)', async () => {
      const { service } = ctx
      const r1 = await service.generate({
        templateType: 'sales',
        sources: [{ type: 'report', refId: 'rpt-a', dataSnapshot: {}, period: { from: 'a', to: 'b' } }],
      })
      const r2 = await service.generate({
        templateType: 'inventory',
        sources: [{ type: 'report', refId: 'rpt-b', dataSnapshot: {}, period: { from: 'a', to: 'b' } }],
      })
      const result = await service.list({})
      assert.equal(result.total, 2)
      assert.equal(result.items.length, 2)
      // 最新在先
      assert.ok(result.items[0].createdAt >= result.items[1].createdAt)
    })

    it('正向: 按 templateType 过滤', async () => {
      const { service } = ctx
      await service.generate({
        templateType: 'sales',
        sources: [{ type: 'report', refId: 'rpt-a', dataSnapshot: {}, period: { from: 'a', to: 'b' } }],
      })
      await service.generate({
        templateType: 'finance',
        sources: [{ type: 'report', refId: 'rpt-b', dataSnapshot: {}, period: { from: 'a', to: 'b' } }],
      })
      const result = await service.list({ templateType: 'sales' })
      assert.equal(result.total, 1)
      assert.equal(result.items[0].templateType, 'sales')
    })

    it('正向: 按 status 过滤', async () => {
      const { service } = ctx
      await service.generate({
        templateType: 'sales',
        sources: [{ type: 'report', refId: 'rpt-a', dataSnapshot: {}, period: { from: 'a', to: 'b' } }],
      })
      const result = await service.list({ status: 'completed' })
      assert.equal(result.total, 1)
    })

    it('边界: 分页正常工作', async () => {
      const { service } = ctx
      for (let i = 0; i < 5; i++) {
        await service.generate({
          templateType: 'sales',
          sources: [{ type: 'report', refId: `rpt-${i}`, dataSnapshot: { i }, period: { from: 'a', to: 'b' } }],
        })
      }
      const page1 = await service.list({ limit: 2 })
      assert.equal(page1.items.length, 2)
      assert.ok(page1.nextCursor)

      const page2 = await service.list({ limit: 2, cursor: page1.nextCursor })
      assert.equal(page2.items.length, 2)
      assert.ok(page2.nextCursor)

      const page3 = await service.list({ limit: 2, cursor: page2.nextCursor })
      assert.equal(page3.items.length, 1)
      assert.equal(page3.nextCursor, undefined)
    })

    it('边界: limit 最大为 100', async () => {
      const { service } = ctx
      for (let i = 0; i < 150; i++) {
        await service.generate({
          templateType: 'sales',
          sources: [{ type: 'report', refId: `rpt-${i}`, dataSnapshot: { i }, period: { from: 'a', to: 'b' } }],
        })
      }
      const result = await service.list({ limit: 999 })
      assert.equal(result.items.length, 100) // 被截断
    })
  })

  // ── getById ─────────────────────────────────────────────────
  describe('getById', () => {
    it('正向: 按 ID 查询已存在的洞察', async () => {
      const { service } = ctx
      const created = await service.generate({
        templateType: 'sales',
        sources: [{ type: 'report', refId: 'rpt-001', dataSnapshot: {}, period: { from: 'a', to: 'b' } }],
      })
      const result = await service.getById(created.id)
      assert.equal(result.id, created.id)
      assert.equal(result.templateType, 'sales')
      assert.equal(result.status, 'completed')
    })

    it('反例: 不存在的 ID 抛 NotFoundException', async () => {
      const { service } = ctx
      await assert.rejects(
        () => service.getById('non-existent-id'),
        { message: /not found/ },
      )
    })

    it('边界: ID 格式验证', async () => {
      const { service } = ctx
      await assert.rejects(
        () => service.getById(''),
        { message: /not found/ },
      )
    })
  })

  // ── templates ───────────────────────────────────────────────
  describe('templates (via prompt module)', () => {
    it('正向: listTemplates 返回 5 个模板', () => {
      const templates: InsightTemplate[] = listPromptTemplates()
      assert.equal(templates.length, 5)

      const types = templates.map(t => t.type)
      assert.ok(types.includes('sales'))
      assert.ok(types.includes('inventory'))
      assert.ok(types.includes('finance'))
      assert.ok(types.includes('marketing'))
      assert.ok(types.includes('customer'))
    })

    it('正向: 每个模板有完整字段', () => {
      const templates: InsightTemplate[] = listPromptTemplates()
      for (const t of templates) {
        assert.ok(t.name)
        assert.ok(t.description)
        assert.ok(t.systemPrompt)
        assert.ok(t.userPromptTemplate.includes('{data}'))
        assert.ok(t.maxTokens > 0)
        assert.ok(t.temperature >= 0 && t.temperature <= 1)
      }
    })
  })

  // ── cache/prune ────────────────────────────────────────────
  describe('cache/prune', () => {
    it('正向: pruneExpiredCache 返回清理数量', () => {
      const { service } = ctx
      const pruned = service.pruneExpiredCache()
      assert.equal(typeof pruned, 'number')
      assert.ok(pruned >= 0)
    })

    it('正向: countByStatus 正确统计', async () => {
      const { service } = ctx
      await service.generate({
        templateType: 'sales',
        sources: [{ type: 'report', refId: 'rpt-a', dataSnapshot: {}, period: { from: 'a', to: 'b' } }],
      })
      await service.generate({
        templateType: 'finance',
        sources: [{ type: 'report', refId: 'rpt-b', dataSnapshot: {}, period: { from: 'a', to: 'b' } }],
      })
      const counts = service.countByStatus()
      assert.equal(counts.completed, 2)
      assert.equal(counts.pending, 0)
      assert.equal(counts.generating, 0)
      assert.equal(counts.failed, 0)
    })

    it('边界: 多次生成后 countByStatus 累计正确', async () => {
      const { service } = ctx
      for (let i = 0; i < 5; i++) {
        await service.generate({
          templateType: 'sales',
          sources: [{ type: 'report', refId: `rpt-${i}`, dataSnapshot: { i }, period: { from: 'a', to: 'b' } }],
        })
      }
      const counts = service.countByStatus()
      assert.equal(counts.completed, 5)
    })
  })

  // ── tokenUsage 验证 ────────────────────────────────────────
  describe('tokenUsage', () => {
    it('正向: 生成的 tokenUsage 字段完整且合理', async () => {
      const { service } = ctx
      const result = await service.generate({
        templateType: 'sales',
        sources: [{
          type: 'report',
          refId: 'rpt-token-001',
          dataSnapshot: { a: 1, b: 2 },
          period: { from: 'a', to: 'b' },
        }],
      })
      assert.ok(result.tokenUsage)
      assert.ok(result.tokenUsage!.prompt > 0)
      assert.ok(result.tokenUsage!.completion > 0)
      assert.equal(result.tokenUsage!.total, result.tokenUsage!.prompt + result.tokenUsage!.completion)
    })
  })
})
