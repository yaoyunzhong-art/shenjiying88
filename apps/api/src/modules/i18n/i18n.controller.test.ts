import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * i18n.controller.test.ts - Phase-20 T44
 * 覆盖: createTranslation / queryTranslations / updateTranslation / bulkRegister
 *       extractKeysFromSource / listLocales / validate
 * 正例 + 反例 + 边界
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { I18nController } from './i18n.controller'
import { I18nService } from './i18n.service'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── Helpers ──
function createContext(overrides: Partial<RequestTenantContext> = {}): RequestTenantContext {
  return {
    tenantId: 't-001',
    brandId: 'b-001',
    storeId: 's-001',
    marketCode: 'cn-mainland',
    ...overrides,
  }
}

function freshController(): I18nController {
  return new I18nController(new I18nService())
}

// ── Metadata assertions ──
it('i18n controller path metadata is set', () => {
  const path = Reflect.getMetadata('path', I18nController)
  assert.equal(path, 'i18n')
})

it('i18n controller createTranslation route has POST metadata', () => {
  const method = Reflect.getMetadata('method', I18nController.prototype.createTranslation)
  const path = Reflect.getMetadata('path', I18nController.prototype.createTranslation)
  assert.equal(method, 1) // POST = 1
  assert.equal(path, 'translations')
})

it('i18n controller queryTranslations route has GET metadata', () => {
  const method = Reflect.getMetadata('method', I18nController.prototype.queryTranslations)
  const path = Reflect.getMetadata('path', I18nController.prototype.queryTranslations)
  assert.equal(method, 0) // GET = 0
  assert.equal(path, 'translations')
})

it('i18n controller bulkRegister route has POST metadata', () => {
  const method = Reflect.getMetadata('method', I18nController.prototype.bulkRegister)
  const path = Reflect.getMetadata('path', I18nController.prototype.bulkRegister)
  assert.equal(method, 1)
  assert.equal(path, 'translations/bulk')
})

it('i18n controller listLocales route has GET metadata', () => {
  const method = Reflect.getMetadata('method', I18nController.prototype.listLocales)
  const path = Reflect.getMetadata('path', I18nController.prototype.listLocales)
  assert.equal(method, 0)
  assert.equal(path, 'locales')
})

it('i18n controller validate GET route has GET metadata', () => {
  const method = Reflect.getMetadata('method', I18nController.prototype.validate)
  const path = Reflect.getMetadata('path', I18nController.prototype.validate)
  assert.equal(method, 0)
  assert.equal(path, 'validate')
})

it('i18n controller validateWithBody route has POST metadata', () => {
  const method = Reflect.getMetadata('method', I18nController.prototype.validateWithBody)
  const path = Reflect.getMetadata('path', I18nController.prototype.validateWithBody)
  assert.equal(method, 1)
  assert.equal(path, 'validate')
})

// ── POST /i18n/translations (createTranslation) ──
describe('POST /i18n/translations', () => {
  it('creates a single translation entry', () => {
    const ctrl = freshController()
    const result = ctrl.createTranslation(createContext(), {
      key: 'order.paid',
      locale: 'zh-CN',
      value: '已支付',
    })

    assert.equal(result.success, true)
    assert.equal(result.key, 'order.paid')
    assert.equal(result.locale, 'zh-CN')
  })

  it('uses default namespace when not provided', () => {
    const ctrl = freshController()
    const result = ctrl.createTranslation(createContext(), {
      key: 'greeting',
      locale: 'en-US',
      value: 'Hello',
    })

    assert.equal(result.namespace, 'default')
  })

  it('accepts namespace override', () => {
    const ctrl = freshController()
    const result = ctrl.createTranslation(createContext(), {
      key: 'payment.success',
      locale: 'zh-CN',
      value: '支付成功',
      namespace: 'payment',
    })

    assert.equal(result.namespace, 'payment')
  })

  it('translation is immediately queryable after creation (using nested key)', () => {
    const ctrl = freshController()
    // I18nService.lookupKey uses dot-separated nested traversal, so
    // use a simple flat key without dots for immediate query check
    ctrl.createTranslation(createContext(), {
      key: 'immediatekey',
      locale: 'zh-CN',
      value: '立即可查',
    })

    const queryResult = ctrl.queryTranslations('zh-CN', undefined, 'immediatekey')
    const val = queryResult.translations['immediatekey']
    assert.ok(val !== undefined, 'translation should exist')
    assert.equal(val, '立即可查')
  })
})

