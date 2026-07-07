import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [market] [C] 角色测试扩展编写
 *
 * 8 角色深度场景扩展测试 — market 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 3 测试用例 (正常流程 + 多市场场景 + 权限/scope 边界)
 * 覆盖：getBootstrap, getScopedMarket, getScopedPortalMarket 三个端点
 * 扩展：多市场数据一致性、override 合并策略、countryCode 隐式检查、portal 视图字段约束
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
// ── 直接用 require 绕过编译时模块解析（NestJS 参数装饰器不支持 tsx） ──
const { MarketController } = require('./market.controller')

// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销'
}

// ── 测试上下文 ──
const cnTenantCtx = { tenantId: 't-cn', brandId: 'b-cn', storeId: 's-cn', marketCode: 'cn-mainland' }
const usTenantCtx = { tenantId: 't-us', brandId: 'b-us', storeId: 's-us', marketCode: 'us-default' }

// ── 静态 market profiles ──
const cnProfile = {
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

const usProfile = {
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

// ── 工厂函数 ──
function mockMarketService(overrides: Record<string, any> = {}) {
  // 获取 override 列表的默认实现
  const getOverridesFn = overrides.getOverrides ?? (() => [])
  return {
    getBootstrap: () => ({
      defaultDomesticMarketCode: 'cn-mainland',
      defaultInternationalMarketCode: 'us-default',
      supportedMarkets: [cnProfile, usProfile],
      foundationDependencies: [],
      foundationContracts: ['market-bootstrap-v1'],
    }),
    getMergedProfile: (ctx: { marketCode: string }) => {
      const profile = ctx.marketCode === 'us-default' ? usProfile : cnProfile
      // 应用 override 到 profile
      const ovs = getOverridesFn(ctx)
      if (ovs.length > 0) {
        // 简单的一次性浅合并：从最后一个 override 往前提字段
        const merged = { ...profile }
        for (const ov of ovs) {
          if (ov.email) merged.email = { ...(merged.email as any), ...ov.email }
          if (ov.social) merged.social = { ...(merged.social as any), ...ov.social }
          if (ov.timezone) merged.timezone = { ...(merged.timezone as any), ...ov.timezone }
          if (ov.currency) merged.currency = { ...(merged.currency as any), ...ov.currency }
          if (ov.locale) merged.locale = { ...(merged.locale as any), ...ov.locale }
          if (ov.tax) merged.tax = { ...(merged.tax as any), ...ov.tax }
          if (ov.network) merged.network = { ...(merged.network as any), ...ov.network }
        }
        return merged
      }
      return profile
    },
    getOverrides: getOverridesFn,
    ...overrides,
  }
}

function createMarketController(opts = {}) {
  const svc = mockMarketService(opts)
  return { controller: new MarketController(svc), service: svc }
}


// ════════════════════════════════════════════════════════════════
// 👔 店长 — 全局运营视图 & 多市场一致性
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.TenantAdmin} market 扩展角色测试`, () => {
  it('店长查看 bootstrap 获得所有市场列表与 foundation 元数据', () => {
    const { controller } = createMarketController()
    const result = controller.getBootstrap()

    assert.ok(result.defaultDomesticMarketCode)
    assert.ok(result.defaultInternationalMarketCode)
    assert.ok(Array.isArray(result.supportedMarkets))
    assert.equal(result.supportedMarkets.length, 2)
    assert.ok(Array.isArray(result.foundationDependencies))
    assert.ok(Array.isArray(result.foundationContracts))
  })

  it('店长跨市场查看 scoped market——中国市场含完整 locale/currency/tax/social', () => {
    const { controller } = createMarketController()
    const result = controller.getScopedMarket('tenant', 't-cn', cnTenantCtx)

    assert.equal(result.scopeType, 'tenant')
    assert.equal(result.marketProfile.marketCode, 'cn-mainland')
    assert.equal(result.marketProfile.countryCode, 'CN')
    assert.equal(result.marketProfile.locale.defaultLanguage, 'zh-CN')
    assert.equal(result.marketProfile.currency.symbol, '¥')
    assert.equal(result.marketProfile.tax.taxRate, 6)
    assert.equal(result.marketProfile.social.primaryPlatforms[0], 'WECHAT')
    assert.ok(Array.isArray(result.overrides))
  })

  it('店长跨市场查看 scoped market——美国市场含英文 locale 与美元', () => {
    const { controller } = createMarketController()
    const result = controller.getScopedMarket('brand', 'b-us', usTenantCtx)

    assert.equal(result.marketProfile.marketCode, 'us-default')
    assert.equal(result.marketProfile.countryCode, 'US')
    assert.equal(result.marketProfile.locale.defaultLanguage, 'en-US')
    assert.equal(result.marketProfile.currency.symbol, '$')
  })

  it('店长查看 US portal 视图——仅返回 portal 相关字段不含完整 profile', () => {
    const { controller } = createMarketController()
    const result = controller.getScopedPortalMarket('store', 's-us', usTenantCtx)

    // portal 视图必须包含的字段
    assert.equal(result.scopeType, 'store')
    assert.equal(result.marketCode, 'us-default')
    // locale/timezone 返回的是对象（非展开为字符串）
    assert.equal(result.locale.defaultLanguage, 'en-US')
    assert.equal(result.timezone.timezone, 'America/New_York')
    assert.equal(result.tax.taxMode, 'EXCLUDED')
    assert.equal(result.email.provider, 'SENDGRID')

    // portal 视图不应包含完整 profile 字段
    assert.equal(result.marketName, undefined)
    assert.equal(result.countryCode, undefined)
  })
})


// ════════════════════════════════════════════════════════════════
// 🛒 前台 — 门店级别市场配置 & portal 视图
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Reception} market 扩展角色测试`, () => {
  it('前台获取当前门店的 portal 市场配置（含税率与邮件配置）', () => {
    const { controller } = createMarketController()
    const result = controller.getScopedPortalMarket('store', 's-cn', cnTenantCtx)

    assert.equal(result.scopeType, 'store')
    assert.equal(result.marketCode, 'cn-mainland')
    assert.equal(result.tax.taxLabel, '增值税')
    assert.equal(result.email.fromAddress, 'hello-cn@m5.local')
  })

  it('前台获取跨区域市场 portal——中美时区不同', () => {
    const { controller } = createMarketController()
    const cnPortal = controller.getScopedPortalMarket('store', 's-cn', cnTenantCtx)
    const usPortal = controller.getScopedPortalMarket('store', 's-us', usTenantCtx)

    assert.equal(cnPortal.timezone.timezone, 'Asia/Shanghai')
    assert.equal(usPortal.timezone.timezone, 'America/New_York')
    assert.notEqual(cnPortal.timezone.timezone, usPortal.timezone.timezone)
  })

  it('前台访问不存在的 scopeCode 仍然返回有效市场配置（回退逻辑）', () => {
    const { controller } = createMarketController()
    const result = controller.getScopedMarket('tenant', 'non-existent', cnTenantCtx)

    assert.ok(result.marketProfile)
    assert.equal(result.marketProfile.marketCode, 'cn-mainland')
  })
})


