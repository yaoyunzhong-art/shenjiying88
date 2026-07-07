import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  MarketProfile,
  MarketLocale,
  MarketTimezone,
  MarketCurrency,
  MarketTax,
  MarketNetwork,
  MarketEmail,
  MarketSocial
} from './market.entity'
import {
  CountryCode,
  CurrencyCode,
  EmailProvider,
  LanguageCode,
  NetworkRegion,
  SocialPlatform,
  TaxMode
} from '@m5/domain'

describe('MarketProfile (entity)', () => {
  const createCNMarket = (): MarketProfile => ({
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
  })

  const createUSMarket = (): MarketProfile => ({
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
  })

  // ── 正例 ────────────────────────────────────────────────────────

  it('should create a valid CN market profile', () => {
    const profile = createCNMarket()
    assert.equal(profile.marketCode, 'cn-mainland')
    assert.equal(profile.countryCode, CountryCode.China)
    assert.equal(profile.locale.defaultLanguage, LanguageCode.ZhCn)
    assert.equal(profile.currency.symbol, '¥')
    assert.equal(profile.tax.taxMode, TaxMode.Included)
    assert.equal(profile.network.networkRegion, NetworkRegion.MainlandChina)
    assert.equal(profile.email.provider, EmailProvider.AliyunDm)
    assert.ok(profile.social.primaryPlatforms.includes(SocialPlatform.Wechat))
  })

  it('should create a valid US market profile', () => {
    const profile = createUSMarket()
    assert.equal(profile.marketCode, 'us-default')
    assert.equal(profile.countryCode, CountryCode.UnitedStates)
    assert.equal(profile.locale.defaultLanguage, LanguageCode.EnUs)
    assert.equal(profile.currency.symbol, '$')
    assert.equal(profile.tax.taxMode, TaxMode.Excluded)
    assert.equal(profile.network.networkRegion, NetworkRegion.NorthAmerica)
    assert.equal(profile.email.provider, EmailProvider.SendGrid)
    assert.ok(profile.social.supportPlatforms.includes(SocialPlatform.Facebook))
  })

  it('should support multiple supported languages', () => {
    const profile = createCNMarket()
    profile.locale.supportedLanguages = [LanguageCode.ZhCn, LanguageCode.EnUs]
    assert.equal(profile.locale.supportedLanguages.length, 2)
    assert.ok(profile.locale.supportedLanguages.includes(LanguageCode.ZhCn))
    assert.ok(profile.locale.supportedLanguages.includes(LanguageCode.EnUs))
  })

  // ── 边界 ────────────────────────────────────────────────────────

  it('should handle zero tax rate', () => {
    const profile = createCNMarket()
    profile.tax.taxRate = 0
    assert.equal(profile.tax.taxRate, 0)
  })

  it('should handle empty social platforms', () => {
    const profile = createCNMarket()
    profile.social.primaryPlatforms = []
    profile.social.supportPlatforms = []
    assert.equal(profile.social.primaryPlatforms.length, 0)
    assert.equal(profile.social.supportPlatforms.length, 0)
  })

  it('should be structurally assignable across markets', () => {
    const cn = createCNMarket()
    const us = createUSMarket()
    const merged: MarketProfile = { ...us, locale: cn.locale, timezone: cn.timezone }
    assert.equal(merged.locale.defaultLanguage, LanguageCode.ZhCn)
    assert.equal(merged.timezone.timezone, 'Asia/Shanghai')
    assert.equal(merged.currency.currencyCode, CurrencyCode.Usd)
  })

  // ── 子 Entity 单元 ──────────────────────────────────────────────

  it('MarketLocale should have expected shape', () => {
    const locale: MarketLocale = { defaultLanguage: LanguageCode.ZhCn, supportedLanguages: [LanguageCode.ZhCn] }
    assert.ok(typeof locale !== 'undefined')
    assert.equal(typeof locale.defaultLanguage, 'string')
    assert.equal(Array.isArray(locale.supportedLanguages), true)
  })

  it('MarketTimezone should have expected shape', () => {
    const tz: MarketTimezone = { timezone: 'Asia/Tokyo' }
    assert.equal(tz.timezone, 'Asia/Tokyo')
  })

  it('MarketCurrency should have expected shape', () => {
    const currency: MarketCurrency = { currencyCode: CurrencyCode.Usd, symbol: '$' }
    assert.equal(currency.currencyCode, CurrencyCode.Usd)
    assert.equal(currency.symbol, '$')
  })

  it('MarketTax should have expected shape', () => {
    const tax: MarketTax = { taxMode: TaxMode.Included, taxRate: 10, taxLabel: '消费税' }
    assert.equal(tax.taxRate, 10)
    assert.equal(tax.taxLabel, '消费税')
  })

  it('MarketNetwork should have expected shape', () => {
    const net: MarketNetwork = {
      networkRegion: NetworkRegion.NorthAmerica,
      apiBaseUrl: 'https://api.example.com',
      cdnBaseUrl: 'https://cdn.example.com',
      callbackBaseUrl: 'https://hooks.example.com'
    }
    assert.equal(net.networkRegion, NetworkRegion.NorthAmerica)
    assert.equal(net.apiBaseUrl, 'https://api.example.com')
  })

  it('MarketEmail should have expected shape', () => {
    const email: MarketEmail = {
      provider: EmailProvider.SendGrid,
      fromName: 'Test',
      fromAddress: 'test@test.com',
      replyTo: 'reply@test.com'
    }
    assert.equal(email.provider, EmailProvider.SendGrid)
    assert.equal(email.fromName, 'Test')
  })

  it('MarketSocial should support mixed platforms', () => {
    const social: MarketSocial = {
      primaryPlatforms: [SocialPlatform.Wechat],
      supportPlatforms: [SocialPlatform.Wechat, SocialPlatform.Douyin, SocialPlatform.Xiaohongshu]
    }
    assert.equal(social.primaryPlatforms.length, 1)
    assert.equal(social.supportPlatforms.length, 3)
    assert.ok(social.supportPlatforms.includes(SocialPlatform.Wechat))
  })
})
