/**
 * Member Simulator Test
 *
 * 模拟会员系统的场景覆盖：
 * - 会员等级计算 (computeMemberLevel)
 * - 等级升级判断 (canUpgrade)
 * - 阈值边界 (MEMBER_LEVEL_THRESHOLDS)
 * - 会员状态流转
 * - 会员注册/登录
 * - 积分调整
 * - 会员档案操作
 *
 * 8 角色视角覆盖：
 *  👔店长 - 会员等级策略审核
 *  🛒前台 - 会员积分查询与消费
 *  👥HR - 员工关联会员统计
 *  🔧安监 - 会员状态审计
 *  🎮导玩员 - 游戏化等级激励
 *  🎯运行专员 - 会员生命周期运营
 *  🤝团建 - 团建活动会员筛选
 *  📢营销 - 会员分层精准营销
 */

import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  MemberLevel,
  MemberStatus,
  computeMemberLevel,
  canUpgrade,
  MEMBER_LEVEL_THRESHOLDS
} from './member.entity'

// ─── Simulator helpers ───

interface SimulatedMember {
  memberId: string
  level: MemberLevel
  status: MemberStatus
  points: number
  growthValue: number
  visitCount: number
  totalSpend: number
  registeredAt: string
  lastActiveAt: string
}

function createSimulatedMember(
  memberId: string,
  points: number,
  overrides?: Partial<Pick<SimulatedMember, 'growthValue' | 'visitCount' | 'totalSpend'>>
): SimulatedMember {
  return {
    memberId,
    level: computeMemberLevel(points),
    status: MemberStatus.Active,
    points,
    growthValue: overrides?.growthValue ?? 0,
    visitCount: overrides?.visitCount ?? 0,
    totalSpend: overrides?.totalSpend ?? 0,
    registeredAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  }
}

/** 模拟积分调整 */
function simulatePointsAdjustment(
  member: SimulatedMember,
  deltaPoints: number
): { updated: SimulatedMember; action: 'upgrade' | 'downgrade' | 'unchanged' } {
  const newPoints = Math.max(0, member.points + deltaPoints)
  const newLevel = computeMemberLevel(newPoints)

  const levelOrder = Object.values(MemberLevel)
  const oldIdx = levelOrder.indexOf(member.level)
  const newIdx = levelOrder.indexOf(newLevel)

  let action: 'upgrade' | 'downgrade' | 'unchanged'
  if (newIdx > oldIdx) action = 'upgrade'
  else if (newIdx < oldIdx) action = 'downgrade'
  else action = 'unchanged'

  return {
    updated: { ...member, points: newPoints, level: newLevel },
    action
  }
}

/** 模拟状态变更 */
function simulateStatusChange(
  member: SimulatedMember,
  newStatus: MemberStatus
): SimulatedMember {
  return { ...member, status: newStatus }
}

/** 模拟会员登录 */
function simulateMemberLogin(
  member: SimulatedMember
): { success: boolean; member: SimulatedMember; lastActiveAt: string } {
  const blockedStatuses = [MemberStatus.Frozen, MemberStatus.Blacklisted]
  if (blockedStatuses.includes(member.status)) {
    return { success: false, member, lastActiveAt: member.lastActiveAt }
  }

  const newLastActive = new Date().toISOString()
  return {
    success: true,
    member: { ...member, lastActiveAt: newLastActive },
    lastActiveAt: newLastActive
  }
}

// ─── 会员等级计算 (使用真实 computeMemberLevel) ───

