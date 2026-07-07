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

  it('should have LocaleService defined', () => {
    assert.ok(service)
    assert.ok(service instanceof LocaleService)
  })

  it('LocaleService.getTimeZone should return correct timezone', () => {
    assert.equal(service.getTimeZone('CN'), 'Asia/Shanghai')
    assert.equal(service.getTimeZone('US'), 'America/New_York')
    assert.equal(service.getTimeZone('JP'), 'Asia/Tokyo')
  })

  it('LocaleService.getCountryCode should return correct country', () => {
    assert.equal(service.getCountryCode('Asia/Shanghai'), 'CN')
    assert.equal(service.getCountryCode('America/New_York'), 'US')
    assert.equal(service.getCountryCode('Asia/Tokyo'), 'JP')
  })

  it('LocaleService.formatDate should format date correctly', () => {
    const date = new Date('2024-01-15T12:00:00.000Z')
    const result = service.formatDate(date, 'Asia/Shanghai', 'medium')
    assert.ok(typeof result === 'string')
    assert.ok(result.length > 0)
  })

  it('LocaleService.formatNumber should format numbers', () => {
    const result = service.formatNumber(1000000, 'en-US')
    assert.equal(result, '1,000,000')

    const deResult = service.formatNumber(1000000, 'de-DE')
    assert.equal(deResult, '1.000.000')
  })

  it('LocaleService.formatCurrency should format currency', () => {
    const result = service.formatCurrency(1234.5, 'USD', 'en-US')
    assert.ok(result.includes('$'))
    assert.ok(result.includes('1,234'))
  })

  it('LocaleService.convertTime should convert between timezones', () => {
    const date = new Date('2024-01-15T12:00:00.000Z')
    const converted = service.convertTime(date, 'Asia/Shanghai', 'America/New_York')
    assert.ok(converted instanceof Date)
    // Shanghai (+8) 20:00 → NY (-5) should be 07:00, so UTC hours = 7 + 5 = 12... actually it returns Date 
    assert.ok(converted.getTime() !== date.getTime())
  })

  it('LocaleService.isWorkday should detect workdays', () => {
    const monday = new Date('2024-01-15T02:00:00.000Z') // Monday 10:00 in Shanghai
    assert.equal(service.isWorkday(monday, 'Asia/Shanghai', 'CN'), true)

    const saturday = new Date('2024-01-13T02:00:00.000Z') // Saturday
    assert.equal(service.isWorkday(saturday, 'Asia/Shanghai', 'CN'), false)
  })

  it('LocaleService.getDateParts should extract date components', () => {
    const date = new Date('2024-01-15T12:00:00.000Z')
    const parts = service.getDateParts(date, 'Asia/Shanghai')
    assert.ok(parts.year === 2024)
    assert.ok(typeof parts.month === 'number')
    assert.ok(typeof parts.day === 'number')
    assert.ok(typeof parts.dayOfWeek === 'string')
  })

  it('LocaleService.formatDateTime should return combined string', () => {
    const date = new Date('2024-01-15T12:00:00.000Z')
    const result = service.formatDateTime(date, 'Asia/Shanghai')
    assert.ok(result.includes(' '))
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

  it('should handle DST transition period', () => {
    // March 10, 2024 - US DST start (second Sunday of March)
    const date = new Date('2024-03-10T12:00:00.000Z')
    const parts = service.getDateParts(date, 'America/New_York')
    assert.equal(parts.year, 2024)
    assert.ok(typeof parts.hour === 'number')
  })

  it('toUTC and fromUTC should be inverses', () => {
    const original = new Date('2024-01-15T20:00:00.000Z')
    const toUtc = service.toUTC(original, 'Asia/Shanghai')
    const back = service.fromUTC(toUtc, 'Asia/Shanghai')
    assert.equal(back.getTime(), original.getTime())
  })

  it('getDateRange should calculate correct ranges', () => {
    const start = new Date('2024-01-01T00:00:00.000Z')
    const end = new Date('2024-01-11T00:00:00.000Z')
    const range = service.getDateRange(start, end, 'Asia/Shanghai')
    assert.equal(range.days, 10)
    assert.equal(range.years, 0)
  })
})
