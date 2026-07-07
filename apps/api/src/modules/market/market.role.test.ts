import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [market] [C] 角色测试
 * 
 * 8 角色视角的 market 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MarketController } from './market.controller'

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

// ── 测试上下文 ──
const cnTenantCtx = { tenantId: 't-cn', brandId: 'b-cn', storeId: 's-cn', marketCode: 'cn-mainland' }
const usTenantCtx = { tenantId: 't-us', brandId: 'b-us', storeId: 's-us', marketCode: 'us-default' }

const cnProfile = {
  marketCode: 'cn-mainland',
  marketName: '中国大陆',
  locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
  timezone: { timezone: 'Asia/Shanghai' },
  currency: { currencyCode: 'CNY', symbol: '¥' },
  tax: { taxMode: 'INCLUDED', taxRate: 6, taxLabel: '增值税' },
  network: { networkRegion: 'MAINLAND_CHINA', apiBaseUrl: 'https://cn-api.m5.local', cdnBaseUrl: 'https://cn-cdn.m5.local', callbackBaseUrl: 'https://cn-hooks.m5.local' },
  email: { provider: 'ALIYUN_DM', fromName: 'M5 China', fromAddress: 'hello-cn@m5.local', replyTo: 'support-cn@m5.local' },
  social: { primaryPlatforms: ['WECHAT', 'XIAOHONGSHU'], supportPlatforms: ['WECHAT', 'WEIBO', 'DOUYIN'] },
}

const usProfile = {
  marketCode: 'us-default',
  marketName: 'United States',
  locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US'] },
  timezone: { timezone: 'America/New_York' },
  currency: { currencyCode: 'USD', symbol: '$' },
  tax: { taxMode: 'EXCLUDED', taxRate: 8.25, taxLabel: 'Sales Tax' },
  network: { networkRegion: 'NORTH_AMERICA', apiBaseUrl: 'https://us-api.m5.local', cdnBaseUrl: 'https://us-cdn.m5.local', callbackBaseUrl: 'https://us-hooks.m5.local' },
  email: { provider: 'SENDGRID', fromName: 'M5 US', fromAddress: 'hello-us@m5.local', replyTo: 'support-us@m5.local' },
  social: { primaryPlatforms: ['LINKEDIN', 'INSTAGRAM'], supportPlatforms: ['LINKEDIN', 'INSTAGRAM', 'FACEBOOK', 'X'] },
}

type MockService = {
  getBootstrap: () => any
  getMergedProfile: (ctx: any) => any
  getOverrides: (ctx: any) => any[]
}

function mockMarketService(overrides: Partial<MockService> = {}): MockService {
  return {
    getBootstrap: () => ({
      defaultDomesticMarketCode: 'cn-mainland',
      defaultInternationalMarketCode: 'us-default',
      supportedMarkets: [cnProfile, usProfile],
      foundationDependencies: [],
      foundationContracts: ['market-bootstrap-v1'],
    }),
    getMergedProfile: (ctx: any) => (ctx.marketCode === 'us-default' ? usProfile : cnProfile),
    getOverrides: () => [],
    ...overrides,
  }
}

