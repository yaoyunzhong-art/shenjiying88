import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import type {
  TimeZoneInfo,
  LocaleConfig,
  FormatDateRequest,
  FormatNumberRequest,
  FormatCurrencyRequest,
  ConvertTimeRequest,
  IsWorkdayRequest,
  LocaleInfo,
  TimeResponse,
  FormatResponse,
  CurrencyFormatResponse,
  ConvertTimeResponse,
  WorkdayResponse,
} from './locale.entity'
import type { CountryCode, TimeZone } from './locale.service'

describe('locale.entity: CountryCode type', () => {
  it('supports all valid country codes', () => {
    const codes: CountryCode[] = ['CN', 'TW', 'US', 'JP', 'KR', 'TH', 'VN', 'ID', 'MY', 'SG']
    assert.equal(codes.length, 10)
  })

  it('CN is a valid CountryCode', () => {
    const code: CountryCode = 'CN'
    assert.equal(code, 'CN')
  })
})

describe('locale.entity: TimeZone type', () => {
  it('supports all valid timezones', () => {
    const tzs: TimeZone[] = [
      'Asia/Shanghai', 'Asia/Taipei', 'America/New_York',
      'Asia/Tokyo', 'Asia/Seoul', 'Asia/Bangkok',
      'Asia/Ho_Chi_Minh', 'Asia/Jakarta', 'Asia/Kuala_Lumpur', 'Asia/Singapore',
    ]
    assert.equal(tzs.length, 10)
  })

  it('Asia/Shanghai is a valid TimeZone', () => {
    const tz: TimeZone = 'Asia/Shanghai'
    assert.equal(tz, 'Asia/Shanghai')
  })
})

describe('locale.entity: TimeZoneInfo', () => {
  it('creates valid TimeZoneInfo', () => {
    const info: TimeZoneInfo = {
      code: 'Asia/Shanghai',
      name: '中国标准时间',
      utcOffset: 8,
      countryCode: 'CN',
    }
    assert.equal(info.code, 'Asia/Shanghai')
    assert.equal(info.name, '中国标准时间')
    assert.equal(info.utcOffset, 8)
    assert.equal(info.countryCode, 'CN')
  })

  it('handles negative offset', () => {
    const info: TimeZoneInfo = {
      code: 'America/New_York',
      name: '美国东部时间',
      utcOffset: -5,
      countryCode: 'US',
    }
    assert.equal(info.utcOffset, -5)
  })
})

describe('locale.entity: LocaleConfig', () => {
  it('creates valid LocaleConfig', () => {
    const config: LocaleConfig = {
      defaultTimeZone: 'Asia/Shanghai',
      dateFormat: 'medium',
      locale: 'zh-CN',
    }
    assert.equal(config.defaultTimeZone, 'Asia/Shanghai')
    assert.equal(config.dateFormat, 'medium')
    assert.equal(config.locale, 'zh-CN')
  })

  it('supports all date formats', () => {
    const formats: LocaleConfig['dateFormat'][] = ['short', 'medium', 'long', 'full']
    for (const fmt of formats) {
      const config: LocaleConfig = {
        defaultTimeZone: 'Asia/Tokyo',
        dateFormat: fmt,
        locale: 'ja-JP',
      }
      assert.equal(config.dateFormat, fmt)
    }
  })
})

describe('locale.entity: FormatDateRequest', () => {
  it('creates valid FormatDateRequest', () => {
    const req: FormatDateRequest = {
      date: new Date('2024-01-15T12:00:00Z'),
      timeZone: 'Asia/Shanghai',
      format: 'medium',
    }
    assert.equal(req.format, 'medium')
    assert.equal(req.timeZone, 'Asia/Shanghai')
    assert.ok(req.date instanceof Date)
  })

  it('supports all format types', () => {
    const formats: FormatDateRequest['format'][] = ['short', 'medium', 'long', 'full']
    for (const fmt of formats) {
      const req: FormatDateRequest = {
        date: new Date(),
        timeZone: 'America/New_York',
        format: fmt,
      }
      assert.equal(req.format, fmt)
    }
  })
})

describe('locale.entity: FormatNumberRequest', () => {
  it('creates valid FormatNumberRequest', () => {
    const req: FormatNumberRequest = {
      value: 1000000,
      locale: 'en-US',
    }
    assert.equal(req.value, 1000000)
    assert.equal(req.locale, 'en-US')
  })

  it('handles negative values', () => {
    const req: FormatNumberRequest = {
      value: -5000,
      locale: 'de-DE',
    }
    assert.equal(req.value, -5000)
  })

  it('handles zero', () => {
    const req: FormatNumberRequest = {
      value: 0,
      locale: 'zh-CN',
    }
    assert.equal(req.value, 0)
  })
})

describe('locale.entity: FormatCurrencyRequest', () => {
  it('creates valid FormatCurrencyRequest', () => {
    const req: FormatCurrencyRequest = {
      amount: 1234.5,
      currency: 'USD',
      locale: 'en-US',
    }
    assert.equal(req.amount, 1234.5)
    assert.equal(req.currency, 'USD')
  })

  it('handles zero amount', () => {
    const req: FormatCurrencyRequest = {
      amount: 0,
      currency: 'CNY',
      locale: 'zh-CN',
    }
    assert.equal(req.amount, 0)
  })

  it('handles JPY with no decimals', () => {
    const req: FormatCurrencyRequest = {
      amount: 5000,
      currency: 'JPY',
      locale: 'ja-JP',
    }
    assert.equal(req.amount, 5000)
    assert.equal(req.currency, 'JPY')
  })
})

