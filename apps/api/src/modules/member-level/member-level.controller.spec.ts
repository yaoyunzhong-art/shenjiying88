import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * MemberLevelController 单元测试 (spec)
 *
 * 覆盖所有路由端点：evaluate / calculate / batch / config / upgrade-path
 * 正向流程 + 边界条件（无效参数、空输入、超额输入、缺失字段）
 */

import assert from 'node:assert/strict'
import { MemberLevelController } from './member-level.controller'
import { MemberLevelService } from './member-level.service'
import {
  MemberLevelTier,
  MemberLevelSub,
  type LevelInfo,
  type BatchLevelOutput,
  type AllLevelConfig,
} from './member-level.entity'
import { LevelEvaluationInputDto, BatchLevelInputDto } from './member-level.dto'

// ── Helpers ───────────────────────────────────────────────────

function makeLevelInfo(overrides: Partial<LevelInfo> = {}): LevelInfo {
  return {
    memberId: 'm-001',
    currentTier: MemberLevelTier.VIP,
    currentSub: MemberLevelSub.L1,
    currentLevelKey: 'VIP_L1',
    growthValue: 800,
    totalSpend: 2000,
    totalVisits: 12,
    upgradeProgress: 0.3,
    benefits: ['VIP专享折扣9.5折', '生日双倍积分'],
    evaluatedAt: '2026-06-28T11:00:00.000Z',
    upgraded: false,
    ...overrides,
  }
}

function makeBatchOutput(overrides: Partial<BatchLevelOutput> = {}): BatchLevelOutput {
  return {
    items: [makeLevelInfo()],
    totalEvaluated: 1,
    upgradedCount: 0,
    timestamp: '2026-06-28T11:00:00.000Z',
    ...overrides,
  }
}

function makeAllLevelConfig(overrides: Partial<AllLevelConfig> = {}): AllLevelConfig {
  return {
    tiers: [
      {
        tier: MemberLevelTier.REGULAR,
        label: 'REGULAR L1',
        growthRequired: 0,
        spendRequired: 0,
        visitRequired: 0,
        benefits: ['基础会员权益', '每月签到积分'],
      },
    ],
    lastUpdated: '2026-06-28T11:00:00.000Z',
    ...overrides,
  }
}

// ── describe ──────────────────────────────────────────────────

