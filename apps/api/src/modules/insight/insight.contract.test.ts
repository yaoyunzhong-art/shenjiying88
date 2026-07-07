import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase 94 智能分析 Contract 测试 (node:test)
 *
 * 覆盖: toInsightContract / toTemplateContract / toInsightListContract
 * 正例 + 反例 + 边界
 */

import assert from 'node:assert/strict'
import {
  toInsightContract,
  toTemplateContract,
  toInsightListContract,
} from './insight.contract'

describe('insight.contract', () => {

  // ── toInsightContract ────────────────────────────────────────
  describe('toInsightContract', () => {
    it('正向: completed 响应正确映射', () => {
      const response = {
        id: 'ins-abc-123',
        tenantId: 'tenant-001',
        templateType: 'sales' as const,
        status: 'completed' as const,
        content: '## 关键发现\n- 销售增长 15%',
        modelId: 'model-deepseek-v4',
        tokenUsage: { prompt: 200, completion: 100, total: 300 },
        sources: [
          { type: 'report', refId: 'rpt-001', period: { from: 'a', to: 'b' } },
        ],
        createdAt: '2026-06-28T07:00:00.000Z',
        completedAt: '2026-06-28T07:00:02.000Z',
        createdBy: 'user-001',
        cached: false,
      }

      const contract = toInsightContract(response)

      assert.equal(contract.id, 'ins-abc-123')
      assert.equal(contract.tenantId, 'tenant-001')
      assert.equal(contract.templateType, 'sales')
      assert.equal(contract.status, 'completed')
      assert.equal(contract.hasContent, true)
      assert.equal(contract.modelId, 'model-deepseek-v4')
      assert.equal(contract.sourceCount, 1)
      assert.equal(contract.createdBy, 'user-001')
      assert.equal(contract.cached, false)
      // 验证内部字段被排除
      assert.equal('tokenUsage' in contract, false)
    })

    it('正向: failed 状态正确映射', () => {
      const response = {
        id: 'ins-fail-001',
        tenantId: 'tenant-002',
        templateType: 'inventory' as const,
        status: 'failed' as const,
        content: undefined,
        modelId: 'model-test',
        tokenUsage: undefined,
        sources: [],
        error: 'LLM API timeout after 30s',
        createdAt: '2026-06-28T08:00:00.000Z',
        completedAt: '2026-06-28T08:00:30.000Z',
        createdBy: 'system',
        cached: false,
      }

      const contract = toInsightContract(response)

      assert.equal(contract.status, 'failed')
      assert.equal(contract.hasContent, false)
      assert.equal(contract.sourceCount, 0)
      assert.equal(contract.error, 'LLM API timeout after 30s')
      assert.equal(contract.completedAt, '2026-06-28T08:00:30.000Z')
    })

    it('正向: cached 为 true 时正确反映', () => {
      const response = {
        id: 'ins-cache-001',
        tenantId: 'tenant-001',
        templateType: 'finance' as const,
        status: 'completed' as const,
        content: '# 财务分析\n- 成本下降 3%',
        modelId: 'model-deepseek-v3',
        tokenUsage: { prompt: 50, completion: 30, total: 80 },
        sources: [
          { type: 'report', refId: 'rpt-fin-01', period: { from: 'a', to: 'b' } },
          { type: 'report', refId: 'rpt-fin-02', period: { from: 'a', to: 'b' } },
        ],
        createdAt: '2026-06-27T10:00:00.000Z',
        completedAt: '2026-06-27T10:00:05.000Z',
        createdBy: 'user-002',
        cached: true,
      }

      const contract = toInsightContract(response)

      assert.equal(contract.cached, true)
      assert.equal(contract.sourceCount, 2)
    })

    it('边界: empty content 时 hasContent 为 false', () => {
      const response = {
        id: 'ins-empty-001',
        tenantId: 'tenant-003',
        templateType: 'marketing' as const,
        status: 'generating' as const,
        content: '',
        modelId: 'model-test',
        tokenUsage: undefined,
        sources: [],
        createdAt: '2026-06-28T09:00:00.000Z',
        completedAt: undefined,
        createdBy: 'user-003',
        cached: false,
      }

      const contract = toInsightContract(response)
      assert.equal(contract.hasContent, false)
      assert.equal(contract.completedAt, undefined)
    })

    it('边界: 所有 5 种 templateType 均能正确映射', () => {
      const types: Array<'sales' | 'inventory' | 'finance' | 'marketing' | 'customer'> = [
        'sales', 'inventory', 'finance', 'marketing', 'customer',
      ]
      for (const tt of types) {
        const response = {
          id: `ins-${tt}-001`,
          tenantId: 'tenant-001',
          templateType: tt,
          status: 'pending' as const,
          content: undefined,
          modelId: 'model-test',
          tokenUsage: undefined,
          sources: [],
          createdAt: new Date().toISOString(),
          createdBy: 'test',
          cached: false,
        }
        const contract = toInsightContract(response)
        assert.equal(contract.templateType, tt)
        assert.equal(contract.status, 'pending')
      }
    })
  })

  // ── toTemplateContract ──────────────────────────────────────
  describe('toTemplateContract', () => {
    it('正向: 所有字段正确映射', () => {
      const template = {
        type: 'customer' as const,
        name: '客户洞察',
        description: '分析复购率/客单价分布/流失风险',
        systemPrompt: 'system prompt...',
        userPromptTemplate: 'template with {data}',
        maxTokens: 1024,
        temperature: 0.3,
      }

      const contract = toTemplateContract(template)

      assert.equal(contract.type, 'customer')
      assert.equal(contract.name, '客户洞察')
      assert.equal(contract.description, '分析复购率/客单价分布/流失风险')
      // 验证内部字段被剥离
      assert.equal('systemPrompt' in contract, false)
      assert.equal('maxTokens' in contract, false)
      assert.equal('temperature' in contract, false)
    })

    it('正向: 5 种模板类型均支持', () => {
      const types: Array<'sales' | 'inventory' | 'finance' | 'marketing' | 'customer'> = [
        'sales', 'inventory', 'finance', 'marketing', 'customer',
      ]
      for (const tt of types) {
        const contract = toTemplateContract({
          type: tt,
          name: `Template ${tt}`,
          description: `Description for ${tt}`,
        })
        assert.equal(contract.type, tt)
      }
    })
  })

  // ── toInsightListContract ──────────────────────────────────
  describe('toInsightListContract', () => {
    it('正向: 空列表正确映射', () => {
      const list = { items: [], total: 0 }

      const contract = toInsightListContract(list)

      assert.deepEqual(contract.items, [])
      assert.equal(contract.total, 0)
      assert.equal(contract.nextCursor, undefined)
    })

    it('正向: 多条目列表正确映射', () => {
      const list = {
        items: [
          {
            id: 'ins-a',
            tenantId: 'tenant-001',
            templateType: 'sales' as const,
            status: 'completed' as const,
            content: '# 销售分析',
            modelId: 'model-1',
            tokenUsage: { prompt: 100, completion: 50, total: 150 },
            sources: [{ type: 'report', refId: 'rpt-001', period: { from: 'a', to: 'b' } }],
            createdAt: '2026-06-28T07:00:00.000Z',
            completedAt: '2026-06-28T07:00:02.000Z',
            createdBy: 'user-001',
            cached: false,
          },
          {
            id: 'ins-b',
            tenantId: 'tenant-001',
            templateType: 'finance' as const,
            status: 'completed' as const,
            content: '# 财务分析',
            modelId: 'model-1',
            tokenUsage: { prompt: 80, completion: 40, total: 120 },
            sources: [{ type: 'report', refId: 'rpt-002', period: { from: 'a', to: 'b' } }],
            createdAt: '2026-06-28T07:05:00.000Z',
            completedAt: '2026-06-28T07:05:03.000Z',
            createdBy: 'user-002',
            cached: false,
          },
        ],
        total: 2,
        nextCursor: '2',
      }

      const contract = toInsightListContract(list)

      assert.equal(contract.total, 2)
      assert.equal(contract.items.length, 2)
      assert.equal(contract.nextCursor, '2')
      assert.equal(contract.items[0].id, 'ins-a')
      assert.equal(contract.items[1].id, 'ins-b')
      assert.equal(contract.items[0].templateType, 'sales')
      assert.equal(contract.items[1].templateType, 'finance')
      // 确认 tokenUsage 被排除
      assert.equal('tokenUsage' in contract.items[0], false)
    })

    it('边界: nextCursor 为 undefined 时正确传递', () => {
      const list = {
        items: [{
          id: 'ins-x',
          tenantId: 'tenant-001',
          templateType: 'marketing' as const,
          status: 'completed' as const,
          content: '# 营销分析',
          modelId: 'model-1',
          tokenUsage: { prompt: 50, completion: 25, total: 75 },
          sources: [],
          createdAt: '2026-06-28T08:00:00.000Z',
          completedAt: '2026-06-28T08:00:01.000Z',
          createdBy: 'user-x',
          cached: false,
        }],
        total: 1,
      }

      const contract = toInsightListContract(list)

      assert.equal(contract.total, 1)
      assert.equal(contract.nextCursor, undefined)
    })
  })
})
