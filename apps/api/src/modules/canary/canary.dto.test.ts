import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * CanaryDto 单元测试 (V10 Day 8 Phase 92)
 *
 * 覆盖:
 * - CreateExperimentDto validation
 * - EvaluateDto validation
 * - OperatorActionDto validation
 * - PromoteActionDto validation
 * - RecordHealthDto validation
 */

import assert from 'node:assert/strict'
import { validate } from 'class-validator'
import { plainToClass } from 'class-transformer'
import {
  CreateExperimentDto,
  EvaluateDto,
  OperatorActionDto,
  PromoteActionDto,
  RecordHealthDto,
  StrategyConfigDto,
  AutoPromoteRuleDto,
} from './canary.dto'

describe('CanaryDto', () => {
  describe('CreateExperimentDto', () => {
    it('valid input passes validation', async () => {
      const dto = plainToClass(CreateExperimentDto, {
        name: 'AI V2 Canary',
        description: 'Test rollout',
        flagKey: 'ai.model.v2',
        strategy: 'percentage',
        strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 10,
        targetPercentage: 100,
        createdBy: 'admin',
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('missing required fields fails validation', async () => {
      const dto = plainToClass(CreateExperimentDto, {})
      const errors = await validate(dto)
      assert.ok(errors.length >= 3, `Expected >=3 errors, got ${errors.length}: ${errors.map(e => e.property).join(', ')}`)
    })

    it('invalid strategy enum fails', async () => {
      const dto = plainToClass(CreateExperimentDto, {
        name: 'Test', description: '', flagKey: 'f1',
        strategy: 'invalid_strategy',
        strategyConfig: { type: 'invalid_strategy' },
        initialPercentage: 10, targetPercentage: 100, createdBy: 'admin',
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('initialPercentage out of range fails', async () => {
      const dto = plainToClass(CreateExperimentDto, {
        name: 'Test', description: '', flagKey: 'f1',
        strategy: 'percentage',
        strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 150, targetPercentage: 100, createdBy: 'admin',
      })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'initialPercentage'))
    })

    it('optional autoPromote may be omitted', async () => {
      const dto = plainToClass(CreateExperimentDto, {
        name: 'Test', description: '', flagKey: 'f1',
        strategy: 'percentage',
        strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 10, targetPercentage: 100, createdBy: 'admin',
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })
  })

  describe('EvaluateDto', () => {
    it('valid input passes validation', async () => {
      const dto = plainToClass(EvaluateDto, {
        flagKey: 'ai.model.v2',
        tenantId: 't-001',
        storeId: 'store-001',
        tags: ['vip'],
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('missing flagKey fails', async () => {
      const dto = plainToClass(EvaluateDto, { tenantId: 't-001' })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'flagKey'))
    })

    it('missing tenantId fails', async () => {
      const dto = plainToClass(EvaluateDto, { flagKey: 'f1' })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'tenantId'))
    })

    it('optional storeId and tags can be omitted', async () => {
      const dto = plainToClass(EvaluateDto, {
        flagKey: 'f1',
        tenantId: 't-001',
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })
  })

  describe('OperatorActionDto', () => {
    it('valid input passes', async () => {
      const dto = plainToClass(OperatorActionDto, {
        operator: 'admin',
        reason: 'manual',
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('missing operator fails', async () => {
      const dto = plainToClass(OperatorActionDto, { reason: 'test' })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'operator'))
    })

    it('optional reason may be omitted', async () => {
      const dto = plainToClass(OperatorActionDto, { operator: 'admin' })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })
  })

  describe('PromoteActionDto', () => {
    it('valid input passes', async () => {
      const dto = plainToClass(PromoteActionDto, {
        percentage: 50,
        operator: 'admin',
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('percentage out of range fails', async () => {
      const dto = plainToClass(PromoteActionDto, {
        percentage: 200,
        operator: 'admin',
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('missing operator fails', async () => {
      const dto = plainToClass(PromoteActionDto, { percentage: 50 })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'operator'))
    })
  })

  describe('RecordHealthDto', () => {
    it('valid input passes', async () => {
      const dto = plainToClass(RecordHealthDto, {
        errorRate: 0.001,
        latencyP95: 200,
        latencyAvg: 100,
        totalRequests: 5000,
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('negative values fail', async () => {
      const dto = plainToClass(RecordHealthDto, {
        errorRate: -1,
        latencyP95: -1,
        latencyAvg: -1,
        totalRequests: -1,
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('errorRate > 1 fails', async () => {
      const dto = plainToClass(RecordHealthDto, {
        errorRate: 2,
        latencyP95: 200,
        latencyAvg: 100,
        totalRequests: 100,
      })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'errorRate'))
    })
  })
})
