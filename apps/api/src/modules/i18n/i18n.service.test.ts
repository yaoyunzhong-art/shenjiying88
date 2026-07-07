import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * i18n.service.test.ts - Phase-20 T44
 * 覆盖: registerTranslations / registerBulk / t / tPlural / hasKey
 *       extractKeys / validateCompleteness / getRegisteredLocales
 * 正例 + 反例 + 边界
 */
import assert from 'node:assert/strict'
import { I18nService, SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from './i18n.service'

// ── Helpers ──
function freshService(): I18nService {
  return new I18nService()
}

// ── registerTranslations ──
describe('registerTranslations()', () => {
  it('registers a flat key-value map for a locale', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { 'hello': '你好', 'bye': '再见' })
    assert.equal(svc.t('hello', undefined, 'zh-CN'), '你好')
    assert.equal(svc.t('bye', undefined, 'zh-CN'), '再见')
  })

  it('merges with existing translations for the same locale', () => {
    const svc = freshService()
    svc.registerTranslations('en-US', { 'a': 'A' })
    svc.registerTranslations('en-US', { 'b': 'B' })
    assert.equal(svc.t('a', undefined, 'en-US'), 'A')
    assert.equal(svc.t('b', undefined, 'en-US'), 'B')
  })

  it('later registration overwrites same key', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { 'greeting': '你好' })
    svc.registerTranslations('zh-CN', { 'greeting': '您好' })
    assert.equal(svc.t('greeting'), '您好')
  })

  it('accepts nested translation map', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', {
      order: { status: { paid: '已支付', pending: '待支付' } },
    })
    assert.equal(svc.t('order.status.paid'), '已支付')
    assert.equal(svc.t('order.status.pending'), '待支付')
  })
})

// ── registerBulk ──
describe('registerBulk()', () => {
  it('registers translations for multiple locales at once', () => {
    const svc = freshService()
    svc.registerBulk({
      'zh-CN': { 'hello': '你好' },
      'en-US': { 'hello': 'Hello' },
      'ja-JP': { 'hello': 'こんにちは' },
    })
    assert.equal(svc.t('hello', undefined, 'zh-CN'), '你好')
    assert.equal(svc.t('hello', undefined, 'en-US'), 'Hello')
    assert.equal(svc.t('hello', undefined, 'ja-JP'), 'こんにちは')
  })

  it('handles partial locale registration', () => {
    const svc = freshService()
    svc.registerBulk({ 'zh-CN': { 'x': 'X' } } as any)
    assert.equal(svc.t('x'), 'X')
    // en-US not registered, zh-CN has key -> fallback from en-US to zh-CN
    assert.equal(svc.t('x', undefined, 'en-US'), 'X')
  })
})

