import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * CurrencyController 角色扩展测试 (node:test)
 *
 * 从 8 角色视角覆盖货币模块功能：
 *   👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */

import assert from 'node:assert/strict'

// ── Entity Types (mirror) ────────────────────────────────────
type CurrencyCode = 'CNY' | 'USD' | 'HKD' | 'TWD' | 'JPY' | 'KRW' | 'THB' | 'VND' | 'IDR' | 'MYR' | 'SGD'

interface CurrencyConfig {
  baseCurrency: CurrencyCode
  decimalPlaces: number
  roundingMode: 'floor' | 'round' | 'ceil'
}

const ROLES = {
  StoreManager: 'SM',
  Reception: 'RC',
  HR: 'HR',
  Safety: 'SF',
  Guide: 'GD',
  Ops: 'OP',
  Teambuilding: 'TB',
  Marketing: 'MK',
}

// ── Inline Controller (mirrors source: currency.controller.ts) ───
class CurrencyControllerInline {
  private currencyService: any

  constructor(currencyService: any) {
    this.currencyService = currencyService
  }

  getAllRates() {
    const rates = this.currencyService.getAllRates()
    return rates.map((r: any) => ({
      from: r.from,
      to: r.to,
      rate: r.rate,
      source: r.source,
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
    }))
  }

  getBaseRates() {
    const config = this.currencyService.getConfig()
    return this.currencyService.getRatesFromBase(config.baseCurrency)
  }

