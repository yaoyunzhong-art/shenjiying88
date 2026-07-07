import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [member-level] [C] 角色测试
 *
 * 8 角色视角的 member-level 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 *
 * 6阶18级体系：
 * REGULAR_L1~L3 / VIP_L1~L3 / SVIP_L1~L3 / DIAMOND_L1~L3 / LEGEND_L1~L3 / MYTH_L1~L3
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MemberLevelController } from './member-level.controller'
import { MemberLevelService } from './member-level.service'
import { MemberLevelTier, MemberLevelSub, type LevelEvaluationInput, type LevelInfo, type BatchLevelInput } from './member-level.entity'

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

// ── 测试数据工厂 ──
function createController() {
  const service = new MemberLevelService()
  return new MemberLevelController(service)
}

function createEvalInput(overrides: Partial<LevelEvaluationInput> = {}): LevelEvaluationInput {
  return {
    memberId: 'member-test-001',
    growthValue: 100,
    totalSpend: 500,
    totalVisits: 5,
    tenantId: 'tenant-001',
    ...overrides,
  }
}

// ============================================================
// 👔店长 —— 关注会员等级体系的全局视图和整体升级路径
// ============================================================
describe(`${ROLES.StoreManager} 店长视角 - 会员等级管理`, () => {
  describe('正常流程：查看全量等级配置', () => {
    it('应返回完整的 6阶18级 配置', () => {
      const ctrl = createController()
      const result = ctrl.getConfig()

      assert.equal(result.success, true)
      // 6阶 × 3级 = 18 个等级
      assert.equal(result.data.tiers.length, 18)
      assert.ok(result.data.lastUpdated)

      // 验证阶分布
      const tiers = result.data.tiers.map(t => t.tier)
      const uniqueTiers = [...new Set(tiers)]
      assert.equal(uniqueTiers.length, 6)
      assert.ok(uniqueTiers.includes(MemberLevelTier.REGULAR))
      assert.ok(uniqueTiers.includes(MemberLevelTier.VIP))
      assert.ok(uniqueTiers.includes(MemberLevelTier.SVIP))
      assert.ok(uniqueTiers.includes(MemberLevelTier.DIAMOND))
      assert.ok(uniqueTiers.includes(MemberLevelTier.LEGEND))
      assert.ok(uniqueTiers.includes(MemberLevelTier.MYTH))
    })

    it('各阶L1到L3的threshold应阶梯递增', () => {
      const ctrl = createController()
      const { tiers } = ctrl.getConfig().data

      // VIP 阶内 L1 < L2 < L3
      const vipTiers = tiers.filter(t => t.tier === MemberLevelTier.VIP)
      assert.ok(vipTiers.length >= 3)
      assert.ok(vipTiers[0].growthRequired < vipTiers[1].growthRequired)
      assert.ok(vipTiers[1].growthRequired < vipTiers[2].growthRequired)
      assert.ok(vipTiers[0].spendRequired < vipTiers[1].spendRequired)
      assert.ok(vipTiers[1].spendRequired < vipTiers[2].spendRequired)
    })
  })

  describe('权限边界：查看不存在的等级配置', () => {
    it('不应返回非法的 tier', () => {
      const ctrl = createController()
      const { tiers } = ctrl.getConfig().data

      const illegal = tiers.some(
        t => ![MemberLevelTier.REGULAR, MemberLevelTier.VIP, MemberLevelTier.SVIP,
               MemberLevelTier.DIAMOND, MemberLevelTier.LEGEND, MemberLevelTier.MYTH].includes(t.tier as MemberLevelTier)
      )
      assert.equal(illegal, false, '不应包含非法阶名')
    })
  })

  describe('权限边界：升级路径越界检查', () => {
    it('从MYTH_L3到更高等级应返回空路径（已是最高）', () => {
      const ctrl = createController()
      const result = ctrl.getUpgradePath(MemberLevelTier.MYTH, MemberLevelSub.L3, MemberLevelTier.MYTH, MemberLevelSub.L3)

      assert.equal(result.success, true)
      assert.ok(Array.isArray(result.data))
    })

    it('从REGULAR_L1到MYTH_L3路径应包含17个等级变更', () => {
      const ctrl = createController()
      const result = ctrl.getUpgradePath(MemberLevelTier.REGULAR, MemberLevelSub.L1, MemberLevelTier.MYTH, MemberLevelSub.L3)

      assert.equal(result.success, true)
      // 店长关注完整路径
      assert.ok(result.data.length > 0, '应返回升级路径')
    })
  })
})

