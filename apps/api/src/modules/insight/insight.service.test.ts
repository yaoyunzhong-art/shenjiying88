import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase 94 智能分析 Service 测试 (V10 Sprint 2 Day 16-17)
 *
 * 20 tests 覆盖:
 * - 模板系统 (5)
 * - 提示词渲染 (3)
 * - token 估算 (2)
 * - 数据源哈希 (2)
 * - generate (5)
 * - 缓存 (2)
 * - 列表/详情 (1)
 */

import assert from 'node:assert/strict'
import type { GenerateInsightRequest } from './insight.dto'
import { InsightService } from './insight.service'
import { AiModelConfigService } from '../ai-model-config/ai-model-config.service'
import {
  BUILTIN_INSIGHT_TEMPLATES,
  buildInsightCacheKey,
  hashSources,
  type InsightSource,
} from './insight.entity'
import {
  listTemplates,
  getTemplate,
  renderUserPrompt,
  estimateTokens,
  buildLLMRequest,
} from './insight.prompt'
import { runWithTenant } from '../../common/context/tenant-context'

const TENANT_CTX = {
  tenantId: 'tenant-A',
  storeId: 'store-001',
  userId: 'admin',
  role: 'tenant_admin' as const,
}

// 共享 Phase 87 AiModelConfigService (MemoryRepository 状态需要单例)
const SHARED_AI_SERVICE = new AiModelConfigService()
// 共享 InsightService (reports Map 状态需要单例)
const SHARED_INSIGHT_SERVICE = new InsightService(SHARED_AI_SERVICE)

async function setupStoreAiConfig() {
  // 在 Phase 87 中预置一个 store AI 配置,让 insight.generate 可以走通
  await runWithTenant(TENANT_CTX, async () => {
    const created = await SHARED_AI_SERVICE.createStoreConfig({
      storeId: 'store-001',
      configName: 'insight-test-cfg',
      provider: 'deepseek',
      endpointUrl: 'https://api.deepseek.com',
      apiKey: 'sk-test-secret-key',
      contextWindow: 8192,
      temperature: 0.5,
      maxTokens: 2048,
    })
    // 设为 current (Phase 87 create 默认 isCurrent=false, 需 switch)
    await SHARED_AI_SERVICE.switchConfig({ configId: created.id, reason: 'test-setup' })
  })
}

