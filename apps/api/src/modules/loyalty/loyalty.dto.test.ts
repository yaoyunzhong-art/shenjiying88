import 'reflect-metadata'
import { describe, it } from 'node:test'
import assert from 'node:assert'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  PointsLedgerQueryDto,
  CouponRedemptionQueryDto,
  BlindboxFulfillmentQueryDto,
  SettlementQueryDto
} from './loyalty.dto'

describe('Loyalty DTOs', () => {
  describe('PointsLedgerQueryDto', () => {
    it('should accept empty query (all optional)', async () => {
      const dto = plainToInstance(PointsLedgerQueryDto, {})
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept query with orderId', async () => {
      const dto = plainToInstance(PointsLedgerQueryDto, {
        orderId: 'order-001'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept query with memberId', async () => {
      const dto = plainToInstance(PointsLedgerQueryDto, {
        memberId: 'mem-001'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept query with both fields', async () => {
      const dto = plainToInstance(PointsLedgerQueryDto, {
        orderId: 'order-001',
        memberId: 'mem-001'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })
  })

  describe('CouponRedemptionQueryDto', () => {
    it('should accept empty query', async () => {
      const dto = plainToInstance(CouponRedemptionQueryDto, {})
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept query with couponCode', async () => {
      const dto = plainToInstance(CouponRedemptionQueryDto, {
        couponCode: 'WELCOME2024'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept query with all fields', async () => {
      const dto = plainToInstance(CouponRedemptionQueryDto, {
        orderId: 'order-001',
        memberId: 'mem-001',
        couponCode: 'WELCOME2024'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })
  })

  describe('BlindboxFulfillmentQueryDto', () => {
    it('should accept empty query', async () => {
      const dto = plainToInstance(BlindboxFulfillmentQueryDto, {})
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept query with blindboxPlanId', async () => {
      const dto = plainToInstance(BlindboxFulfillmentQueryDto, {
        blindboxPlanId: 'plan-golden'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept query with all fields', async () => {
      const dto = plainToInstance(BlindboxFulfillmentQueryDto, {
        orderId: 'order-001',
        memberId: 'mem-001',
        blindboxPlanId: 'plan-golden'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })
  })

  describe('SettlementQueryDto', () => {
    it('should accept empty query', async () => {
      const dto = plainToInstance(SettlementQueryDto, {})
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept query with memberId', async () => {
      const dto = plainToInstance(SettlementQueryDto, {
        memberId: 'mem-001'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })
  })
})
