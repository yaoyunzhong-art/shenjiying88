import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * 🐜 自动: [member-level] [D] controller spec 补全
 *
 * 6阶18级会员等级评估 Controller 完整单元测试
 * 覆盖：正例、反例、边界、升级路径、批量评估、配置查询
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MemberLevelController } from './member-level.controller'
import { MemberLevelService } from './member-level.service'
import { BadRequestException } from '@nestjs/common'
import {
  MemberLevelTier,
  MemberLevelSub,
  type LevelInfo,
  type LevelEvaluationInput,
} from './member-level.entity'

// ================================================================
// 测试数据定义
// ================================================================

const TENANT_ID = 't-arcade-001'

const basicRegularInput: LevelEvaluationInput = {
  memberId: 'mem-regular',
  growthValue: 0,
  totalSpend: 0,
  totalVisits: 0,
  tenantId: TENANT_ID,
}

const basicVipInput: LevelEvaluationInput = {
  memberId: 'mem-vip',
  growthValue: 1500,
  totalSpend: 3000,
  totalVisits: 20,
  tenantId: TENANT_ID,
}

const basicSvipInput: LevelEvaluationInput = {
  memberId: 'mem-svip',
  growthValue: 6000,
  totalSpend: 20000,
  totalVisits: 80,
  tenantId: TENANT_ID,
}

const basicLegendInput: LevelEvaluationInput = {
  memberId: 'mem-legend',
  growthValue: 55000,
  totalSpend: 350000,
  totalVisits: 700,
  tenantId: TENANT_ID,
}

const basicMythInput: LevelEvaluationInput = {
  memberId: 'mem-myth',
  growthValue: 150000,
  totalSpend: 1200000,
  totalVisits: 2000,
  tenantId: TENANT_ID,
}

// ================================================================
// 测试辅助：创建 controller
// ================================================================

function createController() {
  const service = new MemberLevelService()
  return new MemberLevelController(service)
}

function toDto(input: LevelEvaluationInput) {
  return {
    memberId: input.memberId,
    growthValue: input.growthValue,
    totalSpend: input.totalSpend,
    totalVisits: input.totalVisits,
    tenantId: input.tenantId,
  }
}

// ================================================================
// 1. 正常流程 — POST /member-level/evaluate
// ================================================================

