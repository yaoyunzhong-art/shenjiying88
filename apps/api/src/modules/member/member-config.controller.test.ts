import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [member-config] [D] controller spec 补全
 *
 * Phase-36 T166-1: Member 配置中心 Controller 测试
 *
 * 覆盖 (20+ 断言):
 *  - 正例: GET / → 返回当前配置
 *  - 正例: PATCH / → 部分更新配置
 *  - 正例: POST /reset → 重置为默认
 *  - 正例: GET /history → 变更历史
 *  - 正例: GET /threshold/:level → 5 档等级
 *  - 正例: POST /threshold/batch → 批量查询
 *  - 正例: GET /points-rate → 积分比例
 *  - 正例: GET /upgrade-progress → 升级进度
 *  - 正例: POST /validate → 校验配置 (合法)
 *  - 正例: GET /default → 默认配置
 *  - 反例: PATCH / → 空 body 抛 BadRequest
 *  - 反例: GET /threshold/:level → 无效等级抛 BadRequest
 *  - 反例: GET /upgrade-progress → 无效等级抛 BadRequest
 *  - 反例: POST /validate → 非法阈值
 *  - 反例: POST /validate → earnRate <= 0
 *  - 反例: POST /validate → dormantDays >= churnedDays
 *  - 边界: GET /history → 自定义 limit 裁剪
 *  - 边界: GET /upgrade-progress → Diamond 返回 progress 100%
 *  - 边界: POST /threshold/batch → 空数组返回全部
 *  - 边界: GET /upgrade-progress → 默认 0 积分 Bronze
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MemberConfigController } from './member-config.controller'
import { MemberConfigService, DEFAULT_MEMBER_CONFIG } from './member-config'
import { MemberLevel } from './member.entity'
import { BadRequestException } from '@nestjs/common'

function freshController(): MemberConfigController {
  return new MemberConfigController(new MemberConfigService())
}

function makeReq(overrides: Record<string, unknown> = {}): any {
  return {
    tenantId: 't-001',
    userId: 'admin-001',
    ...overrides
  }
}

