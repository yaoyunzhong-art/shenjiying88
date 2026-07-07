import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * CurrencyController 单元测试 (node:test)
 *
 * 策略：内联 Controller + Mock Service，覆盖所有路由端点。
 * 正向流程 + 边界条件（空数据集、极端输入、未知货币）。
 */

import assert from 'node:assert/strict'

// ── Entity mirrors ───────────────────────────────────────────
type CurrencyCode = 'CNY' | 'USD' | 'HKD' | 'TWD' | 'JPY' | 'KRW' | 'THB' | 'VND' | 'IDR' | 'MYR' | 'SGD'

interface RateItem {
  from: CurrencyCode
  to: CurrencyCode
  rate: number
  source: string
  updatedAt: string
}

interface ConvertResponse {
  originalAmount: number
  originalCurrency: CurrencyCode
  convertedAmount: number
  targetCurrency: CurrencyCode
  rate: number
  timestamp: string
}

interface Money {
  amount: number
  currency: CurrencyCode
}

interface CurrencyConfig {
  baseCurrency: CurrencyCode
  decimalPlaces: number
  roundingMode: 'floor' | 'round' | 'ceil'
}

function makeRateItem(overrides: Record<string, unknown> = {}): RateItem {
  return {
    from: 'CNY',
    to: 'USD',
    rate: 0.14,
    source: 'market',
    updatedAt: '2026-07-06T12:00:00.000Z',
    ...overrides,
  } as RateItem
}

function makeConvertResponse(overrides: Record<string, unknown> = {}): ConvertResponse {
  return {
    originalAmount: 100,
    originalCurrency: 'CNY',
    convertedAmount: 14,
    targetCurrency: 'USD',
    rate: 0.14,
    timestamp: '2026-07-06T12:00:00.000Z',
    ...overrides,
  } as ConvertResponse
}

function makeMoney(overrides: Record<string, unknown> = {}): Money {
  return { amount: 100, currency: 'CNY', ...overrides } as Money
}

function makeConfig(overrides: Record<string, unknown> = {}): CurrencyConfig {
  return {
    baseCurrency: 'CNY',
    decimalPlaces: 2,
    roundingMode: 'round',
    ...overrides,
  } as CurrencyConfig
}

// ── Inline Controller (mirrors source: currency.controller.ts) ───
class CurrencyControllerInline {
  private currencyService: any

  constructor(currencyService: any) {
    this.currencyService = currencyService
  }

  getAllRates(): RateItem[] {
    const rates = this.currencyService.getAllRates()
    return rates.map((r: any) => ({
      from: r.from,
      to: r.to,
      rate: r.rate,
      source: r.source,
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
    }))
  }

  getBaseRates(): Record<string, number> {
    const config = this.currencyService.getConfig()
    return this.currencyService.getRatesFromBase(config.baseCurrency)
  }

  convert(body: { amount: number; from: string; to: string }): ConvertResponse {
    const { amount, from, to } = body
    const fromCode = from as CurrencyCode
    const toCode = to as CurrencyCode

    const rate = this.currencyService.getRate(fromCode, toCode)
    const convertedAmount = this.currencyService.convertAmount(amount, fromCode, toCode)

    return {
      originalAmount: amount,
      originalCurrency: fromCode,
      convertedAmount,
      targetCurrency: toCode,
      rate: rate?.rate ?? 0,
      timestamp: new Date().toISOString(),
    }
  }

  setRate(body: { from: string; to: string; rate: number; source?: string }): { success: true; rate: number; from: string; to: string } {
    const { from, to, rate, source } = body
    this.currencyService.setRate(from as CurrencyCode, to as CurrencyCode, rate, source)
    return { success: true as const, rate, from, to }
  }

  add(body: { a: { amount: number; currency: string }; b: { amount: number; currency: string } }): Money {
    return this.currencyService.add(
      { amount: body.a.amount, currency: body.a.currency as CurrencyCode },
      { amount: body.b.amount, currency: body.b.currency as CurrencyCode },
    )
  }

  subtract(body: { a: { amount: number; currency: string }; b: { amount: number; currency: string } }): Money {
    return this.currencyService.subtract(
      { amount: body.a.amount, currency: body.a.currency as CurrencyCode },
      { amount: body.b.amount, currency: body.b.currency as CurrencyCode },
    )
  }

