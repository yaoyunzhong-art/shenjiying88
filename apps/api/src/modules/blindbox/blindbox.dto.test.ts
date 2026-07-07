import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
/**
 * blindbox.dto.test.ts — BlindBox DTO 合约测试
 *
 * 守护：
 * - DTO 类存在且字段正确
 * - 验证装饰器能捕获非法输入
 * - 嵌套校验正常
 */

import { validate } from 'class-validator'
import {
  CreatePlanDto,
  TierDto,
  PrizeDto,
  DrawBodyDto,
  HistoryQueryDto,
} from './blindbox.dto'

// ─── PrizeDto ────────────────────────────────────────────────

describe('PrizeDto', () => {
  it('有效数据应通过验证', async () => {
    const dto = new PrizeDto()
    dto.prizeId = 'p1'
    dto.name = '一等奖'
    dto.stock = 10
    dto.weight = 1

    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('空 prizeId 应失败', async () => {
    const dto = new PrizeDto()
    dto.prizeId = ''
    dto.name = '奖'
    dto.stock = 5
    dto.weight = 1

    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'prizeId'))
  })

  it('负 stock 应失败', async () => {
    const dto = new PrizeDto()
    dto.prizeId = 'p1'
    dto.name = '奖'
    dto.stock = -1
    dto.weight = 1

    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'stock'))
  })

  it('weight 为 0 应失败', async () => {
    const dto = new PrizeDto()
    dto.prizeId = 'p1'
    dto.name = '奖'
    dto.stock = 5
    dto.weight = 0

    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'weight'))
  })
})

// ─── TierDto ─────────────────────────────────────────────────

describe('TierDto', () => {
  it('有效数据应通过验证', async () => {
    const prize = new PrizeDto()
    prize.prizeId = 'p1'
    prize.name = '奖'
    prize.stock = 5
    prize.weight = 1

    const dto = new TierDto()
    dto.tierId = '1'
    dto.name = '一等奖'
    dto.probability = 0.3
    dto.prizes = [prize]

    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('概率 > 1 应失败', async () => {
    const prize = new PrizeDto()
    prize.prizeId = 'p1'
    prize.name = '奖'
    prize.stock = 5
    prize.weight = 1

    const dto = new TierDto()
    dto.tierId = '1'
    dto.name = '一等奖'
    dto.probability = 1.5
    dto.prizes = [prize]

    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'probability'))
  })

  it('无 prizess 应失败', async () => {
    const dto = new TierDto()
    dto.tierId = '1'
    dto.name = '一等奖'
    dto.probability = 0.3
    dto.prizes = []

    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'prizes'))
  })
})

// ─── CreatePlanDto ───────────────────────────────────────────

describe('CreatePlanDto', () => {
  function validCreatePlanDto(): CreatePlanDto {
    const prize = new PrizeDto()
    prize.prizeId = 'p1'
    prize.name = '奖品'
    prize.stock = 10
    prize.weight = 1

    const tier = new TierDto()
    tier.tierId = '1'
    tier.name = '唯一档'
    tier.probability = 1.0
    tier.prizes = [prize]

    const dto = new CreatePlanDto()
    dto.name = '测试计划'
    dto.tiers = [tier]
    dto.guaranteePityCount = 5
    return dto
  }

  it('有效数据应通过验证', async () => {
    const dto = validCreatePlanDto()
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('空名称应失败', async () => {
    const dto = validCreatePlanDto()
    dto.name = ''
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('guaranteePityCount 为 0 应失败', async () => {
    const dto = validCreatePlanDto()
    dto.guaranteePityCount = 0
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('空 tiers 数组应失败', async () => {
    const dto = validCreatePlanDto()
    dto.tiers = []
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

// ─── DrawBodyDto ─────────────────────────────────────────────

describe('DrawBodyDto', () => {
  it('有效数据应通过验证', async () => {
    const dto = new DrawBodyDto()
    dto.userId = 'user-001'
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('空 userId 应失败', async () => {
    const dto = new DrawBodyDto()
    dto.userId = ''
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

// ─── HistoryQueryDto ─────────────────────────────────────────

describe('HistoryQueryDto', () => {
  it('有效数据应通过验证', async () => {
    const dto = new HistoryQueryDto()
    dto.userId = 'user-001'
    dto.limit = 20
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('limit 为可选字段', async () => {
    const dto = new HistoryQueryDto()
    dto.userId = 'user-001'
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('limit 超过 100 应失败', async () => {
    const dto = new HistoryQueryDto()
    dto.userId = 'user-001'
    dto.limit = 200
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

import assert from 'node:assert/strict'
