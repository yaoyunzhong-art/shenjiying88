import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [referral] [C] 角色测试 v3 — 大飞哥社群裂变高级场景
 *
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 围绕大飞哥美国三店裂变推广运营场景：
 * 店A: Cyber Galaxy Arcade (Colonial Heights)
 * 店B: 休斯顿
 * 店C: 达拉斯(待定)
 *
 * 每个角色 >= 3 测试用例（正常流程 + 业务边界 + 裂变深度/奖励上限）
 * 覆盖: 三级裂变链、批量生成、奖励发放、过期处理、metrics 采集
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ReferralController } from './referral.controller'
import { ReferralService } from './referral.service'
import type { ReferralLevel } from './referral.entity'

// ── 角色定义 ──
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

// ── 店铺常量 ──
const STORES = {
  CyberGalaxy: { tenantId: 'store-cyber', name: 'Cyber Galaxy Arcade (Colonial Heights)' },
  Houston: { tenantId: 'store-houston', name: '休斯顿店' },
  Dallas: { tenantId: 'store-dallas', name: '达拉斯店' },
} as const

// ── 工厂函数 ──
function freshService(): ReferralService {
  const svc = new ReferralService()
  svc.reset()
  return svc
}

function freshController(): ReferralController {
  return new ReferralController(freshService())
}

