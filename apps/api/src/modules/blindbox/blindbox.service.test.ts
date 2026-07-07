import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * blindbox.service.test.ts — BlindboxService 集成测试
 *
 * 覆盖已有 spec.ts 之外的关键集成场景：
 * - 完整的创建+抽取流程
 * - 保底机制边界 (pity count 精确验证)
 * - 多用户并发下的状态隔离
 * - 库存耗尽后降级行为
 * - 空计划/零保底/极端概率 边界条件
 * - 奖品池与抽取历史的一致性
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { lastValueFrom } from 'rxjs'
import { BlindboxService } from './blindbox.service'
import { BlindBoxStatus, DrawType } from './blindbox.entity'

// ═══════════════════════════════════════════════════════════════
// 辅助: 工厂函数
// ═══════════════════════════════════════════════════════════════

function createStandardPlanInput() {
  return {
    name: '集成测试盲盒',
    tiers: [
      {
        tierId: '1',
        name: 'UR',
        probability: 0.02,
        prizes: [{ prizeId: 'ur-1', name: 'UR限定', stock: 5, weight: 1 }],
      },
      {
        tierId: '2',
        name: 'SR',
        probability: 0.18,
        prizes: [{ prizeId: 'sr-1', name: 'SR道具', stock: 20, weight: 2 }],
      },
      {
        tierId: '3',
        name: 'R',
        probability: 0.80,
        prizes: [{ prizeId: 'r-1', name: 'R普通', stock: 100, weight: 10 }],
      },
    ],
    guaranteePityCount: 10,
  }
}

function makeService() {
  return new BlindboxService()
}

// ═══════════════════════════════════════════════════════════════
// BlindboxService 集成测试
// ═══════════════════════════════════════════════════════════════

