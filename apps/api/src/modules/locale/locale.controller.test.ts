import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { LocaleController } from './locale.controller'
import { LocaleService, type CountryCode, type TimeZone } from './locale.service'

describe('LocaleController', () => {
  let controller: LocaleController
  let service: LocaleService

  beforeEach(() => {
    service = new LocaleService()
    controller = new LocaleController(service)
  })

  describe('route metadata', () => {
    it('controller path metadata should be locale', () => {
      const path = Reflect.getMetadata('path', LocaleController)
      assert.equal(path, 'locale')
    })

    it('getTimeZone should have GET method and param path', () => {
      const method = Reflect.getMetadata('method', LocaleController.prototype.getTimeZone)
      const path = Reflect.getMetadata('path', LocaleController.prototype.getTimeZone)
      assert.equal(method, 0) // GET
      assert.equal(path, 'timezone/:countryCode')
    })

    it('getCountryCode should have GET method and param path', () => {
      const method = Reflect.getMetadata('method', LocaleController.prototype.getCountryCode)
      const path = Reflect.getMetadata('path', LocaleController.prototype.getCountryCode)
      assert.equal(method, 0) // GET
      assert.equal(path, 'country/:timeZone')
    })

    it('getNow should have GET method and param path', () => {
      const method = Reflect.getMetadata('method', LocaleController.prototype.getNow)
      const path = Reflect.getMetadata('path', LocaleController.prototype.getNow)
      assert.equal(method, 0) // GET
      assert.equal(path, 'now/:timeZone')
    })

    it('formatDate should have POST method', () => {
      const method = Reflect.getMetadata('method', LocaleController.prototype.formatDate)
      const path = Reflect.getMetadata('path', LocaleController.prototype.formatDate)
      assert.equal(method, 1) // POST
      assert.equal(path, 'format-date')
    })

    it('formatNumber should have POST method', () => {
      const method = Reflect.getMetadata('method', LocaleController.prototype.formatNumber)
      const path = Reflect.getMetadata('path', LocaleController.prototype.formatNumber)
      assert.equal(method, 1) // POST
      assert.equal(path, 'format-number')
    })

    it('formatCurrency should have POST method', () => {
      const method = Reflect.getMetadata('method', LocaleController.prototype.formatCurrency)
      const path = Reflect.getMetadata('path', LocaleController.prototype.formatCurrency)
      assert.equal(method, 1) // POST
      assert.equal(path, 'format-currency')
    })

    it('convertTime should have POST method', () => {
      const method = Reflect.getMetadata('method', LocaleController.prototype.convertTime)
      const path = Reflect.getMetadata('path', LocaleController.prototype.convertTime)
      assert.equal(method, 1) // POST
      assert.equal(path, 'convert-time')
    })

    it('isWorkday should have POST method', () => {
      const method = Reflect.getMetadata('method', LocaleController.prototype.isWorkday)
      const path = Reflect.getMetadata('path', LocaleController.prototype.isWorkday)
      assert.equal(method, 1) // POST
      assert.equal(path, 'is-workday')
    })

    it('getConfig should have GET method', () => {
      const method = Reflect.getMetadata('method', LocaleController.prototype.getConfig)
      const path = Reflect.getMetadata('path', LocaleController.prototype.getConfig)
      assert.equal(method, 0) // GET
      assert.equal(path, 'config')
    })

    it('updateConfig should have POST method', () => {
      const method = Reflect.getMetadata('method', LocaleController.prototype.updateConfig)
      const path = Reflect.getMetadata('path', LocaleController.prototype.updateConfig)
      assert.equal(method, 1) // POST
      assert.equal(path, 'config')
    })
  })

  describe('GET /locale/timezone/:countryCode', () => {
    it('should return timezone info for CN', () => {
      const result = controller.getTimeZone('CN')
      assert.equal(result.code, 'Asia/Shanghai')
      assert.equal(result.countryCode, 'CN')
      assert.equal(typeof result.name, 'string')
      assert.equal(typeof result.utcOffset, 'number')
    })

    it('should return timezone info for US', () => {
      const result = controller.getTimeZone('US')
      assert.equal(result.code, 'America/New_York')
      assert.equal(result.countryCode, 'US')
    })

    it('should return timezone info for JP', () => {
      const result = controller.getTimeZone('JP')
      assert.equal(result.code, 'Asia/Tokyo')
      assert.equal(result.countryCode, 'JP')
    })
  })

  describe('GET /locale/country/:timeZone', () => {
    it('should return country code for Asia/Shanghai', () => {
      const result = controller.getCountryCode('Asia/Shanghai')
      assert.equal(result.countryCode, 'CN')
      assert.equal(result.timeZone, 'Asia/Shanghai')
    })

    it('should return country code for America/New_York', () => {
      const result = controller.getCountryCode('America/New_York')
      assert.equal(result.countryCode, 'US')
    })
  })

  describe('GET /locale/now/:timeZone', () => {
    it('should return current time with correct shape', () => {
      const result = controller.getNow('Asia/Shanghai')
      assert.ok(typeof result.iso8601 === 'string')
      assert.ok(typeof result.date === 'string')
      assert.ok(typeof result.time === 'string')
      assert.ok(typeof result.dateTime === 'string')
      assert.equal(result.timeZone, 'Asia/Shanghai')
      assert.equal(typeof result.utcOffset, 'number')
    })

    it('should return different times for different timezones', () => {
      const shanghai = controller.getNow('Asia/Shanghai')
      const ny = controller.getNow('America/New_York')
      // TimeResponse has different date/time for different zones
      assert.notEqual(shanghai.dateTime, ny.dateTime)
    })
  })

  describe('POST /locale/format-date', () => {
    it('should format date correctly', () => {
      const result = controller.formatDate({
        date: '2024-01-15T12:00:00.000Z',
        timeZone: 'Asia/Shanghai',
        format: 'medium',
      })
      assert.ok(typeof result.formatted === 'string')
      assert.ok(result.formatted.length > 0)
      assert.equal(result.locale, 'zh-CN')
    })

    it('should format date with different format options', () => {
      const short = controller.formatDate({
        date: '2024-01-15T12:00:00.000Z',
        timeZone: 'Asia/Shanghai',
        format: 'short',
      })
      const full = controller.formatDate({
        date: '2024-01-15T12:00:00.000Z',
        timeZone: 'Asia/Shanghai',
        format: 'full',
      })
      assert.ok(short.formatted.length <= full.formatted.length)
    })

    it('should format date for US timezone', () => {
      const result = controller.formatDate({
        date: '2024-01-15T12:00:00.000Z',
        timeZone: 'America/New_York',
        format: 'medium',
      })
      assert.ok(typeof result.formatted === 'string')
      assert.equal(result.locale, 'en-US')
    })
  })

  describe('POST /locale/format-number', () => {
    it('should format number with en-US locale', () => {
      const result = controller.formatNumber({
        value: 1000000,
        locale: 'en-US',
      })
      assert.equal(result.formatted, '1,000,000')
      assert.equal(result.locale, 'en-US')
    })

    it('should format number with de-DE locale', () => {
      const result = controller.formatNumber({
        value: 1000000,
        locale: 'de-DE',
      })
      assert.equal(result.formatted, '1.000.000')
    })

    it('should format decimal number', () => {
      const result = controller.formatNumber({
        value: 1234.56,
        locale: 'en-US',
      })
      assert.equal(result.formatted, '1,234.56')
    })

    it('should format negative number', () => {
      const result = controller.formatNumber({
        value: -5000,
        locale: 'en-US',
      })
      assert.ok(result.formatted.includes('-'))
    })

    it('should format zero', () => {
      const result = controller.formatNumber({
        value: 0,
        locale: 'en-US',
      })
      assert.equal(result.formatted, '0')
    })
  })

  describe('POST /locale/format-currency', () => {
    it('should format USD', () => {
      const result = controller.formatCurrency({
        amount: 1234.5,
        currency: 'USD',
        locale: 'en-US',
      })
      assert.ok(result.formatted.includes('$'))
      assert.ok(result.formatted.includes('1,234'))
      assert.equal(result.originalAmount, 1234.5)
      assert.equal(result.originalCurrency, 'USD')
    })

    it('should format CNY', () => {
      const result = controller.formatCurrency({
        amount: 100,
        currency: 'CNY',
        locale: 'zh-CN',
      })
      assert.ok(result.formatted.includes('¥') || result.formatted.includes('￥') || result.formatted.includes('CN'))
    })

    it('should format JPY', () => {
      const result = controller.formatCurrency({
        amount: 5000,
        currency: 'JPY',
        locale: 'ja-JP',
      })
      assert.ok(result.formatted.includes('￥') || result.formatted.includes('¥'))
    })

    it('should format KRW', () => {
      const result = controller.formatCurrency({
        amount: 10000,
        currency: 'KRW',
        locale: 'ko-KR',
      })
      assert.ok(result.formatted.includes('₩'))
    })
  })

  describe('POST /locale/convert-time', () => {
    it('should convert time from Shanghai to New York', () => {
      const result = controller.convertTime({
        date: '2024-01-15T12:00:00.000Z',
        fromTz: 'Asia/Shanghai',
        toTz: 'America/New_York',
      })
      assert.equal(result.fromTz, 'Asia/Shanghai')
      assert.equal(result.toTz, 'America/New_York')
      assert.ok(typeof result.convertedDate === 'string')
      assert.ok(result.timeDifference.includes('h'))
    })

    it('should convert same timezone returns original', () => {
      const result = controller.convertTime({
        date: '2024-01-15T12:00:00.000Z',
        fromTz: 'Asia/Shanghai',
        toTz: 'Asia/Shanghai',
      })
      assert.equal(result.originalDate, result.convertedDate)
    })

    it('should calculate correct time difference', () => {
      const result = controller.convertTime({
        date: '2024-01-15T12:00:00.000Z',
        fromTz: 'Asia/Shanghai',
        toTz: 'America/New_York',
      })
      // Shanghai (+8) to NY (-5) = -13h
      assert.ok(result.timeDifference.includes('-'))
    })
  })

  describe('POST /locale/is-workday', () => {
    it('should return false for Saturday in CN', () => {
      const result = controller.isWorkday({
        date: '2024-01-13T02:00:00.000Z', // Saturday in Shanghai
        timeZone: 'Asia/Shanghai',
        countryCode: 'CN',
      })
      assert.equal(result.isWorkday, false)
    })

    it('should return true for Monday business hours in CN', () => {
      const result = controller.isWorkday({
        date: '2024-01-15T02:00:00.000Z', // Monday 10:00 in Shanghai
        timeZone: 'Asia/Shanghai',
        countryCode: 'CN',
      })
      assert.equal(result.isWorkday, true)
    })

    it('should include dayOfWeek in response', () => {
      const result = controller.isWorkday({
        date: '2024-01-15T02:00:00.000Z',
        timeZone: 'Asia/Shanghai',
      })
      assert.ok(typeof result.dayOfWeek === 'string')
      assert.ok(result.dayOfWeek.length > 0)
    })
  })

  describe('GET /locale/config', () => {
    it('should return default config', () => {
      const result = controller.getConfig()
      assert.equal(result.defaultTimeZone, 'Asia/Shanghai')
      assert.equal(result.dateFormat, 'medium')
      assert.equal(result.locale, 'zh-CN')
    })
  })

  describe('POST /locale/config', () => {
    it('should update timezone config', () => {
      const result = controller.updateConfig({
        defaultTimeZone: 'America/New_York',
      })
      assert.equal(result.config.defaultTimeZone, 'America/New_York')
      assert.equal(result.info.countryCode, 'US')
    })

    it('should update dateFormat config', () => {
      const result = controller.updateConfig({
        dateFormat: 'long',
      })
      assert.equal(result.config.dateFormat, 'long')
    })

    it('should update locale config', () => {
      const result = controller.updateConfig({
        locale: 'en-US',
      })
      assert.equal(result.config.locale, 'en-US')
    })

    it('should update multiple fields at once', () => {
      const result = controller.updateConfig({
        defaultTimeZone: 'Asia/Tokyo',
        dateFormat: 'full',
        locale: 'ja-JP',
      })
      assert.equal(result.config.defaultTimeZone, 'Asia/Tokyo')
      assert.equal(result.config.dateFormat, 'full')
      assert.equal(result.config.locale, 'ja-JP')
      assert.equal(result.info.countryCode, 'JP')
    })
  })
})
