/**
 * portal.service.spec.ts
 * 🐜 纯函数式内联测试 — 不import生产代码
 * Phase-FP P0 · 2026-07-08
 *
 * 核心业务逻辑：门户实体构造、门户判断、SSO启用检测、
 * 域名生成、语言范围计算、Portal 数据转换
 */

// ============================================================
// 1. 枚举 + 类型定义
// ============================================================

enum PortalAudience {
  ToB = 'tob',
  ToC = 'toc',
}

enum PortalScopeType {
  Tenant = 'tenant',
  Brand = 'brand',
  Store = 'store',
}

enum PortalChannel {
  Web = 'web',
  Mobile = 'mobile',
  MiniApp = 'miniapp',
  App = 'app',
}

enum StorefrontSurface {
  OfficialSite = 'official_site',
  H5 = 'h5',
  MiniApp = 'miniapp',
  App = 'app',
  PcConsole = 'pc_console',
  PadConsole = 'pad_console',
}

enum LanguageCode {
  ZhCn = 'zh-CN',
  EnUs = 'en-US',
  JaJp = 'ja-JP',
}

// ─── 门户类型 ───────────────────────────────────────────────

interface PortalLoginEntry {
  label: string
  loginPath: string
  ssoEnabled: boolean
}

interface BasePortal {
  audience: PortalAudience
  scopeType: PortalScopeType
  scopeCode: string
  tenantCode?: string
  brandCode?: string
  marketCode: string
  channel: PortalChannel
  name: string
  primaryDomain?: string
  supportedLanguages: LanguageCode[]
}

interface TobPortal extends BasePortal {
  audience: PortalAudience.ToB
  heroTitle: string
  heroSubtitle: string
  solutionTags: string[]
  loginEntry: PortalLoginEntry
}

interface StorePortal extends BasePortal {
  audience: PortalAudience.ToC
  storeCode: string
  storeName: string
  supportedSurfaces: StorefrontSurface[]
}

interface PortalEntity {
  id: string
  tenantId: string
  brandId?: string
  storeId?: string
  audience: PortalAudience
  scopeType: PortalScopeType
  scopeCode: string
  marketCode: string
  channel: PortalChannel
  name: string
  primaryDomain?: string
  supportedLanguages: LanguageCode[]
  heroTitle?: string
  heroSubtitle?: string
  solutionTags?: string[]
  loginEntry?: PortalLoginEntry
  supportedSurfaces?: StorefrontSurface[]
  storeName?: string
  createdAt: string
  updatedAt: string
}

interface RequestTenantContext {
  tenantId: string
  brandId?: string
  storeId?: string
}

interface MarketProfile {
  marketCode: string
  locale: {
    supportedLanguages: LanguageCode[]
  }
}

// ============================================================
// 2. Mock 数据工厂
// ============================================================

function makeTenantContext(overrides: Partial<RequestTenantContext> = {}): RequestTenantContext {
  return {
    tenantId: 'tenant-' + Math.random().toString(36).substring(2, 6),
    ...overrides,
  }
}

function makeMarketProfile(overrides: Partial<MarketProfile> = {}): MarketProfile {
  return {
    marketCode: 'cn-mainland',
    locale: { supportedLanguages: [LanguageCode.ZhCn, LanguageCode.EnUs] },
    ...overrides,
  }
}

function makeTobPortal(overrides: Partial<TobPortal> = {}): TobPortal {
  return {
    audience: PortalAudience.ToB,
    scopeType: PortalScopeType.Tenant,
    scopeCode: 'tenant-demo',
    tenantCode: 'tenant-demo',
    marketCode: 'cn-mainland',
    channel: PortalChannel.Web,
    name: 'Demo ToB 官网',
    primaryDomain: 'demo.cn-mainland.b2b.local',
    supportedLanguages: [LanguageCode.ZhCn, LanguageCode.EnUs],
    heroTitle: 'Demo 企业级经营门户',
    heroSubtitle: '覆盖全方位经营能力的统一 SaaS 官网。',
    solutionTags: ['多租户', '多端门户'],
    loginEntry: { label: '进入后台', loginPath: '/cn-mainland/demo/login', ssoEnabled: true },
    ...overrides,
  }
}

