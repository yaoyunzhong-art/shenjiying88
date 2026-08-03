/**
 * 税务模块服务
 */

import { randomUUID } from 'node:crypto'
import type {
  TaxType,
  TaxRate,
  TaxCalculationRequest,
  TaxCalculationResult,
  TaxConfig,
  BatchTaxRequest,
  BatchTaxResult,
} from './tax.entity'

// ── 默认税率表 ───────────────────────────────────────────────

const DEFAULT_TAX_RATES: Array<Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>> = [
  { name: '中国大陆增值税', type: 'vat', rate: 0.13, jurisdiction: 'CN', enabled: true, description: 'China VAT 13%' },
  { name: '中国大陆服务费', type: 'service_charge', rate: 0.06, jurisdiction: 'CN', enabled: true, description: 'China service charge 6%' },
  { name: 'Virginia Sales Tax', type: 'sales_tax', rate: 0.053, jurisdiction: 'US-VA', enabled: true, description: 'Virginia state sales tax 5.3%' },
  { name: 'Texas Sales Tax', type: 'sales_tax', rate: 0.0825, jurisdiction: 'US-TX', enabled: true, description: 'Texas state sales tax 8.25%' },
  { name: 'Hong Kong GST', type: 'gst', rate: 0.0, jurisdiction: 'HK', enabled: true, description: 'Hong Kong no VAT/GST' },
  { name: 'Japan Consumption Tax', type: 'vat', rate: 0.10, jurisdiction: 'JP', enabled: true, description: 'Japan consumption tax 10%' },
  { name: 'Singapore GST', type: 'gst', rate: 0.09, jurisdiction: 'SG', enabled: true, description: 'Singapore GST 9%' },
  { name: 'South Korea VAT', type: 'vat', rate: 0.10, jurisdiction: 'KR', enabled: true, description: 'South Korea VAT 10%' },
  { name: 'Thailand VAT', type: 'vat', rate: 0.07, jurisdiction: 'TH', enabled: true, description: 'Thailand VAT 7%' },
]

// ── TaxService ───────────────────────────────────────────────

export class TaxService {
  private rates: Map<string, TaxRate> = new Map()
  private config: TaxConfig = {
    defaultJurisdiction: 'CN',
    priceInclusive: false,
    roundingMode: 'floor',
  }

  constructor() {
    this.seedDefaultRates()
  }

  private seedDefaultRates(): void {
    for (const rate of DEFAULT_TAX_RATES) {
      const now = new Date()
      const full: TaxRate = {
        ...rate,
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
      }
      this.rates.set(full.id, full)
    }
  }

  // ── Rate Management ───────────────────────────────────────

  getAllRates(): TaxRate[] {
    return Array.from(this.rates.values())
  }

  getEnabledRates(): TaxRate[] {
    return Array.from(this.rates.values()).filter(r => r.enabled)
  }

  getRateById(id: string): TaxRate | null {
    return this.rates.get(id) ?? null
  }

  getRatesByJurisdiction(jurisdiction: string): TaxRate[] {
    return Array.from(this.rates.values()).filter(r => r.jurisdiction === jurisdiction && r.enabled)
  }

  addRate(rate: Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>): TaxRate {
    const now = new Date()
    const full: TaxRate = {
      ...rate,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    this.rates.set(full.id, full)
    return full
  }

  updateRate(id: string, updates: Partial<Omit<TaxRate, 'id' | 'createdAt'>>): TaxRate | null {
    const existing = this.rates.get(id)
    if (!existing) return null
    const updated: TaxRate = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    }
    this.rates.set(id, updated)
    return updated
  }

  deleteRate(id: string): boolean {
    return this.rates.delete(id)
  }

  // ── Tax Calculation ───────────────────────────────────────

  calculate(request: TaxCalculationRequest): TaxCalculationResult {
    const { amount, jurisdiction, taxType } = request
    const rates = this.getRatesByJurisdiction(jurisdiction)
      .filter(r => taxType ? r.type === taxType : true)

    if (rates.length === 0) {
      return {
        netAmount: amount,
        taxAmount: 0,
        grossAmount: amount,
        effectiveRate: 0,
        breakdown: [],
      }
    }

    const breakdown = rates.map(r => {
      let taxAmount: number
      if (this.config.priceInclusive) {
        // Price includes tax: extract tax from gross
        taxAmount = this.applyRounding(amount * r.rate / (1 + r.rate), r.rate)
      } else {
        // Price excludes tax: add tax on top
        taxAmount = this.applyRounding(amount * r.rate, r.rate)
      }
      return {
        name: r.name,
        type: r.type,
        rate: r.rate,
        amount: taxAmount,
      }
    })

    const totalTax = breakdown.reduce((sum, b) => sum + b.amount, 0)
    const effectiveRate = amount > 0 ? totalTax / amount : 0

    if (this.config.priceInclusive) {
      return {
        netAmount: amount - totalTax,
        taxAmount: totalTax,
        grossAmount: amount,
        effectiveRate,
        breakdown,
      }
    }

    return {
      netAmount: amount,
      taxAmount: totalTax,
      grossAmount: amount + totalTax,
      effectiveRate,
      breakdown,
    }
  }

  calculateBatch(request: BatchTaxRequest): BatchTaxResult {
    const items = request.items.map(item => {
      const result = this.calculate({
        amount: item.amount,
        jurisdiction: item.jurisdiction,
        taxType: item.taxType,
      })
      return {
        id: item.id,
        netAmount: result.netAmount,
        taxAmount: result.taxAmount,
        grossAmount: result.grossAmount,
        effectiveRate: result.effectiveRate,
      }
    })

    return {
      items,
      totalTaxAmount: items.reduce((s, i) => s + i.taxAmount, 0),
      totalGrossAmount: items.reduce((s, i) => s + i.grossAmount, 0),
    }
  }

  // ── Configuration ─────────────────────────────────────────

  setConfig(config: Partial<TaxConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getConfig(): TaxConfig {
    return { ...this.config }
  }

  // ── Formatting ────────────────────────────────────────────

  formatTaxAmount(amount: number, locale: string = 'zh-CN'): string {
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return formatter.format(amount)
  }

  // ── Helpers ───────────────────────────────────────────────

  private applyRounding(value: number, rate: number): number {
    const decimals = rate < 0.01 ? 4 : 2
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
}
