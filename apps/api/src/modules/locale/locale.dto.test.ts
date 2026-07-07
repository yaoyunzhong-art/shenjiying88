import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import 'reflect-metadata'
import { validate } from 'class-validator'
import {
  FormatDateDto,
  FormatNumberDto,
  FormatCurrencyDto,
  ConvertTimeDto,
  IsWorkdayDto,
  ConfigUpdateDto
} from './locale.dto'

describe('locale.dto: FormatDateDto', () => {
  it('should accept valid format date request', async () => {
    const dto = new FormatDateDto()
    dto.date = '2024-01-15T12:00:00.000Z'
    dto.timeZone = 'Asia/Shanghai'
    dto.format = 'medium'

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should accept all format types', async () => {
    for (const fmt of ['short', 'medium', 'long', 'full']) {
      const dto = new FormatDateDto()
      dto.date = '2024-01-15T12:00:00.000Z'
      dto.timeZone = 'Asia/Shanghai'
      dto.format = fmt
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    }
  })

  it('should reject invalid date string', async () => {
    const dto = new FormatDateDto()
    dto.date = 'not-a-date'
    dto.timeZone = 'Asia/Shanghai'
    dto.format = 'medium'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject invalid timezone', async () => {
    const dto = new FormatDateDto()
    dto.date = '2024-01-15T12:00:00.000Z'
    dto.timeZone = 'Invalid/Timezone'
    dto.format = 'medium'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject invalid format string', async () => {
    const dto = new FormatDateDto()
    dto.date = '2024-01-15T12:00:00.000Z'
    dto.timeZone = 'Asia/Shanghai'
    dto.format = 'invalid-format'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject missing fields', async () => {
    const dto = new FormatDateDto()
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('locale.dto: FormatNumberDto', () => {
  it('should accept valid format number request', async () => {
    const dto = new FormatNumberDto()
    dto.value = 1000000
    dto.locale = 'en-US'

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should accept zero value', async () => {
    const dto = new FormatNumberDto()
    dto.value = 0
    dto.locale = 'en-US'

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should accept negative value', async () => {
    const dto = new FormatNumberDto()
    dto.value = -5000
    dto.locale = 'en-US'

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject empty locale', async () => {
    const dto = new FormatNumberDto()
    dto.value = 100
    dto.locale = ''

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject missing value', async () => {
    const dto = new FormatNumberDto()
    dto.locale = 'en-US'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject missing locale', async () => {
    const dto = new FormatNumberDto()
    dto.value = 100

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject non-number value', async () => {
    const dto = new FormatNumberDto()
    ;(dto as any).value = 'not-a-number'
    dto.locale = 'en-US'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('locale.dto: FormatCurrencyDto', () => {
  it('should accept valid format currency request', async () => {
    const dto = new FormatCurrencyDto()
    dto.amount = 1234.5
    dto.currency = 'USD'
    dto.locale = 'en-US'

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should accept zero amount', async () => {
    const dto = new FormatCurrencyDto()
    dto.amount = 0
    dto.currency = 'USD'
    dto.locale = 'en-US'

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject negative amount', async () => {
    const dto = new FormatCurrencyDto()
    dto.amount = -100
    dto.currency = 'USD'
    dto.locale = 'en-US'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject empty currency', async () => {
    const dto = new FormatCurrencyDto()
    dto.amount = 100
    dto.currency = ''
    dto.locale = 'en-US'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject missing amount', async () => {
    const dto = new FormatCurrencyDto()
    dto.currency = 'USD'
    dto.locale = 'en-US'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject missing locale', async () => {
    const dto = new FormatCurrencyDto()
    dto.amount = 100
    dto.currency = 'USD'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('locale.dto: ConvertTimeDto', () => {
  it('should accept valid convert time request', async () => {
    const dto = new ConvertTimeDto()
    dto.date = '2024-01-15T12:00:00.000Z'
    dto.fromTz = 'Asia/Shanghai'
    dto.toTz = 'America/New_York'

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should accept same from/to timezone', async () => {
    const dto = new ConvertTimeDto()
    dto.date = '2024-01-15T12:00:00.000Z'
    dto.fromTz = 'Asia/Shanghai'
    dto.toTz = 'Asia/Shanghai'

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject invalid date string', async () => {
    const dto = new ConvertTimeDto()
    dto.date = 'invalid-date'
    dto.fromTz = 'Asia/Shanghai'
    dto.toTz = 'America/New_York'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject invalid from timezone', async () => {
    const dto = new ConvertTimeDto()
    dto.date = '2024-01-15T12:00:00.000Z'
    dto.fromTz = 'Invalid/Tz'
    dto.toTz = 'America/New_York'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject invalid to timezone', async () => {
    const dto = new ConvertTimeDto()
    dto.date = '2024-01-15T12:00:00.000Z'
    dto.fromTz = 'Asia/Shanghai'
    dto.toTz = 'Invalid/Tz'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject missing date', async () => {
    const dto = new ConvertTimeDto()
    dto.fromTz = 'Asia/Shanghai'
    dto.toTz = 'America/New_York'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('locale.dto: IsWorkdayDto', () => {
  it('should accept valid is-workday request with countryCode', async () => {
    const dto = new IsWorkdayDto()
    dto.date = '2024-01-15T02:00:00.000Z'
    dto.timeZone = 'Asia/Shanghai'
    dto.countryCode = 'CN'

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should accept valid is-workday request without countryCode', async () => {
    const dto = new IsWorkdayDto()
    dto.date = '2024-01-15T02:00:00.000Z'
    dto.timeZone = 'Asia/Shanghai'

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should accept all supported country codes', async () => {
    for (const cc of ['CN', 'TW', 'US', 'JP', 'KR', 'TH', 'VN', 'ID', 'MY', 'SG']) {
      const dto = new IsWorkdayDto()
      dto.date = '2024-01-15T02:00:00.000Z'
      dto.timeZone = 'Asia/Shanghai'
      dto.countryCode = cc
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    }
  })

  it('should reject invalid country code', async () => {
    const dto = new IsWorkdayDto()
    dto.date = '2024-01-15T02:00:00.000Z'
    dto.timeZone = 'Asia/Shanghai'
    dto.countryCode = 'XX'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject invalid date', async () => {
    const dto = new IsWorkdayDto()
    dto.date = 'bad-date'
    dto.timeZone = 'Asia/Shanghai'
    dto.countryCode = 'CN'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject missing required fields', async () => {
    const dto = new IsWorkdayDto()

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('locale.dto: ConfigUpdateDto', () => {
  it('should accept valid config update with all fields', async () => {
    const dto = new ConfigUpdateDto()
    dto.defaultTimeZone = 'Asia/Tokyo'
    dto.dateFormat = 'long'
    dto.locale = 'ja-JP'

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should accept empty config update (all optional)', async () => {
    const dto = new ConfigUpdateDto()

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should accept partial update with only defaultTimeZone', async () => {
    const dto = new ConfigUpdateDto()
    dto.defaultTimeZone = 'America/New_York'

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should accept partial update with only dateFormat', async () => {
    const dto = new ConfigUpdateDto()
    dto.dateFormat = 'full'

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should accept partial update with only locale', async () => {
    const dto = new ConfigUpdateDto()
    dto.locale = 'en-US'

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject invalid timezone', async () => {
    const dto = new ConfigUpdateDto()
    dto.defaultTimeZone = 'Invalid/Tz'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject invalid dateFormat', async () => {
    const dto = new ConfigUpdateDto()
    dto.dateFormat = 'invalid-format'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})
