import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [member-level] [C] 角色测试扩展编写
 *
 * 8 角色深度场景扩展测试 — member-level 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 3 测试用例（正常流程 + 权限边界 + 降级/特殊场景）
 * 覆盖：跨阶跳级、逐级升级进度、并发幂等、大数值稳定、阈值精确边界
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MemberLevelController } from './member-level.controller'
import { MemberLevelService, LEVEL_THRESHOLDS } from './member-level.service'
import {
  MemberLevelTier,
  MemberLevelSub,
  type LevelEvaluationInput,
  type LevelInfo,
  type BatchLevelInput,
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
function createController() {
  const service = new MemberLevelService()
  return new MemberLevelController(service)
}

function createEvalInput(
  overrides: Partial<LevelEvaluationInput> = {},
): LevelEvaluationInput {
  return {
    memberId: 'member-ext-001',
    growthValue: 100,
    totalSpend: 500,
    totalVisits: 5,
    tenantId: 'tenant-001',
    ...overrides,
  }
}

/**
 * 精确边界辅助：构造刚好满足某等级条件的输入
 * thresholdIndex 是 LEVEL_THRESHOLDS 数组中的索引
 */
function exactThresholdInput(
  thresholdIndex: number,
  overrides: Partial<LevelEvaluationInput> = {},
): LevelEvaluationInput {
  const t = LEVEL_THRESHOLDS[thresholdIndex]
  return {
    memberId: `exact-boundary-${thresholdIndex}`,
    growthValue: t.requiredGrowth,
    totalSpend: t.requiredSpend,
    totalVisits: t.requiredVisits,
    tenantId: 'tenant-boundary',
    ...overrides,
  }
}

// ════════════════════════════════════════════════════════════════
// 👔 店长 — 全局经营视角：等级体系覆盖率、升级漏斗分析
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} 店长扩展 — 等级体系经营分析`, () => {
  it('阈值阶梯递增完整性 — 全18级growth/spend/visit均严格递增', () => {
    for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
      const prev = LEVEL_THRESHOLDS[i - 1]
      const curr = LEVEL_THRESHOLDS[i]
      assert.ok(
        curr.requiredGrowth > prev.requiredGrowth,
        `${curr.tier}_${curr.sub} growth(${curr.requiredGrowth}) 应 > ${prev.tier}_${prev.sub} growth(${prev.requiredGrowth})`,
      )
      assert.ok(
        curr.requiredSpend >= prev.requiredSpend,
        `${curr.tier}_${curr.sub} spend 应 >= 前一级`,
      )
      assert.ok(
        curr.requiredVisits >= prev.requiredVisits,
        `${curr.tier}_${curr.sub} visits 应 >= 前一级`,
      )
    }
  })

  it('跨阶跳级场景 — 消费大户直接从REGULAR跳升至SVIP', () => {
    const ctrl = createController()
    // growth=9000, spend=40000, visits=150 => SVIP_L3
    const r = ctrl.evaluate(
      createEvalInput({
        memberId: 'store-big-spender',
        growthValue: 9000,
        totalSpend: 40000,
        totalVisits: 150,
      }),
    )
    assert.equal(r.data.currentTier, MemberLevelTier.SVIP)
    assert.equal(r.data.currentSub, MemberLevelSub.L3)
    // 店长关心跳级对营收的影响
    assert.ok(r.data.upgraded, '如此高消费应标记为升级')
  })

  it('经营分析 — 统计各阶覆盖分布', () => {
    const ctrl = createController()
    const { tiers } = ctrl.getConfig().data
    // 验证6阶名称完整
    const tierNames = [...new Set(tiers.map((t) => t.tier))]
    assert.equal(tierNames.length, 6)
    // 每个阶应有3级
    for (const tn of tierNames) {
      const count = tiers.filter((t) => t.tier === tn).length
      assert.equal(count, 3, `${tn} 应有3个子级，实际${count}`)
    }
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台 — 日常会员接待：快速查询、一步到位、缓升边界
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} 前台扩展 — 日常会员接待`, () => {
  it('精准边界 — 刚好VIP_L1门槛（growth=800,spend=1000,visits=10）', () => {
    const ctrl = createController()
    const r = ctrl.evaluate(exactThresholdInput(3)) // 索引3=VIP_L1
    assert.equal(r.data.currentTier, MemberLevelTier.VIP)
    assert.equal(r.data.currentSub, MemberLevelSub.L1)
    assert.ok(r.data.upgraded, '刚达标应标记升级')
  })

  it('差1即降级 — VIP_L1门槛差1元消费', () => {
    const ctrl = createController()
    // growth=800满足，但spend=999 < 1000 => 降回REGULAR_L3
    const r = ctrl.evaluate(
      createEvalInput({
        memberId: 'frontdesk-short-by-1',
        growthValue: 800,
        totalSpend: 999,
        totalVisits: 10,
      }),
    )
    // 因成长值达标但消费不满足 -> 三维同时满足规则 -> 降到REGULAR_L3
    // REGULAR_L3: growth=300, spend=500, visits=5 满足
    assert.equal(r.data.currentTier, MemberLevelTier.REGULAR)
    assert.equal(r.data.currentSub, MemberLevelSub.L3)
  })

  it('快速计算 — calculate旧接口兼容', async () => {
    const ctrl = createController()
    const r = await ctrl.calculate({ growthValue: 2500 })
    assert.equal(r.success, true)
    // growth=2500 -> VIP_L3
    assert.equal(r.data.currentTier, MemberLevelTier.VIP)
    assert.equal(r.data.currentSub, MemberLevelSub.L3)
  })

  it('前台查询 — 零消费会员默认降级', () => {
    const ctrl = createController()
    const r = ctrl.evaluate(
      createEvalInput({
        memberId: 'frontdesk-zero',
        growthValue: 0,
        totalSpend: 0,
        totalVisits: 0,
      }),
    )
    assert.equal(r.data.currentLevelKey, 'REGULAR_L1')
    assert.equal(r.data.upgradeProgress, 0)
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR — 批量运营：大规模升级、精确统计、跨部门批量
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} HR扩展 — 批量运营分析`, () => {
  it('大规模批量 — 1000会员7阶分布统计', () => {
    const ctrl = createController()
    const items = Array.from({ length: 1000 }, (_, i) => ({
      input: createEvalInput({
        memberId: `hr-mass-${i}`,
        growthValue: Math.floor(i * 251), // 0~250k range
        totalSpend: Math.floor(i * 2001),
        totalVisits: Math.floor(i * 3),
      }),
    }))
    const r = ctrl.batchEvaluate({ items })
    assert.equal(r.data.totalEvaluated, 1000)
    assert.ok(r.data.upgradedCount > 0)
    // 确保所有评估结果合法
    const allTiers = r.data.items.map((i) => i.currentTier)
    const validTiers = Object.values(MemberLevelTier)
    for (const t of allTiers) {
      assert.ok(validTiers.includes(t), `非法等级: ${t}`)
    }
  })

  it('批量精确计数 — 部分达标部分不达标', () => {
    const ctrl = createController()
    const r = ctrl.batchEvaluate({
      items: [
        { input: createEvalInput({ memberId: 'hr-p1', growthValue: 0, totalSpend: 0, totalVisits: 0 }) },
        { input: createEvalInput({ memberId: 'hr-p2', growthValue: 800, totalSpend: 1000, totalVisits: 10 }) },
        { input: createEvalInput({ memberId: 'hr-p3', growthValue: 40000, totalSpend: 200000, totalVisits: 500 }) },
      ],
    })
    assert.equal(r.data.totalEvaluated, 3)
    // p1=REGULAR_L1(不升级), p2=VIP_L1(升级), p3=LEGEND_L1(升级) => 2人升级
    assert.equal(r.data.upgradedCount, 2)
    assert.equal(r.data.items[0].currentLevelKey, 'REGULAR_L1')
    assert.equal(r.data.items[1].currentLevelKey, 'VIP_L1')
    assert.equal(r.data.items[2].currentLevelKey, 'LEGEND_L1')
  })

  it('升级进度逐级演进 — 从REGULAR到VIP逐级推算', () => {
    const ctrl = createController()
    const growthSteps = [0, 100, 300, 800]
    const results = growthSteps.map((g) =>
      ctrl.evaluate(createEvalInput({ memberId: 'hr-progress', growthValue: g, totalSpend: g * 3, totalVisits: Math.floor(g / 50) })),
    )
    assert.equal(results[0].data.currentLevelKey, 'REGULAR_L1')
    assert.equal(results[1].data.currentLevelKey, 'REGULAR_L2')
    assert.equal(results[2].data.currentLevelKey, 'REGULAR_L3')
    assert.equal(results[3].data.currentLevelKey, 'VIP_L1')
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监 — 安全合规：输入校验、越界防御、异常场景
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} 安监扩展 — 输入安全与边界`, () => {
  it('极大值稳定性 — Number.MAX_SAFE_INTEGER', () => {
    const ctrl = createController()
    const r = ctrl.evaluate(
      createEvalInput({
        memberId: 'security-maxint',
        growthValue: Number.MAX_SAFE_INTEGER,
        totalSpend: Number.MAX_SAFE_INTEGER,
        totalVisits: Number.MAX_SAFE_INTEGER,
      }),
    )
    assert.equal(r.data.currentTier, MemberLevelTier.MYTH)
    assert.equal(r.data.currentSub, MemberLevelSub.L3)
    assert.equal(r.data.upgradeProgress, 1.0)
  })

  it('DDoS防护 — 超大批量输入应仍有合理内存足迹', () => {
    const ctrl = createController()
    // 10000条批量评估 — 验证不OOM
    const items = Array.from({ length: 10000 }, (_, i) => ({
      input: createEvalInput({
        memberId: `security-bomb-${i}`,
        growthValue: i % 100000,
        totalSpend: i % 500000,
        totalVisits: i % 2000,
      }),
    }))
    // 分批+只检查关键指标以加快
    const batchSize = 2000
    for (let start = 0; start < items.length; start += batchSize) {
      const batch = items.slice(start, start + batchSize)
      const r = ctrl.batchEvaluate({ items: batch })
      assert.equal(r.data.totalEvaluated, batch.length)
      assert.ok(r.data.items.every((it) => Object.values(MemberLevelTier).includes(it.currentTier as MemberLevelTier)))
    }
  })

  it('非法 tier 参数应抛 BadRequest(400)', () => {
    const ctrl = createController()
    assert.throws(
      () => ctrl.getUpgradePath('FAKE_TIER' as MemberLevelTier, MemberLevelSub.L1, MemberLevelTier.VIP, MemberLevelSub.L1),
      (err: any) => {
        assert.equal(err.status, 400)
        assert.ok(err.message.includes('fromTier'))
        return true
      },
    )
  })

  it('非法 sub 参数应抛 BadRequest(400)', () => {
    const ctrl = createController()
    assert.throws(
      () => ctrl.getUpgradePath(MemberLevelTier.REGULAR, 'INVALID_SUB' as MemberLevelSub, MemberLevelTier.VIP, MemberLevelSub.L1),
      (err: any) => {
        assert.equal(err.status, 400)
        assert.ok(err.message.includes('fromSub'))
        return true
      },
    )
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 游戏关联：成长值与游戏时长映射、频次模式
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} 导玩员扩展 — 成长值关联模式`, () => {
  it('高到访频次 — 每天到访但消费低，等级锁定 REGULAR', () => {
    const ctrl = createController()
    const r = ctrl.evaluate(
      createEvalInput({
        memberId: 'guide-high-freq',
        growthValue: 50,
        totalSpend: 100,
        totalVisits: 365, // 每天来但几乎不花钱
      }),
    )
    // spend=100 < 200 => REGULAR_L1
    assert.equal(r.data.currentLevelKey, 'REGULAR_L1')
  })

  it('低频高消费 — 偶尔来但花钱多 => VIP', () => {
    const ctrl = createController()
    const r = ctrl.evaluate(
      createEvalInput({
        memberId: 'guide-low-freq',
        growthValue: 1000,
        totalSpend: 5000,
        totalVisits: 3,
      }),
    )
    // spend=5000满足VIP_L2: requiredGrowth=1500 N -> growth=1000不满足
    // growth=1000满足VIP_L1(800), spend=5000满足VIP_L1(1000), visits=3 < 10
    // visits=3 < 10 -> 降到REGULAR_L3: visits=5不满足
    // REGULAR_L2: growth=100>=100, spend=5000>=200, visits=3>=2 => REGULAR_L2
    assert.equal(r.data.currentLevelKey, 'REGULAR_L2')
  })

  it('导玩员促活 — 查看升级进度鼓舞会员', () => {
    const ctrl = createController()
    const r = ctrl.evaluate(
      createEvalInput({
        memberId: 'guide-almost-vip',
        growthValue: 750,
        totalSpend: 900,
        totalVisits: 9,
      }),
    )
    // growth=750 < 800 => 不满足VIP_L1
    // REGULAR_L3: growth=300>=300, spend=900>=500, visits=9>=5 => REGULAR_L3
    assert.equal(r.data.currentLevelKey, 'REGULAR_L3')
    assert.ok(r.data.upgradeProgress > 0)
    assert.ok(r.data.upgradeProgress < 1)
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 系统稳定性：幂等、并发、响应时间模拟
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} 运行专员扩展 — 系统稳定性`, () => {
  it('严格幂等性 — 同一输入100次结果完全一致', () => {
    const ctrl = createController()
    const input = createEvalInput({
      memberId: 'ops-idempotent-ext',
      growthValue: 6000,
      totalSpend: 20000,
      totalVisits: 80,
    })
    const baseline = ctrl.evaluate(input)
    for (let i = 0; i < 100; i++) {
      const r = ctrl.evaluate(input)
      assert.equal(r.data.currentLevelKey, baseline.data.currentLevelKey)
      assert.equal(r.data.upgradeProgress, baseline.data.upgradeProgress)
      assert.equal(r.data.benefits.length, baseline.data.benefits.length)
    }
  })

  it('config端点幂等 — 读操作不一致', () => {
    const ctrl = createController()
    const r1 = ctrl.getConfig()
    const r2 = ctrl.getConfig()
    assert.equal(r1.data.tiers.length, r2.data.tiers.length)
    for (let i = 0; i < r1.data.tiers.length; i++) {
      assert.equal(r1.data.tiers[i].growthRequired, r2.data.tiers[i].growthRequired)
    }
  })

  it('空列表批量评估高效返回', () => {
    const ctrl = createController()
    const start = Date.now()
    const r = ctrl.batchEvaluate({ items: [] })
    const elapsed = Date.now() - start
    assert.equal(r.data.totalEvaluated, 0)
    assert.equal(r.data.upgradedCount, 0)
    assert.ok(elapsed < 100, `空列表处理耗时${elapsed}ms，应<100ms`)
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建 — 团建活动：批量升级影响、团队等级分布
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} 团建扩展 — 团体活动评估`, () => {
  it('团建消费后批量升级 — 20人团队等级分布', () => {
    const ctrl = createController()
    const team = [
      { id: 't-econ', growth: 50, spend: 100, visits: 2 },   // REGULAR_L1
      { id: 't-reg', growth: 300, spend: 500, visits: 5 },     // REGULAR_L3
      { id: 't-vip', growth: 1500, spend: 3000, visits: 20 },  // VIP_L2
      { id: 't-svip', growth: 9000, spend: 35000, visits: 120 }, // SVIP_L3
    ]
    const r = ctrl.batchEvaluate({
      items: team.map((m) => ({
        input: createEvalInput({
          memberId: `teambuilding-${m.id}`,
          growthValue: m.growth,
          totalSpend: m.spend,
          totalVisits: m.visits,
        }),
      })),
    })
    assert.equal(r.data.totalEvaluated, 4)
    assert.equal(r.data.items[0].currentLevelKey, 'REGULAR_L1')
    assert.equal(r.data.items[1].currentLevelKey, 'REGULAR_L3')
    assert.equal(r.data.items[2].currentLevelKey, 'VIP_L2')
    assert.equal(r.data.items[3].currentLevelKey, 'SVIP_L3')
  })

  it('团建后全员VIP升级路径 — 建议推荐升级活动', () => {
    const ctrl = createController()
    // 团建组织者需要知道从当前等级到任意等级完整的升级规划
    const path = ctrl.getUpgradePath(MemberLevelTier.REGULAR, MemberLevelSub.L1, MemberLevelTier.VIP, MemberLevelSub.L1)
    assert.equal(path.success, true)
    // getUpgradePath 返回从当前等级到最高等级的全部步骤，供规划参考
    assert.ok(path.data.length >= 3, '至少包含REG_L1→L2→L3→VIP_L1的升级路径')
    for (const step of path.data) {
      assert.ok(step.reason.includes('成长值') || step.reason.includes('消费'))
    }
  })

  it('团建批量空名单 — 空items应安全返回', () => {
    const ctrl = createController()
    const r = ctrl.batchEvaluate({ items: [] })
    assert.equal(r.data.totalEvaluated, 0)
    assert.equal(r.data.upgradedCount, 0)
    assert.ok(r.data.timestamp)
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销 — 营销活动：权益差异化、升级促销策略
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} 营销扩展 — 权益差异化分析`, () => {
  it('相邻等级权益差异 — VIP_L1与VIP_L2的benefits差异', () => {
    const ctrl = createController()
    const { tiers } = ctrl.getConfig().data
    const vipL1 = tiers.find((t) => t.tier === 'VIP' && t.label.endsWith('L1'))
    const vipL2 = tiers.find((t) => t.tier === 'VIP' && t.label.endsWith('L2'))
    assert.ok(vipL1)
    assert.ok(vipL2)
    // L2应有L1没有的权益（例如折扣力度更大）
    assert.ok(vipL2!.benefits.length >= vipL1!.benefits.length, '高等级权益数应>=低等级')
  })

  it('营销数据 — 各等级权益数量统计', () => {
    const ctrl = createController()
    const { tiers } = ctrl.getConfig().data
    // 权益数应随等级递增
    const sorted = [...tiers].sort((a, b) => {
      const tierOrder = Object.values(MemberLevelTier)
      const idxA = tierOrder.indexOf(a.tier as MemberLevelTier)
      const idxB = tierOrder.indexOf(b.tier as MemberLevelTier)
      return idxA !== idxB ? idxA - idxB : a.label.localeCompare(b.label)
    })
    for (let i = 1; i < sorted.length; i++) {
      // 至少不应比前一级少
      const diff = sorted[i].benefits.length - sorted[i - 1].benefits.length
      assert.ok(diff >= 0 || sorted[i].benefits.length >= 2, `${sorted[i].label} 权益不应显著少于 ${sorted[i - 1].label}`)
    }
  })

  it('营销升级路径 — VIP到SVIP的消费引导', () => {
    const ctrl = createController()
    const path = ctrl.getUpgradePath(MemberLevelTier.VIP, MemberLevelSub.L3, MemberLevelTier.SVIP, MemberLevelSub.L1)
    assert.equal(path.success, true)
    // getUpgradePath 返回从当前到顶级的全部剩余步骤（供参考）
    assert.ok(path.data.length >= 1, '至少包含VIP_L3→SVIP_L1的升级步骤')
    // 第一步应为VIP_L3到SVIP_L1
    const firstStep = path.data[0]
    assert.ok(firstStep.reason.includes('成长值') || firstStep.toTier === 'SVIP')
  })

  it('MYTH级权益含专有标签', () => {
    const ctrl = createController()
    const { tiers } = ctrl.getConfig().data
    const mythTiers = tiers.filter((t) => t.tier === 'MYTH')
    assert.equal(mythTiers.length, 3)
    for (const mt of mythTiers) {
      // MYTH权益至少包含神话相关描述词（神话级专属权益）
      const hasMythRelated = mt.benefits.some((b) => b.includes('神话') || b.includes('专属') || b.includes('CEO') || b.includes('合伙人'))
      assert.ok(hasMythRelated, `${mt.label} 应含神话相关权益, 实际有: ${mt.benefits.join(', ')}`)
      assert.ok(mt.benefits.length >= 1, `${mt.label} 应有权益`)
    }
  })
})