describe('Member - Simulator (level computation)', () => {
  test('should compute Bronze level for new member with 0 points', () => {
    assert.equal(computeMemberLevel(0), MemberLevel.Bronze)
  })

  test('should compute Silver level at 500 points', () => {
    assert.equal(computeMemberLevel(500), MemberLevel.Silver)
  })

  test('should compute Gold level at 2000 points', () => {
    assert.equal(computeMemberLevel(2000), MemberLevel.Gold)
  })

  test('should compute Platinum level at 10000 points', () => {
    assert.equal(computeMemberLevel(10000), MemberLevel.Platinum)
  })

  test('should compute Diamond level at 50000 points', () => {
    assert.equal(computeMemberLevel(50000), MemberLevel.Diamond)
  })

  test('should NOT downgrade a Diamond member whose points are still well above threshold', () => {
    const diamondMember = createSimulatedMember('mem-diamond', 80000)
    assert.equal(diamondMember.level, MemberLevel.Diamond)

    const afterDeduction = simulatePointsAdjustment(diamondMember, -20000)
    assert.equal(afterDeduction.updated.points, 60000)
    assert.equal(afterDeduction.updated.level, MemberLevel.Diamond)
    assert.equal(afterDeduction.action, 'unchanged')
  })

  test('Diamond member dropping below 50000 should be re-evaluated as Platinum', () => {
    const diamondMember = createSimulatedMember('mem-fall', 60000)
    assert.equal(diamondMember.level, MemberLevel.Diamond)

    const afterDeduction = simulatePointsAdjustment(diamondMember, -20000)
    assert.equal(afterDeduction.updated.points, 40000)
    assert.equal(afterDeduction.updated.level, MemberLevel.Platinum)
  })

  test('should handle negative total but points clamped at zero', () => {
    const member = createSimulatedMember('mem-zero', 10)
    const adjusted = simulatePointsAdjustment(member, -100)
    assert.equal(adjusted.updated.points, 0)
    assert.equal(adjusted.updated.level, MemberLevel.Bronze)
  })
})

// ─── 等级升级判断 (使用真实 canUpgrade) ───

describe('Member - Simulator (canUpgrade)', () => {
  test('should allow upgrade from Bronze to Silver at 500 points', () => {
    assert.equal(canUpgrade(MemberLevel.Bronze, 500), true)
  })

  test('should allow upgrade from Silver to Gold at 2000 points', () => {
    assert.equal(canUpgrade(MemberLevel.Silver, 2000), true)
  })

  test('should allow upgrade from Gold to Platinum at 10000 points', () => {
    assert.equal(canUpgrade(MemberLevel.Gold, 10000), true)
  })

  test('should allow upgrade from Platinum to Diamond at 50000 points', () => {
    assert.equal(canUpgrade(MemberLevel.Platinum, 50000), true)
  })

  test('should NOT allow same-level "upgrade"', () => {
    assert.equal(canUpgrade(MemberLevel.Gold, 2500), false) // still Gold only
  })

  test('should NOT allow downgrade (Diamond member at 10000 points still cannot upgrade-from Diamond)', () => {
    // canUpgrade(Diamond, 10000) -> computeMemberLevel(10000)=Platinum, Platinum < Diamond -> false
    assert.equal(canUpgrade(MemberLevel.Diamond, 10000), false)
  })

  test('should allow skip-level upgrade (Bronze + 10000 points = Platinum > Bronze)', () => {
    assert.equal(canUpgrade(MemberLevel.Bronze, 10000), true)
  })

  test('Bronze member at 0 points should NOT upgrade', () => {
    assert.equal(canUpgrade(MemberLevel.Bronze, 0), false)
  })
})

// ─── 阈值边界测试 ───