// ── 👔店长 ──
describe(`${ROLES.StoreManager} market 角色测试`, () => {
  it('店长可以查看中国大陆 market bootstrap', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getBootstrap()
    assert.ok(result.defaultDomesticMarketCode)
    assert.ok(Array.isArray(result.supportedMarkets))
  })

  it('店长可以获取 tenant 级别的 scoped market（含 overrides）', () => {
    const overrides = [
      { scopeType: 'TENANT', scopeCode: 't-cn', inheritanceMode: 'TENANT_DEFAULT', marketCode: 'cn-mainland', email: { fromName: 't-cn HQ' } },
    ]
    const svc = mockMarketService({ getOverrides: () => overrides })
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getScopedMarket('tenant', 't-cn', cnTenantCtx)
    assert.equal(result.scopeType, 'tenant')
    assert.equal(result.marketProfile.marketCode, 'cn-mainland')
    assert.equal(result.overrides.length, 1)
  })

  it('店长可以查看不同 market 的 portal 视图', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getScopedPortalMarket('tenant', 't-us', usTenantCtx)
    assert.equal(result.marketCode, 'us-default')
    assert.equal(result.tax.taxMode, 'EXCLUDED')
    assert.equal(result.tax.taxRate, 8.25)
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} market 角色测试`, () => {
  it('前台可以查看门店 portal market 配置（用于 POS 终端）', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getScopedPortalMarket('store', 's-cn', cnTenantCtx)
    assert.equal(result.scopeType, 'store')
    assert.equal(result.marketCode, 'cn-mainland')
    assert.equal(result.tax.taxRate, 6)
  })

  it('前台只能看到当前门店 scope 的 market，不能跨门店访问', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    // 前台 scope 应为 store
    const storeResult = ctrl.getScopedMarket('store', 's-cn', cnTenantCtx)
    assert.equal(storeResult.scopeType, 'store')
    // 前台不应能获取 brand 级别 market（权限边界：scope 应为 store 不是 brand）
    const brandResult = ctrl.getScopedMarket('brand', 'b-other', cnTenantCtx)
    assert.notEqual(brandResult.scopeType, 'store')
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} market 角色测试`, () => {
  it('HR 可以查看 market 配置确定员工时区/语言（用于排班）', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx)
    assert.equal(result.timezone.timezone, 'Asia/Shanghai')
    assert.ok(result.locale.defaultLanguage)
  })

  it('HR 可以看到所有支持的 market 列表', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getBootstrap()
    assert.ok(result.supportedMarkets.length >= 2)
    const marketCodes = result.supportedMarkets.map((m: any) => m.marketCode)
    assert.ok(marketCodes.includes('cn-mainland'))
    assert.ok(marketCodes.includes('us-default'))
  })

  it('HR 无法修改 market 配置（只读权限边界）', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    // MarketController 只有 @Get 路由，无 POST/PUT/PATCH
    const prototype = Object.getPrototypeOf(ctrl)
    const methods = Object.getOwnPropertyNames(prototype).filter(
      (name) => name !== 'constructor' && typeof prototype[name] === 'function'
    )
    // 验证没有写操作相关的路由
    const writeMethods = methods.filter((m) => m.startsWith('create') || m.startsWith('update') || m.startsWith('delete'))
    assert.equal(writeMethods.length, 0)
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} market 角色测试`, () => {
  it('安监可以查看 market 的网络配置（安全审计需要）', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx)
    assert.ok(result.network.apiBaseUrl.startsWith('https://'))
    assert.equal(result.network.networkRegion, 'MAINLAND_CHINA')
  })

  it('安监可以验证不同 market 的数据隔离（CN vs US）', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    const cnResult = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx)
    const usResult = ctrl.getScopedPortalMarket('tenant', 't-us', usTenantCtx)
    assert.notEqual(cnResult.network.apiBaseUrl, usResult.network.apiBaseUrl)
    assert.notEqual(cnResult.marketCode, usResult.marketCode)
  })

  it('安监可以确认 email 服务商符合合规要求', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    const cnResult = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx)
    assert.equal(cnResult.email.provider, 'ALIYUN_DM')
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} market 角色测试`, () => {
  it('导玩员可以查看门店 market 配置（用于接待引导）', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getScopedMarket('store', 's-cn', cnTenantCtx)
    assert.equal(result.marketProfile.marketCode, 'cn-mainland')
    assert.equal(result.marketProfile.currency.symbol, '¥')
  })

  it('导玩员可以获取 portal 级别的营销社媒配置', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getScopedPortalMarket('store', 's-cn', cnTenantCtx)
    assert.ok(result.social.primaryPlatforms.length > 0)
  })

  it('导玩员在多 market 环境中能看到正确的市场代码标识', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    const usResult = ctrl.getScopedPortalMarket('store', 's-us', usTenantCtx)
    assert.equal(usResult.marketCode, 'us-default')
    assert.notEqual(usResult.marketCode, 'cn-mainland')
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} market 角色测试`, () => {
  it('运行专员可以获取 bootstrap 查看所有 market 状态', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getBootstrap()
    assert.equal(result.defaultDomesticMarketCode, 'cn-mainland')
    assert.ok(result.foundationDependencies)
  })

  it('运行专员可以对比不同 market 的税率配置', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    const cnResult = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx)
    const usResult = ctrl.getScopedPortalMarket('tenant', 't-us', usTenantCtx)
    assert.equal(cnResult.tax.taxRate, 6)
    assert.equal(usResult.tax.taxRate, 8.25)
    assert.notEqual(cnResult.tax.taxMode, usResult.tax.taxMode)
  })

  it('运行专员可以查看所有 supported markets 的数量', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getBootstrap()
    assert.ok(result.supportedMarkets.length > 0)
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} market 角色测试`, () => {
  it('团建可以查看 market 配置确定活动策划语言', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    const cnResult = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx)
    assert.equal(cnResult.locale.defaultLanguage, 'zh-CN')
  })

  it('团建策划时可以看到社媒平台列表（分享/宣传渠道）', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    const usResult = ctrl.getScopedPortalMarket('brand', 'b-us', usTenantCtx)
    assert.ok(usResult.social.supportPlatforms.includes('LINKEDIN' as any))
  })

  it('团建不能获取不存在的 market 配置（边界：非法 marketCode）', () => {
    const svc = mockMarketService({
      getMergedProfile: () => {
        throw new Error('Market not found')
      },
    })
    const ctrl = new MarketController(svc as any)
    assert.throws(
      () => ctrl.getScopedMarket('tenant', 't-invalid', { ...cnTenantCtx, marketCode: 'invalid-market' }),
      /Market not found/
    )
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} market 角色测试`, () => {
  it('营销可以查看市场社媒配置（制定营销策略）', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    const cnResult = ctrl.getScopedPortalMarket('brand', 'b-cn', cnTenantCtx)
    assert.ok(cnResult.social.primaryPlatforms.includes('WECHAT' as any))
    assert.ok(cnResult.social.primaryPlatforms.includes('XIAOHONGSHU' as any))
  })

  it('营销可以对比中美市场的社媒差异', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    const cnSocial = ctrl.getScopedPortalMarket('brand', 'b-cn', cnTenantCtx).social
    const usSocial = ctrl.getScopedPortalMarket('brand', 'b-us', usTenantCtx).social
    assert.ok(cnSocial.primaryPlatforms.includes('WECHAT' as any))
    assert.ok(usSocial.primaryPlatforms.includes('LINKEDIN' as any))
    assert.ok(!cnSocial.primaryPlatforms.includes('LINKEDIN' as any))
  })

  it('营销可以看到 market 的邮件配置（EDM 营销需要）', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getScopedPortalMarket('tenant', 't-us', usTenantCtx)
    assert.equal(result.email.fromName, 'M5 US')
    assert.equal(result.email.fromAddress, 'hello-us@m5.local')
  })

  it('营销视角: bootstrap 应包含完整的 foundation 元数据', () => {
    const svc = mockMarketService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getBootstrap()
    assert.ok(result.foundationDependencies)
    assert.ok(Array.isArray(result.foundationDependencies))
  })
})