function makeStorePortal(overrides: Partial<StorePortal> = {}): StorePortal {
  return {
    audience: PortalAudience.ToC,
    scopeType: PortalScopeType.Store,
    scopeCode: 'store-001',
    storeCode: 'store-001',
    storeName: '门店001',
    tenantCode: 'tenant-demo',
    brandCode: 'brand-demo',
    marketCode: 'cn-mainland',
    channel: PortalChannel.Web,
    name: '门店001 门户',
    primaryDomain: 'store-001.brand-demo.tenant-demo.cn-mainland.local',
    supportedLanguages: [LanguageCode.ZhCn],
    supportedSurfaces: [
      StorefrontSurface.OfficialSite,
      StorefrontSurface.H5,
      StorefrontSurface.MiniApp,
      StorefrontSurface.App,
      StorefrontSurface.PcConsole,
      StorefrontSurface.PadConsole,
    ],
    ...overrides,
  }
}

// ============================================================
// 3. 内联业务逻辑纯函数
// ============================================================

/**
 * 解析租户门户 (纯函数)
 */
function resolveTenantPortal(
  context: RequestTenantContext,
  marketProfile: MarketProfile,
): TobPortal {
  const code = context.tenantId
  return {
    audience: PortalAudience.ToB,
    scopeType: PortalScopeType.Tenant,
    scopeCode: code,
    tenantCode: code,
    brandCode: undefined,
    marketCode: marketProfile.marketCode,
    channel: PortalChannel.Web,
    name: `${code} ToB 官网`,
    primaryDomain: `${code}.${marketProfile.marketCode}.b2b.local`,
    supportedLanguages: marketProfile.locale.supportedLanguages,
    heroTitle: `${code} 企业级经营门户`,
    heroSubtitle: '覆盖品牌、门店、会员、营销、赛事、财务与全球化配置的统一 SaaS 官网。',
    solutionTags: ['多租户', '多端门户', '国际化配置', '门店运营'],
    loginEntry: {
      label: '进入租户后台',
      loginPath: `/${marketProfile.marketCode}/${code}/login`,
      ssoEnabled: true,
    },
  }
}

/**
 * 解析品牌门户 (纯函数)
 */
function resolveBrandPortal(
  context: RequestTenantContext,
  marketProfile: MarketProfile,
): TobPortal {
  const brandCode = context.brandId ?? 'brand-demo'
  return {
    audience: PortalAudience.ToB,
    scopeType: PortalScopeType.Brand,
    scopeCode: brandCode,
    tenantCode: context.tenantId,
    brandCode,
    marketCode: marketProfile.marketCode,
    channel: PortalChannel.Web,
    name: `${brandCode} 品牌 ToB 官网`,
    primaryDomain: `${brandCode}.${context.tenantId}.${marketProfile.marketCode}.b2b.local`,
    supportedLanguages: marketProfile.locale.supportedLanguages,
    heroTitle: `${brandCode} 品牌经营官网`,
    heroSubtitle: '面向品牌招商、加盟合作、渠道拓展、品牌能力展示和后台登录入口。',
    solutionTags: ['品牌招商', '品牌后台', '国际品牌站', '邮件与社媒触点'],
    loginEntry: {
      label: '进入品牌后台',
      loginPath: `/${marketProfile.marketCode}/${context.tenantId}/${brandCode}/login`,
      ssoEnabled: true,
    },
  }
}

/**
 * 解析门店门户 (纯函数)
 */
