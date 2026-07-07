import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * i18n.phase-p43.test.ts — P-43 多语言 Phase 角色测试
 *
 * E21 设计 + E28 孙租户
 * 任务: 模拟纯函数,不依赖 NestJS DI
 *
 * 角色:
 *   👑店长-zh-CN / 🇺🇸店长-en-US / 🗾店长-ja-JP / 🇰🇷店长-ko-KR
 *   E21设计前台 / E21设计HR / E21设计安监 / E28孙租户
 *   租户运营 / 租户管理员 / 平台超管 / 客诉专员
 *
 * 覆盖 12 项:
 *   翻译·回退(en→zh-CN)·语言检测·数字格式化·日期格式化·无效locale回退
 *   + 参数插值 + 嵌套翻译 + locale列表 + locale检测 + 数字/日期参数 + 回退链
 */

import assert from 'node:assert/strict'

// ── 类型定义 ──
type Locale = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR'

// ── 模拟翻译资源 ──
const translations: Record<Locale, Record<string, string>> = {
  'zh-CN': {
    'greeting': '你好',
    'welcome': '欢迎光临 {store}',
    'order.paid': '已支付 {amount} 元',
    'order.pending': '待支付',
    'store.name': '门店名称',
    'store.revenue': '营收：{value} 元',
    'hr.employee.count': '员工共 {count} 人',
    'camera.feed': '实时画面 {id}',
    'ops.uptime': '运行时间 {hours} 小时',
  },
  'en-US': {
    'greeting': 'Hello',
    'welcome': 'Welcome to {store}',
    'order.paid': 'Paid ${amount}',
    'order.pending': 'Pending',
    'store.name': 'Store Name',
    'store.revenue': 'Revenue: ${value}',
    'hr.employee.count': '{count} employees',
  },
  'ja-JP': {
    'greeting': 'こんにちは',
    'welcome': '{store}へようこそ',
    'order.paid': '{amount}円を支払いました',
    'store.name': '店舗名',
  },
  'ko-KR': {
    'greeting': '안녕하세요',
    'welcome': '{store}에 오신 것을 환영합니다',
    'order.paid': '{amount}원 결제됨',
    'store.name': '매장 이름',
  },
}

// ── 模拟函数 ──

const SUPPORTED_LOCALES: Locale[] = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR']
const FALLBACK_CHAIN: Record<Locale, Locale[]> = {
  'zh-CN': ['zh-CN', 'en-US'],
  'en-US': ['en-US', 'zh-CN'],
  'ja-JP': ['ja-JP', 'en-US', 'zh-CN'],
  'ko-KR': ['ko-KR', 'en-US', 'zh-CN'],
}

function getSupportedLocales(): Locale[] {
  return [...SUPPORTED_LOCALES]
}

function lookupKey(key: string, locale: Locale): string | undefined {
  const map = translations[locale]
  if (!map) return undefined
  return map[key]
}

function translate(key: string, locale: Locale, params?: Record<string, string>): string {
  const chain = FALLBACK_CHAIN[locale] ?? ['en-US']
  for (const loc of chain) {
    const value = lookupKey(key, loc)
    if (value !== undefined) {
      if (!params) return value
      return value.replace(/\{(\w+)\}/g, (_m, k) => params[k] ?? `{${k}}`)
    }
  }
  return key
}

function detectLocale(acceptLang: string): Locale {
  if (acceptLang.startsWith('zh')) return 'zh-CN'
  if (acceptLang.startsWith('ja')) return 'ja-JP'
  if (acceptLang.startsWith('ko')) return 'ko-KR'
  return 'en-US'
}

function formatNumber(n: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
  const localeMap: Record<Locale, string> = {
    'zh-CN': 'zh-CN',
    'en-US': 'en-US',
    'ja-JP': 'ja-JP',
    'ko-KR': 'ko-KR',
  }
  try {
    return new Intl.NumberFormat(localeMap[locale] ?? 'en-US', options).format(n)
  } catch {
    return String(n)
  }
}

function formatDate(d: Date, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  const localeMap: Record<Locale, string> = {
    'zh-CN': 'zh-CN',
    'en-US': 'en-US',
    'ja-JP': 'ja-JP',
    'ko-KR': 'ko-KR',
  }
  try {
    return new Intl.DateTimeFormat(localeMap[locale] ?? 'en-US', options).format(d)
  } catch {
    return d.toISOString()
  }
}

