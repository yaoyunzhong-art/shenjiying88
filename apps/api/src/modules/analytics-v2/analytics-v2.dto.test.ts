import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  CollectEventDto,
  CollectBatchDto,
  ApplyCDCDto,
  ReplayCDCDto,
  RegisterMemberDto,
  TrackActivityDto,
  CreateFunnelDto,
  FunnelStepDto,
  GenerateRetentionDto,
  MetricsSummaryQueryDto,
  RecentEventsQueryDto,
  LiveMetricsQueryDto,
  CohortListQueryDto,
  CohortMatrixQueryDto,
  TenantQueryDto,
  CDCQueryDto,
  RetentionHealthQueryDto
} from './analytics-v2.dto'

describe('AnalyticsV2 DTOs', () => {
  describe('CollectEventDto', () => {
    it('should accept valid event data', async () => {
      const dto = plainToInstance(CollectEventDto, {
        tenantId: 't1', eventId: 'evt-001', type: 'PAGEVIEW', who: 'm1', what: 'home_page',
        memberId: 'm1', sessionId: 's1', revenueCents: 0,
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject missing required fields', async () => {
      const dto = plainToInstance(CollectEventDto, {})
      const errors = await validate(dto)
      assert.ok(errors.length >= 3)
      const properties = errors.map(e => e.property)
      assert.ok(properties.includes('tenantId'))
      assert.ok(properties.includes('eventId'))
      assert.ok(properties.includes('type'))
    })

    it('should reject invalid event type', async () => {
      const dto = plainToInstance(CollectEventDto, {
        tenantId: 't1', eventId: 'evt-1', type: 'INVALID', who: 'm1', what: 'x'
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('should reject negative revenueCents', async () => {
      const dto = plainToInstance(CollectEventDto, {
        tenantId: 't1', eventId: 'evt-1', type: 'PAGEVIEW', who: 'm1', what: 'x',
        revenueCents: -100
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some(e => e.property === 'revenueCents'))
    })

    it('should accept optional fields', async () => {
      const dto = plainToInstance(CollectEventDto, {
        tenantId: 't1', eventId: 'evt-2', type: 'PURCHASE', who: 'm2', what: 'checkout',
        memberId: 'm2', sessionId: 's2',
        where: { url: '/checkout', channel: 'web' },
        why: 'clicked_buy', how: 'desktop',
        properties: { productId: 'p1', price: 2999 },
        revenueCents: 299900, timestamp: '2026-06-28T08:00:00Z'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })
  })

  describe('CollectBatchDto', () => {
    it('should accept batch of events', async () => {
      const dto = plainToInstance(CollectBatchDto, {
        events: [
          { tenantId: 't1', eventId: 'e1', type: 'PAGEVIEW', who: 'm1', what: 'home' },
          { tenantId: 't1', eventId: 'e2', type: 'CLICK', who: 'm1', what: 'btn' },
        ]
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject empty batch', async () => {
      const dto = plainToInstance(CollectBatchDto, { events: [] })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })
  })

  describe('ApplyCDCDto', () => {
    it('should accept valid CDC event', async () => {
      const dto = plainToInstance(ApplyCDCDto, {
        tenantId: 't1', tableName: 'members', recordId: 'm1',
        eventType: 'UPDATED', eventId: 'cdc-001',
        watermark: 1719542400000, before: { name: 'Old' }, after: { name: 'New' }
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject missing required fields', async () => {
      const dto = plainToInstance(ApplyCDCDto, {})
      const errors = await validate(dto)
      assert.ok(errors.length >= 4)
    })

    it('should reject invalid event type', async () => {
      const dto = plainToInstance(ApplyCDCDto, {
        tenantId: 't1', tableName: 'm', recordId: '1', eventType: 'ARCHIVED', eventId: 'c1'
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })
  })

  describe('RegisterMemberDto', () => {
    it('should accept valid registration', async () => {
      const dto = plainToInstance(RegisterMemberDto, {
        tenantId: 't1', period: 'WEEKLY', memberId: 'm1', registrationDate: '2026-06-28'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject invalid period', async () => {
      const dto = plainToInstance(RegisterMemberDto, {
        tenantId: 't1', period: 'DAILY', memberId: 'm1', registrationDate: '2026-06-28'
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })
  })

  describe('CreateFunnelDto', () => {
    it('should accept valid funnel definition', async () => {
      const dto = plainToInstance(CreateFunnelDto, {
        tenantId: 't1', name: '注册转化漏斗',
        steps: [
          { name: '访问首页', eventType: 'PAGEVIEW' },
          { name: '点击注册', eventType: 'CLICK' },
          { name: '完成注册', eventType: 'CONVERSION' },
        ],
        windowDays: 7
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject empty steps', async () => {
      const dto = plainToInstance(CreateFunnelDto, {
        tenantId: 't1', name: 'test', steps: []
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('should reject windowDays outside [1,90]', async () => {
      const dto = plainToInstance(CreateFunnelDto, {
        tenantId: 't1', name: 'Test',
        steps: [{ name: 's1', eventType: 'PAGEVIEW' }],
        windowDays: 100
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('should accept minimum funnel', async () => {
      const dto = plainToInstance(CreateFunnelDto, {
        tenantId: 't1', name: 'Min', steps: [{ name: 's1', eventType: 'CUSTOM' }]
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })
  })

  describe('TrackActivityDto', () => {
    it('should accept valid activity', async () => {
      const dto = plainToInstance(TrackActivityDto, {
        tenantId: 't1', memberId: 'm1', activityType: 'PURCHASE',
        properties: { product: 'p1', amount: 199 }
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject invalid activity type', async () => {
      const dto = plainToInstance(TrackActivityDto, {
        tenantId: 't1', memberId: 'm1', activityType: 'UNKNOWN'
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })
  })

  describe('Query DTOs', () => {
    it('MetricsSummaryQueryDto: valid', async () => {
      const dto = plainToInstance(MetricsSummaryQueryDto, { tenantId: 't1', days: '14' })
      const errs = await validate(dto)
      assert.strictEqual(errs.length, 0)
    })

    it('MetricsSummaryQueryDto: missing tenantId', async () => {
      const dto = plainToInstance(MetricsSummaryQueryDto, {})
      const errs = await validate(dto)
      assert.ok(errs.length > 0)
    })

    it('RecentEventsQueryDto: valid', async () => {
      const dto = plainToInstance(RecentEventsQueryDto, { tenantId: 't1', limit: '100' })
      const errs = await validate(dto)
      assert.strictEqual(errs.length, 0)
    })

    it('CohortListQueryDto: valid', async () => {
      const dto = plainToInstance(CohortListQueryDto, { tenantId: 't1', period: 'WEEKLY' })
      const errs = await validate(dto)
      assert.strictEqual(errs.length, 0)
    })

    it('CohortListQueryDto: without period', async () => {
      const dto = plainToInstance(CohortListQueryDto, { tenantId: 't1' })
      const errs = await validate(dto)
      assert.strictEqual(errs.length, 0)
    })

    it('TenantQueryDto: valid', async () => {
      const dto = plainToInstance(TenantQueryDto, { tenantId: 't1' })
      const errs = await validate(dto)
      assert.strictEqual(errs.length, 0)
    })
  })

  describe('FunnelStepDto', () => {
    it('should accept valid step', async () => {
      const dto = plainToInstance(FunnelStepDto, {
        name: '访问首页', eventType: 'PAGEVIEW', filter: { page: '/' }
      })
      const errs = await validate(dto)
      assert.strictEqual(errs.length, 0)
    })

    it('should reject missing name', async () => {
      const dto = plainToInstance(FunnelStepDto, { eventType: 'PAGEVIEW' })
      const errs = await validate(dto)
      assert.ok(errs.length > 0)
    })
  })
})