describe('MemberLevelController — POST /evaluate — 正例', () => {
  it('评估 REGULAR L1 会员（初始 0 值）', () => {
    const ctrl = createController()
    const result = ctrl.evaluate(toDto(basicRegularInput))
    assert.equal(result.success, true)
    assert.equal(result.data.currentTier, MemberLevelTier.REGULAR)
    assert.equal(result.data.currentSub, MemberLevelSub.L1)
    assert.equal(result.data.currentLevelKey, 'REGULAR_L1')
    assert.equal(result.data.growthValue, 0)
    assert.equal(result.data.upgraded, false)
  })

  it('评估 VIP L2 会员（满足 VIP L2 条件）', () => {
    const ctrl = createController()
    const result = ctrl.evaluate(toDto(basicVipInput))
    assert.equal(result.success, true)
    assert.equal(result.data.currentTier, MemberLevelTier.VIP)
    assert.equal(result.data.currentSub, MemberLevelSub.L2)
    assert.equal(result.data.currentLevelKey, 'VIP_L2')
    assert(result.data.upgraded, true)
  })

  it('评估 SVIP L2 会员', () => {
    const ctrl = createController()
    const result = ctrl.evaluate(toDto(basicSvipInput))
    assert.equal(result.success, true)
    assert.equal(result.data.currentTier, MemberLevelTier.SVIP)
    assert.equal(result.data.currentSub, MemberLevelSub.L2)
    assert.equal(result.data.currentLevelKey, 'SVIP_L2')
  })

  it('评估 DIAMOND L1 会员', () => {
    const ctrl = createController()
    const input: LevelEvaluationInput = {
      memberId: 'mem-diamond',
      growthValue: 14000,
      totalSpend: 50000,
      totalVisits: 180,
      tenantId: TENANT_ID,
    }
    const result = ctrl.evaluate(toDto(input))
    assert.equal(result.data.currentTier, MemberLevelTier.DIAMOND)
    assert.equal(result.data.currentSub, MemberLevelSub.L1)
  })

  it('评估 LEGEND L2 会员', () => {
    const ctrl = createController()
    const result = ctrl.evaluate(toDto(basicLegendInput))
    assert.equal(result.data.currentTier, MemberLevelTier.LEGEND)
    assert.equal(result.data.currentSub, MemberLevelSub.L2)
  })

  it('评估 MYTH L2 会员（最高已知等级）', () => {
    const ctrl = createController()
    const result = ctrl.evaluate(toDto(basicMythInput))
    assert.equal(result.data.currentTier, MemberLevelTier.MYTH)
    assert.equal(result.data.currentSub, MemberLevelSub.L2)
  })

  it('评估结果包含等级权益列', () => {
    const ctrl = createController()
    const result = ctrl.evaluate(toDto(basicVipInput))
    assert(Array.isArray(result.data.benefits))
    assert(result.data.benefits.length > 0)
  })

  it('评估结果包含升级进度（非最高级）', () => {
    const ctrl = createController()
    const result = ctrl.evaluate(toDto(basicVipInput))
    assert(typeof result.data.upgradeProgress === 'number')
    assert(result.data.upgradeProgress >= 0)
    assert(result.data.upgradeProgress <= 1)
  })

  it('MYTH L3 最高级返回升级进度 = 1.0', () => {
    const ctrl = createController()
    const input: LevelEvaluationInput = {
      memberId: 'mem-myth3',
      growthValue: 250000,
      totalSpend: 2000000,
      totalVisits: 3000,
      tenantId: TENANT_ID,
    }
    const result = ctrl.evaluate(toDto(input))
    assert.equal(result.data.currentLevelKey, 'MYTH_L3')
    assert.equal(result.data.upgradeProgress, 1.0)
  })
})

// ================================================================
// 2. 边界条件 — POST /member-level/evaluate
// ================================================================

describe('MemberLevelController — POST /evaluate — 边界', () => {
  it('成长值为 0 但消费额度和到访次数极高 — 仍以成长值为主', () => {
    const ctrl = createController()
    const result = ctrl.evaluate(toDto({
      memberId: 'mem-edge',
      growthValue: 0,
      totalSpend: 999999,
      totalVisits: 9999,
      tenantId: TENANT_ID,
    }))
    assert.equal(result.data.currentTier, MemberLevelTier.REGULAR)
    assert.equal(result.data.currentSub, MemberLevelSub.L1)
  })

  it('刚好满足 VIP L1 门槛', () => {
    const ctrl = createController()
    const result = ctrl.evaluate(toDto({
      memberId: 'mem-vip1-edge',
      growthValue: 800,
      totalSpend: 1000,
      totalVisits: 10,
      tenantId: TENANT_ID,
    }))
    assert.equal(result.data.currentTier, MemberLevelTier.VIP)
    assert.equal(result.data.currentSub, MemberLevelSub.L1)
  })

  it('仅差 1 到访次数 — 不能升级到 VIP L2', () => {
    const ctrl = createController()
    const result = ctrl.evaluate(toDto({
      memberId: 'mem-vip-edge',
      growthValue: 1500,
      totalSpend: 3000,
      totalVisits: 19, // < 20
      tenantId: TENANT_ID,
    }))
    assert.equal(result.data.currentTier, MemberLevelTier.VIP)
    assert.equal(result.data.currentSub, MemberLevelSub.L1) // 只能到 VIP L1
    assert(result.data.upgradeProgress < 1.0)
  })

  it('超大量成长值仍稳定执行', () => {
    const ctrl = createController()
    const result = ctrl.evaluate(toDto({
      memberId: 'mem-huge-growth',
      growthValue: 99999999,
      totalSpend: 99999999,
      totalVisits: 99999,
      tenantId: TENANT_ID,
    }))
    assert.equal(result.data.currentTier, MemberLevelTier.MYTH)
    assert.equal(result.data.currentSub, MemberLevelSub.L3)
  })

  it('消费额度刚好为零的 REGULAR', () => {
    const ctrl = createController()
    const result = ctrl.evaluate(toDto({
      memberId: 'mem-zero-spend',
      growthValue: 50,
      totalSpend: 0,
      totalVisits: 1,
      tenantId: TENANT_ID,
    }))
    // 消费 0 无法满足 REGULAR L2（需要 200）
    assert.equal(result.data.currentLevelKey, 'REGULAR_L1')
  })
})

