import 'reflect-metadata'
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * ai-forecast.dto.test.ts — AI 预测模块 DTO 验证测试
 *
 * 守护 class-validator 装饰器行为:
 * - 必填字段
 * - 类型校验
 * - 枚举值
 * - 可选字段
 * - 数值范围 Min/Max
 */

import assert from 'node:assert/strict'
import { validate } from 'class-validator'
import {
  ForecastQueryDto,
  CategoryForecastQueryDto,
  OptimalStockQueryDto,
  ReorderQueryDto,
  SlowMovingQueryDto,
  TransferQueryDto,
  TransferBenefitQueryDto,
  GlobalAllocationDto,
  StoreProductPairDto,
  PromotionAdjustDto,
  PromotionItemDto
} from './ai-forecast.dto'

// ─── Helper ──────────────────────────────────────────────────

async function validateDto(dto: object): Promise<string[]> {
  const errors = await validate(dto)
  return errors.flatMap(e => Object.values(e.constraints ?? {}))
}

// ─── ForecastQueryDto ────────────────────────────────────────

describe('[ai-forecast.dto] ForecastQueryDto', () => {
  it('有效输入不应有验证错误', async () => {
    const dto = Object.assign(new ForecastQueryDto(), { productId: 'prod-001', daysAhead: 7 })
    const errs = await validateDto(dto)
    assert.equal(errs.length, 0)
  })

  it('缺少 productId 应报错', async () => {
    const dto = Object.assign(new ForecastQueryDto(), { daysAhead: 7 })
    const errs = await validateDto(dto)
    assert.ok(errs.length > 0)
    assert.ok(errs.some(e => e.includes('productId')))
  })

  it('daysAhead 为 0 应报错（Min=1）', async () => {
    const dto = Object.assign(new ForecastQueryDto(), { productId: 'p1', daysAhead: 0 })
    const errs = await validateDto(dto)
    assert.ok(errs.length > 0)
  })

  it('daysAhead 超过 365 应报错（Max=365）', async () => {
    const dto = Object.assign(new ForecastQueryDto(), { productId: 'p1', daysAhead: 400 })
    const errs = await validateDto(dto)
    assert.ok(errs.length > 0)
  })

  it('categoryId 为可选字段', async () => {
    const dto = Object.assign(new ForecastQueryDto(), { productId: 'p1', daysAhead: 7 })
    const errs = await validateDto(dto)
    assert.equal(errs.length, 0)
  })
})

// ─── CategoryForecastQueryDto ────────────────────────────────

describe('[ai-forecast.dto] CategoryForecastQueryDto', () => {
  it('有效输入不应有验证错误', async () => {
    const dto = Object.assign(new CategoryForecastQueryDto(), { categoryId: 'cat-001', daysAhead: 14 })
    assert.equal((await validateDto(dto)).length, 0)
  })

  it('缺少 categoryId 应报错', async () => {
    const dto = Object.assign(new CategoryForecastQueryDto(), { daysAhead: 7 })
    assert.ok((await validateDto(dto)).length > 0)
  })
})

// ─── OptimalStockQueryDto ────────────────────────────────────

describe('[ai-forecast.dto] OptimalStockQueryDto', () => {
  it('有效输入不应有验证错误', async () => {
    const dto = Object.assign(new OptimalStockQueryDto(), { productId: 'p1', leadTime: 7, daysAhead: 7 })
    assert.equal((await validateDto(dto)).length, 0)
  })

  it('leadTime 为 0 应报错', async () => {
    const dto = Object.assign(new OptimalStockQueryDto(), { productId: 'p1', leadTime: 0, daysAhead: 7 })
    assert.ok((await validateDto(dto)).length > 0)
  })

  it('leadTime 超过 90 应报错', async () => {
    const dto = Object.assign(new OptimalStockQueryDto(), { productId: 'p1', leadTime: 100, daysAhead: 7 })
    assert.ok((await validateDto(dto)).length > 0)
  })
})

// ─── ReorderQueryDto ─────────────────────────────────────────

describe('[ai-forecast.dto] ReorderQueryDto', () => {
  it('有效输入不应有验证错误', async () => {
    const dto = Object.assign(new ReorderQueryDto(), { productId: 'p1' })
    assert.equal((await validateDto(dto)).length, 0)
  })

  it('空 productId 应报错', async () => {
    const dto = Object.assign(new ReorderQueryDto(), { productId: '' })
    assert.ok((await validateDto(dto)).length > 0)
  })
})

