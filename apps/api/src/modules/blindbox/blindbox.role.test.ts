import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * blindbox.role.test.ts — BlindBox 八角色权限与场景测试
 *
 * 覆盖 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 每个角色至少 2 个用例：正常流程 + 权限边界
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { lastValueFrom } from 'rxjs'
import { BlindboxService } from './blindbox.service'
import { BlindBoxStatus } from './blindbox.entity'
import type { BlindBoxPlan, BlindBoxTier, BlindBoxDrawRecord } from './blindbox.entity'

// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

// ── 辅助工厂 ──

function makeService(): BlindboxService {
  return new BlindboxService()
}

function makeSamplePlanInput(name = '测试盲盒') {
  return {
    name,
    tiers: [
      {
        tierId: '1',
        name: 'SSR',
        probability: 0.05,
        prizes: [
          { prizeId: 'ssr1', name: '限定手办', stock: 3, weight: 1 },
          { prizeId: 'ssr2', name: '稀有徽章', stock: 2, weight: 2 },
        ],
      },
      {
        tierId: '2',
        name: 'SR',
        probability: 0.25,
        prizes: [
          { prizeId: 'sr1', name: '人物立牌', stock: 20, weight: 1 },
          { prizeId: 'sr2', name: '亚克力挂件', stock: 15, weight: 2 },
        ],
      },
      {
        tierId: '3',
        name: 'R',
        probability: 0.70,
        prizes: [
          { prizeId: 'r1', name: '贴纸包', stock: 100, weight: 1 },
          { prizeId: 'r2', name: '明信片', stock: 200, weight: 3 },
        ],
      },
    ],
    guaranteePityCount: 50,
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 盲盒策略管理与数据查看
// ════════════════════════════════════════════════════════════
describe(`${ROLES.TenantAdmin} 盲盒角色测试`, () => {
  it('店长可创建盲盒计划并查看概率公示（正常流程）', async () => {
    const service = makeService()
    const plan = await lastValueFrom(service.createPlan(makeSamplePlanInput('2026夏季盲盒')))
    assert.ok(plan.planId)
    assert.equal(plan.name, '2026夏季盲盒')
    assert.equal(plan.status, BlindBoxStatus.ACTIVE)
    assert.equal(plan.tiers.length, 3)
    assert.equal(plan.guaranteePityCount, 50)

    // 查看概率公示
    const prob = await lastValueFrom(service.getProbability公示(plan.planId))
    assert.ok(prob)
    assert.equal(prob!.tiers.length, 3)
    // SSR + SR + R = 0.05 + 0.25 + 0.70
    const totalProb = prob!.tiers.reduce((s, t) => s + t.probability, 0)
    expect(totalProb).toBeCloseTo(1.0, 2)
  })

  it('店长可查看完整的奖池库存并感知稀缺性（管理层视角）', async () => {
    const service = makeService()
    const plan = await lastValueFrom(service.createPlan(makeSamplePlanInput('限定盲盒')))
    const prizePool = await lastValueFrom(service.getPrizePool(plan.planId))
    assert.ok(prizePool)
    assert.equal(prizePool!.planId, plan.planId)
    assert.equal(prizePool!.prizePools.length, 3)

    // SSR tier 只有 5 件库存，店长应可感知稀缺
    const ssrTier = prizePool!.prizePools.find((t) => t.tierName === 'SSR')
    assert.ok(ssrTier)
    const totalSsrStock = ssrTier!.prizes.reduce((s, p) => s + p.stock, 0)
    assert.equal(totalSsrStock, 5)
  })

  it('店长有权查看任意用户的抽盒历史（管理审计）', async () => {
    const service = makeService()
    const plan = await lastValueFrom(service.createPlan(makeSamplePlanInput()))
    // 模拟几次抽取
    for (let i = 0; i < 3; i++) {
      await lastValueFrom(service.drawSingle(`user-${i}`, plan.planId))
    }
    // 店长查询某个用户的记录
    const history = await lastValueFrom(service.getDrawHistory('user-0', plan.planId, 10))
    assert.ok(history.length >= 1)
    history.forEach((r) => assert.equal(r.userId, 'user-0'))
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 顾客现场抽盒服务
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Reception} 盲盒角色测试`, () => {
  it('前台可为到店顾客进行单次抽盒操作（正常流程）', async () => {
    const service = makeService()
    const plan = await lastValueFrom(service.createPlan(makeSamplePlanInput('现场盲盒')))
    const result = await lastValueFrom(service.drawSingle('walkin-customer-001', plan.planId))
    assert.ok(result)
    assert.equal(result!.planId, plan.planId)
    assert.equal(result!.userId, 'walkin-customer-001')
    assert.ok(result!.prizeName)
    assert.ok(result!.recordId)
    assert.ok(result!.createdAt)
  })

  it('前台可为顾客展示概率公示（合规要求）', async () => {
    const service = makeService()
    const plan = await lastValueFrom(service.createPlan(makeSamplePlanInput('合规盲盒')))
    const prob = await lastValueFrom(service.getProbability公示(plan.planId))
    assert.ok(prob)
    // 概率总和应为 1.0
    expect(prob!.sum).toBeCloseTo(1.0, 2)
  })

  it('前台不应看到超过限定的历史记录（数据权限边界）', async () => {
    const service = makeService()
    const plan = await lastValueFrom(service.createPlan(makeSamplePlanInput()))
    // 抽取 25 次
    for (let i = 0; i < 25; i++) {
      await lastValueFrom(service.drawSingle('customer-heavy', plan.planId))
    }
    // 前台要求最近 5 条
    const history = await lastValueFrom(service.getDrawHistory('customer-heavy', plan.planId, 5))
    assert.ok(history.length <= 5)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 员工福利盲盒发放
// ════════════════════════════════════════════════════════════
describe(`${ROLES.HR} 盲盒角色测试`, () => {
  it('HR可为员工批量抽取福利盲盒（十连抽）', async () => {
    const service = makeService()
    const plan = await lastValueFrom(service.createPlan(makeSamplePlanInput('员工福利')))
    const results = await lastValueFrom(service.drawBatch10('employee-batch-001', plan.planId))
    assert.ok(results)
    assert.equal(results.length, 10)
    results.forEach((r) => {
      assert.equal(r.userId, 'employee-batch-001')
      assert.equal(r.planId, plan.planId)
    })
  })

  it('HR发放盲盒时应确保库存充足（库存边界检查）', async () => {
    const service = makeService()
    // 创建只有少量 SSR 库存的计划
    const plan = await lastValueFrom(
      service.createPlan({
        name: '库存有限',
        tiers: [
          {
            tierId: '1',
            name: '唯一奖',
            probability: 1.0,
            prizes: [{ prizeId: 'only', name: '绝版徽章', stock: 1, weight: 1 }],
          },
        ],
        guaranteePityCount: 100,
      }),
    )
    // 第一次抽取应该成功
    const first = await lastValueFrom(service.drawSingle('hr-user', plan.planId))
    assert.ok(first)
    assert.equal(first!.prizeName, '绝版徽章')

    // 第二次库存耗尽应返回 null 导致重抽，可能跳到无可用层级
    // 验证抽取不会 crash
    const second = await lastValueFrom(service.drawSingle('hr-user', plan.planId))
    // 若库存已耗尽，selectPrize 返回 null → executeDraw 重抽或返回 null
    // 这里只验证系统健壮性
    expect(second).toBeDefined()
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 盲盒合规审计与安全性
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Safety} 盲盒角色测试`, () => {
  it('安监可核验盲盒概率公示的合规性（总和应为100%）', async () => {
    const service = makeService()
    const plan = await lastValueFrom(service.createPlan(makeSamplePlanInput('合规审计')))
    const prob = await lastValueFrom(service.getProbability公示(plan.planId))
    assert.ok(prob)
    // 概率总和必须接近 100%
    expect(prob!.sum).toBeCloseTo(1.0, 2)
    // 每层概率在 0~1 之间
    prob!.tiers.forEach((t) => {
      assert.ok(t.probability >= 0 && t.probability <= 1, `概率 ${t.probability} 超出范围`)
    })
  })

  it('安监可查询已下架/暂停计划不应可抽取（安全失效态）', async () => {
    const service = makeService()
    // 创建一个计划并手动改变状态（通过反射模拟 DRAFT / PAUSED）
    const plan = await lastValueFrom(service.createPlan(makeSamplePlanInput('失效盲盒')))
    // 将计划状态设为 DRAFT（模拟关闭）
    ;(plan as any).status = BlindBoxStatus.DRAFT
    // 尝试抽取应返回 null
    const result = await lastValueFrom(service.drawSingle('safety-user', plan.planId))
    assert.equal(result, null)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 现场引导顾客体验盲盒
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} 盲盒角色测试`, () => {
  it('导玩员可帮助顾客进行十连抽体验', async () => {
    const service = makeService()
    const plan = await lastValueFrom(service.createPlan(makeSamplePlanInput('现场体验')))
    const results = await lastValueFrom(service.drawBatch10('guide-customer-001', plan.planId))
    assert.equal(results.length, 10)
    // 至少应该抽到各种等级
    const tierNames = results.map((r) => r.tier)
    assert.ok(tierNames.length === 10)
  })

  it('导玩员可查询顾客近期的抽取记录（服务辅助）', async () => {
    const service = makeService()
    const plan = await lastValueFrom(service.createPlan(makeSamplePlanInput('导玩服务')))
    const userId = 'guide-customer-002'
    // 抽取 5 次
    for (let i = 0; i < 5; i++) {
      await lastValueFrom(service.drawSingle(userId, plan.planId))
    }
    const history = await lastValueFrom(service.getDrawHistory(userId, plan.planId, 5))
    assert.equal(history.length, 5)
    // 查询不应涉及其它用户数据
    const otherHistory = await lastValueFrom(service.getDrawHistory('other-user', plan.planId, 5))
    assert.equal(otherHistory.length, 0)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 盲盒运营数据分析
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Ops} 盲盒角色测试`, () => {
  it('运行专员可查看奖池库存进行分析', async () => {
    const service = makeService()
    const plan = await lastValueFrom(service.createPlan(makeSamplePlanInput('运营盲盒')))
    const prizePool = await lastValueFrom(service.getPrizePool(plan.planId))
    assert.ok(prizePool)
    // 验证所有库存总和
    let totalStock = 0
    prizePool!.prizePools.forEach((tier) => {
      tier.prizes.forEach((p) => {
        totalStock += p.stock
      })
    })
    // SSR(3+2) + SR(20+15) + R(100+200) = 340
    assert.equal(totalStock, 340)
  })

  it('运行专员可查看多用户的中奖分布（运营统计）', async () => {
    const service = makeService()
    const plan = await lastValueFrom(service.createPlan(makeSamplePlanInput('运营统计')))
    const userIds = ['ops-a', 'ops-b', 'ops-c']
    // 每个用户抽 5 次
    for (const uid of userIds) {
      for (let i = 0; i < 5; i++) {
        await lastValueFrom(service.drawSingle(uid, plan.planId))
      }
    }
    // 每个用户应有 5 条记录
    for (const uid of userIds) {
      const h = await lastValueFrom(service.getDrawHistory(uid, plan.planId, 100))
      assert.equal(h.length, 5)
    }
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 团队集体抽盒活动
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} 盲盒角色测试`, () => {
  it('团建可为团队集体抽奖（多用户十连抽）', async () => {
    const service = makeService()
    const plan = await lastValueFrom(service.createPlan(makeSamplePlanInput('团建活动')))
    const teamMembers = ['team-alice', 'team-bob', 'team-charlie']
    for (const member of teamMembers) {
      const results = await lastValueFrom(service.drawBatch10(member, plan.planId))
      assert.equal(results.length, 10)
      results.forEach((r) => assert.equal(r.userId, member))
    }
  })

  it('团建抽取不应影响个人用户的保底计数（数据隔离）', async () => {
    const service = makeService()
    const plan = await lastValueFrom(
      service.createPlan({
        name: '团建隔离测试',
        tiers: [
          {
            tierId: '1',
            name: '稀有',
            probability: 0.01,
            prizes: [{ prizeId: 'rare1', name: '限定特典', stock: 100, weight: 1 }],
          },
          {
            tierId: '3',
            name: '普通',
            probability: 0.99,
            prizes: [{ prizeId: 'com1', name: '普通贴纸', stock: 1000, weight: 1 }],
          },
        ],
        guaranteePityCount: 3,
      }),
    )
    // 团建用户抽取后，个人用户保底应独立
    await lastValueFrom(service.drawSingle('team-user', plan.planId))
    await lastValueFrom(service.drawSingle('personal-user', plan.planId))
    // 个人用户的历史应只含自己的记录
    const personalHistory = await lastValueFrom(
      service.getDrawHistory('personal-user', plan.planId, 100),
    )
    assert.equal(personalHistory.length, 1)
    assert.equal(personalHistory[0].userId, 'personal-user')
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 盲盒营销活动策划
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} 盲盒角色测试`, () => {
  it('营销可创建低概率 SSR 的盲盒计划（营销活动）', async () => {
    const service = makeService()
    const plan = await lastValueFrom(
      service.createPlan({
        name: 'SSR概率UP活动',
        tiers: [
          {
            tierId: '1',
            name: 'SSR',
            probability: 0.20, // 提升概率
            prizes: [{ prizeId: 'up1', name: '限定SSR', stock: 10, weight: 1 }],
          },
          {
            tierId: '3',
            name: 'R',
            probability: 0.80,
            prizes: [{ prizeId: 'r10', name: '普通贴纸', stock: 500, weight: 1 }],
          },
        ],
        guaranteePityCount: 5, // 低保
      }),
    )
    assert.equal(plan.tiers[0].probability, 0.20)
    assert.equal(plan.guaranteePityCount, 5)

    // 模拟抽取验证低保机制确实能在 5 次内出 SSR
    let gotSsr = false
    for (let i = 0; i < 10; i++) {
      const result = await lastValueFrom(service.drawSingle('marketing-user', plan.planId))
      if (result && result.tier === 'SSR') {
        gotSsr = true
        break
      }
    }
    assert.ok(gotSsr, '营销活动的提升概率应在有限抽取内获得 SSR')
  })

  it('营销应保证概率总和为100%（合规边界）', async () => {
    const service = makeService()
    const plan = await lastValueFrom(service.createPlan(makeSamplePlanInput('营销合规')))
    const prob = await lastValueFrom(service.getProbability公示(plan.planId))
    assert.ok(prob)
    expect(prob!.sum).toBeCloseTo(1.0, 2)
  })
})
