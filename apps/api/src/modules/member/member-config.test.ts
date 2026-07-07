import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import {
  MemberConfigService,
  DEFAULT_MEMBER_CONFIG
} from './member-config'
import { MemberLevel } from './member.entity'

/**
 * Phase-36 T166-1: MemberConfigService 单元测试
 *
 * 测试覆盖 (10 断言):
 *  1. 默认配置 8 字段断言
 *  2. updateConfig 部分更新 (points.earnRate)
 *  3. updateConfig 部分更新 (levels.thresholds)
 *  4. getThreshold 5 档
 *  5. getPointsRate 默认值
 *  6. pointsToNextLevel Bronze → Silver
 *  7. pointsToNextLevel Diamond (nextLevel = null)
 *  8. updateConfig 防御: 等级阈值非单调
 *  9. updateConfig 防御: dormantDays >= churnedDays
 * 10. updateConfig 防御: earnRate <= 0
 * 11. getHistory ringbuffer LRU 100
 * 12. resetToDefault 清空历史
 */

describe('MemberConfigService', () => {
  it('默认配置 8 字段完整', () => {
    const svc = new MemberConfigService()
    const c = svc.getConfig()

    // points (4 字段)
    assert.equal(c.points.earnRate, 1, 'earnRate = 1 (D3)')
    assert.equal(c.points.redeemRate, 100, 'redeemRate = 100 (D3)')
    assert.equal(c.points.enabled, true, 'points.enabled = true')
    assert.equal(c.points.expiryDays, 365, 'expiryDays = 365')

    // levels (1 字段含 5 阈值)
    assert.equal(c.levels.thresholds.BRONZE, 0)
    assert.equal(c.levels.thresholds.SILVER, 500)
    assert.equal(c.levels.thresholds.GOLD, 2000)
    assert.equal(c.levels.thresholds.PLATINUM, 10000)
    assert.equal(c.levels.thresholds.DIAMOND, 50000)

    // lifecycle (2 字段)
    assert.equal(c.lifecycle.dormantDays, 90, 'dormantDays = 90 (D4 大飞哥)')
    assert.equal(c.lifecycle.churnedDays, 180)

    // 2 字段
    assert.equal(c.phoneUniqueScope, 'global', 'phoneUniqueScope = global (D1)')
    assert.equal(c.crossTenantEnabled, true, 'crossTenantEnabled = true (D5)')
  })

  it('updateConfig 部分更新 points.earnRate', () => {
    const svc = new MemberConfigService()
    svc.updateConfig({ points: { earnRate: 2 } }, 'admin', '促销加倍积分')
    assert.equal(svc.getConfig().points.earnRate, 2, 'earnRate 更新为 2')
    assert.equal(svc.getConfig().points.redeemRate, 100, 'redeemRate 保持 100')
  })

  it('updateConfig 部分更新 levels.thresholds', () => {
    const svc = new MemberConfigService()
    svc.updateConfig({
      levels: { thresholds: { GOLD: 1500 } }
    }, 'admin', '调整 Gold 阈值')
    assert.equal(svc.getConfig().levels.thresholds.GOLD, 1500, 'GOLD 更新为 1500')
    assert.equal(svc.getConfig().levels.thresholds.PLATINUM, 10000, 'PLATINUM 保持 10000')
  })

  it('getThreshold 5 档', () => {
    const svc = new MemberConfigService()
    assert.equal(svc.getThreshold(MemberLevel.Bronze), 0)
    assert.equal(svc.getThreshold(MemberLevel.Silver), 500)
    assert.equal(svc.getThreshold(MemberLevel.Gold), 2000)
    assert.equal(svc.getThreshold(MemberLevel.Platinum), 10000)
    assert.equal(svc.getThreshold(MemberLevel.Diamond), 50000)
  })

  it('getPointsRate 默认值', () => {
    const svc = new MemberConfigService()
    const rate = svc.getPointsRate()
    assert.deepEqual(rate, { earn: 1, redeem: 100 })
  })

  it('pointsToNextLevel Bronze → Silver (300 积分)', () => {
    const svc = new MemberConfigService()
    const result = svc.pointsToNextLevel(300, MemberLevel.Bronze)
    assert.equal(result.nextLevel, MemberLevel.Silver)
    assert.equal(result.pointsNeeded, 200, '500 - 300 = 200 还差')
  })

  it('pointsToNextLevel Diamond (已是最高)', () => {
    const svc = new MemberConfigService()
    const result = svc.pointsToNextLevel(99999, MemberLevel.Diamond)
    assert.equal(result.nextLevel, null)
    assert.equal(result.pointsNeeded, 0)
  })

  it('updateConfig 防御: 等级阈值非单调', () => {
    const svc = new MemberConfigService()
    assert.throws(
      () => svc.updateConfig({
        levels: { thresholds: { SILVER: 100, GOLD: 50 } }  // SILVER > GOLD 违反单调
      }, 'admin', 'bad'),
      /monotonic increasing/,
      '应抛错 等级阈值必须单调递增'
    )
  })

  it('updateConfig 防御: dormantDays >= churnedDays', () => {
    const svc = new MemberConfigService()
    assert.throws(
      () => svc.updateConfig({
        lifecycle: { dormantDays: 200, churnedDays: 100 }
      }, 'admin', 'bad'),
      /dormantDays must be less than churnedDays/
    )
  })

  it('updateConfig 防御: earnRate <= 0', () => {
    const svc = new MemberConfigService()
    assert.throws(
      () => svc.updateConfig({
        points: { earnRate: -1 }
      }, 'admin', 'bad'),
      /earnRate and redeemRate must be positive/
    )
  })

  it('getHistory ringbuffer LRU 100', () => {
    const svc = new MemberConfigService()
    // 写入 105 条变更
    for (let i = 0; i < 105; i++) {
      svc.updateConfig({ points: { earnRate: i + 1 } }, `user-${i}`, `change-${i}`)
    }
    const size = svc.historySize()
    assert.ok(size <= 100, `history 不超过 100 (实际 ${size})`)
  })

  it('resetToDefault 清空历史', () => {
    const svc = new MemberConfigService()
    svc.updateConfig({ points: { earnRate: 5 } }, 'admin', 'test')
    assert.equal(svc.historySize(), 1)
    svc.resetToDefault()
    assert.equal(svc.getConfig().points.earnRate, 1, '回到默认')
    assert.equal(svc.historySize(), 0, '历史清空')
  })

  it('DEFAULT_MEMBER_CONFIG 与 service 默认一致', () => {
    const svc = new MemberConfigService()
    assert.deepEqual(svc.getConfig(), DEFAULT_MEMBER_CONFIG, 'service 默认值与 DEFAULT 一致')
  })

  it('updateConfig 立即生效 (热更新)', () => {
    const svc = new MemberConfigService()
    // 修改前
    assert.equal(svc.getConfig().points.earnRate, 1)
    // 修改
    const updated = svc.updateConfig({ points: { earnRate: 3 } }, 'admin', 'hot reload')
    // 立即生效
    assert.equal(updated.points.earnRate, 3)
    assert.equal(svc.getConfig().points.earnRate, 3, '下次 getConfig 立即看到新值')
  })

  it('getConfig 返回深拷贝 (防外部污染)', () => {
    const svc = new MemberConfigService()
    const c1 = svc.getConfig()
    c1.points.earnRate = 999  // 外部污染
    const c2 = svc.getConfig()
    assert.equal(c2.points.earnRate, 1, '外部修改不污染 service')
  })
})