  getConfig() {
    return this.currencyService.getConfig()
  }

  updateConfig(body: Record<string, unknown>): { config: CurrencyConfig } {
    this.currencyService.setConfig(body as Partial<CurrencyConfig>)
    return { config: this.currencyService.getConfig() }
  }
}

// ── Mock Service Factory ─────────────────────────────────────
function makeMockService(overrides: Record<string, any> = {}) {
  return {
    getAllRates: () => [],
    getRatesFromBase: () => ({}),
    getRate: (_from: any, _to: any) => undefined,
    convertAmount: (_amount: number, _from: any, _to: any) => 0,
    setRate: (_from: any, _to: any, _rate: number, _source?: string) => {},
    add: (_a: any, _b: any) => makeMoney(),
    subtract: (_a: any, _b: any) => makeMoney(),
    getConfig: () => makeConfig(),
    setConfig: (_cfg: any) => {},
    ...overrides,
  }
}

function makeServiceWithData() {
  const allRates = [
    { from: 'CNY', to: 'USD', rate: 0.14, source: 'market', updatedAt: new Date('2026-07-06T12:00:00.000Z') },
    { from: 'CNY', to: 'HKD', rate: 1.09, source: 'market', updatedAt: new Date('2026-07-06T12:00:00.000Z') },
    { from: 'CNY', to: 'JPY', rate: 20.14, source: 'market', updatedAt: new Date('2026-07-06T12:00:00.000Z') },
    { from: 'USD', to: 'CNY', rate: 7.14, source: 'market', updatedAt: new Date('2026-07-06T12:00:00.000Z') },
  ]

  let mutableConfig: CurrencyConfig = { baseCurrency: 'CNY', decimalPlaces: 2, roundingMode: 'round' }

  return makeMockService({
    getAllRates: () => allRates,
    getRatesFromBase: (base: CurrencyCode) => {
      if (base === 'CNY') return { USD: 0.14, HKD: 1.09, JPY: 20.14 }
      return {}
    },
    getRate: (from: CurrencyCode, to: CurrencyCode) => {
      if (from === 'CNY' && to === 'USD') return { from, to, rate: 0.14, source: 'market', updatedAt: new Date('2026-07-06T12:00:00.000Z') }
      if (from === 'USD' && to === 'CNY') return { from, to, rate: 7.14, source: 'market', updatedAt: new Date('2026-07-06T12:00:00.000Z') }
      if (from === 'CNY' && to === 'JPY') return { from, to, rate: 20.14, source: 'market', updatedAt: new Date('2026-07-06T12:00:00.000Z') }
      if (from === 'CNY' && to === 'HKD') return { from, to, rate: 1.09, source: 'market', updatedAt: new Date('2026-07-06T12:00:00.000Z') }
      return undefined
    },
    convertAmount: (amount: number, from: CurrencyCode, to: CurrencyCode) => {
      if (from === 'CNY' && to === 'USD') return Math.round(amount * 0.14 * 100) / 100
      if (from === 'USD' && to === 'CNY') return Math.round(amount * 7.14 * 100) / 100
      if (from === 'CNY' && to === 'JPY') return Math.round(amount * 20.14)
      if (from === 'CNY' && to === 'HKD') return Math.round(amount * 1.09 * 100) / 100
      return 0
    },
    add: (a: Money, b: Money) => {
      if (a.currency === b.currency) {
        return { amount: a.amount + b.amount, currency: a.currency }
      }
      const rate = a.currency === 'CNY' && b.currency === 'USD' ? 7.14 : 1
      return { amount: a.amount + Math.round(b.amount * rate * 100) / 100, currency: a.currency }
    },
    subtract: (a: Money, b: Money) => {
      if (a.currency === b.currency) {
        return { amount: a.amount - b.amount, currency: a.currency }
      }
      const rate = a.currency === 'CNY' && b.currency === 'USD' ? 7.14 : 1
      return { amount: a.amount - Math.round(b.amount * rate * 100) / 100, currency: a.currency }
    },
    getConfig: () => ({ ...mutableConfig }),
    setConfig: (cfg: Partial<CurrencyConfig>) => {
      mutableConfig = { ...mutableConfig, ...cfg }
    },
  })
}

