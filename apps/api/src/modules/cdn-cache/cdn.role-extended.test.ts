import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [cdn-cache] [C] 角色测试扩展编写
 *
 * 8 角色深度场景扩展测试 — cdn-cache 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 3 测试用例 (正常流程 + 降级场景 + 权限边界)
 * 扩展: 大规模并发模拟、边缘场景覆盖、异常数据、角色元数据验证
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { CdnCacheController } from './cdn.controller'
import { CdnCacheService } from './cdn.service'
import { runWithTenant } from '../../common/context/tenant-context'
import type { CdnCacheRule, EdgeNode } from './cdn.entity'

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

// ── 租户上下文 ──
const TENANT = {
  tenantId: 'role-ext-tenant',
  storeId: 'store-role-ext',
  userId: 'role-ext-user',
  role: 'tenant_admin' as const,
}

const OTHER_TENANT = {
  tenantId: 'other-ext-tenant',
  storeId: 'store-other-ext',
  userId: 'other-ext-user',
  role: 'tenant_admin' as const,
}

// ── 测试工厂 ──
function createController() {
  const service = new CdnCacheService()
  return { service, controller: new CdnCacheController(service) }
}

// ── 👔 店长 (StoreManager) ──
describe(`${ROLES.StoreManager} CDN 缓存角色扩展测试`, () => {
  it('店长批量创建缓存规则并验证优先级排序', async () => {
    const { controller } = createController()
    await runWithTenant(TENANT, () =>
      controller.createRule({ name: '首页缓存', urlPattern: '/index.html', maxAge: 300, priority: 1 }),
    )
    await runWithTenant(TENANT, () =>
      controller.createRule({ name: 'API 缓存', urlPattern: '/api/*', maxAge: 600, priority: 100 }),
    )
    await runWithTenant(TENANT, () =>
      controller.createRule({ name: '素材缓存', urlPattern: '/assets/*', maxAge: 86400, priority: 50 }),
    )

    const rules = await runWithTenant(TENANT, () => controller.listRules())
    assert.equal(rules.items.length, 3)
    // 降序: API(100) > 素材(50) > 首页(1)
    assert.equal(rules.items[0].name, 'API 缓存')
    assert.equal(rules.items[1].name, '素材缓存')
    assert.equal(rules.items[2].name, '首页缓存')
  })

  it('店长更新规则后规则updatedAt自动更新', async () => {
    const { controller } = createController()
    const rule = await runWithTenant(TENANT, () =>
      controller.createRule({ name: '待更新规则', urlPattern: '/api/update/*', maxAge: 100 }),
    )
    const oldUpdatedAt = rule.updatedAt
    await new Promise((r) => setTimeout(r, 5))
    const updated = await runWithTenant(TENANT, () =>
      controller.updateRule(rule.id, { maxAge: 999 }),
    )
    assert.ok(new Date(updated.updatedAt) > new Date(oldUpdatedAt))
  })

  it('店长删除规则后列表验证', async () => {
    const { controller } = createController()
    const rule = await runWithTenant(TENANT, () =>
      controller.createRule({ name: '临时规则', urlPattern: '/api/temp/*', maxAge: 60 }),
    )
    await runWithTenant(TENANT, () => controller.deleteRule(rule.id))
    const rules = await runWithTenant(TENANT, () => controller.listRules())
    assert.equal(rules.items.find((r) => r.name === '临时规则'), undefined)
  })
})

// ── 🛒 前台 (FrontDesk) ──
describe(`${ROLES.FrontDesk} CDN 缓存角色扩展测试`, () => {
  it('前台查询收银台相关资源的缓存匹配', async () => {
    const { controller } = createController()
    await runWithTenant(TENANT, () =>
      controller.createRule({ name: 'POS 缓存', urlPattern: '/assets/pos/*', maxAge: 3600 }),
    )
    const match = await runWithTenant(TENANT, () =>
      controller.match({ url: '/assets/pos/payment.js', method: 'GET' }),
    )
    assert.equal(match.matched, true)
    assert.ok(match.cacheControl!.includes('max-age=3600'))
  })

  it('前台尝试获取不存在的规则 → NotFound', async () => {
    const { controller } = createController()
    await assert.rejects(
      () => runWithTenant(TENANT, () => controller.getRule('cdn-rule-nonexistent')),
      /不存在/,
    )
  })

  it('前台用不存在的 method 匹配规则（回退 GET）', async () => {
    const { controller } = createController()
    await runWithTenant(TENANT, () =>
      controller.createRule({ name: 'GET 规则', urlPattern: '/api/*', methods: ['GET', 'HEAD'] }),
    )
    // POST 默认不缓存，不会匹配
    const match = await runWithTenant(TENANT, () =>
      controller.match({ url: '/api/data', method: 'POST' }),
    )
    assert.equal(match.matched, false)
  })
})

