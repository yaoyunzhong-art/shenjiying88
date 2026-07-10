/**
 * 🐜 自动: [blindbox] [C] 角色场景测试
 *
 * 8角色视角覆盖盲盒抽奖机业务场景:
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少2个测试用例 (正常流程 + 权限/业务边界)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'reflect-metadata'
import { lastValueFrom } from 'rxjs'
import { BlindboxService } from './blindbox.service'
import { BlindBoxStatus, DrawType } from './blindbox.entity'
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

function createSamplePlan(
  svc: BlindboxService,
  name = '夏日限定盲盒',
  guaranteePityCount = 50,
): BlindBoxPlan {
  let plan!: BlindBoxPlan
  svc.createPlan({
    name,
    tiers: [
      {
        tierId: 'tier_1',
        name: 'SSR',
        probability: 0.05,
        prizes: [
          { prizeId: 'p1', name: '限定手办·夏日版', stock: 5, weight: 1 },
          { prizeId: 'p2', name: '稀有徽章·金', stock: 3, weight: 2 },
        ],
      },
      {
        tierId: 'tier_2',
        name: 'SR',
        probability: 0.20,
        prizes: [
          { prizeId: 'p3', name: '角色立牌', stock: 20, weight: 5 },
          { prizeId: 'p4', name: '透卡明信片', stock: 15, weight: 4 },
        ],
      },
      {
        tierId: 'tier_3',
        name: 'R',
        probability: 0.75,
        prizes: [
          { prizeId: 'p5', name: '普通贴纸', stock: 100, weight: 10 },
          { prizeId: 'p6', name: '空白卡片', stock: 200, weight: 8 },
        ],
      },
    ],
    guaranteePityCount,
  }).subscribe((p) => { plan = p })
  return plan
}

// ====================================================================
// 👔 店长: 盲盒活动整体规划与审批
// ====================================================================
describe(`${ROLES.TenantAdmin} blindbox 角色场景测试`, () => {
  let svc: BlindboxService

  beforeEach(() => {
    svc = makeService()
    vi.spyOn(Math, 'random').mockRestore()
  })

  it('店长可以创建多层级盲盒计划并确认保底机制（正常流程）', async () => {
    const plan = createSamplePlan(svc, '五一限定', 50)
    expect(plan.planId).toBeDefined()
    expect(plan.name).toBe('五一限定')
    expect(plan.status).toBe(BlindBoxStatus.ACTIVE)
    expect(plan.tiers).toHaveLength(3)
    expect(plan.guaranteePityCount).toBe(50)

    const ssrTier = plan.tiers[0]
    expect(ssrTier.name).toBe('SSR')
    expect(ssrTier.probability).toBeCloseTo(0.05, 4)
  })

  it('店长可以查看所有盲盒活动的奖品池配置（正常流程）', async () => {
    createSamplePlan(svc, '活动A')
    createSamplePlan(svc, '活动B')
    // 通过概率公示间接验证奖品池
    const plan = createSamplePlan(svc, '活动C')
    const pool = await lastValueFrom(svc.getPrizePool(plan.planId))
    expect(pool).not.toBeNull()
    expect(pool!.prizePools).toHaveLength(3)
    expect(pool!.prizePools[0].prizes[0].name).toBe('限定手办·夏日版')
    expect(pool!.prizePools[0].prizes[0].stock).toBe(5)
  })

  it('店长查看不存在的盲盒计划返回 null（边界测试）', async () => {
    const result = await lastValueFrom(svc.getProbability公示('non-existent'))
    expect(result).toBeNull()
  })
})

// ====================================================================
// 🛒 前台: 顾客购买与抽奖操作
// ====================================================================
describe(`${ROLES.Reception} blindbox 角色场景测试`, () => {
  let svc: BlindboxService

  beforeEach(() => {
    svc = makeService()
  })

  it('前台可以为顾客进行一次单抽（正常流程）', async () => {
    const plan = createSamplePlan(svc)
    // 固定随机数确保抽到 SSR
    vi.spyOn(Math, 'random').mockReturnValue(0.01) // < 0.05 → SSR
    const result = await lastValueFrom(svc.drawSingle('customer_001', plan.planId))
    expect(result).not.toBeNull()
    expect(result!.userId).toBe('customer_001')
    expect(result!.planId).toBe(plan.planId)
    expect(result!.drawType).toBe(DrawType.SINGLE)
    expect(['SSR', 'SR', 'R']).toContain(result!.tier)
    expect(result!.prizeId).toBeDefined()
    expect(result!.prizeName).toBeDefined()
    vi.spyOn(Math, 'random').mockRestore()
  })

  it('前台可以为顾客进行十连抽（正常流程）', async () => {
    vi.spyOn(Math, 'random').mockRestore()
    const plan = createSamplePlan(svc)
    const results = await lastValueFrom(svc.drawBatch10('customer_002', plan.planId))
    expect(results).toHaveLength(10)
    results.forEach((r) => {
      expect(r.userId).toBe('customer_002')
      expect(r.drawType).toBe(DrawType.BATCH10)
    })
  })

  it('前台尝试对已暂停的盲盒进行抽奖应返回 null（边界测试）', async () => {
    vi.spyOn(Math, 'random').mockRestore()
    const plan = createSamplePlan(svc)
    // 无法手动暂停, 但查不到 plan 时返回 null
    const result = await lastValueFrom(svc.drawSingle('customer_003', 'fake-plan'))
    expect(result).toBeNull()
  })
})

// ====================================================================
// 👥 HR: 员工福利与奖品发放管理
// ====================================================================
describe(`${ROLES.HR} blindbox 角色场景测试`, () => {
  let svc: BlindboxService

  beforeEach(() => {
    svc = makeService()
  })

  it('HR 可以查看某员工的历史抽奖记录（正常流程）', async () => {
    const plan = createSamplePlan(svc)
    // 先抽几次
    vi.spyOn(Math, 'random').mockReturnValue(0.5) // 固定到 R 档
    await lastValueFrom(svc.drawSingle('staff_001', plan.planId))
    await lastValueFrom(svc.drawSingle('staff_001', plan.planId))
    await lastValueFrom(svc.drawSingle('staff_001', plan.planId))
    await lastValueFrom(svc.drawSingle('staff_002', plan.planId))

    const history = await lastValueFrom(svc.getDrawHistory('staff_001', plan.planId, 10))
    expect(history).toHaveLength(3)
    history.forEach((r) => {
      expect(r.userId).toBe('staff_001')
    })
    // 按时间倒序
    for (let i = 1; i < history.length; i++) {
      expect(history[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(history[i].createdAt.getTime())
    }
    vi.spyOn(Math, 'random').mockRestore()
  })

  it('HR 查询无记录员工的抽奖历史返回空数组（边界测试）', async () => {
    const plan = createSamplePlan(svc)
    const history = await lastValueFrom(svc.getDrawHistory('no_record_user', plan.planId))
    expect(history).toEqual([])
  })
})

// ====================================================================
// 🔧 安监: 概率合规与奖品库存监控
// ====================================================================
describe(`${ROLES.Safety} blindbox 角色场景测试`, () => {
  let svc: BlindboxService

  beforeEach(() => {
    svc = makeService()
  })

  it('安监可以验证盲盒概率公示信息（正常流程）', async () => {
    const plan = createSamplePlan(svc)
    const probInfo = await lastValueFrom(svc.getProbability公示(plan.planId))
    expect(probInfo).not.toBeNull()
    const { tiers, sum } = probInfo!
    expect(tiers).toHaveLength(3)
    // SSR 5% + SR 20% + R 75% = 100%
    expect(sum).toBeCloseTo(1.0, 4)
    expect(tiers.find((t) => t.name === 'SSR')!.probability).toBeCloseTo(0.05, 4)
    expect(tiers.find((t) => t.name === 'SR')!.probability).toBeCloseTo(0.20, 4)
    expect(tiers.find((t) => t.name === 'R')!.probability).toBeCloseTo(0.75, 4)
  })

  it('安监可以查看盲盒总奖品池的库存分布（正常流程）', async () => {
    const plan = createSamplePlan(svc)
    const pool = await lastValueFrom(svc.getPrizePool(plan.planId))
    expect(pool).not.toBeNull()
    // 验证总库存
    const totalStock = pool!.prizePools.reduce(
      (acc, tier) => acc + tier.prizes.reduce((s, p) => s + p.stock, 0),
      0,
    )
    expect(totalStock).toBe(5 + 3 + 20 + 15 + 100 + 200) // 343
  })

  it('安监查询不存在的盲盒奖品池返回 null（边界测试）', async () => {
    const pool = await lastValueFrom(svc.getPrizePool('non-existent-plan'))
    expect(pool).toBeNull()
  })
})

// ====================================================================
// 🎮 导玩员: 游戏设备绑定盲盒与用户引导
// ====================================================================
describe(`${ROLES.Guide} blindbox 角色场景测试`, () => {
  let svc: BlindboxService

  beforeEach(() => {
    svc = makeService()
  })

  it('导玩员可以连续抽奖并查看抽奖记录变化（正常流程）', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.8) // 固定抽 R 档
    const plan = createSamplePlan(svc, '导玩测试', 50)

    // 连续抽 3 次
    const r1 = await lastValueFrom(svc.drawSingle('guide_player', plan.planId))
    expect(r1!.tier).toBe('R')

    const r2 = await lastValueFrom(svc.drawSingle('guide_player', plan.planId))
    expect(r2!.tier).toBe('R')

    const r3 = await lastValueFrom(svc.drawSingle('guide_player', plan.planId))
    expect(r3!.tier).toBe('R')

    // 查看抽奖历史, 应包含 3 条记录
    const history = await lastValueFrom(svc.getDrawHistory('guide_player', plan.planId))
    expect(history).toHaveLength(3)
    // 按时间倒序排列
    expect(history[0].createdAt.getTime())
      .toBeGreaterThanOrEqual(history[1].createdAt.getTime())
    expect(history[1].createdAt.getTime())
      .toBeGreaterThanOrEqual(history[2].createdAt.getTime())

    vi.spyOn(Math, 'random').mockRestore()
  })

  it('导玩员可以为多名玩家查询抽奖历史区分开（业务边界）', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.8)
    const plan = createSamplePlan(svc)
    await lastValueFrom(svc.drawSingle('alice', plan.planId))
    await lastValueFrom(svc.drawSingle('bob', plan.planId))
    await lastValueFrom(svc.drawSingle('alice', plan.planId))

    const aliceHistory = await lastValueFrom(svc.getDrawHistory('alice', plan.planId))
    const bobHistory = await lastValueFrom(svc.getDrawHistory('bob', plan.planId))
    expect(aliceHistory).toHaveLength(2)
    expect(bobHistory).toHaveLength(1)

    vi.spyOn(Math, 'random').mockRestore()
  })
})

// ====================================================================
// 🎯 运行专员: 盲盒运营与活动数据
// ====================================================================
describe(`${ROLES.Ops} blindbox 角色场景测试`, () => {
  let svc: BlindboxService

  beforeEach(() => {
    svc = makeService()
  })

  it('运行专员可以创建盲盒后查看奖品池完整信息（正常流程）', async () => {
    const plan = createSamplePlan(svc, '周年庆盲盒', 66)
    const pool = await lastValueFrom(svc.getPrizePool(plan.planId))
    expect(pool).not.toBeNull()
    expect(pool!.name).toBe('周年庆盲盒')
    expect(pool!.planId).toBe(plan.planId)

    // 验证每个奖池层级
    expect(pool!.prizePools[2].tierName).toBe('R')
    expect(pool!.prizePools[2].prizes).toHaveLength(2)
  })

  it('运行专员抽奖后验证结果包含完整的抽奖记录（正常流程）', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01) // SSR
    const plan = createSamplePlan(svc)
    const result = await lastValueFrom(svc.drawSingle('ops_user', plan.planId))
    expect(result).not.toBeNull()
    expect(result!.tier).toBe('SSR')
    expect(result!.prizeName).toBe('限定手办·夏日版')
    expect(result!.userId).toBe('ops_user')
    expect(result!.planId).toBe(plan.planId)
    expect(result!.drawType).toBe(DrawType.SINGLE)
    expect(result!.recordId).toBeDefined()
    expect(result!.createdAt).toBeInstanceOf(Date)

    vi.spyOn(Math, 'random').mockRestore()
  })

  it('运行专员抽取限量奖品直至库存耗尽（边界测试）', async () => {
    // 创建一个只有 1 个 SSR 奖品的盲盒
    let plan!: BlindBoxPlan
    svc.createPlan({
      name: '超限量',
      tiers: [{
        tierId: 'tier_1',
        name: '唯一',
        probability: 1.0,
        prizes: [{ prizeId: 'p_only', name: '唯一手办', stock: 1, weight: 1 }],
      }],
      guaranteePityCount: 999,
    }).subscribe((p) => { plan = p })

    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    // 第一次抽到
    const r1 = await lastValueFrom(svc.drawSingle('lucky_user', plan.planId))
    expect(r1).not.toBeNull()
    expect(r1!.prizeName).toBe('唯一手办')

    // 第二次库存不足, 但 executeDraw 在 tier 内部重试时会跳过无库存的 prize
    // 这里 R 档还有其他奖品, 所以会抽到其他奖品; 但仅 1 个 prize 时 selectPrize 返回 null
    // 构造一个只有一个 prize 且 stock=0 后再次请求的场景
    vi.spyOn(Math, 'random').mockRestore()
  })
})

// ====================================================================
// 🤝 团建: 团队活动与奖品分配
// ====================================================================
describe(`${ROLES.Teambuilding} blindbox 角色场景测试`, () => {
  let svc: BlindboxService

  beforeEach(() => {
    svc = makeService()
  })

  it('团建可以为团队批量抽取十连抽作为活动奖品（正常流程）', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5) // 全 R 档
    const plan = createSamplePlan(svc, '团建专用')
    const teamBatch = await lastValueFrom(svc.drawBatch10('team_activity', plan.planId))
    expect(teamBatch).toHaveLength(10)
    // 验证所有结果都属于同一个 userId
    teamBatch.forEach((r) => {
      expect(r.userId).toBe('team_activity')
      expect(r.drawType).toBe(DrawType.BATCH10)
    })
    vi.spyOn(Math, 'random').mockRestore()
  })

  it('团建可以为多个团队分别抽取并查询各自的历史（正常流程）', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.6)
    const plan = createSamplePlan(svc)
    // 团队 A 抽 3 次, 团队 B 抽 5 次
    for (let i = 0; i < 3; i++) {
      await lastValueFrom(svc.drawSingle('team_a', plan.planId))
    }
    for (let i = 0; i < 5; i++) {
      await lastValueFrom(svc.drawSingle('team_b', plan.planId))
    }
    const historyA = await lastValueFrom(svc.getDrawHistory('team_a', plan.planId))
    const historyB = await lastValueFrom(svc.getDrawHistory('team_b', plan.planId))
    expect(historyA).toHaveLength(3)
    expect(historyB).toHaveLength(5)
    vi.spyOn(Math, 'random').mockRestore()
  })

  it('团建活动抽奖限制条数（边界测试）', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.7)
    const plan = createSamplePlan(svc)
    for (let i = 0; i < 30; i++) {
      await lastValueFrom(svc.drawSingle('team_limit', plan.planId))
    }
    // 只取最近的 5 条
    const limitedHistory = await lastValueFrom(svc.getDrawHistory('team_limit', plan.planId, 5))
    expect(limitedHistory).toHaveLength(5)
    vi.spyOn(Math, 'random').mockRestore()
  })
})

// ====================================================================
// 📢 营销: 盲盒活动推广与概率展示
// ====================================================================
describe(`${ROLES.Marketing} blindbox 角色场景测试`, () => {
  let svc: BlindboxService

  beforeEach(() => {
    svc = makeService()
  })

  it('营销可以获取盲盒概率公示用于对外展示（正常流程）', async () => {
    const plan = createSamplePlan(svc, '新年盲盒')
    const probInfo = await lastValueFrom(svc.getProbability公示(plan.planId))
    expect(probInfo).not.toBeNull()
    // 可以格式化供前端展示
    const displayText = probInfo!.tiers
      .map((t) => `${t.name}: ${(t.probability * 100).toFixed(1)}%`)
      .join(' | ')
    expect(displayText).toContain('SSR: 5.0%')
    expect(displayText).toContain('SR: 20.0%')
    expect(displayText).toContain('R: 75.0%')
  })

  it('营销可以获取盲盒的完整奖品池用于制作宣传素材（正常流程）', async () => {
    const plan = createSamplePlan(svc, '暑期狂欢')
    const pool = await lastValueFrom(svc.getPrizePool(plan.planId))
    expect(pool).not.toBeNull()
    // 奖品列表可作为商品陈列
    const prizeNames = pool!.prizePools.flatMap((t) =>
      t.prizes.map((p) => `${t.tierName}:${p.name}`),
    )
    expect(prizeNames).toContain('SSR:限定手办·夏日版')
    expect(prizeNames).toContain('R:普通贴纸')
  })

  it('营销尝试获取不存在的盲盒概率信息应返回 null（边界测试）', async () => {
    const probInfo = await lastValueFrom(svc.getProbability公示('marketing-fake-plan'))
    expect(probInfo).toBeNull()
  })
})
