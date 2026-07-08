import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [blindbox] [D] 盲盒模块契约测试
 *
 * 验证盲盒模块 API 响应契约：
 * - 盲盒计划创建 & 查询
 * - 单抽 & 十连抽
 * - 概率公示 & 奖池查询
 * - 抽奖历史
 * - 边界条件（不存在、不可用、库存耗尽）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { firstValueFrom, toArray } from 'rxjs'
import { BlindboxController } from './blindbox.controller'
import { BlindboxService } from './blindbox.service'
import { BlindBoxStatus, type BlindBoxDrawRecord } from './blindbox.entity'

// ── 测试辅助 ──
function setup() {
  const service = new BlindboxService()
  const controller = new BlindboxController(service)
  return { service, controller }
}

function createSamplePlanFirst() {
  const { controller } = setup()
  const plan$ = controller.createPlan({
    name: '夏日盲盒',
    tiers: [
      {
        tierId: 't1',
        name: 'SSR',
        probability: 0.05,
        prizes: [
          { prizeId: 'p1', name: '限定手办', stock: 10, weight: 1 },
        ],
      },
      {
        tierId: 't2',
        name: 'SR',
        probability: 0.25,
        prizes: [
          { prizeId: 'p2', name: '钥匙扣', stock: 100, weight: 5 },
        ],
      },
      {
        tierId: 't3',
        name: 'R',
        probability: 0.70,
        prizes: [
          { prizeId: 'p3', name: '贴纸', stock: 500, weight: 20 },
        ],
      },
    ],
    guaranteePityCount: 90,
  })
  return { controller, plan$ }
}

describe('盲盒模块契约 — 盲盒计划', () => {
  it('POST /blindbox/plans 返回完整 BlindBoxPlan shape', async () => {
    const { plan$ } = createSamplePlanFirst()
    const plan = await firstValueFrom(plan$)

    assert.equal(typeof plan.planId, 'string')
    assert.ok(plan.planId.length > 0)
    assert.equal(plan.name, '夏日盲盒')
    assert.ok(plan.createdAt instanceof Date)
    assert.equal(plan.guaranteePityCount, 90)
    assert.equal(plan.status, BlindBoxStatus.ACTIVE)

    // tiers
    assert.ok(Array.isArray(plan.tiers))
    assert.equal(plan.tiers.length, 3)

    const ssrTier = plan.tiers.find(t => t.tierId === 't1')
    assert.ok(ssrTier)
    assert.equal(ssrTier.name, 'SSR')
    assert.equal(ssrTier.probability, 0.05)
    assert.ok(Array.isArray(ssrTier.prizes))
  })

  it('POST /blindbox/plans tiers 中每项都包含 prizes', async () => {
    const { plan$ } = createSamplePlanFirst()
    const plan = await firstValueFrom(plan$)

    for (const tier of plan.tiers) {
      assert.ok(Array.isArray(tier.prizes))
      for (const prize of tier.prizes) {
        assert.equal(typeof prize.prizeId, 'string')
        assert.equal(typeof prize.name, 'string')
        assert.equal(typeof prize.stock, 'number')
        assert.equal(typeof prize.weight, 'number')
        assert.ok(prize.stock >= 0)
        assert.ok(prize.weight > 0)
      }
    }
  })
})

describe('盲盒模块契约 — 单抽', () => {
  it('POST /blindbox/:planId/draw 返回 DrawResult shape', async () => {
    const { controller } = setup()
    const plan = await firstValueFrom(controller.createPlan({
      name: '基础盲盒',
      tiers: [
        { tierId: 't1', name: 'N', probability: 1.0, prizes: [{ prizeId: 'p1', name: '贴纸', stock: 999, weight: 1 }] },
      ],
      guaranteePityCount: 50,
    }))

    const result = await firstValueFrom(controller.draw(plan.planId, { userId: 'u-001' }))
    assert.equal(result.success, true)
    assert.ok(result.data)
    assert.ok(!Array.isArray(result.data))

    const record = result.data as BlindBoxDrawRecord
    assert.equal(typeof record.recordId, 'string')
    assert.equal(typeof record.planId, 'string')
    assert.equal(record.planId, plan.planId)
    assert.equal(typeof record.userId, 'string')
    assert.equal(record.userId, 'u-001')
    assert.equal(typeof record.prizeId, 'string')
    assert.equal(typeof record.prizeName, 'string')
    assert.equal(typeof record.tier, 'string')
    assert.ok(record.createdAt instanceof Date)
  })

  it('POST /blindbox/:planId/draw 返回不允许的 plan 时 success = false', async () => {
    const { controller } = setup()
    const result = await firstValueFrom(controller.draw('nonexistent-plan', { userId: 'u-001' }))
    assert.equal(result.success, false)
    assert.ok(result.message)
  })
})