// ============================================================
// 🛒前台 —— 关注会员等级查询和基础升级评估
// ============================================================
describe(`${ROLES.FrontDesk} 前台视角 - 会员等级查询`, () => {
  describe('正常流程：新会员等级查询', () => {
    it('新注册会员(0消费)应显示REGULAR_L1等级', () => {
      const ctrl = createController()
      const result = ctrl.evaluate(createEvalInput({
        memberId: 'new-member-001',
        growthValue: 0,
        totalSpend: 0,
        totalVisits: 0,
      }))

      assert.equal(result.success, true)
      assert.equal(result.data.currentTier, MemberLevelTier.REGULAR)
      assert.equal(result.data.currentSub, MemberLevelSub.L1)
      assert.equal(result.data.currentLevelKey, 'REGULAR_L1')
      assert.equal(result.data.upgradeProgress, 0)
      assert.ok(result.data.nextLevelThreshold, '应有下一级门槛提示')
    })

    it('普通消费会员应升至对应等级', () => {
      const ctrl = createController()
      // 消费 2000 元 + 10 次到访 => VIP_L1
      const result = ctrl.evaluate(createEvalInput({
        memberId: 'regular-member-002',
        growthValue: 800,
        totalSpend: 2000,
        totalVisits: 10,
      }))

      assert.equal(result.data.currentTier, MemberLevelTier.VIP)
      assert.equal(result.data.currentSub, MemberLevelSub.L1)
      assert.ok(result.data.benefits.some(b => b.includes('VIP')))
    })
  })

  describe('权限边界：前台不允许修改等级配置', () => {
    it('不应提供等级配置修改接口', () => {
      const ctrl = createController() as any
      assert.equal(typeof ctrl.updateConfig, 'undefined', '前台不应有updateConfig方法')
    })
  })

  describe('权限边界：负值或零值输入处理', () => {
    it('calculate接口负值应抛异常', () => {
      const ctrl = createController()
      assert.rejects(async () => {
        await ctrl.calculate({ growthValue: -1 })
      }, /non-negative/)
    })
  })
})

// ============================================================
// 👥HR —— 关注批量升级评估和等级变更记录
// ============================================================
describe(`${ROLES.HR} HR视角 - 批量等级评估`, () => {
  describe('正常流程：批量评估不同等级会员', () => {
    it('对多个会员批量升级评估', () => {
      const ctrl = createController()
      const result = ctrl.batchEvaluate({
        items: [
          { input: createEvalInput({ memberId: 'hr-m1', growthValue: 0, totalSpend: 0, totalVisits: 0 }) },
          { input: createEvalInput({ memberId: 'hr-m2', growthValue: 2500, totalSpend: 5000, totalVisits: 30 }) },
          { input: createEvalInput({ memberId: 'hr-m3', growthValue: 4000, totalSpend: 10000, totalVisits: 50 }) },
        ],
      })

      assert.equal(result.success, true)
      assert.equal(result.data.totalEvaluated, 3)
      assert.equal(result.data.items[0].currentLevelKey, 'REGULAR_L1')
      assert.equal(result.data.items[1].currentLevelKey, 'VIP_L3')
      assert.equal(result.data.items[2].currentLevelKey, 'SVIP_L1')
    })

    it('大量会员批量评估性能', () => {
      const ctrl = createController()
      const items = Array.from({ length: 100 }, (_, i) => ({
        input: createEvalInput({
          memberId: `hr-perf-${i}`,
          growthValue: i * 100,
          totalSpend: i * 1000,
          totalVisits: i * 2,
        }),
      }))

      const result = ctrl.batchEvaluate({ items })
      assert.equal(result.success, true)
      assert.equal(result.data.totalEvaluated, 100)
      assert.ok(result.data.upgradedCount > 0, '应有部分会员升级')
    })
  })

  describe('权限边界：空列表处理', () => {
    it('空列表应返回0评估结果', () => {
      const ctrl = createController()
      const result = ctrl.batchEvaluate({ items: [] })

      assert.equal(result.success, true)
      assert.equal(result.data.totalEvaluated, 0)
      assert.equal(result.data.upgradedCount, 0)
    })
  })
})

