import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase 98 CDN Cache Controller Spec (V10 Sprint 2 Day 29)
 *
 * Covers:
 * - 规则 CRUD 正常流程 + 边界
 * - URL 匹配
 * - 边缘节点管理
 * - 主动失效
 */
import assert from 'node:assert/strict'
import { CdnCacheController } from './cdn.controller'
import { CdnCacheService } from './cdn.service'
import { runWithTenant } from '../../common/context/tenant-context'

const TENANT = {
  tenantId: 'ctrl-test',
  storeId: 'store-ctrl',
  userId: 'admin-ctrl',
  role: 'tenant_admin' as const,
}

describe('CdnCacheController', () => {
  let controller: CdnCacheController
  let service: CdnCacheService

  beforeEach(() => {
    service = new CdnCacheService()
    controller = new CdnCacheController(service)
  })

  describe('POST /cdn/rules — 创建规则', () => {
    it('应成功创建规则并返回对象', async () => {
      const rule = await runWithTenant(TENANT, () =>
        controller.createRule({
          name: 'test-rule',
          urlPattern: '/api/images/*',
          maxAge: 7200,
        }),
      )
      assert.ok(rule.id)
      assert.equal(rule.name, 'test-rule')
      assert.equal(rule.urlPattern, '/api/images/*')
      assert.equal(rule.maxAge, 7200)
    })

    it('传入空 urlPattern 时应在 service 层抛错', async () => {
      await assert.rejects(
        () => runWithTenant(TENANT, () =>
          controller.createRule({ name: 'bad', urlPattern: '' }),
        ),
        /urlPattern 必填/,
      )
    })
  })

  describe('GET /cdn/rules — 列表', () => {
    it('空租户返回空列表', async () => {
      const res = await runWithTenant(TENANT, () => controller.listRules())
      assert.deepEqual(res, { items: [] })
    })

    it('创建后列表非空', async () => {
      await runWithTenant(TENANT, () =>
        controller.createRule({ name: 'r1', urlPattern: '/api/*' }),
      )
      const res = await runWithTenant(TENANT, () => controller.listRules())
      assert.equal(res.items.length, 1)
      assert.equal(res.items[0].name, 'r1')
    })
  })

  describe('GET /cdn/rules/:id — 详情', () => {
    it('应返回已存在规则', async () => {
      const rule = await runWithTenant(TENANT, () =>
        controller.createRule({ name: 'detail-test', urlPattern: '/api/*' }),
      )
      const found = await runWithTenant(TENANT, () => controller.getRule(rule.id))
      assert.equal(found.id, rule.id)
    })

    it('不存在的 id 返回 404', async () => {
      await assert.rejects(
        () => runWithTenant(TENANT, () => controller.getRule('nonexistent')),
        /不存在/,
      )
    })
  })

  describe('PATCH /cdn/rules/:id — 更新', () => {
    it('应更新部分字段', async () => {
      const rule = await runWithTenant(TENANT, () =>
        controller.createRule({ name: 'update-test', urlPattern: '/api/*', maxAge: 300 }),
      )
      const updated = await runWithTenant(TENANT, () =>
        controller.updateRule(rule.id, { maxAge: 600 }),
      )
      assert.equal(updated.maxAge, 600)
      assert.equal(updated.name, 'update-test')
    })
  })

  describe('DELETE /cdn/rules/:id — 删除', () => {
    it('删除后规则不存在', async () => {
      const rule = await runWithTenant(TENANT, () =>
        controller.createRule({ name: 'delete-test', urlPattern: '/api/*' }),
      )
      await runWithTenant(TENANT, () => controller.deleteRule(rule.id))
      await assert.rejects(
        () => runWithTenant(TENANT, () => controller.getRule(rule.id)),
        /不存在/,
      )
    })
  })

  describe('GET /cdn/match — URL 匹配', () => {
    it('匹配已有规则', async () => {
      await runWithTenant(TENANT, () =>
        controller.createRule({ name: 'match-test', urlPattern: '/api/reports/:id', priority: 10 }),
      )
      const res = await runWithTenant(TENANT, () =>
        controller.match({ url: '/api/reports/rpt-001', method: 'GET' }),
      )
      assert.equal(res.matched, true)
      assert.ok(res.rule)
      assert.ok(res.cacheControl)
    })

    it('无匹配规则返回 matched=false', async () => {
      const res = await runWithTenant(TENANT, () =>
        controller.match({ url: '/no-match', method: 'GET' }),
      )
      assert.equal(res.matched, false)
      assert.equal(res.rule, null)
      assert.equal(res.cacheControl, null)
    })
  })

  describe('POST /cdn/nodes — 添加边缘节点', () => {
    it('应成功添加节点', async () => {
      const node = await controller.addNode({
        name: 'edge-test',
        region: 'cn-beijing',
        endpoint: 'https://edge.beijing.test.com',
        capacityBytes: 5 * 1024 ** 3,
      })
      assert.ok(node.id)
      assert.equal(node.name, 'edge-test')
      assert.equal(node.status, 'online')
    })

    it('缺少 name 时抛出错误', async () => {
      await assert.rejects(
        () => controller.addNode({ name: '', region: 'cn-test', endpoint: 'https://x.com', capacityBytes: 100 }),
        /name.*region.*endpoint.*必填/,
      )
    })
  })

  describe('GET /cdn/nodes — 节点列表', () => {
    it('有节点时返回列表', async () => {
      await controller.addNode({
        name: 'n1', region: 'cn-shanghai', endpoint: 'https://e1.com', capacityBytes: 1000,
      })
      const res = await controller.listNodes()
      assert.equal(res.items.length, 1)
    })

    it('空节点列表', async () => {
      const res = await controller.listNodes()
      assert.equal(res.items.length, 0)
    })
  })

  describe('GET /cdn/nodes/stats — 节点统计', () => {
    it('返回正确格式', async () => {
      await controller.addNode({
        name: 'n1', region: 'cn-shanghai', endpoint: 'https://e1.com', capacityBytes: 1000,
      })
      const stats = await controller.nodeStats()
      assert.ok(stats.totalNodes >= 1)
      assert.equal(typeof stats.onlineNodes, 'number')
      assert.equal(typeof stats.totalCapacityBytes, 'number')
      assert.equal(typeof stats.averageHitRate, 'number')
    })
  })

  describe('POST /cdn/invalidate — 主动失效', () => {
    it('URL 精确失效', async () => {
      service.addCacheEntryForTesting({
        key: '/api/img/1', ruleId: 'r1', edgeNodeId: 'e1',
        url: '/api/img/1', statusCode: 200, sizeBytes: 100,
        cachedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString(),
        hitCount: 0,
      })
      const inv = await runWithTenant(TENANT, () =>
        controller.invalidate({ mode: 'url', target: '/api/img/1' }),
      )
      assert.equal(inv.affectedEntries, 1)
      assert.equal(inv.status, 'completed')
    })
  })
})
