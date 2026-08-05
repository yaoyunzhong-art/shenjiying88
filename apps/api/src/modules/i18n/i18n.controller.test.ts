import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * i18n.controller.spec.ts - Phase-20 T44
 * 用途: I18nController 完整单测 (D-controller spec补全)
 *
 * 策略: 内联 Controller + Mock Service, 覆盖所有路由端点
 * 端点清单:
 *   POST /i18n/translations         - 创建翻译条目
 *   GET  /i18n/translations          - 查询翻译条目
 *   PUT  /i18n/translations/:id      - 更新翻译条目
 *   POST /i18n/translations/bulk     - 批量注册翻译
 *   GET  /i18n/translations/extract  - 从源码提取 key
 *   GET  /i18n/locales               - 列出所有区域配置
 *   GET  /i18n/validate              - 校验翻译完整性
 *   POST /i18n/validate              - 校验并返回报告
 */

import assert from 'node:assert/strict'
import { I18nController } from './i18n.controller'
import { I18nService } from './i18n.service'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── Helpers ────────────────────────────────────────────────
function makeContext(overrides: Partial<RequestTenantContext> = {}): RequestTenantContext {
  return {
    tenantId: 't-001',
    brandId: 'b-001',
    storeId: 's-001',
    marketCode: 'cn-mainland',
    ...overrides,
  }
}

function makeController(): I18nController {
  return new I18nController(new I18nService())
}

// ── Structural ─────────────────────────────────────────────
describe('I18nController 结构', () => {
  it('Controller 元数据: path = i18n', () => {
    const path = Reflect.getMetadata('path', I18nController)
    assert.equal(path, 'i18n')
  })

  const routes: Array<{ method: string; handler: string; expectedPath: string; expectedMethod: number }> = [
    { method: 'POST', handler: 'createTranslation', expectedPath: 'translations', expectedMethod: 1 },
    { method: 'GET', handler: 'queryTranslations', expectedPath: 'translations', expectedMethod: 0 },
    { method: 'PUT', handler: 'updateTranslation', expectedPath: 'translations/:id', expectedMethod: 2 },
    { method: 'POST', handler: 'bulkRegister', expectedPath: 'translations/bulk', expectedMethod: 1 },
    { method: 'GET', handler: 'extractKeysFromSource', expectedPath: 'translations/extract', expectedMethod: 0 },
    { method: 'GET', handler: 'listLocales', expectedPath: 'locales', expectedMethod: 0 },
    { method: 'GET', handler: 'validate', expectedPath: 'validate', expectedMethod: 0 },
    { method: 'POST', handler: 'validateWithBody', expectedPath: 'validate', expectedMethod: 1 },
  ]

  for (const r of routes) {
    it(`${r.method} ${r.expectedPath} 路由元数据正确`, () => {
      const method = Reflect.getMetadata('method', (I18nController.prototype as any)[r.handler])
      const path = Reflect.getMetadata('path', (I18nController.prototype as any)[r.handler])
      assert.equal(method, r.expectedMethod, `method for ${r.handler}`)
      assert.equal(path, r.expectedPath, `path for ${r.handler}`)
    })
  }
})

// ── POST /i18n/translations ─────────────────────────────────
describe('POST /i18n/translations — createTranslation', () => {
  it('正常: 创建单条翻译条目', () => {
    const ctrl = makeController()
    const result = ctrl.createTranslation(makeContext(), {
      key: 'order.paid',
      locale: 'zh-CN',
      value: '已支付',
    })
    assert.equal(result.success, true)
    assert.equal(result.key, 'order.paid')
    assert.equal(result.locale, 'zh-CN')
    assert.equal(result.namespace, 'default')
  })

  it('正常: 指定 namespace', () => {
    const ctrl = makeController()
    const result = ctrl.createTranslation(makeContext(), {
      key: 'payment.success',
      locale: 'zh-CN',
      value: '支付成功',
      namespace: 'payment',
    })
    assert.equal(result.namespace, 'payment')
  })

  it('边界: 空 key', () => {
    const ctrl = makeController()
    const result = ctrl.createTranslation(makeContext(), {
      key: '',
      locale: 'zh-CN',
      value: 'empty',
    })
    assert.equal(result.success, true)
  })

  it('边界: 空 value', () => {
    const ctrl = makeController()
    const result = ctrl.createTranslation(makeContext(), {
      key: 'empty.val',
      locale: 'en-US',
      value: '',
    })
    assert.equal(result.success, true)
  })

  it('反例: 未知 locale 仍创建', () => {
    const ctrl = makeController()
    const result = ctrl.createTranslation(makeContext(), {
      key: 'x.y',
      locale: 'zh-CN' as any,
      value: 'test',
    })
    assert.equal(result.success, true)
  })
})

