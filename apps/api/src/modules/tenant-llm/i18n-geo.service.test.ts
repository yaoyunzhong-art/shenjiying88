import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { I18nGeoService } from './i18n-geo.service'

describe('I18nGeoService', () => {
  let service: I18nGeoService

  beforeEach(() => {
    service = new I18nGeoService()
  })

  describe('detectCountryFromIP', () => {
    it('should return CN for Chinese IP range', () => {
      const country = service.detectCountryFromIP('112.80.248.76')
      expect(country).toBe('CN')
    })

    it('should return US for US IP range', () => {
      const country = service.detectCountryFromIP('8.8.8.8')
      expect(country).toBe('US')
    })

    it('should return JP for Japan IP range', () => {
      const country = service.detectCountryFromIP('103.5.140.186')
      expect(country).toBe('JP')
    })

    it('should return UNKNOWN for unrecognized IP', () => {
      const country = service.detectCountryFromIP('1.1.1.1')
      expect(country).toBe('UNKNOWN')
    })
  })

  describe('getIPLocaleMapping', () => {
    it('should return zh-CN for CN', () => {
      const locale = service.getIPLocaleMapping('CN')
      expect(locale).toBe('zh-CN')
    })

    it('should return en-US for US', () => {
      const locale = service.getIPLocaleMapping('US')
      expect(locale).toBe('en-US')
    })

    it('should return ja-JP for JP', () => {
      const locale = service.getIPLocaleMapping('JP')
      expect(locale).toBe('ja-JP')
    })

    it('should return default for unknown country', () => {
      const locale = service.getIPLocaleMapping('UNKNOWN')
      expect(locale).toBe('zh-CN')
    })
  })

  describe('suggestLocale', () => {
    it('should suggest locale from Accept-Language', () => {
      const locale = service.suggestLocale('zh-CN,en-US;q=0.9')
      expect(locale).toBe('zh-CN')
    })

    it('should fallback to IP-based locale', () => {
      const locale = service.suggestLocale('', '8.8.8.8')
      expect(locale).toBe('en-US')
    })

    it('should use default when no info available', () => {
      const locale = service.suggestLocale('', '')
      expect(locale).toBe('zh-CN')
    })
  })

  describe('isSupportedLocale', () => {
    it('should return true for supported locale', () => {
      expect(service.isSupportedLocale('zh-CN')).toBe(true)
      expect(service.isSupportedLocale('en-US')).toBe(true)
      expect(service.isSupportedLocale('ja-JP')).toBe(true)
    })

    it('should return false for unsupported locale', () => {
      expect(service.isSupportedLocale('fr-FR')).toBe(false)
    })
  })

  describe('getLocaleForRegion', () => {
    it('should return zh-CN for China', () => {
      const locale = service.getLocaleForRegion('China')
      expect(locale).toBe('zh-CN')
    })

    it('should return en-US for United States', () => {
      const locale = service.getLocaleForRegion('United States')
      expect(locale).toBe('en-US')
    })

    it('should return default for unknown region', () => {
      const locale = service.getLocaleForRegion('Unknown')
      expect(locale).toBe('zh-CN')
    })
  })

  describe('convertCurrency', () => {
    it('should convert CNY to USD', () => {
      const usd = service.convertCurrency(72, 'CNY', 'USD')
      expect(usd).toBeCloseTo(10, 0)
    })

    it('should convert USD to CNY', () => {
      const cny = service.convertCurrency(10, 'USD', 'CNY')
      expect(cny).toBeCloseTo(72, 0)
    })

    it('should return same amount for same currency', () => {
      const amount = service.convertCurrency(100, 'USD', 'USD')
      expect(amount).toBe(100)
    })
  })

  describe('formatCurrencyForRegion', () => {
    it('should format CNY for China', () => {
      const formatted = service.formatCurrencyForRegion(100, 'CN')
      expect(formatted).toContain('¥')
    })

    it('should format USD for US', () => {
      const formatted = service.formatCurrencyForRegion(100, 'US')
      expect(formatted).toContain('$')
    })

    it('should format JPY for Japan', () => {
      const formatted = service.formatCurrencyForRegion(100, 'JP')
      expect(formatted).toContain('¥')
    })
  })

  describe('isGeoRestricted', () => {
    it('should return false for non-restricted content', () => {
      expect(service.isGeoRestricted('news')).toBe(false)
    })

    it('should return true for geo-restricted content', () => {
      expect(service.isGeoRestricted('streaming')).toBe(true)
    })
  })

  describe('getSupportedCountries', () => {
    it('should return supported countries', () => {
      const countries = service.getSupportedCountries()
      expect(countries).toContain('CN')
      expect(countries).toContain('US')
    })
  })

  describe('getTimezoneForRegion', () => {
    it('should return Asia/Shanghai for China', () => {
      const tz = service.getTimezoneForRegion('CN')
      expect(tz).toBe('Asia/Shanghai')
    })

    it('should return America/New_York for US', () => {
      const tz = service.getTimezoneForRegion('US')
      expect(tz).toBe('America/New_York')
    })
  })

  describe('formatDateForRegion', () => {
    it('should format date for China', () => {
      const date = new Date('2026-07-04')
      const formatted = service.formatDateForRegion(date, 'CN')
      expect(formatted).toContain('2026')
    })
  })
})