// ── Tests ─────────────────────────────────────────────────────
describe('CurrencyController', () => {

  // ── GET /currency/rates ────────────────────────────────────
  describe('getAllRates()', () => {
    it('returns all exchange rates', () => {
      const svc = makeServiceWithData()
      const ctrl = new CurrencyControllerInline(svc)
      const rates = ctrl.getAllRates()

      assert.equal(rates.length, 4)
      assert.equal(rates[0].from, 'CNY')
      assert.equal(rates[0].to, 'USD')
      assert.equal(rates[0].rate, 0.14)
      assert.equal(typeof rates[0].updatedAt, 'string')
    })

    it('returns empty array when no rates exist', () => {
      const svc = makeMockService()
      const ctrl = new CurrencyControllerInline(svc)
      const rates = ctrl.getAllRates()

      assert.equal(rates.length, 0)
    })
  })

  // ── GET /currency/rates/base ───────────────────────────────
  describe('getBaseRates()', () => {
    it('returns base rates for CNY', () => {
      const svc = makeServiceWithData()
      const ctrl = new CurrencyControllerInline(svc)
      const rates = ctrl.getBaseRates()

      assert.equal(rates['USD'], 0.14)
      assert.equal(rates['HKD'], 1.09)
      assert.equal(rates['JPY'], 20.14)
    })

    it('returns empty object when no base rates available', () => {
      const svc = makeMockService({
        getConfig: () => makeConfig({ baseCurrency: 'VND' as CurrencyCode }),
        getRatesFromBase: () => ({}),
      })
      const ctrl = new CurrencyControllerInline(svc)
      const rates = ctrl.getBaseRates()

      assert.deepEqual(rates, {})
    })
  })

  // ── POST /currency/convert ─────────────────────────────────
  describe('convert()', () => {
    it('converts CNY to USD', () => {
      const svc = makeServiceWithData()
      const ctrl = new CurrencyControllerInline(svc)
      const result = ctrl.convert({ amount: 100, from: 'CNY', to: 'USD' })

      assert.equal(result.originalAmount, 100)
      assert.equal(result.originalCurrency, 'CNY')
      assert.equal(result.convertedAmount, 14)
      assert.equal(result.targetCurrency, 'USD')
      assert.equal(result.rate, 0.14)
      assert.ok(typeof result.timestamp === 'string')
    })

    it('converts USD to CNY', () => {
      const svc = makeServiceWithData()
      const ctrl = new CurrencyControllerInline(svc)
      const result = ctrl.convert({ amount: 10, from: 'USD', to: 'CNY' })

      assert.equal(result.originalAmount, 10)
      assert.equal(result.convertedAmount, 71.4)
      assert.equal(result.rate, 7.14)
    })

    it('converts with zero amount', () => {
      const svc = makeServiceWithData()
      const ctrl = new CurrencyControllerInline(svc)
      const result = ctrl.convert({ amount: 0, from: 'CNY', to: 'USD' })

      assert.equal(result.originalAmount, 0)
      assert.equal(result.convertedAmount, 0)
      assert.equal(result.rate, 0.14)
    })

    it('returns 0 rate and 0 converted for unknown currency pair', () => {
      const svc = makeMockService({
        getRate: () => undefined,
        convertAmount: () => 0,
      })
      const ctrl = new CurrencyControllerInline(svc)
      const result = ctrl.convert({ amount: 100, from: 'VND', to: 'IDR' })

      assert.equal(result.rate, 0)
      assert.equal(result.convertedAmount, 0)
    })
  })

  // ── POST /currency/rates ───────────────────────────────────
  describe('setRate()', () => {
    it('sets a new exchange rate', () => {
      let captured: any = null
      const svc = makeMockService({
        setRate: (from: any, to: any, rate: number, source?: string) => {
          captured = { from, to, rate, source }
        },
      })
      const ctrl = new CurrencyControllerInline(svc)
      const result = ctrl.setRate({ from: 'CNY', to: 'USD', rate: 0.15, source: 'manual' })

      assert.equal(result.success, true)
      assert.equal(result.rate, 0.15)
      assert.equal(result.from, 'CNY')
      assert.equal(result.to, 'USD')
      assert.deepEqual(captured, { from: 'CNY', to: 'USD', rate: 0.15, source: 'manual' })
    })

    it('sets rate without optional source', () => {
      let captured: any = null
      const svc = makeMockService({
        setRate: (from: any, to: any, rate: number, source?: string) => {
          captured = { from, to, rate, source }
        },
      })
      const ctrl = new CurrencyControllerInline(svc)
      ctrl.setRate({ from: 'JPY', to: 'CNY', rate: 0.05 })

      assert.equal(captured.from, 'JPY')
      assert.equal(captured.rate, 0.05)
    })
  })

  // ── POST /currency/add ─────────────────────────────────────
  describe('add()', () => {
    it('adds two amounts in same currency', () => {
      const svc = makeServiceWithData()
      const ctrl = new CurrencyControllerInline(svc)
      const result = ctrl.add({
        a: { amount: 100, currency: 'CNY' },
        b: { amount: 200, currency: 'CNY' },
      })

      assert.equal(result.amount, 300)
      assert.equal(result.currency, 'CNY')
    })

    it('adds amounts in different currencies with conversion', () => {
      const svc = makeServiceWithData()
      const ctrl = new CurrencyControllerInline(svc)
      // 100 CNY + 10 USD = 100 + 71.4 = 171.4
      const result = ctrl.add({
        a: { amount: 100, currency: 'CNY' },
        b: { amount: 10, currency: 'USD' },
      })

      assert.equal(result.amount, 171.4)
      assert.equal(result.currency, 'CNY')
    })
  })

  // ── POST /currency/subtract ────────────────────────────────
  describe('subtract()', () => {
    it('subtracts two amounts in same currency', () => {
      const svc = makeServiceWithData()
      const ctrl = new CurrencyControllerInline(svc)
      const result = ctrl.subtract({
        a: { amount: 300, currency: 'CNY' },
        b: { amount: 100, currency: 'CNY' },
      })

      assert.equal(result.amount, 200)
      assert.equal(result.currency, 'CNY')
    })

    it('returns negative when subtracting larger amount', () => {
      const svc = makeServiceWithData()
      const ctrl = new CurrencyControllerInline(svc)
      const result = ctrl.subtract({
        a: { amount: 50, currency: 'CNY' },
        b: { amount: 100, currency: 'CNY' },
      })

      assert.equal(result.amount, -50)
      assert.equal(result.currency, 'CNY')
    })
  })

  // ── GET /currency/config ───────────────────────────────────
  describe('getConfig()', () => {
    it('returns current currency configuration', () => {
      const svc = makeServiceWithData()
      const ctrl = new CurrencyControllerInline(svc)
      const config = ctrl.getConfig()

      assert.equal(config.baseCurrency, 'CNY')
      assert.equal(config.decimalPlaces, 2)
      assert.equal(config.roundingMode, 'round')
    })
  })

  // ── POST /currency/config ──────────────────────────────────
  describe('updateConfig()', () => {
    it('updates base currency', () => {
      const svc = makeServiceWithData()
      const ctrl = new CurrencyControllerInline(svc)
      const result = ctrl.updateConfig({ baseCurrency: 'USD' })

      assert.equal(result.config.baseCurrency, 'USD')
    })

    it('updates rounding mode', () => {
      const svc = makeServiceWithData()
      const ctrl = new CurrencyControllerInline(svc)
      const result = ctrl.updateConfig({ roundingMode: 'ceil' })

      assert.equal(result.config.roundingMode, 'ceil')
    })
  })

  // ── End-to-End Scenario: Full Purchase Flow ────────────────
  describe('Purchase Flow Scenario', () => {
    it('can convert, add, and configure across multiple currencies', () => {
      const svc = makeServiceWithData()
      const ctrl = new CurrencyControllerInline(svc)

      // Step 1: Check rates
      const rates = ctrl.getAllRates()
      assert.ok(rates.length > 0)

      // Step 2: Convert item price from USD to CNY
      const converted = ctrl.convert({ amount: 50, from: 'USD', to: 'CNY' })
      assert.equal(converted.convertedAmount, 357)

      // Step 3: Add tax
      const total = ctrl.add(
        { a: { amount: converted.convertedAmount, currency: 'CNY' }, b: { amount: 43, currency: 'CNY' } },
      )
      assert.equal(total.amount, 400)
      assert.equal(total.currency, 'CNY')
    })
  })
})