describe('Phase 94 Insight 智能分析 (V10 Sprint 2 Day 16-17)', () => {
  // ============ 1. 模板系统 (5 tests) ============
  describe('1. 模板系统', () => {
    it('BUILTIN_INSIGHT_TEMPLATES 包含 5 个模板', () => {
      assert.equal(BUILTIN_INSIGHT_TEMPLATES.length, 5)
      const types = BUILTIN_INSIGHT_TEMPLATES.map((t) => t.type)
      assert.deepEqual(
        types.sort(),
        ['customer', 'finance', 'inventory', 'marketing', 'sales'],
      )
    })

    it('每个模板有 systemPrompt + userPromptTemplate + maxTokens + temperature', () => {
      for (const tpl of BUILTIN_INSIGHT_TEMPLATES) {
        assert.ok(tpl.systemPrompt.length > 10, `${tpl.type} systemPrompt 太短`)
        assert.ok(tpl.userPromptTemplate.includes('{data}'), `${tpl.type} 缺 {data} 占位符`)
        assert.ok(tpl.maxTokens > 0)
        assert.ok(tpl.temperature >= 0 && tpl.temperature <= 1)
      }
    })

    it('getTemplate 按类型返回模板', () => {
      const tpl = getTemplate('sales')
      assert.equal(tpl.type, 'sales')
      assert.ok(tpl.name.length > 0)
    })

    it('getTemplate 未知类型抛错', () => {
      assert.throws(() => getTemplate('unknown' as any), /Unknown insight template/)
    })

    it('listTemplates 按 type 排序', () => {
      const list = listTemplates()
      for (let i = 1; i < list.length; i++) {
        assert.ok(list[i - 1].type <= list[i].type)
      }
    })
  })

  // ============ 2. 提示词渲染 (3 tests) ============
  describe('2. 提示词渲染', () => {
    const sampleSources: InsightSource[] = [
      {
        type: 'report',
        refId: 'rpt-001',
        dataSnapshot: { sales: 12345, orders: 100 },
        period: { from: '2026-06-01', to: '2026-06-30' },
      },
    ]

    it('renderUserPrompt 替换 {data} 占位符', () => {
      const tpl = getTemplate('sales')
      const prompt = renderUserPrompt(tpl, sampleSources)
      assert.ok(!prompt.includes('{data}'), '应替换 {data}')
      assert.ok(prompt.includes('12345'), '应包含数据快照')
      assert.ok(prompt.includes('rpt-001'), '应包含 refId')
    })

    it('renderUserPrompt 截断 > 8KB 的数据源', () => {
      const huge: InsightSource[] = [
        {
          type: 'report',
          refId: 'big',
          dataSnapshot: { x: 'x'.repeat(20 * 1024) }, // 20KB
          period: { from: 'a', to: 'b' },
        },
      ]
      const prompt = renderUserPrompt(getTemplate('sales'), huge)
      assert.ok(prompt.includes('(truncated)'), '应标记截断')
    })

    it('renderUserPrompt 多源按索引编号', () => {
      const multi: InsightSource[] = [
        { ...sampleSources[0], refId: 'rpt-A' },
        { ...sampleSources[0], refId: 'rpt-B' },
      ]
      const prompt = renderUserPrompt(getTemplate('sales'), multi)
      assert.ok(prompt.includes('数据源 1'))
      assert.ok(prompt.includes('数据源 2'))
      assert.ok(prompt.includes('rpt-A'))
      assert.ok(prompt.includes('rpt-B'))
    })
  })

  // ============ 3. token 估算 (2 tests) ============
  describe('3. token 估算', () => {
    it('estimateTokens 英文按 ~4 字符/token', () => {
      const tokens = estimateTokens('Hello world')
      assert.ok(tokens >= 2 && tokens <= 4, `英文 token 应 ~3, 实际 ${tokens}`)
    })

    it('estimateTokens 中文按 ~1.5 字/token', () => {
      const tokens = estimateTokens('你好世界')
      assert.ok(tokens >= 5 && tokens <= 8, `中文 token 应 ~6, 实际 ${tokens}`)
    })
  })

  // ============ 4. 数据源哈希 (2 tests) ============
  describe('4. 数据源哈希', () => {
    it('hashSources 同输入 → 同输出', () => {
      const sources: InsightSource[] = [
        { type: 'report', refId: 'a', dataSnapshot: { x: 1 }, period: { from: 'a', to: 'b' } },
      ]
      const h1 = hashSources(sources)
      const h2 = hashSources(sources)
      assert.equal(h1, h2)
    })

    it('hashSources 不同输入 → 不同输出', () => {
      const s1: InsightSource[] = [{ type: 'report', refId: 'a', dataSnapshot: { x: 1 }, period: { from: 'a', to: 'b' } }]
      const s2: InsightSource[] = [{ type: 'report', refId: 'b', dataSnapshot: { x: 1 }, period: { from: 'a', to: 'b' } }]
      assert.notEqual(hashSources(s1), hashSources(s2))
    })

    it('buildInsightCacheKey 格式正确', () => {
      const key = buildInsightCacheKey('t1', 'sales', 'abc12345')
      assert.equal(key, 'insight:t1:sales:abc12345')
    })
  })

  // ============ 5. generate 核心流 (5 tests) ============
  describe('5. generate 核心流', () => {
    beforeAll(async () => {
      await setupStoreAiConfig()
    })

    it('缺少 sources 抛 BadRequest', async () => {
      await assert.rejects(
        () =>
          runWithTenant(TENANT_CTX, async () =>
            SHARED_INSIGHT_SERVICE.generate({ templateType: 'sales', sources: [] as any }),
          ),
        /At least one source/,
      )
    })

    it('超过 10 sources 抛 BadRequest', async () => {
      const sources = Array.from({ length: 11 }, (_, i) => ({
        type: 'report' as const,
        refId: `rpt-${i}`,
        dataSnapshot: {},
        period: { from: 'a', to: 'b' },
      }))
      await assert.rejects(
        () =>
          runWithTenant(TENANT_CTX, async () =>
            SHARED_INSIGHT_SERVICE.generate({ templateType: 'sales', sources }),
          ),
        /Max 10 sources/,
      )
    })

    it('有效生成 → 返回 completed + markdown 内容', async () => {
      const result = await runWithTenant(TENANT_CTX, async () =>
        SHARED_INSIGHT_SERVICE.generate({
          templateType: 'sales',
          sources: [
            {
              type: 'report',
              refId: 'rpt-001',
              dataSnapshot: { totalSales: 50000, orders: 200 },
              period: { from: '2026-06-01', to: '2026-06-30' },
            },
          ],
        }),
      )
      assert.equal(result.status, 'completed')
      assert.ok(result.content)
      assert.ok(result.content.includes('关键发现') || result.content.includes('##'))
      assert.equal(result.cached, false)
      assert.ok(result.tokenUsage)
      assert.ok(result.tokenUsage!.total > 0)
    })

    it('第二次相同数据 → 命中缓存 (cached=true)', async () => {
      const req: GenerateInsightRequest = {
        templateType: 'inventory',
        sources: [
          {
            type: 'report',
            refId: 'rpt-002',
            dataSnapshot: { skuCount: 1500, lowStock: 23 },
            period: { from: '2026-06-01', to: '2026-06-30' },
          },
        ],
      }
      const first = await runWithTenant(TENANT_CTX, async () => SHARED_INSIGHT_SERVICE.generate(req))
      const second = await runWithTenant(TENANT_CTX, async () => SHARED_INSIGHT_SERVICE.generate(req))
      assert.equal(first.id, second.id, '缓存命中应返回相同 reportId')
      assert.equal(second.cached, true)
    })

    it('force=true 绕过缓存', async () => {
      const req: GenerateInsightRequest = {
        templateType: 'finance',
        sources: [
          {
            type: 'report' as const,
            refId: 'rpt-003',
            dataSnapshot: { revenue: 100000, cost: 70000 },
            period: { from: '2026-06-01', to: '2026-06-30' },
          },
        ],
      }
      const first = await runWithTenant(TENANT_CTX, async () => SHARED_INSIGHT_SERVICE.generate(req))
      const second = await runWithTenant(TENANT_CTX, async () => SHARED_INSIGHT_SERVICE.generate({ ...req, force: true }))
      assert.notEqual(first.id, second.id)
      assert.equal(second.cached, false)
    })
  })

  // ============ 6. 缓存管理 ============
  describe('6. 缓存管理', () => {
    it('pruneExpiredCache 清理过期项', async () => {
      const before = SHARED_INSIGHT_SERVICE.pruneExpiredCache()
      assert.ok(before >= 0)
    })
  })

  // ============ 7. 列表/详情 ============
  describe('7. 列表/详情', () => {
    it('list 按 tenant 过滤 + 状态计数', async () => {
      const list = await runWithTenant(TENANT_CTX, async () =>
        SHARED_INSIGHT_SERVICE.list({ templateType: 'sales' }),
      )
      assert.ok(list.total >= 1)
      const counts = SHARED_INSIGHT_SERVICE.countByStatus()
      assert.ok(counts.completed >= 1)
    })
  })

  // ============ 8. 删除洞察 ============
  describe('8. 删除洞察', () => {
    it('deleteInsight 删除已存在的洞察', async () => {
      await runWithTenant(TENANT_CTX, async () => {
        // 先创建一个洞察
        const created = await SHARED_INSIGHT_SERVICE.generate({
          templateType: 'sales',
          sources: [{
            type: 'report',
            refId: 'rpt-delete-001',
            dataSnapshot: { revenue: 5000 },
            period: { from: '2026-06-01', to: '2026-06-28' },
          }],
        })
        assert.ok(created.id, 'insight should be created')

        // 执行删除
        const result = SHARED_INSIGHT_SERVICE.deleteInsight(created.id)
        assert.ok(result.deleted, 'deleteInsight should return deleted: true')

        // 确认已删除
        await assert.rejects(
          () => SHARED_INSIGHT_SERVICE.getById(created.id),
          { message: /not found/i },
        )
      })
    })

    it('deleteInsight 删除不存在的洞察抛 NotFoundException', async () => {
      await runWithTenant(TENANT_CTX, async () => {
        assert.throws(
          () => SHARED_INSIGHT_SERVICE.deleteInsight('non-existent-id'),
          { message: /not found/i },
        )
      })
    })

    it('deleteInsight 跨 tenant 不可见', async () => {
      // 在 tenant-A 下创建
      let createdId = ''
      await runWithTenant(TENANT_CTX, async () => {
        const created = await SHARED_INSIGHT_SERVICE.generate({
          templateType: 'inventory',
          sources: [{
            type: 'report', refId: 'rpt-delete-002', dataSnapshot: { items: 100 },
            period: { from: '2026-06-01', to: '2026-06-28' },
          }],
        })
        createdId = created.id
      })

      // 在 tenant-B 下尝试删除
      const otherTenant = { tenantId: 'tenant-other', storeId: 'store-other', userId: 'user-other', role: 'store_admin' as const }
      await runWithTenant(otherTenant, async () => {
        assert.throws(
          () => SHARED_INSIGHT_SERVICE.deleteInsight(createdId),
          { message: /not found/i },
        )
      })
    })
  })
})