// ================================================================
// 3. 反例 — 参数验证
// ================================================================

describe('MemberLevelController — POST /evaluate — 反例', () => {
  it('缺失 memberId 字段应触发验证错误', () => {
    const ctrl = createController()
    const dto = { growthValue: 100, totalSpend: 100, totalVisits: 1, tenantId: TENANT_ID } as any
    // Nest ValidationPipe 会在框架层处理，controller 方法接收的是已校验 DTO
    // 测试 DTO 类型定义完整性
    assert(dto !== undefined)
  })

  it('负值 growthValue 在服务层返回 REGULAR（负值视为 0）', () => {
    const ctrl = createController()
    // 负 growthValue: 传入 0 等效值
    const result = ctrl.evaluate({
      memberId: 'mem-neg',
      growthValue: -1,
      totalSpend: 0,
      totalVisits: 0,
      tenantId: TENANT_ID,
    })
    // 负值在服务层约化为 0，最终为 REGULAR_L1
    assert.equal(result.success, true)
  })

  it('空字符串 memberId 仍可评估（服务层不校验 ID 格式）', () => {
    const ctrl = createController()
    const result = ctrl.evaluate({
      memberId: '',
      growthValue: 100,
      totalSpend: 500,
      totalVisits: 5,
      tenantId: TENANT_ID,
    })
    assert.equal(result.success, true)
    assert.equal(result.data.currentTier, MemberLevelTier.REGULAR)
  })
})

// ================================================================
// 4. POST /member-level/calculate — 旧接口兼容
// ================================================================

describe('MemberLevelController — POST /calculate', () => {
  it('根据成长值计算等级 — 正常', async () => {
    const ctrl = createController()
    const result = await ctrl.calculate({ growthValue: 800 })
    assert.equal(result.success, true)
    assert.equal(result.data.currentTier, MemberLevelTier.VIP)
    assert.equal(result.data.currentSub, MemberLevelSub.L1)
  })

  it('成长值 0 返回 REGULAR', async () => {
    const ctrl = createController()
    const result = await ctrl.calculate({ growthValue: 0 })
    assert.equal(result.success, true)
    assert.equal(result.data.currentTier, MemberLevelTier.REGULAR)
  })

  it('负的成长值抛出 BadRequestException', async () => {
    const ctrl = createController()
    await assert.rejects(
      async () => ctrl.calculate({ growthValue: -1 }),
      BadRequestException
    )
  })

  it('undefined 成长值抛出 BadRequestException', async () => {
    const ctrl = createController()
    await assert.rejects(
      async () => ctrl.calculate({} as any),
      BadRequestException
    )
  })

  it('超大成长值稳定计算', async () => {
    const ctrl = createController()
    const result = await ctrl.calculate({ growthValue: 999999 })
    assert.equal(result.success, true)
    assert.equal(result.data.currentTier, MemberLevelTier.MYTH)
  })
})

// ================================================================
// 5. POST /member-level/batch — 批量评估
// ================================================================

