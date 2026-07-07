import { randomUUID } from 'node:crypto'

// ── Types ─────────────────────────────────────────────────────────────────────

export type CurrencyCode = 'CNY' | 'USD' | 'HKD' | 'TWD' | 'JPY' | 'KRW' | 'THB' | 'VND' | 'IDR' | 'MYR' | 'SGD'

export interface ExchangeRate {
  from: CurrencyCode
  to: CurrencyCode
  rate: number // 1 from = rate to
  updatedAt: Date
  source: 'central_bank' | 'market' | 'fixed' | 'manual'
}

export interface Money {
  amount: number // 最小单位（分/元整数）
  currency: CurrencyCode
}

export interface CurrencyConfig {
  baseCurrency: CurrencyCode // 记账本位币
  decimalPlaces: number // 小数位数（CNY=2, JPY=0, KRW=0）
  roundingMode: 'floor' | 'round' | 'ceil'
}

// ── Currency Metadata ─────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  CNY: '¥',
  USD: '$',
  HKD: 'HK$',
  TWD: 'NT$',
  JPY: '¥',
  KRW: '₩',
  THB: '฿',
  VND: '₫',
  IDR: 'Rp',
  MYR: 'RM',
  SGD: 'S$',
}

const DECIMAL_PLACES: Record<CurrencyCode, number> = {
  CNY: 2,
  USD: 2,
  HKD: 2,
  TWD: 2,
  JPY: 0,
  KRW: 0,
  THB: 2,
  VND: 0,
  IDR: 0,
  MYR: 2,
  SGD: 2,
}

// ── Fixed Exchange Rates (联系汇率) ──────────────────────────────────────────

const FIXED_RATES: Partial<Record<CurrencyCode, Partial<Record<CurrencyCode, number>>>> = {
  HKD: {
    USD: 0.128, // 7.8 HKD = 1 USD
  },
  SGD: {
    USD: 0.74, // approx
  },
}

// ── CurrencyService ───────────────────────────────────────────────────────────

export class CurrencyService {
  private readonly manualRates = new Map<string, ExchangeRate>()
  private readonly marketRates = new Map<string, ExchangeRate>()
  private config: CurrencyConfig = {
    baseCurrency: 'CNY',
    decimalPlaces: 2,
    roundingMode: 'floor',
  }

  // ── Rate Management ───────────────────────────────────────────────────────

  getRate(from: CurrencyCode, to: CurrencyCode): ExchangeRate | null {
    if (from === to) {
      return {
        from,
        to,
        rate: 1,
        updatedAt: new Date(),
        source: 'fixed',
      }
    }

    // Priority 1: Manual/手动设置 (highest)
    const key = `${from}:${to}`
    const manualRate = this.manualRates.get(key)
    if (manualRate) return manualRate

    // Priority 2: Fixed rate (联系汇率)
    const fixedRate = this.getFixedRate(from, to)
    if (fixedRate !== null) return fixedRate

    // Priority 3: Market rate (市场汇率)
    const marketRate = this.marketRates.get(key)
    if (marketRate) return marketRate

    // Priority 4: Cross rate through base currency
    return this.getCrossRate(from, to)
  }

  private getFixedRate(from: CurrencyCode, to: CurrencyCode): ExchangeRate | null {
    const fromFixed = FIXED_RATES[from]
    if (fromFixed && fromFixed[to] !== undefined) {
      return {
        from,
        to,
        rate: fromFixed[to]!,
        updatedAt: new Date(),
        source: 'fixed',
      }
    }
    const toFixed = FIXED_RATES[to]
    if (toFixed && toFixed[from] !== undefined) {
      return {
        from,
        to,
        rate: 1 / toFixed[from]!,
        updatedAt: new Date(),
        source: 'fixed',
      }
    }
    return null
  }

  private getCrossRate(from: CurrencyCode, to: CurrencyCode): ExchangeRate | null {
    const base = this.config.baseCurrency

    // Try from -> base -> to
    const fromBase = this.getDirectRate(from, base)
    const baseTo = this.getDirectRate(base, to)

    if (fromBase !== null && baseTo !== null) {
      const rate = fromBase.rate * baseTo.rate
      return {
        from,
        to,
        rate,
        updatedAt: new Date(),
        source: 'market',
      }
    }

    // Try to -> base -> from (inverse)
    const toBase = this.getDirectRate(to, base)
    const baseFrom = this.getDirectRate(base, from)

    if (toBase !== null && baseFrom !== null) {
      const rate = toBase.rate / baseFrom.rate
      return {
        from,
        to,
        rate,
        updatedAt: new Date(),
        source: 'market',
      }
    }

    return null
  }

  private getDirectRate(from: CurrencyCode, to: CurrencyCode): ExchangeRate | null {
    if (from === to) {
      return {
        from,
        to,
        rate: 1,
        updatedAt: new Date(),
        source: 'fixed',
      }
    }

    // Check manual first
    const key = `${from}:${to}`
    const manualRate = this.manualRates.get(key)
    if (manualRate) return manualRate

    // Then fixed
    const fixedRate = this.getFixedRate(from, to)
    if (fixedRate) return fixedRate

    // Then market
    const marketRate = this.marketRates.get(key)
    if (marketRate) return marketRate

    return null
  }

  setRate(from: CurrencyCode, to: CurrencyCode, rate: number, source: string = 'market'): void {
    const exchangeRate: ExchangeRate = {
      from,
      to,
      rate,
      updatedAt: new Date(),
      source: source as ExchangeRate['source'],
    }

    if (source === 'manual') {
      this.manualRates.set(`${from}:${to}`, exchangeRate)
    } else {
      this.marketRates.set(`${from}:${to}`, exchangeRate)
    }
  }

