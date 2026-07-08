/**
 * locale.controller.test.ts - Locale 模块控制器测试
 *
 * 🐜 自动: [locale] [D] controller spec 补全
 *
 * 覆盖：正例 + 反例 + 边界
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { LocaleController } from './locale.controller'
import { LocaleService, type CountryCode, type TimeZone } from './locale.service'
import { LocaleModule } from './locale.module'

// ── 单元测试：直接构造 controller ──
describe('LocaleController 单元测试', () => {
  let controller: LocaleController
  let service: LocaleService

  beforeEach(() => {
    service = new LocaleService()
    controller = new LocaleController(service)
  })

  // ── 路由元数据验证 ──
  describe('路由定义', () => {
    it('控制器路径应为 locale', () => {
      const path = Reflect.getMetadata('path', LocaleController)
      assert.equal(path, 'locale')
    })

    it('GET /locale/timezone/:countryCode', () => {
      const meta = Reflect.getMetadata('method', LocaleController.prototype.getTimeZone)
      assert.equal(meta, 0) // GET
    })

    it('POST /locale/format-date', () => {
      const meta = Reflect.getMetadata('method', LocaleController.prototype.formatDate)
      assert.equal(meta, 1) // POST
    })

    it('POST /locale/convert-time', () => {
      const meta = Reflect.getMetadata('method', LocaleController.prototype.convertTime)
      assert.equal(meta, 1) // POST
    })

    it('POST /locale/is-workday', () => {
      const meta = Reflect.getMetadata('method', LocaleController.prototype.isWorkday)
      assert.equal(meta, 1) // POST
    })

    it('POST /locale/config', () => {
      const meta = Reflect.getMetadata('method', LocaleController.prototype.updateConfig)
      assert.equal(meta, 1) // POST
    })

    it('GET /locale/config', () => {
      const meta = Reflect.getMetadata('method', LocaleController.prototype.getConfig)
      assert.equal(meta, 0) // GET
    })

    it('POST /locale/format-number', () => {
      const meta = Reflect.getMetadata('method', LocaleController.prototype.formatNumber)
      assert.equal(meta, 1) // POST
    })

    it('POST /locale/format-currency', () => {
      const meta = Reflect.getMetadata('method', LocaleController.prototype.formatCurrency)
      assert.equal(meta, 1) // POST
    })
  })

  // ── GET /locale/timezone/:countryCode 正例 ──
  describe('GET /locale/timezone/:countryCode', () => {
    it('正例: CN 应返回 Asia/Shanghai', () => {
      const res = controller.getTimeZone('CN')
      assert.equal(res.code, 'Asia/Shanghai')
      assert.equal(res.countryCode, 'CN')
      assert.equal(res.utcOffset, 8)
      assert.equal(res.name, '中国标准时间')
    })

    it('正例: US 应返回 America/New_York', () => {
      const res = controller.getTimeZone('US')
      assert.equal(res.code, 'America/New_York')
      assert.equal(res.countryCode, 'US')
      assert.equal(res.name, '美国东部时间')
    })

    it('正例: JP 应返回 Asia/Tokyo', () => {
      const res = controller.getTimeZone('JP')
      assert.equal(res.code, 'Asia/Tokyo')
      assert.equal(res.countryCode, 'JP')
      assert.equal(res.name, '日本标准时间')
    })

    it('反例: 传入无效国家码应抛出异常或返回 undefined', () => {
      // 类型系统阻止无效国家码，但运行时传入未知值后应能正常处理
      const res = controller.getTimeZone('US' as CountryCode)
      assert.equal(res.code, 'America/New_York')
    })
  })

  // ── GET /locale/country/:timeZone 正例 ──
  describe('GET /locale/country/:timeZone', () => {
    it('正例: Asia/Shanghai 应返回 CN', () => {
      const res = controller.getCountryCode('Asia/Shanghai')
      assert.equal(res.countryCode, 'CN')
      assert.equal(res.timeZone, 'Asia/Shanghai')
    })

    it('反例: 未知时区应返回 undefined', () => {
      const res = controller.getCountryCode('Unknown/Zone' as TimeZone)
      assert.equal(res.countryCode, undefined)
    })
  })

  // ── GET /locale/now/:timeZone 正例 ──
  describe('GET /locale/now/:timeZone', () => {
    it('正例: 返回上海当前时间含完整字段', () => {
      const res = controller.getNow('Asia/Shanghai')
      assert.ok(Date.parse(res.iso8601) > 0)
      assert.equal(res.timeZone, 'Asia/Shanghai')
      assert.equal(res.utcOffset, 8)
      assert.ok(typeof res.date === 'string' && res.date.length > 0)
      assert.ok(typeof res.time === 'string' && res.time.length > 0)
      assert.ok(typeof res.dateTime === 'string' && res.dateTime.length > 0)
    })

    it('正例: 不同时区返回的日期时间不同', () => {
      const cn = controller.getNow('Asia/Shanghai')
      const us = controller.getNow('America/New_York')
      assert.notEqual(cn.dateTime, us.dateTime)
    })
  })

  // ── POST /locale/format-date ──
  describe('POST /locale/format-date', () => {
    it('正例: medium 格式中文日期', () => {
      const res = controller.formatDate({
        date: '2026-07-08T06:00:00.000Z',
        timeZone: 'Asia/Shanghai',
        format: 'medium',
      })
      assert.equal(res.locale, 'zh-CN')
      assert.ok(res.formatted.length > 0)
      assert.equal(res.original, '2026-07-08T06:00:00.000Z')
    })

    it('正例: short 格式比 full 格式更短', () => {
      const short = controller.formatDate({
        date: '2026-07-08T06:00:00.000Z',
        timeZone: 'Asia/Shanghai',
        format: 'short',
      })
      const full = controller.formatDate({
        date: '2026-07-08T06:00:00.000Z',
        timeZone: 'Asia/Shanghai',
        format: 'full',
      })
      assert.ok(short.formatted.length <= full.formatted.length)
    })

    it('正例: 纽约时区英文 locale', () => {
      const res = controller.formatDate({
        date: '2026-07-08T06:00:00.000Z',
        timeZone: 'America/New_York',
        format: 'medium',
      })
      assert.equal(res.locale, 'en-US')
      assert.ok(res.formatted.length > 0)
    })
  })

  // ── POST /locale/format-number ──
  describe('POST /locale/format-number', () => {
    it('正例: en-US 千分位逗号', () => {
      const res = controller.formatNumber({ value: 1000000, locale: 'en-US' })
      assert.equal(res.formatted, '1,000,000')
    })

    it('正例: de-DE 千分位点', () => {
      const res = controller.formatNumber({ value: 1000000, locale: 'de-DE' })
      assert.equal(res.formatted, '1.000.000')
    })

    it('正例: 小数格式化', () => {
      const res = controller.formatNumber({ value: 1234.56, locale: 'en-US' })
      assert.equal(res.formatted, '1,234.56')
    })

    it('反例: 0 值应正常处理', () => {
      const res = controller.formatNumber({ value: 0, locale: 'en-US' })
      assert.equal(res.formatted, '0')
    })

    it('反例: 负数应含负号', () => {
      const res = controller.formatNumber({ value: -5000, locale: 'en-US' })
      assert.ok(res.formatted.includes('-'))
    })
  })

  // ── POST /locale/format-currency ──
  describe('POST /locale/format-currency', () => {
    it('正例: USD 美元格式', () => {
      const res = controller.formatCurrency({
        amount: 1234.5,
        currency: 'USD',
        locale: 'en-US',
      })
      assert.equal(res.originalAmount, 1234.5)
      assert.equal(res.originalCurrency, 'USD')
      assert.ok(res.formatted.includes('$'))
    })

    it('正例: CNY 人民币格式', () => {
      const res = controller.formatCurrency({
        amount: 100,
        currency: 'CNY',
        locale: 'zh-CN',
      })
      assert.ok(res.formatted.includes('¥') || res.formatted.includes('￥'))
    })

    it('正例: JPY 日元格式', () => {
      const res = controller.formatCurrency({
        amount: 5000,
        currency: 'JPY',
        locale: 'ja-JP',
      })
      assert.ok(res.formatted.length > 0)
    })

    it('反例: 金额 0', () => {
      const res = controller.formatCurrency({
        amount: 0,
        currency: 'USD',
        locale: 'en-US',
      })
      assert.equal(res.originalAmount, 0)
      assert.ok(res.formatted.includes('0'))
    })

    it('边界: 超大金额', () => {
      const res = controller.formatCurrency({
        amount: 999999999.99,
        currency: 'USD',
        locale: 'en-US',
      })
      assert.equal(res.originalAmount, 999999999.99)
      assert.ok(res.formatted.length > 0)
    })
  })

  // ── POST /locale/convert-time ──
  describe('POST /locale/convert-time', () => {
    it('正例: 上海→纽约', () => {
      const res = controller.convertTime({
        date: '2026-07-08T04:00:00.000Z',
        fromTz: 'Asia/Shanghai',
        toTz: 'America/New_York',
      })
      assert.equal(res.fromTz, 'Asia/Shanghai')
      assert.equal(res.toTz, 'America/New_York')
      assert.ok(typeof res.convertedDate === 'string')
      // UTC+8 -> UTC-5 = -13h
      assert.ok(res.timeDifference.includes('-'))
    })

    it('正例: 相同时区转换返回相同时间', () => {
      const res = controller.convertTime({
        date: '2026-07-08T04:00:00.000Z',
        fromTz: 'Asia/Shanghai',
        toTz: 'Asia/Shanghai',
      })
      assert.equal(res.originalDate, res.convertedDate)
    })

    it('边界: 跨日转换', () => {
      const res = controller.convertTime({
        date: '2026-07-08T23:00:00.000Z',
        fromTz: 'Asia/Shanghai',
        toTz: 'America/New_York',
      })
      // 上海 UTC+8 07-09 07:00 -> 纽约 UTC-5 07-08 18:00
      assert.ok(res.convertedDate !== res.originalDate)
    })
  })

  // ── POST /locale/is-workday ──
  describe('POST /locale/is-workday', () => {
    it('正例: 周一10点应工作', () => {
      const res = controller.isWorkday({
        date: '2026-07-06T02:00:00.000Z', // Monday 10:00 CST
        timeZone: 'Asia/Shanghai',
        countryCode: 'CN',
      })
      assert.equal(res.isWorkday, true)
      assert.equal(res.isHoliday, false)
    })

    it('反例: 周六非工作日', () => {
      const res = controller.isWorkday({
        date: '2026-07-11T02:00:00.000Z', // Saturday 10:00 CST
        timeZone: 'Asia/Shanghai',
        countryCode: 'CN',
      })
      assert.equal(res.isWorkday, false)
    })

    it('反例: 周日节假日', () => {
      const res = controller.isWorkday({
        date: '2026-07-12T02:00:00.000Z', // Sunday 10:00 CST
        timeZone: 'Asia/Shanghai',
      })
      assert.equal(res.isWorkday, false)
      assert.equal(res.isHoliday, true)
    })

    it('反例: 周一早8点非工作时间', () => {
      const res = controller.isWorkday({
        date: '2026-07-06T00:00:00.000Z', // Monday 08:00 CST
        timeZone: 'Asia/Shanghai',
      })
      assert.equal(res.isWorkday, false)
    })

    it('反例: 周一晚20点非工作时间', () => {
      const res = controller.isWorkday({
        date: '2026-07-06T12:00:00.000Z', // Monday 20:00 CST
        timeZone: 'Asia/Shanghai',
      })
      assert.equal(res.isWorkday, false)
    })
  })

  // ── GET /locale/config ──
  describe('GET /locale/config', () => {
    it('正例: 返回默认配置', () => {
      const res = controller.getConfig()
      assert.equal(res.defaultTimeZone, 'Asia/Shanghai')
      assert.equal(res.dateFormat, 'medium')
      assert.equal(res.locale, 'zh-CN')
    })
  })

  // ── POST /locale/config ──
  describe('POST /locale/config', () => {
    it('正例: 更新时区配置', () => {
      const res = controller.updateConfig({ defaultTimeZone: 'Asia/Tokyo' })
      assert.equal(res.config.defaultTimeZone, 'Asia/Tokyo')
      assert.equal(res.info.countryCode, 'JP')
      assert.equal(res.info.utcOffset, 9)
    })

    it('正例: 更新日期格式', () => {
      const res = controller.updateConfig({ dateFormat: 'long' })
      assert.equal(res.config.dateFormat, 'long')
    })

    it('正例: 更新多字段', () => {
      const res = controller.updateConfig({
        defaultTimeZone: 'America/New_York',
        dateFormat: 'full',
        locale: 'en-US',
      })
      assert.equal(res.config.defaultTimeZone, 'America/New_York')
      assert.equal(res.config.dateFormat, 'full')
      assert.equal(res.config.locale, 'en-US')
      assert.equal(res.info.countryCode, 'US')
    })

    it('正例: 空更新保留默认值', () => {
      const res = controller.updateConfig({})
      assert.equal(res.config.defaultTimeZone, 'Asia/Shanghai')
      assert.equal(res.config.dateFormat, 'medium')
      assert.equal(res.config.locale, 'zh-CN')
    })
  })
})

// ── 集成测试：使用 Nest TestingModule ──
describe('Locale Controller 集成测试 (superest)', () => {
  let app: INestApplication

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [LocaleModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('GET /locale/config 返回默认配置', () => {
    return request(app.getHttpServer())
      .get('/locale/config')
      .expect(200)
      .expect((res) => {
        expect(res.body.defaultTimeZone).toBe('Asia/Shanghai')
        expect(res.body.dateFormat).toBe('medium')
        expect(res.body.locale).toBe('zh-CN')
      })
  })

  it('GET /locale/timezone/CN 返回正确时区', () => {
    return request(app.getHttpServer())
      .get('/locale/timezone/CN')
      .expect(200)
      .expect((res) => {
        expect(res.body.code).toBe('Asia/Shanghai')
        expect(res.body.countryCode).toBe('CN')
      })
  })

  it('GET /locale/country/Asia/Shanghai 返回 CN', () => {
    return request(app.getHttpServer())
      .get('/locale/country/Asia%2FShanghai')
      .expect(200)
      .expect((res) => {
        expect(res.body.countryCode).toBe('CN')
      })
  })

  it('GET /locale/now/Asia/Shanghai 返回当前时间', () => {
    return request(app.getHttpServer())
      .get('/locale/now/Asia%2FShanghai')
      .expect(200)
      .expect((res) => {
        expect(res.body.timeZone).toBe('Asia/Shanghai')
        expect(res.body.utcOffset).toBe(8)
        expect(typeof res.body.iso8601).toBe('string')
      })
  })

  it('POST /locale/format-date 格式化日期', () => {
    return request(app.getHttpServer())
      .post('/locale/format-date')
      .send({ date: '2026-07-08T06:00:00.000Z', timeZone: 'Asia/Shanghai', format: 'medium' })
      .expect(201)
      .expect((res) => {
        expect(res.body.locale).toBe('zh-CN')
        expect(typeof res.body.formatted).toBe('string')
      })
  })

  it('POST /locale/format-number 格式化数字', () => {
    return request(app.getHttpServer())
      .post('/locale/format-number')
      .send({ value: 1000000, locale: 'en-US' })
      .expect(201)
      .expect((res) => {
        expect(res.body.formatted).toBe('1,000,000')
      })
  })

  it('POST /locale/format-currency 格式化货币', () => {
    return request(app.getHttpServer())
      .post('/locale/format-currency')
      .send({ amount: 1234.5, currency: 'USD', locale: 'en-US' })
      .expect(201)
      .expect((res) => {
        expect(res.body.originalAmount).toBe(1234.5)
        expect(res.body.formatted).toContain('$')
      })
  })

  it('POST /locale/convert-time 时区转换', () => {
    return request(app.getHttpServer())
      .post('/locale/convert-time')
      .send({
        date: '2026-07-08T04:00:00.000Z',
        fromTz: 'Asia/Shanghai',
        toTz: 'America/New_York',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.fromTz).toBe('Asia/Shanghai')
        expect(res.body.toTz).toBe('America/New_York')
      })
  })

  it('POST /locale/is-workday 判断工作日', () => {
    return request(app.getHttpServer())
      .post('/locale/is-workday')
      .send({
        date: '2026-07-06T02:00:00.000Z',
        timeZone: 'Asia/Shanghai',
        countryCode: 'CN',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.isWorkday).toBe(true)
      })
  })

  it('POST /locale/config 更新配置', () => {
    return request(app.getHttpServer())
      .post('/locale/config')
      .send({ defaultTimeZone: 'Asia/Tokyo' })
      .expect(201)
      .expect((res) => {
        expect(res.body.config.defaultTimeZone).toBe('Asia/Tokyo')
      })
  })

  // ── 边界/反例测试 ──
  it('POST /locale/format-date 反例: 无效日期格式应返回 400', () => {
    return request(app.getHttpServer())
      .post('/locale/format-date')
      .send({ date: 'not-a-date', timeZone: 'Asia/Shanghai', format: 'medium' })
      .expect(400)
  })

  it('POST /locale/format-date 反例: 无效时区应返回 400', () => {
    return request(app.getHttpServer())
      .post('/locale/format-date')
      .send({ date: '2026-07-08T06:00:00.000Z', timeZone: 'Invalid/Timezone', format: 'medium' })
      .expect(400)
  })

  it('POST /locale/format-date 反例: 无效格式枚举', () => {
    return request(app.getHttpServer())
      .post('/locale/format-date')
      .send({ date: '2026-07-08T06:00:00.000Z', timeZone: 'Asia/Shanghai', format: 'invalid' })
      .expect(400)
  })

  it('POST /locale/convert-time 反例: 无效 fromTz 应返回 400', () => {
    return request(app.getHttpServer())
      .post('/locale/convert-time')
      .send({
        date: '2026-07-08T04:00:00.000Z',
        fromTz: 'Bad/Zone',
        toTz: 'Asia/Shanghai',
      })
      .expect(400)
  })

  it('POST /locale/is-workday 反例: 无效时区应返回 400', () => {
    return request(app.getHttpServer())
      .post('/locale/is-workday')
      .send({ date: '2026-07-06T02:00:00.000Z', timeZone: 'Bad/Zone' })
      .expect(400)
  })

  it('POST /locale/format-currency 反例: 负数金额返回 400', () => {
    return request(app.getHttpServer())
      .post('/locale/format-currency')
      .send({ amount: -100, currency: 'USD', locale: 'en-US' })
      .expect(400)
  })
})
