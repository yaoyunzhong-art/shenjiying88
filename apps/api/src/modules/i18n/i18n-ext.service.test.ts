import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { I18nExtService, Locale } from './i18n-ext.service'

describe('I18nExtService', () => {
  let service: I18nExtService

  beforeEach(() => {
    service = new I18nExtService()
  })

  describe('t', () => {
    it('should translate key for zh-CN locale', () => {
      const result = service.t('common.ok', 'zh-CN')
      expect(result).toBe('确定')
    })

    it('should translate key for en-US locale', () => {
      const result = service.t('common.ok', 'en-US')
      expect(result).toBe('OK')
    })

    it('should translate key for ja-JP locale', () => {
      const result = service.t('common.ok', 'ja-JP')
      expect(result).toBe('OK')
    })

    it('should return key if translation not found', () => {
      const result = service.t('nonexistent.key', 'en-US')
      expect(result).toBe('nonexistent.key')
    })
  })

  describe('tBulk', () => {
    it('should translate multiple keys', () => {
      const result = service.tBulk(['common.ok', 'common.cancel'], 'zh-CN')
      expect(result['common.ok']).toBe('确定')
      expect(result['common.cancel']).toBe('取消')
    })
  })

  describe('has', () => {
    it('should return true for existing key', () => {
      expect(service.has('common.ok', 'zh-CN')).toBe(true)
    })

    it('should return false for non-existing key', () => {
      expect(service.has('nonexistent.key', 'zh-CN')).toBe(false)
    })
  })

  describe('getAll', () => {
    it('should return all translations for a locale', () => {
      const translations = service.getAll('zh-CN')
      expect(translations['common.ok']).toBe('确定')
    })
  })

  describe('set', () => {
    it('should set a new translation', () => {
      service.set('custom.key', 'zh-CN', '自定义值')
      expect(service.t('custom.key', 'zh-CN')).toBe('自定义值')
    })
  })

  describe('parseAcceptLanguage', () => {
    it('should parse accept-language header', () => {
      const locales = service.parseAcceptLanguage('zh-CN,en-US;q=0.9,ja-JP;q=0.8')
      expect(locales).toContain('zh-CN')
      expect(locales).toContain('en-US')
    })

    it('should return empty array for empty header', () => {
      const locales = service.parseAcceptLanguage('')
      expect(locales).toEqual([])
    })
  })

  describe('bestMatch', () => {
    it('should return best matching locale', () => {
      const result = service.bestMatch(['zh-CN', 'en-US'], ['zh-CN', 'en-US', 'ja-JP'])
      expect(result).toBe('zh-CN')
    })

    it('should fallback to default locale', () => {
      const result = service.bestMatch(['unsupported' as any], ['en-US', 'ja-JP'])
      expect(result).toBe('en-US')
    })
  })
})