// ─── SlowMovingQueryDto ──────────────────────────────────────

describe('[ai-forecast.dto] SlowMovingQueryDto', () => {
  it('有效输入（不含可选字段）不应报错', async () => {
    const dto = Object.assign(new SlowMovingQueryDto(), { productId: 'p1' })
    assert.equal((await validateDto(dto)).length, 0)
  })

  it('有效输入（含 thresholdDays）不应报错', async () => {
    const dto = Object.assign(new SlowMovingQueryDto(), { productId: 'p1', thresholdDays: 30 })
    assert.equal((await validateDto(dto)).length, 0)
  })

  it('thresholdDays 超出范围应报错', async () => {
    const dto = Object.assign(new SlowMovingQueryDto(), { productId: 'p1', thresholdDays: 999 })
    assert.ok((await validateDto(dto)).length > 0)
  })
})

// ─── TransferQueryDto ────────────────────────────────────────

describe('[ai-forecast.dto] TransferQueryDto', () => {
  it('有效输入不应报错', async () => {
    const dto = Object.assign(new TransferQueryDto(), { fromStore: 'store-A', toStore: 'store-B', productId: 'p1' })
    assert.equal((await validateDto(dto)).length, 0)
  })

  it('空 fromStore 应报错', async () => {
    const dto = Object.assign(new TransferQueryDto(), { fromStore: '', toStore: 'store-B', productId: 'p1' })
    assert.ok((await validateDto(dto)).length > 0)
  })
})

// ─── GlobalAllocationDto + StoreProductPairDto ───────────────

describe('[ai-forecast.dto] GlobalAllocationDto', () => {
  it('有效输入（1对）不应报错', async () => {
    const pair = Object.assign(new StoreProductPairDto(), { storeId: 'store-A', productId: 'p1' })
    const dto = Object.assign(new GlobalAllocationDto(), { products: [pair] })
    assert.equal((await validateDto(dto)).length, 0)
  })

  it('空 products 数组应报错', async () => {
    const dto = Object.assign(new GlobalAllocationDto(), { products: [] })
    assert.ok((await validateDto(dto)).length > 0)
  })
})

// ─── PromotionAdjustDto + PromotionItemDto ───────────────────

describe('[ai-forecast.dto] PromotionAdjustDto', () => {
  it('有效输入不应报错', async () => {
    const promo = Object.assign(new PromotionItemDto(), {
      id: 'promo-1',
      type: 'discount',
      startDate: '2026-07-01T00:00:00Z',
      endDate: '2026-07-15T00:00:00Z',
      boostPercent: 0.2
    })
    const dto = Object.assign(new PromotionAdjustDto(), { productId: 'p1', daysAhead: 7, promotions: [promo] })
    assert.equal((await validateDto(dto)).length, 0)
  })

  it('boostPercent 为负应报错（直接验证 PromotionItemDto）', async () => {
    const promo = Object.assign(new PromotionItemDto(), {
      id: 'promo-2',
      type: 'discount',
      startDate: '2026-07-01T00:00:00Z',
      endDate: '2026-07-15T00:00:00Z',
      boostPercent: -0.1
    })
    assert.ok((await validate(promo)).length > 0)
  })

  it('boostPercent 超过 10 应报错（直接验证 PromotionItemDto）', async () => {
    const promo = Object.assign(new PromotionItemDto(), {
      id: 'promo-3',
      type: 'discount',
      startDate: '2026-07-01T00:00:00Z',
      endDate: '2026-07-15T00:00:00Z',
      boostPercent: 99
    })
    assert.ok((await validate(promo)).length > 0)
  })

  it('非法 type 应报错', async () => {
    const promo = Object.assign(new PromotionItemDto(), {
      id: 'promo-4',
      type: 'unknown',
      startDate: '2026-07-01T00:00:00Z',
      endDate: '2026-07-15T00:00:00Z',
      boostPercent: 0.1
    })
    // 传字符串让 class-validator 处理类型错误
    const dto = Object.assign(new PromotionItemDto(), {
      id: 'promo-4',
      type: 'unknown',
      startDate: '2026-07-01T00:00:00Z',
      endDate: '2026-07-15T00:00:00Z',
      boostPercent: 0.1
    })
    const errs = await validate(dto)
    assert.ok(errs.length > 0)
  })
})
