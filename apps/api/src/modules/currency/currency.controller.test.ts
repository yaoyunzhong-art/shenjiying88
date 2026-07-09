/**
 * currency.controller.test.ts — 货币模块 Controller 测试
 *
 * 🐜 自动: [currency] [D] controller spec 补全
 *
 * 覆盖策略:
 * - 正例: 正常数值转换、汇率查询、金额计算
 * - 反例: 未知货币、无效参数、空数据
 * - 边界: 大数值、零值、负值、极值精度
 * - 集成: NestJS TestingModule 集成测试 + supertest E2E
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { CurrencyController } from './currency.controller'
import { CurrencyService } from './currency.service'
import { CurrencyModule } from './currency.module'
import type { CurrencyCode, CurrencyConfig } from './currency.entity'

// ── 单元测试: 直接构造 Controller (轻量快速) ──
describe('CurrencyController 单元测试', () => {
  let controller: CurrencyController
  let service: CurrencyService

  beforeEach(() => {
    service = new CurrencyService()
    controller = new CurrencyController(service)
    // 预设测试汇率
    service.setRate('CNY', 'USD', 0.14, 'market')
    service.setRate('CNY', 'JPY', 20.14, 'market')
    service.setRate('CNY', 'HKD', 1.09, 'market')
    service.setRate('USD', 'CNY', 7.14, 'market')
  })

  // ── 路由元数据 ──
  describe('路由定义', () => {
    it('控制器路径应为 currency', () => {
      const path = Reflect.getMetadata('path', CurrencyController)
      assert.equal(path, 'currency')
    })

    it('GET /currency/rates', () => {
      const meta = Reflect.getMetadata('method', CurrencyController.prototype.getAllRates)
      assert.equal(meta, 0) // GET
      const path = Reflect.getMetadata('path', CurrencyController.prototype.getAllRates)
      assert.equal(path, 'rates')
    })

    it('GET /currency/rates/base', () => {
      const meta = Reflect.getMetadata('method', CurrencyController.prototype.getBaseRates)
      assert.equal(meta, 0) // GET
      const path = Reflect.getMetadata('path', CurrencyController.prototype.getBaseRates)
      assert.equal(path, 'rates/base')
    })

    it('POST /currency/convert', () => {
      const meta = Reflect.getMetadata('method', CurrencyController.prototype.convert)
      assert.equal(meta, 1) // POST
      const path = Reflect.getMetadata('path', CurrencyController.prototype.convert)
      assert.equal(path, 'convert')
    })

    it('POST /currency/rates', () => {
      const meta = Reflect.getMetadata('method', CurrencyController.prototype.setRate)
      assert.equal(meta, 1) // POST
      const path = Reflect.getMetadata('path', CurrencyController.prototype.setRate)
      assert.equal(path, 'rates')
    })

    it('POST /currency/add', () => {
      const meta = Reflect.getMetadata('method', CurrencyController.prototype.add)
      assert.equal(meta, 1) // POST
      const path = Reflect.getMetadata('path', CurrencyController.prototype.add)
      assert.equal(path, 'add')
    })

    it('POST /currency/subtract', () => {
      const meta = Reflect.getMetadata('method', CurrencyController.prototype.subtract)
      assert.equal(meta, 1) // POST
      const path = Reflect.getMetadata('path', CurrencyController.prototype.subtract)
      assert.equal(path, 'subtract')
    })

    it('GET /currency/config', () => {
      const meta = Reflect.getMetadata('method', CurrencyController.prototype.getConfig)
      assert.equal(meta, 0) // GET
      const path = Reflect.getMetadata('path', CurrencyController.prototype.getConfig)
      assert.equal(path, 'config')
    })

    it('POST /currency/config', () => {
      const meta = Reflect.getMetadata('method', CurrencyController.prototype.updateConfig)
      assert.equal(meta, 1) // POST
      const path = Reflect.getMetadata('path', CurrencyController.prototype.updateConfig)
      assert.equal(path, 'config')
    })
  })

  // ── GET /currency/rates 正例与反例 ──
  describe('GET /currency/rates', () => {
    it('正例: 返回所有汇率', () => {
      const rates = controller.getAllRates()
      assert.equal(rates.length, 4)
      assert.equal(rates[0].from, 'CNY')
      assert.equal(rates[0].to, 'USD')
      assert.equal(rates[0].rate, 0.14)
      assert.equal(typeof rates[0].updatedAt, 'string')
    })

    it('正例: 汇率项含全部字段', () => {
      const [rate] = controller.getAllRates()
      assert.ok('from' in rate)
      assert.ok('to' in rate)
      assert.ok('rate' in rate)
      assert.ok('source' in rate)
      assert.ok('updatedAt' in rate)
    })
  })

  // ── GET /currency/rates/base ──
  describe('GET /currency/rates/base', () => {
    it('正例: CNY 本位币返回对应汇率', () => {
      const rates = controller.getBaseRates()
      assert.equal(rates['USD'], 0.14)
      assert.equal(rates['JPY'], 20.14)
      assert.equal(rates['HKD'], 1.09)
      assert.equal(rates['CNY'], 1)
    })

    it('反例: 未设置汇率时返回空对象', () => {
      const emptyService = new CurrencyService()
      const emptyCtrl = new CurrencyController(emptyService)
      const rates = emptyCtrl.getBaseRates()
      assert.deepEqual(rates, {})
    })
  })

  // ── POST /currency/convert 正例 ──
  describe('POST /currency/convert', () => {
    it('正例: CNY 转 USD', () => {
      const res = controller.convert({ amount: 100, from: 'CNY', to: 'USD' })
      assert.equal(res.originalAmount, 100)
      assert.equal(res.originalCurrency, 'CNY')
      assert.equal(res.convertedAmount, 14)
      assert.equal(res.targetCurrency, 'USD')
      assert.equal(res.rate, 0.14)
      assert.ok(typeof res.timestamp === 'string')
    })

    it('正例: USD 转 CNY', () => {
      const res = controller.convert({ amount: 10, from: 'USD', to: 'CNY' })
      assert.equal(res.convertedAmount, 71.4)
      assert.equal(res.rate, 7.14)
    })

    it('正例: CNY 转 JPY (大额整数)', () => {
      const res = controller.convert({ amount: 1000, from: 'CNY', to: 'JPY' })
      assert.equal(res.convertedAmount, 20140)
      assert.equal(res.rate, 20.14)
    })

    it('正例: 同币种转换返回原值', () => {
      const res = controller.convert({ amount: 100, from: 'CNY', to: 'CNY' })
      assert.equal(res.convertedAmount, 100)
      assert.equal(res.rate, 1)
    })

    it('边界: 零金额转换', () => {
      const res = controller.convert({ amount: 0, from: 'CNY', to: 'USD' })
      assert.equal(res.convertedAmount, 0)
      assert.equal(res.rate, 0.14)
    })

    it('反例: 未知币种对返回 0', () => {
      const res = controller.convert({ amount: 100, from: 'VND' as CurrencyCode, to: 'IDR' as CurrencyCode })
      assert.equal(res.rate, 0)
      assert.equal(res.convertedAmount, 0)
    })

    it('边界: 极小金额 (0.01 CNY)', () => {
      const res = controller.convert({ amount: 0.01, from: 'CNY', to: 'USD' })
      assert.equal(res.rate, 0.14)
      assert.ok(res.convertedAmount >= 0)
    })
  })

  // ── POST /currency/rates 设置汇率 ──
  describe('POST /currency/rates', () => {
    it('正例: 设置新汇率', () => {
      const res = controller.setRate({ from: 'CNY', to: 'KRW' as CurrencyCode, rate: 185, source: 'market' })
      assert.equal(res.success, true)
      assert.equal(res.rate, 185)
      assert.equal(res.from, 'CNY')
      assert.equal(res.to, 'KRW')
    })

    it('正例: 更新已有汇率', () => {
      controller.setRate({ from: 'CNY', to: 'USD', rate: 0.15, source: 'manual' })
      const rates = controller.getAllRates()
      const usdRate = rates.find(r => r.from === 'CNY' && r.to === 'USD')
      assert.equal(usdRate?.rate, 0.15)
      assert.equal(usdRate?.source, 'manual')
    })
  })

  // ── POST /currency/add 金额加法 ──
  describe('POST /currency/add', () => {
    it('正例: 同币种加法', () => {
      const res = controller.add({
        a: { amount: 100, currency: 'CNY' },
        b: { amount: 50, currency: 'CNY' },
        operation: 'add',
      })
      assert.equal(res.amount, 150)
      assert.equal(res.currency, 'CNY')
    })

    it('正例: 跨币种加法 (CNY + USD)', () => {
      const res = controller.add({
        a: { amount: 100, currency: 'CNY' },
        b: { amount: 10, currency: 'USD' },
        operation: 'add',
      })
      // 10 USD = 71.4 CNY → total = 171.4
      assert.equal(res.currency, 'CNY')
      assert.ok(res.amount >= 171)
    })

    it('边界: 零值加法', () => {
      const res = controller.add({
        a: { amount: 0, currency: 'CNY' },
        b: { amount: 0, currency: 'CNY' },
        operation: 'add',
      })
      assert.equal(res.amount, 0)
    })
  })

  // ── POST /currency/subtract 金额减法 ──
  describe('POST /currency/subtract', () => {
    it('正例: 同币种减法', () => {
      const res = controller.subtract({
        a: { amount: 100, currency: 'CNY' },
        b: { amount: 30, currency: 'CNY' },
        operation: 'subtract',
      })
      assert.equal(res.amount, 70)
      assert.equal(res.currency, 'CNY')
    })

    it('边界: 结果为负数', () => {
      const res = controller.subtract({
        a: { amount: 30, currency: 'CNY' },
        b: { amount: 100, currency: 'CNY' },
        operation: 'subtract',
      })
      assert.equal(res.amount, -70)
    })
  })

  // ── GET /currency/config ──
  describe('GET /currency/config', () => {
    it('正例: 返回当前配置', () => {
      const config = controller.getConfig() as CurrencyConfig
      assert.equal(config.baseCurrency, 'CNY')
      assert.equal(config.decimalPlaces, 2)
      assert.equal(config.roundingMode, 'round')
    })
  })

  // ── POST /currency/config ──
  describe('POST /currency/config', () => {
    it('正例: 更新本位币', () => {
      const res = controller.updateConfig({ baseCurrency: 'USD' })
      assert.equal(res.config.baseCurrency, 'USD')
    })

    it('正例: 部分更新配置', () => {
      const res = controller.updateConfig({ decimalPlaces: 4 })
      assert.equal(res.config.decimalPlaces, 4)
      assert.equal(res.config.baseCurrency, 'CNY') // 保留原值
    })

    it('正例: 更新舍入模式', () => {
      const res = controller.updateConfig({ roundingMode: 'ceil' })
      assert.equal(res.config.roundingMode, 'ceil')
    })
  })
})

// ── 集成测试: NestJS TestingModule + supertest ──
describe('CurrencyController 集成测试', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CurrencyModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /currency/rates 返回 200 + 汇率列表', () => {
    return request(app.getHttpServer())
      .get('/currency/rates')
      .expect(200)
      .expect((res) => {
        assert.ok(Array.isArray(res.body))
      })
  })

  it('GET /currency/rates/base 返回 200', () => {
    return request(app.getHttpServer())
      .get('/currency/rates/base')
      .expect(200)
      .expect((res) => {
        assert.equal(typeof res.body, 'object')
        assert.equal(res.body['CNY'], 1)
      })
  })

  // ── POST /currency/convert 集成正例 ──
  it('POST /currency/convert CNY→USD 返回正确结果', () => {
    return request(app.getHttpServer())
      .post('/currency/convert')
      .send({ amount: 100, from: 'CNY', to: 'USD' })
      .expect(201)
      .expect((res) => {
        assert.equal(res.body.originalAmount, 100)
        assert.equal(res.body.originalCurrency, 'CNY')
        assert.equal(res.body.targetCurrency, 'USD')
        assert.equal(res.body.rate, 0.14)
        assert.ok(typeof res.body.timestamp === 'string')
      })
  })

  it('POST /currency/convert 同币种返回原值', () => {
    return request(app.getHttpServer())
      .post('/currency/convert')
      .send({ amount: 100, from: 'CNY', to: 'CNY' })
      .expect(201)
      .expect((res) => {
        assert.equal(res.body.convertedAmount, 100)
        assert.equal(res.body.rate, 1)
      })
  })

  // ── POST /currency/convert 反例 ──
  it('POST /currency/convert 反例: 无效币种返回 400', () => {
    return request(app.getHttpServer())
      .post('/currency/convert')
      .send({ amount: 100, from: 'INVALID', to: 'USD' })
      .expect(400)
  })

  it('POST /currency/convert 反例: 负数金额返回 400', () => {
    return request(app.getHttpServer())
      .post('/currency/convert')
      .send({ amount: -100, from: 'CNY', to: 'USD' })
      .expect(400)
  })

  it('POST /currency/convert 反例: 缺少必填字段返回 400', () => {
    return request(app.getHttpServer())
      .post('/currency/convert')
      .send({ amount: 100 })
      .expect(400)
  })

  it('POST /currency/convert 反例: 空对象返回 400', () => {
    return request(app.getHttpServer())
      .post('/currency/convert')
      .send({})
      .expect(400)
  })

  // ── POST /currency/rates 集成测试 ──
  it('POST /currency/rates 设置新汇率', () => {
    return request(app.getHttpServer())
      .post('/currency/rates')
      .send({ from: 'CNY', to: 'KRW' as CurrencyCode, rate: 185, source: 'market' })
      .expect(201)
      .expect((res) => {
        assert.equal(res.body.success, true)
        assert.equal(res.body.rate, 185)
      })
  })

  it('POST /currency/rates 反例: 零汇率返回 400', () => {
    return request(app.getHttpServer())
      .post('/currency/rates')
      .send({ from: 'CNY', to: 'USD', rate: 0, source: 'market' })
      .expect(400)
  })

  it('POST /currency/rates 反例: 无效币种返回 400', () => {
    return request(app.getHttpServer())
      .post('/currency/rates')
      .send({ from: 'XYZ', to: 'USD', rate: 0.5 })
      .expect(400)
  })

  // ── POST /currency/add 集成测试 ──
  it('POST /currency/add 同币种加法', () => {
    return request(app.getHttpServer())
      .post('/currency/add')
      .send({
        a: { amount: 100, currency: 'CNY' },
        b: { amount: 50, currency: 'CNY' },
        operation: 'add',
      })
      .expect(201)
      .expect((res) => {
        assert.equal(res.body.amount, 150)
        assert.equal(res.body.currency, 'CNY')
      })
  })

  it('POST /currency/add 反例: 无效币种返回 400', () => {
    return request(app.getHttpServer())
      .post('/currency/add')
      .send({
        a: { amount: 100, currency: 'BAD' },
        b: { amount: 50, currency: 'CNY' },
        operation: 'add',
      })
      .expect(400)
  })

  it('POST /currency/add 反例: 缺少 operation 返回 400', () => {
    return request(app.getHttpServer())
      .post('/currency/add')
      .send({
        a: { amount: 100, currency: 'CNY' },
        b: { amount: 50, currency: 'CNY' },
      })
      .expect(400)
  })

  // ── POST /currency/subtract 集成测试 ──
  it('POST /currency/subtract 同币种减法', () => {
    return request(app.getHttpServer())
      .post('/currency/subtract')
      .send({
        a: { amount: 100, currency: 'CNY' },
        b: { amount: 30, currency: 'CNY' },
        operation: 'subtract',
      })
      .expect(201)
      .expect((res) => {
        assert.equal(res.body.amount, 70)
      })
  })

  it('POST /currency/subtract 反例: 结果为负数仍然成功', () => {
    return request(app.getHttpServer())
      .post('/currency/subtract')
      .send({
        a: { amount: 30, currency: 'CNY' },
        b: { amount: 100, currency: 'CNY' },
        operation: 'subtract',
      })
      .expect(201)
      .expect((res) => {
        assert.equal(res.body.amount, -70)
      })
  })

  // ── GET /currency/config ──
  it('GET /currency/config 返回 200', () => {
    return request(app.getHttpServer())
      .get('/currency/config')
      .expect(200)
      .expect((res) => {
        assert.equal(res.body.baseCurrency, 'CNY')
        assert.equal(res.body.decimalPlaces, 2)
      })
  })

  // ── POST /currency/config ──
  it('POST /currency/config 更新本位币', () => {
    return request(app.getHttpServer())
      .post('/currency/config')
      .send({ baseCurrency: 'USD' })
      .expect(201)
      .expect((res) => {
        assert.equal(res.body.config.baseCurrency, 'USD')
      })
  })

  it('POST /currency/config 反例: 无效币种返回 400', () => {
    return request(app.getHttpServer())
      .post('/currency/config')
      .send({ baseCurrency: 'INVALID' })
      .expect(400)
  })

  it('POST /currency/config 反例: 负数 decimalPlaces 返回 400', () => {
    return request(app.getHttpServer())
      .post('/currency/config')
      .send({ decimalPlaces: -1 })
      .expect(400)
  })

  it('POST /currency/config 反例: 无效舍入模式返回 400', () => {
    return request(app.getHttpServer())
      .post('/currency/config')
      .send({ roundingMode: 'invalid' })
      .expect(400)
  })

  // ── 完整业务场景: 跨币种购买流程 ──
  it('业务场景: 跨币种购买流程 (查看汇率 → 转换 → 加税费)', async () => {
    const agent = request.agent(app.getHttpServer())

    // Step 1: 查看所有汇率
    const ratesRes = await agent.get('/currency/rates').expect(200)
    assert.ok(ratesRes.body.length > 0)

    // Step 2: 商品价格 50 USD 转 CNY
    const convertRes = await agent
      .post('/currency/convert')
      .send({ amount: 50, from: 'USD', to: 'CNY' })
      .expect(201)
    assert.ok(convertRes.body.convertedAmount > 0)

    // Step 3: 加 43 元税费
    const addRes = await agent
      .post('/currency/add')
      .send({
        a: { amount: convertRes.body.convertedAmount, currency: 'CNY' },
        b: { amount: 43, currency: 'CNY' },
        operation: 'add',
      })
      .expect(201)
    assert.ok(addRes.body.amount > convertRes.body.convertedAmount)

    // Step 4: 更新本位币配置
    await agent
      .post('/currency/config')
      .send({ baseCurrency: 'USD' })
      .expect(201)
  })
})
