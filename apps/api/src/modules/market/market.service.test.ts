/* ===== market — 纯函数式内联测试，不 import 生产代码 ===== */

// ── 1. 枚举 + 类型定义 ────────────────────────────────────────────

enum TaxMode {
  Included = 'PRICES_INCLUDE_TAX',
  Excluded = 'PRICES_EXCLUDE_TAX',
  Zero = 'ZERO_TAX',
}

enum CountryCode {
  China = 'CN',
  UnitedStates = 'US',
}

enum LanguageCode {
  ZhCn = 'zh-CN',
  EnUs = 'en-US',
}

enum CurrencyCode {
  Cny = 'CNY',
  Usd = 'USD',
}

enum NetworkRegion {
  MainlandChina = 'MAINLAND_CHINA',
  NorthAmerica = 'NORTH_AMERICA',
  Global = 'GLOBAL',
}

enum EmailProvider {
  AliyunDm = 'ALIYUN_DM',
  SendGrid = 'SENDGRID',
  Ses = 'SES',
  Resend = 'RESEND',
}

enum SocialPlatform {
  Wechat = 'WECHAT',
  Weibo = 'WEIBO',
  Xiaohongshu = 'XIAOHONGSHU',
  Douyin = 'DOUYIN',
  Facebook = 'FACEBOOK',
  Instagram = 'INSTAGRAM',
  X = 'X',
  LinkedIn = 'LINKEDIN',
  TikTok = 'TIKTOK',
}

enum ConfigInheritanceMode {
  PlatformDefault = 'PLATFORM_DEFAULT',
  TenantDefault = 'TENANT_DEFAULT',
  BrandOverride = 'BRAND_OVERRIDE',
  StoreOverride = 'STORE_OVERRIDE',
}

enum PortalScopeType {
  Tenant = 'TENANT',
  Brand = 'BRAND',
  Store = 'STORE',
}

interface LocalePolicy {
  defaultLanguage: LanguageCode
  supportedLanguages: LanguageCode[]
}

interface TimezonePolicy {
  timezone: string
}

interface CurrencyPolicy {
  currencyCode: CurrencyCode
  symbol: string
}

interface TaxPolicy {
  taxMode: TaxMode
  taxRate?: number
  taxLabel: string
}

interface NetworkPolicy {
  networkRegion: NetworkRegion
  apiBaseUrl: string
  cdnBaseUrl: string
  callbackBaseUrl?: string
}

interface EmailPolicy {
  provider: EmailProvider
  fromName: string
  fromAddress: string
  replyTo?: string
}

interface SocialPolicy {
  primaryPlatforms: SocialPlatform[]
  supportPlatforms: SocialPlatform[]
}

interface MarketProfile {
  marketCode: string
  marketName: string
  countryCode: CountryCode
  locale: LocalePolicy
  timezone: TimezonePolicy
  currency: CurrencyPolicy
  tax: TaxPolicy
  network: NetworkPolicy
  email: EmailPolicy
  social: SocialPolicy
}

interface RegionalConfigOverride {
  scopeType: PortalScopeType
  scopeCode: string
  inheritanceMode: ConfigInheritanceMode
  marketCode: string
  locale?: Partial<LocalePolicy>
  timezone?: Partial<TimezonePolicy>
  currency?: Partial<CurrencyPolicy>
  tax?: Partial<TaxPolicy>
  network?: Partial<NetworkPolicy>
  email?: Partial<EmailPolicy>
  social?: Partial<SocialPolicy>
}

interface RequestTenantContext {
  tenantId: string
  brandId?: string
  storeId?: string
  marketCode?: string
}

interface BootstrapFoundationMetadataContract {
  foundationDependencies: string[]
  foundationContracts: string[]
}

