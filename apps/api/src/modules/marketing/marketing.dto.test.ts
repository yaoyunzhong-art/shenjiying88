import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  ComputeRFMDto,
  RFMStatsQueryDto,
  CreateExperimentDto,
  RecordEventDto,
  ABResultQueryDto,
  ListExperimentsQueryDto,
  IssueCouponDto,
  AutoIssueCouponDto,
  RedeemCouponDto,
  FreqCapQueryDto,
  AttributeDto,
  RecordTouchPointDto,
  CalculateROIDto,
  RouteChannelQueryDto,
} from './marketing.dto'

describe('Marketing DTOs', () => {
  describe('ComputeRFMDto', () => {
    it('should accept valid input', async () => {
      const dto = plainToInstance(ComputeRFMDto, { tenantId: 't1', memberIds: ['m1', 'm2'] })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject missing tenantId', async () => {
      const dto = plainToInstance(ComputeRFMDto, { memberIds: ['m1'] })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'tenantId'))
    })

    it('should accept tenantId only (memberIds optional)', async () => {
      const dto = plainToInstance(ComputeRFMDto, { tenantId: 't1' })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject non-array memberIds', async () => {
      const dto = plainToInstance(ComputeRFMDto, { tenantId: 't1', memberIds: 'not-an-array' })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })
  })

  describe('RFMStatsQueryDto', () => {
    it('should accept valid input', async () => {
      const dto = plainToInstance(RFMStatsQueryDto, { tenantId: 't1' })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject missing tenantId', async () => {
      const dto = plainToInstance(RFMStatsQueryDto, {})
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'tenantId'))
    })
  })

  describe('CreateExperimentDto', () => {
    it('should accept valid input', async () => {
      const dto = plainToInstance(CreateExperimentDto, {
        tenantId: 't1',
        campaignId: 'c1',
        name: 'Test AB',
        variantA: { id: 'va', name: 'A', content: '', rewardType: 'COUPON', rewardValue: 100 },
        variantB: { id: 'vb', name: 'B', content: '', rewardType: 'POINTS', rewardValue: 50 },
        trafficSplit: 0.5,
        minSampleSize: 1000,
        status: 'RUNNING',
        startAt: new Date().toISOString(),
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject minSampleSize < 1', async () => {
      const dto = plainToInstance(CreateExperimentDto, {
        tenantId: 't1',
        campaignId: 'c1',
        name: 'Test',
        variantA: { id: 'va', name: 'A', content: '', rewardType: 'COUPON', rewardValue: 100 },
        variantB: { id: 'vb', name: 'B', content: '', rewardType: 'COUPON', rewardValue: 100 },
        trafficSplit: 0.5,
        minSampleSize: 0,
        status: 'DRAFT',
        startAt: new Date().toISOString(),
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'minSampleSize'))
    })

    it('should reject invalid rewardType', async () => {
      const dto = plainToInstance(CreateExperimentDto, {
        tenantId: 't1',
        campaignId: 'c1',
        name: 'Test',
        variantA: { id: 'va', name: 'A', content: '', rewardType: 'INVALID', rewardValue: 100 },
        variantB: { id: 'vb', name: 'B', content: '', rewardType: 'COUPON', rewardValue: 100 },
        trafficSplit: 0.5,
        minSampleSize: 100,
        status: 'DRAFT',
        startAt: new Date().toISOString(),
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })
  })

  describe('RecordEventDto', () => {
    it('should accept valid input', async () => {
      const dto = plainToInstance(RecordEventDto, { experimentId: 'exp1', memberId: 'm1', event: 'click' })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject invalid event', async () => {
      const dto = plainToInstance(RecordEventDto, { experimentId: 'exp1', memberId: 'm1', event: 'purchase' })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'event'))
    })
  })

  describe('ABResultQueryDto', () => {
    it('should reject missing experimentId', async () => {
      const dto = plainToInstance(ABResultQueryDto, {})
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'experimentId'))
    })

    it('should accept valid input', async () => {
      const dto = plainToInstance(ABResultQueryDto, { experimentId: 'exp1' })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })
  })

  describe('ListExperimentsQueryDto', () => {
    it('should reject missing tenantId', async () => {
      const dto = plainToInstance(ListExperimentsQueryDto, {})
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'tenantId'))
    })
  })

  describe('IssueCouponDto', () => {
    it('should accept valid input', async () => {
      const dto = plainToInstance(IssueCouponDto, {
        tenantId: 't1', memberId: 'm1', campaignId: 'c1',
        couponSegment: 'GENERIC', expiryDays: 30,
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject expiryDays < 1', async () => {
      const dto = plainToInstance(IssueCouponDto, {
        tenantId: 't1', memberId: 'm1', campaignId: 'c1',
        couponSegment: 'GENERIC', expiryDays: 0,
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'expiryDays'))
    })

    it('should reject invalid couponSegment', async () => {
      const dto = plainToInstance(IssueCouponDto, {
        tenantId: 't1', memberId: 'm1', campaignId: 'c1',
        couponSegment: 'UNKNOWN', expiryDays: 7,
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'couponSegment'))
    })
  })

  describe('RedeemCouponDto', () => {
    it('should accept valid input', async () => {
      const dto = plainToInstance(RedeemCouponDto, { tenantId: 't1', recordId: 'r1' })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject missing fields', async () => {
      const dto = plainToInstance(RedeemCouponDto, {})
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 2)
    })
  })

  describe('FreqCapQueryDto', () => {
    it('should accept tenantId + memberId only', async () => {
      const dto = plainToInstance(FreqCapQueryDto, { tenantId: 't1', memberId: 'm1' })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject missing tenantId', async () => {
      const dto = plainToInstance(FreqCapQueryDto, { memberId: 'm1' })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'tenantId'))
    })
  })

  describe('AttributeDto', () => {
    it('should accept valid input (last mode)', async () => {
      const dto = plainToInstance(AttributeDto, { memberId: 'm1', conversionId: 'c1', revenueCents: 10000 })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept multi mode', async () => {
      const dto = plainToInstance(AttributeDto, { memberId: 'm1', conversionId: 'c1', revenueCents: 10000, mode: 'multi' })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject invalid mode', async () => {
      const dto = plainToInstance(AttributeDto, { memberId: 'm1', conversionId: 'c1', revenueCents: 10000, mode: 'first' })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'mode'))
    })
  })

  describe('RecordTouchPointDto', () => {
    it('should accept valid input', async () => {
      const dto = plainToInstance(RecordTouchPointDto, {
        id: 't1', memberId: 'm1', channel: 'IN_APP', event: 'IMPRESSION',
        timestamp: new Date().toISOString(),
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject invalid channel', async () => {
      const dto = plainToInstance(RecordTouchPointDto, {
        id: 't1', memberId: 'm1', channel: 'FACEBOOK', event: 'IMPRESSION',
        timestamp: new Date().toISOString(),
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'channel'))
    })
  })

  describe('CalculateROIDto', () => {
    it('should accept valid input', async () => {
      const dto = plainToInstance(CalculateROIDto, {
        campaignId: 'c1', campaignName: 'Test',
        sent: 1000, clicked: 200, converted: 50,
        revenueCents: 500000, costCents: 100000, periodDays: 7,
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject periodDays < 1', async () => {
      const dto = plainToInstance(CalculateROIDto, {
        campaignId: 'c1', campaignName: 'Test',
        sent: 100, clicked: 10, converted: 1,
        revenueCents: 10000, costCents: 1000, periodDays: 0,
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'periodDays'))
    })
  })

  describe('RouteChannelQueryDto', () => {
    it('should accept valid input', async () => {
      const dto = plainToInstance(RouteChannelQueryDto, { tenantId: 't1', memberId: 'm1' })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject empty input', async () => {
      const dto = plainToInstance(RouteChannelQueryDto, {})
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 2)
    })
  })
})