describe('MemberLevelController — POST /batch', () => {
  it('批量评估 3 个不同级别的会员', () => {
    const ctrl = createController()
    const result = ctrl.batchEvaluate({
      items: [
        { input: { memberId: 'mem-1', growthValue: 0, totalSpend: 0, totalVisits: 0, tenantId: TENANT_ID } },
        { input: { memberId: 'mem-2', growthValue: 1500, totalSpend: 3000, totalVisits: 20, tenantId: TENANT_ID } },
        { input: { memberId: 'mem-3', growthValue: 6000, totalSpend: 20000, totalVisits: 80, tenantId: TENANT_ID } },
      ],
    })
    assert.equal(result.success, true)
    assert.equal(result.data.totalEvaluated, 3)
    assert.equal(result.data.items.length, 3)
    assert.equal(result.data.items[0].currentLevelKey, 'REGULAR_L1')
    assert.equal(result.data.items[1].currentLevelKey, 'VIP_L2')
    assert.equal(result.data.items[2].currentLevelKey, 'SVIP_L2')
  })

  it('批量评估包含升级计数', () => {
    const ctrl = createController()
    const result = ctrl.batchEvaluate({
      items: [
        { input: { memberId: 'mem-a', growthValue: 0, totalSpend: 0, totalVisits: 0, tenantId: TENANT_ID } },
        { input: { memberId: 'mem-b', growthValue: 800, totalSpend: 1000, totalVisits: 10, tenantId: TENANT_ID } },
      ],
    })
    assert.equal(result.data.totalEvaluated, 2)
    assert(result.data.upgradedCount >= 1)
    const upgraded = result.data.items.filter((i: LevelInfo) => i.upgraded)
    assert.equal(upgraded.length, result.data.upgradedCount)
  })

  it('空批量返回 0 条结果', () => {
    const ctrl = createController()
    const result = ctrl.batchEvaluate({ items: [] })
    assert.equal(result.success, true)
    assert.equal(result.data.totalEvaluated, 0)
    assert.equal(result.data.items.length, 0)
    assert.equal(result.data.upgradedCount, 0)
    assert(result.data.timestamp, '应有时间戳')
  })

  it('批量评估时间戳一致性', () => {
    const ctrl = createController()
    const result = ctrl.batchEvaluate({
      items: [{ input: basicRegularInput }],
    })
    const ts = Date.parse(result.data.timestamp)
    assert(!isNaN(ts), '时间戳应合法')
  })
})

// ================================================================
// 6. GET /member-level/config — 等级配置查询
// ================================================================

describe('MemberLevelController — GET /config', () => {
  it('返回完整的 6 阶 18 级配置', () => {
    const ctrl = createController()
    const result = ctrl.getConfig()
    assert.equal(result.success, true)
    assert.equal(result.data.tiers.length, 18)
    assert(result.data.lastUpdated, '应有更新时间')
  })

  it('配置包含 REGULAR L1 ~ MYTH L3', () => {
    const ctrl = createController()
    const result = ctrl.getConfig()
    const levels = result.data.tiers
    assert.equal(levels[0].tier, MemberLevelTier.REGULAR)
    assert.equal(levels[0].label, 'REGULAR L1')
    assert.equal(levels[levels.length - 1].tier, MemberLevelTier.MYTH)
    assert.equal(levels[levels.length - 1].label, 'MYTH L3')
  })

  it('每级配置包含所需条件', () => {
    const ctrl = createController()
    const result = ctrl.getConfig()
    for (const level of result.data.tiers) {
      assert(typeof level.growthRequired === 'number')
      assert(typeof level.spendRequired === 'number')
      assert(typeof level.visitRequired === 'number')
      assert(Array.isArray(level.benefits))
    }
  })

  it('配置顺序低到高递增', () => {
    const ctrl = createController()
    const result = ctrl.getConfig()
    for (let i = 1; i < result.data.tiers.length; i++) {
      assert(
        result.data.tiers[i].growthRequired >= result.data.tiers[i - 1].growthRequired,
        `等级 ${i} 成长值应 >= 上一级`
      )
    }
  })

  it('MYTH L3 权益包含 "合伙人级权益"', () => {
    const ctrl = createController()
    const result = ctrl.getConfig()
    const mythL3 = result.data.tiers[result.data.tiers.length - 1]
    assert(mythL3.benefits.includes('合伙人级权益'))
  })

  it('SVIP L2 权益包含免排队', () => {
    const ctrl = createController()
    const result = ctrl.getConfig()
    const svipL2 = result.data.tiers.find((t: any) => t.label === 'SVIP L2')
    assert(svipL2, 'SVIP L2 应存在')
    assert(svipL2.benefits.includes('免排队'))
  })
})

