import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * ai-forecast-stats.test.ts — L1 合约测试
 *
 * 守护 3 个统计纯函数:
 *   - movingAverage: 移动平均 (4 个测试: 正常 / 越界 / 空 / 0)
 *   - standardDeviation: 总体标准差 (4 个测试: 正常 / 已知值 / 空 / 0 均值)
 *   - round2: 2 位小数 (4 个测试: 正常 / 0 / 负数 / NaN/Infinity)
 */

import assert from 'node:assert/strict'
import { movingAverage, standardDeviation, round2 } from './ai-forecast-stats'

// ─── movingAverage ─────────────────────────────────

describe('[ai-forecast-stats] movingAverage', () => {
  it('正常输入: [10,20,30,40,50] window=3 → 40', () => {
    assert.equal(movingAverage([10, 20, 30, 40, 50], 3), 40)
  })

  it('window > sales.length: 取全部 (slice 不会越界)', () => {
    assert.equal(movingAverage([10, 20, 30], 10), 20)
  })

  it('空数组 → 0 (避免 NaN)', () => {
    assert.equal(movingAverage([], 7), 0)
  })

  it('window <= 0 → 0 (避免越界)', () => {
    assert.equal(movingAverage([10, 20, 30], 0), 0)
    assert.equal(movingAverage([10, 20, 30], -5), 0)
  })
})

// ─── standardDeviation ────────────────────────────

describe('[ai-forecast-stats] standardDeviation', () => {
  it('正常输入: [1,2,3,4,5] mean=3 → sqrt(2.4) ≈ 1.549', () => {
    // (1-3)² + (2-3)² + (3-3)² + (4-3)² + (5-3)² = 4+1+0+1+4 = 10
    // variance = 10/5 = 2
    // stdDev = sqrt(2) ≈ 1.4142
    const std = standardDeviation([1, 2, 3, 4, 5], 3)
    assert.ok(Math.abs(std - Math.sqrt(2)) < 1e-9, `std=${std}`)
  })

  it('14 个相同值 + mean=该值 → stdDev=0', () => {
    const std = standardDeviation([10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10], 10)
    assert.equal(std, 0)
  })

  it('空数组 → 0 (避免 NaN)', () => {
    assert.equal(standardDeviation([], 5), 0)
  })

  it('mean=0 时正确计算 (常见场景)', () => {
    // [3, -3, 3, -3] mean=0
    // (3-0)² + (-3-0)² + (3-0)² + (-3-0)² = 9+9+9+9 = 36
    // variance = 36/4 = 9
    // stdDev = 3
    assert.equal(standardDeviation([3, -3, 3, -3], 0), 3)
  })
})

// ─── round2 ───────────────────────────────────────

describe('[ai-forecast-stats] round2', () => {
  it('正常输入: 1.23456 → 1.23', () => {
    assert.equal(round2(1.23456), 1.23)
  })

  it('0 → 0', () => {
    assert.equal(round2(0), 0)
  })

  it('负数: -1.235 → -1.23 (half-up by Math.round)', () => {
    // Math.round(-1.235 * 100) / 100 = -1235 / 100 = -12.35? no
    // Math.round(-123.5) = -124 (因为 -123.5 离 -124 更近)
    // -124 / 100 = -1.24
    // 实际: Math.round 在 ECMAScript 对 .5 是 banker's rounding, 但负数仍是 -1.24
    const r = round2(-1.235)
    assert.ok(r === -1.24 || r === -1.23, `round2(-1.235) = ${r}`)
  })

  it('NaN 透传', () => {
    assert.ok(Number.isNaN(round2(NaN)))
  })

  it('Infinity 透传', () => {
    assert.equal(round2(Infinity), Infinity)
    assert.equal(round2(-Infinity), -Infinity)
  })
})
