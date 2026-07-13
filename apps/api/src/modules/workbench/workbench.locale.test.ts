import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { WorkbenchService } from './workbench.service'

function makeMarketProfile(overrides?: {
  locale?: { defaultLanguage: string; supportedLanguages: string[] }
}) {
  return {
    marketCode: 'cn-mainland',
    marketName: '中国大陆',
    countryCode: 'CN',
    locale: overrides?.locale ?? { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
    timezone: { timezone: 'Asia/Shanghai' },
    currency: { currencyCode: 'CNY', symbol: '¥' },
    tax: { taxMode: 'included', taxRate: 6, taxLabel: 'VAT' },
    network: {
      networkRegion: 'cn-mainland',
      apiBaseUrl: 'https://api.example.com',
      cdnBaseUrl: 'https://cdn.example.com',
      callbackBaseUrl: 'https://cb.example.com',
    },
    email: {
      provider: 'ses',
      fromName: 'M5',
      fromAddress: 'noreply@example.com',
      replyTo: 'support@example.com',
    },
    social: {
      primaryPlatforms: ['wechat'],
      supportPlatforms: ['wechat', 'weibo'],
    },
  }
}

describe('Workbench locale bootstrap', () => {
  it('uses tenant-config locale policy when available', () => {
    const service = new WorkbenchService(
      {
        getMergedProfile: () => makeMarketProfile(),
      } as any,
      {
        getBootstrap: () => ({
          storePortal: {},
          tenantPortal: { loginEntry: { loginPath: '/login', ssoEnabled: false } },
          brandPortal: {},
        }),
      } as any,
      {
        getDependencySummary: () => null,
      } as any,
      {} as any,
      {
        resolveLocalePolicyForContext: () => ({
          defaultLanguage: 'en-US',
          supportedLanguages: ['en-US', 'ja-JP'],
        }),
      } as any,
    )

    const result = service.getBootstrap({
      tenantId: 'tenant-A',
      role: 'tenant_admin',
      marketCode: 'cn-mainland',
    } as any)

    assert.deepEqual(result.supportedLocales, ['en-US', 'ja-JP'])
    assert.equal(result.marketProfile.locale.defaultLanguage, 'en-US')
    assert.deepEqual(result.marketProfile.locale.supportedLanguages, ['en-US', 'ja-JP'])
  })

  it('falls back to market locale when tenant-config locale service is absent', () => {
    const service = new WorkbenchService(
      {
        getMergedProfile: () =>
          makeMarketProfile({
            locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN', 'en-US'] },
          }),
      } as any,
      {
        getBootstrap: () => ({
          storePortal: {},
          tenantPortal: { loginEntry: { loginPath: '/login', ssoEnabled: false } },
          brandPortal: {},
        }),
      } as any,
      {
        getDependencySummary: () => null,
      } as any,
      {} as any,
    )

    const result = service.getBootstrap({
      tenantId: 'tenant-A',
      role: 'tenant_admin',
      marketCode: 'cn-mainland',
    } as any)

    assert.deepEqual(result.supportedLocales, ['zh-CN', 'en-US'])
    assert.equal(result.marketProfile.locale.defaultLanguage, 'zh-CN')
  })
})