// ── 角色映射 ──
const ROLES = {
  CNStore: '👑店长-zh-CN',
  ENStore: '🇺🇸店长-en-US',
  JPStore: '🗾店长-ja-JP',
  KRStore: '🇰🇷店长-ko-KR',
  DesignFront: 'E21设计前台',
  DesignHR: 'E21设计HR',
  DesignSafety: 'E21设计安监',
  SunTenant: 'E28孙租户',
  Ops: '租户运营',
  Admin: '租户管理员',
  SuperAdmin: '平台超管',
  Complaint: '客诉专员',
}

// ── 翻译 ──
describe(`${ROLES.CNStore} 翻译测试`, () => {
  it('基本翻译: zh-CN 到中文', () => {
    assert.equal(translate('greeting', 'zh-CN'), '你好')
    assert.equal(translate('order.pending', 'zh-CN'), '待支付')
  })

  it('参数插值:欢迎语含门店名', () => {
    assert.equal(
      translate('welcome', 'zh-CN', { store: '深圳万象城店' }),
      '欢迎光临 深圳万象城店',
    )
  })

  it('嵌套翻译:HR员工计数', () => {
    assert.equal(
      translate('hr.employee.count', 'zh-CN', { count: '42' }),
      '员工共 42 人',
    )
  })
})

// ── 回退(en→zh-CN) ──
describe(`${ROLES.ENStore} 回退测试`, () => {
  it('en-US 有翻译的直接使用', () => {
    assert.equal(translate('greeting', 'en-US'), 'Hello')
    assert.equal(translate('order.pending', 'en-US'), 'Pending')
  })

  it('en-US 缺翻译时回退到 zh-CN', () => {
    // camera.feed 只在 zh-CN 注册
    assert.equal(
      translate('camera.feed', 'en-US', { id: 'CAM01' }),
      '实时画面 CAM01',
    )
  })
})

// ── 语言检测 ──
describe(`${ROLES.JPStore} 语言检测测试`, () => {
  it('ja-JP 完整翻译', () => {
    assert.equal(translate('greeting', 'ja-JP'), 'こんにちは')
    assert.equal(
      translate('welcome', 'ja-JP', { store: '渋谷店' }),
      '渋谷店へようこそ',
    )
  })

  it('ja-JP 缺翻译时回退到 en-US', () => {
    // order.pending 在 ja-JP 缺失 → 回退到 en-US
    assert.equal(translate('order.pending', 'ja-JP'), 'Pending')
  })

  it('检测 ja 语言头返回 ja-JP locale', () => {
    assert.equal(detectLocale('ja-JP'), 'ja-JP')
    assert.equal(detectLocale('ja'), 'ja-JP')
  })
})

// ── 数字格式化 ──
describe(`${ROLES.KRStore} 数字格式化测试`, () => {
  it('ko-KR 数字格式有千分位分隔', () => {
    const formatted = formatNumber(1234567, 'ko-KR')
    // ko-KR 也用逗号分隔,检查是否含逗号
    assert.ok(formatted.includes(','))
  })

  it('en-US 数字格式正确', () => {
    const formatted = formatNumber(1234.56, 'en-US', { minimumFractionDigits: 2 })
    assert.ok(formatted.startsWith('1,234'))
    assert.ok(formatted.endsWith('.56'))
  })

  it('zh-CN 大数字千分位', () => {
    const formatted = formatNumber(1000000, 'zh-CN')
    assert.equal(formatted, '1,000,000')
  })
})

