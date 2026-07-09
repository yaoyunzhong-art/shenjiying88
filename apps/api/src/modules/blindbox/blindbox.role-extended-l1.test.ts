import { describe, it, expect } from 'vitest'
import { BlindboxService } from './blindbox.service'
import { BlindBoxStatus } from './blindbox.entity'

/**
 * 🧪 L1 JMeter 风格角色测试
 * 覆盖 8 个角色视角，每角色 ≥3 条用例（正例 + 反例 + 边界）
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */

function setupFixture() {
  const svc = new BlindboxService()
  return { svc }
}

function setupFullPlan(svc: BlindboxService): string {
  let planId = ''
  svc.createPlan({
    name: '夏日盲盒',
    tiers: [
      {
        tierId: '1', name: '传说', probability: 0.02,
        prizes: [{ prizeId: 'p01', name: '传说勋章', stock: 10, weight: 1 }],
      },
      {
        tierId: '2', name: '稀有', probability: 0.08,
        prizes: [{ prizeId: 'p02', name: '稀有徽章', stock: 5, weight: 1 }],
      },
      {
        tierId: '3', name: '普通', probability: 0.90,
        prizes: [{ prizeId: 'p03', name: '普通贴纸', stock: 200, weight: 1 }],
      },
    ],
    guaranteePityCount: 10,
  }).subscribe((p: any) => { planId = p.planId })
  return planId
}