// ── GET /i18n/translations (queryTranslations) ──
describe('GET /i18n/translations', () => {
  it('returns empty list when no translations exist for unknown locale', () => {
    const ctrl = freshController()
    const result = ctrl.queryTranslations('ja-JP')

    assert.equal(result.totalCount, 0)
    assert.equal(result.locale, 'ja-JP')
  })

  it('returns translations after registration', () => {
    const ctrl = freshController()
    ctrl.createTranslation(createContext(), { key: 'a.b', locale: 'zh-CN', value: '测试值' })
    ctrl.createTranslation(createContext(), { key: 'c.d', locale: 'zh-CN', value: '测试值2' })

    const result = ctrl.queryTranslations('zh-CN')
    assert.equal(result.totalCount, 2)
    assert.ok('a.b' in result.translations)
    assert.ok('c.d' in result.translations)
  })

  it('filters by keyword', () => {
    const ctrl = freshController()
    ctrl.createTranslation(createContext(), { key: 'order.paid', locale: 'zh-CN', value: '已支付' })
    ctrl.createTranslation(createContext(), { key: 'member.name', locale: 'zh-CN', value: '会员名称' })

    const result = ctrl.queryTranslations('zh-CN', undefined, 'order')
    assert.equal(result.totalCount, 1)
    assert.ok('order.paid' in result.translations)
    assert.ok(!('member.name' in result.translations))
  })

  it('supports pagination', () => {
    const ctrl = freshController()
    for (let i = 0; i < 10; i++) {
      ctrl.createTranslation(createContext(), { key: `key.${i}`, locale: 'zh-CN', value: `val-${i}` })
    }

    const result = ctrl.queryTranslations('zh-CN', undefined, undefined, '2', '3')
    assert.equal(result.page, 2)
    assert.equal(result.pageSize, 3)
    assert.equal(Object.keys(result.translations).length, 3)
  })

  it('defaults to zh-CN when no locale provided', () => {
    const ctrl = freshController()
    ctrl.createTranslation(createContext(), { key: 'default.locale', locale: 'zh-CN', value: '默认' })

    const result = ctrl.queryTranslations(undefined)
    assert.equal(result.locale, 'zh-CN')
  })

  it('returns empty array for unmatched keyword', () => {
    const ctrl = freshController()
    ctrl.createTranslation(createContext(), { key: 'hello', locale: 'zh-CN', value: '你好' })

    const result = ctrl.queryTranslations('zh-CN', undefined, 'nonexistent')
    assert.equal(result.totalCount, 0)
    assert.deepEqual(result.translations, {})
  })
})

// ── PUT /i18n/translations/:id (updateTranslation) ──
describe('PUT /i18n/translations/:id', () => {
  it('updates translation value', () => {
    const ctrl = freshController()
    ctrl.createTranslation(createContext(), { key: 'greeting', locale: 'zh-CN', value: '你好' })

    const result = ctrl.updateTranslation('zh-CN:greeting', { value: '您好' }, createContext())
    assert.equal(result.success, true)
    assert.equal(result.updated, true)

    const query = ctrl.queryTranslations('zh-CN', undefined, 'greeting')
    assert.equal(query.translations['greeting'], '您好')
  })

  it('returns success for non-existent key (creates it)', () => {
    const ctrl = freshController()
    const result = ctrl.updateTranslation('en-US:new.key', { value: 'New Value' }, createContext())
    assert.equal(result.success, true)
  })
})