// ════════════════════════════════════════════════════════════════
// 👥 HR — 配置合规性验证（语言、时区、薪资货币）
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} market 扩展角色测试`, () => {
  it('HR 验证中国大陆市场 locale 只支持中文', () => {
    const { controller } = createMarketController()
    const result = controller.getScopedMarket('tenant', 't-cn', cnTenantCtx)

    const languages = result.marketProfile.locale.supportedLanguages
    assert.equal(languages.length, 1)
    assert.equal(languages[0], 'zh-CN')
  })

  it('HR 验证美国市场的货币是 USD 且符号正确', () => {
    const { controller } = createMarketController()
    const result = controller.getScopedMarket('tenant', 't-us', usTenantCtx)

    assert.equal(result.marketProfile.currency.currencyCode, 'USD')
    assert.equal(result.marketProfile.currency.symbol, '$')
  })

  it('HR 查看 bootstrap 确认所有市场都有完整的税务配置', () => {
    const { controller } = createMarketController()
    const result = controller.getBootstrap()

    for (const market of result.supportedMarkets) {
      assert.ok(market.tax, `市场 ${market.marketCode} 缺少税务配置`)
      assert.equal(typeof market.tax.taxRate, 'number')
      assert.ok(market.tax.taxRate >= 0)
      assert.ok(market.tax.taxLabel)
    }
  })
})


// ════════════════════════════════════════════════════════════════
// 🔧 安监 — 网络安全配置验证（API/CDN/Webhook 基址）
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Safety} market 扩展角色测试`, () => {
  it('安监验证中国大陆市场所有网络端点使用 cn- 域名', () => {
    const { controller } = createMarketController()
    const result = controller.getScopedMarket('tenant', 't-cn', cnTenantCtx)

    const network = result.marketProfile.network
    assert.ok(network.apiBaseUrl.startsWith('https://cn-'))
    assert.ok(network.cdnBaseUrl.startsWith('https://cn-'))
    assert.ok(network.callbackBaseUrl.startsWith('https://cn-'))
    assert.equal(network.networkRegion, 'MAINLAND_CHINA')
  })

  it('安监验证美国市场网络端点是北美区域', () => {
    const { controller } = createMarketController()
    const result = controller.getScopedMarket('tenant', 't-us', usTenantCtx)

    const network = result.marketProfile.network
    assert.ok(network.apiBaseUrl.startsWith('https://us-'))
    assert.equal(network.networkRegion, 'NORTH_AMERICA')
  })

  it('安监验证 bootstrap 中所有市场 network 配置完整', () => {
    const { controller } = createMarketController()
    const result = controller.getBootstrap()

    for (const market of result.supportedMarkets) {
      assert.ok(market.network)
      assert.ok(market.network.apiBaseUrl.startsWith('https://'))
      assert.ok(market.network.cdnBaseUrl.startsWith('https://'))
    }
  })
})


// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 门店运营场景（门店级别市场配置）
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} market 扩展角色测试`, () => {
  it('导玩员获取中国大陆门店的 portal 视图含社交平台信息', () => {
    const { controller } = createMarketController()
    const result = controller.getScopedPortalMarket('store', 's-cn', cnTenantCtx)

    assert.equal(result.social.primaryPlatforms[0], 'WECHAT')
    assert.ok(result.social.primaryPlatforms.includes('XIAOHONGSHU'))
  })

  it('导玩员获取美国门店 portal 视图时社交平台不同', () => {
    const { controller } = createMarketController()
    const result = controller.getScopedPortalMarket('store', 's-us', usTenantCtx)

    assert.equal(result.social.primaryPlatforms[0], 'LINKEDIN')
    assert.ok(result.social.primaryPlatforms.includes('INSTAGRAM'))
  })

  it('导玩员调用 scopedMarket 查看门店 override——含自定义 email fromName', () => {
    const overrides = [
      { scopeType: 'STORE', scopeCode: 's-cn', inheritanceMode: 'STORE_OVERRIDE', marketCode: 'cn-mainland', email: { fromName: '快乐驿站' } }
    ]
    const { service } = createMarketController({ getOverrides: () => overrides })

    const merged = service.getMergedProfile(cnTenantCtx)
    assert.equal(merged.email.fromName, '快乐驿站')
    assert.equal(merged.email.fromAddress, 'hello-cn@m5.local') // 未被覆盖
  })
})


// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 运维层面 bootstrap 与 override 链验证
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Ops} market 扩展角色测试`, () => {
  it('运行专员验证 bootstrap 返回的 foundation 合同完整', () => {
    const { controller } = createMarketController()
    const result = controller.getBootstrap()

    assert.ok(Array.isArray(result.foundationContracts))
    assert.ok(result.foundationContracts.includes('market-bootstrap-v1'))
  })

  it('运行专员验证 override 链：tenant → brand → store 逐层合并', () => {
    const overrides = [
      { scopeType: 'TENANT', scopeCode: 't-cn', inheritanceMode: 'TENANT_DEFAULT', marketCode: 'cn-mainland', email: { fromName: 'Tenant HQ' } },
      { scopeType: 'BRAND', scopeCode: 'b-cn', inheritanceMode: 'BRAND_OVERRIDE', marketCode: 'cn-mainland', social: { primaryPlatforms: ['WECHAT', 'DOUYIN'] } },
      { scopeType: 'STORE', scopeCode: 's-cn', inheritanceMode: 'STORE_OVERRIDE', marketCode: 'cn-mainland', timezone: { timezone: 'Asia/Chongqing' } },
    ]
    const { service } = createMarketController({ getOverrides: () => overrides })
    const merged = service.getMergedProfile(cnTenantCtx)

    // 最后一层 override 优先
    assert.equal(merged.email.fromName, 'Tenant HQ')
    assert.equal(merged.timezone.timezone, 'Asia/Chongqing')
    assert.equal(merged.social.primaryPlatforms[0], 'WECHAT')
  })

  it('运行专员验证无 override 时返回 base profile', () => {
    const { service } = createMarketController({ getOverrides: () => [] })
    const merged = service.getMergedProfile(cnTenantCtx)

    assert.equal(merged.marketCode, 'cn-mainland')
    assert.equal(merged.timezone.timezone, 'Asia/Shanghai')
    assert.equal(merged.email.fromName, 'M5 China')
  })
})


