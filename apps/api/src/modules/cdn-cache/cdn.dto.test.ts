import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase 98 CDN Cache DTO Test (V10 Sprint 2 Day 29)
 *
 * 验证 DTO 类型定义在运行时可正确构造/使用
 */
import assert from 'node:assert/strict'
import type {
  CreateRuleDto, UpdateRuleDto, AddEdgeNodeDto, InvalidateDto,
  MatchRuleDto, RuleListResponse, NodeListResponse, MatchRuleResponse,
  InvalidationListResponse, EdgeNodeStatsResponse,
} from './cdn.dto'
import type { CdnCacheRule, EdgeNode, CacheInvalidation } from './cdn.entity'

describe('cdn.dto', () => {
  describe('CreateRuleDto', () => {
    it('应允许完整字段', () => {
      const dto: CreateRuleDto = {
        name: 'test',
        urlPattern: '/api/*',
        methods: ['GET', 'HEAD'],
        strategy: 'public',
        maxAge: 3600,
        staleWhileRevalidate: 86400,
        enableETag: true,
        enableGzip: true,
        enableBrotli: false,
        varyHeaders: ['Accept-Encoding'],
        cacheableStatusCodes: [200, 301],
        priority: 10,
        enabled: true,
      }
      assert.equal(dto.name, 'test')
      assert.equal(dto.urlPattern, '/api/*')
      assert.equal(dto.maxAge, 3600)
    })

    it('应允许最小字段', () => {
      const dto: CreateRuleDto = { name: 'min', urlPattern: '/min/*' }
      assert.equal(dto.name, 'min')
    })
  })

  describe('UpdateRuleDto', () => {
    it('应允许部分字段', () => {
      const dto: UpdateRuleDto = { maxAge: 7200 }
      assert.equal(dto.maxAge, 7200)
      assert.equal(dto.name, undefined)
    })
  })

  describe('AddEdgeNodeDto', () => {
    it('应构造完整节点 DTO', () => {
      const dto: AddEdgeNodeDto = {
        name: 'edge-test',
        region: 'cn-hangzhou',
        endpoint: 'https://edge.hz.test.com',
        capacityBytes: 10 * 1024 ** 3,
      }
      assert.equal(dto.region, 'cn-hangzhou')
    })
  })

  describe('InvalidateDto', () => {
    it('url 模式', () => {
      const dto: InvalidateDto = { mode: 'url', target: '/api/img/1' }
      assert.equal(dto.mode, 'url')
    })
    it('pattern 模式', () => {
      const dto: InvalidateDto = { mode: 'pattern', target: '/api/images/*' }
      assert.equal(dto.mode, 'pattern')
    })
  })

  describe('MatchRuleDto', () => {
    it('应允许无 method', () => {
      const dto: MatchRuleDto = { url: '/api/test' }
      assert.equal(dto.method, undefined)
    })
  })

  describe('响应 DTO', () => {
    it('RuleListResponse', () => {
      const res: RuleListResponse = { items: [] }
      assert.ok(Array.isArray(res.items))
    })

    it('NodeListResponse', () => {
      const res: NodeListResponse = { items: [] }
      assert.ok(Array.isArray(res.items))
    })

    it('MatchRuleResponse', () => {
      const res: MatchRuleResponse = { matched: false, rule: null, cacheControl: null }
      assert.equal(res.matched, false)
    })

    it('InvalidationListResponse', () => {
      const res: InvalidationListResponse = { items: [] }
      assert.ok(Array.isArray(res.items))
    })

    it('EdgeNodeStatsResponse', () => {
      const res: EdgeNodeStatsResponse = {
        totalNodes: 0, onlineNodes: 0, totalCapacityBytes: 0,
        totalUsedBytes: 0, averageHitRate: 0, averageLatencyMs: 0,
      }
      assert.equal(res.totalNodes, 0)
    })
  })
})
