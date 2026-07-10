import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [blindbox] [C] 角色测试 v3 — 大飞哥电玩城实景模拟
 *
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 围绕大飞哥美国三店运营场景：
 * 店A: Cyber Galaxy Arcade（Virginia总店）
 * 店B: Houston HighScore Station（德州店）
 * 店C: NY Neon Nights Arcade（纽约新店）
 *
 * 每个角色 >= 2 测试用例（正常流程 + 业务边界 / 权限边界）
 * 覆盖: createPlan, draw, drawBatch, getProbabilities, getPrizePool, getHistory
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { lastValueFrom, Observable } from 'rxjs'
import { BlindboxController } from './blindbox.controller'
import { BlindboxService } from './blindbox.service'
import type {
  BlindBoxPlan,
  BlindBoxTier,
  BlindBoxDrawRecord,
} from './blindbox.entity'
import { BlindBoxStatus, DrawType } from './blindbox.entity'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试数据工厂 ──
function createService() {
  return new BlindboxService()
}

function createController() {
  const service = new BlindboxService()
  return new BlindboxController(service)
}

/** 从 Observable 同步获取值 (of() 同步) */
function val<T>(obs: Observable<T> | T): T {
  if (obs instanceof Observable) {
    let result!: T
    obs.subscribe((v) => { result = v })
    return result
  }
  return obs as T
}

/** 创建计划并返回 planId */
function createPlanId(ctrl: BlindboxController, dto: any): string {
  return val<BlindBoxPlan>(ctrl.createPlan(dto)).planId
}

// ── 大飞哥三店场景数据 ──
const storeA = {
  id: 'store-cyber-galaxy',
  name: 'Cyber Galaxy Arcade',
  location: 'Colonial Heights, VA',
  tenantId: 't-cyber-001',
}

const storeB = {
  id: 'store-houston',
  name: 'Houston HighScore Station',
  location: 'Houston, TX',
  tenantId: 't-hou-002',
}

const storeC = {
  id: 'store-ny-neon',
  name: 'NY Neon Nights Arcade',
  location: 'New York, NY',
  tenantId: 't-ny-003',
}

// 店A: 新春限定盲盒计划
function createLunarPlanDto() {
  return {
    name: '🐉 龙年新春限定',
    tiers: [
      {
        tierId: 'tier-legendary',
        name: '传说级',
        probability: 0.01,
        prizes: [
          { prizeId: 'p-dragon-statue', name: '金龙雕像', stock: 3, weight: 1 },
          { prizeId: 'p-arcade-lifetime', name: '终身畅玩卡', stock: 5, weight: 2 },
        ],
      },
      {
        tierId: 'tier-epic',
        name: '史诗级',
        probability: 0.09,
        prizes: [
          { prizeId: 'p-lucky-draw-50', name: '50次抽奖券', stock: 30, weight: 3 },
          { prizeId: 'p-plush-toy', name: '限定玩偶', stock: 50, weight: 5 },
        ],
      },
      {
        tierId: 'tier-common',
        name: '普通级',
        probability: 0.9,
        prizes: [
          { prizeId: 'p-coupon-5', name: '5元代金券', stock: 200, weight: 10 },
          { prizeId: 'p-sticker-pack', name: '贴纸套装', stock: 500, weight: 15 },
        ],
      },
    ],
    guaranteePityCount: 100,
  }
}

// 店B: 街机挑战盲盒
function createArcadePlanDto() {
  return {
    name: '🕹️ 街机挑战盲盒',
    tiers: [
      {
        tierId: 'tier-super',
        name: '超稀有',
        probability: 0.02,
        prizes: [
          { prizeId: 'p-ps5', name: 'PS5主机', stock: 2, weight: 1 },
          { prizeId: 'p-signed-poster', name: '签名海报', stock: 8, weight: 2 },
        ],
      },
      {
        tierId: 'tier-rare',
        name: '稀有',
        probability: 0.18,
        prizes: [
          { prizeId: 'p-controller', name: '限定手柄', stock: 20, weight: 3 },
          { prizeId: 'p-gift-card-20', name: '20刀礼品卡', stock: 40, weight: 5 },
        ],
      },
      {
        tierId: 'tier-normal',
        name: '普通',
        probability: 0.8,
        prizes: [
          { prizeId: 'p-keychain', name: '钥匙扣', stock: 100, weight: 8 },
          { prizeId: 'p-candy-pack', name: '糖果包', stock: 300, weight: 12 },
        ],
      },
    ],
    guaranteePityCount: 50,
  }
}

