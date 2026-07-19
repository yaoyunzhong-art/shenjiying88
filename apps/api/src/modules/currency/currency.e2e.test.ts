/**
 * currency.e2e.test.ts — 货币/汇率模块 E2E 测试
 *
 * 链路:
 *   HTTP → CurrencyController → CurrencyService
 *
 * 验证:
 *   - 汇率列表与查询 (GET /currency/rates, GET /currency/rates/base)
 *   - 货币代码转换 (POST /currency/convert)
 *   - 汇率换算 (POST /currency/rates 设置 + convert 验证)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Get, Post, Body } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { CurrencyService } from './currency.service'
import type { CurrencyCode } from './currency.service'

@Controller('currency')
class TestCurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('rates')
  getAllRates() {
    return this.currencyService.getAllRates()
  }

  @Get('rates/base')
  getBaseRates() {
    const config = this.currencyService.getConfig()
    return this.currencyService.getRatesFromBase(config.baseCurrency)
  }

  @Post('convert')
  convert(@Body() body: { amount: number; from: string; to: string }) {
    const rate = this.currencyService.getRate(body.from as CurrencyCode, body.to as CurrencyCode)
    const convertedAmount = this.currencyService.convertAmount(body.amount, body.from as CurrencyCode, body.to as CurrencyCode)
    return {
      originalAmount: body.amount,
      originalCurrency: body.from,
      convertedAmount,
      targetCurrency: body.to,
      rate: rate?.rate ?? 0,
      timestamp: new Date().toISOString()
    }
  }

  @Post('rates')
  setRate(@Body() body: { from: string; to: string; rate: number }) {
    this.currencyService.setRate(body.from as CurrencyCode, body.to as CurrencyCode, body.rate, 'manual')
    return { success: true, rate: body.rate, from: body.from, to: body.to }
  }

  @Get('config')
  getConfig() {
    return this.currencyService.getConfig()
  }

  @Post('config')
  updateConfig(@Body() body: Record<string, unknown>) {
    this.currencyService.setConfig(body as any)
    return { config: this.currencyService.getConfig() }
  }
}

async function buildApp() {
  const currencyService = new CurrencyService()

  // Seed some market rates
  currencyService.setRate('USD', 'CNY', 7.24, 'market')
  currencyService.setRate('USD', 'JPY', 149.5, 'market')
  // EUR is not in CurrencyCode union, skip
  currencyService.setRate('USD', 'KRW', 1320, 'market')
  currencyService.setRate('USD', 'HKD', 7.82, 'market')

  const moduleRef = await Test.createTestingModule({
    controllers: [TestCurrencyController],
    providers: [
      { provide: CurrencyService, useValue: currencyService }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  await app.init()
  return { app, currencyService }
}

describe('Currency E2E', () => {
  describe('GET /currency/rates — 汇率列表', () => {
    it('返回所有预设的市场汇率', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer()).get('/currency/rates')
        assert.equal(res.statusCode, 200)
        assert.ok(Array.isArray(res.body))
        assert.ok(res.body.length >= 4)
        // Should contain USD→CNY
        const usdCny = res.body.find((r: any) => r.from === 'USD' && r.to === 'CNY')
        assert.ok(usdCny)
        assert.equal(usdCny.source, 'market')
        assert.equal(usdCny.rate, 7.24)
      } finally {
        await app.close()
      }
    })
  })

  describe('GET /currency/rates/base — 本位币汇率', () => {
    it('返回以CNY为基准的汇率列表', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer()).get('/currency/rates/base')
        assert.equal(res.statusCode, 200)
        // CNY itself should always be 1
        assert.equal(res.body.CNY, 1)
        // USD should have a converted rate
        assert.ok(res.body.USD > 0)
      } finally {
        await app.close()
      }
    })
  })

  describe('POST /currency/convert — 货币换算', () => {
    it('同币种转换返回原值', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/currency/convert')
          .send({ amount: 100, from: 'USD', to: 'USD' })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.convertedAmount, 100)
        assert.equal(res.body.rate, 1)
      } finally {
        await app.close()
      }
    })

    it('USD→CNY 换算正确使用预设汇率', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/currency/convert')
          .send({ amount: 100, from: 'USD', to: 'CNY' })
        assert.equal(res.statusCode, 201)
        // 100 USD * 7.24 = 724 CNY (amount in smallest unit, both have 2 decimals)
        assert.equal(res.body.convertedAmount, 724)
        assert.equal(res.body.rate, 7.24)
      } finally {
        await app.close()
      }
    })

    it('USD→JPY 换算正确 (JPY 0位小数)', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/currency/convert')
          .send({ amount: 100, from: 'USD', to: 'JPY' })
        assert.equal(res.statusCode, 201)
        // 100 cents USD * 149.5 * 1 / 100 = 149.5 → floor = 149 JPY
        assert.equal(res.body.rate, 149.5)
        assert.ok(res.body.convertedAmount > 0)
      } finally {
        await app.close()
      }
    })
  })

  describe('POST /currency/rates → GET /currency/rates — 设置汇率后验证', () => {
    it('手动设置汇率后可通过列表查询', async () => {
      const { app } = await buildApp()
      try {
        // Set a manual rate
        const setRes = await request(app.getHttpServer())
          .post('/currency/rates')
          .send({ from: 'CNY', to: 'USD', rate: 0.138 })
        assert.equal(setRes.statusCode, 201)
        assert.equal(setRes.body.success, true)

        // Verify it shows up in rates list
        const listRes = await request(app.getHttpServer()).get('/currency/rates')
        const found = listRes.body.find((r: any) => r.from === 'CNY' && r.to === 'USD')
        assert.ok(found)
        assert.equal(found.rate, 0.138)
      } finally {
        await app.close()
      }
    })

    it('手动设置汇率后 convert 使用新汇率', async () => {
      const { app } = await buildApp()
      try {
        await request(app.getHttpServer())
          .post('/currency/rates')
          .send({ from: 'CNY', to: 'JPY', rate: 20.5 })

        const res = await request(app.getHttpServer())
          .post('/currency/convert')
          .send({ amount: 1000, from: 'CNY', to: 'JPY' })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.rate, 20.5)
        // 1000 CNY cents * 20.5 * 1 / 100 = 205 JPY
        assert.equal(res.body.convertedAmount, 205)
      } finally {
        await app.close()
      }
    })
  })

  describe('GET /currency/config — 配置获取', () => {
    it('返回默认配置信息', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer()).get('/currency/config')
        assert.equal(res.statusCode, 200)
        assert.equal(res.body.baseCurrency, 'CNY')
        assert.equal(res.body.decimalPlaces, 2)
        assert.equal(res.body.roundingMode, 'floor')
      } finally {
        await app.close()
      }
    })

    it('更新配置后返回新配置', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/currency/config')
          .send({ baseCurrency: 'USD' })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.config.baseCurrency, 'USD')
        assert.equal(res.body.config.roundingMode, 'floor')
      } finally {
        await app.close()
      }
    })
  })
})