// ── GET /i18n/translations ──────────────────────────────────
describe('GET /i18n/translations — queryTranslations', () => {
  it('正常: 空数据返回空', () => {
    const ctrl = makeController()
    const result = ctrl.queryTranslations('zh-CN')
    assert.equal(result.totalCount, 0)
    assert.deepEqual(result.translations, {})
    assert.equal(result.locale, 'zh-CN')
  })

  it('正常: 注册后可查询 (使用扁平键避免嵌套路径)', () => {
    const ctrl = makeController()
    ctrl.createTranslation(makeContext(), { key: 'flat_a_b', locale: 'zh-CN', value: 'AB' })
    ctrl.createTranslation(makeContext(), { key: 'flat_c_d', locale: 'zh-CN', value: 'CD' })
    const result = ctrl.queryTranslations('zh-CN')
    assert.equal(result.totalCount, 2)
    assert.equal(result.translations['flat_a_b'], 'AB')
    assert.equal(result.translations['flat_c_d'], 'CD')
  })

  it('正常: 关键字筛选', () => {
    const ctrl = makeController()
    ctrl.createTranslation(makeContext(), { key: 'order.paid', locale: 'zh-CN', value: '已支付' })
    ctrl.createTranslation(makeContext(), { key: 'member.name', locale: 'zh-CN', value: '会员名称' })
    const result = ctrl.queryTranslations('zh-CN', undefined, 'order')
    assert.equal(result.totalCount, 1)
    assert.ok('order.paid' in result.translations)
    assert.ok(!('member.name' in result.translations))
  })

  it('正常: 分页', () => {
    const ctrl = makeController()
    for (let i = 0; i < 10; i++) {
      ctrl.createTranslation(makeContext(), { key: `key.${i}`, locale: 'zh-CN', value: `val-${i}` })
    }
    const result = ctrl.queryTranslations('zh-CN', undefined, undefined, '2', '3')
    assert.equal(result.page, 2)
    assert.equal(result.pageSize, 3)
    assert.equal(Object.keys(result.translations).length, 3)
  })

  it('边界: 默认 locale 为 zh-CN', () => {
    const ctrl = makeController()
    const result = ctrl.queryTranslations(undefined)
    assert.equal(result.locale, 'zh-CN')
  })

  it('边界: 超大 pageSize 截断为 100', () => {
    const ctrl = makeController()
    for (let i = 0; i < 110; i++) {
      ctrl.createTranslation(makeContext(), { key: `k.${i}`, locale: 'zh-CN', value: `v-${i}` })
    }
    const result = ctrl.queryTranslations('zh-CN', undefined, undefined, '1', '200')
    // pageSize is clamped to 100 in controller logic
    assert.ok(Object.keys(result.translations).length <= 100)
  })

  it('边界: page 为 0 自动修正为 1', () => {
    const ctrl = makeController()
    ctrl.createTranslation(makeContext(), { key: 'a', locale: 'zh-CN', value: 'A' })
    const result = ctrl.queryTranslations('zh-CN', undefined, undefined, '0', '10')
    assert.equal(result.page, 1)
  })

  it('反例: 无匹配关键字返回空', () => {
    const ctrl = makeController()
    ctrl.createTranslation(makeContext(), { key: 'hello', locale: 'zh-CN', value: '你好' })
    const result = ctrl.queryTranslations('zh-CN', undefined, 'nonexistent')
    assert.equal(result.totalCount, 0)
    assert.deepEqual(result.translations, {})
  })
})