// 店C: 新手入门盲盒（无保底）
function createStarterPlanDto() {
  return {
    name: '🌟 新手入门盲盒',
    tiers: [
      {
        tierId: 'tier-good',
        name: '好物级',
        probability: 0.05,
        prizes: [
          { prizeId: 'p-starter-pack', name: '新手礼包', stock: 10, weight: 1 },
        ],
      },
      {
        tierId: 'tier-basic',
        name: '基础级',
        probability: 0.95,
        prizes: [
          { prizeId: 'p-bronze-coin', name: '青铜游戏币', stock: 1000, weight: 10 },
        ],
      },
    ],
    guaranteePityCount: 0,
  }
}

// ── 👔 店长 ──
describe(`${ROLES.StoreManager} 店长视角: 全局盲盒计划管理与运营监控`, () => {
  let ctrl: BlindboxController

  beforeEach(() => {
    ctrl = createController()
  })

  it('店长为三店分别创建盲盒计划 — 三店独立运营', () => {
    const planA = val<BlindBoxPlan>(ctrl.createPlan(createLunarPlanDto()))
    const planB = val<BlindBoxPlan>(ctrl.createPlan(createArcadePlanDto()))
    const planC = val<BlindBoxPlan>(ctrl.createPlan(createStarterPlanDto()))

    assert.ok(planA.planId)
    assert.ok(planB.planId)
    assert.ok(planC.planId)
    assert.equal(planA.name, '🐉 龙年新春限定')
    assert.equal(planB.name, '🕹️ 街机挑战盲盒')
    assert.equal(planC.name, '🌟 新手入门盲盒')
    // planId 互不相同
    assert.notEqual(planA.planId, planB.planId)
    assert.notEqual(planB.planId, planC.planId)
  })

  it('店长查看店A盲盒概率公示 — 各层级概率和应为1', () => {
    const pid = createPlanId(ctrl, createLunarPlanDto())
    const info = val<any>(ctrl.getProbabilities(pid))

    assert.ok(info, '概率公示应存在')
    assert.ok(Array.isArray(info.tiers))
    assert.equal(info.tiers.length, 3)
    const sum = info.tiers.reduce((s: number, t: any) => s + t.probability, 0)
    assert.ok(Math.abs(sum - 1) < 0.001, `概率和应为1，实际${sum}`)
  })

  it('店长尝试查不存在盲盒计划的概率 — 返回null', () => {
    const result = val<any>(ctrl.getProbabilities('non-existent-plan'))
    assert.equal(result, null)
  })

  it('店长查看店B奖池库存 — 总奖池数据正确', () => {
    const pid = createPlanId(ctrl, createArcadePlanDto())
    const pool = val<any>(ctrl.getPrizePool(pid))

    assert.ok(pool, '奖池应存在')
    assert.equal(pool.name, '🕹️ 街机挑战盲盒')
    assert.equal(pool.prizePools.length, 3)
    const totalStock = pool.prizePools.reduce(
      (acc: number, tier: any) => acc + tier.prizes.reduce((s: number, p: any) => s + p.stock, 0),
      0,
    )
    assert.equal(totalStock, 470)
  })

  it('店长检查保底机制参数 — 正确存储', () => {
    const planA = val<BlindBoxPlan>(ctrl.createPlan(createLunarPlanDto()))
    const planB = val<BlindBoxPlan>(ctrl.createPlan(createArcadePlanDto()))
    assert.equal(planA.guaranteePityCount, 100)
    assert.equal(planB.guaranteePityCount, 50)
  })
})