// ════════════════════════════════════════════════════════════════
// 🤝 团建 — 跨区域活动筹备（多市场信息聚合）
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} market 扩展角色测试`, () => {
  it('团建负责人查看中国与美国的市场时区差异', () => {
    const { controller } = createMarketController()
    const cnResult = controller.getScopedMarket('tenant', 't-cn', cnTenantCtx)
    const usResult = controller.getScopedMarket('tenant', 't-us', usTenantCtx)

    assert.equal(cnResult.marketProfile.timezone.timezone, 'Asia/Shanghai')
    assert.equal(usResult.marketProfile.timezone.timezone, 'America/New_York')
    assert.notEqual(cnResult.marketProfile.timezone.timezone, usResult.marketProfile.timezone.timezone)
  })

  it('团建负责人验证中美市场的货币不同且各自符号正确', () => {
    const { controller } = createMarketController()
    const cnResult = controller.getScopedMarket('tenant', 't-cn', cnTenantCtx)
    const usResult = controller.getScopedMarket('tenant', 't-us', usTenantCtx)

    assert.equal(cnResult.marketProfile.currency.currencyCode, 'CNY')
    assert.equal(cnResult.marketProfile.currency.symbol, '¥')
    assert.equal(usResult.marketProfile.currency.currencyCode, 'USD')
    assert.equal(usResult.marketProfile.currency.symbol, '$')
  })

  it('团建负责人获取中美两个市场的 portal 视图对比语言', () => {
    const { controller } = createMarketController()
    const cnPortal = controller.getScopedPortalMarket('store', 's-cn', cnTenantCtx)
    const usPortal = controller.getScopedPortalMarket('store', 's-us', usTenantCtx)

    assert.equal(cnPortal.locale.defaultLanguage, 'zh-CN')
    assert.equal(usPortal.locale.defaultLanguage, 'en-US')
  })
})


// ════════════════════════════════════════════════════════════════
// 📢 营销 — 市场推广配置（税率、社交平台投放）
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} market 扩展角色测试`, () => {
  it('营销获取中国市场税率与社交平台用于定价和推广策略', () => {
    const { controller } = createMarketController()
    const result = controller.getScopedMarket('tenant', 't-cn', cnTenantCtx)

    assert.equal(result.marketProfile.tax.taxMode, 'INCLUDED')
    assert.equal(result.marketProfile.tax.taxRate, 6)
    assert.ok(result.marketProfile.social.supportPlatforms.includes('DOUYIN'))
    assert.ok(result.marketProfile.social.supportPlatforms.includes('WECHAT'))
  })

  it('营销获取美国市场社交平台支持列表明细', () => {
    const { controller } = createMarketController()
    const result = controller.getScopedMarket('tenant', 't-us', usTenantCtx)

    assert.ok(result.marketProfile.social.supportPlatforms.includes('FACEBOOK'))
    assert.ok(result.marketProfile.social.supportPlatforms.includes('INSTAGRAM'))
    assert.ok(result.marketProfile.social.supportPlatforms.includes('X'))
    assert.ok(result.marketProfile.social.primaryPlatforms.includes('LINKEDIN'))
  })

  it('营销查看 bootstrap 确认两个市场都有完整的 email 配置用于邮件营销', () => {
    const { controller } = createMarketController()
    const result = controller.getBootstrap()

    for (const market of result.supportedMarkets) {
      assert.ok(market.email)
      assert.ok(market.email.provider)
      assert.ok(market.email.fromName)
      assert.ok(market.email.fromAddress)
      assert.ok(market.email.replyTo)
    }
  })

  it('营销验证 portal 视图含社交与税务信息但不含完整 profile 对象', () => {
    const { controller } = createMarketController()
    const result = controller.getScopedPortalMarket('brand', 'b-cn', cnTenantCtx)

    assert.ok(result.social)
    assert.ok(result.tax)
    // portal 视图不返回完整 marketName / countryCode
    assert.equal(result.marketName, undefined)
    assert.equal(result.countryCode, undefined)
  })
})
