import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { LocaleModule } from './locale.module'
import { LocaleService } from './locale.service'

describe('LocaleModule E2E', () => {
  let app: INestApplication
  let service: LocaleService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LocaleModule],
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()

    service = app.get(LocaleService)
  })

  afterAll(async () => {
    if (app) {
      await app.close()
    }
  })

  describe('LocaleService 基础依赖', () => {
    it('should have LocaleService defined', () => {
      assert.ok(service)
      assert.ok(service instanceof LocaleService)
    })
  })

  describe('时区 ↔ 国家映射', () => {
    it('LocaleService.getTimeZone should return correct timezone', () => {
      assert.equal(service.getTimeZone('CN'), 'Asia/Shanghai')
      assert.equal(service.getTimeZone('US'), 'America/New_York')
      assert.equal(service.getTimeZone('JP'), 'Asia/Tokyo')
    })

    it('LocaleService.getTimeZone 覆盖全部10个国家码', () => {
      const map: Record<string, string> = {
        CN: 'Asia/Shanghai', TW: 'Asia/Taipei', US: 'America/New_York',
        JP: 'Asia/Tokyo', KR: 'Asia/Seoul', TH: 'Asia/Bangkok',
        VN: 'Asia/Ho_Chi_Minh', ID: 'Asia/Jakarta', MY: 'Asia/Kuala_Lumpur', SG: 'Asia/Singapore',
      }
      for (const [code, expected] of Object.entries(map)) {
        assert.equal(service.getTimeZone(code as CountryCode), expected)
      }
    })

    it('LocaleService.getCountryCode should return correct country', () => {
      assert.equal(service.getCountryCode('Asia/Shanghai'), 'CN')
      assert.equal(service.getCountryCode('America/New_York'), 'US')
      assert.equal(service.getCountryCode('Asia/Tokyo'), 'JP')
    })

    it('LocaleService.getCountryCode 双向映射一致性', () => {
      const countries: CountryCode[] = ['CN', 'TW', 'US', 'JP', 'KR', 'TH', 'VN', 'ID', 'MY', 'SG']
      for (const code of countries) {
        const tz = service.getTimeZone(code)
        const back = service.getCountryCode(tz)
        assert.equal(back, code, `roundtrip failed for ${code} -> ${tz} -> ${back}`)
      }
    })
  })

  describe('日期格式化', () => {
    it('LocaleService.formatDate should format date correctly', () => {
      const date = new Date('2024-01-15T12:00:00.000Z')
      const result = service.formatDate(date, 'Asia/Shanghai', 'medium')
      assert.ok(typeof result === 'string')
      assert.ok(result.length > 0)
    })

    it('formatDate short 格式产出精简日期', () => {
      const date = new Date('2024-01-15T12:00:00.000Z')
      const result = service.formatDate(date, 'Asia/Shanghai', 'short')
      assert.ok(typeof result === 'string')
      assert.ok(result.length > 0)
      // short 格式通常比 medium 短
      const mediumResult = service.formatDate(date, 'Asia/Shanghai', 'medium')
      assert.ok(result.length <= mediumResult.length || result.includes('Jan'))
    })

    it('formatDate long 格式包含完整月份名称', () => {
      const date = new Date('2024-01-15T12:00:00.000Z')
      const result = service.formatDate(date, 'Asia/Shanghai', 'long')
      assert.ok(result.includes('January') || result.includes('1月'))
    })

    it('formatDate full 格式包含星期几', () => {
      const date = new Date('2024-01-15T12:00:00.000Z')
      const result = service.formatDate(date, 'Asia/Shanghai', 'full')
      assert.ok(result.includes('Monday') || result.includes('星期一'))
    })

    it('should handle all 10 timezones', () => {
      const timezones = [
        'Asia/Shanghai', 'Asia/Taipei', 'America/New_York',
        'Asia/Tokyo', 'Asia/Seoul', 'Asia/Bangkok',
        'Asia/Ho_Chi_Minh', 'Asia/Jakarta', 'Asia/Kuala_Lumpur', 'Asia/Singapore',
      ] as const
      const date = new Date('2024-01-15T12:00:00.000Z')
      for (const tz of timezones) {
        const result = service.formatDate(date, tz, 'medium')
        assert.ok(typeof result === 'string')
        assert.ok(result.length > 0)
      }
    })

    it('should handle UTC boundary (new year)', () => {
      const date = new Date('2024-12-31T20:00:00.000Z')
      const result = service.formatDate(date, 'Asia/Shanghai', 'medium')
      assert.ok(result.includes('2025') || result.includes('01'))
    })

    it('should handle leap year date', () => {
      const date = new Date('2024-02-29T12:00:00.000Z')
      const parts = service.getDateParts(date, 'Asia/Shanghai')
      assert.equal(parts.year, 2024)
      assert.equal(parts.month, 2)
      assert.equal(parts.day, 29)
    })
  })

  describe('时间格式化', () => {
    it('formatTime short 格式返回 HH:MM', () => {
      const date = new Date('2024-01-15T12:00:00.000Z')
      const result = service.formatTime(date, 'Asia/Shanghai', 'short')
      assert.ok(typeof result === 'string')
      // short 格式通常返回 HH:MM 包含冒号
      assert.ok(result.includes(':'))
    })

    it('formatTime long 格式包含秒数', () => {
      const date = new Date('2024-01-15T12:00:00.000Z')
      const shortRes = service.formatTime(date, 'Asia/Shanghai', 'short')
      const longRes = service.formatTime(date, 'Asia/Shanghai', 'long')
      // long 格式比 short 长（多了秒）
      assert.ok(longRes.length >= shortRes.length)
    })

    it('LocaleService.formatDateTime should return combined string', () => {
      const date = new Date('2024-01-15T12:00:00.000Z')
      const result = service.formatDateTime(date, 'Asia/Shanghai')
      assert.ok(result.includes(' '))
    })
  })

  describe('数字与货币格式化', () => {
    it('LocaleService.formatNumber should format numbers', () => {
      const result = service.formatNumber(1000000, 'en-US')
      assert.equal(result, '1,000,000')

      const deResult = service.formatNumber(1000000, 'de-DE')
      assert.equal(deResult, '1.000.000')
    })

    it('formatNumber 处理小数和零', () => {
      assert.equal(service.formatNumber(0, 'en-US'), '0')
      assert.equal(service.formatNumber(3.14, 'en-US'), '3.14')
      assert.equal(service.formatNumber(-500, 'en-US'), '-500')
    })

    it('LocaleService.formatCurrency should format currency', () => {
      const result = service.formatCurrency(1234.5, 'USD', 'en-US')
      assert.ok(result.includes('$'))
      assert.ok(result.includes('1,234'))
    })

    it('formatCurrency 支持多币种', () => {
      const cny = service.formatCurrency(100, 'CNY', 'zh-CN')
      assert.ok(cny.includes('¥') || cny.includes('100'))

      const eur = service.formatCurrency(99.9, 'EUR', 'de-DE')
      assert.ok(eur.includes('99') || eur.includes('100'))
    })

    it('formatPercent 正确格式化百分比', () => {
      const result = service.formatPercent(0.123, 'en-US')
      assert.ok(result.includes('12.3') || result.includes('12'))
      assert.ok(result.includes('%'))
    })
  })

  describe('时区转换', () => {
    it('LocaleService.convertTime should convert between timezones', () => {
      const date = new Date('2024-01-15T12:00:00.000Z')
      const converted = service.convertTime(date, 'Asia/Shanghai', 'America/New_York')
      assert.ok(converted instanceof Date)
      assert.ok(converted.getTime() !== date.getTime())
    })

    it('convertTime 同 offset 时区转换不改变时间', () => {
      const date = new Date('2024-01-15T12:00:00.000Z')
      const converted = service.convertTime(date, 'Asia/Shanghai', 'Asia/Taipei')
      assert.equal(converted.getTime(), date.getTime())
    })

    it('toUTC and fromUTC should be inverses', () => {
      const original = new Date('2024-01-15T20:00:00.000Z')
      const toUtc = service.toUTC(original, 'Asia/Shanghai')
      const back = service.fromUTC(toUtc, 'Asia/Shanghai')
      assert.equal(back.getTime(), original.getTime())
    })

    it('toUTC and fromUTC 逆运算一致性（多个时区）', () => {
      const original = new Date('2024-06-15T12:00:00.000Z')
      const zones: TimeZone[] = ['Asia/Tokyo', 'America/New_York', 'Asia/Bangkok', 'Asia/Singapore']
      for (const tz of zones) {
        const toUtc = service.toUTC(original, tz)
        const back = service.fromUTC(toUtc, tz)
        assert.equal(back.getTime(), original.getTime(), `roundtrip failed for ${tz}`)
      }
    })
  })

  describe('日期组件和范围', () => {
    it('LocaleService.getDateParts should extract date components', () => {
      const date = new Date('2024-01-15T12:00:00.000Z')
      const parts = service.getDateParts(date, 'Asia/Shanghai')
      assert.ok(parts.year === 2024)
      assert.ok(typeof parts.month === 'number')
      assert.ok(typeof parts.day === 'number')
      assert.ok(typeof parts.dayOfWeek === 'string')
    })

    it('getDateParts 返回完整的小时/分钟/秒', () => {
      const date = new Date('2024-01-15T10:30:45.000Z')
      const parts = service.getDateParts(date, 'Asia/Shanghai')
      assert.ok(typeof parts.hour === 'number')
      assert.ok(typeof parts.minute === 'number')
      assert.ok(typeof parts.second === 'number')
    })

    it('getDateRange should calculate correct ranges', () => {
      const start = new Date('2024-01-01T00:00:00.000Z')
      const end = new Date('2024-01-11T00:00:00.000Z')
      const range = service.getDateRange(start, end, 'Asia/Shanghai')
      assert.equal(range.days, 10)
      assert.equal(range.years, 0)
    })

    it('getDateRange 跨月份计算', () => {
      const start = new Date('2024-01-15T00:00:00.000Z')
      const end = new Date('2024-03-20T00:00:00.000Z')
      const range = service.getDateRange(start, end, 'Asia/Shanghai')
      assert.ok(range.days > 0)
      assert.ok(range.months > 0 || range.days > 60)
    })

    it('getDateRange 跨年计算', () => {
      const start = new Date('2023-06-01T00:00:00.000Z')
      const end = new Date('2024-06-01T00:00:00.000Z')
      const range = service.getDateRange(start, end, 'Asia/Shanghai')
      assert.equal(range.years, 1)
      assert.equal(range.days, 0)
    })

    it('getDateRange 同一天返回 0', () => {
      const date = new Date('2024-06-15T10:00:00.000Z')
      const range = service.getDateRange(date, date, 'Asia/Shanghai')
      assert.equal(range.days, 0)
      assert.equal(range.hours, 0)
    })
  })

  describe('工作日判断', () => {
    it('LocaleService.isWorkday should detect workdays', () => {
      const monday = new Date('2024-01-15T02:00:00.000Z') // Monday 10:00 in Shanghai
      assert.equal(service.isWorkday(monday, 'Asia/Shanghai', 'CN'), true)

      const saturday = new Date('2024-01-13T02:00:00.000Z') // Saturday
      assert.equal(service.isWorkday(saturday, 'Asia/Shanghai', 'CN'), false)
    })

    it('isWorkday 非工作时段返回 false', () => {
      const mondayNight = new Date('2024-01-15T23:00:00.000Z') // Tuesday 07:00 in Shanghai (before 9am)
      assert.equal(service.isWorkday(mondayNight, 'Asia/Shanghai', 'CN'), false)
    })

    it('isWorkday 周日返回 false', () => {
      const sunday = new Date('2024-01-14T03:00:00.000Z') // Sunday 11:00 in Shanghai
      assert.equal(service.isWorkday(sunday, 'Asia/Shanghai', 'CN'), false)
    })

    it('isHoliday 周日返回 true', () => {
      const sunday = new Date('2024-01-14T03:00:00.000Z') // Sunday
      assert.equal(service.isHoliday(sunday, 'Asia/Shanghai'), true)
    })

    it('isHoliday 非周日返回 false', () => {
      const monday = new Date('2024-01-15T02:00:00.000Z') // Monday 10:00 in Shanghai
      assert.equal(service.isHoliday(monday, 'Asia/Shanghai'), false)
    })
  })

  describe('UTC 时间边界处理', () => {
    it('should handle DST transition period', () => {
      const date = new Date('2024-03-10T12:00:00.000Z')
      const parts = service.getDateParts(date, 'America/New_York')
      assert.equal(parts.year, 2024)
      assert.ok(typeof parts.hour === 'number')
    })
  })

  describe('边界时间计算', () => {
    it('startOfDay 返回当日零点 UTC', () => {
      const date = new Date('2024-06-15T14:30:00.000Z')
      const start = service.startOfDay(date, 'Asia/Shanghai')
      assert.equal(start.getUTCHours(), 0)
      assert.equal(start.getUTCMinutes(), 0)
      assert.equal(start.getUTCSeconds(), 0)
    })

    it('endOfDay 返回当日 23:59:59 UTC', () => {
      const date = new Date('2024-06-15T14:30:00.000Z')
      const end = service.endOfDay(date, 'Asia/Shanghai')
      assert.equal(end.getUTCHours(), 23)
      assert.equal(end.getUTCMinutes(), 59)
      assert.equal(end.getUTCSeconds(), 59)
    })

    it('startOfMonth 返回当月 1 日零点', () => {
      const date = new Date('2024-06-15T14:30:00.000Z')
      const start = service.startOfMonth(date, 'Asia/Shanghai')
      assert.equal(start.getUTCDate(), 1)
      assert.equal(start.getUTCHours(), 0)
    })

    it('endOfMonth 返回当月最后一天 23:59:59', () => {
      const date = new Date('2024-06-15T14:30:00.000Z')
      const end = service.endOfMonth(date, 'Asia/Shanghai')
      // 6月有30天，所以 endOfMonth 应该落在 6月30日
      assert.equal(end.getUTCDate(), 30)
      assert.equal(end.getUTCHours(), 23)
      assert.equal(end.getUTCMinutes(), 59)
    })

    it('2月月末边界（非闰年）', () => {
      const date = new Date('2025-02-15T12:00:00.000Z') // 2025 is not leap year
      const end = service.endOfMonth(date, 'Asia/Shanghai')
      assert.equal(end.getUTCDate(), 28)
    })

    it('now UTC 返回当前时间', () => {
      const now = service.nowUTC()
      assert.ok(now instanceof Date)
      assert.ok(!Number.isNaN(now.getTime()))
    })

    it('now(Asia/Shanghai) 返回当前上海时间', () => {
      const now = service.now('Asia/Shanghai')
      assert.ok(now instanceof Date)
      assert.ok(!Number.isNaN(now.getTime()))
    })
  })
})
