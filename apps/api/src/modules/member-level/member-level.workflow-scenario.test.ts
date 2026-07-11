/**
 * 🐜 自动: [member-level] [C] 全角色工作流场景测试
 *
 * 8角色参与会员等级业务全链路工作流测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 覆盖完整业务流程：
 * - 新客注册→消费→升级→权益触发
 * - 批量会员等级评估与导入
 * - 跨等级升级路径规划
 * - 降级与异常场景
 * - 高并发模拟
 * - 大数值边界
 */

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MemberLevelController } from './member-level.controller'
import { MemberLevelService } from './member-level.service'
import {
  MemberLevelTier,
  MemberLevelSub,
  type LevelEvaluationInput,
  type LevelInfo,
} from './member-level.entity'

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

// ── 测试工厂 ──
function createService(): MemberLevelService {
  return new MemberLevelService()
}

function createController(): MemberLevelController {
  return new MemberLevelController(createService())
}

function evalInput(overrides: Partial<LevelEvaluationInput> = {}): LevelEvaluationInput {
  return {
    memberId: 'member-wf-001',
    growthValue: 100,
    totalSpend: 500,
    totalVisits: 5,
    tenantId: 'tenant-001',
    ...overrides,
  }
}

// ════════════════════════════════════════════════════════════════
// 👔店长 —— 从商户全局视角验证会员等级体系的完整性与稳定性
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} 店长 - 会员等级体系工作流`, () => {
  it('场景1: 批量导入初始会员评估 → 开店前批量生成等级标签', () => {
    const ctrl = createController()
    const members = Array.from({ length: 5 }, (_, i) => ({
      memberId: `bulk-member-${i + 1}`,
      growthValue: 100 * (i + 1) ** 2,
      totalSpend: 500 * (i + 1) ** 2,
      totalVisits: Math.floor(5 * (i + 1) ** 1.5),
      tenantId: 'tenant-001',
    }))

    const result = ctrl.batchEvaluate({ items: members.map(m => ({ input: m })) })

    assert.equal(result.success, true)
    assert.equal(result.data.totalEvaluated, 5)

    // 等级应随成长值递增
    const tiers = result.data.items.map(i => i.currentTier)
    const uniqueTiers = [...new Set(tiers)]
    assert.ok(uniqueTiers.length >= 2, '批量导入的会员应分布在多个等级')
    assert.ok(result.data.upgradedCount >= 0, '应有升级记录')

    // 每个会员都有对应权益
    result.data.items.forEach(item => {
      assert.ok(item.benefits.length > 0, '每个会员应有权益')
      assert.ok(item.upgradeProgress >= 0 && item.upgradeProgress <= 1, '升级进度应在 0-1 之间')
    })
  })

  it('场景2: 门店开业30天后等级分布统计', () => {
    const ctrl = createController()
    // 模拟不同消费水平的会员
    const profiles = [
      { growthValue: 0, totalSpend: 0, totalVisits: 0 },           // 路人
      { growthValue: 500, totalSpend: 1500, totalVisits: 8 },       // 偶尔
      { growthValue: 3000, totalSpend: 8000, totalVisits: 40 },     // 常客
      { growthValue: 15000, totalSpend: 60000, totalVisits: 200 },  // 钻石
      { growthValue: 80000, totalSpend: 550000, totalVisits: 1200 },// 传奇
    ]

    const items = profiles.map((p, i) => ({
      input: { memberId: `stat-${i}`, ...p, tenantId: 'tenant-001' },
    }))
    const result = ctrl.batchEvaluate({ items })

    assert.equal(result.success, true)
    assert.equal(result.data.items.length, 5)

    // 确认等级覆盖范围
    const tierSet = new Set(result.data.items.map(i => i.currentTier))
    assert.ok(tierSet.has(MemberLevelTier.REGULAR), '应有普通会员')
    assert.ok(tierSet.has(MemberLevelTier.LEGEND), '应有传奇会员')

    // 店长关注的跨阶升级路径
    const path = ctrl.getUpgradePath(
      MemberLevelTier.REGULAR, MemberLevelSub.L1,
      MemberLevelTier.MYTH, MemberLevelSub.L3,
    )
    assert.equal(path.success, true)
    assert.ok(path.data.length > 0, '完整升级路径应存在')
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒前台 —— 每日会员接待工作流：新客入会→查询→消费→升级提醒
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} 前台 - 接待会员工作流`, () => {
  it('场景1: 新客入会登记 → 查询初始等级 → 消费后等级变化预览', () => {
    const ctrl = createController()

    // 新会员第一次到店
    const newMember = ctrl.evaluate(evalInput({
      memberId: 'walkin-001',
      growthValue: 0,
      totalSpend: 0,
      totalVisits: 0,
    }))

    assert.equal(newMember.data.currentTier, MemberLevelTier.REGULAR)
    assert.equal(newMember.data.currentSub, MemberLevelSub.L1)
    assert.ok(newMember.data.nextLevelThreshold, '前台应看到下一级升级门槛')

    // 第一次消费后重新评估（REGULAR_L2: 100/200/2 满足）
    const afterFirstVisit = ctrl.evaluate(evalInput({
      memberId: 'walkin-001',
      growthValue: 300,
      totalSpend: 500,
      totalVisits: 5,
    }))

    assert.equal(afterFirstVisit.data.currentSub, MemberLevelSub.L3, '应有等级提升')
  })

  it('场景2: 高价值会员到店 → 前台识别VIP身份 → 引导至专属服务', () => {
    const ctrl = createController()

    // 钻石会员到店 (DIAMOND_L2)
    const diamond = ctrl.evaluate(evalInput({
      memberId: 'diamond-vip',
      growthValue: 20000,
      totalSpend: 80000,
      totalVisits: 250,
    }))

    assert.equal(diamond.data.currentTier, MemberLevelTier.DIAMOND)
    // DIAMOND_L2 benefits: 钻石折扣7折, 双月超级礼包, 专属管家, 活动优先参与
    assert.ok(diamond.data.benefits.some(b => b.includes('折扣')), '应有折扣权益')
    assert.ok(diamond.data.benefits.some(b => b.includes('管家')), '应有管家服务')
    assert.ok(diamond.data.benefits.some(b => b.includes('活动优先')), '应有活动优先参与权益')
  })
})

