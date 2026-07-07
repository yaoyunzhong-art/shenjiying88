import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import { validate } from 'class-validator'
import {
  ConvertRequestDto,
  SetRateRequestDto,
  MoneyOperandDto,
  ArithmeticRequestDto,
  ConfigUpdateDto
} from './currency.dto'

describe('currency.dto: ConvertRequestDto', () => {
  it('should accept valid convert request', async () => {
    const dto = new ConvertRequestDto()
    dto.amount = 100
    dto.from = 'CNY'
    dto.to = 'USD'

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject negative amount', async () => {
    const dto = new ConvertRequestDto()
    dto.amount = -10
    dto.from = 'CNY'
    dto.to = 'USD'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject invalid currency code', async () => {
    const dto = new ConvertRequestDto()
    dto.amount = 100
    dto.from = 'EUR'
    dto.to = 'USD'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject missing fields', async () => {
    const dto = new ConvertRequestDto()

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('currency.dto: SetRateRequestDto', () => {
  it('should accept valid rate request', async () => {
    const dto = new SetRateRequestDto()
    dto.from = 'USD'
    dto.to = 'JPY'
    dto.rate = 150

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should accept optional source', async () => {
    const dto = new SetRateRequestDto()
    dto.from = 'CNY'
    dto.to = 'HKD'
    dto.rate = 1.1
    dto.source = 'manual'

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject invalid source value', async () => {
    const dto = new SetRateRequestDto()
    dto.from = 'CNY'
    dto.to = 'USD'
    dto.rate = 0.14
    ;(dto as any).source = 'invalid_source'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject zero rate', async () => {
    const dto = new SetRateRequestDto()
    dto.from = 'CNY'
    dto.to = 'USD'
    dto.rate = 0

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('currency.dto: MoneyOperandDto', () => {
  it('should accept valid money operand', async () => {
    const dto = new MoneyOperandDto()
    dto.amount = 100
    dto.currency = 'CNY'

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject invalid currency', async () => {
    const dto = new MoneyOperandDto()
    dto.amount = 100
    dto.currency = 'XYZ'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('currency.dto: ArithmeticRequestDto', () => {
  it('should accept valid add request', async () => {
    const dto = new ArithmeticRequestDto()
    dto.a = { amount: 100, currency: 'CNY' }
    dto.b = { amount: 50, currency: 'CNY' }
    dto.operation = 'add'

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject invalid operation', async () => {
    const dto = new ArithmeticRequestDto()
    dto.a = { amount: 100, currency: 'CNY' }
    dto.b = { amount: 50, currency: 'CNY' }
    ;(dto as any).operation = 'multiply'

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('currency.dto: ConfigUpdateDto', () => {
  it('should accept valid config update', async () => {
    const dto = new ConfigUpdateDto()
    dto.baseCurrency = 'USD'
    dto.decimalPlaces = 4
    dto.roundingMode = 'round'

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should accept empty config update (all optional)', async () => {
    const dto = new ConfigUpdateDto()

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })
})