function resolveStorePortal(
  context: RequestTenantContext,
  marketProfile: MarketProfile,
): StorePortal {
  const brandCode = context.brandId ?? 'brand-demo'
  const storeCode = context.storeId ?? 'store-001'
  return {
    audience: PortalAudience.ToC,
    scopeType: PortalScopeType.Store,
    scopeCode: storeCode,
    tenantCode: context.tenantId,
    brandCode,
    storeCode,
    storeName: `${storeCode} 门店`,
    marketCode: marketProfile.marketCode,
    channel: PortalChannel.Web,
    name: `${storeCode} 门店门户`,
    primaryDomain: `${storeCode}.${brandCode}.${context.tenantId}.${marketProfile.marketCode}.local`,
    supportedLanguages:
      marketProfile.marketCode === 'cn-mainland' ? [LanguageCode.ZhCn] : [LanguageCode.EnUs],
    supportedSurfaces: [
      StorefrontSurface.OfficialSite,
      StorefrontSurface.H5,
      StorefrontSurface.MiniApp,
      StorefrontSurface.App,
      StorefrontSurface.PcConsole,
      StorefrontSurface.PadConsole,
    ],
  }
}

/**
 * 将门户转换为 PortalEntity (纯函数)
 */
function toPortalEntity(
  portal: TobPortal | StorePortal,
  overrides: { id: string; tenantId: string; brandId?: string; storeId?: string },
): PortalEntity {
  const base: PortalEntity = {
    id: overrides.id,
    tenantId: overrides.tenantId,
    brandId: overrides.brandId,
    storeId: overrides.storeId,
    audience: portal.audience,
    scopeType: portal.scopeType,
    scopeCode: portal.scopeCode,
    marketCode: portal.marketCode,
    channel: portal.channel,
    name: portal.name,
    primaryDomain: portal.primaryDomain,
    supportedLanguages: portal.supportedLanguages,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  if (portal.audience === PortalAudience.ToB) {
    const t = portal as TobPortal
    base.heroTitle = t.heroTitle
    base.heroSubtitle = t.heroSubtitle
    base.solutionTags = t.solutionTags
    base.loginEntry = t.loginEntry
  }

  if (portal.audience === PortalAudience.ToC) {
    const s = portal as StorePortal
    base.supportedSurfaces = s.supportedSurfaces
    base.storeName = s.storeName
  }

  return base
}

/**
 * 判断是否为 ToB 门户 (纯函数)
 */
function isTobPortal(entity: PortalEntity): boolean {
  return entity.audience === PortalAudience.ToB
}

/**
 * 判断是否为 Store 门户 (纯函数)
 */
function isStorePortal(entity: PortalEntity): boolean {
  return entity.audience === PortalAudience.ToC
}

/**
 * 判断门户是否启用 SSO (纯函数)
 */
function isSsoEnabled(entity: PortalEntity): boolean {
  return entity.loginEntry?.ssoEnabled ?? false
}

/**
 * 生成 ToB 门户合约 (纯函数)
 */
interface TobPortalContract {
  audience: PortalAudience
  scopeType: PortalScopeType
  scopeCode: string
  tenantCode?: string
  brandCode?: string
  marketCode: string
  channel: PortalChannel
  name: string
  primaryDomain: string
  supportedLanguages: LanguageCode[]
  heroTitle: string
  heroSubtitle: string
  solutionTags: string[]
  loginEntry: PortalLoginEntry
}

function toTobPortalContract(portal: TobPortal): TobPortalContract {
  return {
    audience: portal.audience,
    scopeType: portal.scopeType,
    scopeCode: portal.scopeCode,
    tenantCode: portal.tenantCode,
    brandCode: portal.brandCode,
    marketCode: portal.marketCode,
    channel: portal.channel,
    name: portal.name,
    primaryDomain: portal.primaryDomain ?? `${portal.scopeCode}.${portal.marketCode}.b2b.local`,
    supportedLanguages: portal.supportedLanguages,
    heroTitle: portal.heroTitle,
    heroSubtitle: portal.heroSubtitle,
    solutionTags: portal.solutionTags,
    loginEntry: portal.loginEntry,
  }
}

/**
 * 生成 Store 门户合约 (纯函数)
 */
interface StorePortalContract {
  audience: PortalAudience
  scopeType: PortalScopeType
  scopeCode: string
  tenantCode?: string
  brandCode?: string
  storeCode: string
  storeName: string
  marketCode: string
  channel: PortalChannel
  name: string
  primaryDomain: string
  supportedLanguages: LanguageCode[]
  supportedSurfaces: StorefrontSurface[]
}

function toStorePortalContract(portal: StorePortal): StorePortalContract {
  return {
    audience: portal.audience,
    scopeType: portal.scopeType,
    scopeCode: portal.scopeCode,
    tenantCode: portal.tenantCode,
    brandCode: portal.brandCode,
    storeCode: portal.storeCode,
    storeName: portal.storeName,
    marketCode: portal.marketCode,
    channel: portal.channel,
    name: portal.name,
    primaryDomain: portal.primaryDomain ?? `${portal.storeCode}.${portal.marketCode}.local`,
    supportedLanguages: portal.supportedLanguages,
    supportedSurfaces: portal.supportedSurfaces,
  }
}

/**
 * 获取门店支持的语言 (基于市场编码) (纯函数)
 */
function getStoreLanguages(marketCode: string): LanguageCode[] {
  return marketCode === 'cn-mainland' ? [LanguageCode.ZhCn] : [LanguageCode.EnUs]
}

// ============================================================
// 4. 测试用例
// ============================================================

import { describe, it, expect } from 'vitest'

describe('🧪 portal — 纯函数门户服务', () => {
  // ============================================================
  // 正例 8+
  // ============================================================
  describe('✅ 正例 — resolveTenantPortal', () => {
    it('正确设置租户门户基本信息', () => {
      const ctx = makeTenantContext({ tenantId: 't1' })
      const mp = makeMarketProfile({ marketCode: 'cn-mainland' })
      const portal = resolveTenantPortal(ctx, mp)
      expect(portal.audience).toBe(PortalAudience.ToB)
      expect(portal.scopeType).toBe(PortalScopeType.Tenant)
      expect(portal.scopeCode).toBe('t1')
      expect(portal.tenantCode).toBe('t1')
      expect(portal.marketCode).toBe('cn-mainland')
    })
    it('域名格式正确', () => {
      const ctx = makeTenantContext({ tenantId: 'acme-corp' })
      const mp = makeMarketProfile({ marketCode: 'sg' })
      const portal = resolveTenantPortal(ctx, mp)
      expect(portal.primaryDomain).toBe('acme-corp.sg.b2b.local')
    })
    it('登录路径正确', () => {
      const ctx = makeTenantContext({ tenantId: 't1' })
      const mp = makeMarketProfile({ marketCode: 'cn-mainland' })
      const portal = resolveTenantPortal(ctx, mp)
      expect(portal.loginEntry.loginPath).toBe('/cn-mainland/t1/login')
      expect(portal.loginEntry.ssoEnabled).toBe(true)
    })
    it('支持语言继承自市场配置', () => {
      const ctx = makeTenantContext()
      const mp = makeMarketProfile({ locale: { supportedLanguages: [LanguageCode.ZhCn, LanguageCode.JaJp] } })
      const portal = resolveTenantPortal(ctx, mp)
      expect(portal.supportedLanguages).toContain(LanguageCode.ZhCn)
      expect(portal.supportedLanguages).toContain(LanguageCode.JaJp)
      expect(portal.supportedLanguages).toHaveLength(2)
    })
  })

  describe('✅ 正例 — resolveBrandPortal', () => {
    it('品牌门户使用 brandId', () => {
      const ctx = makeTenantContext({ tenantId: 't1', brandId: 'nike' })
      const mp = makeMarketProfile({ marketCode: 'cn-mainland' })
      const portal = resolveBrandPortal(ctx, mp)
      expect(portal.scopeCode).toBe('nike')
      expect(portal.brandCode).toBe('nike')
      expect(portal.name).toContain('nike')
    })
    it('品牌门户域名包含 brandId + tenantId', () => {
      const ctx = makeTenantContext({ tenantId: 't1', brandId: 'nike' })
      const mp = makeMarketProfile({ marketCode: 'cn-mainland' })
      const portal = resolveBrandPortal(ctx, mp)
      expect(portal.primaryDomain).toBe('nike.t1.cn-mainland.b2b.local')
    })
    it('无 brandId 时默认 brand-demo', () => {
      const ctx = makeTenantContext({ tenantId: 't1' })
      const mp = makeMarketProfile()
      const portal = resolveBrandPortal(ctx, mp)
      expect(portal.scopeCode).toBe('brand-demo')
    })
  })

  describe('✅ 正例 — resolveStorePortal', () => {
    it('中国门店语言为 zh-CN', () => {
      const ctx = makeTenantContext({ tenantId: 't1', storeId: 's001' })
      const portal = resolveStorePortal(ctx, makeMarketProfile({ marketCode: 'cn-mainland' }))
      expect(portal.supportedLanguages).toEqual([LanguageCode.ZhCn])
    })
    it('海外门店语言为 en-US', () => {
      const ctx = makeTenantContext({ tenantId: 't1', storeId: 's002' })
      const portal = resolveStorePortal(ctx, makeMarketProfile({ marketCode: 'sg' }))
      expect(portal.supportedLanguages).toEqual([LanguageCode.EnUs])
    })
    it('门店门户包含所有终端表面', () => {
      const ctx = makeTenantContext({ tenantId: 't1', storeId: 's001' })
      const portal = resolveStorePortal(ctx, makeMarketProfile())
      expect(portal.supportedSurfaces).toHaveLength(6)
      expect(portal.supportedSurfaces).toContain(StorefrontSurface.MiniApp)
    })
    it('无 storeId 时默认 store-001', () => {
      const ctx = makeTenantContext({ tenantId: 't1' })
      const portal = resolveStorePortal(ctx, makeMarketProfile())
      expect(portal.storeCode).toBe('store-001')
    })
  })

  describe('✅ 正例 — isTobPortal / isStorePortal / isSsoEnabled', () => {
    it('ToB 门户判断正确', () => {
      const entity: PortalEntity = {
        id: '1', tenantId: 't1', audience: PortalAudience.ToB,
        scopeType: PortalScopeType.Tenant, scopeCode: 't1', marketCode: 'cn',
        channel: PortalChannel.Web, name: 'Test', supportedLanguages: [LanguageCode.ZhCn],
        createdAt: '', updatedAt: '',
      }
      expect(isTobPortal(entity)).toBe(true)
      expect(isStorePortal(entity)).toBe(false)
    })
    it('ToC 门户判断正确', () => {
      const entity: PortalEntity = {
        id: '2', tenantId: 't1', audience: PortalAudience.ToC,
        scopeType: PortalScopeType.Store, scopeCode: 's001', marketCode: 'cn',
        channel: PortalChannel.Web, name: 'Store', supportedLanguages: [LanguageCode.ZhCn],
        storeName: '门店', supportedSurfaces: [StorefrontSurface.H5],
        createdAt: '', updatedAt: '',
      }
      expect(isStorePortal(entity)).toBe(true)
      expect(isTobPortal(entity)).toBe(false)
    })
    it('启用 SSO 返回 true', () => {
      const entity: PortalEntity = {
        id: '3', tenantId: 't1', audience: PortalAudience.ToB,
        scopeType: PortalScopeType.Tenant, scopeCode: 't1', marketCode: 'cn',
        channel: PortalChannel.Web, name: 'Test', supportedLanguages: [],
        loginEntry: { label: 'Login', loginPath: '/login', ssoEnabled: true },
        createdAt: '', updatedAt: '',
      }
      expect(isSsoEnabled(entity)).toBe(true)
    })
    it('未配置 loginEntry 返回 false', () => {
      const entity: PortalEntity = {
        id: '4', tenantId: 't1', audience: PortalAudience.ToB,
        scopeType: PortalScopeType.Tenant, scopeCode: 't1', marketCode: 'cn',
        channel: PortalChannel.Web, name: 'Test', supportedLanguages: [],
        createdAt: '', updatedAt: '',
      }
      expect(isSsoEnabled(entity)).toBe(false)
    })
  })

  describe('✅ 正例 — toPortalEntity', () => {
    it('ToB 门户转换包含 heroTitle 等字段', () => {
      const portal = makeTobPortal({ heroTitle: '测试门户', heroSubtitle: '副标题' })
      const entity = toPortalEntity(portal, { id: 'e1', tenantId: 't1' })
      expect(entity.audience).toBe(PortalAudience.ToB)
      expect(entity.heroTitle).toBe('测试门户')
      expect(entity.heroSubtitle).toBe('副标题')
      expect(entity.solutionTags).toBeDefined()
      expect(entity.loginEntry).toBeDefined()
    })
    it('Store 门户转换包含 supportedSurfaces', () => {
      const portal = makeStorePortal({ storeName: '我的门店' })
      const entity = toPortalEntity(portal, { id: 'e2', tenantId: 't1', storeId: 's001' })
      expect(entity.audience).toBe(PortalAudience.ToC)
      expect(entity.storeName).toBe('我的门店')
      expect(entity.supportedSurfaces).toContain(StorefrontSurface.H5)
    })
  })

  // ============================================================
  // 反例 5+
  // ============================================================
  describe('❌ 反例 — resolveTenantPortal', () => {
    it('不同租户生成不同门户', () => {
      const mp = makeMarketProfile()
      const p1 = resolveTenantPortal(makeTenantContext({ tenantId: 'a' }), mp)
      const p2 = resolveTenantPortal(makeTenantContext({ tenantId: 'b' }), mp)
      expect(p1.name).not.toBe(p2.name)
      expect(p1.primaryDomain).not.toBe(p2.primaryDomain)
    })
    it('不同市场生成不同域名后缀', () => {
      const ctx = makeTenantContext({ tenantId: 't1' })
      const cn = resolveTenantPortal(ctx, makeMarketProfile({ marketCode: 'cn-mainland' }))
      const sg = resolveTenantPortal(ctx, makeMarketProfile({ marketCode: 'sg' }))
      expect(cn.primaryDomain).toContain('cn-mainland')
      expect(sg.primaryDomain).toContain('sg')
    })
  })

  describe('❌ 反例 — resolveStorePortal', () => {
    it('门店门户不能是 ToB', () => {
      const portal = resolveStorePortal(makeTenantContext(), makeMarketProfile())
      expect(portal.audience).toBe(PortalAudience.ToC)
    })
    it('门店域名不包含 b2b', () => {
      const portal = resolveStorePortal(makeTenantContext({ tenantId: 't1' }), makeMarketProfile({ marketCode: 'cn' }))
      expect(portal.primaryDomain).not.toContain('b2b')
      expect(portal.primaryDomain).toContain('local')
    })
  })

  describe('❌ 反例 — isTobPortal / isStorePortal', () => {
    it('ToB 的 isStorePortal 返回 false', () => {
      const entity: PortalEntity = { id: '5', tenantId: 't1', audience: PortalAudience.ToB, scopeType: PortalScopeType.Tenant, scopeCode: 't1', marketCode: 'cn', channel: PortalChannel.Web, name: 'T', supportedLanguages: [], createdAt: '', updatedAt: '' }
      expect(isStorePortal(entity)).toBe(false)
    })
    it('ToC 的 isTobPortal 返回 false', () => {
      const entity: PortalEntity = { id: '6', tenantId: 't1', audience: PortalAudience.ToC, scopeType: PortalScopeType.Store, scopeCode: 's1', marketCode: 'cn', channel: PortalChannel.Web, name: 'S', supportedLanguages: [], storeName: 'S', supportedSurfaces: [], createdAt: '', updatedAt: '' }
      expect(isTobPortal(entity)).toBe(false)
    })
    it('loginEntry.ssoEnabled=false 时 isSsoEnabled 返回 false', () => {
      const entity: PortalEntity = { id: '7', tenantId: 't1', audience: PortalAudience.ToB, scopeType: PortalScopeType.Tenant, scopeCode: 't1', marketCode: 'cn', channel: PortalChannel.Web, name: 'T', supportedLanguages: [], loginEntry: { label: 'L', loginPath: '/l', ssoEnabled: false }, createdAt: '', updatedAt: '' }
      expect(isSsoEnabled(entity)).toBe(false)
    })
  })

  describe('❌ 反例 — toTobPortalContract / toStorePortalContract', () => {
    it('ToB 合约不包含 storeCode', () => {
      const portal = makeTobPortal()
      const contract = toTobPortalContract(portal)
      expect((contract as any).storeCode).toBeUndefined()
    })
    it('Store 合约不包含 heroTitle', () => {
      const portal = makeStorePortal()
      const contract = toStorePortalContract(portal)
      expect((contract as any).heroTitle).toBeUndefined()
    })
  })

  // ============================================================
  // 边界 5+
  // ============================================================
  describe('🔲 边界 — resolveBrandPortal', () => {
    it('未设 brandId 回退为 brand-demo', () => {
      const ctx = makeTenantContext({ tenantId: 't1' })
      const portal = resolveBrandPortal(ctx, makeMarketProfile())
      expect(portal.scopeCode).toBe('brand-demo')
    })
  })

  describe('🔲 边界 — resolveStorePortal', () => {
    it('未设 storeId 回退 store-001', () => {
      const ctx = makeTenantContext({ tenantId: 't1' })
      const portal = resolveStorePortal(ctx, makeMarketProfile())
      expect(portal.storeCode).toBe('store-001')
    })
    it('非中国海外市场用 en-US', () => {
      for (const mc of ['sg', 'us', 'jp', 'th', 'vn']) {
        const ctx = makeTenantContext()
        const portal = resolveStorePortal(ctx, makeMarketProfile({ marketCode: mc }))
        expect(portal.supportedLanguages).toEqual([LanguageCode.EnUs])
      }
    })
  })

  describe('🔲 边界 — toPortalEntity', () => {
    it('brandId 和 storeId 可选传递', () => {
      const portal = makeTobPortal()
      const entity = toPortalEntity(portal, { id: 'id1', tenantId: 't1' })
      expect(entity.brandId).toBeUndefined()
      expect(entity.storeId).toBeUndefined()
    })
    it('brandId 和 storeId 传递后保留', () => {
      const portal = makeTobPortal()
      const entity = toPortalEntity(portal, { id: 'id2', tenantId: 't1', brandId: 'nike', storeId: 's001' })
      expect(entity.brandId).toBe('nike')
      expect(entity.storeId).toBe('s001')
    })
  })

  describe('🔲 边界 — toTobPortalContract / toStorePortalContract', () => {
    it('未设置 primaryDomain 时生成默认域名', () => {
      const portal = makeTobPortal({ primaryDomain: undefined as any })
      const contract = toTobPortalContract(portal)
      expect(contract.primaryDomain).toBe('tenant-demo.cn-mainland.b2b.local')
    })
    it('Store 合约默认域名格式', () => {
      const portal = makeStorePortal({ storeCode: 's001', marketCode: 'sg', primaryDomain: undefined as any })
      const contract = toStorePortalContract(portal)
      expect(contract.primaryDomain).toBe('s001.sg.local')
    })
    it('显式 primaryDomain 不被覆盖', () => {
      const portal = makeTobPortal({ primaryDomain: 'custom.example.com' })
      const contract = toTobPortalContract(portal)
      expect(contract.primaryDomain).toBe('custom.example.com')
    })
  })

  describe('🔲 边界 — getStoreLanguages', () => {
    it('cn-mainland 返回 zh-CN', () => {
      expect(getStoreLanguages('cn-mainland')).toEqual([LanguageCode.ZhCn])
    })
    it('其他市场返回 en-US', () => {
      expect(getStoreLanguages('sg')).toEqual([LanguageCode.EnUs])
      expect(getStoreLanguages('us-east')).toEqual([LanguageCode.EnUs])
      expect(getStoreLanguages('')).toEqual([LanguageCode.EnUs])
    })
  })
})