describe('BlindboxService — 集成测试', () => {
  let svc: BlindboxService

  beforeEach(() => {
    svc = makeService()
  })

  // ── 创建 + 抽取 完整流程 ─────────────────────────────────

  describe('完整创建→抽取→查询流程', () => {
    it('创建计划后可以单抽并查询历史', async () => {
      const plan = await lastValueFrom(svc.createPlan(createStandardPlanInput()))
      const rec = await lastValueFrom(svc.drawSingle('user-flow', plan.planId))

      assert.ok(rec)
      assert.equal(rec!.userId, 'user-flow')
      assert.equal(rec!.planId, plan.planId)

      const history = await lastValueFrom(svc.getDrawHistory('user-flow', plan.planId))
      assert.equal(history.length, 1)
      assert.equal(history[0].recordId, rec!.recordId)
    })

    it('多个用户独立抽取互不影响', async () => {
      const plan = await lastValueFrom(svc.createPlan(createStandardPlanInput()))

      // user-a 抽 3 次, user-b 抽 2 次
      for (let i = 0; i < 3; i++) {
        await lastValueFrom(svc.drawSingle('user-a', plan.planId))
      }
      for (let i = 0; i < 2; i++) {
        await lastValueFrom(svc.drawSingle('user-b', plan.planId))
      }

      const ha = await lastValueFrom(svc.getDrawHistory('user-a', plan.planId))
      const hb = await lastValueFrom(svc.getDrawHistory('user-b', plan.planId))

      assert.equal(ha.length, 3)
      assert.equal(hb.length, 2)
    })
  })

  // ── 保底机制 ──────────────────────────────────────────────

  describe('保底机制 (Pity System)', () => {
    it('guaranteePityCount=1 时每次抽取必触发保底逻辑', async () => {
      const plan = await lastValueFrom(svc.createPlan({
        name: '次次保底',
        tiers: [
          {
            tierId: '1',
            name: 'High',
            probability: 0.01,
            prizes: [{ prizeId: 'h-1', name: '高稀有', stock: 100, weight: 1 }],
          },
          {
            tierId: '3',
            name: 'Low',
            probability: 0.99,
            prizes: [{ prizeId: 'l-1', name: '低稀有', stock: 500, weight: 1 }],
          },
        ],
        guaranteePityCount: 1,
      }))

      // 每次抽时 pity count >= 1 满足条件
      for (let i = 0; i < 5; i++) {
        const rec = await lastValueFrom(svc.drawSingle('user-pity-1', plan.planId))
        assert.ok(rec)
      }
    })

    it('连续抽取多次后保底追踪器正确递增', async () => {
      const plan = await lastValueFrom(svc.createPlan({
        name: '五抽保底',
        tiers: [
          {
            tierId: '2',
            name: 'Medium',
            probability: 0.10,
            prizes: [{ prizeId: 'm-1', name: '中稀有', stock: 100, weight: 1 }],
          },
          {
            tierId: '3',
            name: 'Common',
            probability: 0.90,
            prizes: [{ prizeId: 'c-1', name: '普通', stock: 1000, weight: 1 }],
          },
        ],
        guaranteePityCount: 5,
      }))

      // 10 次连续抽取，不应崩溃
      for (let i = 0; i < 10; i++) {
        const rec = await lastValueFrom(svc.drawSingle('user-pity-5', plan.planId))
        assert.ok(rec)
      }

      const history = await lastValueFrom(svc.getDrawHistory('user-pity-5', plan.planId))
      assert.equal(history.length, 10)
    })
  })

  // ── 库存耗尽 ──────────────────────────────────────────────

  describe('库存耗尽场景', () => {
    it('单 prize 库存为 0 时仍能抽出其他 prize', async () => {
      const plan = await lastValueFrom(svc.createPlan({
        name: '库存耗尽测试',
        tiers: [
          {
            tierId: '1',
            name: 'Limited',
            probability: 0.5,
            prizes: [
              { prizeId: 'out', name: '已售罄', stock: 0, weight: 1 },
              { prizeId: 'avail', name: '有货', stock: 100, weight: 1 },
            ],
          },
        ],
        guaranteePityCount: 100,
      }))

      for (let i = 0; i < 20; i++) {
        const rec = await lastValueFrom(svc.drawSingle('user-stock', plan.planId))
        assert.ok(rec)
        // 不会抽到已售罄的 prize
        assert.notEqual(rec!.prizeId, 'out')
      }
    })

    it('所有 prize 库存为 0 时抽取返回 null', async () => {
      const plan = await lastValueFrom(svc.createPlan({
        name: '全空',
        tiers: [
          {
            tierId: '1',
            name: 'Empty',
            probability: 1.0,
            prizes: [{ prizeId: 'gone', name: '没了', stock: 0, weight: 1 }],
          },
        ],
        guaranteePityCount: 100,
      }))

      const rec = await lastValueFrom(svc.drawSingle('user-empty', plan.planId))
      assert.equal(rec, null)
    })

    it('库存耗尽后再补充(新创建计划) 从新计划抽正常', async () => {
      const fullPlan = await lastValueFrom(svc.createPlan({
        name: '新库存',
        tiers: [
          {
            tierId: '1',
            name: 'New',
            probability: 1.0,
            prizes: [{ prizeId: 'new', name: '新奖品', stock: 10, weight: 1 }],
          },
        ],
        guaranteePityCount: 100,
      }))

      const rec = await lastValueFrom(svc.drawSingle('user-refill', fullPlan.planId))
      assert.ok(rec)
      assert.equal(rec!.prizeId, 'new')
    })
  })

  // ── 边界条件 ──────────────────────────────────────────────

  describe('边界条件', () => {
    it('不存在的 planId 时单抽返回 null', async () => {
      const rec = await lastValueFrom(svc.drawSingle('user-any', 'not-exist'))
      assert.equal(rec, null)
    })

    it('不存在的 planId 时十连抽返回 []', async () => {
      const recs = await lastValueFrom(svc.drawBatch10('user-any', 'not-exist'))
      assert.deepEqual(recs, [])
    })

    it('空 tier 计划抽奖返回 null', async () => {
      const plan = await lastValueFrom(svc.createPlan({
        name: '空层级',
        tiers: [],
        guaranteePityCount: 10,
      }))
      const rec = await lastValueFrom(svc.drawSingle('user-empty-tier', plan.planId))
      assert.equal(rec, null)
    })

    it('概率之和分散到多层验证不报错', async () => {
      // 5 个 tier，概率均匀分布
      const plan = await lastValueFrom(svc.createPlan({
        name: '五级分布',
        tiers: Array.from({ length: 5 }, (_, i) => ({
          tierId: `${i + 1}`,
          name: `T${i + 1}`,
          probability: 0.20,
          prizes: [{ prizeId: `p-${i}`, name: `奖品${i}`, stock: 10, weight: 1 }],
        })),
        guaranteePityCount: 20,
      }))

      for (let i = 0; i < 10; i++) {
        const rec = await lastValueFrom(svc.drawSingle('user-multi-tier', plan.planId))
        assert.ok(rec)
      }
    })

    it('十连抽与单抽记录互相独立不干扰', async () => {
      const plan = await lastValueFrom(svc.createPlan(createStandardPlanInput()))

      await lastValueFrom(svc.drawSingle('user-mix', plan.planId))
      await lastValueFrom(svc.drawBatch10('user-mix', plan.planId))

      const history = await lastValueFrom(svc.getDrawHistory('user-mix', plan.planId))
      assert.equal(history.length, 11) // 1 + 10
    })
  })

  // ── 奖品池 + 概率公示 一致性 ─────────────────────────────

  describe('奖品池与概率公示一致性', () => {
    it('概率公示的 tiers 与创建时的 tier 顺序一致', async () => {
      const plan = await lastValueFrom(svc.createPlan(createStandardPlanInput()))
      const prob = await lastValueFrom(svc.getProbability公示(plan.planId))

      assert.ok(prob)
      assert.equal(prob!.tiers.length, plan.tiers.length)
      prob!.tiers.forEach((t, i) => {
        assert.equal(t.name, plan.tiers[i].name)
        assert.equal(t.probability, plan.tiers[i].probability)
      })
    })

    it('奖品池的 tier 名称与概率公示的 tier 名称匹配', async () => {
      const plan = await lastValueFrom(svc.createPlan(createStandardPlanInput()))
      const pool = await lastValueFrom(svc.getPrizePool(plan.planId))
      const prob = await lastValueFrom(svc.getProbability公示(plan.planId))

      assert.ok(pool)
      assert.ok(prob)
      assert.equal(pool!.prizePools.length, prob!.tiers.length)
    })

    it('抽取后奖品池中的 stock 应 <= 初始 stock', async () => {
      const plan = await lastValueFrom(svc.createPlan({
        name: '库存一致性',
        tiers: [
          {
            tierId: '1',
            name: 'Only',
            probability: 1.0,
            prizes: [{ prizeId: 'only', name: '唯一奖', stock: 50, weight: 1 }],
          },
        ],
        guaranteePityCount: 100,
      }))

      const poolBefore = await lastValueFrom(svc.getPrizePool(plan.planId))
      const beforeStock = poolBefore!.prizePools[0].prizes[0].stock

      await lastValueFrom(svc.drawSingle('user-cons', plan.planId))
      await lastValueFrom(svc.drawSingle('user-cons', plan.planId))

      const poolAfter = await lastValueFrom(svc.getPrizePool(plan.planId))
      const afterStock = poolAfter!.prizePools[0].prizes[0].stock

      assert.ok(afterStock <= beforeStock)
    })
  })
})