describe('盲盒模块契约 — 十连抽', () => {
  it('POST /blindbox/:planId/draw/batch 返回 DrawResult 含 10 条记录', async () => {
    const { controller } = setup()
    const plan = await firstValueFrom(controller.createPlan({
      name: '十连测试',
      tiers: [
        { tierId: 't1', name: 'N', probability: 1.0, prizes: [{ prizeId: 'p1', name: '贴纸', stock: 9999, weight: 1 }] },
      ],
      guaranteePityCount: 50,
    }))

    const result = await firstValueFrom(controller.drawBatch(plan.planId, { userId: 'u-002' }))
    assert.equal(result.success, true)
    assert.ok(result.data)
    assert.ok(Array.isArray(result.data))
    assert.equal(result.data.length, 10)

    for (const record of result.data) {
      assert.equal(record.userId, 'u-002')
      assert.equal(record.planId, plan.planId)
      assert.equal(typeof record.recordId, 'string')
    }
  })

  it('POST /blindbox/:planId/draw/batch 不存在时返回 success = false', async () => {
    const { controller } = setup()
    const result = await firstValueFrom(controller.drawBatch('bad-id', { userId: 'u-002' }))
    assert.equal(result.success, false)
  })
})

describe('盲盒模块契约 — 概率公示', () => {
  it('GET /blindbox/:planId/probabilities 返回正确 shape', async () => {
    const { controller } = setup()
    const plan = await firstValueFrom(controller.createPlan({
      name: '概率公示测试',
      tiers: [
        { tierId: 't1', name: 'SSR', probability: 0.10, prizes: [{ prizeId: 'p1', name: '大奖', stock: 5, weight: 1 }] },
        { tierId: 't2', name: 'R', probability: 0.90, prizes: [{ prizeId: 'p2', name: '普奖', stock: 500, weight: 10 }] },
      ],
      guaranteePityCount: 100,
    }))

    const result = await firstValueFrom(controller.getProbabilities(plan.planId))

    assert.ok(result)
    assert.ok(Array.isArray(result.tiers))
    assert.equal(result.tiers.length, 2)
    assert.equal(result.sum, 1.0)

    const ssrTier = result.tiers.find(t => t.name === 'SSR')
    assert.ok(ssrTier)
    assert.equal(ssrTier.probability, 0.10)
  })

  it('GET /blindbox/:planId/probabilities 不存在时返回 null', async () => {
    const { controller } = setup()
    const result = await firstValueFrom(controller.getProbabilities('no-such-plan'))
    assert.equal(result, null)
  })
})

describe('盲盒模块契约 — 奖池查询', () => {
  it('GET /blindbox/:planId/prize-pool 返回正确 shape', async () => {
    const { controller } = setup()
    const plan = await firstValueFrom(controller.createPlan({
      name: '奖池测试',
      tiers: [
        { tierId: 't1', name: 'N', probability: 1.0, prizes: [{ prizeId: 'p1', name: '贴纸', stock: 100, weight: 1 }] },
      ],
      guaranteePityCount: 50,
    }))

    const result = await firstValueFrom(controller.getPrizePool(plan.planId))
    assert.ok(result)
    assert.equal(result.planId, plan.planId)
    assert.equal(result.name, '奖池测试')
    assert.ok(Array.isArray(result.prizePools))
  })

  it('GET /blindbox/:planId/prize-pool 不存在时返回 null', async () => {
    const { controller } = setup()
    const result = await firstValueFrom(controller.getPrizePool('missing'))
    assert.equal(result, null)
  })
})

describe('盲盒模块契约 — 抽奖历史', () => {
  it('GET /blindbox/:planId/history 返回 BlindBoxDrawRecord[]', async () => {
    const { controller } = setup()
    const plan = await firstValueFrom(controller.createPlan({
      name: '历史测试',
      tiers: [
        { tierId: 't1', name: 'N', probability: 1.0, prizes: [{ prizeId: 'p1', name: '贴纸', stock: 999, weight: 1 }] },
      ],
      guaranteePityCount: 50,
    }))

    // 先抽一次产生历史
    await firstValueFrom(controller.draw(plan.planId, { userId: 'u-h1' }))

    const history = await firstValueFrom(controller.getHistory(plan.planId, 'u-h1'))
    assert.ok(Array.isArray(history))
    const record = history[0]
    assert.equal(typeof record.recordId, 'string')
    assert.equal(typeof record.prizeId, 'string')
    assert.equal(typeof record.prizeName, 'string')
    assert.equal(typeof record.tier, 'string')
    assert.equal(typeof record.userId, 'string')
    assert.equal(record.userId, 'u-h1')
  })

  it('GET /blindbox/:planId/history 无记录时返回空数组', async () => {
    const { controller } = setup()
    const plan = await firstValueFrom(controller.createPlan({
      name: '空历史测试',
      tiers: [
        { tierId: 't1', name: 'N', probability: 1.0, prizes: [{ prizeId: 'p1', name: '贴纸', stock: 1, weight: 1 }] },
      ],
      guaranteePityCount: 50,
    }))

    const history = await firstValueFrom(controller.getHistory(plan.planId, 'u-no-draws'))
    assert.ok(Array.isArray(history))
    assert.equal(history.length, 0)
  })

  it('GET /blindbox/:planId/history 支持 limit 参数', async () => {
    const { controller } = setup()
    const plan = await firstValueFrom(controller.createPlan({
      name: 'Limit测试',
      tiers: [
        { tierId: 't1', name: 'N', probability: 1.0, prizes: [{ prizeId: 'p1', name: '币', stock: 9999, weight: 1 }] },
      ],
      guaranteePityCount: 50,
    }))

    // 抽多次
    for (let i = 0; i < 5; i++) {
      await firstValueFrom(controller.draw(plan.planId, { userId: 'u-lim' }))
    }

    const limited = await firstValueFrom(controller.getHistory(plan.planId, 'u-lim', '3'))
    assert.ok(limited.length <= 3)
  })
})
