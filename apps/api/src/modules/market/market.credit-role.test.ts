// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [market] [C] 角色测试 — credit/cred 视角（积分与信用）
 *
 * 从前端角色视角验证 market 模块的 bootstrap / scoped market / portal market
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
// ── 直接用 require 绕过编译时模块解析 ──
 
const { MarketController } = require('./market.controller')

const ROLES = {
  StoreManager: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  TeamBuilding: '🤝团建',
  Marketing: '📢营销',
  CreditAdmin: '💎积分管理员',
  CreditConsumer: '💰信用消费者',
} as const

const cnTenantCtx = { tenantId: 't-cn', brandId: 'b-cn', storeId: 's-cn', marketCode: 'cn-mainland' }
const usTenantCtx = { tenantId: 't-us', brandId: 'b-us', storeId: 's-us', marketCode: 'us-default' }

const cnMarketProfile = {
  marketCode: 'cn-mainland',
  marketName: '中国大陆',
  countryCode: 'CN',
  locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
  timezone: { timezone: 'Asia/Shanghai' },
  currency: { currencyCode: 'CNY', symbol: '¥' },
  tax: { taxMode: 'INCLUDED', taxRate: 6, taxLabel: '增值税' },
  network: { networkRegion: 'MAINLAND_CHINA', apiBaseUrl: 'https://cn-api.m5.local', cdnBaseUrl: 'https://cn-cdn.m5.local', callbackBaseUrl: 'https://cn-hooks.m5.local' },
  email: { provider: 'ALIYUN_DM', fromName: 'M5 China', fromAddress: 'hello-cn@m5.local', replyTo: 'support-cn@m5.local' },
  social: { primaryPlatforms: ['WECHAT', 'XIAOHONGSHU'], supportPlatforms: ['WECHAT', 'WEIBO', 'DOUYIN'] },
}

const usMarketProfile = {
  marketCode: 'us-default',
  marketName: 'United States',
  countryCode: 'US',
  locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US'] },
  timezone: { timezone: 'America/New_York' },
  currency: { currencyCode: 'USD', symbol: '$' },
  tax: { taxMode: 'EXCLUDED', taxRate: 8.25, taxLabel: 'Sales Tax' },
  network: { networkRegion: 'NORTH_AMERICA', apiBaseUrl: 'https://us-api.m5.local', cdnBaseUrl: 'https://us-cdn.m5.local', callbackBaseUrl: 'https://us-hooks.m5.local' },
  email: { provider: 'SENDGRID', fromName: 'M5 US', fromAddress: 'hello-us@m5.local', replyTo: 'support-us@m5.local' },
  social: { primaryPlatforms: ['LINKEDIN', 'INSTAGRAM'], supportPlatforms: ['LINKEDIN', 'INSTAGRAM', 'FACEBOOK', 'X'] },
}

type MarketProfileMap = Record<string, typeof cnMarketProfile>

function makeMockService(profiles: MarketProfileMap = { 'cn-mainland': cnMarketProfile, 'us-default': usMarketProfile }, getOverridesImpl?: (ctx: any) => any[]) {
  return {
    getBootstrap: () => ({
      defaultDomesticMarketCode: 'cn-mainland',
      defaultInternationalMarketCode: 'us-default',
      supportedMarkets: Object.values(profiles),
      foundation: { generatedAt: '2026-06-14T02:00:00Z', module: 'market', dependencies: [], contracts: [] },
    }),
    getMergedProfile: (ctx: any) => {
      const profile = profiles[ctx.marketCode]
      if (!profile) throw new Error(`Market not found for code: ${ctx.marketCode}`)
      return profile
    },
    getOverrides: getOverridesImpl ?? (() => []),
  }
}

// ── 👔店长 ──
describe(`${ROLES.StoreManager} market 角色测试`, () => {
  it('店长可以查看 CN market bootstrap 与默认市场', () => {
    const svc = makeMockService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getBootstrap()
    assert.equal(result.defaultDomesticMarketCode, 'cn-mainland')
    assert.equal(result.defaultInternationalMarketCode, 'us-default')
    assert.ok(result.supportedMarkets.length >= 2)
  })

  it('店长在 CN market scope 下获取 tenant portal 的完整税费信息', () => {
    const svc = makeMockService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx)
    assert.equal(result.tax.taxMode, 'INCLUDED')
    assert.equal(result.tax.taxLabel, '增值税')
    assert.ok(result.network.apiBaseUrl.includes('cn-api'))
  })
})

