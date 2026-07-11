import { describe, it, expect } from 'vitest'
/**
 * 🐜 自动: [locale] [D] stress 压力测试
 *
 * 覆盖边界场景:
 * - 并发大批量格式化（高吞吐场景）
 * - 极端输入值（溢出、特殊字符、超大数值）
 * - 快速连续时区转换
 * - 多时区批量转换压力
 */

import assert from 'node:assert/strict'
import { LocaleService } from './locale.service'
import type { TimeZone } from './locale.service'

describe('Locale - Stress & Resilience', () => {
  let service: LocaleService

  beforeEach(() => {
    service = new LocaleService()
  })

  // ─── 高并发格式化 ───

  describe('高并发格式化', () => {
    it('批量格式化 200 个日期不崩溃', () => {
      const dates = Array.from({ length: 200 }, (_, i) => new Date(2024, 0, i % 31 + 1, i % 24, 0, 0))

      for (const date of dates) {
        const formatted = service.formatDateTime(date, 'Asia/Shanghai')
        assert.ok(typeof formatted === 'string')
        assert.ok(formatted.length > 0)
      }
    })

    it('批量格式化 200 个数字不崩溃', () => {
      const values = Array.from({ length: 200 }, (_, i) => Math.pow(10, (i % 9) + 1) + i * 0.5)

      for (const v of values) {
        const formatted = service.formatNumber(v, 'zh-CN')
        assert.ok(typeof formatted === 'string')
        assert.ok(formatted.length > 0)
      }
    })

    it('批量格式化 200 个货币金额不崩溃', () => {
      const currencies = ['CNY', 'USD', 'JPY', 'EUR', 'KRW']
      const amounts = Array.from({ length: 200 }, (_, i) => (i * 123.45) % 999999)

      for (let idx = 0; idx < amounts.length; idx++) {
        const amount = amounts[idx]
        const currency = currencies[idx % currencies.length]
        const locale = currency === 'CNY' ? 'zh-CN' : currency === 'USD' ? 'en-US' : 'ja-JP'
        const formatted = service.formatCurrency(amount, currency, locale)
        assert.ok(typeof formatted === 'string')
        assert.ok(formatted.length > 0)
      }
    })
  })

  // ─── 极端输入值 ───

  describe('极端输入值', () => {
    it('处理极端大数值格式化', () => {
      const huge = 9_999_999_999_999.99
      const formatted = service.formatNumber(huge, 'zh-CN')
      assert.ok(formatted.includes('9') || formatted.includes(',') || formatted.includes('.'))
    })

    it('处理极小数值格式化', () => {
      const tiny = 0.0000001
      const formatted = service.formatNumber(tiny, 'zh-CN')
      assert.ok(formatted.length > 0)
    })

    it('处理超大货币金额', () => {
      const formatted = service.formatCurrency(1_000_000_000, 'USD', 'en-US')
      assert.ok(formatted.includes('$'))
      assert.ok(formatted.includes('000') || formatted.includes(','))
    })

    it('处理负数货币金额', () => {
      const formatted = service.formatCurrency(-500.75, 'CNY', 'zh-CN')
      // Should handle negative values gracefully — may or may not show minus sign
      assert.ok(typeof formatted === 'string')
      assert.ok(formatted.length > 0)
    })

    it('处理 Unix epoch 时间 (1970-01-01)', () => {
      const epoch = new Date(0)
      const formatted = service.formatDateTime(epoch, 'Asia/Shanghai')
      assert.ok(formatted.length > 0)
    })

    it('处理遥远的未来日期 (2099-12-31)', () => {
      const future = new Date('2099-12-31T23:59:59Z')
      const formatted = service.formatDateTime(future, 'Asia/Shanghai')
      assert.ok(formatted.length > 0)
    })
  })

  // ─── 多时区批量转换 ───

  describe('多时区批量转换', () => {
    const allTimezones: TimeZone[] = [
      'Asia/Shanghai',
      'Asia/Taipei',
      'America/New_York',
      'Asia/Tokyo',
      'Asia/Seoul',
      'Asia/Bangkok',
      'Asia/Ho_Chi_Minh',
      'Asia/Jakarta',
      'Asia/Kuala_Lumpur',
      'Asia/Singapore',
    ]

    it('10 个时区之间交叉转换 100 次不崩溃', () => {
      const now = new Date()
      for (let i = 0; i < 100; i++) {
        const fromTz = allTimezones[i % allTimezones.length]
        const toTz = allTimezones[(i + 3) % allTimezones.length]
        const converted = service.convertTime(now, fromTz, toTz)
        assert.ok(converted instanceof Date)
        assert.ok(!isNaN(converted.getTime()))
      }
    })

    it('同源同目标时区转换保持相等', () => {
      const now = new Date()
      for (const tz of allTimezones) {
        const converted = service.convertTime(now, tz, tz)
        // Converting a timezone to itself should preserve absolute time
        assert.equal(converted.getTime(), now.getTime())
      }
    })
  })

  // ─── 工作日判断边界 ───

  describe('工作日判断压力', () => {
    it('批量检查 365 天是否为工作日', () => {
      const tz: TimeZone = 'Asia/Shanghai'
      for (let day = 1; day <= 365; day++) {
        const date = new Date(2024, 0, day) // 2024 is a leap year
        const result = service.isWorkday(date, tz)
        assert.ok(typeof result === 'boolean')
      }
    })

    it('所有支持的国家码批量检查工作日', () => {
      const countries = ['CN', 'TW', 'US', 'JP', 'KR', 'TH', 'VN', 'ID', 'MY', 'SG'] as const
      const testDate = new Date('2024-06-15T10:00:00Z') // Saturday in most timezones

      for (const cc of countries) {
        const tz = service.getTimeZone(cc)
        const result = service.isWorkday(testDate, tz, cc)
        assert.ok(typeof result === 'boolean')
      }
    })
  })

  // ─── 日期组件提取 ───

  describe('日期组件提取压力', () => {
    it('批量提取 1000 个日期的组件不崩溃', () => {
      const tz: TimeZone = 'Asia/Shanghai'
      for (let i = 0; i < 1000; i++) {
        const date = new Date(2024, 0, (i % 365) + 1, i % 24, i % 60, i % 60)
        const parts = service.getDateParts(date, tz)
        assert.ok(parts.year >= 2024)
        assert.ok(parts.month >= 1 && parts.month <= 12)
        assert.ok(parts.day >= 1 && parts.day <= 31)
        assert.ok(typeof parts.dayOfWeek === 'string')
      }
    })
  })

  // ─── 连续快速操作 ───

  describe('连续快速操作', () => {
    it('快速连续格式化 500 次不崩溃', () => {
      const tz: TimeZone = 'Asia/Shanghai'
      for (let i = 0; i < 500; i++) {
        const date = new Date(Date.now() + i * 1000)
        const result = service.formatDateTime(date, tz)
        assert.ok(typeof result === 'string')
      }
    })

    it('快速切换时区格式化', () => {
      const tzs: TimeZone[] = [
        'Asia/Shanghai', 'America/New_York', 'Asia/Tokyo',
        'Asia/Seoul', 'Asia/Bangkok', 'Asia/Singapore',
      ]
      const date = new Date()
      for (let i = 0; i < 60; i++) {
        const tz = tzs[i % tzs.length]
        const result = service.formatDateTime(date, tz)
        assert.ok(typeof result === 'string')
        assert.ok(result.length > 0)
      }
    })

    it('formatNumber / formatCurrency / formatPercent 交替调用 100 次', () => {
      const locales = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR']
      for (let i = 0; i < 100; i++) {
        const locale = locales[i % locales.length]
        service.formatNumber(i * 1000.5, locale)
        service.formatCurrency(i * 10, 'USD', locale)
        service.formatPercent(i / 1000, locale)
      }
      // If we got here without throwing, it's a pass
      assert.ok(true)
    })
  })

  // ─── UTC 转换压力 ───

  describe('UTC 转换压力', () => {
    it('从所有时区转换为 UTC 不崩溃', () => {
      const tzs: TimeZone[] = [
        'Asia/Shanghai', 'America/New_York', 'Asia/Tokyo',
        'Asia/Seoul', 'Asia/Bangkok', 'Asia/Singapore',
      ]
      const now = new Date()
      for (const tz of tzs) {
        const utc = service.toUTC(now, tz)
        assert.ok(utc instanceof Date)
        assert.ok(!isNaN(utc.getTime()))
      }
    })

    it('从 UTC 转换为所有时区不崩溃', () => {
      const tzs: TimeZone[] = [
        'Asia/Shanghai', 'America/New_York', 'Asia/Tokyo',
        'Asia/Seoul', 'Asia/Bangkok', 'Asia/Singapore',
      ]
      const utcNow = new Date()
      for (const tz of tzs) {
        const local = service.fromUTC(utcNow, tz)
        assert.ok(local instanceof Date)
        assert.ok(!isNaN(local.getTime()))
      }
    })
  })

  // ─── 空/无效输入容错 ───

  describe('空/无效输入容错', () => {
    it('NaN 日期不崩溃', () => {
      const nanDate = new Date(NaN)
      assert.throws(() => {
        service.formatDateTime(nanDate, 'Asia/Shanghai')
      }, /Invalid|invalid|RangeError/)
    })

    it('formatNumber 的 NaN 值不崩溃', () => {
      // Intl.NumberFormat handles NaN by converting to "NaN" string
      const result = service.formatNumber(NaN, 'zh-CN')
      assert.ok(typeof result === 'string')
    })
  })
})
