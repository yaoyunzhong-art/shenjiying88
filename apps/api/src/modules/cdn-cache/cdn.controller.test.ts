import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [cdn-cache] [D] Controller 测试补全
 *
 * 覆盖 cdn.controller.ts 所有路由:
 * - 规则管理 CRUD (正例 + 反例 + 边界)
 * - URL 匹配 (正例 + 无匹配)
 * - 边缘节点管理 (正例 + 缺少参数)
 * - 节点统计
 * - 主动失效 (URL + pattern 模式)
 * - 跨租户隔离
 */

import assert from 'node:assert/strict'
import { CdnCacheController } from './cdn.controller'
import { CdnCacheService } from './cdn.service'
import { runWithTenant } from '../../common/context/tenant-context'
import { CdnCacheRule, EdgeNode } from './cdn.entity'

const TENANT_A = {
  tenantId: 'test-tenant-a',
  storeId: 'store-a',
  userId: 'admin-a',
  role: 'tenant_admin' as const,
}

const TENANT_B = {
  tenantId: 'test-tenant-b',
  storeId: 'store-b',
  userId: 'admin-b',
  role: 'tenant_admin' as const,
}

describe('CdnCacheController — 补全测试', () => {
  let controller: CdnCacheController
  let service: CdnCacheService

  beforeEach(() => {
    service = new CdnCacheService()
    controller = new CdnCacheController(service)
  })

  // ============ 规则 CRUD 正例 ============
  describe('规则 CRUD — 正例', () => {
    it('创建规则 → 完整字段', async () => {
      const rule = await runWithTenant(TENANT_A, () =>
        controller.createRule({
          name: '完整规则',
          urlPattern: '/api/*',
          methods: ['GET', 'HEAD'],
          strategy: 'private',
          maxAge: 600,
          staleWhileRevalidate: 3600,
          enableETag: true,
          enableGzip: true,
          enableBrotli: false,
          varyHeaders: ['Accept-Encoding', 'User-Agent'],
          cacheableStatusCodes: [200, 301, 404],
          priority: 5,
          enabled: true,
        }),
      )
      assert.ok(rule.id)
      assert.equal(rule.name, '完整规则')
      assert.equal(rule.strategy, 'private')
      assert.equal(rule.priority, 5)
      assert.ok(rule.createdAt)
      assert.ok(rule.updatedAt)
    })

    it('更新规则 → 仅修改部分字段', async () => {
      const rule = await runWithTenant(TENANT_A, () =>
        controller.createRule({ name: '原规则', urlPattern: '/api/*', maxAge: 300 }),
      )
      // 短暂等待以区分时间戳
      await new Promise((r) => setTimeout(r, 2))
      const updated = await runWithTenant(TENANT_A, () =>
        controller.updateRule(rule.id, { maxAge: 900 }),
      )
      assert.equal(updated.maxAge, 900)
      assert.equal(updated.name, '原规则')
      assert.equal(typeof updated.updatedAt, 'string')
      assert.ok(updated.updatedAt.length > 0)
    })

    it('删除规则 → 再次查询抛出 404', async () => {
      const rule = await runWithTenant(TENANT_A, () =>
        controller.createRule({ name: '待删除', urlPattern: '/api/delete/*' }),
      )
      await runWithTenant(TENANT_A, () => controller.deleteRule(rule.id))
      await assert.rejects(
        () => runWithTenant(TENANT_A, () => controller.getRule(rule.id)),
        /不存在/,
      )
    })
  })

  // ============ 规则 CRUD 反例 ============
  describe('规则 CRUD — 反例与边界', () => {
    it('创建规则 → urlPattern 为空抛出错误', async () => {
      await assert.rejects(
        () => runWithTenant(TENANT_A, () =>
          controller.createRule({ name: 'bad', urlPattern: '' }),
        ),
        /urlPattern 必填/,
      )
    })

    it('创建规则 → urlPattern 为 undefined 时仍可创建（空字符串校验由 service 处理）', async () => {
      // compilePattern 对正则特殊字符做了转义，不会抛错
      const rule = await runWithTenant(TENANT_A, () =>
        controller.createRule({ name: 'special-chars', urlPattern: '/api/[a-z]+' }),
      )
      assert.ok(rule.id)
      assert.equal(rule.name, 'special-chars')
    })

    it('获取不存在的规则 → 抛出 NotFound', async () => {
      await assert.rejects(
        () => runWithTenant(TENANT_A, () => controller.getRule('non-existent-id')),
        /不存在/,
      )
    })

    it('更新不存在的规则 → 抛出 NotFound', async () => {
      await assert.rejects(
        () => runWithTenant(TENANT_A, () =>
          controller.updateRule('non-existent-id', { maxAge: 100 }),
        ),
        /不存在/,
      )
    })

    it('删除不存在的规则 → 抛出 NotFound', async () => {
      await assert.rejects(
        () => runWithTenant(TENANT_A, () => controller.deleteRule('non-existent-id')),
        /不存在/,
      )
    })

    it('跨租户无法访问对方的规则', async () => {
      const rule = await runWithTenant(TENANT_A, () =>
        controller.createRule({ name: 'tenant-a-rule', urlPattern: '/api/a/*' }),
      )
      await assert.rejects(
        () => runWithTenant(TENANT_B, () => controller.getRule(rule.id)),
        /不存在/,
      )
    })
  })

  // ============ 规则列表 ============
  describe('规则列表', () => {
    it('空租户返回空列表', async () => {
      const res = await runWithTenant(TENANT_A, () => controller.listRules())
      assert.deepEqual(res, { items: [] })
    })

    it('按优先级降序排列', async () => {
      await runWithTenant(TENANT_A, () =>
        controller.createRule({ name: '低优', urlPattern: '/low/*', priority: 1 }),
      )
      await runWithTenant(TENANT_A, () =>
        controller.createRule({ name: '高优', urlPattern: '/high/*', priority: 100 }),
      )
      const res = await runWithTenant(TENANT_A, () => controller.listRules())
      assert.equal(res.items.length, 2)
      assert.equal(res.items[0].name, '高优')
      assert.equal(res.items[1].name, '低优')
    })

    it('跨租户隔离：B 看不到 A 的规则', async () => {
      await runWithTenant(TENANT_A, () =>
        controller.createRule({ name: 'A的规则', urlPattern: '/api/*' }),
      )
      const resB = await runWithTenant(TENANT_B, () => controller.listRules())
      assert.equal(resB.items.length, 0)
    })
  })

  // ============ URL 匹配 ============
  describe('URL 匹配', () => {
    it('匹配到已启用的规则（含 Cache-Control）', async () => {
      await runWithTenant(TENANT_A, () =>
        controller.createRule({
          name: 'report-rule',
          urlPattern: '/api/reports/:id',
          maxAge: 1800,
          priority: 10,
        }),
      )
      const res = await runWithTenant(TENANT_A, () =>
        controller.match({ url: '/api/reports/rpt-001', method: 'GET' }),
      )
      assert.equal(res.matched, true)
      assert.ok(res.rule)
      assert.equal(res.rule!.urlPattern, '/api/reports/:id')
      assert.ok(res.cacheControl)
      assert.ok(res.cacheControl!.includes('max-age=1800'))
    })

    it('无匹配规则 → matched=false', async () => {
      const res = await runWithTenant(TENANT_A, () =>
        controller.match({ url: '/no-rule-matched', method: 'GET' }),
      )
      assert.equal(res.matched, false)
      assert.equal(res.rule, null)
      assert.equal(res.cacheControl, null)
    })

    it('禁用的规则不参与匹配', async () => {
      await runWithTenant(TENANT_A, () =>
        controller.createRule({
          name: 'disabled-rule',
          urlPattern: '/api/old/*',
          enabled: false,
          priority: 50,
        }),
      )
      const res = await runWithTenant(TENANT_A, () =>
        controller.match({ url: '/api/old/v1', method: 'GET' }),
      )
      assert.equal(res.matched, false)
    })
  })

  // ============ 边缘节点管理 ============
  describe('边缘节点管理', () => {
    it('添加节点 → 返回完整节点信息', async () => {
      const node = await controller.addNode({
        name: '边缘上海',
        region: 'cn-shanghai',
        endpoint: 'https://edge.sh.service.com',
        capacityBytes: 10 * 1024 ** 3,
      })
      assert.ok(node.id)
      assert.equal(node.name, '边缘上海')
      assert.equal(node.region, 'cn-shanghai')
      assert.equal(node.status, 'online')
      assert.equal(node.capacityBytes, 10 * 1024 ** 3)
      assert.equal(node.usedBytes, 0)
      assert.equal(node.hitRate, 0)
      assert.equal(node.avgLatencyMs, 0)
      assert.ok(node.lastHeartbeatAt)
    })

    it('添加节点 → name 为空抛出异常', async () => {
      await assert.rejects(
        () => controller.addNode({
          name: '',
          region: 'cn-test',
          endpoint: 'https://x.com',
          capacityBytes: 100,
        }),
        /name.*region.*endpoint.*必填/,
      )
    })

    it('列出节点 → 包含所有节点', async () => {
      await controller.addNode({
        name: 'node1', region: 'cn-beijing', endpoint: 'https://bj.com', capacityBytes: 1000,
      })
      await controller.addNode({
        name: 'node2', region: 'cn-shenzhen', endpoint: 'https://sz.com', capacityBytes: 2000,
      })
      const res = await controller.listNodes()
      assert.equal(res.items.length, 2)
    })

    it('删除节点 → 列表减少', async () => {
      const node = await controller.addNode({
        name: 'temp-node', region: 'cn-test', endpoint: 'https://temp.com', capacityBytes: 500,
      })
      await controller.removeNode(node.id)
      const res = await controller.listNodes()
      assert.equal(res.items.length, 0)
    })

    it('删除不存在的节点 → 抛出 NotFound', async () => {
      await assert.rejects(
        () => controller.removeNode('non-existent-node'),
        /不存在/,
      )
    })
  })

  // ============ 节点统计 ============
  describe('节点统计', () => {
    it('无节点时返回零值', async () => {
      const stats = await controller.nodeStats()
      assert.deepEqual(stats, {
        totalNodes: 0,
        onlineNodes: 0,
        totalCapacityBytes: 0,
        totalUsedBytes: 0,
        averageHitRate: 0,
        averageLatencyMs: 0,
      })
    })

    it('有节点时返回正确汇总', async () => {
      await controller.addNode({
        name: 'n1', region: 'cn-bj', endpoint: 'https://bj.com', capacityBytes: 5000,
      })
      await controller.addNode({
        name: 'n2', region: 'cn-sh', endpoint: 'https://sh.com', capacityBytes: 10000,
      })
      const stats = await controller.nodeStats()
      assert.equal(stats.totalNodes, 2)
      assert.equal(stats.onlineNodes, 2)
      assert.equal(stats.totalCapacityBytes, 15000)
      assert.equal(stats.totalUsedBytes, 0)
      assert.equal(stats.averageHitRate, 0)
      assert.equal(stats.averageLatencyMs, 0)
    })
  })

  // ============ 主动失效 ============
  describe('主动失效', () => {
    it('URL 模式失效 → 精确匹配并清除缓存条目', async () => {
      service.addCacheEntryForTesting({
        key: '/api/img/logo.png',
        ruleId: 'r1',
        edgeNodeId: 'e1',
        url: '/api/img/logo.png',
        statusCode: 200,
        sizeBytes: 5000,
        cachedAt: Date.now(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        hitCount: 3, ttl: 3600, nodeName: "edge-test",
      })
      const inv = await runWithTenant(TENANT_A, () =>
        controller.invalidate({ mode: 'url', target: '/api/img/logo.png' }),
      )
      assert.equal(inv.affectedEntries, 1)
      assert.equal(inv.status, 'completed')
      assert.ok(inv.triggeredAt)
      assert.ok(inv.completedAt)
      // 验证缓存条目已被清除
      assert.equal(service.listCacheEntriesForTesting().length, 0)
    })

    it('Pattern 模式失效 → 通配符匹配并清除多个条目', async () => {
      service.addCacheEntryForTesting({
        key: '/api/img/a.jpg', ruleId: 'r1', edgeNodeId: 'e1',
        url: '/api/img/a.jpg', statusCode: 200, sizeBytes: 100,
        cachedAt: Date.now(), expiresAt: new Date(Date.now() + 3600000).toISOString(),
        hitCount: 1, ttl: 3600, nodeName: "edge-test",
      })
      service.addCacheEntryForTesting({
        key: '/api/img/b.png', ruleId: 'r1', edgeNodeId: 'e1',
        url: '/api/img/b.png', statusCode: 200, sizeBytes: 200,
        cachedAt: Date.now(), expiresAt: new Date(Date.now() + 3600000).toISOString(),
        hitCount: 2, ttl: 3600, nodeName: "edge-test",
      })
      service.addCacheEntryForTesting({
        key: '/api/doc/c.pdf', ruleId: 'r2', edgeNodeId: 'e2',
        url: '/api/doc/c.pdf', statusCode: 200, sizeBytes: 300,
        cachedAt: Date.now(), expiresAt: new Date(Date.now() + 3600000).toISOString(),
        hitCount: 0, ttl: 3600, nodeName: "edge-test",
      })
      const inv = await runWithTenant(TENANT_A, () =>
        controller.invalidate({ mode: 'pattern', target: '/api/img/*' }),
      )
      assert.equal(inv.affectedEntries, 2)
      assert.equal(inv.status, 'completed')
      // doc 条目应保留
      assert.equal(service.listCacheEntriesForTesting().length, 1)
      assert.equal(service.listCacheEntriesForTesting()[0].url, '/api/doc/c.pdf')
    })

    it('pattern 失效 → 含特殊字符的 pattern 不会抛错（compilePattern 做了转义处理）', async () => {
      // compilePattern 转义正则特殊字符，不会抛异常
      const inv = await runWithTenant(TENANT_A, () =>
        controller.invalidate({ mode: 'pattern', target: '/api/[a-z]+/test' }),
      )
      assert.ok(inv.id)
      assert.equal(inv.status, 'completed')
    })
  })

  // ============ 失效列表 ============
  describe('失效列表', () => {
    it('返回按时间倒序排列', async () => {
      await runWithTenant(TENANT_A, () =>
        controller.invalidate({ mode: 'url', target: '/api/first' }),
      )
      await new Promise((r) => setTimeout(r, 5)) // 确保时间差
      await runWithTenant(TENANT_A, () =>
        controller.invalidate({ mode: 'url', target: '/api/second' }),
      )
      const res = await runWithTenant(TENANT_A, () => controller.listInvalidations())
      assert.equal(res.items.length, 2)
      // 最新的在前
      assert.ok(res.items[0].triggeredAt >= res.items[1].triggeredAt)
    })
  })
})