describe('MemberLevelController (spec)', () => {
  describe('POST /member-level/evaluate', () => {
    it('正例: 应返回正确的等级评估结果', () => {
      const svc = new MemberLevelService()
      const ctrl = new MemberLevelController(svc)

      const result = ctrl.evaluate({
        memberId: 'm-001',
        growthValue: 4000,
        totalSpend: 12000,
        totalVisits: 55,
        tenantId: 't-001',
      })

      assert.equal(result.success, true)
      assert.equal(result.data.currentTier, MemberLevelTier.SVIP)
      assert.equal(result.data.currentSub, MemberLevelSub.L1)
      assert.ok(result.data.benefits.length > 0)
    })

    it('边界: growthValue=0 时应返回 REGULAR_L1（最低等级）', () => {
      const svc = new MemberLevelService()
      const ctrl = new MemberLevelController(svc)

      const result = ctrl.evaluate({
        memberId: 'm-empty',
        growthValue: 0,
        totalSpend: 0,
        totalVisits: 0,
        tenantId: 't-001',
      })

      assert.equal(result.success, true)
      assert.equal(result.data.currentTier, MemberLevelTier.REGULAR)
      assert.equal(result.data.currentSub, MemberLevelSub.L1)
    })

    it('边界: 极高成长值应返回 MYTH_L3（最高等级）', () => {
      const svc = new MemberLevelService()
      const ctrl = new MemberLevelController(svc)

      const result = ctrl.evaluate({
        memberId: 'm-super',
        growthValue: 300_000,
        totalSpend: 3_000_000,
        totalVisits: 5_000,
        tenantId: 't-001',
      })

      assert.equal(result.success, true)
      assert.equal(result.data.currentTier, MemberLevelTier.MYTH)
      assert.equal(result.data.currentSub, MemberLevelSub.L3)
      assert.equal(result.data.upgradeProgress, 1.0)
    })

    it('反例: 空输入应仍返回结构化的结果（无异常崩溃）', () => {
      const svc = new MemberLevelService()
      const ctrl = new MemberLevelController(svc)

      const result = ctrl.evaluate({
        memberId: '',
        growthValue: 0,
        totalSpend: 0,
        totalVisits: 0,
        tenantId: '',
      })

      // 即使 memberId 为空字符串，服务应正常返回不崩溃
      assert.equal(result.success, true)
      assert.ok(result.data)
    })
  })

  describe('POST /member-level/calculate', () => {
    it('正例: 有效成长值应返回等级信息', async () => {
      const svc = new MemberLevelService()
      const ctrl = new MemberLevelController(svc)

      const result = await ctrl.calculate({ growthValue: 2500 })

      assert.equal(result.success, true)
      assert.equal(result.data.currentTier, MemberLevelTier.VIP)
      assert.equal(result.data.currentSub, MemberLevelSub.L3)
    })

    it('边界: growthValue=0 返回 REGULAR_L1', async () => {
      const svc = new MemberLevelService()
      const ctrl = new MemberLevelController(svc)

      const result = await ctrl.calculate({ growthValue: 0 })

      assert.equal(result.success, true)
      assert.equal(result.data.currentTier, MemberLevelTier.REGULAR)
    })

    it('边界: 极高成长值 500_000 返回 MYTH_L3', async () => {
      const svc = new MemberLevelService()
      const ctrl = new MemberLevelController(svc)

      const result = await ctrl.calculate({ growthValue: 500_000 })

      assert.equal(result.success, true)
      assert.equal(result.data.currentTier, MemberLevelTier.MYTH)
      assert.equal(result.data.currentSub, MemberLevelSub.L3)
    })

    it('反例: 负成长值应抛出 BadRequestException', async () => {
      const svc = new MemberLevelService()
      const ctrl = new MemberLevelController(svc)

      let caught: any = null
      try {
        await ctrl.calculate({ growthValue: -100 })
      } catch (err) {
        caught = err
      }

      assert.ok(caught, '应抛出异常')
      assert.ok(caught.message.includes('growthValue must be a non-negative number'))
    })
  })

  describe('POST /member-level/batch', () => {
    it('正例: 批量评估返回正确计数', () => {
      const svc = new MemberLevelService()
      const ctrl = new MemberLevelController(svc)

      const result = ctrl.batchEvaluate({
        items: [
          { input: { memberId: 'm1', growthValue: 0, totalSpend: 0, totalVisits: 0, tenantId: 't1' } },
          { input: { memberId: 'm2', growthValue: 4000, totalSpend: 10000, totalVisits: 60, tenantId: 't1' } },
          { input: { memberId: 'm3', growthValue: 250_000, totalSpend: 2_000_000, totalVisits: 3000, tenantId: 't1' } },
        ],
      })

      assert.equal(result.success, true)
      assert.equal(result.data.totalEvaluated, 3)
      assert.equal(result.data.items.length, 3)
      assert.ok(result.data.upgradedCount >= 0)
    })

    it('边界: 空数组应返回 empty 结果（无崩溃）', () => {
      const svc = new MemberLevelService()
      const ctrl = new MemberLevelController(svc)

      const result = ctrl.batchEvaluate({ items: [] })

      assert.equal(result.success, true)
      assert.equal(result.data.totalEvaluated, 0)
      assert.equal(result.data.items.length, 0)
    })

    it('边界: 重复 memberId 不影响后端逻辑（可重复评价）', () => {
      const svc = new MemberLevelService()
      const ctrl = new MemberLevelController(svc)

      const input = { memberId: 'dup', growthValue: 800, totalSpend: 2000, totalVisits: 12, tenantId: 't1' }
      const result = ctrl.batchEvaluate({
        items: [
          { input },
          { input },
          { input },
        ],
      })

      assert.equal(result.success, true)
      assert.equal(result.data.totalEvaluated, 3)
      // 每次结果应一致
      for (const item of result.data.items) {
        assert.equal(item.currentTier, MemberLevelTier.VIP)
      }
    })
  })

  describe('GET /member-level/config', () => {
    it('正例: 应返回全部 18 个等级配置', () => {
      const svc = new MemberLevelService()
      const ctrl = new MemberLevelController(svc)

      const result = ctrl.getConfig()

      assert.equal(result.success, true)
      assert.equal(result.data.tiers.length, 18)
    })

    it('正例: 每个等级配置包含所需的字段', () => {
      const svc = new MemberLevelService()
      const ctrl = new MemberLevelController(svc)

      const result = ctrl.getConfig()

      for (const tier of result.data.tiers) {
        assert.ok(typeof tier.tier === 'string')
        assert.ok(typeof tier.label === 'string')
        assert.ok(typeof tier.growthRequired === 'number')
        assert.ok(typeof tier.spendRequired === 'number')
        assert.ok(typeof tier.visitRequired === 'number')
        assert.ok(Array.isArray(tier.benefits))
        assert.ok(tier.growthRequired >= 0)
      }
    })

    it('正例: 配置按等级升序排列', () => {
      const svc = new MemberLevelService()
      const ctrl = new MemberLevelController(svc)

      const result = ctrl.getConfig()

      for (let i = 1; i < result.data.tiers.length; i++) {
        const prev = result.data.tiers[i - 1]
        const curr = result.data.tiers[i]
        assert.ok(
          curr.growthRequired >= prev.growthRequired,
          `等级 ${i} 的 growthRequired ${curr.growthRequired} 应 >= 前一个 ${prev.growthRequired}`
        )
      }
    })
  })

  describe('GET /member-level/upgrade-path/:fromTier/:fromSub/:toTier/:toSub', () => {
    it('正例: 从低到高应返回升级路径', () => {
      const svc = new MemberLevelService()
      const ctrl = new MemberLevelController(svc)

      const result = ctrl.getUpgradePath('REGULAR', 'L1', 'SVIP', 'L1')

      assert.equal(result.success, true)
      assert.ok(Array.isArray(result.data))
      assert.ok(result.data.length > 0)
      // 路径第一步应从当前等级升级
      assert.equal(result.data[0].fromTier, MemberLevelTier.REGULAR)
      assert.equal(result.data[0].fromSub, MemberLevelSub.L1)
    })

    it('正例: 同级路径应返回空或单步', () => {
      const svc = new MemberLevelService()
      const ctrl = new MemberLevelController(svc)

      const result = ctrl.getUpgradePath('VIP', 'L2', 'VIP', 'L2')

      assert.equal(result.success, true)
      assert.ok(Array.isArray(result.data))
    })

    it('边界: 最大跨度 REGULAR_L1 → MYTH_L3', () => {
      const svc = new MemberLevelService()
      const ctrl = new MemberLevelController(svc)

      const result = ctrl.getUpgradePath('REGULAR', 'L1', 'MYTH', 'L3')

      assert.equal(result.success, true)
      // 17 步：从 REGULAR_L1 (index 0) 到 MYTH_L3 (index 17) 至少应有升级路径
      // 实际路径步数 = index 差 = 17
      assert.ok(result.data.length > 0)
      // 最后一步应到达 MYTH_L3
      const last = result.data[result.data.length - 1]
      assert.equal(last.toTier, MemberLevelTier.MYTH)
      assert.equal(last.toSub, MemberLevelSub.L3)
    })

    it('反例: 无效 fromTier 应抛出 BadRequestException', () => {
      const svc = new MemberLevelService()
      const ctrl = new MemberLevelController(svc)

      let caught: any = null
      try {
        ctrl.getUpgradePath('INVALID', 'L1', 'VIP', 'L1')
      } catch (err) {
        caught = err
      }

      assert.ok(caught, '应抛出异常')
      assert.ok(caught.message.includes('Invalid fromTier'))
    })

    it('反例: 无效 fromSub 应抛出 BadRequestException', () => {
      const svc = new MemberLevelService()
      const ctrl = new MemberLevelController(svc)

      let caught: any = null
      try {
        ctrl.getUpgradePath('REGULAR', 'L5', 'VIP', 'L1')
      } catch (err) {
        caught = err
      }

      assert.ok(caught, '应抛出异常')
      assert.ok(caught.message.includes('Invalid fromSub'))
    })

    it('反例: 无效 toTier 应抛出 BadRequestException', () => {
      const svc = new MemberLevelService()
      const ctrl = new MemberLevelController(svc)

      let caught: any = null
      try {
        ctrl.getUpgradePath('REGULAR', 'L1', 'FAKE', 'L1')
      } catch (err) {
        caught = err
      }

      assert.ok(caught, '应抛出异常')
      assert.ok(caught.message.includes('Invalid toTier'))
    })
  })

  describe('route metadata', () => {
    it('controller path 应为 member-level', () => {
      const path = Reflect.getMetadata('path', MemberLevelController)
      assert.equal(path, 'member-level')
    })

    it('evaluate → POST /evaluate', () => {
      const method = Reflect.getMetadata('method', MemberLevelController.prototype.evaluate)
      const path = Reflect.getMetadata('path', MemberLevelController.prototype.evaluate)
      assert.equal(method, 1) // POST
      assert.equal(path, 'evaluate')
    })

    it('calculate → POST /calculate', () => {
      const method = Reflect.getMetadata('method', MemberLevelController.prototype.calculate)
      const path = Reflect.getMetadata('path', MemberLevelController.prototype.calculate)
      assert.equal(method, 1)
      assert.equal(path, 'calculate')
    })

    it('batchEvaluate → POST /batch', () => {
      const method = Reflect.getMetadata('method', MemberLevelController.prototype.batchEvaluate)
      const path = Reflect.getMetadata('path', MemberLevelController.prototype.batchEvaluate)
      assert.equal(method, 1)
      assert.equal(path, 'batch')
    })

    it('getConfig → GET /config', () => {
      const method = Reflect.getMetadata('method', MemberLevelController.prototype.getConfig)
      const path = Reflect.getMetadata('path', MemberLevelController.prototype.getConfig)
      assert.equal(method, 0) // GET
      assert.equal(path, 'config')
    })

    it('getUpgradePath → GET /upgrade-path/:fromTier/:fromSub/:toTier/:toSub', () => {
      const method = Reflect.getMetadata('method', MemberLevelController.prototype.getUpgradePath)
      const path = Reflect.getMetadata('path', MemberLevelController.prototype.getUpgradePath)
      assert.equal(method, 0)
      assert.equal(path, 'upgrade-path/:fromTier/:fromSub/:toTier/:toSub')
    })
  })
})