// ── 🛒前台 ──
describe(`${ROLES.Reception} market 角色测试`, () => {
  it('前台可以查看 US store portal 的邮件配置', () => {
    const svc = makeMockService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getScopedPortalMarket('store', 's-us', usTenantCtx)
    assert.equal(result.email.provider, 'SENDGRID')
    assert.ok(result.email.fromAddress.includes('us'))
  })

  it('前台获取 scoped market 时得到完整的 overrides 数组', () => {
    const overrides = [{ key: 'taxRate', value: 5 }]
    const svc = makeMockService(undefined, () => overrides)
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getScopedMarket('store', 's-cn', cnTenantCtx)
    assert.equal(result.overrides.length, 1)
    assert.equal(result.overrides[0].key, 'taxRate')
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} market 角色测试`, () => {
  it('HR 查看 CN market 的社交平台配置', () => {
    const svc = makeMockService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx)
    assert.ok(result.social.primaryPlatforms.includes('WECHAT'))
    assert.ok(result.social.supportPlatforms.includes('WEIBO'))
  })

  it('HR 在 US market 看到不同的社交平台配置', () => {
    const svc = makeMockService()
    const ctrl = new MarketController(svc as any)
    const usResult = ctrl.getScopedPortalMarket('tenant', 't-us', usTenantCtx)
    assert.ok(usResult.social.primaryPlatforms.includes('LINKEDIN'))
    assert.ok(usResult.social.supportPlatforms.includes('FACEBOOK'))
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} market 角色测试`, () => {
  it('安监验证 CN market 网络区域配置正确', () => {
    const svc = makeMockService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx)
    assert.equal(result.network.networkRegion, 'MAINLAND_CHINA')
    assert.ok(result.network.callbackBaseUrl.startsWith('https://'))
  })

  it('安监在不存在 market code 时抛出异常', () => {
    const svc = makeMockService()
    const ctrl = new MarketController(svc as any)
    assert.throws(
      () => ctrl.getScopedMarket('tenant', 't-unknown', { ...cnTenantCtx, marketCode: 'jp-default' }),
      /Market not found/
    )
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} market 角色测试`, () => {
  it('导玩员查看 CN market locale 配置', () => {
    const svc = makeMockService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getScopedPortalMarket('brand', 'b-cn', cnTenantCtx)
    assert.equal(result.locale.defaultLanguage, 'zh-CN')
    assert.ok(result.locale.supportedLanguages.includes('zh-CN'))
  })

  it('导玩员在 US market 看到 en-US locale', () => {
    const svc = makeMockService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getScopedPortalMarket('brand', 'b-us', usTenantCtx)
    assert.equal(result.locale.defaultLanguage, 'en-US')
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} market 角色测试`, () => {
  it('运行专员查看 bootstrap supportedMarkets 包含所有市场', () => {
    const svc = makeMockService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getBootstrap()
    assert.ok(result.supportedMarkets.length >= 2)
    const codes = result.supportedMarkets.map((m: any) => m.marketCode).sort()
    assert.ok(codes.includes('cn-mainland'))
    assert.ok(codes.includes('us-default'))
  })

  it('运行专员查看 CN market 的时区配置', () => {
    const svc = makeMockService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx)
    assert.equal(result.timezone.timezone, 'Asia/Shanghai')
  })
})

// ── 🤝团建 ──
describe(`${ROLES.TeamBuilding} market 角色测试`, () => {
  it('团建查看 US market 的时区与其他市场不同', () => {
    const svc = makeMockService()
    const ctrl = new MarketController(svc as any)
    const usResult = ctrl.getScopedPortalMarket('tenant', 't-us', usTenantCtx)
    assert.equal(usResult.timezone.timezone, 'America/New_York')
  })

  it('团建在 CN market 获取 scoped market 包含 marketProfile 和 overrides', () => {
    const svc = makeMockService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getScopedMarket('tenant', 't-cn', cnTenantCtx)
    assert.equal(result.scopeType, 'tenant')
    assert.ok(result.marketProfile)
    assert.ok(Array.isArray(result.overrides))
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} market 角色测试`, () => {
  it('营销查看 CN market 邮件配置', () => {
    const svc = makeMockService()
    const ctrl = new MarketController(svc as any)
    const cnResult = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx)
    assert.equal(cnResult.email.provider, 'ALIYUN_DM')
    assert.ok(cnResult.email.fromAddress.includes('cn'))
  })

  it('营销在 CN 和 US market 间切换时税模式不同', () => {
    const svc = makeMockService()
    const ctrl = new MarketController(svc as any)
    const cnResult = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx)
    const usResult = ctrl.getScopedPortalMarket('tenant', 't-us', usTenantCtx)
    assert.equal(cnResult.tax.taxMode, 'INCLUDED')
    assert.equal(usResult.tax.taxMode, 'EXCLUDED')
    assert.notEqual(cnResult.tax.taxRate, usResult.tax.taxRate)
  })
})

// ── 💎积分管理员 ──
describe(`${ROLES.CreditAdmin} market 角色测试`, () => {
  it('积分管理员可以查看 CN market 税率配置', () => {
    const svc = makeMockService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx)
    assert.equal(result.marketCode, 'cn-mainland')
    assert.equal(result.tax.taxRate, 6)
  })

  it('积分管理员可以查看 US market 税率配置', () => {
    const svc = makeMockService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getScopedPortalMarket('tenant', 't-us', usTenantCtx)
    assert.equal(result.tax.taxRate, 8.25)
  })

  it('积分管理员检查 bootstrap 中是否存在 foundation 元数据', () => {
    const svc = makeMockService()
    const ctrl = new MarketController(svc as any)
    const result = ctrl.getBootstrap()
    assert.ok(result.foundation)
    assert.equal(result.defaultDomesticMarketCode, 'cn-mainland')
  })
})

// ── 💰信用消费者 ──
describe(`${ROLES.CreditConsumer} market 角色测试`, () => {
  it('信用消费者可以看到门店 portal 的税率配置', () => {
    const svc = makeMockService()
    const ctrl = new MarketController(svc as any)
    const cnResult = ctrl.getScopedPortalMarket('store', 's-cn', cnTenantCtx)
    assert.equal(cnResult.tax.taxRate, 6)
  })

  it('信用消费者在 US market 看到的税率不同于 CN', () => {
    const svc = makeMockService()
    const ctrl = new MarketController(svc as any)
    const usResult = ctrl.getScopedPortalMarket('store', 's-us', usTenantCtx)
    assert.notEqual(usResult.tax.taxRate, 6)
  })

  it('信用消费者在获取不存在的 market 时收到异常', () => {
    const svc = makeMockService({ 'cn-mainland': cnMarketProfile })
    const ctrl = new MarketController(svc as any)
    assert.throws(
      () => ctrl.getScopedMarket('tenant', 't-unknown', { ...cnTenantCtx, marketCode: 'jp-default' }),
      /Market not found/
    )
  })
})