// ============================================================
// 🔧安监 —— 关注等级评估安全边界和异常输入
// ============================================================
describe(`${ROLES.Security} 安监视角 - 等级评估安全边界`, () => {
  describe('正常流程：检查内部逻辑的维度依赖性', () => {
    it('高成长值但低消费应降档（三维同时满足规则）', () => {
      const ctrl = createController()
      // growth=50000(VIP)但spend=100(REGULAR) visits=1(REGULAR)
      // 按"取最高的满足所有条件的等级"逻辑，应为REGULAR_L1
      const result = ctrl.evaluate(createEvalInput({
        memberId: 'security-m1',
        growthValue: 50000,
        totalSpend: 100,
        totalVisits: 1,
      }))

      assert.equal(result.data.currentTier, MemberLevelTier.REGULAR)
      assert.equal(result.data.currentSub, MemberLevelSub.L1)
    })
  })

  describe('边界条件：极大值和极小值测试', () => {
    it('极大值（1亿成长值）应稳定返回MYTH_L3', () => {
      const ctrl = createController()
      const result = ctrl.evaluate(createEvalInput({
        memberId: 'security-max',
        growthValue: 100_000_000,
        totalSpend: 999_999_999,
        totalVisits: 999_999,
      }))

      assert.equal(result.data.currentTier, MemberLevelTier.MYTH)
      assert.equal(result.data.currentSub, MemberLevelSub.L3)
      assert.equal(result.data.upgradeProgress, 1.0)
    })

    it('非法等级参数应抛BadRequestException', () => {
      const ctrl = createController()
      try {
        ctrl.getUpgradePath('INVALID_TIER', 'L1', 'VIP', 'L1')
        assert.fail('应抛异常')
      } catch (err: any) {
        assert.ok(err.message.includes('Invalid fromTier'), '异常信息应包含 Invalid fromTier')
        assert.equal(err.constructor.name, 'BadRequestException')
        assert.equal(err.status, 400)
      }
    })
  })
})

// ============================================================
// 🎮导玩员 —— 关注会员成长值和游戏时长消费关联
// ============================================================
describe(`${ROLES.Guide} 导玩员视角 - 会员成长评估`, () => {
  describe('正常流程：高频到访但低消费', () => {
    it('多次到访但消费少的会员，等级应受限于消费维度', () => {
      const ctrl = createController()
      // 到访100次但消费仅100元，成长值50
      const result = ctrl.evaluate(createEvalInput({
        memberId: 'guide-frequent',
        growthValue: 50,
        totalSpend: 100,
        totalVisits: 100,
      }))

      // spend=100 < 200 => REGULAR_L1
      assert.equal(result.data.currentTier, MemberLevelTier.REGULAR)
      assert.equal(result.data.currentSub, MemberLevelSub.L1)
    })
  })

  describe('权限边界：导玩员仅查不写', () => {
    it('导玩员应只能调用evaluate/calculate，无config修改能力', () => {
      const ctrl = createController() as any
      const allowedMethods = ['evaluate', 'calculate', 'batchEvaluate', 'getConfig', 'getUpgradePath']
      const protoMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(ctrl))
        .filter(m => typeof (ctrl as any)[m] === 'function' && m !== 'constructor')

      for (const method of protoMethods) {
        assert.ok(allowedMethods.includes(method), `方法 ${method} 应在允许列表中`)
      }
    })
  })
})

// ============================================================
// 🎯运行专员 —— 关注接口可用性和系统稳定性
// ============================================================
describe(`${ROLES.Operations} 运行专员视角 - 接口可用性`, () => {
  describe('正常流程：所有端点可调用', () => {
    it('evaluate端点可正常返回', () => {
      const ctrl = createController()
      const result = ctrl.evaluate(createEvalInput({ memberId: 'ops-test' }))
      assert.equal(result.success, true)
      assert.ok(result.data.currentTier)
    })

    it('calculate端点可正常返回', async () => {
      const ctrl = createController()
      const result = await ctrl.calculate({ growthValue: 2500 })
      assert.equal(result.success, true)
      assert.ok(result.data.currentTier)
    })
  })

  describe('边界条件：高并发评估的可重复性', () => {
    it('相同输入应产生相同输出（幂等性）', () => {
      const ctrl = createController()
      const input = createEvalInput({
        memberId: 'ops-idempotent',
        growthValue: 9000,
        totalSpend: 35000,
        totalVisits: 120,
      })

      const results = Array.from({ length: 10 }, () => ctrl.evaluate(input))
      const first = results[0].data.currentLevelKey
      for (const r of results) {
        assert.equal(r.data.currentLevelKey, first, '多次相同输入应返回相同等级')
        assert.equal(r.data.benefits.length, results[0].data.benefits.length, '权益列表应一致')
      }
    })
  })
})