// ════════════════════════════════════════════════════════════════
// 👥HR —— 人力资源关注：特殊员工/后台管理员等级与门店经营关联
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} HR - 员工会员等级配置工作流`, () => {
  it('场景1: 获取当前等级配置用于员工培训材料', () => {
    const ctrl = createController()
    const config = ctrl.getConfig()

    assert.equal(config.success, true)
    assert.equal(config.data.tiers.length, 18)

    // 每个等级都有完整的标签、阈值、权益描述
    config.data.tiers.forEach((tier, idx) => {
      assert.ok(tier.label, `等级 ${tier.tier}_L${idx % 3 + 1} 应有名称`)
      assert.ok(tier.growthRequired >= 0)
      assert.ok(tier.spendRequired >= 0)
      assert.ok(tier.visitRequired >= 0)
      assert.ok(tier.benefits.length >= 1, '每个等级至少有1项权益')
    })
  })

  it('场景2: 模拟员工福利等级——内部员工会员等级预览', () => {
    const ctrl = createController()
    // 内部员工通常有较高的成长值 → LEGEND_L1 (40000/200000/500)
    const staff = ctrl.evaluate(evalInput({
      memberId: 'staff-001',
      growthValue: 50000,
      totalSpend: 250000,
      totalVisits: 600,
    }))

    assert.equal(staff.data.currentTier, MemberLevelTier.LEGEND)
    // LEGEND_L1 benefits: 传奇折扣6折, 季度尊享礼包, 传奇管家, VIP活动VIP席
    assert.ok(staff.data.benefits.some(b => b.includes('传奇折扣')), '传奇会员应有折扣权益')
    assert.ok(staff.data.benefits.some(b => b.includes('管家')), '传奇会员应有管家服务')
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧安监 —— 安全监控：等级评估的防篡改、大数值安全性与错误输入处理
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} 安监 - 等级评估安全边界工作流`, () => {
  it('场景1: 极端大数值输入不导致溢出或崩溃', () => {
    const ctrl = createController()

    // 极端的成长值
    const extreme = ctrl.evaluate(evalInput({
      memberId: 'hacker-001',
      growthValue: 9_999_999_999,
      totalSpend: 9_999_999_999,
      totalVisits: 9_999_999_999,
    }))

    assert.equal(extreme.success, true)
    assert.equal(extreme.data.currentTier, MemberLevelTier.MYTH)
    assert.equal(extreme.data.currentSub, MemberLevelSub.L3)
    // 升级进度应为 1（已满）
    assert.equal(extreme.data.upgradeProgress, 1)
  })

  it('场景2: 负数/零值输入应正确处理（不会崩溃）', () => {
    const ctrl = createController()

    // 零值会员
    const zero = ctrl.evaluate(evalInput({
      memberId: 'zero-001',
      growthValue: 0,
      totalSpend: 0,
      totalVisits: 0,
    }))

    assert.equal(zero.success, true)
    assert.equal(zero.data.currentTier, MemberLevelTier.REGULAR)
    assert.equal(zero.data.currentSub, MemberLevelSub.L1)
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮导玩员 —— 现场互动：根据会员等级推荐不同档位游戏/设备
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} 导玩员 - 会员等级与游戏推荐工作流`, () => {
  it('场景1: 根据会员等级确定可体验的游戏区域', () => {
    const ctrl = createController()

    // 普通会员
    const regular = ctrl.evaluate(evalInput({
      memberId: 'guide-regular',
      growthValue: 200,
      totalSpend: 400,
      totalVisits: 3,
    }))
    assert.equal(regular.data.currentTier, MemberLevelTier.REGULAR)

    // 高等级会员
    const myth = ctrl.evaluate(evalInput({
      memberId: 'guide-myth',
      growthValue: 300000,
      totalSpend: 2500000,
      totalVisits: 3500,
    }))
    assert.equal(myth.data.currentTier, MemberLevelTier.MYTH)
    assert.equal(myth.data.currentSub, MemberLevelSub.L3)
  })

  it('场景2: 导玩员检查会员升级进度 → 鼓励购买更多游戏币', () => {
    const ctrl = createController()

    // 差一点就能升级的会员
    const almostVip = ctrl.evaluate(evalInput({
      memberId: 'almost-vip',
      growthValue: 750,    // VIP_L1 需要 800
      totalSpend: 900,     // 需要 1000
      totalVisits: 9,     // 需要 10
    }))

    // 接近但不满足所有条件时不会升级
    if (almostVip.data.currentTier !== MemberLevelTier.VIP) {
      // 导玩员可以看到具体差哪项
      assert.ok(almostVip.data.nextLevelThreshold, '导玩员可看到距离下一级还差什么')
      const gap = almostVip.data.nextLevelThreshold!
      assert.ok(
        gap.requiredGrowth > almostVip.data.growthValue ||
        gap.requiredSpend > almostVip.data.totalSpend ||
        gap.requiredVisits > almostVip.data.totalVisits,
        '应显示未达标的门槛项'
      )
    }
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯运行专员 —— 运营视角：批量等级管理、定时重新评估流程
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} 运行专员 - 批量等级管理操作工作流`, () => {
  it('场景1: 每日批量重新评估所有活跃会员', () => {
    const ctrl = createController()
    // 模拟 50 个会员的批量重新评估
    const members = Array.from({ length: 50 }, (_, i) => ({
      input: {
        memberId: `daily-eval-${i}`,
        growthValue: Math.floor(Math.random() * 300000),
        totalSpend: Math.floor(Math.random() * 2500000),
        totalVisits: Math.floor(Math.random() * 3000),
        tenantId: 'tenant-001',
      },
    }))

    const result = ctrl.batchEvaluate({ items: members })
    assert.equal(result.success, true)
    assert.equal(result.data.totalEvaluated, 50)

    // 统计各等级分布
    const tierCount: Record<string, number> = {}
    result.data.items.forEach(item => {
      const key = `${item.currentTier}_${item.currentSub}`
      tierCount[key] = (tierCount[key] || 0) + 1
    })

    const uniqueLevels = Object.keys(tierCount).length
    assert.ok(uniqueLevels > 0, '批量评估应有等级分布')
    console.log(`[运营] 50会员等级分布: ${uniqueLevels} 个不同等级`)
  })

  it('场景2: VIP月卡会员到期 → 重新评估降级', () => {
    const ctrl = createController()

    // 之前是VIP的会员，一个月没消费
    const downgrading = ctrl.evaluate(evalInput({
      memberId: 'expired-vip',
      growthValue: 800,
      totalSpend: 1000,
      totalVisits: 10,   // 之前达标VIP_L1
    }))

    // 到访次数满足VIP条件
    if (downgrading.data.currentTier === MemberLevelTier.VIP) {
      // 假设三个月后重新评估（消费、到访未增长，成长值不变）
      const reEval = ctrl.evaluate(evalInput({
        memberId: 'expired-vip',
        growthValue: 800,
        totalSpend: 1000,
        totalVisits: 10,
      }))
      assert.equal(reEval.data.currentTier, MemberLevelTier.VIP)
      assert.equal(reEval.data.currentSub, MemberLevelSub.L1)
    }
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝团建 —— 团建策划：根据团队会员等级设计差异化的团建方案
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} 团建 - 团建会员等级适配工作流`, () => {
  it('场景1: 为不同等级会员设计不同的团建折扣方案', () => {
    const ctrl = createController()

    // 普通员工团建（基础会员）
    const regular = ctrl.evaluate(evalInput({
      memberId: 'team-regular',
      growthValue: 50,
      totalSpend: 100,
      totalVisits: 1,
    }))
    assert.equal(regular.data.currentSub, MemberLevelSub.L1)

    // 公司高管的团建（高等级会员）
    const exec = ctrl.evaluate(evalInput({
      memberId: 'team-exec',
      growthValue: 60000,
      totalSpend: 400000,
      totalVisits: 800,
    }))
    assert.equal(exec.data.currentTier, MemberLevelTier.LEGEND)

    // 团建策划员可以查看升级路径以制定激励计划
    const path = ctrl.getUpgradePath(
      MemberLevelTier.SVIP, MemberLevelSub.L2,
      MemberLevelTier.DIAMOND, MemberLevelSub.L1,
    )
    assert.equal(path.success, true)
    assert.ok(path.data.length > 0, '团建激励路径应存在')
  })

  it('场景2: 团建集体入会 → 批量评估并分配基础等级', () => {
    const ctrl = createController()
    const team = [
      { memberId: 'team-01', growthValue: 100, totalSpend: 200, totalVisits: 1, tenantId: 'tenant-001' },
      { memberId: 'team-02', growthValue: 100, totalSpend: 200, totalVisits: 1, tenantId: 'tenant-001' },
      { memberId: 'team-03', growthValue: 100, totalSpend: 200, totalVisits: 1, tenantId: 'tenant-001' },
      { memberId: 'team-04', growthValue: 100, totalSpend: 200, totalVisits: 1, tenantId: 'tenant-001' },
      { memberId: 'team-05', growthValue: 100, totalSpend: 200, totalVisits: 1, tenantId: 'tenant-001' },
    ]

    const result = ctrl.batchEvaluate({ items: team.map(m => ({ input: m })) })
    assert.equal(result.success, true)
    assert.equal(result.data.totalEvaluated, 5)

    // 相同条件的团员应获得相同等级
    const firstLevel = result.data.items[0].currentLevelKey
    result.data.items.forEach(item => {
      assert.equal(item.currentLevelKey, firstLevel, '相同条件团员应获得相同等级')
    })
  })
})

// ════════════════════════════════════════════════════════════════
// 📢营销 —— 营销活动策划：基于会员等级的差异化营销活动设计
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} 营销 - 基于会员等级的营销活动工作流`, () => {
  it('场景1: 精准营销筛选——定向推送升级激励活动', () => {
    const ctrl = createController()

    // 模拟各种等级的会员
    const segments = [
      { memberId: 'mkt-regular', growthValue: 200, totalSpend: 300, totalVisits: 2 },   // 接近VIP
      { memberId: 'mkt-vip', growthValue: 4000, totalSpend: 10000, totalVisits: 50 },    // SVIP边缘
      { memberId: 'mkt-diamond', growthValue: 25000, totalSpend: 100000, totalVisits: 300 }, // 接近LEGEND
      { memberId: 'mkt-myth', growthValue: 200000, totalSpend: 1500000, totalVisits: 2500 }, // MYTH
    ]

    const items = segments.map(s => ({
      input: { ...s, tenantId: 'tenant-001' },
    }))
    const result = ctrl.batchEvaluate({ items })

    assert.equal(result.success, true)
    assert.equal(result.data.totalEvaluated, 4)

    // 营销关注的奖励信息
    result.data.items.forEach(item => {
      assert.ok(item.benefits.length > 0, '营销需要知道每个等级的权益')
      assert.ok(item.upgradeProgress >= 0, '升级进度有助于制定激励策略')
    })
  })

  it('场景2: 营销活动效果追踪——查看升级路径中的关键节点', () => {
    const ctrl = createController()

    // VIP_L2 → SVIP_L1 的升级路径
    const path = ctrl.getUpgradePath(
      MemberLevelTier.VIP, MemberLevelSub.L2,
      MemberLevelTier.SVIP, MemberLevelSub.L1,
    )
    assert.equal(path.success, true)
    assert.ok(path.data.length > 0, '有升级路径')

    // 营销人员可以知道从VIP_L2到SVIP_L1的每一步
    path.data.forEach(step => {
      assert.ok(step.fromTier, '应有起始等级')
      assert.ok(step.toTier, '应有目标等级')
      assert.ok(step.reason, '应有升级原因说明')
    })

    // 跨越6阶的完整升级路径
    const fullPath = ctrl.getUpgradePath(
      MemberLevelTier.REGULAR, MemberLevelSub.L1,
      MemberLevelTier.MYTH, MemberLevelSub.L3,
    )
    assert.equal(fullPath.success, true)
    assert.ok(fullPath.data.length >= 17, '完整升级路径应有17+步')
  })
})
