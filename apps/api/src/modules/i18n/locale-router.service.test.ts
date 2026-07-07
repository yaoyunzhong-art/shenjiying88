import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { LocaleRouterService } from './locale-router.service'

describe('LocaleRouterService', () => {
  let service: LocaleRouterService

  beforeEach(() => {
    // 需要模拟 I18nService
    const mockI18n = {
      getSupportedLocales: () => ['zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'ko-KR', 'th-TH', 'vi-VN', 'id-ID', 'ms-MY'],
      getDefaultLocale: () => 'zh-CN' as const,
    } as any
    service = new LocaleRouterService(mockI18n)
  })

  describe('extractFromUrl', () => {
    it('should extract locale from URL prefix', () => {
      const locale = service.extractFromUrl('/en-US/api/users')
      expect(locale).toBe('en-US')
    })

    it('should return null for URL without locale prefix', () => {
      const locale = service.extractFromUrl('/api/users')
      expect(locale).toBeNull()
    })
  })

  describe('parseAcceptLanguage', () => {
    it('should parse accept-language header with q values', () => {
      const locale = service.parseAcceptLanguage('zh-CN,en-US;q=0.9')
      expect(locale).toBe('zh-CN')
    })

    it('should return null for empty header', () => {
      const locale = service.parseAcceptLanguage(undefined)
      expect(locale).toBeNull()
    })

    it('should handle language fallback', () => {
      const locale = service.parseAcceptLanguage('en')
      expect(locale).toBe('en-US')
    })
  })

  describe('resolve', () => {
    it('should prioritize URL prefix over other sources', () => {
      const result = service.resolve('/en-US/api/users', {})
      expect(result.locale).toBe('en-US')
      expect(result.source).toBe('url')
    })

    it('should use X-Locale header when URL has no prefix', () => {
      const result = service.resolve('/api/users', { 'x-locale': 'ja-JP' })
      expect(result.locale).toBe('ja-JP')
      expect(result.source).toBe('header-x-locale')
    })

    it('should use default locale when no other source matches', () => {
      const result = service.resolve('/api/users', {})
      expect(result.source).toBe('default')
    })
  })

  describe('buildUrl', () => {
    it('should build URL with locale prefix', () => {
      const url = service.buildUrl('/api/users', 'en-US')
      expect(url).toBe('/en-US/api/users')
    })

    it('should handle path without leading slash', () => {
      const url = service.buildUrl('api/users', 'ja-JP')
      expect(url).toBe('/ja-JP/api/users')
    })
  })

  describe('listSupportedPrefixes', () => {
    it('should list all supported URL prefixes', () => {
      const prefixes = service.listSupportedPrefixes()
      expect(prefixes.length).toBeGreaterThan(0)
      expect(prefixes.some(p => p.locale === 'zh-CN')).toBe(true)
    })
  })
})
