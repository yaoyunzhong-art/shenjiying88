import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  TranslationEntryStatus,
  DEFAULT_LOCALE_CONFIGS,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  type Locale,
  type TranslationEntry,
  type TranslationNamespace,
  type LocaleConfig,
} from './i18n.entity'

describe('i18n.entity: Locale type', () => {
  it('SUPPORTED_LOCALES contains zh-CN, en-US, ja-JP', () => {
    assert.deepEqual(SUPPORTED_LOCALES, ['zh-CN', 'en-US', 'ja-JP'])
  })

  it('DEFAULT_LOCALE is zh-CN', () => {
    assert.equal(DEFAULT_LOCALE, 'zh-CN')
  })

  it('locale type accepts valid values', () => {
    const zh: Locale = 'zh-CN'
    const en: Locale = 'en-US'
    const ja: Locale = 'ja-JP'
    assert.equal(zh, 'zh-CN')
    assert.equal(en, 'en-US')
    assert.equal(ja, 'ja-JP')
  })
})

describe('i18n.entity: TranslationEntryStatus enum', () => {
  it('has three statuses', () => {
    assert.equal(TranslationEntryStatus.Translated, 'TRANSLATED')
    assert.equal(TranslationEntryStatus.Pending, 'PENDING')
    assert.equal(TranslationEntryStatus.Empty, 'EMPTY')
  })

  it('all enum values are valid', () => {
    const values = Object.values(TranslationEntryStatus)
    assert.equal(values.length, 3)
    assert.ok(values.includes(TranslationEntryStatus.Translated))
    assert.ok(values.includes(TranslationEntryStatus.Pending))
    assert.ok(values.includes(TranslationEntryStatus.Empty))
  })
})

describe('i18n.entity: DEFAULT_LOCALE_CONFIGS', () => {
  it('has three locale configs', () => {
    assert.equal(DEFAULT_LOCALE_CONFIGS.length, 3)
  })

  it('zh-CN config is first', () => {
    const zh = DEFAULT_LOCALE_CONFIGS[0]
    assert.equal(zh.locale, 'zh-CN')
    assert.equal(zh.displayName, '简体中文')
    assert.equal(zh.enabled, true)
    assert.equal(zh.rtl, false)
  })

  it('en-US config is second', () => {
    const en = DEFAULT_LOCALE_CONFIGS[1]
    assert.equal(en.locale, 'en-US')
    assert.equal(en.displayName, 'English (US)')
    assert.equal(en.enabled, true)
    assert.equal(en.sortOrder, 2)
  })

  it('ja-JP config is third', () => {
    const ja = DEFAULT_LOCALE_CONFIGS[2]
    assert.equal(ja.locale, 'ja-JP')
    assert.equal(ja.sortOrder, 3)
  })

  it('no locale config has rtl enabled', () => {
    for (const config of DEFAULT_LOCALE_CONFIGS) {
      assert.equal(config.rtl, false, `${config.locale} should not be rtl`)
    }
  })
})

describe('i18n.entity: TranslationEntry interface', () => {
  it('can construct a valid TranslationEntry', () => {
    const entry: TranslationEntry = {
      id: 'trans-001',
      key: 'order.status.paid',
      locale: 'zh-CN',
      value: '已支付',
      status: TranslationEntryStatus.Translated,
      namespace: 'order',
      hasPlural: false,
      enabled: true,
      createdAt: '2026-06-26T00:00:00Z',
      updatedAt: '2026-06-26T00:00:00Z',
      tenantContext: {
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-001',
        marketCode: 'cn-mainland',
      },
    }
    assert.equal(entry.key, 'order.status.paid')
    assert.equal(entry.value, '已支付')
    assert.equal(entry.enabled, true)
    assert.equal(entry.tenantContext.tenantId, 'tenant-001')
  })

  it('supports plural translations', () => {
    const entry: TranslationEntry = {
      id: 'trans-002',
      key: 'items.count',
      locale: 'en-US',
      value: '{count, plural, one {# item} other {# items}}',
      status: TranslationEntryStatus.Translated,
      namespace: 'cart',
      hasPlural: true,
      enabled: true,
      createdAt: '2026-06-26T00:00:00Z',
      updatedAt: '2026-06-26T00:00:00Z',
      tenantContext: {
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-001',
        marketCode: 'cn-mainland',
      },
    }
    assert.equal(entry.hasPlural, true)
    assert.ok(entry.value.includes('plural'))
  })
})

describe('i18n.entity: TranslationNamespace interface', () => {
  it('can construct a core TranslationNamespace', () => {
    const ns: TranslationNamespace = {
      id: 'ns-001',
      name: 'order',
      description: '订单模块翻译',
      moduleType: 'core',
      totalKeys: 50,
      translatedCount: 45,
      enabled: true,
      createdAt: '2026-06-26T00:00:00Z',
    }
    assert.equal(ns.name, 'order')
    assert.equal(ns.moduleType, 'core')
    assert.equal(ns.totalKeys, 50)
    assert.equal(ns.translatedCount, 45)
  })

  it('can construct a feature TranslationNamespace without description', () => {
    const ns: TranslationNamespace = {
      id: 'ns-002',
      name: 'promotion',
      moduleType: 'feature',
      totalKeys: 20,
      translatedCount: 10,
      enabled: false,
      createdAt: '2026-06-26T00:00:00Z',
    }
    assert.equal(ns.moduleType, 'feature')
    assert.equal(ns.enabled, false)
    assert.equal(ns.description, undefined)
  })
})

describe('i18n.entity: LocaleConfig interface', () => {
  it('can construct a LocaleConfig', () => {
    const config: LocaleConfig = {
      locale: 'zh-CN',
      displayName: '简体中文',
      nativeName: '简体中文',
      enabled: true,
      sortOrder: 1,
      rtl: false,
    }
    assert.equal(config.locale, 'zh-CN')
    assert.equal(config.sortOrder, 1)
    assert.equal(config.rtl, false)
  })
})
