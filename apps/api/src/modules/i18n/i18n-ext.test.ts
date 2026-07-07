import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { I18nExtService, type Locale } from './i18n-ext.service'

const LOCALES: Locale[] = ['zh-CN', 'zh-TW', 'en-US', 'ja-JP' as any, 'ko-KR', 'th-TH', 'vi-VN', 'id-ID', 'ms-MY']

describe('I18nExtService', () => {
  let service: I18nExtService

  beforeEach(() => {
    service = new I18nExtService()
  })

  // ── 9种语言基础翻译查找 ────────────────────────────────────────────────
  describe('9种语言基础翻译查找', () => {
    for (const locale of LOCALES) {
      it(`能查找 common.ok (${locale})`, () => {
        const val = service.t('common.ok', locale)
        expect(typeof val).toBe('string')
        expect(val.length).toBeGreaterThan(0)
      })

      it(`zh-CN → ${locale} 翻译 key 不为 undefined`, () => {
        const val = service.t('common.ok', locale)
        expect(val).not.toBeUndefined()
      })
    }

    it('order.created 各语言翻译不同', () => {
      const translations = LOCALES.map((l) => service.t('order.created', l))
      const unique = new Set(translations)
      expect(unique.size).toBeGreaterThan(1)
    })
  })

  // ── 参数替换 ────────────────────────────────────────────────────────────
  describe('参数替换', () => {
    beforeEach(() => {
      service.set('greeting', 'en-US', 'Hello {name}, you have {count} messages')
      service.set('greeting', 'zh-CN', '你好 {name}，你有 {count} 条消息')
    })

    it('英文参数替换', () => {
      const result = service.t('greeting', 'en-US', { name: 'Alice', count: 5 })
      expect(result).toBe('Hello Alice, you have 5 messages')
    })

    it('中文参数替换', () => {
      const result = service.t('greeting', 'zh-CN', { name: '张三', count: 3 })
      expect(result).toBe('你好 张三，你有 3 条消息')
    })

    it('缺失参数保留原样', () => {
      const result = service.t('greeting', 'en-US', { name: 'Bob' })
      expect(result).toContain('{count}')
    })
  })

  // ── Fallback 链 ──────────────────────────────────────────────────────────
  describe('Fallback 链', () => {
    it('未知语言 → 回退到 defaultLocale (en-US)', () => {
      const unknown = service.t('common.ok', 'xx-XX' as Locale, {})
      expect(unknown).toBe('OK') // en-US fallback
    })

    it('未知 key → 回退链尽头返回 key 本身', () => {
      const result = service.t('nonexistent.key', 'en-US')
      expect(result).toBe('nonexistent.key')
    })
  })

  // ── Accept-Language 解析 ────────────────────────────────────────────────
  describe('parseAcceptLanguage', () => {
    it('解析单语言', () => {
      const result = service.parseAcceptLanguage('zh-CN')
      expect(result).toContain('zh-CN')
    })

    it('解析多语言 + q值', () => {
      const result = service.parseAcceptLanguage('zh-CN,en-US;q=0.9,ja-JP;q=0.8')
      expect(result).toContain('zh-CN')
      expect(result).toContain('en-US')
      expect(result).toContain('ja-JP' as any)
    })

    it('解析 9种语言 Accept-Language', () => {
      const header = 'zh-CN,zh-TW,en-US,ja-JP,ko-KR,th-TH,vi-VN,id-ID,ms-MY'
      const result = service.parseAcceptLanguage(header)
      expect(result.length).toBeGreaterThanOrEqual(9)
    })

    it('空 header 返回空数组', () => {
      expect(service.parseAcceptLanguage('')).toEqual([])
    })
  })

  // ── bestMatch 最优语言匹配 ──────────────────────────────────────────────
  describe('bestMatch', () => {
    it('精确匹配', () => {
      const result = service.bestMatch(['zh-CN', 'en-US'])
      expect(result).toBe('zh-CN')
    })

    it('部分语言匹配（zh-CN 有，en-US 无）', () => {
      const result = service.bestMatch(['zh-CN', 'fr-FR' as any])
      expect(result).toBe('zh-CN')
    })

    it('无可用语言返回 default', () => {
      const result = service.bestMatch(['fr-FR' as any as any, 'de-DE' as any as any])
      expect(result).toBe('en-US')
    })

    it('语言+地区匹配（en-US 有 en）', () => {
      const result = service.bestMatch(['en-GB' as any as any])
      expect(result).toBe('en-US')
    })
  })

  // ── set 动态添加翻译 ────────────────────────────────────────────────────
  describe('set 动态添加', () => {
    it('添加新 key 并立即可查', () => {
      service.set('test.key', 'en-US', 'Test Value')
      expect(service.t('test.key', 'en-US')).toBe('Test Value')
    })

    it('覆盖已有 key', () => {
      service.set('common.ok', 'en-US', 'Got it!')
      expect(service.t('common.ok', 'en-US')).toBe('Got it!')
    })

    it('新语言 set 后可查', () => {
      service.set('custom', 'fr-FR' as any as Locale, 'Personnalisé')
      expect(service.t('custom', 'fr-FR' as any as Locale)).toBe('Personnalisé')
    })
  })

  // ── getAll 返回完整翻译集 ───────────────────────────────────────────────
  describe('getAll', () => {
    it('en-US 返回非空 map', () => {
      const all = service.getAll('en-US')
      expect(Object.keys(all).length).toBeGreaterThan(10)
    })

    it('zh-CN 包含 order.* keys', () => {
      const all = service.getAll('zh-CN')
      expect(all['order.created']).toBeDefined()
    })

    it('返回副本而非原始引用', () => {
      const all = service.getAll('en-US')
      all['common.ok'] = 'MODIFIED'
      expect(service.t('common.ok', 'en-US')).toBe('OK') // 原始不受影响
    })
  })

  // ── has 翻译是否存在 ────────────────────────────────────────────────────
  describe('has', () => {
    it('已有 key 返回 true', () => {
      expect(service.has('common.ok', 'en-US')).toBe(true)
    })

    it('不存在的 key 返回 false', () => {
      expect(service.has('nonexistent.key', 'en-US')).toBe(false)
    })

    it('未知语言返回 false', () => {
      expect(service.has('common.ok', 'xx-XX' as Locale)).toBe(false)
    })
  })

  // ── 不存在的 key 返回 key 本身 ─────────────────────────────────────────
  describe('不存在的 key 兜底', () => {
    it('未知 key 返回 key 本身', () => {
      expect(service.t('unknown.translation.key', 'en-US')).toBe('unknown.translation.key')
    })
  })

  // ── configure 配置 ──────────────────────────────────────────────────────
  describe('configure', () => {
    it('设置 defaultLocale', () => {
      service.configure({ defaultLocale: 'ja-JP' as any })
      expect(service.t('common.ok')).toBe('OK') // ja-JP fallback to en-US
    })

    it('设置 fallbackLocale', () => {
      service.configure({ fallbackLocale: 'zh-CN' })
      service.set('new.key', 'zh-CN', '中文')
      expect(service.t('new.key', 'ja-JP' as any as Locale)).toBe('中文')
    })
  })

  // ── tBulk 批量翻译 ─────────────────────────────────────────────────────
  describe('tBulk', () => {
    it('批量查询多个 key', () => {
      const result = service.tBulk(['common.ok', 'common.cancel', 'common.confirm'], 'en-US')
      expect(result['common.ok']).toBe('OK')
      expect(result['common.cancel']).toBe('Cancel')
      expect(result['common.confirm']).toBe('Confirm')
    })

    it('批量返回 record', () => {
      const result = service.tBulk(['common.ok'], 'zh-CN')
      expect(typeof result).toBe('object')
      expect(Array.isArray(result)).toBe(false)
    })
  })
})