describe('Member - Simulator (threshold boundaries)', () => {
  test('MEMBER_LEVEL_THRESHOLDS should have all 5 levels defined', () => {
    const levels = Object.keys(MEMBER_LEVEL_THRESHOLDS)
    assert.equal(levels.length, 5)
    for (const lv of Object.values(MemberLevel)) {
      assert.ok(lv in MEMBER_LEVEL_THRESHOLDS, `Missing threshold for ${lv}`)
    }
  })

  test('thresholds should be monotonically increasing', () => {
    const thresholds = Object.values(MEMBER_LEVEL_THRESHOLDS) as number[]
    for (let i = 1; i < thresholds.length; i++) {
      assert.ok(thresholds[i] > thresholds[i - 1],
        `Threshold ${thresholds[i]} should be > ${thresholds[i - 1]}`)
    }
  })

  test('exactly at Bronze threshold (0) should be Bronze', () => {
    assert.equal(computeMemberLevel(MEMBER_LEVEL_THRESHOLDS[MemberLevel.Bronze]), MemberLevel.Bronze)
  })

  test('exactly at Silver threshold should be Silver', () => {
    assert.equal(computeMemberLevel(MEMBER_LEVEL_THRESHOLDS[MemberLevel.Silver]), MemberLevel.Silver)
  })

  test('one point below Silver threshold should be Bronze', () => {
    assert.equal(computeMemberLevel(MEMBER_LEVEL_THRESHOLDS[MemberLevel.Silver] - 1), MemberLevel.Bronze)
  })

  test('exactly at Diamond threshold should be Diamond', () => {
    assert.equal(computeMemberLevel(MEMBER_LEVEL_THRESHOLDS[MemberLevel.Diamond]), MemberLevel.Diamond)
  })

  test('one point below Diamond threshold should be Platinum', () => {
    assert.equal(computeMemberLevel(MEMBER_LEVEL_THRESHOLDS[MemberLevel.Diamond] - 1), MemberLevel.Platinum)
  })
})

// ─── 积分调整模拟 ───

describe('Member - Simulator (points adjustment)', () => {
  test('adding points should trigger upgrade when crossing threshold', () => {
    const member = createSimulatedMember('mem-upgrade', MEMBER_LEVEL_THRESHOLDS[MemberLevel.Silver] - 1)
    assert.equal(member.level, MemberLevel.Bronze)

    const result = simulatePointsAdjustment(member, 1)
    assert.equal(result.updated.level, MemberLevel.Silver)
    assert.equal(result.action, 'upgrade')
  })

  test('large point addition can skip levels (Bronze to Platinum)', () => {
    const member = createSimulatedMember('mem-skip', 100)
    assert.equal(member.level, MemberLevel.Bronze)

    const result = simulatePointsAdjustment(member, 10000)
    assert.equal(result.updated.level, MemberLevel.Platinum)
    assert.equal(result.action, 'upgrade')
  })

  test('multiple small additions should eventually trigger upgrade', () => {
    let member = createSimulatedMember('mem-incremental', 4000)
    assert.equal(member.level, MemberLevel.Gold)

    // Need 10000 for Platinum
    for (let i = 0; i < 6; i++) {
      const result = simulatePointsAdjustment(member, 1000)
      member = result.updated
    }
    assert.equal(member.points, 10000)
    assert.equal(member.level, MemberLevel.Platinum)
  })

  test('points cannot go below zero', () => {
    const member = createSimulatedMember('mem-min-zero', 50)
    const result = simulatePointsAdjustment(member, -100)
    assert.equal(result.updated.points, 0)
    assert.equal(result.updated.level, MemberLevel.Bronze)
  })

  test('deducting points can cause downgrade', () => {
    const member = createSimulatedMember('mem-drop', 12000) // Platinum
    assert.equal(member.level, MemberLevel.Platinum)

    const result = simulatePointsAdjustment(member, -3000)
    assert.equal(result.updated.points, 9000)
    assert.equal(result.updated.level, MemberLevel.Gold)
    assert.equal(result.action, 'downgrade')
  })
})

// ─── 会员状态流转 ───