// ── 日期格式化 ──
describe(`${ROLES.DesignFront} 日期格式化测试`, () => {
  it('zh-CN 日期格式 YYYY/MM/DD', () => {
    const d = new Date('2026-07-08T00:00:00')
    const formatted = formatDate(d, 'zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    assert.equal(formatted, '2026/07/08')
  })

  it('en-US 日期格式 M/D/YYYY', () => {
    const d = new Date('2026-07-08T00:00:00')
    const formatted = formatDate(d, 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
    assert.equal(formatted, '07/08/2026')
  })

  it('ja-JP 日期格式 YYYY年M月D日', () => {
    const d = new Date('2026-07-08T00:00:00')
    const formatted = formatDate(d, 'ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
    assert.ok(formatted.includes('2026'))
    assert.ok(formatted.includes('7月') || formatted.includes('07月'))
  })
})

// ── 无效 locale 回退 ──
describe(`${ROLES.DesignHR} 无效 locale 回退测试`, () => {
  it('未知 locale 回退到 en-US', () => {
    // 类型层面不允许,但运行时传错就按 FALLBACK_CHAIN 兜底
    const unknown = 'fr-FR' as Locale
    assert.equal(translate('greeting', unknown), 'Hello')
  })

  it('未知 locale 数字格式化兜底', () => {
    const unknown = 'fr-FR' as Locale
    // 无对应 Intl locale 映射时兜底到 en-US
    const formatted = formatNumber(1234, unknown)
    assert.ok(typeof formatted === 'string')
  })

  it('缺翻译时 key 本身作为兜底', () => {
    assert.equal(translate('nonexistent.key', 'ko-KR'), 'nonexistent.key')
  })
})

// ── 数字 + 日期参数 ──
describe(`${ROLES.DesignSafety} 数字/日期参数测试`, () => {
  it('数字传入插值参数', () => {
    assert.equal(
      translate('store.revenue', 'zh-CN', { value: '99999' }),
      '营收：99999 元',
    )
  })

  it('en-US 数字插值带符号', () => {
    assert.equal(
      translate('store.revenue', 'en-US', { value: '50000' }),
      'Revenue: $50000',
    )
  })
})

// ── locale 列表 ──
describe(`${ROLES.SunTenant} locale 列表测试`, () => {
  it('获取受支持的语言列表包含4项', () => {
    const locales = getSupportedLocales()
    assert.equal(locales.length, 4)
    assert.ok(locales.includes('zh-CN'))
    assert.ok(locales.includes('en-US'))
    assert.ok(locales.includes('ja-JP'))
    assert.ok(locales.includes('ko-KR'))
  })

  it('locale 列表顺序稳定', () => {
    assert.deepStrictEqual(getSupportedLocales(), ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'])
  })
})

// ── locale 检测 ──
describe(`${ROLES.Ops} locale 检测测试`, () => {
  it('Accept-Language zh-cn → zh-CN', () => {
    assert.equal(detectLocale('zh-cn'), 'zh-CN')
    assert.equal(detectLocale('zh-CN,zh;q=0.9'), 'zh-CN')
  })

  it('Accept-Language en → en-US', () => {
    assert.equal(detectLocale('en'), 'en-US')
    assert.equal(detectLocale('en-US,en;q=0.5'), 'en-US')
  })

  it('Accept-Language ko → ko-KR', () => {
    assert.equal(detectLocale('ko-KR'), 'ko-KR')
  })
})

// ── 回退链 ──
describe(`${ROLES.Admin} 回退链测试`, () => {
  it('ko-KR 缺翻译时回退 en-US 再 zh-CN', () => {
    // camera.feed 只在 zh-CN 注册
    assert.equal(
      translate('camera.feed', 'ko-KR', { id: 'CAM-KR' }),
      '实时画面 CAM-KR',
    )
  })

  it('ja-JP 缺部分翻译时回退', () => {
    // ops.uptime 只在 zh-CN
    assert.equal(
      translate('ops.uptime', 'ja-JP', { hours: '8' }),
      '运行时间 8 小时',
    )
  })
})

// ── 扩展边界 ──
describe(`${ROLES.SuperAdmin} 边界测试`, () => {
  it('空字符串 key 返回空字符串', () => {
    // 空 key 查找应该返回 key 本身
    assert.equal(translate('', 'en-US'), '')
  })

  it('翻译值含特殊字符', () => {
    assert.equal(translate('order.pending', 'zh-CN'), '待支付')
  })
})

describe(`${ROLES.Complaint} 完整性测试`, () => {
  it('所有 locale 都有 greeting', () => {
    for (const loc of SUPPORTED_LOCALES) {
      assert.ok(lookupKey('greeting', loc) !== undefined, `greeting missing for ${loc}`)
    }
  })

  it('zh-CN 做 reference locale 完整性检查', () => {
    const refKeys = Object.keys(translations['zh-CN'])
    for (const loc of SUPPORTED_LOCALES) {
      if (loc === 'zh-CN') continue
      for (const key of refKeys) {
        // 非强制全部翻译,但主要 key 应存在
        if (['greeting', 'welcome', 'order.paid', 'store.name'].includes(key)) {
          assert.ok(
            lookupKey(key, loc) !== undefined,
            `关键key ${key} 在 ${loc} 中缺失`,
          )
        }
      }
    }
  })
})