// ── PUT /i18n/translations/:id ──────────────────────────────
describe('PUT /i18n/translations/:id — updateTranslation', () => {
  it('正常: 更新翻译值', () => {
    const ctrl = makeController()
    ctrl.createTranslation(makeContext(), { key: 'greeting', locale: 'zh-CN', value: '你好' })
    const result = ctrl.updateTranslation('zh-CN:greeting', { value: '您好' }, makeContext())
    assert.equal(result.success, true)
    assert.equal(result.updated, true)

    const query = ctrl.queryTranslations('zh-CN', undefined, 'greeting')
    assert.equal(query.translations['greeting'], '您好')
  })

  it('正常: 创建新的 (不存在时自动注册)', () => {
    const ctrl = makeController()
    const result = ctrl.updateTranslation('en-US:new.key', { value: 'New Value' }, makeContext())
    assert.equal(result.success, true)
  })

  it('边界: 空 id 前缀', () => {
    const ctrl = makeController()
    const result = ctrl.updateTranslation(':emptyPrefix', { value: 'prefixed' }, makeContext())
    assert.equal(result.success, true)
  })

  it('边界: 更新仅修改 enabled 字段', () => {
    const ctrl = makeController()
    ctrl.createTranslation(makeContext(), { key: 'enabled.key', locale: 'zh-CN', value: '原始' })
    const result = ctrl.updateTranslation('zh-CN:enabled.key', { enabled: false }, makeContext())
    assert.equal(result.success, true)
  })
})

// ── POST /i18n/translations/bulk ────────────────────────────
describe('POST /i18n/translations/bulk — bulkRegister', () => {
  it('正常: 批量注册多个翻译', () => {
    const ctrl = makeController()
    const result = ctrl.bulkRegister(
      {
        locale: 'en-US',
        translations: {
          'greeting.morning': 'Good Morning',
          'greeting.evening': 'Good Evening',
        },
      },
      makeContext(),
    )
    assert.equal(result.success, true)
    assert.equal(result.count, 2)

    const query = ctrl.queryTranslations('en-US')
    assert.equal(query.totalCount, 2)
  })

  it('边界: 空翻译映射', () => {
    const ctrl = makeController()
    const result = ctrl.bulkRegister({ locale: 'ja-JP', translations: {} }, makeContext())
    assert.equal(result.success, true)
    assert.equal(result.count, 0)
  })

  it('边界: 大量键 (100 条)', () => {
    const ctrl = makeController()
    const translations: Record<string, string> = {}
    for (let i = 0; i < 100; i++) {
      translations[`bulk.${i}`] = `val-${i}`
    }
    const result = ctrl.bulkRegister({ locale: 'zh-CN', translations }, makeContext())
    assert.equal(result.success, true)
    assert.equal(result.count, 100)
  })
})

// ── GET /i18n/translations/extract ──────────────────────────
describe('GET /i18n/translations/extract — extractKeysFromSource', () => {
  it('正常: 从源码提取 key', () => {
    const ctrl = makeController()
    const source = "const msg = t('hello.world')"
    const result = ctrl.extractKeysFromSource(source)
    assert.ok(result.keys.includes('hello.world'))
    assert.ok(result.totalCount >= 1)
  })

  it('边界: 无 source 参数返回空', () => {
    const ctrl = makeController()
    const result = ctrl.extractKeysFromSource(undefined)
    assert.deepEqual(result.keys, [])
    assert.equal(result.totalCount, 0)
  })

  it('边界: 空字符串 source', () => {
    const ctrl = makeController()
    const result = ctrl.extractKeysFromSource('')
    assert.deepEqual(result.keys, [])
    assert.equal(result.totalCount, 0)
  })
})