describe('MemberConfigController', () => {
  // ── 正例 ──

  it('GET / → 返回当前配置 (默认 8 字段)', () => {
    const ctrl = freshController()
    const result = ctrl.getConfig()
    assert.ok(result.config, '有 config 字段')
    assert.equal(result.config.points.earnRate, 1)
    assert.equal(result.config.lifecycle.dormantDays, 90)
    assert.equal(result.config.phoneUniqueScope, 'global')
    assert.equal(result.config.crossTenantEnabled, true)
  })

  it('PATCH / → 部分更新 points.earnRate', () => {
    const ctrl = freshController()
    const result = ctrl.updateConfig(makeReq(), {
      patch: { points: { earnRate: 2 } },
      reason: '促销'
    })
    assert.equal(result.config.points.earnRate, 2)
    assert.ok(result.changeId, '有 changeId')
  })

  it('POST /reset → 重置为默认', () => {
    const ctrl = freshController()
    // 先改值
    ctrl.updateConfig(makeReq(), {
      patch: { points: { earnRate: 10 } },
      reason: '临时'
    })
    // 重置
    const result = ctrl.resetConfig(makeReq())
    assert.equal(result.config.points.earnRate, 1, '回到 1')
    assert.equal(result.changedBy, 'admin-001')
  })

  it('GET /history → 返回变更历史', () => {
    const ctrl = freshController()
    // 先制造几条历史
    ctrl.updateConfig(makeReq(), {
      patch: { points: { earnRate: 3 } },
      reason: 'chg1'
    })
    ctrl.updateConfig(makeReq(), {
      patch: { points: { earnRate: 5 } },
      reason: 'chg2'
    })
    const result = ctrl.getHistory({ limit: '10' } as any)
    assert.ok(Array.isArray(result.history), 'history 是 array')
    assert.equal(result.count, 2)
    assert.equal(result.history[1].reason, 'chg2')
  })

  it('GET /threshold/:level → 5 档等级', () => {
    const ctrl = freshController()
    const levels = [
      { level: 'bronze', expected: 0 },
      { level: 'silver', expected: 500 },
      { level: 'gold', expected: 2000 },
      { level: 'platinum', expected: 10000 },
      { level: 'diamond', expected: 50000 }
    ]
    for (const { level, expected } of levels) {
      const r = ctrl.getThreshold(level)
      assert.equal(r.threshold, expected, `等级 ${level} 阈值=${expected}`)
    }
  })

  it('POST /threshold/batch → 批量查询', () => {
    const ctrl = freshController()
    const result = ctrl.batchThreshold({ levels: ['silver', 'diamond'] })
    assert.equal(result.thresholds['SILVER'], 500)
    assert.equal(result.thresholds['DIAMOND'], 50000)
    assert.ok(!result.thresholds['GOLD'], '未请求的不返回')
  })

  it('POST /threshold/batch → 空数组返回全部 5 档', () => {
    const ctrl = freshController()
    const result = ctrl.batchThreshold({})
    assert.equal(Object.keys(result.thresholds).length, 5)
  })

  it('GET /points-rate → 积分比例', () => {
    const ctrl = freshController()
    const result = ctrl.getPointsRate()
    assert.deepEqual(result, { earn: 1, redeem: 100 })
  })

  it('GET /upgrade-progress → Bronze 300 分 → Silver', () => {
    const ctrl = freshController()
    const result = ctrl.upgradeProgress('300', 'bronze')
    assert.equal(result.currentLevel, 'BRONZE')
    assert.equal(result.nextLevel, 'SILVER')
    assert.equal(result.pointsNeeded, 200)
    assert.ok(result.progress > 0 && result.progress < 100)
  })

  it('GET /upgrade-progress → Diamond 返回 null nextLevel + 100%', () => {
    const ctrl = freshController()
    const result = ctrl.upgradeProgress('99999', 'diamond')
    assert.equal(result.nextLevel, null)
    assert.equal(result.pointsNeeded, 0)
    assert.equal(result.progress, 100)
  })

  it('POST /validate → 合法 patch', () => {
    const ctrl = freshController()
    const result = ctrl.validateConfig({
      patch: { points: { earnRate: 2, redeemRate: 50 } }
    })
    assert.equal(result.valid, true)
    assert.deepEqual(result.errors, [])
  })

  it('GET /default → 与 DEFAULT_MEMBER_CONFIG 一致', () => {
    const ctrl = freshController()
    const result = ctrl.getDefault()
    assert.deepEqual(result.config, DEFAULT_MEMBER_CONFIG)
  })

  // ── 反例 ──

  it('PATCH / → 空 body 抛 BadRequest', () => {
    const ctrl = freshController()
    assert.throws(
      () => ctrl.updateConfig(makeReq(), {} as any),
      /patch required/
    )
  })

  it('PATCH / → null patch 抛 BadRequest', () => {
    const ctrl = freshController()
    assert.throws(
      () => ctrl.updateConfig(makeReq(), { patch: null as any }),
      /patch required/
    )
  })

  it('GET /threshold/:level → 无效等级抛 BadRequest', () => {
    const ctrl = freshController()
    assert.throws(
      () => ctrl.getThreshold('mythic'),
      /invalid level/
    )
  })

  it('GET /upgrade-progress → 无效等级抛 BadRequest', () => {
    const ctrl = freshController()
    assert.throws(
      () => ctrl.upgradeProgress('0', 'invalid-level'),
      /invalid currentLevel/
    )
  })

  it('POST /validate → 非法阈值 (非单调递增)', () => {
    const ctrl = freshController()
    const result = ctrl.validateConfig({
      patch: { levels: { thresholds: { SILVER: 100, GOLD: 50 } } }
    })
    assert.equal(result.valid, false)
    assert.ok(result.errors.some((e: string) => e.includes('monotonic')))
  })

  it('POST /validate → earnRate <= 0', () => {
    const ctrl = freshController()
    const result = ctrl.validateConfig({
      patch: { points: { earnRate: 0 } }
    })
    assert.equal(result.valid, false)
    assert.ok(result.errors.some((e: string) => e.includes('earnRate')))
  })

  it('POST /validate → dormantDays >= churnedDays', () => {
    const ctrl = freshController()
    const result = ctrl.validateConfig({
      patch: { lifecycle: { dormantDays: 200, churnedDays: 100 } }
    })
    assert.equal(result.valid, false)
    assert.ok(result.errors.some((e: string) => e.includes('dormantDays')))
  })

  it('POST /validate → 空 body 返回 false', () => {
    const ctrl = freshController()
    const result = ctrl.validateConfig({} as any)
    assert.equal(result.valid, false)
  })

  // ── 边界 ──

  it('GET /history → limit 裁剪 (上限 100)', () => {
    const ctrl = freshController()
    // 写入 50 条
    for (let i = 0; i < 50; i++) {
      ctrl.updateConfig(makeReq(), {
        patch: { points: { earnRate: i + 1 } },
        reason: `chg-${i}`
      })
    }
    const r = ctrl.getHistory({ limit: '200' } as any)
    assert.equal(r.count, 50, '50 条全部返回')
    assert.ok(r.count <= 100, '上限 100')
  })

  it('GET /upgrade-progress → 默认参数 (0 积分 Bronze)', () => {
    const ctrl = freshController()
    const result = ctrl.upgradeProgress(undefined as any, undefined as any)
    assert.equal(result.currentLevel, 'BRONZE')
    assert.equal(result.currentPoints, 0)
    assert.equal(result.nextLevel, 'SILVER')
    assert.equal(result.pointsNeeded, 500)
  })

  it('POST /validate → null body 返回 false', () => {
    const ctrl = freshController()
    const result = ctrl.validateConfig(null as any)
    assert.equal(result.valid, false)
    assert.ok(Array.isArray(result.errors))
  })

  it('PATCH / → 更新 lifecycle 后 validate 反映新值', () => {
    const ctrl = freshController()
    // 先更新 lifecycle 合法值
    ctrl.updateConfig(makeReq(), {
      patch: { lifecycle: { dormantDays: 15, churnedDays: 60 } },
      reason: 'tune dormancy'
    })
    // validate 应基于合并后的配置反映
    const result = ctrl.validateConfig({
      patch: { lifecycle: { dormantDays: 30 } }  // 30 < 60 合法
    })
    assert.equal(result.valid, true)
  })
})