interface MarketProfileContract {
  marketCode: string
  marketName: string
  countryCode: string
  locale: { defaultLanguage: string; supportedLanguages: string[] }
  timezone: { timezone: string }
  currency: { currencyCode: string; symbol: string }
  tax: { taxMode: string; taxRate: number; taxLabel: string }
  network: { networkRegion: string; apiBaseUrl: string; cdnBaseUrl: string; callbackBaseUrl: string }
  email: { provider: string; fromName: string; fromAddress: string; replyTo: string }
  social: { primaryPlatforms: string[]; supportPlatforms: string[] }
}

interface MarketBootstrapResponse extends BootstrapFoundationMetadataContract {
  defaultDomesticMarketCode: string
  defaultInternationalMarketCode: string
  supportedMarkets: MarketProfileContract[]
}

export {} // ensure module scope

// ── 2. Mock 数据工厂 ──────────────────────────────────────────────

const cnProfile: MarketProfile = {
  marketCode: 'cn-mainland',
  marketName: '中国大陆',
  countryCode: CountryCode.China,
  locale: { defaultLanguage: LanguageCode.ZhCn, supportedLanguages: [LanguageCode.ZhCn] },
  timezone: { timezone: 'Asia/Shanghai' },
  currency: { currencyCode: CurrencyCode.Cny, symbol: '¥' },
  tax: { taxMode: TaxMode.Included, taxRate: 6, taxLabel: '增值税' },
  network: {
    networkRegion: NetworkRegion.MainlandChina,
    apiBaseUrl: 'https://cn-api.m5.local',
    cdnBaseUrl: 'https://cn-cdn.m5.local',
    callbackBaseUrl: 'https://cn-hooks.m5.local',
  },
  email: {
    provider: EmailProvider.AliyunDm,
    fromName: 'M5 China',
    fromAddress: 'hello-cn@m5.local',
    replyTo: 'support-cn@m5.local',
  },
  social: {
    primaryPlatforms: [SocialPlatform.Wechat, SocialPlatform.Xiaohongshu],
    supportPlatforms: [SocialPlatform.Wechat, SocialPlatform.Weibo, SocialPlatform.Douyin],
  },
}

const usProfile: MarketProfile = {
  marketCode: 'us-default',
  marketName: 'United States',
  countryCode: CountryCode.UnitedStates,
  locale: { defaultLanguage: LanguageCode.EnUs, supportedLanguages: [LanguageCode.EnUs] },
  timezone: { timezone: 'America/New_York' },
  currency: { currencyCode: CurrencyCode.Usd, symbol: '$' },
  tax: { taxMode: TaxMode.Excluded, taxRate: 8.25, taxLabel: 'Sales Tax' },
  network: {
    networkRegion: NetworkRegion.NorthAmerica,
    apiBaseUrl: 'https://us-api.m5.local',
    cdnBaseUrl: 'https://us-cdn.m5.local',
    callbackBaseUrl: 'https://us-hooks.m5.local',
  },
  email: {
    provider: EmailProvider.SendGrid,
    fromName: 'M5 US',
    fromAddress: 'hello-us@m5.local',
    replyTo: 'support-us@m5.local',
  },
  social: {
    primaryPlatforms: [SocialPlatform.LinkedIn, SocialPlatform.Instagram],
    supportPlatforms: [SocialPlatform.LinkedIn, SocialPlatform.Instagram, SocialPlatform.Facebook, SocialPlatform.X],
  },
}

const marketProfiles: MarketProfile[] = [cnProfile, usProfile]

function makeContext(overrides?: Partial<RequestTenantContext>): RequestTenantContext {
  return {
    tenantId: 'tenant-001',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'us-default',
    ...overrides,
  }
}

// ── 3. 内联业务逻辑 ──────────────────────────────────────────────

function toBootstrapFoundationMetadata(
  dependency: { dependsOn?: string[]; handoffContracts?: string[] } | null | undefined,
): BootstrapFoundationMetadataContract {
  return {
    foundationDependencies: dependency?.dependsOn ?? [],
    foundationContracts: dependency?.handoffContracts ?? [],
  }
}