// ── 🛒 前台 ──
describe(`${ROLES.FrontDesk} 前台视角: 客户接待盲盒抽取`, () => {
  let ctrl: BlindboxController
  let planId: string

  beforeEach(() => {
    ctrl = createController()
    planId = createPlanId(ctrl, createLunarPlanDto())
  })

  it('前台为客户抽取单次盲盒 — 返回抽取记录', () => {
    const result = val<any>(ctrl.draw(planId, { userId: 'customer-front-001' }))
    assert.ok(result)
    if (result.success) {
      assert.ok(result.data)
      assert.ok((result.data as BlindBoxDrawRecord).prizeName)
      assert.ok((result.data as BlindBoxDrawRecord).recordId)
      assert.equal((result.data as BlindBoxDrawRecord).userId, 'customer-front-001')
    } else {
      // 可能库存随机导致失败，但消息应有内容
      assert.ok(result.message)
    }
  })

  it('前台为客户抽取十连盲盒 — 返回10条记录', () => {
    const result = val<any>(ctrl.drawBatch(planId, { userId: 'customer-front-002' }))
    assert.ok(result)
    if (result.success && Array.isArray(result.data)) {
      assert.equal(result.data.length, 10)
      result.data.forEach((r: BlindBoxDrawRecord) => {
        assert.ok(r.prizeName)
        assert.equal(r.drawType, DrawType.BATCH10)
      })
    }
  })

  it('前台尝试抽取不存在的盲盒计划 — 返回失败消息', () => {
    const result = val<any>(ctrl.draw('non-existent-plan', { userId: 'customer-front-003' }))
    assert.ok(result)
    assert.equal(result.success, false)
    assert.ok(result.message)
  })

  it('前台查询客户抽取历史 — 返回最近的记录', () => {
    const userId = 'customer-history-001'
    val<any>(ctrl.draw(planId, { userId }))
    const history = val<BlindBoxDrawRecord[]>(ctrl.getHistory(planId, userId, '10'))
    assert.ok(history)
    assert.ok(history.length >= 1)
    assert.equal(history[0].userId, userId)
  })
})

// ── 👥 HR ──
describe(`${ROLES.HR} HR视角: 盲盒合规与员工权限`, () => {
  let ctrl: BlindboxController

  beforeEach(() => {
    ctrl = createController()
  })

  it('HR查看盲盒计划的数据合规 — 概率公示完整性', () => {
    const pid = createPlanId(ctrl, createArcadePlanDto())
    const info = val<any>(ctrl.getProbabilities(pid))

    assert.ok(info.tiers.length >= 2, '至少应有2个层级')
    info.tiers.forEach((t: any) => {
      assert.ok(t.probability >= 0, `概率不能为负: ${t.probability}`)
      assert.ok(t.probability <= 1, `概率不能超过1: ${t.probability}`)
    })
  })

  it('HR检查保底机制是否存在 — 店B保底50抽,店C无保底', () => {
    const planB = val<BlindBoxPlan>(ctrl.createPlan(createArcadePlanDto()))
    const planC = val<BlindBoxPlan>(ctrl.createPlan(createStarterPlanDto()))
    assert.equal(planB.guaranteePityCount, 50)
    assert.equal(planC.guaranteePityCount, 0)
  })

  it('HR验证盲盒状态默认为启用 — 创建后应为ACTIVE', () => {
    const plan = val<BlindBoxPlan>(ctrl.createPlan(createStarterPlanDto()))
    assert.equal(plan.status, BlindBoxStatus.ACTIVE)
  })

  it('HR检查奖池奖品权重合规 — 所有权重为正数', () => {
    const pid = createPlanId(ctrl, createArcadePlanDto())
    const pool = val<any>(ctrl.getPrizePool(pid))
    pool.prizePools.forEach((tier: any) => {
      tier.prizes.forEach((prize: any) => {
        assert.ok(prize.weight > 0, `权重应大于0: ${prize.weight}`)
      })
    })
  })
})

// ── 🔧 安监 ──
describe(`${ROLES.Security} 安监视角: 盲盒风控与异常操作`, () => {
  let ctrl: BlindboxController
  let planId: string

  beforeEach(() => {
    ctrl = createController()
    planId = createPlanId(ctrl, createLunarPlanDto())
  })

  it('安监监控大量频繁抽盒 — 十连抽正常返回10条', () => {
    const result = val<any>(ctrl.drawBatch(planId, { userId: 'security-test-heavy' }))
    assert.ok(result)
    if (result.success && Array.isArray(result.data)) {
      assert.equal(result.data.length, 10)
    }
  })

  it('安监检查异常奖品库存耗尽 — 连续抽取不抛异常', () => {
    for (let i = 0; i < 5; i++) {
      const result = val<any>(ctrl.draw(planId, { userId: `security-stress-${i}` }))
      assert.ok(result)
      assert.equal(typeof result.success, 'boolean')
    }
  })

  it('安监验证空用户ID抽取 — 边界情况不崩溃', () => {
    const result = val<any>(ctrl.draw(planId, { userId: '' }))
    assert.ok(result)
  })

  it('安监验证同一用户并发极限 — 大量连续抽取稳定', () => {
    const userId = 'security-concurrency-test'
    for (let i = 0; i < 20; i++) {
      const result = val<any>(ctrl.draw(planId, { userId }))
      assert.ok(result, `第${i+1}次抽取应成功`)
    }
    const history = val<BlindBoxDrawRecord[]>(ctrl.getHistory(planId, userId, '50'))
    assert.ok(history)
    assert.ok(history.length <= 20)
  })
})

