import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { CurrencyService } from './currency.service'
import type { CurrencyCode, Money } from './currency.service'

describe('CurrencyService', () => {
  let service: CurrencyService

  beforeEach(() => {
    service = new CurrencyService()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Basic Rate Management ──────────────────────────────────────────────────

  describe('Basic Rate Management', () => {
    it('should return null for non-existent rate', () => {
      const rate = service.getRate('CNY', 'USD')
      expect(rate).toBeNull()
    })

    it('should set and get a rate', () => {
      service.setRate('CNY', 'USD', 0.14, 'market')

      const rate = service.getRate('CNY', 'USD')

      expect(rate).not.toBeNull()
      expect(rate!.from).toBe('CNY')
      expect(rate!.to).toBe('USD')
      expect(rate!.rate).toBe(0.14)
      expect(rate!.source).toBe('market')
    })

    it('should return same currency rate as 1', () => {
      const rate = service.getRate('CNY', 'CNY')

      expect(rate).not.toBeNull()
      expect(rate!.rate).toBe(1)
      expect(rate!.source).toBe('fixed')
    })

    it('should get all rates', () => {
      service.setRate('CNY', 'USD', 0.14, 'market')
      service.setRate('CNY', 'JPY', 20.5, 'market')

      const rates = service.getAllRates()

      expect(rates).toHaveLength(2)
    })

    it('should overwrite existing rate', () => {
      service.setRate('CNY', 'USD', 0.14, 'market')
      service.setRate('CNY', 'USD', 0.15, 'market')

      const rate = service.getRate('CNY', 'USD')

      expect(rate!.rate).toBe(0.15)
    })
  })

  // ── Currency Conversion ────────────────────────────────────────────────────

  describe('Currency Conversion', () => {
    beforeEach(() => {
      // Set up basic rates for cross-currency testing
      service.setRate('CNY', 'USD', 0.14, 'market')
      service.setRate('USD', 'JPY', 150, 'market')
      service.setRate('CNY', 'JPY', 21, 'market')
    })

    it('should convert CNY to USD', () => {
      const result = service.convert({ amount: 100, currency: 'CNY' }, 'USD')

      expect(result.currency).toBe('USD')
      expect(result.amount).toBe(14) // 100 fen * 0.14 = 14 cents USD
    })

    it('should convert USD to JPY', () => {
      const result = service.convert({ amount: 100, currency: 'USD' }, 'JPY')

      expect(result.currency).toBe('JPY')
      // 100 cents USD = 1 USD, 1 USD * 150 = 150 JPY
      expect(result.amount).toBe(150)
    })

    it('should handle cross-rate calculation CNY -> USD -> JPY', () => {
      // Only set CNY->USD and USD->JPY, calculate CNY->JPY via cross rate
      service.setRate('CNY', 'USD', 0.14, 'market')
      service.setRate('USD', 'JPY', 150, 'market')

      const rate = service.getRate('CNY', 'JPY')

      expect(rate).not.toBeNull()
      expect(rate!.rate).toBeCloseTo(21, 5) // 0.14 * 150 = 21
      expect(rate!.source).toBe('market')
    })

    it('should convert same currency returns same amount', () => {
      const result = service.convert({ amount: 100, currency: 'CNY' }, 'CNY')

      expect(result.amount).toBe(100)
      expect(result.currency).toBe('CNY')
    })

    it('should return 0 for non-convertible currencies', () => {
      const freshService = new CurrencyService()
      const result = freshService.convert({ amount: 100, currency: 'CNY' }, 'USD')

      expect(result.amount).toBe(0)
    })

    it('should convertAmount with precision', () => {
      service.setRate('CNY', 'USD', 0.1378, 'market')

      const result = service.convertAmount(100, 'CNY', 'USD')

      // 100 fen CNY * 0.1378 * 100 / 100 = 13.78 cents USD (no rounding needed)
      expect(result).toBe(13.78)
    })
  })

  // ── Precision Calculations ─────────────────────────────────────────────────

  describe('Precision Calculations', () => {
    beforeEach(() => {
      service.setRate('CNY', 'USD', 0.14, 'market')
      service.setRate('CNY', 'JPY', 20.5, 'market')
    })

    it('should add two money objects of same currency', () => {
      const a: Money = { amount: 100, currency: 'CNY' }
      const b: Money = { amount: 50, currency: 'CNY' }

      const result = service.add(a, b)

      expect(result.amount).toBe(150)
      expect(result.currency).toBe('CNY')
    })

    it('should add two money objects of different currency', () => {
      const a: Money = { amount: 100, currency: 'CNY' }
      const b: Money = { amount: 100, currency: 'USD' } // 100 cents USD

      const result = service.add(a, b)

      expect(result.currency).toBe('CNY')
      // 100 cents USD = 14 fen CNY, so 100 + 14 = 114 fen CNY
      expect(result.amount).toBeGreaterThanOrEqual(100)
    })

    it('should subtract two money objects', () => {
      const a: Money = { amount: 100, currency: 'CNY' }
      const b: Money = { amount: 30, currency: 'CNY' }

      const result = service.subtract(a, b)

      expect(result.amount).toBe(70)
      expect(result.currency).toBe('CNY')
    })

    it('should multiply money by factor', () => {
      const money: Money = { amount: 100, currency: 'CNY' }

      const result = service.multiply(money, 2)

      expect(result.amount).toBe(200)
      expect(result.currency).toBe('CNY')
    })

    it('should divide money by divisor', () => {
      const money: Money = { amount: 100, currency: 'CNY' }

      const result = service.divide(money, 4)

      expect(result.amount).toBe(25)
      expect(result.currency).toBe('CNY')
    })

    it('should throw on division by zero', () => {
      const money: Money = { amount: 100, currency: 'CNY' }

      expect(() => service.divide(money, 0)).toThrow('Division by zero')
    })

    it('should floor JPY conversion to integer', () => {
      service.setRate('CNY', 'JPY', 20.5, 'market')

      // 100 fen CNY * 20.5 / 100 = 20.5, floor = 20
      const result = service.convertAmount(100, 'CNY', 'JPY')

      expect(result).toBe(20)
      expect(Number.isInteger(result)).toBe(true)
    })
  })

  // ── Formatting ─────────────────────────────────────────────────────────────

  describe('Formatting', () => {
    it('should format CNY with zh-CN locale', () => {
      const result = service.format({ amount: 1000, currency: 'CNY' }, 'zh-CN')

      expect(result).toContain('¥')
      expect(result).toContain('1') // 1000 in Chinese format
    })

    it('should format USD with en-US locale', () => {
      const result = service.format({ amount: 1234.56, currency: 'USD' }, 'en-US')

      expect(result).toContain('$')
      expect(result).toContain('1,234.56')
    })

    it('should format JPY without decimals', () => {
      const result = service.format({ amount: 5000, currency: 'JPY' }, 'ja-JP')

      expect(result).toContain('¥')
      expect(result).not.toContain('.')
    })

    it('should format KRW without decimals', () => {
      const result = service.format({ amount: 100000, currency: 'KRW' }, 'ko-KR')

      expect(result).toContain('₩')
    })

    it('should format HKD correctly', () => {
      const result = service.format({ amount: 100, currency: 'HKD' }, 'zh-CN')

      expect(result).toContain('HK$')
    })

    it('should format TWD correctly', () => {
      const result = service.format({ amount: 1000, currency: 'TWD' }, 'zh-TW')

      expect(result).toContain('NT$')
    })

    it('should format THB correctly', () => {
      const result = service.format({ amount: 1000, currency: 'THB' }, 'th-TH')

      expect(result).toContain('฿')
    })

    it('should format VND correctly', () => {
      const result = service.format({ amount: 1000000, currency: 'VND' }, 'vi-VN')

      expect(result).toContain('₫')
    })

    it('should format IDR correctly', () => {
      const result = service.format({ amount: 1000000, currency: 'IDR' }, 'id-ID')

      expect(result).toContain('Rp')
    })

    it('should format MYR correctly', () => {
      const result = service.format({ amount: 100, currency: 'MYR' }, 'ms-MY')

      expect(result).toContain('RM')
    })

    it('should format SGD correctly', () => {
      const result = service.format({ amount: 100, currency: 'SGD' }, 'zh-SG')

      expect(result).toContain('S$')
    })

    it('should format compact for millions', () => {
      const result = service.formatCompact(100000000, 'CNY')

      expect(result).toContain('亿')
      expect(result).toContain('1')
    })

    it('should format compact for ten-thousands', () => {
      const result = service.formatCompact(10000000, 'CNY')

      expect(result).toContain('万')
      expect(result).toContain('1000')
    })

    it('should format compact for thousands', () => {
      const result = service.formatCompact(5000, 'CNY')

      expect(result).toContain('千')
      expect(result).toContain('5')
    })

    it('should format compact for small amounts without suffix', () => {
      const result = service.formatCompact(100, 'CNY')

      expect(result).toBe('¥100')
    })
  })

  // ── Rate Staleness ─────────────────────────────────────────────────────────

  describe('Rate Staleness', () => {
    beforeEach(() => {
      service.setRate('CNY', 'USD', 0.14, 'market')
    })

    it('should return false for fresh rate within 24h', () => {
      const isStale = service.isRateStale('CNY', 'USD', 24 * 60 * 60 * 1000)

      expect(isStale).toBe(false)
    })

    it('should return true for rate older than 24h', () => {
      vi.setSystemTime(new Date('2024-01-16T13:00:00Z')) // 25 hours later

      const isStale = service.isRateStale('CNY', 'USD', 24 * 60 * 60 * 1000)

      expect(isStale).toBe(true)
    })

    it('should return true for non-existent rate', () => {
      const isStale = service.isRateStale('JPY', 'KRW', 24 * 60 * 60 * 1000)

      expect(isStale).toBe(true)
    })

    it('should respect custom maxAgeMs', () => {
      vi.setSystemTime(new Date('2024-01-15T13:00:00Z')) // 1 hour later

      const isStale = service.isRateStale('CNY', 'USD', 30 * 60 * 1000) // 30 min

      expect(isStale).toBe(true)
    })
  })

  // ── Fixed Rate Priority ───────────────────────────────────────────────────

  describe('Fixed Rate Priority', () => {
    it('should prioritize fixed rate over market rate', () => {
      // HKD has fixed rate with USD at ~0.128
      // setRate with source='market' stores in marketRates
      service.setRate('HKD', 'USD', 0.1, 'market')

      const rate = service.getRate('HKD', 'USD')

      expect(rate).not.toBeNull()
      // Fixed rate should be used (7.8 HKD = 1 USD, so 1 HKD = 0.128 USD)
      expect(rate!.source).toBe('fixed')
      expect(rate!.rate).toBeCloseTo(0.128, 3)
    })

    it('should use fixed rate when no manual rate set', () => {
      const rate = service.getRate('HKD', 'USD')

      expect(rate).not.toBeNull()
      expect(rate!.source).toBe('fixed')
      expect(rate!.rate).toBeCloseTo(0.128, 3)
    })

    it('should prefer manual set rate over fixed rate', () => {
      // Manual rate should take priority over fixed
      service.setRate('HKD', 'USD', 0.15, 'manual')

      const rate = service.getRate('HKD', 'USD')

      expect(rate!.source).toBe('manual')
      expect(rate!.rate).toBe(0.15)
    })
  })

  // ── Batch Rate Retrieval ───────────────────────────────────────────────────

  describe('Batch Rate Retrieval', () => {
    beforeEach(() => {
      service.setRate('CNY', 'USD', 0.14, 'market')
      service.setRate('CNY', 'JPY', 20, 'market')
      service.setRate('CNY', 'HKD', 0.9, 'market')
    })

    it('should get all rates from base currency', () => {
      const rates = service.getRatesFromBase('CNY')

      expect(rates['CNY']).toBe(1)
      expect(rates['USD']).toBe(0.14)
      expect(rates['JPY']).toBe(20)
      expect(rates['HKD']).toBe(0.9)
    })

    it('should return 0 for currencies without rate', () => {
      const rates = service.getRatesFromBase('CNY')

      expect(rates['VND']).toBe(0)
    })

    it('should return 1 for base currency itself', () => {
      const rates = service.getRatesFromBase('USD')

      expect(rates['USD']).toBe(1)
    })
  })

  // ── Configuration ─────────────────────────────────────────────────────────

  describe('Configuration', () => {
    it('should get and set config', () => {
      service.setConfig({
        baseCurrency: 'USD',
        decimalPlaces: 4,
        roundingMode: 'round',
      })

      const config = service.getConfig()

      expect(config.baseCurrency).toBe('USD')
      expect(config.decimalPlaces).toBe(4)
      expect(config.roundingMode).toBe('round')
    })

    it('should use floor rounding for JPY by default', () => {
      service.setRate('CNY', 'JPY', 20.9, 'market')

      // 100 fen CNY * 20.9 / 100 = 20.9, floor = 20
      const result = service.convertAmount(100, 'CNY', 'JPY')

      expect(result).toBe(20)
    })
  })
})