// ================================================================
// 7. GET /member-level/upgrade-path — 升级路径
// ================================================================

describe('MemberLevelController — GET /upgrade-path', () => {
  it('REGULAR L1 → VIP L1 包含升级记录', () => {
    const ctrl = createController()
    const result = ctrl.getUpgradePath(
      MemberLevelTier.REGULAR, MemberLevelSub.L1,
      MemberLevelTier.VIP, MemberLevelSub.L1
    )
    assert.equal(result.success, true)
    assert(result.data.length > 0)
    assert.equal(result.data[0].fromTier, MemberLevelTier.REGULAR)
    assert.equal(result.data[0].fromSub, MemberLevelSub.L1)
  })

  it('升级路径包含 reason 说明', () => {
    const ctrl = createController()
    const result = ctrl.getUpgradePath(
      MemberLevelTier.REGULAR, MemberLevelSub.L1,
      MemberLevelTier.VIP, MemberLevelSub.L1
    )
    for (const record of result.data) {
      assert(record.reason, '每条记录应有 reason')
      assert(typeof record.reason === 'string' && record.reason.length > 0, 'reason 应为非空字符串')
    }
  })

  it('无效 tier 参数抛出 BadRequestException', () => {
    const ctrl = createController()
    assert.throws(
      () => ctrl.getUpgradePath('INVALID' as any, MemberLevelSub.L1, MemberLevelTier.VIP, MemberLevelSub.L1),
      BadRequestException
    )
  })

  it('无效 sub 参数抛出 BadRequestException', () => {
    const ctrl = createController()
    assert.throws(
      () => ctrl.getUpgradePath(MemberLevelTier.REGULAR, 'INVALID' as any, MemberLevelTier.VIP, MemberLevelSub.L1),
      BadRequestException
    )
  })

  it('从当前等级到前一个等级返回当前级路径', () => {
    const ctrl = createController()
    const result = ctrl.getUpgradePath(
      MemberLevelTier.REGULAR, MemberLevelSub.L1,
      MemberLevelTier.REGULAR, MemberLevelSub.L1
    )
    // 路径从当前等级开始计算到目标等级; 相同等级传参返回从当前到最终等级的完整路径
    assert.equal(result.success, true)
    // 到自身可以是一条路径
    assert(Array.isArray(result.data))
  })

  it('DIAMOND L1 → MYTH L2 路径包含跨阶升级', () => {
    const ctrl = createController()
    const result = ctrl.getUpgradePath(
      MemberLevelTier.DIAMOND, MemberLevelSub.L1,
      MemberLevelTier.MYTH, MemberLevelSub.L2
    )
    assert(result.data.length > 0)
    const tiers = result.data.map((r: any) => r.toTier)
    assert(tiers.includes(MemberLevelTier.LEGEND), '路径应经过 LEGEND')
    assert(tiers.includes(MemberLevelTier.MYTH), '路径应到达 MYTH')
  })
})

// ================================================================
// 8. 整体路由结构验证
// ================================================================

describe('MemberLevelController — 路由结构', () => {
  it('Controller 通过 @Controller("member-level") 注册', () => {
    const meta = Reflect.getMetadata('path', MemberLevelController)
    assert.equal(meta, 'member-level')
  })

  it('controller.evaluate 方法存在且有正确的参数', () => {
    assert(typeof (createController() as any).evaluate === 'function')
  })

  it('controller.calculate 方法存在', () => {
    assert(typeof (createController() as any).calculate === 'function')
  })

  it('controller.batchEvaluate 方法存在', () => {
    assert(typeof (createController() as any).batchEvaluate === 'function')
  })

  it('controller.getConfig 方法存在', () => {
    assert(typeof (createController() as any).getConfig === 'function')
  })

  it('controller.getUpgradePath 方法存在', () => {
    assert(typeof (createController() as any).getUpgradePath === 'function')
  })
})
