import { describe, it, expect, vi } from 'vitest'
/**
 * 🐜 自动: [portal] [C] 角色测试 v4 — 8 视角深度场景
 *
 * 8 角色视角:
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限/边界）
 * 覆盖 portal.controller.ts 全部端点: bootstrap, tenant-portal, brand-portal, store-portal
 */

import 'reflect-metadata'
import {
  LanguageCode,
  PortalAudience,
  StorefrontSurface,
  PortalScopeType,
  CurrencyCode,
  CountryCode,
  TaxMode,
  NetworkRegion,
  EmailProvider,
  SocialPlatform,
} from '@m5/domain'
import type { MarketProfile } from '@m5/domain'
import { PortalController } from './portal.controller'
import { PortalService } from './portal.service'
import { MarketService } from '../market/market.service'
import { FoundationService } from '../foundation/foundation.service'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── 角色 Emoji ──
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

/** 完整 mock MarketProfile */
function createMockMarketProfile(marketCode = 'cn-mainland', langs = [LanguageCode.ZhCn]): MarketProfile {
  return {
    marketCode,
    marketName: marketCode === 'cn-mainland' ? '中国大陆' : 'United States',
    countryCode: marketCode === 'cn-mainland' ? CountryCode.China : CountryCode.UnitedStates,
    locale: {
      defaultLanguage: langs[0],
      supportedLanguages: langs,
    },
    timezone: {
      timezone: marketCode === 'cn-mainland' ? 'Asia/Shanghai' : 'America/Los_Angeles',
    },
    currency: {
      currencyCode: marketCode === 'cn-mainland' ? CurrencyCode.Cny : CurrencyCode.Usd,
      symbol: marketCode === 'cn-mainland' ? '¥' : '$',
    },
    tax: {
      taxMode: TaxMode.Excluded,
      taxRate: marketCode === 'cn-mainland' ? 0.13 : 0.08,
      taxLabel: marketCode === 'cn-mainland' ? '增值税' : 'Sales Tax',
    },
    network: {
      networkRegion: marketCode === 'cn-mainland' ? NetworkRegion.MainlandChina : NetworkRegion.NorthAmerica,
      apiBaseUrl: `https://api.${marketCode}.example.com`,
      cdnBaseUrl: `https://cdn.${marketCode}.example.com`,
      callbackBaseUrl: `https://callback.${marketCode}.example.com`,
    },
    email: {
      provider: EmailProvider.Ses,
      fromName: 'ShenJiYing',
      fromAddress: 'noreply@example.com',
      replyTo: 'support@example.com',
    },
    social: {
      primaryPlatforms: marketCode === 'cn-mainland'
        ? [SocialPlatform.Wechat, SocialPlatform.Weibo]
        : [SocialPlatform.Facebook, SocialPlatform.Instagram],
      supportPlatforms: marketCode === 'cn-mainland'
        ? [SocialPlatform.Douyin, SocialPlatform.Xiaohongshu]
        : [SocialPlatform.X, SocialPlatform.LinkedIn],
    },
  }
}

// ── Mocks ──
function createMockMarketService(mockProfile?: MarketProfile) {
  const profile = mockProfile ?? createMockMarketProfile()
  return {
    getMergedProfile: vi.fn().mockReturnValue(profile),
    getOverrides: vi.fn().mockReturnValue([]),
  } as unknown as MarketService
}

function createMockFoundationService() {
  return {
    getDependencySummary: vi.fn().mockReturnValue({
      portal: { version: '1.0.0', status: 'healthy' },
    }),
  } as unknown as FoundationService
}

function createController(marketService?: MarketService) {
  const ms = marketService ?? createMockMarketService()
  const fs = createMockFoundationService()
  const portalService = new PortalService(ms, fs)
  return { controller: new PortalController(portalService), marketService: ms, foundationService: fs }
}

function createTenantContext(overrides: Partial<RequestTenantContext> = {}): RequestTenantContext {
  return {
    tenantId: 't-arcade-001',
    brandId: 'brand-funzone',
    storeId: 'store-downtown',
    ...overrides,
  }
}