describe('Member - Simulator (status transitions)', () => {
  test('Active member can be frozen', () => {
    const member = createSimulatedMember('mem-to-freeze', 1000)
    assert.equal(member.status, MemberStatus.Active)

    const frozen = simulateStatusChange(member, MemberStatus.Frozen)
    assert.equal(frozen.status, MemberStatus.Frozen)
  })

  test('Active member can be blacklisted', () => {
    const member = createSimulatedMember('mem-to-blacklist', 100)
    const blacklisted = simulateStatusChange(member, MemberStatus.Blacklisted)
    assert.equal(blacklisted.status, MemberStatus.Blacklisted)
  })

  test('Active member can be expired', () => {
    const member = createSimulatedMember('mem-expire', 500)
    const expired = simulateStatusChange(member, MemberStatus.Expired)
    assert.equal(expired.status, MemberStatus.Expired)
  })

  test('Expired member can still login in this model', () => {
    const expired = simulateStatusChange(
      createSimulatedMember('mem-login-expired', 200),
      MemberStatus.Expired
    )
    const result = simulateMemberLogin(expired)
    assert.equal(result.success, true)
  })

  test('Frozen member should NOT be able to login', () => {
    const frozen = simulateStatusChange(
      createSimulatedMember('mem-login-frozen', 2000),
      MemberStatus.Frozen
    )
    const result = simulateMemberLogin(frozen)
    assert.equal(result.success, false)
  })

  test('Blacklisted member should NOT be able to login', () => {
    const blacklisted = simulateStatusChange(
      createSimulatedMember('mem-login-bl', 3000),
      MemberStatus.Blacklisted
    )
    const result = simulateMemberLogin(blacklisted)
    assert.equal(result.success, false)
  })

  test('Active member login should update lastActiveAt', async () => {
    const member = createSimulatedMember('mem-login-ok', 1000)
    const beforeLogin = member.lastActiveAt
    // Small delay to ensure timestamp changes
    await new Promise(resolve => setTimeout(resolve, 5))
    const result = simulateMemberLogin(member)
    assert.equal(result.success, true)
    assert.ok(result.lastActiveAt !== beforeLogin,
      `lastActiveAt should be updated: ${result.lastActiveAt} vs ${beforeLogin}`)
  })
})

// ─── 角色场景 ───

describe('Member - Simulator (👔店长)', () => {
  test('店长应能查看全店会员等级分布', () => {
    const members = [
      createSimulatedMember('mem-001', 100),
      createSimulatedMember('mem-002', 1200),
      createSimulatedMember('mem-003', 5500),
      createSimulatedMember('mem-004', 12000),
      createSimulatedMember('mem-005', 60000)
    ]
    const levels = members.map(m => m.level)
    const distribution: Partial<Record<MemberLevel, number>> = {}
    for (const level of levels) {
      distribution[level] = (distribution[level] ?? 0) + 1
    }
    assert.ok(Object.keys(distribution).length >= 3,
      `Expected at least 3 distinct levels, got ${Object.keys(distribution).length}`)
  })

  test('店长应能识别高价值会员 (Platinum+) 进行 VIP 关怀', () => {
    const members = [
      createSimulatedMember('mem-001', 100),      // Bronze
      createSimulatedMember('mem-002', 1200),     // Silver
      createSimulatedMember('mem-003', 5500),     // Gold
      createSimulatedMember('mem-004', 12000),    // Platinum
      createSimulatedMember('mem-005', 60000)     // Diamond
    ]
    const vipMembers = members.filter(
      m => m.level === MemberLevel.Platinum || m.level === MemberLevel.Diamond
    )
    assert.ok(vipMembers.length >= 2, `Expected >=2 VIP members, got ${vipMembers.length}`)
    for (const vip of vipMembers) {
      assert.ok(vip.points >= MEMBER_LEVEL_THRESHOLDS[MemberLevel.Platinum])
    }
  })
})

describe('Member - Simulator (🛒前台)', () => {
  test('前台应能查询会员当前积分和等级', () => {
    const member = createSimulatedMember('mem-fd', 3500)
    assert.equal(member.points, 3500)
    assert.equal(member.level, MemberLevel.Gold)
  })

  test('前台消费后积分应正确累加', () => {
    const member = createSimulatedMember('mem-fd', 3500)
    const result = simulatePointsAdjustment(member, 500)
    assert.equal(result.updated.points, 4000)
    assert.equal(result.updated.level, MemberLevel.Gold) // Still Gold
  })

  test('前台应能识别刚达到升级资格的会员', () => {
    const nearUpgrade = createSimulatedMember('mem-near', 9500)
    assert.equal(nearUpgrade.level, MemberLevel.Gold)

    const result = simulatePointsAdjustment(nearUpgrade, 500)
    assert.equal(result.updated.points, 10000)
    assert.equal(result.updated.level, MemberLevel.Platinum)
    assert.equal(result.action, 'upgrade')
  })
})