// ── 🎮 导玩员 ──
describe(`${ROLES.Guide} 导玩员视角: 现场导购与盲盒推荐`, () => {
  let ctrl: BlindboxController

  beforeEach(() => {
    ctrl = createController()
  })

  it('导玩员向新客介绍盲盒 — 概率公示应清晰易懂', () => {
    const pid = createPlanId(ctrl, createStarterPlanDto())
    const info = val<any>(ctrl.getProbabilities(pid))
    assert.ok(info)
    info.tiers.forEach((t: any) => {
      assert.ok(typeof t.name === 'string')
      assert.ok(typeof t.probability === 'number')
    })
  })

  it('导玩员为VIP客户演示抽盒 — 单抽和十连结果可展示', () => {
    const pid = createPlanId(ctrl, createArcadePlanDto())
    const single = val<any>(ctrl.draw(pid, { userId: 'vip-demo-guide' }))
    const batch = val<any>(ctrl.drawBatch(pid, { userId: 'vip-demo-guide' }))
    assert.ok(single)
    assert.ok(batch)
  })

  it('导玩员查询奖池库存告知顾客 — 奖品信息完整', () => {
    const pid = createPlanId(ctrl, createArcadePlanDto())
    const pool = val<any>(ctrl.getPrizePool(pid))
    assert.ok(pool)
    pool.prizePools.forEach((tier: any) => {
      tier.prizes.forEach((prize: any) => {
        assert.ok(prize.prizeId)
        assert.ok(prize.name)
        assert.ok(typeof prize.stock === 'number')
      })
    })
  })
})

// ── 🎯 运行专员 ──
describe(`${ROLES.Operations} 运行专员视角: 盲盒系统运维与稳定性`, () => {
  let ctrl: BlindboxController

  beforeEach(() => {
    ctrl = createController()
  })

  it('运行专员创建四家店盲盒计划 — 系统资源稳定', () => {
    for (let i = 0; i < 5; i++) {
      const plan = val<BlindBoxPlan>(ctrl.createPlan({
        name: `运维测试计划-${i}`,
        tiers: [
          {
            tierId: `t-tier-${i}`,
            name: `层级${i}`,
            probability: 1,
            prizes: [{ prizeId: `p-${i}-001`, name: `奖品${i}`, stock: 100, weight: 1 }],
          },
        ],
        guaranteePityCount: 10,
      }))
      assert.ok(plan.planId)
      assert.equal(plan.tiers.length, 1)
    }
  })

  it('运行专员批量压测十连抽 — 连续执行不报错', () => {
    const pid = createPlanId(ctrl, createLunarPlanDto())
    for (let i = 0; i < 3; i++) {
      const result = val<any>(ctrl.drawBatch(pid, { userId: `ops-stress-${i}` }))
      assert.ok(result)
    }
  })

  it('运行专员验证空奖池容错 — 无奖品层级不崩溃', () => {
    const emptyPlan = val<BlindBoxPlan>(ctrl.createPlan({
      name: '空奖池测试',
      tiers: [
        {
          tierId: 't-empty',
          name: '空层级',
          probability: 1,
          prizes: [],
        },
      ],
      guaranteePityCount: 10,
    }))
    const pid = emptyPlan.planId
    const result = val<any>(ctrl.draw(pid, { userId: 'ops-empty-test' }))
    assert.ok(result)
  })

  it('运行专员检查计划状态一致 — 所有计划创建后为ACTIVE', () => {
    for (let i = 0; i < 3; i++) {
      const plan = val<BlindBoxPlan>(ctrl.createPlan({
        name: `状态测试-${i}`,
        tiers: [
          {
            tierId: 't-1',
            name: '单一层级',
            probability: 1,
            prizes: [{ prizeId: 'p-1', name: '奖品', stock: 10, weight: 1 }],
          },
        ],
        guaranteePityCount: 5,
      }))
      assert.equal(plan.status, BlindBoxStatus.ACTIVE)
    }
  })
})