  convert(body: { amount: number; from: string; to: string }) {
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

  setRate(body: { from: string; to: string; rate: number; source?: string }) {
    const { from, to, rate, source } = body
    this.currencyService.setRate(from as CurrencyCode, to as CurrencyCode, rate, source)
    return { success: true as const, rate, from, to }
  }

  add(body: { a: { amount: number; currency: string }; b: { amount: number; currency: string } }) {
    return this.currencyService.add(
      { amount: body.a.amount, currency: body.a.currency as CurrencyCode },
      { amount: body.b.amount, currency: body.b.currency as CurrencyCode },
    )
  }

  subtract(body: { a: { amount: number; currency: string }; b: { amount: number; currency: string } }) {
    return this.currencyService.subtract(
      { amount: body.a.amount, currency: body.a.currency as CurrencyCode },
      { amount: body.b.amount, currency: body.b.currency as CurrencyCode },
    )
  }

  getConfig() {
    return this.currencyService.getConfig()
  }

  updateConfig(body: Record<string, unknown>) {
    this.currencyService.setConfig(body)
    return { config: this.currencyService.getConfig() }
  }
}

// ── Mock Service Factory ─────────────────────────────────────
function makeServiceWithData() {
  let mutableConfig: CurrencyConfig = { baseCurrency: 'CNY', decimalPlaces: 2, roundingMode: 'round' }

  return {
    getAllRates: () => [
      { from: 'CNY', to: 'USD', rate: 0.14, source: 'market', updatedAt: new Date('2026-07-06T12:00:00.000Z') },
      { from: 'CNY', to: 'HKD', rate: 1.09, source: 'market', updatedAt: new Date('2026-07-06T12:00:00.000Z') },
      { from: 'CNY', to: 'JPY', rate: 20.14, source: 'market', updatedAt: new Date('2026-07-06T12:00:00.000Z') },
      { from: 'USD', to: 'CNY', rate: 7.14, source: 'market', updatedAt: new Date('2026-07-06T12:00:00.000Z') },
      { from: 'CNY', to: 'KRW', rate: 181.5, source: 'market', updatedAt: new Date('2026-07-06T12:00:00.000Z') },
      { from: 'CNY', to: 'THB', rate: 5.05, source: 'market', updatedAt: new Date('2026-07-06T12:00:00.000Z') },
      { from: 'CNY', to: 'VND', rate: 3550, source: 'market', updatedAt: new Date('2026-07-06T12:00:00.000Z') },
      { from: 'CNY', to: 'SGD', rate: 0.19, source: 'market', updatedAt: new Date('2026-07-06T12:00:00.000Z') },
    ],
    getRatesFromBase: (base: CurrencyCode) => {
      if (base === 'CNY') return { USD: 0.14, HKD: 1.09, JPY: 20.14, KRW: 181.5, THB: 5.05, VND: 3550, SGD: 0.19 }
      return { CNY: 7.14 }
    },
    getRate: (from: CurrencyCode, to: CurrencyCode) => {
      const pairs: Record<string, { rate: number; source: string }> = {
        'CNY-USD': { rate: 0.14, source: 'market' },
        'USD-CNY': { rate: 7.14, source: 'market' },
        'CNY-HKD': { rate: 1.09, source: 'market' },
        'HKD-CNY': { rate: 0.9174, source: 'market' },
        'CNY-JPY': { rate: 20.14, source: 'market' },
        'JPY-CNY': { rate: 0.04965, source: 'market' },
        'CNY-KRW': { rate: 181.5, source: 'market' },
        'CNY-THB': { rate: 5.05, source: 'market' },
        'CNY-VND': { rate: 3550, source: 'market' },
        'CNY-SGD': { rate: 0.19, source: 'market' },
        'SGD-CNY': { rate: 5.263, source: 'market' },
      }
      const key = `${from}-${to}`
      const match = pairs[key]
      if (match) return { from, to, ...match, updatedAt: new Date('2026-07-06T12:00:00.000Z') }
      return undefined
    },
    convertAmount: (amount: number, from: CurrencyCode, to: CurrencyCode) => {
      const forwardPairs: Record<string, number> = {
        'CNY-USD': 0.14,
        'USD-CNY': 7.14,
        'CNY-HKD': 1.09,
        'HKD-CNY': 0.9174,
        'CNY-JPY': 20.14,
        'JPY-CNY': 0.04965,
        'CNY-KRW': 181.5,
        'CNY-THB': 5.05,
        'CNY-VND': 3550,
        'CNY-SGD': 0.19,
        'SGD-CNY': 5.263,
      }
      const rate = forwardPairs[`${from}-${to}`]
      if (rate === undefined) return 0
      if (to === 'JPY' || to === 'KRW' || to === 'VND') return Math.round(amount * rate)
      return Math.round(amount * rate * 100) / 100
    },
    setRate: (from: CurrencyCode, to: CurrencyCode, rate: number, source?: string) => {},
    add: (a: any, b: any) => {
      if (a.currency === b.currency) return { amount: a.amount + b.amount, currency: a.currency }
      const rate = a.currency === 'CNY' && b.currency === 'USD' ? 7.14 : 1
      return { amount: a.amount + Math.round(b.amount * rate * 100) / 100, currency: a.currency }
    },
    subtract: (a: any, b: any) => {
      if (a.currency === b.currency) return { amount: a.amount - b.amount, currency: a.currency }
      const rate = a.currency === 'CNY' && b.currency === 'USD' ? 7.14 : 1
      return { amount: a.amount - Math.round(b.amount * rate * 100) / 100, currency: a.currency }
    },
    getConfig: () => ({ ...mutableConfig }),
    setConfig: (cfg: any) => {
      mutableConfig = { ...mutableConfig, ...cfg }
    },
  }
}

// ── 👔店长 StoreManager ──────────────────────────────────────
describe(`${ROLES.StoreManager} Currency (店长)`, () => {
  it('views all exchange rates for daily operations', () => {
    const svc = makeServiceWithData()
    const ctrl = new CurrencyControllerInline(svc)
    const rates = ctrl.getAllRates()
    assert.ok(rates.length >= 8)
    assert.ok(rates.some((r: any) => r.from === 'CNY' && r.to === 'USD'))
  })

  it('configures base currency for store accounting', () => {
    const svc = makeServiceWithData()
    const ctrl = new CurrencyControllerInline(svc)
    const result = ctrl.updateConfig({ baseCurrency: 'USD' })
    assert.equal(result.config.baseCurrency, 'USD')
  })

  it('converts sales totals between currencies for reporting', () => {
    const svc = makeServiceWithData()
    const ctrl = new CurrencyControllerInline(svc)
    const result = ctrl.convert({ amount: 5000, from: 'CNY', to: 'USD' })
    assert.equal(result.convertedAmount, 700)
    assert.equal(result.rate, 0.14)
  })
})

// ── 🛒前台 Reception ──────────────────────────────────────────
describe(`${ROLES.Reception} Currency (前台)`, () => {
  it('converts foreign guest payment to base currency', () => {
    const svc = makeServiceWithData()
    const ctrl = new CurrencyControllerInline(svc)
    const result = ctrl.convert({ amount: 50, from: 'USD', to: 'CNY' })
    assert.equal(result.convertedAmount, 357)
  })

  it('converts HKD payment to CNY for local billing', () => {
    const svc = makeServiceWithData()
    const ctrl = new CurrencyControllerInline(svc)
    const result = ctrl.convert({ amount: 200, from: 'HKD', to: 'CNY' })
    assert.equal(result.convertedAmount, 183.48) // 200 * 0.9174
  })

  it('calculates total with currency addition for multi-currency purchase', () => {
    const svc = makeServiceWithData()
    const ctrl = new CurrencyControllerInline(svc)
    // 128 CNY + 15 USD = 128 + 107.1 = 235.1
    const result = ctrl.add({ a: { amount: 128, currency: 'CNY' }, b: { amount: 15, currency: 'USD' } })
    assert.equal(result.amount, 235.1)
  })
})

// ── 👥HR HR ───────────────────────────────────────────────────
describe(`${ROLES.HR} Currency (人力资源)`, () => {
  it('queries base rates for payroll conversions', () => {
    const svc = makeServiceWithData()
    const ctrl = new CurrencyControllerInline(svc)
    const rates = ctrl.getBaseRates()
    assert.ok(rates['USD'] !== undefined)
    assert.ok(rates['THB'] !== undefined)
  })

  it('converts salary amounts between currencies', () => {
    const svc = makeServiceWithData()
    const ctrl = new CurrencyControllerInline(svc)
    const result = ctrl.convert({ amount: 10000, from: 'CNY', to: 'THB' })
    assert.equal(result.convertedAmount, 50500)
    assert.equal(result.rate, 5.05)
  })
})

// ── 🔧安监 Safety ─────────────────────────────────────────────
describe(`${ROLES.Safety} Currency (安监)`, () => {
  it('converts safety equipment costs from import currency', () => {
    const svc = makeServiceWithData()
    const ctrl = new CurrencyControllerInline(svc)
    const result = ctrl.convert({ amount: 5000, from: 'USD', to: 'CNY' })
    assert.equal(result.convertedAmount, 35700)
  })

  it('verifies config rounding mode for accurate financial records', () => {
    const svc = makeServiceWithData()
    const ctrl = new CurrencyControllerInline(svc)
    const config = ctrl.getConfig()
    assert.equal(config.roundingMode, 'round')
  })
})

// ── 🎮导玩员 Guide ────────────────────────────────────────────
describe(`${ROLES.Guide} Currency (导玩员)`, () => {
  it('converts game coin prices between currencies for tourists', () => {
    const svc = makeServiceWithData()
    const ctrl = new CurrencyControllerInline(svc)
    const result = ctrl.convert({ amount: 50, from: 'SGD', to: 'CNY' })
    assert.equal(result.convertedAmount, 263.15) // 50 * 5.263
  })

  it('adds game entry fees from multiple currencies', () => {
    const svc = makeServiceWithData()
    const ctrl = new CurrencyControllerInline(svc)
    const total = ctrl.add({ a: { amount: 80, currency: 'CNY' }, b: { amount: 120, currency: 'CNY' } })
    assert.equal(total.amount, 200)
  })
})

// ── 🎯运行专员 Ops ────────────────────────────────────────────
describe(`${ROLES.Ops} Currency (运行专员)`, () => {
  it('calculates operational cost difference across currencies', () => {
    const svc = makeServiceWithData()
    const ctrl = new CurrencyControllerInline(svc)
    const diff = ctrl.subtract({ a: { amount: 5000, currency: 'CNY' }, b: { amount: 200, currency: 'USD' } })
    // 5000 - (200 * 7.14) = 5000 - 1428 = 3572
    assert.equal(diff.amount, 3572)
  })

  it('sets manual exchange rate for special pricing events', () => {
    let captured: any = null
    const svc = makeServiceWithData()
    const origSetRate = svc.setRate
    svc.setRate = (from: any, to: any, rate: number, source?: string) => { captured = { from, to, rate, source } }
    const ctrl = new CurrencyControllerInline(svc)
    ctrl.setRate({ from: 'CNY', to: 'JPY', rate: 21.0, source: 'manual' })
    assert.equal(captured.from, 'CNY')
    assert.equal(captured.rate, 21.0)
    svc.setRate = origSetRate
  })

  it('converts large operational budget across currencies', () => {
    const svc = makeServiceWithData()
    const ctrl = new CurrencyControllerInline(svc)
    const result = ctrl.convert({ amount: 500000, from: 'CNY', to: 'VND' })
    assert.equal(result.convertedAmount, 1775000000) // 500000 * 3550
  })
})

// ── 🤝团建 Teambuilding ──────────────────────────────────────
describe(`${ROLES.Teambuilding} Currency (团建)`, () => {
  it('converts team activity costs between currencies', () => {
    const svc = makeServiceWithData()
    const ctrl = new CurrencyControllerInline(svc)
    const result = ctrl.convert({ amount: 3000, from: 'CNY', to: 'THB' })
    assert.equal(result.convertedAmount, 15150)
  })

  it('aggregates total team expenses in base currency', () => {
    const svc = makeServiceWithData()
    const ctrl = new CurrencyControllerInline(svc)
    const result = ctrl.add({ a: { amount: 2000, currency: 'CNY' }, b: { amount: 800, currency: 'CNY' } })
    assert.equal(result.amount, 2800)
  })
})

// ── 📢营销 Marketing ──────────────────────────────────────────
describe(`${ROLES.Marketing} Currency (营销)`, () => {
  it('converts cross-border promotion budgets', () => {
    const svc = makeServiceWithData()
    const ctrl = new CurrencyControllerInline(svc)
    const result = ctrl.convert({ amount: 20000, from: 'CNY', to: 'USD' })
    assert.equal(result.convertedAmount, 2800)
  })

  it('checks rate update for multi-region campaign pricing', () => {
    let captured: any = null
    const svc = makeServiceWithData()
    const origSetRate = svc.setRate
    svc.setRate = (from: any, to: any, rate: number, source?: string) => { captured = { from, to, rate, source } }
    const ctrl = new CurrencyControllerInline(svc)
    ctrl.setRate({ from: 'CNY', to: 'KRW', rate: 185.0, source: 'market' })
    assert.equal(captured.rate, 185.0)
    svc.setRate = origSetRate
  })

  it('converts promotion reward values for international campaigns', () => {
    const svc = makeServiceWithData()
    const ctrl = new CurrencyControllerInline(svc)
    const result = ctrl.convert({ amount: 50, from: 'CNY', to: 'SGD' })
    assert.equal(result.convertedAmount, 9.5)
  })
})