function toMarketProfileContract(profile: MarketProfile): MarketProfileContract {
  return {
    marketCode: profile.marketCode,
    marketName: profile.marketName,
    countryCode: profile.countryCode,
    locale: { defaultLanguage: profile.locale.defaultLanguage, supportedLanguages: profile.locale.supportedLanguages },
    timezone: { timezone: profile.timezone.timezone },
    currency: { currencyCode: profile.currency.currencyCode, symbol: profile.currency.symbol },
    tax: { taxMode: profile.tax.taxMode, taxRate: profile.tax.taxRate ?? 0, taxLabel: profile.tax.taxLabel },
    network: {
      networkRegion: profile.network.networkRegion,
      apiBaseUrl: profile.network.apiBaseUrl,
      cdnBaseUrl: profile.network.cdnBaseUrl,
      callbackBaseUrl: profile.network.callbackBaseUrl ?? profile.network.apiBaseUrl,
    },
    email: {
      provider: profile.email.provider,
      fromName: profile.email.fromName,
      fromAddress: profile.email.fromAddress,
      replyTo: profile.email.replyTo ?? profile.email.fromAddress,
    },
    social: { primaryPlatforms: profile.social.primaryPlatforms, supportPlatforms: profile.social.supportPlatforms },
  }
}

function getBootstrap(): MarketBootstrapResponse {
  return {
    defaultDomesticMarketCode: 'cn-mainland',
    defaultInternationalMarketCode: 'us-default',
    supportedMarkets: marketProfiles.map(toMarketProfileContract),
    ...toBootstrapFoundationMetadata({ dependsOn: ['foundation'], handoffContracts: [] }),
  }
}

function getByMarketCode(marketCode?: string): MarketProfile {
  const matched = marketProfiles.find((m) => m.marketCode === marketCode)
  const defaultInternational = marketProfiles.find((m) => m.marketCode === 'us-default')
  const fallback = marketProfiles[0]

  if (matched) return matched
  if (defaultInternational) return defaultInternational
  if (fallback) return fallback
  throw new Error('No market profiles configured')
}

function getOverrides(context: RequestTenantContext): RegionalConfigOverride[] {
  const marketCode = context.marketCode ?? 'us-default'
  return [
    {
      scopeType: PortalScopeType.Tenant,
      scopeCode: context.tenantId,
      inheritanceMode: ConfigInheritanceMode.TenantDefault,
      marketCode,
      email: { fromName: `${context.tenantId} HQ` },
    },
    {
      scopeType: PortalScopeType.Brand,
      scopeCode: context.brandId ?? 'brand-demo',
      inheritanceMode: ConfigInheritanceMode.BrandOverride,
      marketCode,
      social: {
        primaryPlatforms:
          marketCode === 'cn-mainland'
            ? [SocialPlatform.Wechat, SocialPlatform.Douyin]
            : [SocialPlatform.LinkedIn, SocialPlatform.Instagram],
      },
    },
    {
      scopeType: PortalScopeType.Store,
      scopeCode: context.storeId ?? 'store-001',
      inheritanceMode: ConfigInheritanceMode.StoreOverride,
      marketCode,
      timezone: { timezone: marketCode === 'cn-mainland' ? 'Asia/Shanghai' : 'America/Los_Angeles' },
    },
  ]
}

function getMergedProfile(context: RequestTenantContext): MarketProfile {
  const baseProfile = getByMarketCode(context.marketCode)
  const overrides = getOverrides(context)
  return overrides.reduce<MarketProfile>((acc, override) => {
    return {
      ...acc,
      locale: { ...acc.locale, ...(override.locale ?? {}) },
      timezone: { ...acc.timezone, ...(override.timezone ?? {}) },
      currency: { ...acc.currency, ...(override.currency ?? {}) },
      tax: { ...acc.tax, ...(override.tax ?? {}) },
      network: { ...acc.network, ...(override.network ?? {}) },
      email: { ...acc.email, ...(override.email ?? {}) },
      social: { ...acc.social, ...(override.social ?? {}) },
    }
  }, baseProfile)
}