  getAllRates(): ExchangeRate[] {
    return [
      ...Array.from(this.manualRates.values()),
      ...Array.from(this.marketRates.values()),
    ]
  }

  getRatesFromBase(base: CurrencyCode): Record<CurrencyCode, number> {
    const result = {} as Record<CurrencyCode, number>
    const currencies: CurrencyCode[] = ['CNY', 'USD', 'HKD', 'TWD', 'JPY', 'KRW', 'THB', 'VND', 'IDR', 'MYR', 'SGD']

    for (const currency of currencies) {
      if (currency === base) {
        result[currency] = 1
      } else {
        const rate = this.getRate(base, currency)
        result[currency] = rate ? rate.rate : 0
      }
    }

    return result
  }

  // ── Currency Conversion ─────────────────────────────────────────────────────

  convert(money: Money, to: CurrencyCode): Money {
    const amount = this.convertAmount(money.amount, money.currency, to)
    return {
      amount,
      currency: to,
    }
  }

  convertAmount(amount: number, from: CurrencyCode, to: CurrencyCode): number {
    if (from === to) return amount

    const rate = this.getRate(from, to)
    if (!rate) return 0

    const fromDecimals = DECIMAL_PLACES[from]
    const toDecimals = DECIMAL_PLACES[to]

    // amount is in smallest unit (e.g., cents for USD)
    // rate is: 1 from = rate to (both in standard units, e.g., 1 USD = 150 JPY)
    // Formula: amount * rate * 10^toDecimals / 10^fromDecimals
    // This converts: 100 cents USD * 0.14 * 100 / 100 = 14 cents USD
    //               100 cents USD * 150 * 1 / 100 = 150 JPY

    const result = amount * rate.rate * Math.pow(10, toDecimals) / Math.pow(10, fromDecimals)

    return this.applyRounding(result, to)
  }

  private applyRounding(value: number, currency: CurrencyCode): number {
    const decimals = DECIMAL_PLACES[currency]
    const multiplier = Math.pow(10, decimals)

    switch (this.config.roundingMode) {
      case 'floor':
        return Math.floor(value * multiplier) / multiplier
      case 'ceil':
        return Math.ceil(value * multiplier) / multiplier
      case 'round':
      default:
        return Math.round(value * multiplier) / multiplier
    }
  }

  // ── Formatting ─────────────────────────────────────────────────────────────

  format(money: Money, locale: string = 'zh-CN'): string {
    const symbol = CURRENCY_SYMBOLS[money.currency]
    const decimals = DECIMAL_PLACES[money.currency]

    // Use Intl.NumberFormat for locale-aware formatting
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })

    const formattedNumber = formatter.format(money.amount)

    // Add currency symbol based on locale习惯
    if (locale === 'zh-CN' || locale === 'zh-TW' || locale === 'ja-JP') {
      return `${symbol}${formattedNumber}`
    } else if (locale === 'de-DE' || locale === 'fr-FR' || locale === 'es-ES') {
      return `${formattedNumber} ${symbol}`
    } else {
      return `${symbol}${formattedNumber}`
    }
  }

  formatCompact(amount: number, currency: CurrencyCode): string {
    const symbol = CURRENCY_SYMBOLS[currency]

    if (amount >= 1_0000_0000) {
      return `${symbol}${Math.floor(amount / 1_0000_0000)}亿`
    } else if (amount >= 1_0000) {
      return `${symbol}${Math.floor(amount / 1_0000)}万`
    } else if (amount >= 1_000) {
      return `${symbol}${Math.floor(amount / 1_000)}千`
    } else {
      return `${symbol}${amount}`
    }
  }

  // ── Arithmetic Operations ───────────────────────────────────────────────────

  add(a: Money, b: Money): Money {
    this.ensureSameCurrency(a, b)

    // Convert b to a's currency
    const bConverted = this.convert(b, a.currency)

    return {
      amount: a.amount + bConverted.amount,
      currency: a.currency,
    }
  }

  subtract(a: Money, b: Money): Money {
    this.ensureSameCurrency(a, b)

    // Convert b to a's currency
    const bConverted = this.convert(b, a.currency)

    return {
      amount: a.amount - bConverted.amount,
      currency: a.currency,
    }
  }

  multiply(money: Money, factor: number): Money {
    const result = money.amount * factor

    return {
      amount: this.applyRounding(result / Math.pow(10, DECIMAL_PLACES[money.currency]), money.currency) * Math.pow(10, DECIMAL_PLACES[money.currency]),
      currency: money.currency,
    }
  }

  divide(money: Money, divisor: number): Money {
    if (divisor === 0) throw new Error('Division by zero')

    const result = money.amount / divisor

    return {
      amount: this.applyRounding(result / Math.pow(10, DECIMAL_PLACES[money.currency]), money.currency) * Math.pow(10, DECIMAL_PLACES[money.currency]),
      currency: money.currency,
    }
  }

  private ensureSameCurrency(a: Money, b: Money): void {
    if (a.currency !== b.currency) {
      // They will be converted during operation
    }
  }

  // ── Rate Staleness ─────────────────────────────────────────────────────────

  isRateStale(from: CurrencyCode, to: CurrencyCode, maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
    const rate = this.getRate(from, to)
    if (!rate) return true

    const now = new Date().getTime()
    const rateTime = rate.updatedAt.getTime()

    return now - rateTime > maxAgeMs
  }

  // ── Configuration ─────────────────────────────────────────────────────────

  setConfig(config: Partial<CurrencyConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getConfig(): CurrencyConfig {
    return { ...this.config }
  }
}
