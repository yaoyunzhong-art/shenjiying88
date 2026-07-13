import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { LanguageCode } from '@m5/domain'
import { PortalService } from './portal.service'

function makeMarketProfile(overrides?: {
  marketCode?: string
  locale?: {
    defaultLanguage: LanguageCode
    supportedLanguages: LanguageCode[]
  }
}) {
  return {
    marketCode: overrides?.marketCode ?? 'cn-mainland',
    marketName: '中国大陆',
    locale: overrides?.locale ?? {
      defaultLanguage: LanguageCode.ZhCn,
      supportedLanguages: [LanguageCode.ZhCn],
    },
    timezone: { timezone: 'Asia/Shanghai' },
    currency: { currencyCode: 'CNY', symbol: '¥' },
    tax: { taxMode: 'INCLUDED', taxRate: 6, taxLabel: '增值税' },
    network: {
      networkRegion: 'MAINLAND_CHINA',
      apiBaseUrl: 'https://cn-api.m5.local',
      cdnBaseUrl: 'https://cn-cdn.m5.local',
      callbackBaseUrl: 'https://cn-hooks.m5.local',
    },
    email: {
      provider: 'ALIYUN_DM',
      fromName: 'M5 China',
      fromAddress: 'hello-cn@m5.local',
      replyTo: 'hello-cn@m5.local',
    },
  }
}

describe('portal.service locale policy', () => {
  it('prefers tenant-config locale policy and filters unsupported portal languages', () => {
    const service = new PortalService(
      {
        getMergedProfile: () =>
          makeMarketProfile({
            locale: {
              defaultLanguage: LanguageCode.ZhCn,
              supportedLanguages: [LanguageCode.ZhCn],
            },
          }),
        getOverrides: () => [],
      } as any,
      {
        getDependencySummary: () => null,
      } as any,
      {
        resolveLocalePolicyForContext: () => ({
          defaultLanguage: LanguageCode.EnUs,
          supportedLanguages: [LanguageCode.EnUs, 'ja-JP'],
        }),
      } as any,
    )

    const ctx = {
      tenantId: 'tenant-A',
      brandId: 'tenant-A::brand-1',
      storeId: 'store-001',
      marketCode: 'cn-mainland',
    } as any

    const tenantPortal = service.resolveTenantPortal(ctx)
    const brandPortal = service.resolveBrandPortal(ctx)
    const storePortal = service.resolveStorePortal(ctx)
    const bootstrap = service.getBootstrap(ctx)

    assert.deepEqual(tenantPortal.supportedLanguages, [LanguageCode.EnUs, LanguageCode.ZhCn])
    assert.deepEqual(brandPortal.supportedLanguages, [LanguageCode.EnUs, LanguageCode.ZhCn])
    assert.deepEqual(storePortal.supportedLanguages, [LanguageCode.EnUs, LanguageCode.ZhCn])
    assert.equal(bootstrap.marketProfile.locale.defaultLanguage, LanguageCode.EnUs)
    assert.deepEqual(bootstrap.marketProfile.locale.supportedLanguages, [LanguageCode.EnUs, LanguageCode.ZhCn])
    assert.deepEqual(bootstrap.storePortal.supportedLanguages, [LanguageCode.EnUs, LanguageCode.ZhCn])
  })

  it('falls back to market locale when tenant-config service is absent', () => {
    const service = new PortalService(
      {
        getMergedProfile: () =>
          makeMarketProfile({
            marketCode: 'us-default',
            locale: {
              defaultLanguage: LanguageCode.EnUs,
              supportedLanguages: [LanguageCode.EnUs],
            },
          }),
        getOverrides: () => [],
      } as any,
      {
        getDependencySummary: () => null,
      } as any,
    )

    const ctx = {
      tenantId: 'tenant-US',
      brandId: 'tenant-US::brand-1',
      storeId: 'store-us-001',
      marketCode: 'us-default',
    } as any

    const tenantPortal = service.resolveTenantPortal(ctx)
    const brandPortal = service.resolveBrandPortal(ctx)
    const storePortal = service.resolveStorePortal(ctx)
    const bootstrap = service.getBootstrap(ctx)

    assert.deepEqual(tenantPortal.supportedLanguages, [LanguageCode.EnUs])
    assert.deepEqual(brandPortal.supportedLanguages, [LanguageCode.EnUs])
    assert.deepEqual(storePortal.supportedLanguages, [LanguageCode.EnUs])
    assert.equal(bootstrap.marketProfile.locale.defaultLanguage, LanguageCode.EnUs)
    assert.deepEqual(bootstrap.marketProfile.locale.supportedLanguages, [LanguageCode.EnUs])
  })
})
