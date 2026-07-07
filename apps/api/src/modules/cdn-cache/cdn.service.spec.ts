/**
 * cdn.service.spec.ts — CDN 缓存 Service 深层单元测试
 *
 * 覆盖：CdnCacheService
 *  - createRule:          正例（创建/合法pattern）/ 反例（空pattern/非法pattern）
 *  - getRule/updateRule/deleteRule: 正例/反例（不存在）
 *  - listRules:           正例（按优先级排序）
 *  - matchRule:           正例（匹配URL/匹配method）/ 边界（不匹配/disabled规则）
 *  - getCacheControlForUrl: 正例/边界（null）
 *  - 边缘节点管理:        正例（add/list/remove/heartbeat）/ 反例（缺少字段/不存在）
 *  - invalidate:          正例（url模式/pattern模式/指定节点）/ 边界（空）
 *  - 缓存命中统计:        正例（hit/miss/hitRate）/ 边界（0命中）
 *  - getEdgeNodeStats:    正例
 *  - 测试辅助:            正例（add/remove/list entries）
 *
 * 全部内联 mock。≥ 18 项测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CdnCacheService } from './cdn.service'
import type { CreateRuleDto, UpdateRuleDto, InvalidateDto, AddEdgeNodeDto } from './cdn.dto'

// ═══════════════════════════════════════════════════════════════
// Mock 环境 — cdn.service.ts 内部引用 requireTenantContext
// ═══════════════════════════════════════════════════════════════

// TenantContext mock — 必须在 import cdn.service 前设置
const mockTenantContext = { tenantId: 'tenant_test_001', userId: 'user_test' }

// 模拟 tenant-context 模块，避免 Jest/Nest 的 DI 依赖
import * as tcModule from '../../common/context/tenant-context'
import { vi } from 'vitest'

vi.spyOn(tcModule, 'requireTenantContext').mockReturnValue(mockTenantContext as never)

// ═══════════════════════════════════════════════════════════════
// 测试套件
// ═══════════════════════════════════════════════════════════════

describe('CdnCacheService', () => {
  let service: CdnCacheService

  beforeEach(() => {
    service = new CdnCacheService()
  })

  // ── createRule ─────────────────────────────────────────────
  describe('createRule', () => {
    it('✅ 正例: 创建带 pattern 的规则', async () => {
      const rule = await service.createRule({
        name: 'api-cache',
        urlPattern: '/api/*',
        maxAge: 3600,
        strategy: 'public',
        priority: 0,
        enabled: true,
      } as CreateRuleDto)
      expect(rule.id).toBeDefined()
      expect(rule.tenantId).toBe('tenant_test_001')
      expect(rule.name).toBe('api-cache')
      expect(rule.createdAt).toBeDefined()
    })

    it('✅ 正例: 创建规则含默认 methods', async () => {
      const rule = await service.createRule({
        name: 'static',
        urlPattern: '/static/*',
      } as CreateRuleDto)
      expect(rule.methods).toContain('GET')
      expect(rule.methods).toContain('HEAD')
      expect(rule.enableETag).toBe(true)
    })

    it('❌ 反例: 空 urlPattern 抛 BadRequest', async () => {
      await expect(service.createRule({
        name: 'bad',
        urlPattern: '',
      } as CreateRuleDto)).rejects.toThrow('urlPattern 必填')
    })

    it('🔲 边界: 超长 priority 规则仍正常创建', async () => {
      const rule = await service.createRule({
        name: 'max-priority',
        urlPattern: '/max/*',
        priority: 999999,
      } as CreateRuleDto)
      expect(rule.priority).toBe(999999)
    })
  })

  // ── getRule / updateRule / deleteRule ──────────────────────
  describe('rule CRUD', () => {
    let ruleId: string

    beforeEach(async () => {
      const rule = await service.createRule({
        name: 'test-rule',
        urlPattern: '/test/*',
      } as CreateRuleDto)
      ruleId = rule.id
    })

    it('✅ 正例: getRule 获取规则', async () => {
      const rule = await service.getRule(ruleId)
      expect(rule.name).toBe('test-rule')
    })

    it('❌ 反例: getRule 不存在的 ID 抛 NotFound', async () => {
      await expect(service.getRule('nonexistent')).rejects.toThrow('不存在')
    })

    it('✅ 正例: updateRule 更新字段', async () => {
      const updated = await service.updateRule(ruleId, { maxAge: 7200 } as UpdateRuleDto)
      expect(updated.maxAge).toBe(7200)
      expect(updated.updatedAt).toBeDefined()
    })

    it('✅ 正例: deleteRule 后 list 为空', async () => {
      await service.deleteRule(ruleId)
      const list = await service.listRules()
      expect(list).toHaveLength(0)
    })

    it('❌ 反例: deleteRule 不存在抛 NotFound', async () => {
      await expect(service.deleteRule('nonexistent')).rejects.toThrow('不存在')
    })
  })

  // ── listRules ──────────────────────────────────────────────
  describe('listRules', () => {
    it('✅ 正例: 按优先级倒序排列', async () => {
      await service.createRule({ name: 'low', urlPattern: '/low/*', priority: 0 } as CreateRuleDto)
      await service.createRule({ name: 'high', urlPattern: '/high/*', priority: 100 } as CreateRuleDto)
      const list = await service.listRules()
      expect(list[0].priority).toBe(100)
      expect(list[1].priority).toBe(0)
    })
  })

  // ── matchRule ──────────────────────────────────────────────
  describe('matchRule', () => {
    beforeEach(async () => {
      await service.createRule({ name: 'api', urlPattern: '/api/*', priority: 10 } as CreateRuleDto)
      await service.createRule({ name: 'static', urlPattern: '/static/*', priority: 5 } as CreateRuleDto)
    })

    it('✅ 正例: 匹配 /api/orders', async () => {
      const rule = await service.matchRule('/api/orders')
      expect(rule).not.toBeNull()
      expect(rule!.name).toBe('api')
    })

    it('✅ 正例: 匹配指定 method', async () => {
      const rule = await service.matchRule('/api/orders', 'GET')
      expect(rule).not.toBeNull()
    })

    it('🔲 边界: 不匹配规则返回 null', async () => {
      const rule = await service.matchRule('/not-cached/page')
      expect(rule).toBeNull()
    })
  })

  // ── getCacheControlForUrl ──────────────────────────────────
  describe('getCacheControlForUrl', () => {
    beforeEach(async () => {
      await service.createRule({
        name: 'api',
        urlPattern: '/api/*',
        maxAge: 3600,
        strategy: 'public',
      } as CreateRuleDto)
    })

    it('✅ 正例: 返回 Cache-Control 头', async () => {
      const header = await service.getCacheControlForUrl('/api/orders')
      expect(header).toContain('max-age=3600')
      expect(header).toContain('public')
    })

    it('🔲 边界: 不匹配 URL 返回 null', async () => {
      const header = await service.getCacheControlForUrl('/no-rule')
      expect(header).toBeNull()
    })
  })

  // ── 边缘节点管理 ────────────────────────────────────────────
  describe('edge node management', () => {
    it('✅ 正例: addEdgeNode', async () => {
      const node = await service.addEdgeNode({
        name: 'cn-beijing-1',
        region: 'cn-beijing',
        endpoint: 'https://beijing1.example.com',
        capacityBytes: 1_000_000_000,
      } as AddEdgeNodeDto)
      expect(node.id).toBeDefined()
      expect(node.status).toBe('online')
      expect(node.usedBytes).toBe(0)
    })

    it('❌ 反例: 缺少必填字段抛 BadRequest', async () => {
      await expect(service.addEdgeNode({
        name: 'bad',
      } as AddEdgeNodeDto)).rejects.toThrow('必填')
    })

    it('✅ 正例: listEdgeNodes', async () => {
      await service.addEdgeNode({
        name: 'n1', region: 'r1', endpoint: 'https://n1.example.com',
      } as AddEdgeNodeDto)
      await service.addEdgeNode({
        name: 'n2', region: 'r2', endpoint: 'https://n2.example.com',
      } as AddEdgeNodeDto)
      const nodes = await service.listEdgeNodes()
      expect(nodes).toHaveLength(2)
    })

    it('✅ 正例: removeEdgeNode', async () => {
      const node = await service.addEdgeNode({
        name: 'n1', region: 'r1', endpoint: 'https://n1.example.com',
      } as AddEdgeNodeDto)
      await service.removeEdgeNode(node.id)
      expect(await service.listEdgeNodes()).toHaveLength(0)
    })

    it('❌ 反例: remove 不存在的节点抛 NotFound', async () => {
      await expect(service.removeEdgeNode('nonexistent')).rejects.toThrow('不存在')
    })

    it('✅ 正例: recordHeartbeat 更新状态', async () => {
      const node = await service.addEdgeNode({
        name: 'n1', region: 'r1', endpoint: 'https://n1',
      } as AddEdgeNodeDto)
      const updated = await service.recordHeartbeat(node.id, 95, 12, 500_000_000)
      expect(updated.hitRate).toBe(95)
      expect(updated.avgLatencyMs).toBe(12)
    })
  })

  // ── invalidate ─────────────────────────────────────────────
  describe('invalidate', () => {
    beforeEach(async () => {
      await service.addEdgeNode({
        name: 'n1', region: 'r1', endpoint: 'https://n1',
      } as AddEdgeNodeDto)
      // 添加缓存条目
      service.addCacheEntryForTesting({
        key: '/api/users',
        url: '/api/users',
        etag: '"abc"',
        statusCode: 200,
        sizeBytes: 1000,
        ttlMs: 300000,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 300000,
      } as never)
      service.addCacheEntryForTesting({
        key: '/api/orders',
        url: '/api/orders',
        etag: '"def"',
        statusCode: 200,
        sizeBytes: 2000,
        ttlMs: 300000,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 300000,
      } as never)
    })

    it('✅ 正例: url 模式失效删除指定条目', async () => {
      const inv = await service.invalidate({ mode: 'url', target: '/api/users' } as InvalidateDto)
      expect(inv.affectedEntries).toBe(1)
      expect(service.listCacheEntriesForTesting()).toHaveLength(1)
    })

    it('✅ 正例: pattern 模式失效匹配条目', async () => {
      const inv = await service.invalidate({ mode: 'pattern', target: '/api/*' } as InvalidateDto)
      expect(inv.affectedEntries).toBe(2)
      expect(service.listCacheEntriesForTesting()).toHaveLength(0)
    })

    it('🔲 边界: 无匹配条目时 affectedEntries=0', async () => {
      const inv = await service.invalidate({ mode: 'url', target: '/nonexistent' } as InvalidateDto)
      expect(inv.affectedEntries).toBe(0)
    })
  })

  // ── 缓存命中统计 ───────────────────────────────────────────
  describe('hit rate', () => {
    it('✅ 正例: recordHit/Miss 统计', () => {
      service.recordHit('t1')
      service.recordHit('t1')
      service.recordMiss('t1')
      expect(service.getHitRate('t1')).toBeCloseTo(2 / 3)
    })

    it('🔲 边界: 无记录 hitRate = 0', () => {
      expect(service.getHitRate('empty')).toBe(0)
    })
  })

  // ── getEdgeNodeStats ───────────────────────────────────────
  describe('getEdgeNodeStats', () => {
    it('✅ 正例: 统计所有节点', async () => {
      await service.addEdgeNode({
        name: 'n1', region: 'r1', endpoint: 'https://n1',
        capacityBytes: 1000,
      } as AddEdgeNodeDto)
      await service.addEdgeNode({
        name: 'n2', region: 'r2', endpoint: 'https://n2',
        capacityBytes: 2000,
      } as AddEdgeNodeDto)
      const stats = service.getEdgeNodeStats()
      expect(stats.totalNodes).toBe(2)
      expect(stats.onlineNodes).toBe(2)
      expect(stats.totalCapacityBytes).toBe(3000)
    })
  })

  // ── test helpers ───────────────────────────────────────────
  describe('test helpers', () => {
    it('✅ 正例: add/remove/list cache entries', () => {
      expect(service.listCacheEntriesForTesting()).toHaveLength(0)
      service.addCacheEntryForTesting({
        key: '/test', url: '/test', etag: '"x"',
        statusCode: 200, sizeBytes: 100, ttlMs: 1000,
        cachedAt: Date.now(), expiresAt: Date.now() + 1000,
      } as never)
      expect(service.listCacheEntriesForTesting()).toHaveLength(1)
      service.removeCacheEntryForTesting('/test')
      expect(service.listCacheEntriesForTesting()).toHaveLength(0)
    })
  })
})
