import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  TranslationQueryDto,
  CreateTranslationDto,
  UpdateTranslationDto,
  BulkRegisterTranslationDto,
  ValidateTranslationsDto,
  ValidationReportDto,
  UpdateLocaleConfigDto,
  ExtractKeysDto,
  ExtractKeysResultDto,
} from './i18n.dto'

describe('i18n.dto: TranslationQueryDto', () => {
  it('default properties are undefined', () => {
    const dto = new TranslationQueryDto()
    assert.equal(dto.locale, undefined)
    assert.equal(dto.namespace, undefined)
    assert.equal(dto.keyword, undefined)
    assert.equal(dto.status, undefined)
    assert.equal(dto.page, undefined)
    assert.equal(dto.pageSize, undefined)
  })

  it('can set locale filter', () => {
    const dto = new TranslationQueryDto()
    dto.locale = 'en-US'
    assert.equal(dto.locale, 'en-US')
  })

  it('can set namespace filter', () => {
    const dto = new TranslationQueryDto()
    dto.namespace = 'order'
    assert.equal(dto.namespace, 'order')
  })

  it('can set keyword search', () => {
    const dto = new TranslationQueryDto()
    dto.keyword = 'status'
    assert.equal(dto.keyword, 'status')
  })

  it('can set pagination', () => {
    const dto = new TranslationQueryDto()
    dto.page = 2
    dto.pageSize = 50
    assert.equal(dto.page, 2)
    assert.equal(dto.pageSize, 50)
  })
})

describe('i18n.dto: CreateTranslationDto', () => {
  it('has required key property', () => {
    const dto = new CreateTranslationDto()
    dto.key = 'order.status.paid'
    dto.locale = 'zh-CN'
    dto.value = '已支付'
    assert.equal(dto.key, 'order.status.paid')
    assert.equal(dto.locale, 'zh-CN')
    assert.equal(dto.value, '已支付')
  })

  it('namespace and hasPlural are optional', () => {
    const dto = new CreateTranslationDto()
    dto.key = 'items.count'
    dto.locale = 'en-US'
    dto.value = 'items'
    assert.equal(dto.namespace, undefined)
    assert.equal(dto.hasPlural, undefined)
  })

  it('can set namespace to non-default', () => {
    const dto = new CreateTranslationDto()
    dto.key = 'payment.success'
    dto.locale = 'zh-CN'
    dto.value = '支付成功'
    dto.namespace = 'payment'
    dto.hasPlural = false
    assert.equal(dto.namespace, 'payment')
    assert.equal(dto.hasPlural, false)
  })
})

describe('i18n.dto: UpdateTranslationDto', () => {
  it('all properties are optional', () => {
    const dto = new UpdateTranslationDto()
    assert.equal(dto.value, undefined)
    assert.equal(dto.status, undefined)
    assert.equal(dto.enabled, undefined)
  })

  it('can set value for update', () => {
    const dto = new UpdateTranslationDto()
    dto.value = '已更新翻译'
    assert.equal(dto.value, '已更新翻译')
  })

  it('can set status', () => {
    const dto = new UpdateTranslationDto()
    dto.status = 'TRANSLATED'
    assert.equal(dto.status, 'TRANSLATED')
  })

  it('can disable a translation', () => {
    const dto = new UpdateTranslationDto()
    dto.enabled = false
    assert.equal(dto.enabled, false)
  })
})

describe('i18n.dto: BulkRegisterTranslationDto', () => {
  it('has required locale and translations', () => {
    const dto = new BulkRegisterTranslationDto()
    dto.locale = 'zh-CN'
    dto.translations = {
      'order.paid': '已支付',
      'order.cancelled': '已取消',
    }
    assert.equal(dto.locale, 'zh-CN')
    assert.equal(Object.keys(dto.translations).length, 2)
  })

  it('namespace is optional', () => {
    const dto = new BulkRegisterTranslationDto()
    dto.locale = 'en-US'
    dto.translations = { 'greeting': 'Hello' }
    assert.equal(dto.namespace, undefined)
    dto.namespace = 'general'
    assert.equal(dto.namespace, 'general')
  })

  it('handles empty translations map', () => {
    const dto = new BulkRegisterTranslationDto()
    dto.locale = 'ja-JP'
    dto.translations = {}
    assert.equal(Object.keys(dto.translations).length, 0)
  })
})

describe('i18n.dto: ValidateTranslationsDto', () => {
  it('referenceLocale defaults to undefined', () => {
    const dto = new ValidateTranslationsDto()
    assert.equal(dto.referenceLocale, undefined)
  })

  it('can set referenceLocale', () => {
    const dto = new ValidateTranslationsDto()
    dto.referenceLocale = 'en-US'
    assert.equal(dto.referenceLocale, 'en-US')
  })
})

describe('i18n.dto: ValidationReportDto', () => {
  it('can construct a validation report', () => {
    const report: ValidationReportDto = {
      referenceLocale: 'zh-CN',
      totalKeys: 10,
      completeness: {
        'zh-CN': { present: 10, missing: 0, missingKeys: [] },
        'en-US': { present: 8, missing: 2, missingKeys: ['order.paid', 'order.cancelled'] },
        'ja-JP': { present: 5, missing: 5, missingKeys: ['order.paid', 'order.cancelled', 'order.refund', 'order.shipped', 'greeting'] },
      },
      emptyValues: {
        'zh-CN': [],
        'en-US': [],
        'ja-JP': ['order.paid'],
      },
    }
    assert.equal(report.totalKeys, 10)
    assert.equal(report.completeness['en-US'].missing, 2)
    assert.equal(report.emptyValues['ja-JP'].length, 1)
  })
})

describe('i18n.dto: UpdateLocaleConfigDto', () => {
  it('all properties are optional', () => {
    const dto = new UpdateLocaleConfigDto()
    assert.equal(dto.displayName, undefined)
    assert.equal(dto.enabled, undefined)
    assert.equal(dto.sortOrder, undefined)
  })

  it('can update display name', () => {
    const dto = new UpdateLocaleConfigDto()
    dto.displayName = '简体中文 (中国)'
    assert.equal(dto.displayName, '简体中文 (中国)')
  })

  it('can disable locale', () => {
    const dto = new UpdateLocaleConfigDto()
    dto.enabled = false
    assert.equal(dto.enabled, false)
  })

  it('can change sort order', () => {
    const dto = new UpdateLocaleConfigDto()
    dto.sortOrder = 0
    assert.equal(dto.sortOrder, 0)
  })
})

describe('i18n.dto: ExtractKeysDto and ExtractKeysResultDto', () => {
  it('ExtractKeysDto has source property', () => {
    const dto = new ExtractKeysDto()
    dto.source = "t('hello.world')"
    assert.equal(dto.source, "t('hello.world')")
  })

  it('ExtractKeysResultDto returns keys and count', () => {
    const result: ExtractKeysResultDto = {
      keys: ['hello.world', 'greeting.morning'],
      totalCount: 2,
    }
    assert.equal(result.totalCount, 2)
    assert.equal(result.keys.length, 2)
  })

  it('ExtractKeysResultDto handles empty results', () => {
    const result: ExtractKeysResultDto = {
      keys: [],
      totalCount: 0,
    }
    assert.equal(result.totalCount, 0)
    assert.deepEqual(result.keys, [])
  })
})
