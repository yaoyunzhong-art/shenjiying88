import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  MarketProfileDto,
  MarketLocaleDto,
  MarketTimezoneDto,
  MarketCurrencyDto,
  MarketTaxDto,
  MarketNetworkDto,
  MarketEmailDto,
  MarketSocialDto,
  CreateMarketProfileDto,
  UpdateMarketProfileDto,
  ScopedMarketResponseDto
} from './market.dto'
import {
  CountryCode,
  CurrencyCode,
  EmailProvider,
  LanguageCode,
  NetworkRegion,
  SocialPlatform,
  TaxMode
} from '@m5/domain'

describe('MarketDto', () => {
  // ── MarketProfileDto ────────────────────────────────────────────

  describe('MarketProfileDto', () => {
    it('should accept a valid CN market profile', () => {
      const dto: MarketProfileDto = {
        marketCode: 'cn-mainland',
        marketName: '中国大陆',
        countryCode: CountryCode.China,
        locale: {
          defaultLanguage: LanguageCode.ZhCn,
          supportedLanguages: [LanguageCode.ZhCn]
        },
        timezone: { timezone: 'Asia/Shanghai' },
        currency: { currencyCode: CurrencyCode.Cny, symbol: '¥' },
        tax: { taxMode: TaxMode.Included, taxRate: 6, taxLabel: '增值税' },
        network: {
          networkRegion: NetworkRegion.MainlandChina,
          apiBaseUrl: 'https://cn-api.m5.local',
          cdnBaseUrl: 'https://cn-cdn.m5.local',
          callbackBaseUrl: 'https://cn-hooks.m5.local'
        },
        email: {
          provider: EmailProvider.AliyunDm,
          fromName: 'M5 China',
          fromAddress: 'hello-cn@m5.local',
          replyTo: 'support-cn@m5.local'
        },
        social: {
          primaryPlatforms: [SocialPlatform.Wechat, SocialPlatform.Xiaohongshu],
          supportPlatforms: [SocialPlatform.Wechat, SocialPlatform.Weibo, SocialPlatform.Douyin]
        }
      }
      assert.equal(dto.marketCode, 'cn-mainland')
      assert.equal(dto.marketName, '中国大陆')
      assert.equal(dto.countryCode, CountryCode.China)
      assert.equal(dto.locale.defaultLanguage, LanguageCode.ZhCn)
      assert.equal(dto.currency.currencyCode, CurrencyCode.Cny)
      assert.equal(dto.tax.taxRate, 6)
      assert.equal(dto.email.provider, EmailProvider.AliyunDm)
      assert.equal(dto.social.primaryPlatforms.length, 2)
    })

    it('should accept a valid US market profile', () => {
      const dto: MarketProfileDto = {
        marketCode: 'us-default',
        marketName: 'United States',
        countryCode: CountryCode.UnitedStates,
        locale: {
          defaultLanguage: LanguageCode.EnUs,
          supportedLanguages: [LanguageCode.EnUs]
        },
        timezone: { timezone: 'America/New_York' },
        currency: { currencyCode: CurrencyCode.Usd, symbol: '$' },
        tax: { taxMode: TaxMode.Excluded, taxRate: 8.25, taxLabel: 'Sales Tax' },
        network: {
          networkRegion: NetworkRegion.NorthAmerica,
          apiBaseUrl: 'https://us-api.m5.local',
          cdnBaseUrl: 'https://us-cdn.m5.local',
          callbackBaseUrl: 'https://us-hooks.m5.local'
        },
        email: {
          provider: EmailProvider.SendGrid,
          fromName: 'M5 US',
          fromAddress: 'hello-us@m5.local',
          replyTo: 'support-us@m5.local'
        },
        social: {
          primaryPlatforms: [SocialPlatform.LinkedIn, SocialPlatform.Instagram],
          supportPlatforms: [
            SocialPlatform.LinkedIn,
            SocialPlatform.Instagram,
            SocialPlatform.Facebook,
            SocialPlatform.X
          ]
        }
      }
      assert.equal(dto.marketCode, 'us-default')
      assert.equal(dto.countryCode, CountryCode.UnitedStates)
      assert.equal(dto.tax.taxRate, 8.25)
    })
  })

  // ── CreateMarketProfileDto ──────────────────────────────────────

  describe('CreateMarketProfileDto', () => {
    it('should accept a full create payload', () => {
      const dto: CreateMarketProfileDto = {
        marketCode: 'eu-default',
        marketName: 'Europe',
        countryCode: CountryCode.UnitedStates,
        locale: {
          defaultLanguage: LanguageCode.EnUs,
          supportedLanguages: [LanguageCode.EnUs]
        },
        timezone: { timezone: 'Europe/London' },
        currency: { currencyCode: CurrencyCode.Usd, symbol: '$' },
        tax: { taxMode: TaxMode.Excluded, taxRate: 20, taxLabel: 'VAT' },
        network: {
          networkRegion: NetworkRegion.Global,
          apiBaseUrl: 'https://eu-api.m5.local',
          cdnBaseUrl: 'https://eu-cdn.m5.local',
          callbackBaseUrl: 'https://eu-hooks.m5.local'
        },
        email: {
          provider: EmailProvider.Ses,
          fromName: 'M5 Europe',
          fromAddress: 'hello-eu@m5.local',
          replyTo: 'support-eu@m5.local'
        },
        social: {
          primaryPlatforms: [SocialPlatform.X],
          supportPlatforms: [SocialPlatform.X, SocialPlatform.Instagram]
        }
      }
      assert.equal(dto.marketCode, 'eu-default')
      assert.equal(dto.currency.currencyCode, CurrencyCode.Usd)
    })
  })

  // ── UpdateMarketProfileDto (partial update) ─────────────────────

  describe('UpdateMarketProfileDto', () => {
    it('should accept an empty update (all optional)', () => {
      const dto: UpdateMarketProfileDto = {}
      assert.ok(typeof dto !== 'undefined')
      assert.equal(dto.marketName, undefined)
      assert.equal(dto.locale, undefined)
    })

    it('should accept partial field update (marketName only)', () => {
      const dto: UpdateMarketProfileDto = {
        marketName: '中国（更新版）'
      }
      assert.equal(dto.marketName, '中国（更新版）')
      assert.equal(dto.timezone, undefined)
      assert.equal(dto.currency, undefined)
    })

    it('should accept nested partial update (tax only)', () => {
      const dto: UpdateMarketProfileDto = {
        tax: { taxMode: TaxMode.Excluded, taxRate: 13, taxLabel: '增值税（新）' }
      }
      assert.ok(typeof dto.tax !== 'undefined')
      assert.equal(dto.tax!.taxRate, 13)
      assert.equal(dto.tax!.taxLabel, '增值税（新）')
    })
  })

  // ── ScopedMarketResponseDto ─────────────────────────────────────

  describe('ScopedMarketResponseDto', () => {
    it('should accept a scoped response payload', () => {
      const dto: ScopedMarketResponseDto = {
        scopeType: 'tenant',
        scopeCode: 'tenant-demo',
        marketProfile: {
          marketCode: 'cn-mainland',
          marketName: '中国大陆',
          countryCode: CountryCode.China,
          locale: {
            defaultLanguage: LanguageCode.ZhCn,
            supportedLanguages: [LanguageCode.ZhCn]
          },
          timezone: { timezone: 'Asia/Shanghai' },
          currency: { currencyCode: CurrencyCode.Cny, symbol: '¥' },
          tax: { taxMode: TaxMode.Included, taxRate: 6, taxLabel: '增值税' },
          network: {
            networkRegion: NetworkRegion.MainlandChina,
            apiBaseUrl: 'https://cn-api.m5.local',
            cdnBaseUrl: 'https://cn-cdn.m5.local',
            callbackBaseUrl: 'https://cn-hooks.m5.local'
          },
          email: {
            provider: EmailProvider.AliyunDm,
            fromName: 'M5 China',
            fromAddress: 'hello-cn@m5.local',
            replyTo: 'support-cn@m5.local'
          },
          social: {
            primaryPlatforms: [SocialPlatform.Wechat, SocialPlatform.Xiaohongshu],
            supportPlatforms: [SocialPlatform.Wechat, SocialPlatform.Weibo, SocialPlatform.Douyin]
          }
        }
      }
      assert.equal(dto.scopeType, 'tenant')
      assert.equal(dto.scopeCode, 'tenant-demo')
      assert.equal(dto.marketProfile.marketCode, 'cn-mainland')
    })
  })

  // ── 子 DTO 单元测试 ─────────────────────────────────────────────

  describe('MarketLocaleDto', () => {
    it('should accept valid locale', () => {
      const dto: MarketLocaleDto = {
        defaultLanguage: LanguageCode.ZhCn,
        supportedLanguages: [LanguageCode.ZhCn, LanguageCode.EnUs]
      }
      assert.equal(dto.defaultLanguage, LanguageCode.ZhCn)
      assert.equal(dto.supportedLanguages.length, 2)
    })
  })

  describe('MarketTimezoneDto', () => {
    it('should accept valid timezone', () => {
      const dto: MarketTimezoneDto = { timezone: 'Europe/London' }
      assert.equal(dto.timezone, 'Europe/London')
    })
  })

  describe('MarketCurrencyDto', () => {
    it('should accept valid currency', () => {
      const dto: MarketCurrencyDto = { currencyCode: CurrencyCode.Usd, symbol: '$' }
      assert.equal(dto.currencyCode, CurrencyCode.Usd)
      assert.equal(dto.symbol, '$')
    })
  })

  describe('MarketTaxDto', () => {
    it('should accept zero tax rate', () => {
      const dto: MarketTaxDto = { taxMode: TaxMode.Excluded, taxRate: 0, taxLabel: 'Tax Free' }
      assert.equal(dto.taxRate, 0)
    })

    it('should accept high tax rate', () => {
      const dto: MarketTaxDto = { taxMode: TaxMode.Included, taxRate: 25, taxLabel: 'VAT' }
      assert.equal(dto.taxRate, 25)
    })
  })

  describe('MarketNetworkDto', () => {
    it('should accept valid network config', () => {
      const dto: MarketNetworkDto = {
        networkRegion: NetworkRegion.NorthAmerica,
        apiBaseUrl: 'https://api.example.com',
        cdnBaseUrl: 'https://cdn.example.com',
        callbackBaseUrl: 'https://hooks.example.com'
      }
      assert.equal(dto.networkRegion, NetworkRegion.NorthAmerica)
      assert.equal(dto.apiBaseUrl, 'https://api.example.com')
    })
  })

  describe('MarketEmailDto', () => {
    it('should accept valid email config', () => {
      const dto: MarketEmailDto = {
        provider: EmailProvider.SendGrid,
        fromName: 'Test',
        fromAddress: 'test@test.com',
        replyTo: 'reply@test.com'
      }
      assert.equal(dto.provider, EmailProvider.SendGrid)
      assert.equal(dto.fromAddress, 'test@test.com')
    })
  })

  describe('MarketSocialDto', () => {
    it('should accept valid social config', () => {
      const dto: MarketSocialDto = {
        primaryPlatforms: [SocialPlatform.Wechat],
        supportPlatforms: [SocialPlatform.Wechat, SocialPlatform.Douyin]
      }
      assert.equal(dto.primaryPlatforms.length, 1)
      assert.equal(dto.supportPlatforms.length, 2)
    })
  })
})