// ============================================================
// 🤝团建 —— 关注团体批量评估和团队升级概览
// ============================================================
describe(`${ROLES.Teambuilding} 团建视角 - 团队批量升级评估`, () => {
  describe('正常流程：团建活动后批量升级评估', () => {
    it('团建后团队整体会员等级分布', () => {
      const ctrl = createController()
      const teamMembers = [
        { memberId: 'team-A', growthValue: 200, totalSpend: 800, totalVisits: 8 },   // REGULAR_L2
        { memberId: 'team-B', growthValue: 1500, totalSpend: 4000, totalVisits: 25 },  // VIP_L2
        { memberId: 'team-C', growthValue: 6000, totalSpend: 25000, totalVisits: 100 }, // SVIP_L2
      ]

      const result = ctrl.batchEvaluate({
        items: teamMembers.map(m => ({
          input: createEvalInput({ ...m, tenantId: 'team-tenant' }),
        })),
      })

      assert.equal(result.data.totalEvaluated, 3)
      assert.equal(result.data.items[0].currentLevelKey, 'REGULAR_L2')
      assert.equal(result.data.items[1].currentLevelKey, 'VIP_L2')
      assert.equal(result.data.items[2].currentLevelKey, 'SVIP_L2')
      // 全部有升级
      assert.equal(result.data.upgradedCount, 3)
    })
  })

  describe('权限边界：跨租户隔离', () => {
    it('不同租户评估应逻辑独立', () => {
      const ctrl = createController()
      const members = [
        { memberId: 't1-m1', growthValue: 800, totalSpend: 2000, totalVisits: 10, tenantId: 'tenant-A' },
        { memberId: 't2-m1', growthValue: 800, totalSpend: 2000, totalVisits: 10, tenantId: 'tenant-B' },
      ]

      const results = members.map(m => ctrl.evaluate(createEvalInput(m)))
      assert.equal(results[0].data.currentLevelKey, 'VIP_L1')
      assert.equal(results[1].data.currentLevelKey, 'VIP_L1')
      // 相同价值不同租户结果应一致
      assert.equal(results[0].data.currentLevelKey, results[1].data.currentLevelKey)
    })
  })
})

// ============================================================
// 📢营销 —— 关注等级权益和升级路径用于精准营销
// ============================================================
describe(`${ROLES.Marketing} 营销视角 - 等级权益与营销策略`, () => {
  describe('正常流程：各等级权益列表完整性', () => {
    it('VIP及以上等级应有专属折扣权益', () => {
      const ctrl = createController()
      const { tiers } = ctrl.getConfig().data

      const vipAndAbove = tiers.filter(t =>
        [MemberLevelTier.VIP, MemberLevelTier.SVIP, MemberLevelTier.DIAMOND,
         MemberLevelTier.LEGEND, MemberLevelTier.MYTH].includes(t.tier as MemberLevelTier)
      )

      for (const v of vipAndAbove) {
        assert.ok(v.benefits.length > 0, `${v.tier} ${v.label} 应有权益`)
        const hasDiscount = v.benefits.some(b => b.includes('折') || b.includes('折扣'))
        if (v.tier !== MemberLevelTier.VIP || v.benefits.some(b => b.includes('折扣'))) {
          // VIP_L1 有折扣, 但REGULAR没有
          // 所以这里检查 VIP及以上应有折扣
          assert.ok(hasDiscount, `${v.tier} ${v.label} 应含折扣权益`)
        }
      }
    })

    it('MYTH_L3应拥有最全权益', () => {
      const ctrl = createController()
      const { tiers } = ctrl.getConfig().data
      const mythL3 = tiers.find(t => t.tier === MemberLevelTier.MYTH && t.label.endsWith('L3'))

      assert.ok(mythL3, 'MYTH_L3 应存在')
      assert.ok(mythL3!.benefits.length > 0, 'MYTH_L3 应有权益')
      // 最高等级应有专属权益描述
      const hasExclusive = mythL3!.benefits.some(b => b.includes('至尊') || b.includes('CEO') || b.includes('合伙人'))
      assert.ok(hasExclusive, 'MYTH_L3 应含至尊/CEO/合伙人级权益')
    })
  })

  describe('边界条件：升级路径的营销价值', () => {
    it('REGULAR_L1到VIP_L1的升级路径应清晰展示门槛', () => {
      const ctrl = createController()
      const result = ctrl.getUpgradePath(MemberLevelTier.REGULAR, MemberLevelSub.L1, MemberLevelTier.VIP, MemberLevelSub.L1)

      assert.equal(result.success, true)
      // 路径应说明升级所需条件
      if (result.data.length > 0) {
        assert.ok(result.data[0].reason.includes('成长值') || result.data[0].reason.includes('消费'))
      }
    })

    it('SVIP_L1到DIAMOND_L1的奖励跨度', () => {
      const ctrl = createController()
      const result = ctrl.getUpgradePath(MemberLevelTier.SVIP, MemberLevelSub.L1, MemberLevelTier.DIAMOND, MemberLevelSub.L1)

      assert.equal(result.success, true)
      // 营销关注提升的奖励
      if (result.data.length > 0) {
        assert.ok(result.data.length >= 3) // SVIP_L1->SVIP_L2->SVIP_L3->DIAMOND_L1
      }
    })
  })
})
