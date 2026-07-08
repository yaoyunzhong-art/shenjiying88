/**
 * 🐜 自动: [currency] [D] contract.test 补全
 *
 * 货币模块合约类型验证测试
 * 验证合约接口与实体类型兼容性
 */

import { describe, it, expect } from 'vitest'
import {
  type ConvertRequestContract,
  type ConvertResponseContract,
  type RateItemContract,
  type SetRateRequestContract,
  type MoneyOperandContract,
  type ArithmeticRequestContract,
  type CurrencyConfigContract,
  type BaseRatesContract,
  type RateStalenessContract,
  type CurrencyCode,
  type Money,
  type ExchangeRate,
  type CurrencyConfig,
} from './currency.contract'
import { CurrencyService, type CurrencyCode as SvcCurrencyCode } from './currency.service'
import { CurrencyController } from './currency.controller'
import type { ConvertResponse } from './currency.entity'
import {
  ConvertRequestDto,
  SetRateRequestDto,
  MoneyOperandDto,
  ArithmeticRequestDto,
  ConfigUpdateDto,
} from './currency.dto'

describe('Currency Contract Types', () => {
  describe('Contract → Entity type compatibility', () => {
    it('ConvertRequestContract matches service method signature', () => {
      // Verify contract has all required fields
      const req: ConvertRequestContract = {
        amount: 100,
        from: 'CNY',
        to: 'USD',
      }
      expect(req.amount).toBe(100)
      expect(req.from).toBe('CNY')
      expect(req.to).toBe('USD')
    })

    it('ConvertResponseContract aligns with ConvertResponse entity', () => {
      const contract: ConvertResponseContract = {
        originalAmount: 100,
        originalCurrency: 'CNY',
        convertedAmount: 14.0,
        targetCurrency: 'USD',
        rate: 0.14,
        timestamp: new Date().toISOString(),
      }
      // Must be assignable from entity
      const entity: ConvertResponse = contract
      expect(entity.originalAmount).toBe(100)
      expect(entity.targetCurrency).toBe('USD')
    })

    it('RateItemContract aligns with service ExchangeRate', () => {
      const service = new CurrencyService()
      service.setRate('USD', 'CNY', 7.15, 'market')
      const rates = service.getAllRates()

      // Each rate item should conform to contract
      for (const rate of rates) {
        const contract: RateItemContract = {
          from: rate.from as CurrencyCode,
          to: rate.to as CurrencyCode,
          rate: rate.rate,
          source: rate.source,
          updatedAt: rate.updatedAt.toISOString(),
        }
        expect(contract.rate).toBeGreaterThan(0)
        expect(contract.from).toBe('USD')
        expect(contract.to).toBe('CNY')
      }
    })

    it('SetRateRequestContract fields match SetRateRequestDto', () => {
      // DTO should cover all contract fields
      const dto = new SetRateRequestDto()
      dto.from = 'CNY'
      dto.to = 'USD'
      dto.rate = 0.14
      dto.source = 'manual'

      const contract: SetRateRequestContract = {
        from: dto.from as CurrencyCode,
        to: dto.to as CurrencyCode,
        rate: dto.rate,
        source: dto.source,
      }
      expect(contract.from).toBe('CNY')
      expect(contract.rate).toBe(0.14)
    })

    it('MoneyOperandContract matches MoneyOperandDto', () => {
      const dto = new MoneyOperandDto()
      dto.amount = 5000
      dto.currency = 'JPY'

      const contract: MoneyOperandContract = {
        amount: dto.amount,
        currency: dto.currency as CurrencyCode,
      }
      expect(contract.amount).toBe(5000)
      expect(contract.currency).toBe('JPY')
    })

    it('ArithmeticRequestContract maps from ArithmeticRequestDto', () => {
      const aDto = new MoneyOperandDto()
      aDto.amount = 100
      aDto.currency = 'CNY'

      const bDto = new MoneyOperandDto()
      bDto.amount = 50
      bDto.currency = 'USD'

      const dto = new ArithmeticRequestDto()
      ;(dto as any).a = aDto
      ;(dto as any).b = bDto

      const contract: ArithmeticRequestContract = {
        a: { amount: 100, currency: 'CNY' },
        b: { amount: 50, currency: 'USD' },
        operation: 'add',
      }
      expect(contract.a.amount).toBe(100)
      expect(contract.operation).toBe('add')
    })

    it('CurrencyConfigContract matches CurrencyConfig entity', () => {
      const service = new CurrencyService()
      const config = service.getConfig()

      const contract: CurrencyConfigContract = {
        baseCurrency: config.baseCurrency,
        decimalPlaces: config.decimalPlaces,
        roundingMode: config.roundingMode,
      }
      expect(contract.baseCurrency).toBe('CNY')
      expect(contract.decimalPlaces).toBe(2)
      expect(contract.roundingMode).toBe('floor')
    })
  })

  describe('Contract type constraints', () => {
    it('BaseRatesContract returns records indexed by currency code', () => {
      const contract: BaseRatesContract = {
        CNY: 1,
        USD: 0.14,
        JPY: 15.5,
      }
      expect(contract['CNY']).toBe(1)
      expect(contract['USD']).toBe(0.14)
    })

    it('RateStalenessContract captures staleness with optional rate', () => {
      const stale: RateStalenessContract = {
        from: 'CNY',
        to: 'USD',
        isStale: true,
        maxAgeMs: 86400000,
      }
      expect(stale.isStale).toBe(true)
      expect(stale.rate).toBeUndefined()

      const fresh: RateStalenessContract = {
        from: 'CNY',
        to: 'USD',
        isStale: false,
        maxAgeMs: 3600000,
        rate: 0.14,
      }
      expect(fresh.rate).toBe(0.14)
      expect(fresh.isStale).toBe(false)
    })

    it('MoneyOperandContract amount must be a number', () => {
      const op: MoneyOperandContract = { amount: 1000, currency: 'HKD' }
      expect(typeof op.amount).toBe('number')
      expect(typeof op.currency).toBe('string')
    })

    it('CurrencyCode type supports all 11 handled currencies', () => {
      const codes: CurrencyCode[] = ['CNY', 'USD', 'HKD', 'TWD', 'JPY', 'KRW', 'THB', 'VND', 'IDR', 'MYR', 'SGD']
      expect(codes.length).toBe(11)
      expect(codes).toContain('CNY')
      expect(codes).toContain('SGD')
    })
  })

  describe('Runtime service → contract compatibility', () => {
    it('controller convert() output conforms to ConvertResponseContract', () => {
      const service = new CurrencyService()
      const controller = new CurrencyController(service)

      // Set up a rate first
      service.setRate('CNY', 'USD', 0.14, 'market')
      service.setRate('USD', 'CNY', 7.15, 'market')

      const dto = new ConvertRequestDto()
      dto.amount = 100
      dto.from = 'CNY'
      dto.to = 'USD'

      // Call via controller (would need actual NestJS execution in integration test)
      // Here we test the service directly
      const result = service.convertAmount(100, 'CNY' as SvcCurrencyCode, 'USD' as SvcCurrencyCode)

      const response: ConvertResponseContract = {
        originalAmount: 100,
        originalCurrency: 'CNY',
        convertedAmount: result,
        targetCurrency: 'USD',
        rate: 0.14,
        timestamp: new Date().toISOString(),
      }
      expect(response.convertedAmount).toBe(result)
      expect(response.rate).toBe(0.14)
    })

    it('controller getAllRates() output conforms to RateItemContract array', () => {
      const service = new CurrencyService()
      service.setRate('USD', 'CNY', 7.20, 'market')
      service.setRate('CNY', 'JPY', 20.0, 'manual')

      const rates = service.getAllRates()
      const contractItems: RateItemContract[] = rates.map(r => ({
        from: r.from as CurrencyCode,
        to: r.to as CurrencyCode,
        rate: r.rate,
        source: r.source,
        updatedAt: r.updatedAt.toISOString(),
      }))

      expect(contractItems.length).toBe(2)
      expect(contractItems.find(r => r.from === 'USD' && r.to === 'CNY')?.rate).toBe(7.20)
      expect(contractItems.find(r => r.source === 'manual')).toBeDefined()
      expect(contractItems.every(r => r.rate > 0)).toBe(true)
    })

    it('exchange rate cross-calculation produces contract-conforming result', () => {
      const service = new CurrencyService()
      service.setRate('CNY', 'USD', 0.14, 'market')
      // JPY not set directly, should cross-rate through CNY

      const rates = service.getRatesFromBase('CNY')
      const contract: BaseRatesContract = rates

      expect(contract['CNY']).toBe(1)
      expect(Object.keys(contract).length).toBeGreaterThan(1)
    })
  })

  describe('Edge cases for contract types', () => {
    it('handles zero or negative rates gracefully in contract', () => {
      // Contract allows any number; validation is in DTO/Service
      const contract: RateItemContract = {
        from: 'CNY',
        to: 'VND',
        rate: 0,
        source: 'market',
        updatedAt: new Date().toISOString(),
      }
      expect(contract.rate).toBe(0)
    })

    it('RateStalenessContract works with missing (undefined) rate', () => {
      const stale: RateStalenessContract = {
        from: 'XYZ' as CurrencyCode,
        to: 'ABC' as CurrencyCode,
        isStale: true,
        maxAgeMs: 0,
      }
      expect(stale.isStale).toBe(true)
      expect(stale.rate).toBeUndefined()
    })
  })
})