describe('Member - Simulator (👥HR)', () => {
  test('HR 应能标记黑名单会员无法登录', () => {
    const member = createSimulatedMember('mem-hr', 5000)
    const blacklisted = simulateStatusChange(member, MemberStatus.Blacklisted)
    assert.equal(blacklisted.status, MemberStatus.Blacklisted)

    const loginResult = simulateMemberLogin(blacklisted)
    assert.equal(loginResult.success, false)
  })

  test('HR 应能看到黑名单会员的积分和等级数据', () => {
    const blacklisted = simulateStatusChange(
      createSimulatedMember('mem-hr-data', 8000),
      MemberStatus.Blacklisted
    )
    assert.equal(blacklisted.level, MemberLevel.Gold)
    assert.equal(blacklisted.points, 8000)
    assert.ok(blacklisted.registeredAt)
  })
})

describe('Member - Simulator (🔧安监)', () => {
  test('安监应能冻结风险会员', () => {
    const member = createSimulatedMember('mem-sec', 12000)
    const frozen = simulateStatusChange(member, MemberStatus.Frozen)
    assert.equal(frozen.status, MemberStatus.Frozen)
    assert.equal(frozen.points, 12000) // 积分保留
    assert.equal(frozen.level, MemberLevel.Platinum) // 等级保留
  })

  test('安监冻结的会员无法登录', () => {
    const frozen = simulateStatusChange(
      createSimulatedMember('mem-sec-login', 3000),
      MemberStatus.Frozen
    )
    const result = simulateMemberLogin(frozen)
    assert.equal(result.success, false)
  })
})

describe('Member - Simulator (🎮导玩员)', () => {
  test('导玩员应能识别接近升级门槛的会员', () => {
    // 4900 points is below Gold (2000) but below Platinum (10000)
    // Actually 4900 > 2000 = Gold. Let me pick below Gold:
    const nearGoldMember = createSimulatedMember('mem-near-gold',
      MEMBER_LEVEL_THRESHOLDS[MemberLevel.Gold] - 1)
    assert.equal(nearGoldMember.level, MemberLevel.Silver)
    assert.ok(nearGoldMember.points < MEMBER_LEVEL_THRESHOLDS[MemberLevel.Gold])
  })

  test('导玩员激励消费后会员应升级到 Gold', () => {
    const nearGoldMember = createSimulatedMember('mem-upgrade-gold',
      MEMBER_LEVEL_THRESHOLDS[MemberLevel.Gold] - 1)
    assert.equal(nearGoldMember.level, MemberLevel.Silver)

    const result = simulatePointsAdjustment(nearGoldMember, 1)
    assert.equal(result.updated.level, MemberLevel.Gold)
    assert.equal(result.action, 'upgrade')
  })
})

describe('Member - Simulator (🎯运行专员)', () => {
  test('运行专员应能跟踪新会员从 Bronze 到 Silver 的成长路径', () => {
    let newMember = createSimulatedMember('mem-newbie', 100)
    assert.equal(newMember.level, MemberLevel.Bronze)

    // Simulate multiple visits accumulating points until Silver (500)
    while (newMember.points < MEMBER_LEVEL_THRESHOLDS[MemberLevel.Silver]) {
      const result = simulatePointsAdjustment(newMember, 100)
      newMember = result.updated
    }
    assert.equal(newMember.level, MemberLevel.Silver)
    assert.ok(newMember.points >= MEMBER_LEVEL_THRESHOLDS[MemberLevel.Silver])
  })

  test('运行专员应能识别到期会员进行续费提醒', () => {
    const member = createSimulatedMember('mem-renewal', 3000)
    const expired = simulateStatusChange(member, MemberStatus.Expired)
    assert.equal(expired.status, MemberStatus.Expired)
    assert.equal(expired.memberId, member.memberId)
    assert.ok(expired.points >= 0)
    assert.ok(expired.registeredAt)
  })
})

