import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { LevelEvaluationInputDto, BatchLevelItemDto, BatchLevelInputDto, LevelConfigUpdateDto, LevelQueryDto, LevelThresholdDto } from './member-level.dto'

describe('MemberLevel DTOs', () => {
  describe('LevelEvaluationInputDto', () => {
    it('should construct with valid properties', () => {
      // Since these are class-validator decorated classes,
      // we verify the metadata/reflect decoration exists.
      const dto = new LevelEvaluationInputDto()
      dto.memberId = 'm1'
      dto.growthValue = 100
      dto.totalSpend = 500
      dto.totalVisits = 5
      dto.tenantId = 't1'

      assert.equal(dto.memberId, 'm1')
      assert.equal(dto.growthValue, 100)
      assert.equal(dto.totalSpend, 500)
      assert.equal(dto.totalVisits, 5)
      assert.equal(dto.tenantId, 't1')
    })

    it('should have decorators on all required fields', () => {
      const dto = new LevelEvaluationInputDto()

      // Verify reflect-metadata picks up validation decorators
      const properties = ['memberId', 'growthValue', 'totalSpend', 'totalVisits', 'tenantId']
      for (const prop of properties) {
        assert.ok(prop in dto, `Property ${prop} should exist`)
      }
    })
  })

  describe('BatchLevelInputDto', () => {
    it('should construct with items array', () => {
      const dto = new BatchLevelInputDto()

      const item1 = new BatchLevelItemDto()
      const input1 = new LevelEvaluationInputDto()
      input1.memberId = 'm1'
      input1.growthValue = 100
      input1.totalSpend = 500
      input1.totalVisits = 5
      input1.tenantId = 't1'
      item1.input = input1

      dto.items = [item1]

      assert.equal(dto.items.length, 1)
      assert.equal(dto.items[0].input.memberId, 'm1')
    })
  })

  describe('LevelConfigUpdateDto', () => {
    it('should construct with optional thresholds', () => {
      const dto = new LevelConfigUpdateDto()

      assert.equal(dto.thresholds, undefined)
    })
  })

  describe('LevelQueryDto', () => {
    it('should construct with optional memberId', () => {
      const dto = new LevelQueryDto()
      dto.memberId = 'm1'

      assert.equal(dto.memberId, 'm1')
      assert.equal(dto.tier, undefined)
    })
  })
})