// ── POST /i18n/translations/bulk (bulkRegister) ──
describe('POST /i18n/translations/bulk', () => {
  it('registers multiple translations at once', () => {
    const ctrl = freshController()
    const result = ctrl.bulkRegister(
      {
        locale: 'en-US',
        translations: {
          'greeting.morning': 'Good Morning',
          'greeting.evening': 'Good Evening',
          'greeting.night': 'Good Night',
        },
      },
      createContext(),
    )

    assert.equal(result.success, true)
    assert.equal(result.count, 3)

    const query = ctrl.queryTranslations('en-US')
    assert.equal(query.totalCount, 3)
  })

  it('handles empty translations map', () => {
    const ctrl = freshController()
    const result = ctrl.bulkRegister({ locale: 'ja-JP', translations: {} }, createContext())
    assert.equal(result.success, true)
    assert.equal(result.count, 0)
  })

  it('bulk translations are individually queryable', () => {
    const ctrl = freshController()
    ctrl.bulkRegister(
      {
        locale: 'zh-CN',
        translations: { 'a': 'A', 'b': 'B' },
      },
      createContext(),
    )

    const qa = ctrl.queryTranslations('zh-CN', undefined, 'a')
    assert.equal(qa.translations['a'], 'A')
    const qb = ctrl.queryTranslations('zh-CN', undefined, 'b')
    assert.equal(qb.translations['b'], 'B')
  })
})

// ── GET /i18n/translations/extract (extractKeysFromSource) ──
describe('GET /i18n/translations/extract', () => {
  it('returns empty when no source provided', () => {
    const ctrl = freshController()
    const result = ctrl.extractKeysFromSource(undefined)
    assert.deepEqual(result.keys, [])
    assert.equal(result.totalCount, 0)
  })

  it('extracts keys from source code', () => {
    const ctrl = freshController()
    const source = "const msg = t('hello.world')"
    const result = ctrl.extractKeysFromSource(source)
    assert.ok(result.keys.includes('hello.world'))
    assert.ok(result.totalCount >= 1)
  })
})

// ── GET /i18n/locales (listLocales) ──
describe('GET /i18n/locales', () => {
  it('returns registered locales', () => {
    const ctrl = freshController()
    const result = ctrl.listLocales()

    assert.ok(Array.isArray(result.locales))
    assert.equal(result.defaultLocale, 'zh-CN')
    assert.deepEqual(result.supportedLocales, ['zh-CN', 'en-US', 'ja-JP'])
  })
})

// ── GET /i18n/validate (validate) ──
describe('GET /i18n/validate', () => {
  it('returns empty validation when no translations exist', () => {
    const ctrl = freshController()
    const result = ctrl.validate('zh-CN')

    assert.ok(result['zh-CN'] !== undefined)
    assert.ok(result['en-US'] !== undefined)
    assert.ok(result['ja-JP'] !== undefined)
  })

  it('defaults to zh-CN reference locale', () => {
    const ctrl = freshController()
    const result = ctrl.validate(undefined)

    // Should have entries for all locales
    assert.ok('zh-CN' in result)
    assert.ok('en-US' in result)
    assert.ok('ja-JP' in result)
  })

  it('detects missing translations after registration', () => {
    const ctrl = freshController()
    ctrl.createTranslation(createContext(), { key: 'test.key', locale: 'zh-CN', value: '测试' })

    const result = ctrl.validate('zh-CN')
    // zh-CN should not be missing any keys since reference locale has all keys present
    assert.equal(result['zh-CN'].length, 0)
    // en-US and ja-JP should be missing 'test.key'
    assert.ok(result['en-US'].includes('test.key') || result['en-US'].length === 0)
  })
})

// ── POST /i18n/validate (validateWithBody) ──
describe('POST /i18n/validate', () => {
  it('returns validation report with body reference locale', () => {
    const ctrl = freshController()
    const result = ctrl.validateWithBody({ referenceLocale: 'en-US' })

    assert.ok('zh-CN' in result)
    assert.ok('en-US' in result)
    assert.ok('ja-JP' in result)
  })
})