describe('Member - Simulator (🤝团建)', () => {
  test('团建应能筛选 VIP 会员 (Platinum+) 参与高端活动', () => {
    const members = [
      createSimulatedMember('mem-tb-001', 6000),    // Gold
      createSimulatedMember('mem-tb-002', 200),     // Bronze
      createSimulatedMember('mem-tb-003', 60000)    // Diamond
    ]
    const vipForTeambuilding = members.filter(
      m => m.level === MemberLevel.Platinum || m.level === MemberLevel.Diamond
    )
    assert.ok(vipForTeambuilding.length >= 1,
      `Expected >=1 VIP, got ${vipForTeambuilding.length}`)
    for (const vip of vipForTeambuilding) {
      assert.ok(vip.points >= MEMBER_LEVEL_THRESHOLDS[MemberLevel.Platinum])
    }
  })

  test('团建应排除黑名单和冻结会员', () => {
    const members = [
      createSimulatedMember('mem-safe-1', 500),
      simulateStatusChange(createSimulatedMember('mem-bl-1', 2000), MemberStatus.Blacklisted),
      simulateStatusChange(createSimulatedMember('mem-frozen-1', 3000), MemberStatus.Frozen),
      createSimulatedMember('mem-safe-2', 15000)
    ]
    const safeMembers = members.filter(
      m => m.status !== MemberStatus.Blacklisted && m.status !== MemberStatus.Frozen
    )
    assert.equal(safeMembers.length, 2)
  })
})

describe('Member - Simulator (📢营销)', () => {
  test('营销应能按等级分层推送不同内容', () => {
    const members = [
      createSimulatedMember('mem-mkt-001', 500),    // Silver
      createSimulatedMember('mem-mkt-002', 3000),   // Gold
      createSimulatedMember('mem-mkt-003', 12000),  // Platinum
      createSimulatedMember('mem-mkt-004', 60000)   // Diamond
    ]

    const segments: Partial<Record<MemberLevel, SimulatedMember[]>> = {}
    for (const m of members) {
      (segments[m.level] ??= []).push(m)
    }

    const nonEmptyLevels = Object.values(MemberLevel).filter(
      l => (segments[l]?.length ?? 0) > 0
    )
    assert.ok(nonEmptyLevels.length >= 2,
      `Expected >=2 distinct levels, got ${nonEmptyLevels.length}`)
  })

  test('营销应能向白金会员 (Platinum) 推送专属活动', () => {
    const members = [
      createSimulatedMember('mem-mkt-p1', 12000),
      createSimulatedMember('mem-mkt-p2', 15000),
      createSimulatedMember('mem-mkt-g1', 3000)
    ]
    const platinumMembers = members.filter(m => m.level === MemberLevel.Platinum)
    assert.ok(platinumMembers.length >= 2,
      `Expected >=2 Platinum members, got ${platinumMembers.length}`)
    for (const pm of platinumMembers) {
      assert.equal(pm.level, MemberLevel.Platinum)
    }
  })

  test('营销应能对 Bronze 新会员推送首单优惠', () => {
    const members = [
      createSimulatedMember('mem-new-1', 0),
      createSimulatedMember('mem-new-2', 100),
      createSimulatedMember('mem-new-3', 499) // last point below Silver
    ]
    const bronzeMembers = members.filter(m => m.level === MemberLevel.Bronze)
    assert.ok(bronzeMembers.length >= 2,
      `Expected >=2 Bronze members, got ${bronzeMembers.length}`)
  })
})

// ─── 全量等级覆盖 ───

