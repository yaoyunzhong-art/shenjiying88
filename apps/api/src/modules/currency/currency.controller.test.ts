import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { CurrencyController } from './currency.controller'
import { CurrencyService } from './currency.service'

describe('CurrencyController', () => {

  let controller: InstanceType<typeof CurrencyController>
  let service: InstanceType<typeof CurrencyService>

  beforeEach(() => {
    service = new CurrencyService()
    controller = new CurrencyController(service)

    // Setup some test rates
    service.setRate('CNY', 'USD', 0.14, 'market')
    service.setRate('USD', 'JPY', 150, 'market')
  })

  describe('route metadata', () => {
    it('controller path metadata should be currency', () => {
      const path = Reflect.getMetadata('path', CurrencyController)
      assert.equal(path, 'currency')
    })

    it('getAllRates should have GET method', () => {
      const method = Reflect.getMetadata('method', CurrencyController.prototype.getAllRates)
      const path = Reflect.getMetadata('path', CurrencyController.prototype.getAllRates)

      assert.equal(method, 0) // GET
      assert.equal(path, 'rates')
    })

    it('convert should have POST method', () => {
      const method = Reflect.getMetadata('method', CurrencyController.prototype.convert)
      const path = Reflect.getMetadata('path', CurrencyController.prototype.convert)

      assert.equal(method, 1) // POST
      assert.equal(path, 'convert')
    })

    it('setRate should have POST method', () => {
      const method = Reflect.getMetadata('method', CurrencyController.prototype.setRate)
      const path = Reflect.getMetadata('path', CurrencyController.prototype.setRate)

      assert.equal(method, 1) // POST
      assert.equal(path, 'rates')
    })

    it('add should have POST method', () => {
      const method = Reflect.getMetadata('method', CurrencyController.prototype.add)
      const path = Reflect.getMetadata('path', CurrencyController.prototype.add)

      assert.equal(method, 1) // POST
      assert.equal(path, 'add')
    })

    it('subtract should have POST method', () => {
      const method = Reflect.getMetadata('method', CurrencyController.prototype.subtract)
      const path = Reflect.getMetadata('path', CurrencyController.prototype.subtract)

      assert.equal(method, 1) // POST
      assert.equal(path, 'subtract')
    })

    it('getConfig should have GET method', () => {
      const method = Reflect.getMetadata('method', CurrencyController.prototype.getConfig)
      const path = Reflect.getMetadata('path', CurrencyController.prototype.getConfig)

      assert.equal(method, 0) // GET
      assert.equal(path, 'config')
    })

    it('updateConfig should have POST method', () => {
      const method = Reflect.getMetadata('method', CurrencyController.prototype.updateConfig)
      const path = Reflect.getMetadata('path', CurrencyController.prototype.updateConfig)

      assert.equal(method, 1) // POST
      assert.equal(path, 'config')
    })
  })

  describe('GET /currency/rates', () => {
    it('should return all rates', () => {
      const result = controller.getAllRates()

      assert.ok(Array.isArray(result))
      assert.equal(result.length, 2)
    })

    it('rate items should have correct shape', () => {
      const [first] = controller.getAllRates()

      assert.ok(typeof first.from === 'string')
      assert.ok(typeof first.to === 'string')
      assert.ok(typeof first.rate === 'number')
      assert.ok(typeof first.source === 'string')
      assert.ok(typeof first.updatedAt === 'string')
    })
  })

  describe('GET /currency/rates/base', () => {
    it('should return rates from base currency', () => {
      const result = controller.getBaseRates()

      assert.ok(typeof result === 'object')
      assert.equal(result['CNY'], 1)
    })
  })

  describe('POST /currency/convert', () => {
    it('should convert CNY to USD', () => {
      const response = controller.convert({
        amount: 100,
        from: 'CNY',
        to: 'USD'
      })

      assert.equal(response.originalAmount, 100)
      assert.equal(response.originalCurrency, 'CNY')
      assert.equal(response.convertedAmount, 14)
      assert.equal(response.targetCurrency, 'USD')
      assert.equal(response.rate, 0.14)
      assert.ok(typeof response.timestamp === 'string')
    })

    it('should convert same currency returns same amount', () => {
      const response = controller.convert({
        amount: 100,
        from: 'CNY',
        to: 'CNY'
      })

      assert.equal(response.convertedAmount, 100)
      assert.equal(response.rate, 1)
    })

    it('should handle JPY conversion', () => {
      const response = controller.convert({
        amount: 100,
        from: 'USD',
        to: 'JPY'
      })

      assert.equal(response.convertedAmount, 150)
      assert.equal(response.targetCurrency, 'JPY')
    })
  })

  describe('POST /currency/rates', () => {
    it('should set a new rate', () => {
      const result = controller.setRate({
        from: 'CNY',
        to: 'KRW',
        rate: 185,
        source: 'market'
      })

      assert.equal(result.success, true)
      assert.equal(result.rate, 185)
      assert.equal(result.from, 'CNY')
      assert.equal(result.to, 'KRW')
    })
  })

  describe('POST /currency/add', () => {
    it('should add two amounts in same currency', () => {
      const result = controller.add({
        a: { amount: 100, currency: 'CNY' },
        b: { amount: 50, currency: 'CNY' },
        operation: 'add'
      })

      assert.equal(result.amount, 150)
      assert.equal(result.currency, 'CNY')
    })

    it('should add amounts in different currencies', () => {
      const result = controller.add({
        a: { amount: 100, currency: 'CNY' },
        b: { amount: 100, currency: 'USD' },
        operation: 'add'
      })

      assert.equal(result.currency, 'CNY')
      assert.ok(result.amount >= 100)
    })
  })

  describe('POST /currency/subtract', () => {
    it('should subtract two amounts', () => {
      const result = controller.subtract({
        a: { amount: 100, currency: 'CNY' },
        b: { amount: 30, currency: 'CNY' },
        operation: 'subtract'
      })

      assert.equal(result.amount, 70)
      assert.equal(result.currency, 'CNY')
    })
  })

  describe('GET /currency/config', () => {
    it('should return current config', () => {
      const result = controller.getConfig()

      assert.ok(result.baseCurrency)
      assert.ok(typeof result.decimalPlaces === 'number')
      assert.ok(typeof result.roundingMode === 'string')
    })
  })

  describe('POST /currency/config', () => {
    it('should update config', () => {
      const result = controller.updateConfig({
        baseCurrency: 'USD',
        decimalPlaces: 4,
        roundingMode: 'round'
      })

      assert.equal(result.config.baseCurrency, 'USD')
      assert.equal(result.config.decimalPlaces, 4)
      assert.equal(result.config.roundingMode, 'round')
    })

    it('should partially update config', () => {
      const result = controller.updateConfig({
        baseCurrency: 'HKD'
      })

      assert.equal(result.config.baseCurrency, 'HKD')
    })
  })
})