// ── t() ──
describe('t()', () => {
  it('returns translated value for exact locale match', () => {
    const svc = freshService()
    svc.registerTranslations('en-US', { 'greeting': 'Hello' })
    assert.equal(svc.t('greeting', undefined, 'en-US'), 'Hello')
  })

  it('falls back to en-US when target locale missing', () => {
    const svc = freshService()
    svc.registerTranslations('en-US', { 'fallback': 'Fallback Value' })
    // ja-JP not registered → fallback to en-US
    assert.equal(svc.t('fallback', undefined, 'ja-JP'), 'Fallback Value')
  })

  it('falls back to zh-CN when target and en-US missing', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { 'key': '中文值' })
    // ja-JP and en-US not registered → fallback to zh-CN
    assert.equal(svc.t('key', undefined, 'ja-JP'), '中文值')
  })

  it('returns key itself when no translations found for any locale', () => {
    const svc = freshService()
    assert.equal(svc.t('nonexistent.key'), 'nonexistent.key')
  })

  it('interpolates string parameters', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { 'welcome': '欢迎 {name}' })
    assert.equal(svc.t('welcome', { name: '张三' }), '欢迎 张三')
  })

  it('interpolates number parameters', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { 'count': '共 {num} 条' })
    assert.equal(svc.t('count', { num: 42 }), '共 42 条')
  })

  it('leaves placeholder intact when param is missing', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { 'msg': 'Hello {name}' })
    assert.equal(svc.t('msg'), 'Hello {name}')
  })

  it('returns key for undefined value at nested path', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { top: {} })
    assert.equal(svc.t('top.missing'), 'top.missing')
  })

  it('uses DEFAULT_LOCALE when no locale argument', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { 'key': '默认值' })
    assert.equal(svc.t('key'), '默认值')
  })

  it('handles multiple params interpolation with multi-part key', () => {
    const svc = freshService()
    svc.registerTranslations('en-US', {
      order: { summary: 'Order {id}: {items} items, total {total}' },
    })
    const result = svc.t('order.summary', { id: '1001', items: 3, total: '99.99' }, 'en-US')
    assert.equal(result, 'Order 1001: 3 items, total 99.99')
  })

  it('resolves deeply nested key', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', {
      app: { settings: { theme: { label: '主题' } } },
    })
    assert.equal(svc.t('app.settings.theme.label'), '主题')
  })

  it('lookup stops at non-object intermediate and returns undefined', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { 'leaf': 'value' })
    assert.equal(svc.t('leaf.deeper'), 'leaf.deeper')
  })
})

// ── tPlural() ──
describe('tPlural()', () => {
  it('returns singular form for count=1 in en-US', () => {
    const svc = freshService()
    svc.registerTranslations('en-US', { 'items': '{count, plural, one {# item} other {# items}}' })
    // tPlural looks up the template via t()
    const result = svc.tPlural('items', 1, 'en-US')
    assert.equal(result, '1 item')
  })

  it('returns plural form for count!=1 in en-US', () => {
    const svc = freshService()
    svc.registerTranslations('en-US', { 'items': '{count, plural, one {# item} other {# items}}' })
    assert.equal(svc.tPlural('items', 0, 'en-US'), '0 items')
    assert.equal(svc.tPlural('items', 5, 'en-US'), '5 items')
  })

  it('uses other form for zh-CN (no singular/plural)', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { 'items': '{count, plural, other {# 个项目}}' })
    assert.equal(svc.tPlural('items', 1), '1 个项目')
    assert.equal(svc.tPlural('items', 10), '10 个项目')
  })

  it('returns template as-is if no plural syntax detected', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { 'plain': '普通文本' })
    assert.equal(svc.tPlural('plain', 5), '普通文本')
  })

  it('falls back to DEFAULT_LOCALE plural rule for unknown locale', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { 'items': '{count, plural, other {# 项}}' })
    // 'de-DE' is not a valid Locale type, so we test with ja-JP (also 'other' form)
    assert.equal(svc.tPlural('items', 3, 'ja-JP'), '3 项')
  })
})

// ── hasKey() ──
describe('hasKey()', () => {
  it('returns true when key exists in locale', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { 'exists': '存在' })
    assert.equal(svc.hasKey('exists', 'zh-CN'), true)
  })

  it('returns false when key does not exist in locale', () => {
    const svc = freshService()
    assert.equal(svc.hasKey('nope', 'zh-CN'), false)
  })

  it('returns false when locale not registered at all', () => {
    const svc = freshService()
    assert.equal(svc.hasKey('any', 'ja-JP'), false)
  })
})

// ── getRegisteredLocales() ──
describe('getRegisteredLocales()', () => {
  it('returns empty array when no translations registered', () => {
    const svc = freshService()
    assert.deepEqual(svc.getRegisteredLocales(), [])
  })

  it('returns registered locale keys', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { 'a': 'A' })
    svc.registerTranslations('en-US', { 'b': 'B' })
    const locales = svc.getRegisteredLocales()
    assert.ok(locales.includes('zh-CN'))
    assert.ok(locales.includes('en-US'))
    assert.equal(locales.length, 2)
  })
})

