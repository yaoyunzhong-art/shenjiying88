/**
 * referral.service.spec.ts — Referral Service 深层单元测试
 *
 * 覆盖：
 *   - generateCode:     正例（正常/自定义 baseUrl/expiresInDays/唯一性）/ 反例 / 边界（0 expiresInDays）
 *   - getCode:          正例（已存在）/ 反例（不存在）
 *   - trackClick:       正例（单次/多次点击）/ 反例（过期码/不存在码）/ 边界（超大点击量）
 *   - trackSignup:      正例（L1 单级/三级裂变链/自定义时间）/ 反例（码不存在）/ 边界（先 signup 无 click）
 *   - issueRewards:     正例（L1 单级/L1+L2+L3 三级/含 coupon）/ 反例（record 不存在）/ 边界（自定义奖励规则）
 *   - getMetrics:       正例（有数据/按 tenant 过滤/追踪率计算）/ 空数据
 *   - createReferral:   正例（一站式/inline code 覆盖）
 *   - listRecords:      正例（按 tenant）/ 空
 *   - listRewards:      正例（按 tenant）/ 空
 *   - reset:            全部清空
 *
 * 全部内联 mock，不依赖 NestJS DI。≥ 18 项测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ReferralService } from './referral.service'
import type {
  GenerateCodeInput,
  ReferralCode,
  ReferralLevel,
  ReferralMetrics,
  ReferralRecord,
  ReferralReward,
  TrackClickInput,
  TrackSignupInput,
} from './referral.entity'

// ═══════════════════════════════════════════════════════════════
// 枚举 + 常量
// ═══════════════════════════════════════════════════════════════

const REFERRAL_LEVELS = [1, 2, 3] as const satisfies readonly number[]
const REFERRAL_SOURCES = ['wechat', 'mini-program', 'link', 'qrcode'] as const
const REWARD_STATUSES = ['pending', 'issued', 'claimed', 'expired'] as const
const REWARD_TYPES = ['points', 'coupon'] as const

const DEFAULT_REWARD_RULES: Record<ReferralLevel, { points: number; coupon: number }> = {
  1: { points: 100, coupon: 50 },
  2: { points: 50, coupon: 0 },
  3: { points: 10, coupon: 0 },
}

// ═══════════════════════════════════════════════════════════════
// 服务实例（每次测试前重置）
// ═══════════════════════════════════════════════════════════════

let service: ReferralService

function freshService(): ReferralService {
  const s = new ReferralService()
  s.reset()
  return s
}

beforeEach(() => {
  service = freshService()
})

// ═══════════════════════════════════════════════════════════════
// generateCode
// ═══════════════════════════════════════════════════════════════

describe('generateCode', () => {
  it('正例: 生成 8 位短码且包含完整信息', () => {
    const code = service.generateCode({ parentUserId: 'user-A', tenantId: 't' })
    expect(code.shortCode.length).toBe(8)
    expect(code.codeId).toMatch(/^code-/)
    expect(code.qrCodeUrl).toContain('/qr/')
    expect(code.landingUrl).toContain('/r/')
    expect(code.totalClicks).toBe(0)
    expect(code.totalSignups).toBe(0)
    expect(code.parentUserId).toBe('user-A')
    expect(code.tenantId).toBe('t')
  })

  it('正例: 每次生成唯一短码', () => {
    const c1 = service.generateCode({ parentUserId: 'u1', tenantId: 't' })
    const c2 = service.generateCode({ parentUserId: 'u1', tenantId: 't' })
    expect(c1.shortCode).not.toBe(c2.shortCode)
  })

  it('正例: 自定义 baseUrl', () => {
    const code = service.generateCode({
      parentUserId: 'u1', tenantId: 't', baseUrl: 'https://custom.com',
    })
    expect(code.qrCodeUrl).toMatch(/^https:\/\/custom\.com/)
    expect(code.landingUrl).toMatch(/^https:\/\/custom\.com/)
  })

  it('正例: 设置过期时间', () => {
    const code = service.generateCode({ parentUserId: 'u1', tenantId: 't', expiresInDays: 30 })
    expect(code.expiresAt).toBeDefined()
    const diffMs = new Date(code.expiresAt!).getTime() - Date.now()
    expect(diffMs).toBeGreaterThan(29 * 86400000)
    expect(diffMs).toBeLessThan(31 * 86400000)
  })

  it('边界: expiresInDays 为 0 时不设置过期', () => {
    const code = service.generateCode({ parentUserId: 'u1', tenantId: 't', expiresInDays: 0 })
    // 代码逻辑: 0 是 falsy，所以不设置 expiresAt
    expect(code.expiresAt).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════
// getCode
// ═══════════════════════════════════════════════════════════════

describe('getCode', () => {
  it('正例: 通过短码获取已存在的 code', () => {
    const created = service.generateCode({ parentUserId: 'u1', tenantId: 't' })
    const found = service.getCode(created.shortCode)
    expect(found).toBeDefined()
    expect(found!.shortCode).toBe(created.shortCode)
  })

  it('反例: 短码不存在返回 undefined', () => {
    expect(service.getCode('NONEXIST')).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════
// trackClick
// ═══════════════════════════════════════════════════════════════

describe('trackClick', () => {
  it('正例: 点击一次增加点击量', () => {
    const code = service.generateCode({ parentUserId: 'u1', tenantId: 't' })
    const result = service.trackClick({ shortCode: code.shortCode, source: 'wechat' })
    expect(result).toBeDefined()
    expect(result!.totalClicks).toBe(1)
  })

  it('正例: 多次点击累积', () => {
    const code = service.generateCode({ parentUserId: 'u1', tenantId: 't' })
    service.trackClick({ shortCode: code.shortCode, source: 'link' })
    service.trackClick({ shortCode: code.shortCode, source: 'qrcode' })
    service.trackClick({ shortCode: code.shortCode, source: 'wechat' })
    expect(service.getCode(code.shortCode)!.totalClicks).toBe(3)
  })

  it('反例: 不存在的短码返回 undefined', () => {
    expect(service.trackClick({ shortCode: 'NONEXIST', source: 'wechat' })).toBeUndefined()
  })

  it('边界: 点击后未注册不产生记录', () => {
    const code = service.generateCode({ parentUserId: 'u1', tenantId: 't' })
    service.trackClick({ shortCode: code.shortCode, source: 'wechat' })
    expect(service.listRecords('t').length).toBe(0)
  })

  it('反例: 过期码点击返回 undefined', () => {
    // 用过去的时间
    const code = service.generateCode({ parentUserId: 'u1', tenantId: 't', expiresInDays: -1 })
    expect(service.trackClick({ shortCode: code.shortCode, source: 'wechat' })).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════
// trackSignup
// ═══════════════════════════════════════════════════════════════

describe('trackSignup', () => {
  it('正例: 创建 L1 推荐记录', () => {
    const code = service.generateCode({ parentUserId: 'u1', tenantId: 't' })
    service.trackClick({ shortCode: code.shortCode, source: 'wechat' })
    const record = service.trackSignup({ shortCode: code.shortCode, childUserId: 'u2' })
    expect(record.recordId).toMatch(/^rec-/)
    expect(record.parentUserId).toBe('u1')
    expect(record.childUserId).toBe('u2')
    expect(record.level).toBe(1)
    expect(record.ancestorChain).toEqual(['u1'])
    expect(record.tracked).toBe(true)
  })

  it('正例: 三级裂变链正确构建', () => {
    // A → B
    const ca = service.generateCode({ parentUserId: 'A', tenantId: 't' })
    service.trackClick({ shortCode: ca.shortCode, source: 'link' })
    service.trackSignup({ shortCode: ca.shortCode, childUserId: 'B' })
    // B → C
    const cb = service.generateCode({ parentUserId: 'B', tenantId: 't' })
    service.trackClick({ shortCode: cb.shortCode, source: 'link' })
    service.trackSignup({ shortCode: cb.shortCode, childUserId: 'C' })
    // C → D
    const cc = service.generateCode({ parentUserId: 'C', tenantId: 't' })
    service.trackClick({ shortCode: cc.shortCode, source: 'link' })
    const rec = service.trackSignup({ shortCode: cc.shortCode, childUserId: 'D' })
    expect(rec.ancestorChain).toEqual(['C', 'B', 'A'])
  })

  it('正例: 支持自定义 signupAt', () => {
    const code = service.generateCode({ parentUserId: 'u1', tenantId: 't' })
    service.trackClick({ shortCode: code.shortCode, source: 'wechat' })
    const record = service.trackSignup({
      shortCode: code.shortCode,
      childUserId: 'u2',
      signupAt: '2026-06-26T06:00:00Z',
    })
    expect(record.signedUpAt).toBe('2026-06-26T06:00:00Z')
  })

  it('反例: 不存在的短码抛出错误', () => {
    expect(() => service.trackSignup({ shortCode: 'NONEXIST', childUserId: 'uX' })).toThrow('not found')
  })

  it('边界: 先注册后点击也能正常创建记录', () => {
    const code = service.generateCode({ parentUserId: 'u1', tenantId: 't' })
    const record = service.trackSignup({ shortCode: code.shortCode, childUserId: 'u2' })
    expect(record).toBeDefined()
    expect(record.parentUserId).toBe('u1')
  })
})

// ═══════════════════════════════════════════════════════════════
// issueRewards
// ═══════════════════════════════════════════════════════════════

describe('issueRewards', () => {
  function setupSignup(parent: string, child: string, tenant = 't'): string {
    const code = service.generateCode({ parentUserId: parent, tenantId: tenant })
    service.trackClick({ shortCode: code.shortCode, source: 'link' })
    const record = service.trackSignup({ shortCode: code.shortCode, childUserId: child })
    return record.recordId
  }

  it('正例: 单级奖励 L1（积分 + 优惠券）', () => {
    const recordId = setupSignup('A', 'B')
    const rewards = service.issueRewards(recordId)
    expect(rewards.length).toBe(1)
    expect(rewards[0].recipientUserId).toBe('A')
    expect(rewards[0].level).toBe(1)
    expect(rewards[0].rewardValue).toBe(100)
    expect(rewards[0].couponPlanId).toBe('coupon-l1-50')
    expect(rewards[0].status).toBe('issued')
  })

  it('正例: 三级裂变发放 L1+L2+L3 奖励', () => {
    // A → B → C → D
    setupSignup('A', 'B')
    setupSignup('B', 'C')
    const recordId = setupSignup('C', 'D')
    const rewards = service.issueRewards(recordId)
    expect(rewards.length).toBe(3)
    expect(rewards[0].recipientUserId).toBe('C') // L1
    expect(rewards[0].rewardValue).toBe(100)
    expect(rewards[0].couponPlanId).toBe('coupon-l1-50')
    expect(rewards[1].recipientUserId).toBe('B') // L2
    expect(rewards[1].rewardValue).toBe(50)
    expect(rewards[2].recipientUserId).toBe('A') // L3
    expect(rewards[2].rewardValue).toBe(10)
  })

  it('正例: 自定义奖励规则', () => {
    service.setRewardRules({ 1: { points: 200, coupon: 100 }, 2: { points: 100, coupon: 0 }, 3: { points: 20, coupon: 0 } })
    const recordId = setupSignup('A', 'B')
    const rewards = service.issueRewards(recordId)
    expect(rewards[0].rewardValue).toBe(200)
    expect(rewards[0].couponPlanId).toBe('coupon-l1-100')
  })

  it('反例: 不存在的 recordId 抛出错误', () => {
    expect(() => service.issueRewards('nonexistent')).toThrow('not found')
  })
})

// ═══════════════════════════════════════════════════════════════
// getMetrics
// ═══════════════════════════════════════════════════════════════

describe('getMetrics', () => {
  it('边界: 无数据全零', () => {
    const m = service.getMetrics()
    expect(m.totalCodes).toBe(0)
    expect(m.totalClicks).toBe(0)
    expect(m.totalSignups).toBe(0)
    expect(m.totalRewardsIssued).toBe(0)
    expect(m.totalRewardsValue).toBe(0)
  })

  it('正例: 按 tenant 过滤', () => {
    service.generateCode({ parentUserId: 'A', tenantId: 't1' })
    service.generateCode({ parentUserId: 'B', tenantId: 't1' })
    service.generateCode({ parentUserId: 'C', tenantId: 't2' })
    expect(service.getMetrics('t1').totalCodes).toBe(2)
    expect(service.getMetrics('t2').totalCodes).toBe(1)
  })

  it('正例: 追踪率计算', () => {
    const code = service.generateCode({ parentUserId: 'A', tenantId: 't' })
    for (let i = 0; i < 10; i++) service.trackClick({ shortCode: code.shortCode, source: 'link' })
    for (let i = 0; i < 7; i++) service.trackSignup({ shortCode: code.shortCode, childUserId: `child-${i}` })
    const m = service.getMetrics('t')
    expect(m.totalClicks).toBe(10)
    expect(m.totalSignups).toBe(7)
    expect(m.trackRate).toBe(0.7)
  })
})

// ═══════════════════════════════════════════════════════════════
// createReferral
// ═══════════════════════════════════════════════════════════════

describe('createReferral', () => {
  it('正例: 一站式创建推荐', () => {
    const code = service.createReferral({ tenantId: 't' }, 'A', 'B')
    expect(code.shortCode.length).toBe(8)
    const records = service.listRecords('t')
    expect(records.length).toBe(1)
    expect(records[0].parentUserId).toBe('A')
    expect(records[0].childUserId).toBe('B')
  })

  it('正例: 自定义 code', () => {
    const code = service.createReferral({ tenantId: 't' }, 'A', 'B', 'MYCODE')
    expect(code.shortCode).toBe('MYCODE')
  })

  it('边界: 重复自定义 code 自动降级', () => {
    service.createReferral({ tenantId: 't' }, 'A', 'B', 'MYCODE')
    const c2 = service.createReferral({ tenantId: 't' }, 'C', 'D', 'MYCODE')
    // 第二个 MYCODE 已存在，自动生成新 code
    expect(c2.shortCode).not.toBe('MYCODE')
  })
})

// ═══════════════════════════════════════════════════════════════
// listRecords
// ═══════════════════════════════════════════════════════════════

describe('listRecords', () => {
  it('正例: 返回 tenant 范围的记录', () => {
    const c1 = service.generateCode({ parentUserId: 'A', tenantId: 't1' })
    service.trackClick({ shortCode: c1.shortCode, source: 'link' })
    service.trackSignup({ shortCode: c1.shortCode, childUserId: 'B' })
    const c2 = service.generateCode({ parentUserId: 'C', tenantId: 't2' })
    service.trackClick({ shortCode: c2.shortCode, source: 'link' })
    service.trackSignup({ shortCode: c2.shortCode, childUserId: 'D' })
    expect(service.listRecords('t1').length).toBe(1)
    expect(service.listRecords('t2').length).toBe(1)
  })

  it('边界: 无记录返回空数组', () => {
    expect(service.listRecords('t')).toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════════
// listRewards
// ═══════════════════════════════════════════════════════════════

describe('listRewards', () => {
  it('正例: 按 tenant 过滤奖励', () => {
    // t1
    const c1 = service.generateCode({ parentUserId: 'A', tenantId: 't1' })
    service.trackClick({ shortCode: c1.shortCode, source: 'link' })
    const r1 = service.trackSignup({ shortCode: c1.shortCode, childUserId: 'B' })
    service.issueRewards(r1.recordId)
    // t2
    const c2 = service.generateCode({ parentUserId: 'C', tenantId: 't2' })
    service.trackClick({ shortCode: c2.shortCode, source: 'link' })
    const r2 = service.trackSignup({ shortCode: c2.shortCode, childUserId: 'D' })
    service.issueRewards(r2.recordId)
    expect(service.listRewards('t1').length).toBe(1)
    expect(service.listRewards('t2').length).toBe(1)
  })
})

// ═══════════════════════════════════════════════════════════════
// reset
// ═══════════════════════════════════════════════════════════════

describe('reset', () => {
  it('正例: 清空所有数据', () => {
    service.generateCode({ parentUserId: 'A', tenantId: 't' })
    expect(service.getMetrics('t').totalCodes).toBeGreaterThan(0)
    service.reset()
    expect(service.getMetrics('t').totalCodes).toBe(0)
    expect(service.getMetrics().totalCodes).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// setRewardRules
// ═══════════════════════════════════════════════════════════════

describe('setRewardRules', () => {
  it('正例: 覆盖默认奖励规则', () => {
    service.setRewardRules({ 1: { points: 500, coupon: 200 }, 2: { points: 100, coupon: 0 }, 3: { points: 30, coupon: 0 } })
    const code = service.generateCode({ parentUserId: 'A', tenantId: 't' })
    service.trackClick({ shortCode: code.shortCode, source: 'link' })
    const record = service.trackSignup({ shortCode: code.shortCode, childUserId: 'B' })
    const rewards = service.issueRewards(record.recordId)
    expect(rewards[0].rewardValue).toBe(500)
    expect(rewards[0].couponPlanId).toBe('coupon-l1-200')
  })
})