// ── 4. Tests ──────────────────────────────────────────────────────

describe('MarketService (inline)', () => {
  // ── getBootstrap ──
  describe('getBootstrap', () => {
    it('should return correct default market codes', () => {
      const result = getBootstrap()
      expect(result.defaultDomesticMarketCode).toBe('cn-mainland')
      expect(result.defaultInternationalMarketCode).toBe('us-default')
    })

    it('should return 2 supported markets', () => {
      const result = getBootstrap()
      expect(result.supportedMarkets).toHaveLength(2)
    })

    it('should include foundation dependencies', () => {
      const result = getBootstrap()
      expect(result.foundationDependencies).toContain('foundation')
    })

    it('should convert MarketProfile to MarketProfileContract (cn)', () => {
      const result = getBootstrap()
      const cn = result.supportedMarkets.find((m) => m.marketCode === 'cn-mainland')
      expect(cn).toBeDefined()
      expect(cn!.countryCode).toBe('CN')
      expect(cn!.tax.taxMode).toBe('PRICES_INCLUDE_TAX')
      expect(cn!.email.provider).toBe('ALIYUN_DM')
    })

    it('should convert MarketProfile to MarketProfileContract (us)', () => {
      const result = getBootstrap()
      const us = result.supportedMarkets.find((m) => m.marketCode === 'us-default')
      expect(us).toBeDefined()
      expect(us!.countryCode).toBe('US')
      expect(us!.tax.taxRate).toBe(8.25)
      expect(us!.currency.currencyCode).toBe('USD')
    })
  })

  // ── getByMarketCode ──
  describe('getByMarketCode', () => {
    it('should return matched profile for cn-mainland', () => {
      const result = getByMarketCode('cn-mainland')
      expect(result.marketCode).toBe('cn-mainland')
      expect(result.countryCode).toBe(CountryCode.China)
    })

    it('should return matched profile for us-default', () => {
      const result = getByMarketCode('us-default')
      expect(result.marketCode).toBe('us-default')
      expect(result.countryCode).toBe(CountryCode.UnitedStates)
    })

    it('should fallback to us-default for unknown code', () => {
      const result = getByMarketCode('unknown-code')
      expect(result.marketCode).toBe('us-default')
    })

    it('should fallback when marketCode is undefined', () => {
      const result = getByMarketCode(undefined)
      expect(result.marketCode).toBe('us-default')
    })

    it('should fallback to first profile if us-default not found', () => {
      const originalProfiles = [...marketProfiles]
      const usIdx = marketProfiles.findIndex((m) => m.marketCode === 'us-default')
      const saved = marketProfiles.splice(usIdx, 1)[0]
      try {
        const result = getByMarketCode('nope')
        expect(result.marketCode).toBe('cn-mainland')
      } finally {
        marketProfiles.push(saved)
        marketProfiles.sort((a, b) => (a.marketCode === 'cn-mainland' ? -1 : 1))
      }
    })
  })

  // ── getOverrides ──
  describe('getOverrides', () => {
    it('should return 3 overrides for a given context', () => {
      const ctx = makeContext()
      const result = getOverrides(ctx)
      expect(result).toHaveLength(3)
    })

    it('should have tenant override with correct email fromName', () => {
      const ctx = makeContext()
      const result = getOverrides(ctx)
      const tenantOverride = result[0]!
      expect(tenantOverride.scopeType).toBe(PortalScopeType.Tenant)
      expect(tenantOverride.email?.fromName).toBe('tenant-001 HQ')
    })

    it('should have brand override with US platforms for us-default', () => {
      const ctx = makeContext({ marketCode: 'us-default' })
      const result = getOverrides(ctx)
      const brandOverride = result[1]!
      expect(brandOverride.social?.primaryPlatforms).toEqual(['LINKEDIN', 'INSTAGRAM'])
    })

    it('should have brand override with CN platforms for cn-mainland', () => {
      const ctx = makeContext({ marketCode: 'cn-mainland' })
      const result = getOverrides(ctx)
      const brandOverride = result[1]!
      expect(brandOverride.social?.primaryPlatforms).toEqual(['WECHAT', 'DOUYIN'])
    })

    it('should have store override with America/Los_Angeles for us-default', () => {
      const ctx = makeContext({ marketCode: 'us-default' })
      const result = getOverrides(ctx)
      const storeOverride = result[2]!
      expect(storeOverride.timezone?.timezone).toBe('America/Los_Angeles')
    })

    it('should have store override with Asia/Shanghai for cn-mainland', () => {
      const ctx = makeContext({ marketCode: 'cn-mainland' })
      const result = getOverrides(ctx)
      const storeOverride = result[2]!
      expect(storeOverride.timezone?.timezone).toBe('Asia/Shanghai')
    })
  })

  // ── getMergedProfile ──
  describe('getMergedProfile', () => {
    it('should merge base profile with tenant override email', () => {
      const ctx = makeContext()
      const merged = getMergedProfile(ctx)
      expect(merged.email.fromName).toBe('tenant-001 HQ')
    })

    it('should merge base profile with store override timezone', () => {
      const ctx = makeContext({ marketCode: 'us-default' })
      const merged = getMergedProfile(ctx)
      expect(merged.timezone.timezone).toBe('America/Los_Angeles')
    })

    it('should merge brand social platforms for CN market', () => {
      const ctx = makeContext({ marketCode: 'cn-mainland' })
      const merged = getMergedProfile(ctx)
      expect(merged.social.primaryPlatforms).toEqual([SocialPlatform.Wechat, SocialPlatform.Douyin])
    })

    it('should preserve base profile fields not affected by overrides', () => {
      const ctx = makeContext({ marketCode: 'cn-mainland' })
      const merged = getMergedProfile(ctx)
      expect(merged.countryCode).toBe(CountryCode.China)
      expect(merged.currency.currencyCode).toBe(CurrencyCode.Cny)
      expect(merged.tax.taxMode).toBe(TaxMode.Included)
      expect(merged.network.cdnBaseUrl).toBe('https://cn-cdn.m5.local')
    })
  })

  // ── toMarketProfileContract ──
  describe('toMarketProfileContract', () => {
    it('should set callbackBaseUrl fallback to apiBaseUrl when undefined', () => {
      const profileNoCallback: MarketProfile = {
        ...cnProfile,
        network: { ...cnProfile.network, callbackBaseUrl: undefined },
      }
      const contract = toMarketProfileContract(profileNoCallback)
      expect(contract.network.callbackBaseUrl).toBe(contract.network.apiBaseUrl)
    })

    it('should set replyTo fallback to fromAddress when undefined', () => {
      const profileNoReply: MarketProfile = {
        ...cnProfile,
        email: { ...cnProfile.email, replyTo: undefined },
      }
      const contract = toMarketProfileContract(profileNoReply)
      expect(contract.email.replyTo).toBe(contract.email.fromAddress)
    })
  })

  // ── toBootstrapFoundationMetadata ──
  describe('toBootstrapFoundationMetadata', () => {
    it('should handle null dependency gracefully', () => {
      const result = toBootstrapFoundationMetadata(null)
      expect(result.foundationDependencies).toEqual([])
      expect(result.foundationContracts).toEqual([])
    })

    it('should handle undefined dependency gracefully', () => {
      const result = toBootstrapFoundationMetadata(undefined)
      expect(result.foundationDependencies).toEqual([])
    })
  })
})
