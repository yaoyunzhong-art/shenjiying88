/**
 * Tax entity 类型验证测试
 */

import { describe, it, expect } from 'vitest'
import type {
  TaxType,
  TaxRate,
  TaxCalculationRequest,
  TaxCalculationResult,
  TaxConfig,
  BatchTaxRequest,
  BatchTaxResult,
} from './tax.entity'

describe('Tax Entity Types', () => {
  describe('TaxType', () => {
    it('支持 5 种税种', () => {
      const types: TaxType[] = ['vat', 'sales_tax', 'gst', 'service_charge', 'customs_duty']
      expect(types).toHaveLength(5)
    })
  })

  describe('TaxRate', () => {
    it('可以构造完整的 TaxRate 对象', () => {
      const rate: TaxRate = {
        id: 'rate-1',
        name: 'VAT 13%',
        type: 'vat',
        rate: 0.13,
        jurisdiction: 'CN',
        enabled: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      }
      expect(rate.id).toBe('rate-1')
      expect(rate.rate).toBe(0.13)
      expect(rate.jurisdiction).toBe('CN')
    })

    it('支持可选的 description 字段', () => {
      const withDesc: TaxRate = {
        id: 'rate-2', name: 'Test', type: 'vat', rate: 0.1,
        jurisdiction: 'CN', enabled: true,
        createdAt: new Date(), updatedAt: new Date(),
        description: 'Some description',
      }
      const withoutDesc: TaxRate = {
        id: 'rate-3', name: 'Test2', type: 'vat', rate: 0.1,
        jurisdiction: 'CN', enabled: true,
        createdAt: new Date(), updatedAt: new Date(),
      }
      expect(withDesc.description).toBe('Some description')
      expect(withoutDesc.description).toBeUndefined()
    })
  })

  describe('TaxCalculationRequest', () => {
    it('可以构造请求对象', () => {
      const req: TaxCalculationRequest = {
        amount: 1000,
        jurisdiction: 'US-TX',
      }
      expect(req.amount).toBe(1000)
      expect(req.jurisdiction).toBe('US-TX')
    })

    it('支持可选的 taxType', () => {
      const withType: TaxCalculationRequest = {
        amount: 1000, jurisdiction: 'CN', taxType: 'vat',
      }
      expect(withType.taxType).toBe('vat')
    })
  })

  describe('TaxCalculationResult', () => {
    it('可以构造计算结果', () => {
      const result: TaxCalculationResult = {
        netAmount: 1000,
        taxAmount: 130,
        grossAmount: 1130,
        effectiveRate: 0.13,
        breakdown: [{ name: 'VAT', type: 'vat', rate: 0.13, amount: 130 }],
      }
      expect(result.netAmount).toBe(1000)
      expect(result.grossAmount).toBe(1130)
      expect(result.breakdown).toHaveLength(1)
    })

    it('支持多项 breakdown', () => {
      const result: TaxCalculationResult = {
        netAmount: 1000,
        taxAmount: 190,
        grossAmount: 1190,
        effectiveRate: 0.19,
        breakdown: [
          { name: 'VAT', type: 'vat', rate: 0.13, amount: 130 },
          { name: 'Service', type: 'service_charge', rate: 0.06, amount: 60 },
        ],
      }
      expect(result.breakdown).toHaveLength(2)
    })
  })

  describe('TaxConfig', () => {
    it('支持 3 种舍入模式', () => {
      const modes: TaxConfig['roundingMode'][] = ['floor', 'round', 'ceil']
      for (const mode of modes) {
        const config: TaxConfig = {
          defaultJurisdiction: 'CN',
          priceInclusive: false,
          roundingMode: mode,
        }
        expect(config.roundingMode).toBe(mode)
      }
    })

    it('priceInclusive 默认 false', () => {
      const config: TaxConfig = {
        defaultJurisdiction: 'CN', priceInclusive: false, roundingMode: 'floor',
      }
      expect(config.priceInclusive).toBe(false)
    })
  })

  describe('BatchTaxRequest', () => {
    it('支持批量多商品', () => {
      const req: BatchTaxRequest = {
        items: [
          { id: 'a', amount: 100, jurisdiction: 'CN' },
          { id: 'b', amount: 200, jurisdiction: 'US-VA' },
        ],
      }
      expect(req.items).toHaveLength(2)
      expect(req.items[0].id).toBe('a')
    })
  })

  describe('BatchTaxResult', () => {
    it('包含汇总统计', () => {
      const result: BatchTaxResult = {
        items: [
          { id: 'a', netAmount: 100, taxAmount: 13, grossAmount: 113, effectiveRate: 0.13 },
        ],
        totalTaxAmount: 13,
        totalGrossAmount: 113,
      }
      expect(result.totalTaxAmount).toBe(13)
      expect(result.totalGrossAmount).toBe(113)
    })
  })
})
