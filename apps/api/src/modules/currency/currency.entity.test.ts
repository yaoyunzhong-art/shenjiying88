import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import type {
  CurrencyCode,
  ExchangeRate,
  Money,
  CurrencyConfig,
  ConvertRequest,
  ConvertResponse,
  SetRateRequest,
  RateItem,
  ArithmeticRequest
} from './currency.entity'

describe('currency.entity: ExchangeRate', () => {
  it('creates valid ExchangeRate with all fields', () => {
    const rate: ExchangeRate = {
      from: 'CNY',
      to: 'USD',
      rate: 0.14,
      updatedAt: new Date('2024-01-15T12:00:00Z'),
      source: 'market'
    }

    assert.equal(rate.from, 'CNY')
    assert.equal(rate.to, 'USD')
    assert.equal(rate.rate, 0.14)
    assert.ok(rate.updatedAt instanceof Date)
    assert.equal(rate.source, 'market')
  })

  it('supports all source types', () => {
    const sources: ExchangeRate['source'][] = ['central_bank', 'market', 'fixed', 'manual']
    for (const source of sources) {
      const rate: ExchangeRate = {
        from: 'USD',
        to: 'JPY',
        rate: 150,
        updatedAt: new Date(),
        source
      }
      assert.equal(rate.source, source)
    }
  })
})

describe('currency.entity: Money', () => {
  it('creates valid Money with known currency', () => {
    const money: Money = { amount: 100, currency: 'CNY' }
    assert.equal(money.amount, 100)
    assert.equal(money.currency, 'CNY')
  })

  it('handles zero amount', () => {
    const money: Money = { amount: 0, currency: 'USD' }
    assert.equal(money.amount, 0)
    assert.equal(money.currency, 'USD')
  })

  it('handles JPY with no decimal places', () => {
    const money: Money = { amount: 5000, currency: 'JPY' }
    assert.equal(money.amount, 5000)
    assert.equal(money.currency, 'JPY')
  })
})

describe('currency.entity: CurrencyConfig', () => {
  it('creates valid CurrencyConfig', () => {
    const config: CurrencyConfig = {
      baseCurrency: 'CNY',
      decimalPlaces: 2,
      roundingMode: 'floor'
    }
    assert.equal(config.baseCurrency, 'CNY')
    assert.equal(config.decimalPlaces, 2)
    assert.equal(config.roundingMode, 'floor')
  })

  it('supports all rounding modes', () => {
    const modes: CurrencyConfig['roundingMode'][] = ['floor', 'round', 'ceil']
    for (const mode of modes) {
      const config: CurrencyConfig = {
        baseCurrency: 'USD',
        decimalPlaces: 2,
        roundingMode: mode
      }
      assert.equal(config.roundingMode, mode)
    }
  })
})

describe('currency.entity: ConvertRequest & ConvertResponse', () => {
  it('creates valid ConvertRequest', () => {
    const req: ConvertRequest = {
      amount: 100,
      from: 'CNY',
      to: 'USD'
    }
    assert.equal(req.amount, 100)
    assert.equal(req.from, 'CNY')
    assert.equal(req.to, 'USD')
  })

  it('creates valid ConvertResponse', () => {
    const res: ConvertResponse = {
      originalAmount: 100,
      originalCurrency: 'CNY',
      convertedAmount: 14,
      targetCurrency: 'USD',
      rate: 0.14,
      timestamp: '2024-01-15T12:00:00.000Z'
    }
    assert.equal(res.originalAmount, 100)
    assert.equal(res.originalCurrency, 'CNY')
    assert.equal(res.convertedAmount, 14)
    assert.equal(res.targetCurrency, 'USD')
    assert.equal(res.rate, 0.14)
    assert.ok(res.timestamp.length > 0)
  })
})

describe('currency.entity: SetRateRequest', () => {
  it('creates valid SetRateRequest with required fields', () => {
    const req: SetRateRequest = {
      from: 'USD',
      to: 'JPY',
      rate: 150
    }
    assert.equal(req.from, 'USD')
    assert.equal(req.to, 'JPY')
    assert.equal(req.rate, 150)
    assert.equal(req.source, undefined)
  })

  it('creates SetRateRequest with optional source', () => {
    const req: SetRateRequest = {
      from: 'CNY',
      to: 'HKD',
      rate: 1.1,
      source: 'manual'
    }
    assert.equal(req.source, 'manual')
  })
})

describe('currency.entity: RateItem', () => {
  it('creates valid RateItem', () => {
    const item: RateItem = {
      from: 'CNY',
      to: 'USD',
      rate: 0.14,
      source: 'market',
      updatedAt: '2024-01-15T12:00:00.000Z'
    }
    assert.equal(item.from, 'CNY')
    assert.equal(item.to, 'USD')
  })
})

describe('currency.entity: ArithmeticRequest', () => {
  it('creates valid add request', () => {
    const req: ArithmeticRequest = {
      a: { amount: 100, currency: 'CNY' },
      b: { amount: 50, currency: 'CNY' },
      operation: 'add'
    }
    assert.equal(req.operation, 'add')
    assert.equal(req.a.currency, 'CNY')
    assert.equal(req.b.amount, 50)
  })

  it('creates valid subtract request', () => {
    const req: ArithmeticRequest = {
      a: { amount: 100, currency: 'CNY' },
      b: { amount: 30, currency: 'CNY' },
      operation: 'subtract'
    }
    assert.equal(req.operation, 'subtract')
  })
})
