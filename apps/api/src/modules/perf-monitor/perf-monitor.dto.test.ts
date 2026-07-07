import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { validate } from 'class-validator'
import { RecordSampleDto, RegisterSlaDto, SlowQueriesQueryDto, ResetDto } from './perf-monitor.dto'

describe('PerfMonitorDto', () => {
  describe('RecordSampleDto', () => {
    it('should accept valid input', async () => {
      const dto = new RecordSampleDto()
      dto.route = '/api/test'
      dto.durationMs = 100
      dto.statusCode = 200
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject missing route', async () => {
      const dto = new RecordSampleDto()
      dto.durationMs = 100
      dto.statusCode = 200
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject negative durationMs', async () => {
      const dto = new RecordSampleDto()
      dto.route = '/api/test'
      dto.durationMs = -1
      dto.statusCode = 200
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should accept optional fields', async () => {
      const dto = new RecordSampleDto()
      dto.route = '/api/test'
      dto.durationMs = 100
      dto.statusCode = 200
      dto.tenantId = 'tenant-001'
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })
  })

  describe('RegisterSlaDto', () => {
    it('should accept valid input', async () => {
      const dto = new RegisterSlaDto()
      dto.route = '/api/test'
      dto.targetP95Ms = 200
      dto.warnThresholdP95Ms = 250
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject invalid thresholds', async () => {
      const dto = new RegisterSlaDto()
      dto.route = '/api/test'
      dto.targetP95Ms = -1
      dto.warnThresholdP95Ms = 0
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('SlowQueriesQueryDto', () => {
    it('should accept valid limit', async () => {
      const dto = new SlowQueriesQueryDto()
      dto.limit = 10
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should accept empty (optional)', async () => {
      const dto = new SlowQueriesQueryDto()
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })
  })

  describe('ResetDto', () => {
    it('should accept valid confirm', async () => {
      const dto = new ResetDto()
      dto.confirm = true
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })
  })
})