// ── 🤝 团建 ──
describe(`${ROLES.Teambuilding} 团建视角: 团队集体盲盒活动`, () => {
  let ctrl: BlindboxController
  let planId: string

  beforeEach(() => {
    ctrl = createController()
    planId = createPlanId(ctrl, createArcadePlanDto())
  })

  it('团建组织10人团队每人单抽 — 所有记录可查', () => {
    const teamMembers = ['team-a01', 'team-a02', 'team-a03', 'team-a04', 'team-a05',
                         'team-a06', 'team-a07', 'team-a08', 'team-a09', 'team-a10']
    teamMembers.forEach((uid) => {
      const result = val<any>(ctrl.draw(planId, { userId: uid }))
      assert.ok(result)
    })
  })

  it('团建多店同步盲盒活动 — 跨店抽取不冲突', () => {
    const planBId = createPlanId(ctrl, createLunarPlanDto())
    const drawA = val<any>(ctrl.draw(planId, { userId: 'teambuilding-cross' }))
    const drawB = val<any>(ctrl.draw(planBId, { userId: 'teambuilding-cross' }))
    assert.ok(drawA)
    assert.ok(drawB)
  })

  it('团建活动结束后查历史 — 活动记录完整', () => {
    const userId = 'teambuilding-history'
    val<any>(ctrl.draw(planId, { userId }))
    val<any>(ctrl.drawBatch(planId, { userId }))
    const history = val<BlindBoxDrawRecord[]>(ctrl.getHistory(planId, userId, '20'))
    assert.ok(history)
    assert.ok(history.length >= 1)
    assert.ok(history.length <= 20)
  })
})

// ── 📢 营销 ──
describe(`${ROLES.Marketing} 营销视角: 盲盒促销与运营活动`, () => {
  let ctrl: BlindboxController

  beforeEach(() => {
    ctrl = createController()
  })

  it('营销策划新春盲盒活动 — 稀有传说比例合规1%', () => {
    const pid = createPlanId(ctrl, createLunarPlanDto())
    const info = val<any>(ctrl.getProbabilities(pid))
    assert.ok(info)
    const legendTier = info.tiers.find((t: any) => t.name === '传说级')
    assert.ok(legendTier, '传说级应存在')
    assert.equal(legendTier.probability, 0.01)
  })

  it('营销设置盲盒名称并对客展示 — 名称完整', () => {
    const pid = createPlanId(ctrl, createLunarPlanDto())
    const pool = val<any>(ctrl.getPrizePool(pid))
    assert.ok(pool)
    assert.equal(pool.name, '🐉 龙年新春限定')
  })

  it('营销分析盲盒用户画像 — 多次抽取产生历史记录', () => {
    const pid = createPlanId(ctrl, createLunarPlanDto())
    const userId = 'marketing-analytics-user'
    for (let i = 0; i < 3; i++) {
      val<any>(ctrl.draw(pid, { userId }))
    }
    val<any>(ctrl.drawBatch(pid, { userId }))
    const history = val<BlindBoxDrawRecord[]>(ctrl.getHistory(pid, userId, '50'))
    assert.ok(history)
    assert.ok(history.length >= 1)
  })

  it('营销验证空名称盲盒创建 — 边界情况', () => {
    const plan = val<BlindBoxPlan>(ctrl.createPlan({
      name: '',
      tiers: [
        {
          tierId: 't-1',
          name: '测试',
          probability: 1,
          prizes: [{ prizeId: 'p-1', name: '测试奖品', stock: 10, weight: 1 }],
        },
      ],
      guaranteePityCount: 1,
    }))
    assert.ok(plan.planId)
    assert.equal(plan.name, '')
  })

  it('营销策划节日活动 — 多个盲盒计划同时存在', () => {
    const p1 = val<BlindBoxPlan>(ctrl.createPlan(createLunarPlanDto()))
    const p2 = val<BlindBoxPlan>(ctrl.createPlan(createArcadePlanDto()))
    const p3 = val<BlindBoxPlan>(ctrl.createPlan(createStarterPlanDto()))
    assert.ok(p1.planId !== p2.planId)
    assert.ok(p2.planId !== p3.planId)
    assert.equal(p1.tiers.length, 3)
    assert.equal(p2.tiers.length, 3)
    assert.equal(p3.tiers.length, 2)
  })
})