// ════════════════════════════════════════════════════════════
// 👔店长 — Store Manager
// ════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} referral 裂变运营管理`, () => {
  it('店长查看整店裂变引流效果（正常流程）', () => {
    const ctrl = freshController()
    // 店A店长生成10个短码，每个有不同邀请效果
    for (let i = 0; i < 10; i++) {
      const code = ctrl.generateCode({
        parentUserId: `user-promoter-${i}`,
        tenantId: STORES.CyberGalaxy.tenantId,
        baseUrl: 'https://m.shenjiying88.com/cyber',
      })
      // 每个短码1-3次点击
      for (let j = 0; j < (i % 3) + 1; j++) {
        ctrl.trackClick({ shortCode: code.shortCode, source: 'wechat' })
      }
    }
    const metrics = ctrl.getMetrics(undefined as unknown as string)
    assert.equal(metrics.totalCodes, 10)
    assert.ok(metrics.totalClicks >= 10)
    assert.ok(metrics.totalClicks <= 30)
    assert.ok(typeof metrics.trackRate === 'number')
  })

  it('店长按租户查看门店专属裂变数据（多店运营）', () => {
    const ctrl = freshController()
    // 店A: 5个短码
    for (let i = 0; i < 5; i++) {
      const code = ctrl.generateCode({
        parentUserId: `cyber-promoter-${i}`,
        tenantId: STORES.CyberGalaxy.tenantId,
      })
      ctrl.trackClick({ shortCode: code.shortCode, childUserId: `cyber-new-${i}`, source: 'qrcode' })
      ctrl.trackSignup({ shortCode: code.shortCode, childUserId: `cyber-new-${i}` })
    }
    // 店B: 3个短码
    for (let i = 0; i < 3; i++) {
      const code = ctrl.generateCode({
        parentUserId: `houston-promoter-${i}`,
        tenantId: STORES.Houston.tenantId,
      })
      ctrl.trackClick({ shortCode: code.shortCode, childUserId: `houston-new-${i}`, source: 'mini-program' })
      ctrl.trackSignup({ shortCode: code.shortCode, childUserId: `houston-new-${i}` })
    }
    const cyberMetrics = ctrl.getMetrics(STORES.CyberGalaxy.tenantId)
    const houstonMetrics = ctrl.getMetrics(STORES.Houston.tenantId)

    assert.equal(cyberMetrics.totalCodes, 5)
    assert.equal(cyberMetrics.totalSignups, 5)
    assert.equal(houstonMetrics.totalCodes, 3)
    assert.equal(houstonMetrics.totalSignups, 3)
  })

  it('店长检查无效短码查询（边界：不存在短码）', () => {
    const ctrl = freshController()
    const result = ctrl.getCode('INVALID99')
    assert.equal(result.found, false)
    assert.ok(result.message.includes('INVALID99'))
  })

  it('店长批量查看新注册会员邀请人分布（团队激励决策）', () => {
    const ctrl = freshController()
    // 店A: 创建链式推荐 A → B → C
    const codeA = ctrl.generateCode({ parentUserId: 'star-promoter', tenantId: STORES.CyberGalaxy.tenantId })
    ctrl.trackClick({ shortCode: codeA.shortCode, childUserId: 'newbie1', source: 'wechat' })
    ctrl.trackSignup({ shortCode: codeA.shortCode, childUserId: 'newbie1' })

    const codeB = ctrl.generateCode({ parentUserId: 'newbie1', tenantId: STORES.CyberGalaxy.tenantId })
    ctrl.trackClick({ shortCode: codeB.shortCode, childUserId: 'newbie2', source: 'wechat' })
    ctrl.trackSignup({ shortCode: codeB.shortCode, childUserId: 'newbie2' })

    const allMetrics = ctrl.getMetrics(STORES.CyberGalaxy.tenantId)
    assert.equal(allMetrics.totalSignups, 2)
    assert.ok(allMetrics.totalCodes >= 2)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — Front Desk
// ════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} referral 前台裂变操作`, () => {
  it('前台帮顾客生成分享短码（现场引流）', () => {
    const ctrl = freshController()
    const code = ctrl.generateCode({
      parentUserId: 'vip-customer-007',
      tenantId: STORES.CyberGalaxy.tenantId,
      baseUrl: 'https://m.shenjiying88.com/r',
    })
    assert.ok(code.shortCode.length >= 6)
    assert.equal(code.shortCode.length, 8)
    assert.ok(code.landingUrl.includes(code.shortCode))
    assert.ok(code.qrCodeUrl)
    assert.equal(code.parentUserId, 'vip-customer-007')
  })

  it('前台扫码记录新会员注册（快速补登）', () => {
    const ctrl = freshController()
    const code = ctrl.generateCode({ parentUserId: 'existing-member', tenantId: STORES.Houston.tenantId })
    ctrl.trackClick({ shortCode: code.shortCode, childUserId: 'walkin-user', source: 'qrcode' })
    const signup = ctrl.trackSignup({ shortCode: code.shortCode, childUserId: 'walkin-user' })
    assert.ok(signup.recordId.startsWith('rec-'))
    assert.equal(signup.parentUserId, 'existing-member')
    assert.equal(signup.childUserId, 'walkin-user')
    assert.equal(signup.tracked, true)
    assert.deepEqual(signup.ancestorChain, ['existing-member'])
  })

  it('前台边界：点击过期短码（业务异常）', () => {
    const ctrl = freshController()
    const code = ctrl.generateCode({
      parentUserId: 'user-short',
      tenantId: STORES.Dallas.tenantId,
      expiresInDays: -1, // 过期
    })
    const result = ctrl.trackClick({ shortCode: code.shortCode, source: 'wechat' })
    assert.equal(result.success, false)
  })

  it('前台补登时短码不存在（边界：系统容错）', () => {
    const ctrl = freshController()
    try {
      ctrl.trackSignup({ shortCode: 'GHOST99', childUserId: 'ghost-user' })
      assert.fail('应抛出异常')
    } catch (err) {
      assert.ok((err as Error).message.includes('not found'))
    }
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — Human Resources
// ════════════════════════════════════════════════════════════
describe(`${ROLES.HR} referral 裂变推广奖励核算`, () => {
  it('HR 计算三级裂变奖励发放（正常三级链）', () => {
    const svc = new ReferralService()
    svc.reset()
    const chainCtrl = new ReferralController(svc)

    const codeA = chainCtrl.generateCode({ parentUserId: 'user-A', tenantId: 't' })
    chainCtrl.trackClick({ shortCode: codeA.shortCode, childUserId: 'user-B', source: 'wechat' })
    chainCtrl.trackSignup({ shortCode: codeA.shortCode, childUserId: 'user-B' })

    const codeB = chainCtrl.generateCode({ parentUserId: 'user-B', tenantId: 't' })
    chainCtrl.trackClick({ shortCode: codeB.shortCode, childUserId: 'user-C', source: 'wechat' })
    chainCtrl.trackSignup({ shortCode: codeB.shortCode, childUserId: 'user-C' })

    const codeC = chainCtrl.generateCode({ parentUserId: 'user-C', tenantId: 't' })
    chainCtrl.trackClick({ shortCode: codeC.shortCode, childUserId: 'user-D', source: 'wechat' })
    const signup = chainCtrl.trackSignup({ shortCode: codeC.shortCode, childUserId: 'user-D' })

    const rewards = chainCtrl.issueRewards(signup.recordId)
    assert.equal(rewards.rewards.length, 3)
    // L1: user-C (直接邀请人) 获 100 points
    assert.equal(rewards.rewards[0].recipientUserId, 'user-C')
    assert.equal(rewards.rewards[0].rewardValue, 100)
    // L2: user-B 获 50 points
    assert.equal(rewards.rewards[1].recipientUserId, 'user-B')
    assert.equal(rewards.rewards[1].rewardValue, 50)
    // L3: user-A 获 10 points
    assert.equal(rewards.rewards[2].recipientUserId, 'user-A')
    assert.equal(rewards.rewards[2].rewardValue, 10)
  })

  it('HR 查看员工推广业绩排名（运营绩效管理）', () => {
    const ctrl = freshController()
    const promoters = ['emp-A', 'emp-B', 'emp-C']
    for (const p of promoters) {
      for (let i = 0; i < 3; i++) {
        const code = ctrl.generateCode({ parentUserId: p, tenantId: STORES.CyberGalaxy.tenantId })
        ctrl.trackClick({ shortCode: code.shortCode, childUserId: `${p}-ref-${i}`, source: 'link' })
        ctrl.trackSignup({ shortCode: code.shortCode, childUserId: `${p}-ref-${i}` })
      }
    }
    const records = ctrl.listRecords(STORES.CyberGalaxy.tenantId)
    assert.equal(records.records.length, 9) // 3 employees × 3 referrals
  })

  it('HR 查询裂变奖励发放记录（薪资核对）', () => {
    const ctrl = freshController()
    const code = ctrl.generateCode({ parentUserId: 'emp-X', tenantId: STORES.Houston.tenantId })
    ctrl.trackClick({ shortCode: code.shortCode, childUserId: 'new-user', source: 'wechat' })
    const signup = ctrl.trackSignup({ shortCode: code.shortCode, childUserId: 'new-user' })
    const rewards = ctrl.issueRewards(signup.recordId)
    assert.equal(rewards.rewards.length, 1)

    const allRewards = ctrl.listRewards(STORES.Houston.tenantId)
    assert.equal(allRewards.rewards.length, 1)
    assert.equal(allRewards.rewards[0].recipientUserId, 'emp-X')
    assert.equal(allRewards.rewards[0].status, 'issued')
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — Security
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Security} referral 裂变安全风控`, () => {
  it('安监检测短码唯一性和随机性（防碰撞）', () => {
    const ctrl = freshController()
    const codes = new Set<string>()
    for (let i = 0; i < 50; i++) {
      const code = ctrl.generateCode({
        parentUserId: `user-${i}`,
        tenantId: STORES.CyberGalaxy.tenantId,
      })
      codes.add(code.shortCode)
    }
    // 50 个短码应该全部唯一
    assert.equal(codes.size, 50)
    // 每个短码长度应为8
    for (const c of codes) {
      assert.equal(c.length, 8)
    }
  })

  it('安监限制裂变深度（只追踪L1/L2/L3）', () => {
    const svc = new ReferralService()
    svc.reset()
    const chainCtrl = new ReferralController(svc)
    // 构建长链: A → B → C → D → E （L4超出限制）
    const prevUsers = ['user-A']
    for (const nextUser of ['user-B', 'user-C', 'user-D', 'user-E']) {
      const code = chainCtrl.generateCode({ parentUserId: prevUsers[prevUsers.length - 1], tenantId: 't' })
      chainCtrl.trackClick({ shortCode: code.shortCode, childUserId: nextUser, source: 'link' })
      const signup = chainCtrl.trackSignup({ shortCode: code.shortCode, childUserId: nextUser })
      // 验证ancestorChain不超过3层
      assert.ok(signup.ancestorChain.length <= 3, `Chain exceeded 3 levels: ${signup.ancestorChain}`)
      prevUsers.push(nextUser)
    }
  })

  it('安监验证奖励发放记录完整性（防重放）', () => {
    const svc = new ReferralService()
    svc.reset()
    const chainCtrl = new ReferralController(svc)

    const code = chainCtrl.generateCode({ parentUserId: 'user-A', tenantId: 't' })
    chainCtrl.trackClick({ shortCode: code.shortCode, childUserId: 'user-B', source: 'link' })
    const signup = chainCtrl.trackSignup({ shortCode: code.shortCode, childUserId: 'user-B' })

    // 第一次发放奖励
    const rewards1 = chainCtrl.issueRewards(signup.recordId)
    assert.equal(rewards1.rewards.length, 1)
    assert.equal(rewards1.rewards[0].status, 'issued')

    // 重复发放同一 record
    const rewards2 = chainCtrl.issueRewards(signup.recordId)
    assert.equal(rewards2.rewards.length, 1) // 仍然是1条
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — Game Guide
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} referral 导玩员拉新推广`, () => {
  it('导玩员为常客生成专属分享链接（日常推广）', () => {
    const ctrl = freshController()
    const code = ctrl.generateCode({
      parentUserId: 'vip-guide-favorite',
      tenantId: STORES.CyberGalaxy.tenantId,
      expiresInDays: 30,
    })
    assert.equal(code.parentUserId, 'vip-guide-favorite')
    assert.ok(code.expiresAt)
    const expiresAtDate = new Date(code.expiresAt)
    const now = new Date()
    const diffDays = (expiresAtDate.getTime() - now.getTime()) / 86400000
    assert.ok(diffDays > 25 && diffDays < 35) // 30天左右
  })

  it('导玩员检查自己的推广效果（日常数据）', () => {
    const ctrl = freshController()
    const code = ctrl.generateCode({
      parentUserId: 'guide-alex',
      tenantId: STORES.CyberGalaxy.tenantId,
    })
    ctrl.trackClick({ shortCode: code.shortCode, childUserId: 'friend1', source: 'link' })
    ctrl.trackClick({ shortCode: code.shortCode, childUserId: 'friend2', source: 'wechat' })
    ctrl.trackClick({ shortCode: code.shortCode, childUserId: 'friend3', source: 'qrcode' })
    ctrl.trackSignup({ shortCode: code.shortCode, childUserId: 'friend1' })
    const codeInfo = ctrl.getCode(code.shortCode)
    assert.ok(codeInfo.found)
    if (codeInfo.found) {
      assert.equal(codeInfo.code.totalClicks, 3)
      assert.equal(codeInfo.code.totalSignups, 1)
    }
  })

  it('导玩员边界：生成短码时 baseUrl 为空（使用默认值）', () => {
    const ctrl = freshController()
    const code = ctrl.generateCode({ parentUserId: 'guide-test', tenantId: STORES.Dallas.tenantId })
    assert.ok(code.landingUrl.startsWith('https://m.shenjiying88.com'))
    assert.ok(code.landingUrl.includes(code.shortCode))
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — Operations Specialist
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} referral 裂变系统运维`, () => {
  it('运行专员批量生成推广短码（活动预热）', () => {
    const ctrl = freshController()
    const batchSize = 20
    const codes: string[] = []
    for (let i = 0; i < batchSize; i++) {
      const code = ctrl.generateCode({
        parentUserId: `campaign-promoter-${i}`,
        tenantId: STORES.CyberGalaxy.tenantId,
      })
      codes.push(code.shortCode)
    }
    assert.equal(codes.length, batchSize)
    // 验证全部唯一
    assert.equal(new Set(codes).size, batchSize)
  })

  it('运行专员查看裂变追踪率（考核指标≥95%）', () => {
    const ctrl = freshController()
    // 生成10个短码，其中8个被点击后有注册，2个仅点击
    for (let i = 0; i < 10; i++) {
      const code = ctrl.generateCode({ parentUserId: `user-${i}`, tenantId: STORES.Houston.tenantId })
      if (i < 8) {
        ctrl.trackClick({ shortCode: code.shortCode, childUserId: `new-${i}`, source: 'wechat' })
        ctrl.trackSignup({ shortCode: code.shortCode, childUserId: `new-${i}` })
      } else {
        ctrl.trackClick({ shortCode: code.shortCode, source: 'link' })
      }
    }
    const metrics = ctrl.getMetrics(STORES.Houston.tenantId)
    // 追踪率 = 8/10 = 80%
    assert.equal(metrics.totalClicks, 10)
    assert.equal(metrics.totalSignups, 8)
    assert.equal(metrics.trackRate, 0.8)
  })

  it('运行专员检查数据库清空后的空状态（系统重启）', () => {
    const svc = freshService()
    const ctrl = new ReferralController(svc)

    const metrics = ctrl.getMetrics(undefined as unknown as string)
    assert.equal(metrics.totalCodes, 0)
    assert.equal(metrics.totalClicks, 0)
    assert.equal(metrics.totalSignups, 0)
    assert.equal(metrics.trackRate, 0)
  })

  it('运行专员验证 setRewardRules 可动态调整奖励（运营策略调整）', () => {
    const svc = new ReferralService()
    svc.reset()
    // 调整奖励规则: L1 200 积分
    svc.setRewardRules({ 1: { points: 200, coupon: 100 }, 2: { points: 100, coupon: 0 }, 3: { points: 20, coupon: 0 } })
    const chainCtrl = new ReferralController(svc)

    const codeA = chainCtrl.generateCode({ parentUserId: 'user-A', tenantId: 't' })
    chainCtrl.trackClick({ shortCode: codeA.shortCode, childUserId: 'user-B', source: 'link' })
    chainCtrl.trackSignup({ shortCode: codeA.shortCode, childUserId: 'user-B' })

    const codeB = chainCtrl.generateCode({ parentUserId: 'user-B', tenantId: 't' })
    chainCtrl.trackClick({ shortCode: codeB.shortCode, childUserId: 'user-C', source: 'link' })
    chainCtrl.trackSignup({ shortCode: codeB.shortCode, childUserId: 'user-C' })

    const codeC = chainCtrl.generateCode({ parentUserId: 'user-C', tenantId: 't' })
    chainCtrl.trackClick({ shortCode: codeC.shortCode, childUserId: 'user-D', source: 'link' })
    const signup = chainCtrl.trackSignup({ shortCode: codeC.shortCode, childUserId: 'user-D' })
    const rewards = chainCtrl.issueRewards(signup.recordId)

    assert.equal(rewards.rewards.length, 3)
    assert.equal(rewards.rewards[0].rewardValue, 200)
    assert.equal(rewards.rewards[1].rewardValue, 100)
    assert.equal(rewards.rewards[2].rewardValue, 20)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — Teambuilding
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} referral 团建推广活动`, () => {
  it('团建专员生成限时推广短码（周末活动专属）', () => {
    const ctrl = freshController()
    const code = ctrl.generateCode({
      parentUserId: 'teambuilding-coord',
      tenantId: STORES.CyberGalaxy.tenantId,
      expiresInDays: 2, // 周末活动2天有效
    })
    const expiresAt = new Date(code.expiresAt!)
    const now = new Date()
    const diffHours = (expiresAt.getTime() - now.getTime()) / 3600000
    assert.ok(diffHours > 40 && diffHours < 52)
  })

  it('团建专员统计活动总拉新人数（活动效果复盘）', () => {
    const ctrl = freshController()
    // 团建活动产生20个注册
    for (let i = 0; i < 20; i++) {
      const code = ctrl.generateCode({
        parentUserId: 'team-leader',
        tenantId: STORES.CyberGalaxy.tenantId,
      })
      ctrl.trackClick({ shortCode: code.shortCode, childUserId: `team-new-${i}`, source: 'wechat' })
      ctrl.trackSignup({ shortCode: code.shortCode, childUserId: `team-new-${i}` })
    }
    const records = ctrl.listRecords(STORES.CyberGalaxy.tenantId)
    assert.equal(records.records.length, 20)
    const metrics = ctrl.getMetrics(STORES.CyberGalaxy.tenantId)
    assert.equal(metrics.totalSignups, 20)
  })

  it('团建专员跨店拉新（多店联合团建活动）', () => {
    const ctrl = freshController()
    // 达拉斯团建到休斯顿店玩
    const code = ctrl.generateCode({
      parentUserId: 'dallas-teambuilder',
      tenantId: STORES.Houston.tenantId, // 跨店: 达拉斯团建到休斯顿
    })
    ctrl.trackClick({ shortCode: code.shortCode, childUserId: 'dallas-newbie', source: 'mini-program' })
    ctrl.trackSignup({ shortCode: code.shortCode, childUserId: 'dallas-newbie' })

    const metrics = ctrl.getMetrics(STORES.Houston.tenantId)
    assert.equal(metrics.totalCodes, 1)
    assert.equal(metrics.totalSignups, 1)
    const dallasMetrics = ctrl.getMetrics(STORES.Dallas.tenantId)
    assert.equal(dallasMetrics.totalCodes, 0) // 达拉斯店无数据
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — Marketing
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} referral 营销裂变活动`, () => {
  it('营销专员生成裂变短码并查看转化率（活动效果）', () => {
    const ctrl = freshController()
    // 营销活动: 5个短码，每个20次点击，每5次点击有1次注册
    for (let i = 0; i < 5; i++) {
      const code = ctrl.generateCode({
        parentUserId: `mkt-promoter-${i}`,
        tenantId: STORES.CyberGalaxy.tenantId,
      })
      // 每个短码20次点击
      for (let j = 0; j < 20; j++) {
        ctrl.trackClick({ shortCode: code.shortCode, childUserId: `click-${i}-${j}`, source: 'link' })
        // 每5次点击有1次注册
        if (j % 5 === 0) {
          ctrl.trackSignup({ shortCode: code.shortCode, childUserId: `click-${i}-${j}` })
        }
      }
    }
    const metrics = ctrl.getMetrics(STORES.CyberGalaxy.tenantId)
    assert.equal(metrics.totalCodes, 5)
    assert.equal(metrics.totalClicks, 100)
    assert.equal(metrics.totalSignups, 20) // 每个短码4个注册
    // 追踪率 = 20 / 100 = 0.2
    assert.equal(metrics.trackRate, 0.2)
    // 转化率 = 20 / 100 = 0.2
    assert.equal(metrics.conversionRate, 0.2)
  })

  it('营销专员按来源渠道分析裂变效果', () => {
    const ctrl = freshController()
    const sources: Array<'wechat' | 'mini-program' | 'link' | 'qrcode'> = ['wechat', 'mini-program', 'link', 'qrcode']
    for (const src of sources) {
      const code = ctrl.generateCode({
        parentUserId: `mkt-channel-${src}`,
        tenantId: STORES.Houston.tenantId,
      })
      for (let k = 0; k < 5; k++) {
        ctrl.trackClick({ shortCode: code.shortCode, childUserId: `${src}-user-${k}`, source: src })
        ctrl.trackSignup({ shortCode: code.shortCode, childUserId: `${src}-user-${k}` })
      }
    }
    const metrics = ctrl.getMetrics(STORES.Houston.tenantId)
    assert.equal(metrics.totalCodes, 4)
    assert.equal(metrics.totalClicks, 20)
    assert.equal(metrics.totalSignups, 20)
    assert.equal(metrics.trackRate, 1.0)
  })

  it('营销专员查看奖励发放总价值（ROI计算）', () => {
    const ctrl = freshController()
    // 10个直接邀请，每个L1奖励100积分
    for (let i = 0; i < 10; i++) {
      const code = ctrl.generateCode({ parentUserId: `inviter-${i}`, tenantId: STORES.CyberGalaxy.tenantId })
      ctrl.trackClick({ shortCode: code.shortCode, childUserId: `invitee-${i}`, source: 'link' })
      const signup = ctrl.trackSignup({ shortCode: code.shortCode, childUserId: `invitee-${i}` })
      ctrl.issueRewards(signup.recordId)
    }
    const metrics = ctrl.getMetrics(STORES.CyberGalaxy.tenantId)
    assert.equal(metrics.totalRewardsIssued, 10)
    assert.equal(metrics.totalRewardsValue, 1000) // 10 × 100
  })

  it('营销专员边界：无活动数据时的空指标（新店铺）', () => {
    const ctrl = freshController()
    const metrics = ctrl.getMetrics(STORES.Dallas.tenantId)
    assert.equal(metrics.totalCodes, 0)
    assert.equal(metrics.totalClicks, 0)
    assert.equal(metrics.totalSignups, 0)
    assert.equal(metrics.trackRate, 0)
    assert.equal(metrics.totalRewardsIssued, 0)
    assert.equal(metrics.totalRewardsValue, 0)
  })
})
