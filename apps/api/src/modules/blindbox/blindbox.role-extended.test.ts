import { describe, it, expect, beforeEach } from 'vitest'
import { BlindboxService } from './blindbox.service'

/**
 * 🐜 [blindbox] 角色扩展测试
 */

function setupSync(): { svc: BlindboxService; planId: string } {
  const svc = new BlindboxService()
  let planId = ''
  svc.createPlan({
    name: '测试盲盒',
    tiers: [
      { tierId: '1', name: '稀有', probability: 0.1, prizes: [{ prizeId: 'p1', name: '金色徽章', stock: 5, weight: 1 }] },
      { tierId: '2', name: '普通', probability: 0.9, prizes: [{ prizeId: 'p2', name: '普通贴纸', stock: 100, weight: 1 }] },
    ],
    guaranteePityCount: 10,
  }).subscribe((p: any) => { planId = p.planId })
  return { svc, planId }
}

describe('👔店长 blindbox 扩展测试', () => {
  it('创建计划并查看概率公示', () => {
    const { svc, planId } = setupSync()
    svc.getProbability公示(planId).subscribe((probs: any) => {
      expect(probs).not.toBeNull()
      expect(probs!.tiers).toHaveLength(2)
      expect(probs!.sum).toBeCloseTo(1.0, 1)
    })
  })
})

describe('🛒前台 blindbox 扩展测试', () => {
  it('单抽获得奖品记录', () => {
    const { svc, planId } = setupSync()
    svc.drawSingle('u1', planId).subscribe((rec: any) => {
      expect(rec).not.toBeNull()
      expect(rec!.prizeName).toBeTruthy()
    })
  })

  it('十连抽返回 10 条', () => {
    const { svc, planId } = setupSync()
    svc.drawBatch10('u2', planId).subscribe((recs: any) => {
      expect(recs).toHaveLength(10)
    })
  })
})

describe('🎮导玩员 blindbox 扩展测试', () => {
  it('查看奖品池层级', () => {
    const { svc, planId } = setupSync()
    svc.getPrizePool(planId).subscribe((pool: any) => {
      expect(pool).not.toBeNull()
      expect(pool!.prizePools.length).toBeGreaterThanOrEqual(2)
    })
  })
})

describe('🎯运行专员 blindbox 扩展测试', () => {
  it('查看抽奖历史', () => {
    const { svc, planId } = setupSync()
    svc.drawSingle('u3', planId).subscribe(() => {
      svc.getDrawHistory('u3', planId, 5).subscribe((hist: any) => {
        expect(hist.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  it('不存在计划的抽奖返回 null/空', () => {
    const svc = new BlindboxService()
    svc.drawSingle('u4', 'no-plan').subscribe((r: any) => expect(r).toBeNull())
    svc.drawBatch10('u4', 'no-plan').subscribe((r: any) => expect(r).toEqual([]))
  })
})

describe('📢营销 blindbox 扩展测试', () => {
  it('查询不存在计划概率公示返回 null', () => {
    const svc = new BlindboxService()
    svc.getProbability公示('noplan').subscribe((r: any) => expect(r).toBeNull())
  })
})