describe('locale.entity: ConvertTimeRequest', () => {
  it('creates valid ConvertTimeRequest', () => {
    const req: ConvertTimeRequest = {
      date: new Date('2024-01-15T12:00:00Z'),
      fromTz: 'Asia/Shanghai',
      toTz: 'America/New_York',
    }
    assert.equal(req.fromTz, 'Asia/Shanghai')
    assert.equal(req.toTz, 'America/New_York')
    assert.ok(req.date instanceof Date)
  })

  it('supports same timezone conversion', () => {
    const req: ConvertTimeRequest = {
      date: new Date(),
      fromTz: 'Asia/Shanghai',
      toTz: 'Asia/Shanghai',
    }
    assert.equal(req.fromTz, req.toTz)
  })
})

describe('locale.entity: IsWorkdayRequest', () => {
  it('creates valid IsWorkdayRequest with countryCode', () => {
    const req: IsWorkdayRequest = {
      date: new Date('2024-01-15T02:00:00Z'),
      timeZone: 'Asia/Shanghai',
      countryCode: 'CN',
    }
    assert.equal(req.countryCode, 'CN')
    assert.equal(req.timeZone, 'Asia/Shanghai')
  })

  it('creates valid IsWorkdayRequest without countryCode', () => {
    const req: IsWorkdayRequest = {
      date: new Date('2024-01-15T02:00:00Z'),
      timeZone: 'Asia/Shanghai',
    }
    assert.equal(req.countryCode, undefined)
  })
})

describe('locale.entity: TimeResponse', () => {
  it('creates valid TimeResponse', () => {
    const res: TimeResponse = {
      iso8601: '2024-01-15T12:00:00.000Z',
      date: '2024/01/15',
      time: '12:00',
      dateTime: '2024/01/15 12:00',
      timeZone: 'Asia/Shanghai',
      utcOffset: 8,
    }
    assert.ok(res.iso8601.length > 0)
    assert.equal(res.timeZone, 'Asia/Shanghai')
    assert.equal(res.utcOffset, 8)
  })
})

describe('locale.entity: FormatResponse', () => {
  it('creates valid FormatResponse', () => {
    const res: FormatResponse = {
      original: '1000000',
      formatted: '1,000,000',
      locale: 'en-US',
    }
    assert.equal(res.original, '1000000')
    assert.equal(res.formatted, '1,000,000')
    assert.equal(res.locale, 'en-US')
  })
})

describe('locale.entity: CurrencyFormatResponse', () => {
  it('creates valid CurrencyFormatResponse', () => {
    const res: CurrencyFormatResponse = {
      originalAmount: 1234.5,
      originalCurrency: 'USD',
      formatted: '$1,234.50',
      locale: 'en-US',
    }
    assert.equal(res.originalAmount, 1234.5)
    assert.equal(res.originalCurrency, 'USD')
    assert.equal(res.formatted, '$1,234.50')
  })
})

describe('locale.entity: ConvertTimeResponse', () => {
  it('creates valid ConvertTimeResponse', () => {
    const res: ConvertTimeResponse = {
      originalDate: '2024-01-15T12:00:00.000Z',
      fromTz: 'Asia/Shanghai',
      convertedDate: '2024-01-15T07:00:00.000Z',
      toTz: 'America/New_York',
      timeDifference: 'UTC-13h',
    }
    assert.equal(res.fromTz, 'Asia/Shanghai')
    assert.equal(res.toTz, 'America/New_York')
    assert.equal(res.timeDifference, 'UTC-13h')
  })

  it('handles positive time difference', () => {
    const res: ConvertTimeResponse = {
      originalDate: '2024-01-15T07:00:00.000Z',
      fromTz: 'America/New_York',
      convertedDate: '2024-01-15T20:00:00.000Z',
      toTz: 'Asia/Shanghai',
      timeDifference: 'UTC+13h',
    }
    assert.equal(res.timeDifference, 'UTC+13h')
  })
})

describe('locale.entity: WorkdayResponse', () => {
  it('creates valid WorkdayResponse for workday', () => {
    const res: WorkdayResponse = {
      isWorkday: true,
      isHoliday: false,
      dayOfWeek: 'Monday',
      date: '2024-01-15T02:00:00.000Z',
      timeZone: 'Asia/Shanghai',
      countryCode: 'CN',
    }
    assert.equal(res.isWorkday, true)
    assert.equal(res.isHoliday, false)
    assert.equal(res.dayOfWeek, 'Monday')
  })

  it('creates valid WorkdayResponse for weekend', () => {
    const res: WorkdayResponse = {
      isWorkday: false,
      isHoliday: true,
      dayOfWeek: 'Sunday',
      date: '2024-01-14T10:00:00.000Z',
      timeZone: 'Asia/Shanghai',
      countryCode: 'CN',
    }
    assert.equal(res.isWorkday, false)
    assert.equal(res.isHoliday, true)
    assert.equal(res.dayOfWeek, 'Sunday')
  })
})

describe('locale.entity: LocaleInfo', () => {
  it('creates valid LocaleInfo', () => {
    const info: LocaleInfo = {
      timeZone: 'Asia/Shanghai',
      countryCode: 'CN',
      locale: 'zh-CN',
      utcOffset: 8,
    }
    assert.equal(info.timeZone, 'Asia/Shanghai')
    assert.equal(info.countryCode, 'CN')
    assert.equal(info.locale, 'zh-CN')
    assert.equal(info.utcOffset, 8)
  })
})