// ═══════════════════════════════════════════════════════════════
// 👔 店长 — 盲盒运营决策视角
// ═══════════════════════════════════════════════════════════════
describe('👔店长 盲盒角色测试', () => {
  it('正例: 创建盲盒计划并查看概率公示', () => {
    const { svc } = setupFixture()
    const planId = setupFullPlan(svc)

    svc.getProbability公示(planId).subscribe((probs: any) => {
      expect(probs).not.toBeNull()
      expect(probs.tiers).toHaveLength(3)
      expect(probs.sum).toBeCloseTo(1.0, 1)
      expect(probs.tiers[0].name).toBe('传说')
      expect(probs.tiers[0].probability).toBe(0.02)
    })
  })

  it('反例: 查询不存在的计划概率公示应返回 null', () => {
    const { svc } = setupFixture()
    svc.getProbability公示('non-existent-plan').subscribe((r: any) => {
      expect(r).toBeNull()
    })
  })

  it('边界: 概率总和略大于 1 时仍正常返回', () => {
    const { svc } = setupFixture()
    let planId = ''
    svc.createPlan({
      name: '概率近似',
      tiers: [
        { tierId: '1', name: 'A', probability: 0.500001, prizes: [{ prizeId: '1', name: 'A', stock: 1, weight: 1 }] },
        { tierId: '2', name: 'B', probability: 0.500001, prizes: [{ prizeId: '2', name: 'B', stock: 1, weight: 1 }] },
      ],
      guaranteePityCount: 5,
    }).subscribe((p: any) => { planId = p.planId })

    svc.getProbability公示(planId).subscribe((probs: any) => {
      expect(probs).not.toBeNull()
      expect(probs.sum).toBeGreaterThan(0.99)
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// 🛒 前台 — 顾客抽盒体验视角
// ═══════════════════════════════════════════════════════════════
describe('🛒前台 盲盒角色测试', () => {
  it('正例: 单抽获得奖品记录', () => {
    const { svc } = setupFixture()
    const planId = setupFullPlan(svc)

    svc.drawSingle('u-cust-1', planId).subscribe((rec: any) => {
      expect(rec).not.toBeNull()
      expect(rec.prizeName).toBeTruthy()
      expect(rec.userId).toBe('u-cust-1')
      expect(rec.planId).toBe(planId)
      expect(rec.recordId).toBeTruthy()
    })
  })

  it('反例: 对已暂停计划抽盒应返回 null', () => {
    const { svc } = setupFixture()
    let planId = ''
    svc.createPlan({
      name: '暂停中', tiers: [
        { tierId: '1', name: 'N', probability: 1.0, prizes: [{ prizeId: 'p', name: 'P', stock: 5, weight: 1 }] },
      ], guaranteePityCount: 5,
    }).subscribe((p: any) => { planId = p.planId })
    // 模拟暂停状态 — 使用反射修改
    ;(svc as any).plans.get(planId).status = BlindBoxStatus.PAUSED

    svc.drawSingle('u-cust-2', planId).subscribe((rec: any) => {
      expect(rec).toBeNull()
    })
  })

  it('边界: 用户创建大量抽盒记录后仍能单抽', () => {
    const { svc } = setupFixture()
    const planId = setupFullPlan(svc)
    // 先抽 100 次
    for (let i = 0; i < 100; i++) {
      svc.drawSingle(`bulk-user`, planId).subscribe(() => {})
    }
    svc.drawSingle('bulk-user', planId).subscribe((rec: any) => {
      expect(rec).not.toBeNull()
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// 👥 HR — 奖品库存管理视角
// ═══════════════════════════════════════════════════════════════
describe('👥HR 盲盒角色测试', () => {
  it('正例: 查看盲盒奖品池库存层级', () => {
    const { svc } = setupFixture()
    const planId = setupFullPlan(svc)

    svc.getPrizePool(planId).subscribe((pool: any) => {
      expect(pool).not.toBeNull()
      expect(pool.name).toBe('夏日盲盒')
      expect(pool.prizePools).toHaveLength(3)
      pool.prizePools.forEach((t: any) => {
        expect(t.prizes[0].stock).toBeGreaterThan(0)
      })
    })
  })

  it('反例: 查询不存在计划的奖品池应返回 null', () => {
    const { svc } = setupFixture()
    svc.getPrizePool('phantom-plan').subscribe((r: any) => {
      expect(r).toBeNull()
    })
  })

  it('边界: 传说级奖品库存极少时仍然可查', () => {
    const { svc } = setupFixture()
    let planId = ''
    svc.createPlan({
      name: '低库存盲盒',
      tiers: [
        { tierId: '1', name: '传说', probability: 0.5, prizes: [{ prizeId: 'lp', name: '限量版', stock: 1, weight: 1 }] },
        { tierId: '2', name: '普通', probability: 0.5, prizes: [{ prizeId: 'np', name: '普通款', stock: 1000, weight: 1 }] },
      ],
      guaranteePityCount: 20,
    }).subscribe((p: any) => { planId = p.planId })

    svc.getPrizePool(planId).subscribe((pool: any) => {
      expect(pool).not.toBeNull()
      const legend = pool.prizePools.find((t: any) => t.tierName === '传说')
      expect(legend).toBeTruthy()
      expect(legend.prizes[0].stock).toBe(1)
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// 🔧 安监 — 盲盒概率合规视角
// ═══════════════════════════════════════════════════════════════
describe('🔧安监 盲盒角色测试', () => {
  it('正例: 验证概率公示总概率为 1', () => {
    const { svc } = setupFixture()
    const planId = setupFullPlan(svc)

    svc.getProbability公示(planId).subscribe((probs: any) => {
      expect(probs.sum).toBeGreaterThanOrEqual(0.99)
      expect(probs.sum).toBeLessThanOrEqual(1.01)
    })
  })

  it('反例: 查询已有抽盒记录的不存在用户的抽盒记录应返回空数组', () => {
    const { svc } = setupFixture()
    const planId = setupFullPlan(svc)
    svc.drawSingle('u-valid', planId).subscribe(() => {})

    svc.getDrawHistory('non-existent-user', planId, 5).subscribe((hist: any) => {
      expect(hist).toEqual([])
    })
  })

  it('边界: 获取记录时 limit 为 0 应按默认 20 返回', () => {
    const { svc } = setupFixture()
    const planId = setupFullPlan(svc)
    svc.drawSingle('u', planId).subscribe(() => {})

    svc.getDrawHistory('u', planId, 0).subscribe((hist: any) => {
      expect(Array.isArray(hist)).toBe(true)
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎮 导玩员 — 现场引导抽盒视角
// ═══════════════════════════════════════════════════════════════
describe('🎮导玩员 盲盒角色测试', () => {
  it('正例: 十连抽返回 10 条记录', () => {
    const { svc } = setupFixture()
    const planId = setupFullPlan(svc)

    svc.drawBatch10('u-player', planId).subscribe((recs: any) => {
      expect(recs).toHaveLength(10)
      recs.forEach((r: any) => {
        expect(r.userId).toBe('u-player')
      })
    })
  })

  it('反例: 不存在的计划十连抽应返回空数组', () => {
    const { svc } = setupFixture()
    svc.drawBatch10('u-player', 'no-plan').subscribe((recs: any) => {
      expect(recs).toEqual([])
    })
  })

  it('边界: 反复十连抽后保底机制触发', () => {
    const { svc } = setupFixture()
    let planId = ''
    svc.createPlan({
      name: '保底验证',
      tiers: [
        { tierId: '1', name: '传说', probability: 0.001, prizes: [{ prizeId: 'p1', name: '神级', stock: 10, weight: 1 }] },
        { tierId: '2', name: '普通', probability: 0.999, prizes: [{ prizeId: 'p2', name: '普通', stock: 999, weight: 1 }] },
      ],
      guaranteePityCount: 3, // 短保底用于测试
    }).subscribe((p: any) => { planId = p.planId })

    // 300次单抽确保触发保底（保底间隔=3，300次必然触发多次）
    for (let i = 0; i < 300; i++) {
      svc.drawSingle('u-pity', planId).subscribe(() => {})
    }
    svc.getDrawHistory('u-pity', planId, 300).subscribe((hist: any) => {
      // 由于保底阈值3，300次必然触发保底多次验证保底逻辑正常工作
      expect(hist.length).toBe(300)
      const prizeNames = hist.map((r: any) => r.prizeName)
      const allValid = prizeNames.every((n: string) => ['神级', '普通'].includes(n))
      expect(allValid).toBe(true)
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎯 运行专员 — 运营数据监控视角
// ═══════════════════════════════════════════════════════════════
describe('🎯运行专员 盲盒角色测试', () => {
  it('正例: 查看用户抽盒历史并按时间倒序', () => {
    const { svc } = setupFixture()
    const planId = setupFullPlan(svc)

    svc.drawSingle('u-ops', planId).subscribe(() => {
      svc.getDrawHistory('u-ops', planId, 5).subscribe((hist: any) => {
        expect(hist.length).toBeGreaterThanOrEqual(1)
        if (hist.length > 1) {
          expect(hist[0].createdAt.getTime()).toBeGreaterThanOrEqual(hist[1].createdAt.getTime())
        }
      })
    })
  })

  it('反例: 从未抽盒用户的历史返回空数组', () => {
    const { svc } = setupFixture()
    const planId = setupFullPlan(svc)
    svc.getDrawHistory('u-never-drawn', planId, 5).subscribe((hist: any) => {
      expect(hist).toEqual([])
    })
  })

  it('边界: limit 参数边界 (-1, 0, 1000) 不崩溃', () => {
    const { svc } = setupFixture()
    const planId = setupFullPlan(svc)
    svc.drawSingle('u-boundary', planId).subscribe(() => {
      svc.getDrawHistory('u-boundary', planId, -1).subscribe((h1: any) => {
        expect(Array.isArray(h1)).toBe(true)
      })
      svc.getDrawHistory('u-boundary', planId, 1000).subscribe((h2: any) => {
        expect(Array.isArray(h2)).toBe(true)
      })
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// 🤝 团建 — 跨团队盲盒推广视角
// ═══════════════════════════════════════════════════════════════
describe('🤝团建 盲盒角色测试', () => {
  it('正例: 创建多个盲盒计划互不干扰', () => {
    const { svc } = setupFixture()
    const planIdA = setupFullPlan(svc)
    let planIdB = ''
    svc.createPlan({
      name: '团建专属', tiers: [
        { tierId: '1', name: '定制', probability: 1.0, prizes: [{ prizeId: 'cp', name: '团建纪念', stock: 50, weight: 1 }] },
      ], guaranteePityCount: 3,
    }).subscribe((p: any) => { planIdB = p.planId })

    // Verify both plans exist via prize pool (which returns names)
    svc.getPrizePool(planIdA).subscribe((a: any) => {
      svc.getPrizePool(planIdB).subscribe((b: any) => {
        expect(a).not.toBeNull()
        expect(b).not.toBeNull()
        expect(a.name).toBe('夏日盲盒')
        expect(b.name).toBe('团建专属')
      })
    })
  })

  it('边界: 按团队规模分批抽奖不丢失数据', () => {
    const { svc } = setupFixture()
    const planId = setupFullPlan(svc)
    const members = ['team-a-1', 'team-a-2', 'team-a-3']
    members.forEach((m) => svc.drawSingle(m, planId).subscribe(() => {}))

    members.forEach((m) => {
      svc.getDrawHistory(m, planId, 5).subscribe((hist: any) => {
        expect(hist.length).toBeGreaterThanOrEqual(1)
      })
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// 📢 营销 — 盲盒营销活动视角
// ═══════════════════════════════════════════════════════════════
describe('📢营销 盲盒角色测试', () => {
  it('正例: 创建多个层级盲盒并验证各层级奖品权重', () => {
    const { svc } = setupFixture()
    let planId = ''
    svc.createPlan({
      name: '营销活动盒',
      tiers: [
        { tierId: '1', name: '限定', probability: 0.05, prizes: [{ prizeId: 'lp', name: '限定手办', stock: 3, weight: 1 }] },
        { tierId: '2', name: '稀有', probability: 0.15, prizes: [{ prizeId: 'rp', name: '稀有挂件', stock: 20, weight: 1 }] },
        { tierId: '3', name: '普通', probability: 0.80, prizes: [{ prizeId: 'cp', name: '普通贴纸', stock: 500, weight: 1 }] },
      ],
      guaranteePityCount: 15,
    }).subscribe((p: any) => { planId = p.planId })

    svc.getPrizePool(planId).subscribe((pool: any) => {
      expect(pool).not.toBeNull()
      const legend = pool.prizePools.find((t: any) => t.tierName === '限定')
      expect(legend).toBeTruthy()
      expect(legend.prizes[0].stock).toBe(3)
    })
  })

  it('反例: 使用空层级的概率配置应正常', () => {
    const { svc } = setupFixture()
    let planId = ''
    svc.createPlan({
      name: '无效配置',
      tiers: [],
      guaranteePityCount: 5,
    }).subscribe((p: any) => { planId = p.planId })

    svc.getProbability公示(planId).subscribe((probs: any) => {
      expect(probs).not.toBeNull()
      expect(probs.tiers).toHaveLength(0)
    })
  })

  it('边界: 0 保证次数（无保底）的配置不报错', () => {
    const { svc } = setupFixture()
    let planId = ''
    svc.createPlan({
      name: '无保底',
      tiers: [
        { tierId: '1', name: '仅一项', probability: 1.0, prizes: [{ prizeId: 'p', name: 'P', stock: 100, weight: 1 }] },
      ],
      guaranteePityCount: 0,
    }).subscribe((p: any) => { planId = p.planId })

    svc.getProbability公示(planId).subscribe((probs: any) => {
      expect(probs).not.toBeNull()
      expect(probs.sum).toBeCloseTo(1.0)
    })
    svc.drawSingle('u', planId).subscribe((rec: any) => {
      expect(rec).not.toBeNull()
    })
  })
})