describe('PortalController — 8 角色视角测试', () => {
  describe('👔店长 — StoreManager', () => {
    it('获取门店门户 bootstrap 包含完整信息', () => {
      const { controller } = createController()
      const ctx = createTenantContext()
      const result = controller.getBootstrap(ctx)

      expect(result.storePortal).toBeDefined()
      expect(result.storePortal.storeName).toBe('store-downtown 门店')
      expect(result.storePortal.scopeType).toBe(PortalScopeType.Store)
      expect(result.storePortal.scopeCode).toBe('store-downtown')
      expect(result.marketProfile).toBeDefined()
      expect(result.tenantPortal).toBeDefined()
    })

    it('切换门店 ID 返回不同门店门户', () => {
      const { controller } = createController()
      const ctx = createTenantContext({ storeId: 'store-north' })
      const result = controller.getStorePortal(ctx)

      expect(result.primaryDomain).toContain('store-north')
      expect(result.storeCode).toBe('store-north')
    })
  })

  describe('🛒前台 — FrontDesk', () => {
    it('获取门店门户基本信息', () => {
      const { controller } = createController()
      const ctx = createTenantContext()
      const result = controller.getStorePortal(ctx)

      expect(result.audience).toBe(PortalAudience.ToC)
      expect(result.supportedSurfaces).toBeDefined()
      expect(result.supportedSurfaces.length).toBeGreaterThan(0)
      expect(result.primaryDomain).toBeTruthy()
    })

    it('前台查看租户门户可读', () => {
      const { controller } = createController()
      const ctx = createTenantContext()
      const result = controller.getTenantPortal(ctx)
      expect(result.audience).toBe(PortalAudience.ToB)
      expect(result.loginEntry).toBeDefined()
    })
  })

  describe('👥HR — HR', () => {
    it('获取租户 ToB 门户含登录入口', () => {
      const { controller } = createController()
      const ctx = createTenantContext()
      const result = controller.getTenantPortal(ctx)

      expect(result.name).toContain('t-arcade-001')
      expect(result.loginEntry).toBeDefined()
      expect(result.loginEntry!.ssoEnabled).toBe(true)
      expect(result.loginEntry!.loginPath).toContain('cn-mainland/t-arcade-001/login')
      expect(result.solutionTags).toContain('多租户')
    })

    it('HR 查看品牌门户信息', () => {
      const { controller } = createController()
      const ctx = createTenantContext()
      const result = controller.getBrandPortal(ctx)

      expect(result.audience).toBe(PortalAudience.ToB)
      expect(result.solutionTags).toContain('品牌招商')
      expect(result.primaryDomain).toContain('brand-funzone')
    })
  })

  describe('🔧安监 — Security', () => {
    it('获取 bootstrap 含 SSO 配置用于安全审计', () => {
      const { controller } = createController()
      const ctx = createTenantContext()
      const result = controller.getBootstrap(ctx)

      expect(result.tenantPortal.loginEntry!.ssoEnabled).toBeDefined()
      expect(typeof result.tenantPortal.loginEntry!.ssoEnabled).toBe('boolean')
    })

    it('安全视角检验租户门户域名安全', () => {
      const { controller } = createController()
      const ctx = createTenantContext()
      const result = controller.getTenantPortal(ctx)

      expect(result.primaryDomain).toMatch(/^[a-z0-9.-]+\.local$/)
      expect(result.primaryDomain).not.toContain('..')
      expect(result.primaryDomain).not.toContain(' ')
    })
  })

  describe('🎮导玩员 — Guide', () => {
    it('获取门店门户支持表面配置', () => {
      const { controller } = createController()
      const ctx = createTenantContext()
      const result = controller.getStorePortal(ctx)

      expect(result.supportedSurfaces).toContain(StorefrontSurface.OfficialSite)
      expect(result.supportedSurfaces).toContain(StorefrontSurface.H5)
      expect(result.storeName).toBeTruthy()
    })

    it('导玩员视角门店支持多终端', () => {
      const { controller } = createController()
      const ctx = createTenantContext()
      const result = controller.getStorePortal(ctx)

      expect(result.supportedSurfaces.length).toBeGreaterThanOrEqual(4)
      expect(result.supportedSurfaces).toContain(StorefrontSurface.MiniApp)
      expect(result.supportedSurfaces).toContain(StorefrontSurface.App)
    })
  })

  describe('🎯运行专员 — Operations', () => {
    it('bootstrap 完整包含三大门户及市场配置', () => {
      const { controller } = createController()
      const ctx = createTenantContext()
      const result = controller.getBootstrap(ctx)

      expect(result.tenantPortal).toBeDefined()
      expect(result.brandPortal).toBeDefined()
      expect(result.storePortal).toBeDefined()
      expect(result.regionalOverrides).toBeDefined()
    })

    it('运行专员检查全域门户一致性', () => {
      const { controller } = createController()
      const ctx = createTenantContext()
      const result = controller.getBootstrap(ctx)

      expect(result.tenantPortal.marketCode).toBe('cn-mainland')
      expect(result.brandPortal.marketCode).toBe('cn-mainland')
      expect(result.storePortal.marketCode).toBe('cn-mainland')
      expect(result.storePortal.audience).toBe(PortalAudience.ToC)
    })
  })

  describe('🤝团建 — Teambuilding', () => {
    it('获取完整 bootstrap 含租户信息', () => {
      const { controller } = createController()
      const ctx = createTenantContext()
      const result = controller.getBootstrap(ctx)

      expect(result.tenantPortal.name).toContain('t-arcade-001')
      expect(result.tenantPortal.heroTitle).toContain('企业级经营门户')
      expect(result.tenantPortal.scopeCode).toBe('t-arcade-001')
    })

    it('团建视角门店门户语言配置', () => {
      const { controller } = createController()
      const ctx = createTenantContext()
      const storePortal = controller.getStorePortal(ctx)
      expect(storePortal.supportedLanguages).toContain(LanguageCode.ZhCn)
      expect(storePortal.storeName).toBeTruthy()
    })
  })

  describe('📢营销 — Marketing', () => {
    it('获取品牌门户含营销标签', () => {
      const { controller } = createController()
      const ctx = createTenantContext()
      const result = controller.getBrandPortal(ctx)

      expect(result.heroTitle).toContain('brand-funzone')
      expect(result.solutionTags).toContain('品牌招商')
      expect(result.solutionTags).toContain('品牌后台')
    })

    it('营销视角检查注册登录转化路径', () => {
      const { controller } = createController()
      const ctx = createTenantContext()
      const tenantPortal = controller.getTenantPortal(ctx)
      const brandPortal = controller.getBrandPortal(ctx)

      expect(tenantPortal.primaryDomain).toContain('t-arcade-001')
      expect(brandPortal.primaryDomain).toContain('brand-funzone')
      expect(tenantPortal.loginEntry!.loginPath).toContain('/login')
      expect(brandPortal.loginEntry!.loginPath).toContain('/login')
    })
  })

  // ── 边界情况 ──
  describe('边界情况 — Edge Cases', () => {
    it('缺少 brandId 时使用默认值', () => {
      const { controller } = createController()
      const ctx = createTenantContext({ brandId: undefined })
      const result = controller.getBrandPortal(ctx)

      expect(result.name).toContain('brand-demo')
      expect(result.scopeCode).toBe('brand-demo')
    })

    it('缺少 storeId 时使用默认值', () => {
      const { controller } = createController()
      const ctx = createTenantContext({ storeId: undefined })
      const result = controller.getStorePortal(ctx)

      expect(result.storeCode).toBe('store-001')
      expect(result.storeName).toContain('store-001')
    })

    it('海外市场返回多语言支持', () => {
      const ms = createMockMarketService(
        createMockMarketProfile('us-west', [LanguageCode.ZhCn, LanguageCode.EnUs])
      )
      const { controller } = createController(ms)
      const ctx = createTenantContext()
      const result = controller.getBootstrap(ctx)

      expect(result.marketProfile.marketCode).toBe('us-west')
      expect(result.storePortal.supportedLanguages).toContain(LanguageCode.EnUs)
      expect(result.tenantPortal.supportedLanguages.length).toBeGreaterThanOrEqual(2)
    })
  })
})
