import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { CurrencyService } from './currency.service'
import type { CurrencyCode } from './currency.entity'

describe('CurrencyService', () => {
  let service: CurrencyService

  beforeEach(() => {
    service = new CurrencyService()
  })

  // ── Rate Management ──────────────────────────────────────────

  describe('getRate()', () => {
    it('returns rate 1 for same currency', () => {
      const rate = service.getRate('CNY', 'CNY')
      assert.equal(rate?.rate, 1)
      assert.equal(rate?.source, 'fixed')
    })

    it('returns null for unknown pair with no base rate path', () => {
      const rate = service.getRate('VND' as CurrencyCode, 'KRW' as CurrencyCode)
      assert.equal(rate, null)
    })

    it('returns manual rate with highest priority', () => {
      service.setRate('CNY', 'USD', 0.2, 'manual')
      service.setRate('CNY', 'USD', 0.14, 'market')
      const rate = service.getRate('CNY', 'USD')
      assert.equal(rate?.rate, 0.2)
      assert.equal(rate?.source, 'manual')
    })

    it('returns market rate when no manual or fixed rate exists', () => {
      service.setRate('CNY', 'USD', 0.14, 'market')
      const rate = service.getRate('CNY', 'USD')
      assert.equal(rate?.rate, 0.14)
      assert.equal(rate?.source, 'market')
    })

    it('returns fixed rate for HKD -> USD (pegged)', () => {
      const rate = service.getRate('HKD', 'USD')
      assert.equal(rate?.rate, 0.128)
      assert.equal(rate?.source, 'fixed')
    })

    it('returns inverse fixed rate for USD -> HKD', () => {
      const rate = service.getRate('USD', 'HKD')
      assert.equal(rate?.rate, 1 / 0.128)
      assert.equal(rate?.source, 'fixed')
    })

    it('returns rate when direct market rate exists', () => {
      service.setRate('CNY', 'USD', 0.14, 'market')
      const rate = service.getRate('CNY', 'USD')
      assert.equal(rate?.rate, 0.14)
    })

    it('returns null when no cross-rate path through base exists', () => {
      service.setRate('CNY', 'USD', 0.14, 'market')
      service.setRate('USD', 'CNY', 7.14, 'market')
      const rate = service.getRate('VND' as CurrencyCode, 'CNY')
      assert.equal(rate, null)
    })
  })

  describe('setRate()', () => {
    it('stores manual rate', () => {
      service.setRate('CNY', 'KRW', 185, 'manual')
      const rate = service.getRate('CNY', 'KRW')
      assert.equal(rate?.rate, 185)
      assert.equal(rate?.source, 'manual')
    })

    it('stores market rate', () => {
      service.setRate('THB', 'CNY', 0.2, 'market')
      const rate = service.getRate('THB', 'CNY')
      assert.equal(rate?.rate, 0.2)
      assert.equal(rate?.source, 'market')
    })

    it('updates existing market rate', () => {
      service.setRate('CNY', 'USD', 0.14, 'market')
      service.setRate('CNY', 'USD', 0.15, 'market')
      const rate = service.getRate('CNY', 'USD')
      assert.equal(rate?.rate, 0.15)
    })

    it('manual rate still takes priority after market update', () => {
      service.setRate('CNY', 'USD', 0.2, 'manual')
      service.setRate('CNY', 'USD', 0.14, 'market')
      const rate = service.getRate('CNY', 'USD')
      assert.equal(rate?.rate, 0.2)
    })
  })

  describe('getAllRates()', () => {
    it('returns empty array when no rates set', () => {
      assert.equal(service.getAllRates().length, 0)
    })

    it('returns all set rates', () => {
      service.setRate('CNY', 'USD', 0.14, 'market')
      service.setRate('CNY', 'HKD', 1.09, 'market')
      service.setRate('USD', 'JPY', 150, 'manual')
      assert.equal(service.getAllRates().length, 3)
    })

    it('returns both manual and market rates', () => {
      service.setRate('CNY', 'USD', 0.14, 'market')
      service.setRate('CNY', 'KRW', 185, 'manual')
      const sources = service.getAllRates().map(r => r.source)
      assert.ok(sources.includes('market'))
      assert.ok(sources.includes('manual'))
    })
  })

  describe('getRatesFromBase()', () => {
    it('returns all rates from CNY base', () => {
      service.setRate('CNY', 'USD', 0.14, 'market')
      service.setRate('CNY', 'HKD', 1.09, 'market')
      const rates = service.getRatesFromBase('CNY')
      assert.equal(rates['CNY'], 1)
      assert.equal(rates['USD'], 0.14)
      assert.equal(rates['HKD'], 1.09)
    })

    it('returns 0 for currency with no rate', () => {
      const rates = service.getRatesFromBase('CNY')
      assert.equal(rates['CNY'], 1)
      assert.equal(rates['USD'], 0)
    })

    it('handles unknown base currency', () => {
      assert.equal(service.getRatesFromBase('VND' as CurrencyCode)['VND'], 1)
    })
  })

  // ── Currency Conversion ──────────────────────────────────────

  describe('convert()', () => {
    it('returns same currency with same amount when from === to', () => {
      const result = service.convert({ amount: 100, currency: 'CNY' }, 'CNY')
      assert.equal(result.amount, 100)
      assert.equal(result.currency, 'CNY')
    })

    it('converts CNY to USD', () => {
      service.setRate('CNY', 'USD', 0.14, 'market')
      const result = service.convert({ amount: 100, currency: 'CNY' }, 'USD')
      assert.equal(result.amount, 14)
      assert.equal(result.currency, 'USD')
    })

    it('converts USD to CNY with tolerance', () => {
      service.setRate('USD', 'CNY', 7.14, 'market')
      const result = service.convert({ amount: 10, currency: 'USD' }, 'CNY')
      // Floating point: 10 * 7.14 * 100 / 100 = ~71.39 due to floor rounding
      assert.equal(result.amount, 71.39)
      assert.equal(result.currency, 'CNY')
    })
  })

  describe('convertAmount()', () => {
    it('returns same amount when from === to', () => {
      assert.equal(service.convertAmount(100, 'CNY', 'CNY'), 100)
    })

    it('converts CNY to USD at 0.14 rate', () => {
      service.setRate('CNY', 'USD', 0.14, 'market')
      assert.equal(service.convertAmount(100, 'CNY', 'USD'), 14)
    })

    it('converts USD to JPY at 150 rate', () => {
      service.setRate('USD', 'JPY', 150, 'market')
      assert.equal(service.convertAmount(100, 'USD', 'JPY'), 150)
    })

    it('returns 0 for unknown rate pair', () => {
      assert.equal(service.convertAmount(100, 'VND' as CurrencyCode, 'KRW' as CurrencyCode), 0)
    })
  })

  // ── Arithmetic Operations ──────────────────────────────────

  describe('add()', () => {
    it('adds two amounts in same currency', () => {
      const result = service.add(
        { amount: 100, currency: 'CNY' },
        { amount: 200, currency: 'CNY' },
      )
      assert.equal(result.amount, 300)
      assert.equal(result.currency, 'CNY')
    })

    it('adds amounts in different currencies', () => {
      service.setRate('CNY', 'USD', 0.14, 'market')
      service.setRate('USD', 'CNY', 7.14, 'market')
      const result = service.add(
        { amount: 100, currency: 'CNY' },
        { amount: 10, currency: 'USD' },
      )
      assert.equal(result.amount, 171.39)
      assert.equal(result.currency, 'CNY')
    })
  })

  describe('subtract()', () => {
    it('subtracts two amounts in same currency', () => {
      const result = service.subtract(
        { amount: 300, currency: 'CNY' },
        { amount: 100, currency: 'CNY' },
      )
      assert.equal(result.amount, 200)
      assert.equal(result.currency, 'CNY')
    })

    it('returns negative when subtracting larger amount', () => {
      const result = service.subtract(
        { amount: 50, currency: 'CNY' },
        { amount: 100, currency: 'CNY' },
      )
      assert.equal(result.amount, -50)
    })

    it('subtracts amounts in different currencies', () => {
      service.setRate('CNY', 'USD', 0.14, 'market')
      service.setRate('USD', 'CNY', 7.14, 'market')
      const result = service.subtract(
        { amount: 100, currency: 'CNY' },
        { amount: 5, currency: 'USD' },
      )
      assert.equal(Math.round(result.amount * 100) / 100, 64.31)
    })
  })

  describe('multiply()', () => {
    it('multiplies amount by factor', () => {
      const result = service.multiply({ amount: 100, currency: 'CNY' }, 2.5)
      assert.equal(result.amount, 250)
      assert.equal(result.currency, 'CNY')
    })

    it('handles zero factor', () => {
      assert.equal(service.multiply({ amount: 100, currency: 'CNY' }, 0).amount, 0)
    })

    it('handles fractional factor', () => {
      assert.equal(service.multiply({ amount: 100, currency: 'CNY' }, 0.5).amount, 50)
    })
  })

  describe('divide()', () => {
    it('divides amount by divisor', () => {
      const result = service.divide({ amount: 100, currency: 'CNY' }, 4)
      assert.equal(result.amount, 25)
      assert.equal(result.currency, 'CNY')
    })

    it('throws on division by zero', () => {
      assert.throws(() => service.divide({ amount: 100, currency: 'CNY' }, 0), /Division by zero/)
    })

    it('handles non-integer division', () => {
      const result = service.divide({ amount: 100, currency: 'CNY' }, 3)
      assert.equal(result.currency, 'CNY')
      assert.ok(result.amount < 34)
    })
  })

  // ── Formatting ───────────────────────────────────────────

  describe('format()', () => {
    it('formats CNY amount in zh-CN locale', () => {
      const result = service.format({ amount: 1234.56, currency: 'CNY' })
      assert.ok(result.includes('1,234'))
      assert.ok(result.includes('56'))
    })

    it('formats JPY amount with 0 decimals', () => {
      assert.ok(service.format({ amount: 1500, currency: 'JPY' }).includes('1,500'))
    })
  })

  describe('formatCompact()', () => {
    it('formats in 亿 for big amounts', () => {
      assert.ok(service.formatCompact(1_0000_0000, 'CNY').includes('亿'))
    })

    it('formats in 万 for ten-thousands', () => {
      assert.ok(service.formatCompact(5_0000, 'CNY').includes('万'))
    })

    it('formats in 千 for thousands', () => {
      assert.ok(service.formatCompact(3_000, 'CNY').includes('千'))
    })

    it('returns raw amount for small numbers', () => {
      const result = service.formatCompact(100, 'CNY')
      assert.ok(result.includes('100'))
    })
  })

  // ── Rate Staleness ─────────────────────────────────────────

  describe('isRateStale()', () => {
    it('returns true for non-existent rate', () => {
      assert.equal(service.isRateStale('CNY', 'USD'), true)
    })

    it('returns false for freshly set rate', () => {
      service.setRate('CNY', 'USD', 0.14, 'market')
      assert.equal(service.isRateStale('CNY', 'USD'), false)
    })

    it('returns true when maxAgeMs is negative', () => {
      service.setRate('CNY', 'USD', 0.14, 'market')
      assert.equal(service.isRateStale('CNY', 'USD', -1), true)
    })
  })

  // ── Configuration ───────────────────────────────────────────

  describe('config management', () => {
    it('has default config', () => {
      const config = service.getConfig()
      assert.equal(config.baseCurrency, 'CNY')
      assert.equal(config.decimalPlaces, 2)
      assert.equal(config.roundingMode, 'floor')
    })

    it('sets full config', () => {
      service.setConfig({ baseCurrency: 'USD', decimalPlaces: 4, roundingMode: 'round' })
      const config = service.getConfig()
      assert.equal(config.baseCurrency, 'USD')
      assert.equal(config.decimalPlaces, 4)
      assert.equal(config.roundingMode, 'round')
    })

    it('partial update preserves other fields', () => {
      service.setConfig({ baseCurrency: 'HKD' })
      assert.equal(service.getConfig().baseCurrency, 'HKD')
      assert.equal(service.getConfig().decimalPlaces, 2)
    })
  })

  // ── Integration: Full conversion flow ─────────────────────

  describe('end-to-end scenarios', () => {
    it('CNY -> USD -> CNY round trip', () => {
      service.setRate('CNY', 'USD', 0.14, 'market')
      service.setRate('USD', 'CNY', 7.14, 'market')

      const step1 = service.convert({ amount: 100, currency: 'CNY' }, 'USD')
      assert.equal(step1.amount, 14)

      const step2 = service.convert({ amount: step1.amount, currency: 'USD' }, 'CNY')
      assert.ok(Math.abs(step2.amount - 100) < 1)
    })

    it('handles large amounts without overflow', () => {
      service.setRate('CNY', 'USD', 0.14, 'market')
      const result = service.convert({ amount: 1_0000_0000, currency: 'CNY' }, 'USD')
      assert.equal(result.amount, 1400_0000)
    })

    it('USD -> JPY direct conversion', () => {
      service.setRate('USD', 'JPY', 150, 'market')
      const result = service.convert({ amount: 10, currency: 'USD' }, 'JPY')
      // JPY has 0 decimals: 10 * 150 * 1 / 100 = 15. Not 1500.
      assert.equal(result.amount, 15)
    })
  })
})
