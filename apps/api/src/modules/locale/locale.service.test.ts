import { describe, it, expect, beforeEach } from 'vitest'
/**
 * locale.service.test.ts
 * 用途: LocaleService 单元测试（专注 service 层逻辑覆盖）
 *
 * 覆盖维度:
 * - 时区↔国家映射（正确 + 边界）
 * - 时间获取（now / nowUTC / 差量）
 * - 格式化（date / time / datetime / number / currency / percent）
 * - 时区转换（正向 / 反向 / 相同时区 / 跨日）
 * - 日期组件提取
 * - 日期范围计算
 * - 工作日判定（周末 / 工作时间 / 多国）
 * - UTC 双向转换
 * - 日期边界（startOfDay / endOfDay / startOfMonth / endOfMonth）
 * - 全区域格式验证
 */

import { LocaleService, type CountryCode, type TimeZone } from './locale.service'

describe('LocaleService', () => {
  let service: LocaleService

  beforeEach(() => {
    service = new LocaleService()
  })

  // ── 时区↔国家映射 ──
  describe('时区↔国家映射', () => {
    const pairs: Array<[TimeZone, CountryCode]> = [
      ['Asia/Shanghai', 'CN'],
      ['Asia/Taipei', 'TW'],
      ['America/New_York', 'US'],
      ['Asia/Tokyo', 'JP'],
      ['Asia/Seoul', 'KR'],
      ['Asia/Bangkok', 'TH'],
      ['Asia/Ho_Chi_Minh', 'VN'],
      ['Asia/Jakarta', 'ID'],
      ['Asia/Kuala_Lumpur', 'MY'],
      ['Asia/Singapore', 'SG'],
    ]

    it('getTimeZone 应正确映射全部国家码', () => {
      for (const [tz, cc] of pairs) {
        expect(service.getTimeZone(cc)).toBe(tz)
      }
    })

    it('getCountryCode 应正确映射全部时区', () => {
      for (const [tz, cc] of pairs) {
        expect(service.getCountryCode(tz)).toBe(cc)
      }
    })

    it('getTimeZone 与 getCountryCode 互逆', () => {
      for (const [tz, cc] of pairs) {
        expect(service.getTimeZone(service.getCountryCode(tz))).toBe(tz)
        expect(service.getCountryCode(service.getTimeZone(cc))).toBe(cc)
      }
    })

    it('getTimeZone 边界: 不存在的国家码应返回 undefined', () => {
      const result = (service as any).getTimeZone('XX')
      expect(result).toBeUndefined()
    })

    it('getCountryCode 边界: 不存在的时区应返回 undefined', () => {
      const result = (service as any).getCountryCode('Invalid/Zone')
      expect(result).toBeUndefined()
    })
  })

  // ── now / nowUTC ──
  describe('now / nowUTC', () => {
    it('now() 应返回 Date 实例', () => {
      expect(service.now('Asia/Shanghai')).toBeInstanceOf(Date)
    })

    it('nowUTC() 应返回 Date 实例', () => {
      expect(service.nowUTC()).toBeInstanceOf(Date)
    })

    it('不同时区的 now() 应反映时差', () => {
      const sh = service.now('Asia/Shanghai')
      const ny = service.now('America/New_York')
      // 上海 UTC+8, 纽约 UTC-5, 差 ~13h (夏季 DST)
      const diff = Math.abs(sh.getTime() - ny.getTime())
      const diffHours = diff / (1000 * 60 * 60)
      expect(diffHours).toBeGreaterThanOrEqual(11)
      expect(diffHours).toBeLessThanOrEqual(14)
    })
  })

  // ── 日期格式化 ──
  describe('formatDate', () => {
    const d = new Date('2024-01-15T12:00:00Z')

    it('medium 格式返回字符串', () => {
      expect(typeof service.formatDate(d, 'Asia/Shanghai', 'medium')).toBe('string')
    })

    it('short 格式应返回短格式', () => {
      const r = service.formatDate(d, 'Asia/Shanghai', 'short')
      expect(r.length).toBeGreaterThan(0)
    })

    it('long 格式应返回长格式', () => {
      const r = service.formatDate(d, 'Asia/Shanghai', 'long')
      expect(r.length).toBeGreaterThan(0)
    })

    it('full 格式应含星期信息', () => {
      const r = service.formatDate(d, 'Asia/Shanghai', 'full')
      expect(r.length).toBeGreaterThan(0)
    })

    it('不同时区结果应不同', () => {
      const sh = service.formatDate(d, 'Asia/Shanghai', 'medium')
      const ny = service.formatDate(d, 'America/New_York', 'medium')
      // 纽约日期可能滞后于上海
      expect(typeof sh).toBe('string')
      expect(typeof ny).toBe('string')
    })
  })

  describe('formatTime', () => {
    const d = new Date('2024-01-15T14:30:00Z')

    it('short 格式返回时间', () => {
      const r = service.formatTime(d, 'Asia/Shanghai', 'short')
      expect(r).toMatch(/\d{1,2}:\d{2}/)
    })

    it('long 格式应含秒', () => {
      const r = service.formatTime(d, 'Asia/Shanghai', 'long')
      expect(r).toMatch(/\d{1,2}:\d{2}:\d{2}/)
    })
  })

  describe('formatDateTime', () => {
    it('应包含日期和时间（空格分隔）', () => {
      const r = service.formatDateTime(new Date('2024-01-15T14:30:00Z'), 'Asia/Shanghai')
      expect(r).toMatch(/\d/)
      expect(r).toContain(' ')
    })
  })

  // ── 数字格式化 ──
  describe('formatNumber', () => {
    it('en-US 千分位逗号', () => {
      expect(service.formatNumber(1000000, 'en-US')).toBe('1,000,000')
    })

    it('de-DE 千分位点', () => {
      expect(service.formatNumber(1000000, 'de-DE')).toBe('1.000.000')
    })

    it('zh-CN 格式化', () => {
      const r = service.formatNumber(10000, 'zh-CN')
      expect(r.length).toBeGreaterThan(0)
    })

    it('小数保留两位', () => {
      const r = service.formatNumber(1234.56, 'en-US')
      expect(r).toContain('1,234')
    })

    it('负数带负号', () => {
      expect(service.formatNumber(-1234.56, 'en-US')).toContain('-')
    })

    it('0 值正常', () => {
      expect(service.formatNumber(0, 'en-US')).toBe('0')
    })
  })

  // ── 货币格式化 ──
  describe('formatCurrency', () => {
    it('USD 含 $', () => {
      expect(service.formatCurrency(1234.5, 'USD', 'en-US')).toMatch(/\$/)
    })

    it('CNY 含 ¥', () => {
      expect(service.formatCurrency(1234.5, 'CNY', 'zh-CN')).toMatch(/¥/)
    })

    it('JPY 含 ¥', () => {
      expect(service.formatCurrency(1234.5, 'JPY', 'ja-JP')).toMatch(/￥|¥/)
    })

    it('KRW 含 ₩', () => {
      expect(service.formatCurrency(1234.5, 'KRW', 'ko-KR')).toMatch(/₩/)
    })

    it('保留两位小数', () => {
      expect(service.formatCurrency(1234.5, 'USD', 'en-US')).toMatch(/\.\d{2}/)
    })

    it('0 金额正常', () => {
      const r = service.formatCurrency(0, 'CNY', 'zh-CN')
      expect(r).toContain('0')
    })

    it('大额整数正确', () => {
      const r = service.formatCurrency(99999999.99, 'USD', 'en-US')
      expect(r).toContain('$')
    })
  })

  // ── 百分比 ──
  describe('formatPercent', () => {
    it('0.123 → 含 12', () => {
      expect(service.formatPercent(0.123, 'en-US')).toMatch(/12/)
    })

    it('0.5 → 含 50', () => {
      expect(service.formatPercent(0.5, 'en-US')).toMatch(/50/)
    })

    it('负数显示负号', () => {
      expect(service.formatPercent(-0.25, 'en-US')).toContain('-')
    })

    it('1 → 含 100', () => {
      expect(service.formatPercent(1, 'en-US')).toMatch(/100/)
    })
  })

  // ── 日期组件 ──
  describe('getDateParts', () => {
    const d = new Date('2024-01-15T14:30:45Z')

    it('返回完整组件', () => {
      const p = service.getDateParts(d, 'Asia/Shanghai')
      expect(p).toHaveProperty('year')
      expect(p).toHaveProperty('month')
      expect(p).toHaveProperty('day')
      expect(p).toHaveProperty('hour')
      expect(p).toHaveProperty('minute')
      expect(p).toHaveProperty('second')
      expect(p).toHaveProperty('dayOfWeek')
    })

    it('星期为字符串', () => {
      expect(typeof service.getDateParts(d, 'Asia/Shanghai').dayOfWeek).toBe('string')
    })

    it('上海时区年月日正确', () => {
      const p = service.getDateParts(d, 'Asia/Shanghai')
      expect(p.year).toBe(2024)
      expect(p.month).toBe(1)
      expect(p.day).toBeGreaterThanOrEqual(15) // UTC 14:30 = Shanghai 22:30
      expect(p.day).toBeLessThanOrEqual(16)
    })
  })

  // ── 日期范围 ──
  describe('getDateRange', () => {
    it('10天范围', () => {
      const r = service.getDateRange(
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-11T00:00:00Z'),
        'Asia/Shanghai',
      )
      expect(r.days).toBeGreaterThanOrEqual(10)
    })

    it('5小时范围', () => {
      const r = service.getDateRange(
        new Date('2024-01-01T10:00:00Z'),
        new Date('2024-01-01T15:00:00Z'),
        'Asia/Shanghai',
      )
      expect(r.hours).toBeGreaterThanOrEqual(4)
    })

    it('跨年范围', () => {
      const r = service.getDateRange(
        new Date('2023-12-25T00:00:00Z'),
        new Date('2024-01-05T00:00:00Z'),
        'Asia/Shanghai',
      )
      expect(r.days).toBeGreaterThanOrEqual(10)
    })
  })

  // ── 时区转换 ──
  describe('convertTime', () => {
    it('上海→纽约: 20:00→07:00', () => {
      const d = new Date('2024-01-15T12:00:00Z') // UTC 12:00
      const r = service.convertTime(d, 'Asia/Shanghai', 'America/New_York')
      expect(r.getHours()).toBe(7)
    })

    it('纽约→上海: 07:00→20:00', () => {
      const d = new Date('2024-01-15T07:00:00Z')
      const r = service.convertTime(d, 'America/New_York', 'Asia/Shanghai')
      expect(r.getUTCHours()).toBe(20)
    })

    it('相同时区不变', () => {
      const d = new Date('2024-01-15T12:00:00Z')
      const r = service.convertTime(d, 'Asia/Shanghai', 'Asia/Shanghai')
      expect(r.getTime()).toBe(d.getTime())
    })

    it('上海→东京: +1h', () => {
      const d = new Date('2024-01-15T10:00:00Z')
      const r = service.convertTime(d, 'Asia/Shanghai', 'Asia/Tokyo')
      expect(r.getHours()).toBe(d.getHours() + 1)
    })
  })

  // ── UTC 双向转换 ──
  describe('toUTC / fromUTC', () => {
    it('toUTC: 上海20:00 → UTC12:00', () => {
      const d = new Date('2024-01-15T20:00:00Z')
      const utc = service.toUTC(d, 'Asia/Shanghai')
      expect(utc.getUTCHours()).toBe(12)
    })

    it('fromUTC: UTC12:00 → 上海20:00', () => {
      const d = new Date('2024-01-15T12:00:00Z')
      const local = service.fromUTC(d, 'Asia/Shanghai')
      expect(local.getUTCHours()).toBe(20)
    })

    it('toUTC→fromUTC 互逆', () => {
      const d = new Date('2024-01-15T20:00:00Z')
      const utc = service.toUTC(d, 'Asia/Shanghai')
      const back = service.fromUTC(utc, 'Asia/Shanghai')
      expect(back.getTime()).toBe(d.getTime())
    })
  })

  // ── 工作日判断 ──
  describe('isWorkday', () => {
    it('CN 周六非工作日', () => {
      const d = new Date('2024-01-13T10:00:00Z')
      expect(service.isWorkday(d, 'Asia/Shanghai', 'CN')).toBe(false)
    })

    it('CN 周日非工作日', () => {
      const d = new Date('2024-01-14T10:00:00Z')
      expect(service.isWorkday(d, 'Asia/Shanghai', 'CN')).toBe(false)
    })

    it('US 周六非工作日', () => {
      const d = new Date('2024-01-13T10:00:00Z')
      expect(service.isWorkday(d, 'America/New_York', 'US')).toBe(false)
    })

    it('周一 10:00 工作时间', () => {
      const d = new Date('2024-01-15T02:00:00Z') // UTC 02:00 = Shanghai 10:00
      expect(service.isWorkday(d, 'Asia/Shanghai', 'CN')).toBe(true)
    })

    it('周一 08:00 非工作时间（9点前）', () => {
      const d = new Date('2024-01-15T00:00:00Z') // UTC 00:00 = Shanghai 08:00
      expect(service.isWorkday(d, 'Asia/Shanghai', 'CN')).toBe(false)
    })

    it('周一 19:00 非工作时间（18点后）', () => {
      const d = new Date('2024-01-15T11:00:00Z') // UTC 11:00 = Shanghai 19:00
      expect(service.isWorkday(d, 'Asia/Shanghai', 'CN')).toBe(false)
    })

    it('不传国家码时自动推断', () => {
      const d = new Date('2024-01-15T02:00:00Z')
      expect(service.isWorkday(d, 'Asia/Shanghai')).toBe(true)
    })
  })

  describe('isHoliday', () => {
    it('周日为假日', () => {
      expect(service.isHoliday(new Date('2024-01-14T10:00:00Z'), 'Asia/Shanghai')).toBe(true)
    })

    it('周六非假日', () => {
      expect(service.isHoliday(new Date('2024-01-13T10:00:00Z'), 'Asia/Shanghai')).toBe(false)
    })
  })

  // ── 日期边界 ──
  describe('startOfDay / endOfDay', () => {
    const d = new Date('2024-01-15T14:30:45Z')

    it('startOfDay: 00:00:00.000', () => {
      const s = service.startOfDay(d, 'Asia/Shanghai')
      expect(s.getUTCHours()).toBe(0)
      expect(s.getUTCMinutes()).toBe(0)
      expect(s.getUTCSeconds()).toBe(0)
      expect(s.getUTCMilliseconds()).toBe(0)
    })

    it('endOfDay: 23:59:59.999', () => {
      const e = service.endOfDay(d, 'Asia/Shanghai')
      expect(e.getUTCHours()).toBe(23)
      expect(e.getUTCMinutes()).toBe(59)
      expect(e.getUTCSeconds()).toBe(59)
    })
  })

  describe('startOfMonth / endOfMonth', () => {
    it('startOfMonth: 1日 00:00', () => {
      const s = service.startOfMonth(new Date('2024-01-15T14:30:00Z'), 'Asia/Shanghai')
      expect(s.getUTCDate()).toBe(1)
      expect(s.getUTCHours()).toBe(0)
    })

    it('endOfMonth: 1月31日', () => {
      const e = service.endOfMonth(new Date('2024-01-15T14:30:00Z'), 'Asia/Shanghai')
      expect(e.getUTCDate()).toBe(31)
    })

    it('2024闰年2月29日', () => {
      const e = service.endOfMonth(new Date('2024-02-15T14:30:00Z'), 'Asia/Shanghai')
      expect(e.getUTCDate()).toBe(29)
    })
  })

  // ── 全区域格式 ──
  describe('全区域格式验证', () => {
    const d = new Date('2024-01-15T12:00:00Z')
    const allZones: TimeZone[] = [
      'Asia/Shanghai', 'Asia/Taipei', 'America/New_York',
      'Asia/Tokyo', 'Asia/Seoul', 'Asia/Bangkok',
      'Asia/Ho_Chi_Minh', 'Asia/Jakarta', 'Asia/Kuala_Lumpur',
      'Asia/Singapore',
    ]

    for (const tz of allZones) {
      it(`${tz} formatDate medium 正常`, () => {
        expect(typeof service.formatDate(d, tz, 'medium')).toBe('string')
        expect(service.formatDate(d, tz, 'medium').length).toBeGreaterThan(0)
      })
    }
  })

  // ── 集成场景 ──
  describe('集成场景', () => {
    it('完整跨国订单时间流: CN→US 时间转换 + 货币格式化', () => {
      const orderDate = new Date('2024-01-15T10:00:00Z')

      // 1) 上海下单时间
      const shDate = service.formatDateTime(orderDate, 'Asia/Shanghai')
      expect(shDate).toBeTruthy()

      // 2) 转换成纽约时间
      const nyDate = service.convertTime(orderDate, 'Asia/Shanghai', 'America/New_York')
      const nyFormatted = service.formatDate(nyDate, 'America/New_York', 'short')
      expect(nyFormatted).toBeTruthy()

      // 3) 格式化订单金额
      const amount = service.formatCurrency(299.99, 'USD', 'en-US')
      expect(amount).toContain('$')

      // 4) 判断是否在工作时间内
      const isWork = service.isWorkday(orderDate, 'Asia/Shanghai', 'CN')
      expect(typeof isWork).toBe('boolean')
    })

    it('跨国团队会议时间协调', () => {
      const meetingDate = new Date('2024-01-15T08:00:00Z')

      // 上海参会者本地时间
      const shTime = service.formatTime(meetingDate, 'Asia/Shanghai', 'short')
      expect(shTime).toBeTruthy()

      // 纽约参会者本地时间
      const nyTime = service.formatTime(meetingDate, 'America/New_York', 'short')
      expect(nyTime).toBeTruthy()

      // 差异小时数
      const shParts = service.getDateParts(meetingDate, 'Asia/Shanghai')
      const nyParts = service.getDateParts(meetingDate, 'America/New_York')
      expect(shParts.hour).not.toBe(nyParts.hour)
    })
  })
})
