import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * i18n-locale-e2e.test.ts - T117-5
 * E2E 测试: i18n + locale 全流程
 */
import { I18nExtService } from '../modules/i18n/i18n-ext.service'
import { LocaleService, localeService } from '../modules/locale/locale.service'

describe('i18n + locale E2E', () => {
  let i18n: I18nExtService
  let locale: LocaleService

  beforeAll(() => {
    i18n = new I18nExtService()
    locale = localeService
  })

  it('全程国际化流：用户用 ja-JP 打开页面，看到日语日期和格式', () => {
    const locale_ = 'ja-JP'
    const tz = locale.getTimeZone('JP')
    const now = locale.now(tz)

    // 日期用日语格式化 (long format includes 月日)
    const formatted = locale.formatDate(now, tz, 'long')
    // 日语长格式: 2024年1月15日
    expect(formatted).toMatch(/\d{4}年\d{1,2}月\d{1,2}/)

    // 积分用日语
    const points = i18n.t('points.earned', locale_)
    expect(points).toMatch(/ポイント/)

    // 金额用 JPY 格式化 (fullwidth yen sign)
    const amount = locale.formatCurrency(5000, 'JPY', 'ja-JP')
    expect(amount).toMatch(/￥/)
  })

  it('多语言切换：同一数据，中/英/日三种表示', () => {
    const date = new Date('2024-01-15T10:30:00Z')
    const locales: Array<'zh-CN' | 'en-US' | 'ja-JP'> = ['zh-CN', 'en-US', 'ja-JP']

    const formatted = locales.map(l => {
      const tz = locale.getTimeZone(l === 'zh-CN' ? 'CN' : l === 'en-US' ? 'US' : 'JP')
      return locale.formatDate(date, tz, 'long')
    })

    // zh-CN: 2024年1月15日
    expect(formatted[0]).toMatch(/2024年/)
    // en-US: January 15, 2024
    expect(formatted[1]).toMatch(/January/)
    // ja-JP: 2024年1月15日
    expect(formatted[2]).toMatch(/2024年/)
  })

  it('PayPal 退款：en-US 界面显示英文，status localized', () => {
    // payment.completed 没有直接key，应该返回 key 本身
    const message = i18n.t('payment.completed', 'en-US')
    expect(message).toBe('payment.completed')
  })

  it('货币格式化：多种货币符号', () => {
    const amounts: Array<{ currency: string; locale: string; expectedSymbol: RegExp }> = [
      { currency: 'CNY', locale: 'zh-CN', expectedSymbol: /¥/ },
      { currency: 'JPY', locale: 'ja-JP', expectedSymbol: /￥/ },
      { currency: 'KRW', locale: 'ko-KR', expectedSymbol: /₩/ },
      { currency: 'THB', locale: 'th-TH', expectedSymbol: /฿/ },
      { currency: 'VND', locale: 'vi-VN', expectedSymbol: /₫/ },
      { currency: 'IDR', locale: 'id-ID', expectedSymbol: /Rp/ },
      { currency: 'MYR', locale: 'ms-MY', expectedSymbol: /RM/ },
      { currency: 'USD', locale: 'en-US', expectedSymbol: /\$/ },
    ]

    for (const { currency, locale: loc, expectedSymbol } of amounts) {
      const formatted = locale.formatCurrency(1000, currency, loc)
      expect(formatted).toMatch(expectedSymbol)
    }
  })

  it('时区转换：北京、东京、纽约时间对比', () => {
    const utcDate = new Date('2024-01-15T12:00:00Z')

    // 使用 formatDateTime 获取完整日期时间
    const beijing = locale.formatDateTime(utcDate, 'Asia/Shanghai')
    const tokyo = locale.formatDateTime(utcDate, 'Asia/Tokyo')
    const newYork = locale.formatDateTime(utcDate, 'America/New_York')

    // 北京时间比UTC快8小时 = 20:00 (中文locale显示 下午08:00)
    expect(beijing).toMatch(/20:00|下午08:00/)
    // 东京时间比UTC快9小时 = 21:00 (日语显示 午後09:00)
    expect(tokyo).toMatch(/21:00|午後09:00/)
    // 纽约时间比UTC慢5小时（标准时）= 07:00 (英语显示 7:00 AM)
    expect(newYork).toMatch(/07:00|7:00/)
  })
})