describe('Member - Simulator (all-level coverage)', () => {
  const allLevelTests: Array<{ level: MemberLevel; minPoints: number }> = [
    { level: MemberLevel.Bronze, minPoints: MEMBER_LEVEL_THRESHOLDS[MemberLevel.Bronze] },
    { level: MemberLevel.Silver, minPoints: MEMBER_LEVEL_THRESHOLDS[MemberLevel.Silver] },
    { level: MemberLevel.Gold, minPoints: MEMBER_LEVEL_THRESHOLDS[MemberLevel.Gold] },
    { level: MemberLevel.Platinum, minPoints: MEMBER_LEVEL_THRESHOLDS[MemberLevel.Platinum] },
    { level: MemberLevel.Diamond, minPoints: MEMBER_LEVEL_THRESHOLDS[MemberLevel.Diamond] }
  ]

  for (const { level, minPoints } of allLevelTests) {
    test(`member with ${minPoints} points should be ${level}`, () => {
      const computed = computeMemberLevel(minPoints)
      assert.equal(computed, level)
    })
  }

  test('should produce correct level for 1 million points (Diamond)', () => {
    assert.equal(computeMemberLevel(1_000_000), MemberLevel.Diamond)
  })

  test('should produce Bronze for undefined/null-like edge (0 points)', () => {
    assert.equal(computeMemberLevel(0), MemberLevel.Bronze)
  })
})

// ─── 批量操作 ───

describe('Member - Simulator (bulk operations)', () => {
  test('batch status change should work for 100 members', () => {
    const members = Array.from({ length: 100 }, (_, i) =>
      createSimulatedMember(`bulk-${i}`, Math.floor(Math.random() * 60000))
    )

    const frozen = members.map(m => simulateStatusChange(m, MemberStatus.Frozen))
    assert.equal(frozen.length, 100)
    for (const fm of frozen) {
      assert.equal(fm.status, MemberStatus.Frozen)
    }
  })

  test('batch points adjustment should handle 500 members without error', () => {
    const members = Array.from({ length: 500 }, (_, i) =>
      createSimulatedMember(`bulk-adj-${i}`, 1000)
    )

    const results = members.map(m => simulatePointsAdjustment(m, 500))
    assert.equal(results.length, 500)
    for (const r of results) {
      assert.equal(r.updated.points, 1500)
      assert.ok(
        r.action === 'upgrade' || r.action === 'downgrade' || r.action === 'unchanged'
      )
    }
  })

  test('should correctly categorize a mixed batch by level', () => {
    // Deterministic quotas to avoid flaky random sampling (BRONZE range 0-499
    // is only ~0.7% of the 0-70000 spread; 200 random samples may yield 0 BRONZE).
    // Quotas: 40 × BRONZE(0..499) + 40 × SILVER(500..1999) + 40 × GOLD(2000..9999)
    //        + 40 × PLATINUM(10000..49999) + 40 × DIAMOND(50000+)
    const quotas: [number, number][] = [
      [0, 499],          // BRONZE: 40 members
      [500, 1999],       // SILVER: 40 members
      [2000, 9999],      // GOLD: 40 members
      [10000, 49999],    // PLATINUM: 40 members
      [50000, 70000],    // DIAMOND: 40 members
    ]
    const members: ReturnType<typeof createSimulatedMember>[] = []
    for (const [min, max] of quotas) {
      for (let i = 0; i < 40; i++) {
        members.push(
          createSimulatedMember(
            `cat-${Math.random().toString(36).slice(2)}`,
            Math.floor(Math.random() * (max - min + 1)) + min
          )
        )
      }
    }

    const byLevel: Partial<Record<MemberLevel, number>> = {}
    for (const m of members) {
      byLevel[m.level] = (byLevel[m.level] ?? 0) + 1
    }

    const total = Object.values(byLevel).reduce((a, b) => a + b, 0)
    assert.equal(total, 200)

    for (const lv of Object.values(MemberLevel)) {
      assert.ok(typeof byLevel[lv] === 'number', `Should have count for ${lv}`)
    }
  })
})
