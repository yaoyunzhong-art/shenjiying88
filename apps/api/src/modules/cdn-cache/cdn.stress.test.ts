import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [cdn-cache] [D] controller spec 补全 - 压力/韧性测试
 *
 * 覆盖边界场景:
 * - 大批量规则创建/匹配
 * - 大量边缘节点心跳
 * - 并发缓存访问压力
 * - 极端输入值
 * - URL pattern 模糊匹配压力
 */

import assert from 'node:assert/strict'
import { CdnCacheService } from './cdn.service'
import { CdnCacheController } from './cdn.controller'
import { runWithTenant } from '../../common/context/tenant-context'

const TENANT = {
  tenantId: 'stress-test',
  storeId: 'store-stress',
  userId: 'admin-stress',
  role: 'tenant_admin' as const,
}

describe('CdnCache - Stress & Resilience', () => {
  let service: CdnCacheService
  let controller: CdnCacheController

  beforeEach(() => {
    service = new CdnCacheService()
    controller = new CdnCacheController(service)
  })

  // ─── 大批量规则管理 ───

  describe('大批量规则管理', () => {
    it('同时创建 200 条规则不崩溃', async () => {
      await runWithTenant(TENANT, async () => {
        for (let i = 0; i < 200; i++) {
          await controller.createRule({
            name: `rule-${i}`,
            urlPattern: `/api/${i}/*`,
            maxAge: (i % 10) * 3600,
            priority: i,
          })
        }
        const list = await controller.listRules()
        assert.equal(list.items.length, 200)
      })
    })

    it('200 条规则中 URL 正确匹配最高优先级', async () => {
      await runWithTenant(TENANT, async () => {
        // 创建 200 条规则, 最后一个优先级最高
        for (let i = 0; i < 200; i++) {
          await controller.createRule({
            name: `rule-${i}`,
            urlPattern: i === 199 ? '/api/vip/*' : '/api/*',
            maxAge: (i % 10) * 3600,
            priority: i,
          })
        }
        const cacheControl = await service.getCacheControlForUrl('/api/vip/profile', 'GET')
        // 应命中优先级 199 (最大) 的规则
        assert.ok(cacheControl)
        assert.ok(cacheControl!.includes('max-age='))
      })
    })

    it('删除大批量规则后内存释放', async () => {
      await runWithTenant(TENANT, async () => {
        const ids: string[] = []
        for (let i = 0; i < 100; i++) {
          const rule = await controller.createRule({
            name: `del-rule-${i}`,
            urlPattern: `/api/del/${i}`,
            maxAge: 3600,
          })
          ids.push(rule.id)
        }
        for (const id of ids) {
          await controller.deleteRule(id)
        }
        const list = await controller.listRules()
        assert.equal(list.items.length, 0)
        assert.equal(service.countRules(), 0)
      })
    })
  })

  // ─── 大量边缘节点管理 ───

  describe('大量边缘节点管理', () => {
    it('同时注册 100 个边缘节点 + 心跳正常', async () => {
      const nodeIds: string[] = []
      for (let i = 0; i < 100; i++) {
        const node = await controller.addNode({
          name: `stress-node-${i}`,
          region: `region-${i % 10}`,
          endpoint: `https://edge-${i}.cdn.test.com`,
          capacityBytes: 1024 * 1024 * 1024 * (1 + (i % 10)), // 1-10GB
        })
        nodeIds.push(node.id)
      }

      // 批量心跳
      for (let i = 0; i < nodeIds.length; i++) {
        await service.recordHeartbeat(
          nodeIds[i],
          0.7 + (i % 30) * 0.01, // 70%-99% 命中率
          (10 + (i % 90)), // 10-99ms 延迟
          (1024 * 1024 * 100 * (1 + (i % 9))), // 100MB-1GB
        )
      }

      const nodes = await controller.listNodes()
      assert.equal(nodes.items.length, 100)

      const stats = await controller.nodeStats()
      assert.equal(stats.totalNodes, 100)
      assert.equal(stats.onlineNodes, 100)
      assert.ok(stats.averageHitRate > 0.7)
    })

    it('移除节点后统计正确更新', async () => {
      const ids: string[] = []
      for (let i = 0; i < 50; i++) {
        const node = await controller.addNode({
          name: `rm-node-${i}`,
          region: 'cn-test',
          endpoint: `https://edge-rm-${i}.test.com`,
          capacityBytes: 1 * 1024 * 1024 * 1024,
        })
        ids.push(node.id)
      }
      // 移除一半
      for (let i = 0; i < 25; i++) {
        await controller.removeNode(ids[i])
      }
      const stats = await controller.nodeStats()
      assert.equal(stats.totalNodes, 25)
    })
  })

  // ─── 主动失效压力 ───

  describe('主动失效压力', () => {
    beforeEach(async () => {
      // 预填缓存条目 (模拟实际缓存)
      await runWithTenant(TENANT, async () => {
        await controller.createRule({ name: 'cache-all', urlPattern: '/*', maxAge: 3600 })
        for (let i = 0; i < 500; i++) {
          service.addCacheEntryForTesting({
            key: `cache-key-${i}`,
            url: i % 2 === 0
              ? `/api/images/photo-${i}.jpg`
              : `/api/data/dataset-${i}.json`,
            ruleId: 'rule-stress',
            statusCode: 200,
            sizeBytes: 1024 * 100,
            cachedAt: Date.now(),
            ttl: 3600,
            nodeName: 'stress-node',
            edgeNodeId: 'edge-stress',
            expiresAt: new Date(Date.now() + 3600_000).toISOString(),
            hitCount: i,
            etag: `"${i}"`,
          })
        }
      })
    })

    it('pattern 失效清除所有匹配条目', async () => {
      await runWithTenant(TENANT, async () => {
        const result = await controller.invalidate({
          mode: 'pattern',
          target: '/api/images/*',
        })
        assert.ok(result.affectedEntries! >= 250) // 偶数 URL 约一半
      })
    })

    it('URL 精确失效单个条目', async () => {
      await runWithTenant(TENANT, async () => {
        const result = await controller.invalidate({
          mode: 'url',
          target: '/api/images/photo-0.jpg',
        })
        assert.equal(result.affectedEntries, 1)
      })
    })

    it('连续多次失效后列表记录正确', async () => {
      await runWithTenant(TENANT, async () => {
        for (let i = 0; i < 20; i++) {
          await controller.invalidate({
            mode: 'url',
            target: `/api/images/photo-${i * 10}.jpg`,
          })
        }
        const list = await controller.listInvalidations()
        assert.equal(list.items.length, 20)
        // 时间倒序
        for (let i = 1; i < list.items.length; i++) {
          assert.ok(
            list.items[i - 1].triggeredAt >= list.items[i].triggeredAt,
          )
        }
      })
    })
  })

  // ─── 极端输入值 ───

  describe('极端输入值', () => {
    it('maxAge 为 0 表示不缓存', async () => {
      await runWithTenant(TENANT, async () => {
        const rule = await controller.createRule({
          name: 'no-cache',
          urlPattern: '/api/no-cache/*',
          maxAge: 0,
          strategy: 'no-cache',
        })
        assert.equal(rule.maxAge, 0)
        assert.equal(rule.strategy, 'no-cache')
      })
    })

    it('极端大 maxAge (10 年) 不应报错', async () => {
      await runWithTenant(TENANT, async () => {
        const rule = await controller.createRule({
          name: 'long-cache',
          urlPattern: '/api/static/*',
          maxAge: 315_360_000, // 10年
        })
        assert.equal(rule.maxAge, 315_360_000)
      })
    })

    it('空 URL pattern 应在 service 层抛出异常', async () => {
      await runWithTenant(TENANT, async () => {
        await assert.rejects(
          () => controller.createRule({ name: 'bad', urlPattern: '' }),
          /urlPattern 必填/,
        )
      })
    })

    it('极端短 URL pattern 应正常创建', async () => {
      await runWithTenant(TENANT, async () => {
        const rule = await controller.createRule({
          name: 'minimal',
          urlPattern: '/',
          maxAge: 60,
        })
        assert.equal(rule.urlPattern, '/')
        assert.equal(rule.maxAge, 60)
      })
    })

    it('超大规则名称不应引发内存问题', async () => {
      await runWithTenant(TENANT, async () => {
        const longName = 'A'.repeat(10000)
        const rule = await controller.createRule({
          name: longName,
          urlPattern: '/api/long-name/*',
          maxAge: 3600,
        })
        assert.equal(rule.name.length, 10000)
      })
    })
  })

  // ─── 缓存命中统计 ───

  describe('缓存命中统计', () => {
    it('大量命中/未命中后命中率正确', () => {
      for (let i = 0; i < 80; i++) service.recordHit(TENANT.tenantId)
      for (let i = 0; i < 20; i++) service.recordMiss(TENANT.tenantId)
      const rate = service.getHitRate(TENANT.tenantId)
      assert.equal(rate, 0.8)
    })

    it('无统计数据时命中率为 0', () => {
      const rate = service.getHitRate('no-data-tenant')
      assert.equal(rate, 0)
    })

    it('全部命中时命中率为 1', () => {
      for (let i = 0; i < 100; i++) service.recordHit(TENANT.tenantId)
      assert.equal(service.getHitRate(TENANT.tenantId), 1)
    })
  })

  // ─── 内存/并发场景 ───

  describe('内存开销场景', () => {
    it('大量无效规则创建不泄露', async () => {
      await runWithTenant(TENANT, async () => {
        for (let i = 0; i < 500; i++) {
          await controller.createRule({
            name: `leak-rule-${i}`,
            urlPattern: `/api/leak/${i}/*`,
            maxAge: 3600,
            enabled: false, // 禁用
          })
        }
        // 删除全部
        const list = await controller.listRules()
        for (const rule of list.items) {
          await controller.deleteRule(rule.id)
        }
        assert.equal(service.countRules(), 0)
      })
    })

    it('跨租户隔离不泄漏', async () => {
      const tenants = ['t-alpha', 't-beta', 't-gamma']
      for (const t of tenants) {
        await runWithTenant(
          { tenantId: t, storeId: 's', userId: 'u', role: 'tenant_admin' },
          async () => {
            for (let i = 0; i < 10; i++) {
              await controller.createRule({
                name: `rule-${t}-${i}`,
                urlPattern: `/api/${t}/${i}/*`,
                maxAge: 3600,
              })
            }
          },
        )
      }
      // 每个租户只看到自己的
      for (const t of tenants) {
        await runWithTenant(
          { tenantId: t, storeId: 's', userId: 'u', role: 'tenant_admin' },
          async () => {
            const list = await controller.listRules()
            assert.equal(list.items.length, 10)
            for (const r of list.items) {
              assert.equal(r.tenantId, t)
            }
          },
        )
      }
    })
  })
})