// ── extractKeys() ──
describe('extractKeys()', () => {
  it('returns sorted keys for a locale', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { 'b': 'B', 'a': 'A', 'c': 'C' })
    assert.deepEqual(svc.extractKeys('zh-CN'), ['a', 'b', 'c'])
  })

  it('returns nested keys with dot notation', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', {
      order: { status: '状态', amount: '金额' },
      member: { name: '姓名' },
    })
    const keys = svc.extractKeys('zh-CN')
    assert.ok(keys.includes('order.status'))
    assert.ok(keys.includes('order.amount'))
    assert.ok(keys.includes('member.name'))
    assert.equal(keys.length, 3)
  })

  it('returns empty array for unregistered locale', () => {
    const svc = freshService()
    assert.deepEqual(svc.extractKeys('ja-JP'), [])
  })
})

// ── validateCompleteness() ──
describe('validateCompleteness()', () => {
  it('returns empty missing lists when all locales have same keys', () => {
    const svc = freshService()
    svc.registerBulk({
      'zh-CN': { 'a': 'A', 'b': 'B' },
      'en-US': { 'a': 'A', 'b': 'B' },
      'ja-JP': { 'a': 'A', 'b': 'B' },
    })
    const result = svc.validateCompleteness('zh-CN')
    assert.equal(result['zh-CN'].length, 0)
    assert.equal(result['en-US'].length, 0)
    assert.equal(result['ja-JP'].length, 0)
  })

  it('detects missing keys in other locales', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { 'a': 'A', 'b': 'B', 'c': 'C' })
    svc.registerTranslations('en-US', { 'a': 'A' })
    svc.registerTranslations('ja-JP', { 'b': 'B' })

    const result = svc.validateCompleteness('zh-CN')
    assert.deepEqual(result['zh-CN'], [])
    assert.ok(result['en-US'].includes('b'))
    assert.ok(result['en-US'].includes('c'))
    assert.ok(result['ja-JP'].includes('a'))
    assert.ok(result['ja-JP'].includes('c'))
  })

  it('uses zh-CN as default reference locale', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { 'key': '值' })
    const result = svc.validateCompleteness()
    assert.ok(result['en-US'].includes('key'))
  })

  it('handles locale with no translations gracefully', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { 'k': 'V' })
    // ja-JP has no translations
    const result = svc.validateCompleteness('zh-CN')
    assert.ok(result['ja-JP'].includes('k'))
    assert.equal(result['zh-CN'].length, 0)
  })
})

// ── Edge cases ──
describe('Edge cases', () => {
  it('t with empty string key returns key itself', () => {
    const svc = freshService()
    assert.equal(svc.t(''), '')
  })

  it('t with null params does not crash', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { 'msg': 'hello' })
    assert.equal(svc.t('msg', null as any), 'hello')
  })

  it('registerTranslations with empty map does not throw', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', {})
    assert.deepEqual(svc.extractKeys('zh-CN'), [])
  })

  it('overwrites entire nested subtree on re-registration', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { order: { status: 'old' } })
    svc.registerTranslations('zh-CN', { order: { status: 'new' } })
    assert.equal(svc.t('order.status'), 'new')
  })

  it('validateCompleteness does not throw when no translations exist', () => {
    const svc = freshService()
    const result = svc.validateCompleteness()
    assert.equal(result['zh-CN'].length, 0)
    assert.equal(result['en-US'].length, 0)
    assert.equal(result['ja-JP'].length, 0)
  })

  it('tPlural with invalid template format returns original template', () => {
    const svc = freshService()
    svc.registerTranslations('zh-CN', { 'invalid': '{count, unknown, one {x}}' })
    // parsePluralTemplate returns null for unmatched patterns
    assert.equal(svc.tPlural('invalid', 1), '{count, unknown, one {x}}')
  })
})