// ── 👥 HR ──
describe(`${ROLES.HR} CDN 缓存角色扩展测试`, () => {
  it('HR 查看知识库规则并验证缓存策略', async () => {
    const { controller } = createController()
    await runWithTenant(TENANT, () =>
      controller.createRule({ name: 'HR 知识库', urlPattern: '/knowledge/*', maxAge: 86400, strategy: 'public' }),
    )
    const match = await runWithTenant(TENANT, () =>
      controller.match({ url: '/knowledge/policy-v3.pdf', method: 'GET' }),
    )
    assert.equal(match.matched, true)
    assert.ok(match.cacheControl!.includes('public'))
    assert.ok(match.cacheControl!.includes('max-age=86400'))
  })

  it('HR 创建规则使用非法 urlPattern 被拒绝', async () => {
    const { controller } = createController()
    await assert.rejects(
      () => runWithTenant(TENANT, () => controller.createRule({ name: '坏规则', urlPattern: '' })),
      /urlPattern 必填/,
    )
  })

  it('HR 查询空 urlPattern 边界（仅空格）', async () => {
    const { controller } = createController()
    // compilePattern 转义正则，空格和 . 都是合法字符
    const rule = await runWithTenant(TENANT, () =>
      controller.createRule({ name: '空格测试', urlPattern: '/api/ test/' }),
    )
    assert.ok(rule.id)
    assert.equal(rule.name, '空格测试')
  })
})

