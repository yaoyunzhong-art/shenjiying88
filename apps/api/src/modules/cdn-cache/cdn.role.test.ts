import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [cdn-cache] [C] 角色测试
 * 
 * 8 角色视角的 CDN 缓存模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { CdnCacheController } from './cdn.controller'
import { CdnCacheService } from './cdn.service'
import { runWithTenant } from '../../common/context/tenant-context'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

const TENANT = {
  tenantId: 'role-test-tenant',
  storeId: 'store-role-001',
  userId: 'role-tester',
  role: 'tenant_admin' as const,
}

const OTHER_TENANT = {
  tenantId: 'other-tenant',
  storeId: 'store-other',
  userId: 'other-user',
  role: 'tenant_admin' as const,
}

// ── 测试数据工厂 ──
function createController() {
  const service = new CdnCacheService()
  return new CdnCacheController(service)
}

// ── 👔店长 ──
describe(`${ROLES.StoreManager} CDN 缓存角色测试`, () => {
  it('店长创建缓存规则并验证规则生效（门店运营管理）', async () => {
    const ctrl = createController()
    const rule = await runWithTenant(TENANT, () =>
      ctrl.createRule({
        name: '门店图片缓存',
        urlPattern: '/api/store/*/images/*',
        maxAge: 7200,
        strategy: 'public',
        priority: 10,
      }),
    )
    assert.ok(rule.id)
    assert.equal(rule.name, '门店图片缓存')
    assert.equal(rule.maxAge, 7200)
    assert.equal(rule.priority, 10)
    assert.equal(rule.tenantId, TENANT.tenantId)

    // 验证匹配
    const match = await runWithTenant(TENANT, () =>
      ctrl.match({ url: '/api/store/role-001/images/photo.jpg', method: 'GET' }),
    )
    assert.equal(match.matched, true)
    assert.ok(match.rule)
    assert.ok(match.cacheControl)
    assert.ok(match.cacheControl!.includes('max-age=7200'))
  })

  it('店长查看 CDN 节点统计辅助门店运营决策', async () => {
    const ctrl = createController()
    await ctrl.addNode({
      name: 'edge-shanghai-01', region: 'cn-shanghai',
      endpoint: 'https://edge.sh.test.com', capacityBytes: 10 * 1024 ** 3,
    })
    await ctrl.addNode({
      name: 'edge-beijing-01', region: 'cn-beijing',
      endpoint: 'https://edge.bj.test.com', capacityBytes: 8 * 1024 ** 3,
    })

    const stats = await ctrl.nodeStats()
    assert.equal(stats.totalNodes, 2)
    assert.equal(stats.onlineNodes, 2)
    assert.ok(stats.totalCapacityBytes > 0)
  })

  it('店长无法查看其他门店的缓存规则（权限隔离）', async () => {
    const ctrl = createController()
    const rule = await runWithTenant(TENANT, () =>
      ctrl.createRule({ name: '门店专属规则', urlPattern: '/api/store/specific/*' }),
    )

    // 其他租户无法访问
    await assert.rejects(
      () => runWithTenant(OTHER_TENANT, () => ctrl.getRule(rule.id)),
      /不存在/,
    )
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} CDN 缓存角色测试`, () => {
  it('前台打开收银台页面验证缓存正常命中（结账体验优化）', async () => {
    const ctrl = createController()
    await runWithTenant(TENANT, () =>
      ctrl.createRule({ name: 'POS 素材缓存', urlPattern: '/assets/pos/*', maxAge: 3600 }),
    )

    const match = await runWithTenant(TENANT, () =>
      ctrl.match({ url: '/assets/pos/checkout-ui.js', method: 'GET' }),
    )
    assert.equal(match.matched, true)
    assert.ok(match.cacheControl)
    assert.ok(match.cacheControl!.includes('public'))
  })

  it('前台无法访问不存在的缓存规则（边界：ID错误）', async () => {
    const ctrl = createController()
    await assert.rejects(
      () => runWithTenant(TENANT, () => ctrl.getRule('cdn-rule-nonexistent')),
      /不存在/,
    )
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} CDN 缓存角色测试`, () => {
  it('HR 查看公司知识库页面的缓存策略确保文档快速加载', async () => {
    const ctrl = createController()
    await runWithTenant(TENANT, () =>
      ctrl.createRule({ name: '知识库缓存', urlPattern: '/knowledge/docs/*', maxAge: 86400 }),
    )

    const rules = await runWithTenant(TENANT, () => ctrl.listRules())
    const knowledgeRule = rules.items.find((r) => r.name === '知识库缓存')
    assert.ok(knowledgeRule)
    assert.equal(knowledgeRule!.urlPattern, '/knowledge/docs/*')
    assert.equal(knowledgeRule!.maxAge, 86400)
  })

  it('HR 创建的规则对其他租户不可见（权限隔离）', async () => {
    const ctrl = createController()
    await runWithTenant(TENANT, () =>
      ctrl.createRule({ name: 'HR 专属规则', urlPattern: '/hr/*' }),
    )

    // 其他租户列表不应包含
    const otherRules = await runWithTenant(OTHER_TENANT, () => ctrl.listRules())
    assert.equal(otherRules.items.find((r) => r.name === 'HR 专属规则'), undefined)
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} CDN 缓存角色测试`, () => {
  it('安监通过主动失效清除被篡改的静态资源（安全应急）', async () => {
    const ctrl = createController()
    const service = new CdnCacheService()
    const ctrlWithService = new CdnCacheController(service)

    // 模拟已缓存的条目
    service.addCacheEntryForTesting({
      key: '/security-breach.html',
      ruleId: 'rule-sec-1', edgeNodeId: 'edge-1',
      url: '/security-breach.html', statusCode: 200, sizeBytes: 500,
      cachedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      hitCount: 10,
    })
    service.addCacheEntryForTesting({
      key: '/safe-page.html',
      ruleId: 'rule-sec-2', edgeNodeId: 'edge-1',
      url: '/safe-page.html', statusCode: 200, sizeBytes: 200,
      cachedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      hitCount: 5,
    })

    const inv = await runWithTenant(TENANT, () =>
      ctrlWithService.invalidate({ mode: 'url', target: '/security-breach.html' }),
    )
    assert.equal(inv.affectedEntries, 1)
    assert.equal(inv.status, 'completed')

    // 验证缓存条目已被清除
    const remaining = service.listCacheEntriesForTesting()
    assert.equal(remaining.length, 1)
    assert.equal(remaining[0].url, '/safe-page.html')
  })

  it('安监使用 pattern 失效批量清理高风险目录', async () => {
    const ctrl = createController()

    const inv = await runWithTenant(TENANT, () =>
      ctrl.invalidate({ mode: 'pattern', target: '/sensitive/*' }),
    )
    assert.equal(inv.status, 'completed')
    assert.ok(typeof inv.affectedEntries === 'number')
    assert.ok(inv.id)
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} CDN 缓存角色测试`, () => {
  it('导玩员验证游戏资源 CDN 缓存配置（活动加载优化）', async () => {
    const ctrl = createController()
    const rule = await runWithTenant(TENANT, () =>
      ctrl.createRule({
        name: '游戏资源缓存',
        urlPattern: '/games/assets/*',
        maxAge: 86400,
        staleWhileRevalidate: 604800,
        strategy: 'immutable',
      }),
    )
    assert.equal(rule.strategy, 'immutable')
    assert.equal(rule.staleWhileRevalidate, 604800)

    // 验证 Cache-Control 头
    const match = await runWithTenant(TENANT, () =>
      ctrl.match({ url: '/games/assets/sprite.png', method: 'GET' }),
    )
    assert.ok(match.cacheControl)
    assert.ok(match.cacheControl!.includes('immutable'))
    assert.ok(match.cacheControl!.includes('stale-while-revalidate=604800'))
  })

  it('导玩员更新缓存规则优先级确保导玩活动资源优先加载', async () => {
    const ctrl = createController()
    const rule = await runWithTenant(TENANT, () =>
      ctrl.createRule({ name: '导玩素材', urlPattern: '/games/guide/*', priority: 0 }),
    )

    const updated = await runWithTenant(TENANT, () =>
      ctrl.updateRule(rule.id, { priority: 100 }),
    )
    assert.equal(updated.priority, 100)
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} CDN 缓存角色测试`, () => {
  it('运行专员添加新的 CDN 边缘节点扩展门店覆盖', async () => {
    const ctrl = createController()
    const node = await ctrl.addNode({
      name: 'edge-guangzhou-01',
      region: 'cn-guangzhou',
      endpoint: 'https://edge.gz.test.com',
      capacityBytes: 20 * 1024 ** 3,
    })
    assert.ok(node.id)
    assert.equal(node.name, 'edge-guangzhou-01')
    assert.equal(node.region, 'cn-guangzhou')
    assert.equal(node.status, 'online')
  })

  it('运行专员删除下线节点并验证节点列表已更新', async () => {
    const ctrl = createController()
    const node = await ctrl.addNode({
      name: 'edge-to-remove',
      region: 'cn-test',
      endpoint: 'https://edge.remove.test.com',
      capacityBytes: 5 * 1024 ** 3,
    })

    await ctrl.removeNode(node.id)

    const nodes = await ctrl.listNodes()
    assert.equal(nodes.items.find((n) => n.id === node.id), undefined)
  })

  it('运行专员查看节点统计了解 CDN 整体运行状况', async () => {
    const ctrl = createController()
    await ctrl.addNode({
      name: 'edge-main', region: 'cn-beijing',
      endpoint: 'https://edge.bj.test.com', capacityBytes: 10 * 1024 ** 3,
    })

    const stats = await ctrl.nodeStats()
    assert.ok(stats.totalNodes >= 1)
    assert.equal(typeof stats.averageHitRate, 'number')
    assert.equal(typeof stats.averageLatencyMs, 'number')
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} CDN 缓存角色测试`, () => {
  it('团建负责人查看团建活动页面的缓存策略', async () => {
    const ctrl = createController()
    await runWithTenant(TENANT, () =>
      ctrl.createRule({
        name: '团建活动页面',
        urlPattern: '/activities/teambuilding/*',
        maxAge: 600,
        strategy: 'public',
      }),
    )

    const match = await runWithTenant(TENANT, () =>
      ctrl.match({ url: '/activities/teambuilding/outdoor-2026', method: 'GET' }),
    )
    assert.equal(match.matched, true)
    assert.ok(match.cacheControl!.includes('max-age=600'))
  })

  it('团建负责人创建规则时传空 urlPattern 应被拒绝', async () => {
    const ctrl = createController()
    await assert.rejects(
      () => runWithTenant(TENANT, () => ctrl.createRule({ name: '空规则', urlPattern: '' })),
      /urlPattern 必填/,
    )
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} CDN 缓存角色测试`, () => {
  it('营销创建营销活动静态资源缓存规则（大促加速）', async () => {
    const ctrl = createController()
    const rule = await runWithTenant(TENANT, () =>
      ctrl.createRule({
        name: '大促素材缓存',
        urlPattern: '/campaign/*/banners/*',
        maxAge: 1800,
        enableGzip: true,
        enableBrotli: true,
        varyHeaders: ['Accept-Encoding'],
        priority: 50,
      }),
    )
    assert.equal(rule.name, '大促素材缓存')
    assert.equal(rule.enableGzip, true)
    assert.equal(rule.enableBrotli, true)
    assert.ok(rule.varyHeaders.includes('Accept-Encoding'))
  })

  it('营销查看已创建的缓存规则列表', async () => {
    const ctrl = createController()
    await runWithTenant(TENANT, () =>
      ctrl.createRule({ name: '营销页缓存', urlPattern: '/marketing/*', maxAge: 600 }),
    )
    await runWithTenant(TENANT, () =>
      ctrl.createRule({ name: '落地页缓存', urlPattern: '/landing/*', maxAge: 3600 }),
    )

    const rules = await runWithTenant(TENANT, () => ctrl.listRules())
    assert.ok(rules.items.length >= 2)
    const marketingRule = rules.items.find((r) => r.name === '营销页缓存')
    assert.ok(marketingRule)
    assert.equal(marketingRule!.maxAge, 600)
  })

  it('营销更新已废弃的活动缓存规则 TTL', async () => {
    const ctrl = createController()
    const rule = await runWithTenant(TENANT, () =>
      ctrl.createRule({ name: '过期活动', urlPattern: '/old-campaign/*', maxAge: 86400 }),
    )

    const updated = await runWithTenant(TENANT, () =>
      ctrl.updateRule(rule.id, { maxAge: 300 }),
    )
    assert.equal(updated.maxAge, 300)
    assert.equal(updated.name, '过期活动')
  })
})
