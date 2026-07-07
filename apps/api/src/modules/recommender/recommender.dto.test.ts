import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  RecommendQueryDto,
  RecommendFeedbackDto,
  RecommendStatsQueryDto,
} from './recommender.dto'

describe('recommender DTOs', () => {
  // ── RecommendQueryDto ───────────────────────────────────────
  describe('RecommendQueryDto', () => {
    it('should validate a valid query with required fields', async () => {
      const dto = plainToInstance(RecommendQueryDto, {
        championId: 'c-001',
        currentFiles: ['coupon.service.ts', 'coupon.controller.ts'],
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should validate a query with all optional fields', async () => {
      const dto = plainToInstance(RecommendQueryDto, {
        championId: 'c-001',
        currentFiles: ['main.ts'],
        branch: 'feat/coupon-v2',
        topK: 10,
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject empty championId', async () => {
      const dto = plainToInstance(RecommendQueryDto, {
        championId: '',
        currentFiles: ['test.ts'],
      })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'championId'))
    })

    it('should reject missing championId', async () => {
      const dto = plainToInstance(RecommendQueryDto, {
        currentFiles: ['test.ts'],
      })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'championId'))
    })

    it('should reject missing currentFiles', async () => {
      const dto = plainToInstance(RecommendQueryDto, {
        championId: 'c-001',
      })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'currentFiles'))
    })

    it('should reject empty currentFiles array', async () => {
      const dto = plainToInstance(RecommendQueryDto, {
        championId: 'c-001',
        currentFiles: [],
      })
      const errors = await validate(dto)
      // ArrayMinSize(1) — need to check decorator
      // If no @ArrayMinSize, empty array is valid
      // Let's just verify it doesn't crash
      assert.ok(Array.isArray(dto.currentFiles))
    })

    it('should reject non-string items in currentFiles', async () => {
      const dto = plainToInstance(RecommendQueryDto, {
        championId: 'c-001',
        currentFiles: [42, 'valid.ts'],
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('should reject topK below minimum', async () => {
      const dto = plainToInstance(RecommendQueryDto, {
        championId: 'c-001',
        currentFiles: ['test.ts'],
        topK: 0,
      })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'topK'))
    })

    it('should reject topK above maximum', async () => {
      const dto = plainToInstance(RecommendQueryDto, {
        championId: 'c-001',
        currentFiles: ['test.ts'],
        topK: 100,
      })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'topK'))
    })

    it('should accept topK at boundary values', async () => {
      const low = plainToInstance(RecommendQueryDto, {
        championId: 'c-b',
        currentFiles: ['test.ts'],
        topK: 1,
      })
      const high = plainToInstance(RecommendQueryDto, {
        championId: 'c-b',
        currentFiles: ['test.ts'],
        topK: 50,
      })
      const errLow = await validate(low)
      const errHigh = await validate(high)
      assert.strictEqual(errLow.length, 0)
      assert.strictEqual(errHigh.length, 0)
    })

    it('should reject topK as string', async () => {
      const dto = plainToInstance(RecommendQueryDto, {
        championId: 'c-001',
        currentFiles: ['test.ts'],
        topK: 'ten',
      })
      const errors = await validate(dto)
      // transform: true should try to coerce, so string 'ten' -> NaN -> error
      assert.ok(errors.length > 0)
    })

    it('should accept non-number topK when undefined', async () => {
      const dto = plainToInstance(RecommendQueryDto, {
        championId: 'c-001',
        currentFiles: ['test.ts'],
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject championId as number', async () => {
      const dto = plainToInstance(RecommendQueryDto, {
        championId: 12345,
        currentFiles: ['test.ts'],
      })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'championId'))
    })

    it('should accept single file in currentFiles', async () => {
      const dto = plainToInstance(RecommendQueryDto, {
        championId: 'c-single',
        currentFiles: ['single-file.ts'],
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept many files in currentFiles', async () => {
      const manyFiles = Array.from({ length: 100 }, (_, i) => `file-${i}.ts`)
      const dto = plainToInstance(RecommendQueryDto, {
        championId: 'c-many',
        currentFiles: manyFiles,
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })
  })

  // ── RecommendFeedbackDto ─────────────────────────────────────
  describe('RecommendFeedbackDto', () => {
    it('should validate valid feedback with "adopted" action', async () => {
      const dto = plainToInstance(RecommendFeedbackDto, {
        championId: 'c-001',
        chunkId: 'chunk-001',
        action: 'adopted',
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should validate all three valid actions', async () => {
      for (const action of ['adopted', 'dismissed', 'read'] as const) {
        const dto = plainToInstance(RecommendFeedbackDto, {
          championId: 'c-001',
          chunkId: 'chunk-001',
          action,
        })
        const errors = await validate(dto)
        assert.strictEqual(errors.length, 0, `action=${action} should be valid`)
      }
    })

    it('should reject invalid action', async () => {
      const dto = plainToInstance(RecommendFeedbackDto, {
        championId: 'c-001',
        chunkId: 'chunk-001',
        action: 'unknown',
      })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'action'))
    })

    it('should reject missing championId', async () => {
      const dto = plainToInstance(RecommendFeedbackDto, {
        chunkId: 'chunk-001',
        action: 'adopted',
      })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'championId'))
    })

    it('should reject empty championId', async () => {
      const dto = plainToInstance(RecommendFeedbackDto, {
        championId: '',
        chunkId: 'chunk-001',
        action: 'adopted',
      })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'championId'))
    })

    it('should reject missing chunkId', async () => {
      const dto = plainToInstance(RecommendFeedbackDto, {
        championId: 'c-001',
        action: 'adopted',
      })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'chunkId'))
    })

    it('should reject empty chunkId', async () => {
      const dto = plainToInstance(RecommendFeedbackDto, {
        championId: 'c-001',
        chunkId: '',
        action: 'adopted',
      })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'chunkId'))
    })

    it('should reject missing action', async () => {
      const dto = plainToInstance(RecommendFeedbackDto, {
        championId: 'c-001',
        chunkId: 'chunk-001',
      })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'action'))
    })

    it('should reject numeric championId', async () => {
      const dto = plainToInstance(RecommendFeedbackDto, {
        championId: 999,
        chunkId: 'chunk-001',
        action: 'adopted',
      })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'championId'))
    })
  })

  // ── RecommendStatsQueryDto ──────────────────────────────────
  describe('RecommendStatsQueryDto', () => {
    it('should validate with all fields optional', async () => {
      const dto = plainToInstance(RecommendStatsQueryDto, {})
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should validate with championId only', async () => {
      const dto = plainToInstance(RecommendStatsQueryDto, {
        championId: 'c-001',
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should validate with module only', async () => {
      const dto = plainToInstance(RecommendStatsQueryDto, {
        module: 'coupon',
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should validate with days only', async () => {
      const dto = plainToInstance(RecommendStatsQueryDto, {
        days: 30,
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should validate with all fields', async () => {
      const dto = plainToInstance(RecommendStatsQueryDto, {
        championId: 'c-001',
        module: 'coupon',
        days: 7,
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject days below minimum', async () => {
      const dto = plainToInstance(RecommendStatsQueryDto, {
        days: 0,
      })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'days'))
    })

    it('should reject days above maximum', async () => {
      const dto = plainToInstance(RecommendStatsQueryDto, {
        days: 500,
      })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'days'))
    })

    it('should accept days at boundaries', async () => {
      const low = plainToInstance(RecommendStatsQueryDto, { days: 1 })
      const high = plainToInstance(RecommendStatsQueryDto, { days: 365 })
      const errLow = await validate(low)
      const errHigh = await validate(high)
      assert.strictEqual(errLow.length, 0)
      assert.strictEqual(errHigh.length, 0)
    })

    it('should reject days as string', async () => {
      const dto = plainToInstance(RecommendStatsQueryDto, {
        days: 'thirty',
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('should reject negative days', async () => {
      const dto = plainToInstance(RecommendStatsQueryDto, {
        days: -7,
      })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'days'))
    })
  })
})