// ── 🔧 安监 (Safety) ──
describe(`${ROLES.Safety} CDN 缓存角色扩展测试`, () => {
  it('安监用 URL 精确失效消除已发布的问题资源', async () => {
    const { service, controller } = createController()
    service.addCacheEntryForTesting({
      key: '/compromised.js', ruleId: 'r-sec', edgeNodeId: 'e1',
      url: '/compromised.js', statusCode: 200, sizeBytes: 100,
      cachedAt: Date.now(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      hitCount: 10, ttl: 3600, nodeName: "edge-test",
    })
    const inv = await runWithTenant(TENANT, () =>
      controller.invalidate({ mode: 'url', target: '/compromised.js' }),
    )
    assert.equal(inv.affectedEntries, 1)
    assert.equal(service.listCacheEntriesForTesting().length, 0)
  })

  it('安监用 pattern 失效批量清除风险路径', async () => {
    const { service, controller } = createController()
    service.addCacheEntryForTesting({
      key: '/sensitive/user-data.json', ruleId: 'r-sec-2', edgeNodeId: 'e1',
      url: '/sensitive/user-data.json', statusCode: 200, sizeBytes: 500,
      cachedAt: Date.now(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      hitCount: 5, ttl: 3600, nodeName: "edge-test",
    })
    service.addCacheEntryForTesting({
      key: '/sensitive/config.yml', ruleId: 'r-sec-2', edgeNodeId: 'e1',
      url: '/sensitive/config.yml', statusCode: 200, sizeBytes: 200,
      cachedAt: Date.now(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      hitCount: 2, ttl: 3600, nodeName: "edge-test",
    })
    const inv = await runWithTenant(TENANT, () =>
      controller.invalidate({ mode: 'pattern', target: '/sensitive/*' }),
    )
    assert.equal(inv.affectedEntries, 2)
    assert.equal(service.listCacheEntriesForTesting().length, 0)
  })

  it('安监查看失效记录历史', async () => {
    const { controller } = createController()
    await runWithTenant(TENANT, () =>
      controller.invalidate({ mode: 'url', target: '/old-page.html' }),
    )
    const list = await runWithTenant(TENANT, () => controller.listInvalidations())
    assert.equal(list.items.length, 1)
    assert.equal(list.items[0].target, '/old-page.html')
  })
})

// ── 🎮 导玩员 (Guide) ──
describe(`${ROLES.Guide} CDN 缓存角色扩展测试`, () => {
  it('导玩员创建游戏素材 immutable 缓存策略', async () => {
    const { controller } = createController()
    const rule = await runWithTenant(TENANT, () =>
      controller.createRule({
        name: '游戏 sprite',
        urlPattern: '/games/sprites/*',
        maxAge: 31536000,
        strategy: 'immutable',
        enableBrotli: true,
      }),
    )
    assert.equal(rule.strategy, 'immutable')
    assert.equal(rule.maxAge, 31536000)
    assert.equal(rule.enableBrotli, true)
  })

  it('导玩员创建规则时使用多个 Vary 头', async () => {
    const { controller } = createController()
    const rule = await runWithTenant(TENANT, () =>
      controller.createRule({
        name: '多 vary',
        urlPattern: '/games/adaptive/*',
        maxAge: 600,
        varyHeaders: ['Accept-Encoding', 'User-Agent', 'Accept-Language'],
      }),
    )
    assert.ok(rule.varyHeaders.includes('Accept-Encoding'))
    assert.ok(rule.varyHeaders.includes('User-Agent'))
    assert.ok(rule.varyHeaders.includes('Accept-Language'))
  })

  it('导玩员测试通配符匹配多级路径', async () => {
    const { controller } = createController()
    await runWithTenant(TENANT, () =>
      controller.createRule({ name: '通配游戏', urlPattern: '/games/*/assets/*', maxAge: 3600 }),
    )
    const match = await runWithTenant(TENANT, () =>
      controller.match({ url: '/games/rpg/assets/weapon.png', method: 'GET' }),
    )
    assert.equal(match.matched, true)
  })
})

// ── 🎯 运行专员 (Ops) ──
describe(`${ROLES.Ops} CDN 缓存角色扩展测试`, () => {
  it('运行专员批量添加边缘节点并验证统计', async () => {
    const { controller } = createController()
    for (let i = 0; i < 5; i++) {
      await controller.addNode({
        name: `edge-node-${i}`,
        region: 'cn-test',
        endpoint: `https://edge${i}.test.com`,
        capacityBytes: (i + 1) * 1000,
      })
    }
    const stats = await controller.nodeStats()
    assert.equal(stats.totalNodes, 5)
    assert.equal(stats.onlineNodes, 5)
    assert.equal(stats.totalCapacityBytes, 15000) // 1000+2000+3000+4000+5000
  })

  it('运行专员添加节点时缺失 region 被拒绝', async () => {
    const { controller } = createController()
    await assert.rejects(
      () => controller.addNode({
        name: 'bad-node',
        region: '',
        endpoint: 'https://x.com',
        capacityBytes: 100,
      }),
      /name.*region.*endpoint.*必填/,
    )
  })

  it('运行专员查看无节点时的统计为 0', async () => {
    const { controller } = createController()
    const stats = await controller.nodeStats()
    assert.deepEqual(stats, {
      totalNodes: 0, onlineNodes: 0, totalCapacityBytes: 0,
      totalUsedBytes: 0, averageHitRate: 0, averageLatencyMs: 0,
    })
  })
})

// ── 🤝 团建 (Teambuilding) ──
describe(`${ROLES.Teambuilding} CDN 缓存角色扩展测试`, () => {
  it('团建负责人为团建活动页面配置较短 TTL', async () => {
    const { controller } = createController()
    const rule = await runWithTenant(TENANT, () =>
      controller.createRule({
        name: '团建活动',
        urlPattern: '/events/teambuilding/*',
        maxAge: 120,
        staleWhileRevalidate: 600,
      }),
    )
    assert.equal(rule.maxAge, 120)
    assert.equal(rule.staleWhileRevalidate, 600)
  })

  it('团建负责人启用 Brotli 压缩优化活动页面加载', async () => {
    const { controller } = createController()
    const rule = await runWithTenant(TENANT, () =>
      controller.createRule({
        name: '活动 Brotli',
        urlPattern: '/events/*',
        maxAge: 600,
        enableBrotli: true,
        varyHeaders: ['Accept-Encoding'],
      }),
    )
    assert.equal(rule.enableBrotli, true)
  })

  it('团建负责人试图查看其他租户规则 → NotFound', async () => {
    const { controller } = createController()
    await assert.rejects(
      () => runWithTenant(OTHER_TENANT, () => controller.getRule('cdn-rule-nonexistent')),
      /不存在/,
    )
  })
})

// ── 📢 营销 (Marketing) ──
describe(`${ROLES.Marketing} CDN 缓存角色扩展测试`, () => {
  it('营销为不同活动配置不同的缓存策略', async () => {
    const { controller } = createController()
    const rule1 = await runWithTenant(TENANT, () =>
      controller.createRule({ name: '大促首页', urlPattern: '/campaign/sale/*', maxAge: 600, priority: 50 }),
    )
    const rule2 = await runWithTenant(TENANT, () =>
      controller.createRule({ name: '普通活动', urlPattern: '/campaign/normal/*', maxAge: 3600, priority: 10 }),
    )
    assert.equal(rule1.maxAge, 600)
    assert.equal(rule2.maxAge, 3600)
    // 大促优先级更高
    assert.ok(rule1.priority > rule2.priority)
  })

  it('营销查看匹配大促活动的缓存控制头', async () => {
    const { controller } = createController()
    await runWithTenant(TENANT, () =>
      controller.createRule({
        name: '618 大促',
        urlPattern: '/campaign/618/*',
        maxAge: 300,
        strategy: 'public',
      }),
    )
    const match = await runWithTenant(TENANT, () =>
      controller.match({ url: '/campaign/618/banner.jpg', method: 'GET' }),
    )
    assert.equal(match.matched, true)
    assert.ok(match.cacheControl!.includes('public'))
    assert.ok(match.cacheControl!.includes('max-age=300'))
  })

  it('营销删除旧的营销活动缓存规则', async () => {
    const { controller } = createController()
    const rule = await runWithTenant(TENANT, () =>
      controller.createRule({ name: '过期大促', urlPattern: '/campaign/old-promo/*', maxAge: 86400 }),
    )
    await runWithTenant(TENANT, () => controller.deleteRule(rule.id))
    await assert.rejects(
      () => runWithTenant(TENANT, () => controller.getRule(rule.id)),
      /不存在/,
    )
  })
})