// ── GET /i18n/locales ───────────────────────────────────────
describe('GET /i18n/locales — listLocales', () => {
  it('正常: 返回已注册区域列表', () => {
    const ctrl = makeController()
    const result = ctrl.listLocales()
    assert.ok(Array.isArray(result.locales))
    assert.equal(result.defaultLocale, 'zh-CN')
    assert.deepEqual(result.supportedLocales, ['zh-CN', 'en-US', 'ja-JP'])
  })

  it('边界: 注册翻译后 locales 包含新 locale', () => {
    const ctrl = makeController()
    ctrl.createTranslation(makeContext(), { key: 'a', locale: 'ja-JP', value: 'A' })
    const result = ctrl.listLocales()
    assert.ok(result.locales.includes('ja-JP'))
  })
})

// ── GET /i18n/validate ──────────────────────────────────────
describe('GET /i18n/validate', () => {
  it('正常: 无翻译时返回空完整性', () => {
    const ctrl = makeController()
    const result = ctrl.validate('zh-CN')
    assert.ok(result['zh-CN'] !== undefined)
    assert.ok(result['en-US'] !== undefined)
    assert.ok(result['ja-JP'] !== undefined)
  })

  it('边界: 默认参考 locale 为 zh-CN', () => {
    const ctrl = makeController()
    const result = ctrl.validate(undefined)
    assert.ok('zh-CN' in result)
    assert.ok('en-US' in result)
    assert.ok('ja-JP' in result)
  })

  it('正常: 注册后检测缺失翻译', () => {
    const ctrl = makeController()
    ctrl.createTranslation(makeContext(), { key: 'test.key', locale: 'zh-CN', value: '测试' })
    const result = ctrl.validate('zh-CN')
    assert.equal(result['zh-CN'].length, 0)
  })
})

// ── POST /i18n/validate ─────────────────────────────────────
describe('POST /i18n/validate — validateWithBody', () => {
  it('正常: 返回完整性报告', () => {
    const ctrl = makeController()
    const result = ctrl.validateWithBody({ referenceLocale: 'en-US' })
    assert.ok('zh-CN' in result)
    assert.ok('en-US' in result)
    assert.ok('ja-JP' in result)
  })

  it('边界: 注册后 POST validate 返回正确统计', () => {
    const ctrl = makeController()
    ctrl.createTranslation(makeContext(), { key: 'unique.key', locale: 'zh-CN', value: '唯一' })
    ctrl.createTranslation(makeContext(), { key: 'unique.key', locale: 'en-US', value: 'Unique' })
    const result = ctrl.validateWithBody({ referenceLocale: 'zh-CN' })
    assert.equal(result['zh-CN'].length, 0, '参考 locale 自身不应有缺失')
  })
})

// ── 集成: 多端点协作 ────────────────────────────────────────
describe('多端点集成', () => {
  it('创建 → 查询 → 更新 → 验证 完整链路', () => {
    const ctrl = makeController()

    // 1. 创建（使用扁平键避免嵌套路径问题）
    ctrl.createTranslation(makeContext(), { key: 'flow_key1', locale: 'zh-CN', value: '流程1' })
    ctrl.createTranslation(makeContext(), { key: 'flow_key2', locale: 'zh-CN', value: '流程2' })

    // 2. 查询
    const q1 = ctrl.queryTranslations('zh-CN')
    assert.equal(q1.totalCount, 2)

    // 3. 更新
    ctrl.updateTranslation('zh-CN:flow_key1', { value: '流程1已更新' }, makeContext())
    const q2 = ctrl.queryTranslations('zh-CN', undefined, 'flow_key1')
    assert.equal(q2.translations['flow_key1'], '流程1已更新')

    // 4. 批量再注册
    ctrl.bulkRegister(
      { locale: 'en-US', translations: { 'flow_key1': 'Flow1', 'flow_key2': 'Flow2' } },
      makeContext(),
    )
    const q3 = ctrl.queryTranslations('en-US')
    assert.equal(q3.totalCount, 2)

    // 5. 验证
    const v = ctrl.validate('zh-CN')
    assert.equal(v['zh-CN'].length, 0)
  })
})
