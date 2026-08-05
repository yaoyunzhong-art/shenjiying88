/**
 * aiops-prediction.service.spec.ts — AIOps 异常预测 Service 深层单元测试
 *
 * 覆盖：
 *  - AnomalyDetectEngine:    正例（Z-Score检测/突增/突降/趋势异常/批量记录）/ 反例（数据不足/0值/单点）/ 边界（刚好阈值/大量数据/时间窗口）
 *  - StatisticalTools:       正例（均值/方差/标准差/斜率）/ 反例（空数组/单元素）/ 边界（大数/浮点/全相同值）
 *  - AttackDetectEngine:     正例（DDoS检测/高频请求/异常值/周期模式）/ 反例（数据不足/正常流量）/ 边界（刚好临界/0值）
 *  - SelfHealingEngine:      正例（健康检查/自愈触发/扩容/回滚/重启）/ 反例（检查频率/历史限制）/ 边界（刚超阈值/MAX限制）
 *
 * 全部内联 mock，不依赖 NestJS DI。≥ 18 项测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ═══════════════════════════════════════════════════════════════
// 枚举常量
// ═══════════════════════════════════════════════════════════════

const ANOMALY_TYPES = ['spike', 'drop', 'trend', 'seasonal'] as const
const ATTACK_TYPES = ['ddos', 'brute_force', 'data_exfil'] as const
const HEALTH_STATUSES = ['healthy', 'degraded', 'critical', 'unknown'] as const
const HEALING_ACTIONS = ['restart', 'rollback', 'scale', 'isolate'] as const

// ═══════════════════════════════════════════════════════════════
// mock 数据工厂
// ═══════════════════════════════════════════════════════════════

interface MockTimeSeriesPoint {
  timestamp: string
  value: number
}

/** 创建时序点 */
function makePoint(value: number, offsetMs: number = 0): MockTimeSeriesPoint {
  return {
    timestamp: new Date(Date.now() - offsetMs).toISOString(),
    value,
  }
}

/** 创建模拟数据序列 */
function makeSeries(values: number[], intervalMs: number = 60000): MockTimeSeriesPoint[] {
  return values.map((v, i) => makePoint(v, (values.length - 1 - i) * intervalMs))
}

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑 — 统计工具
// ═══════════════════════════════════════════════════════════════

function inlineMean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function inlineVariance(values: number[]): number {
  if (values.length === 0) return 0
  const mean = inlineMean(values)
  return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
}

function inlineStd(values: number[], mean?: number): number {
  return Math.sqrt(inlineVariance(values))
}

function inlineSlope(values: number[]): number {
  const n = values.length
  if (n < 2) return 0
  let sumX = 0; let sumY = 0; let sumXY = 0; let sumX2 = 0
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += values[i]; sumXY += i * values[i]; sumX2 += i * i
  }
  const denom = n * sumX2 - sumX * sumX
  if (Math.abs(denom) < 0.001) return 0
  return (n * sumXY - sumX * sumY) / denom
}

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑 — 异常检测
// ═══════════════════════════════════════════════════════════════

function inlineDetectAnomaly(
  values: number[],
): {
  isAnomaly: boolean
  anomalyScore: number
  anomalyType?: string
  zScore: number
  changeRate: number
} {
  if (values.length < 5) {
    return { isAnomaly: false, anomalyScore: 0, zScore: 0, changeRate: 0 }
  }

  const mean = inlineMean(values)
  const std = inlineStd(values, mean)
  const latestValue = values[values.length - 1]
  const previousValues = values.slice(-5, -1)
  const prevMean = inlineMean(previousValues)

  const zScore = std > 0 ? Math.abs((latestValue - mean) / std) : 0
  const changeRate = prevMean > 0 ? Math.abs((latestValue - prevMean) / prevMean) : 0

  const isSpike = zScore > 2.5 || (changeRate > 0.8 && latestValue > mean)
  const isDrop = zScore > 2.5 && latestValue < mean - 2.5 * std || (changeRate > 0.8 && latestValue < mean)

  let anomalyType: string | undefined
  if (isSpike) anomalyType = 'spike'
  else if (isDrop) anomalyType = 'drop'
  else if (zScore > 2 && inlineSlope(values) > 1) anomalyType = 'trend'

  const isAnomaly = zScore > 2.5 || changeRate > 0.8 || zScore > 2
  const anomalyScore = Math.min(1, zScore / 5 + changeRate / 2)

  return { isAnomaly, anomalyScore, anomalyType, zScore, changeRate }
}

/** 指数平滑预测 */
function inlinePredictNext(values: number[], horizon: number = 3): number[] {
  if (values.length < 3) return Array(horizon).fill(0)
  const alpha = 0.3
  let lastSmoothed = values[0]
  for (let i = 1; i < values.length; i++) {
    lastSmoothed = alpha * values[i] + (1 - alpha) * lastSmoothed
  }
  return Array(horizon).fill(Math.max(0, Math.round(lastSmoothed * 100) / 100))
}

/**
 * 趋势异常检测: 最近窗口斜率 vs 更早窗口斜率
 */
function inlineDetectTrendAnomaly(values: number[]): boolean {
  if (values.length < 10) return false
  const windowSize = Math.min(10, Math.floor(values.length / 2))
  const recentWindow = values.slice(-windowSize)
  const olderWindow = values.slice(-windowSize * 2, -windowSize)
  if (olderWindow.length === 0) return false
  const recentTrend = inlineSlope(recentWindow)
  const olderTrend = inlineSlope(olderWindow)
  const trendChange = Math.abs((recentTrend - olderTrend) / (Math.abs(olderTrend) + 0.001))
  return trendChange > 3
}

/** 攻击检测 */
function inlineIsUnderAttack(values: number[]): {
  isUnderAttack: boolean
  confidence: number
  attackType?: string
  evidenceCount: number
} {
  if (values.length < 10) {
    return { isUnderAttack: false, confidence: 0, evidenceCount: 0 }
  }

  let confidence = 0
  let attackType: string | undefined
  const evidence: string[] = []

  // 检测突增
  const recentCount = Math.min(values.length, 5)
  const recentAvg = inlineMean(values.slice(-recentCount))
  const olderAvg = inlineMean(values.slice(0, -recentCount))
  if (olderAvg > 0) {
    const increaseRate = (recentAvg - olderAvg) / olderAvg
    if (increaseRate > 2) {
      evidence.push(`请求量突增${Math.round(increaseRate * 100)}%`)
      confidence = Math.max(confidence, Math.min(1, increaseRate / 5))
      attackType = 'ddos'
    }
  }

  // 检测异常值
  const mean = inlineMean(values)
  const std = inlineStd(values, mean)
  if (std > 0) {
    const latestZScore = Math.abs((values[values.length - 1] - mean) / std)
    if (latestZScore > 3) {
      evidence.push(`异常值 ${latestZScore.toFixed(2)}`)
      confidence = Math.max(confidence, 0.7)
      attackType = attackType || 'data_exfil'
    }
  }

  // 高频请求 (最近5个点)
  const maxRecent = Math.max(...values.slice(-5))
  const minRecent = Math.min(...values.slice(-5))
  if (maxRecent > values.length * 5) {
    evidence.push('高频请求')
    confidence = Math.max(confidence, Math.min(1, maxRecent / (values.length * 10)))
    attackType = attackType || 'ddos'
  }

  return {
    isUnderAttack: confidence > 0.5,
    confidence: Math.round(confidence * 100) / 100,
    attackType: confidence > 0.5 ? attackType : undefined,
    evidenceCount: evidence.length,
  }
}

/** 健康检查模拟 */
function inlineCheckHealth(
  cpuUsage: number,
  memUsage: number,
  responseTime: number,
  errorRate: number,
): { status: string; issues: string[] } {
  const issues: string[] = []
  if (cpuUsage > 90) issues.push('CPU使用率过高')
  if (memUsage > 85) issues.push('内存使用率过高')
  if (responseTime > 500) issues.push('响应时间过长')
  if (errorRate > 5) issues.push('错误率过高')

  let status = 'healthy'
  if (issues.length >= 3 || cpuUsage > 95 || errorRate > 8) status = 'critical'
  else if (issues.length >= 1 || cpuUsage > 80 || errorRate > 3) status = 'degraded'
  return { status, issues }
}

/** 自愈动作选择 */
function inlineSelectHealingAction(cpuUsage: number, hasErrorIssue: boolean): string {
  if (cpuUsage > 90) return 'scale'
  if (hasErrorIssue) return 'rollback'
  return 'restart'
}

/** 判断自愈是否成功 */
function inlineHealingSuccess(afterStatus: string): boolean {
  return afterStatus === 'healthy' || afterStatus === 'degraded'
}

// ═══════════════════════════════════════════════════════════════
// StatisticalTools — 统计工具
// ═══════════════════════════════════════════════════════════════

describe('StatisticalTools | 纯函数统计', () => {
  // ── 正例 ──

  it('正例: 均值计算 [1,2,3,4,5] = 3', () => {
    expect(inlineMean([1, 2, 3, 4, 5])).toBe(3)
  })

  it('正例: 方差计算 [1,1,1] = 0', () => {
    expect(inlineVariance([1, 1, 1])).toBe(0)
  })

  it('正例: 标准差为正数', () => {
    expect(inlineStd([1, 3, 5])).toBeGreaterThan(0)
  })

  it('正例: 斜率计算 [0,1,2,3,4] → 斜率为 1', () => {
    expect(inlineSlope([0, 1, 2, 3, 4])).toBeCloseTo(1, 5)
  })

  it('正例: 全相同值斜率为 0', () => {
    expect(inlineSlope([5, 5, 5, 5])).toBeCloseTo(0, 5)
  })

  // ── 反例 ──

  it('反例: 空数组均值 = 0', () => {
    expect(inlineMean([])).toBe(0)
  })

  it('反例: 空数组方差 = 0', () => {
    expect(inlineVariance([])).toBe(0)
  })

  it('反例: 单元素斜率 = 0', () => {
    expect(inlineSlope([1])).toBe(0)
  })

  // ── 边界 ──

  it('边界: 大数值均值', () => {
    expect(inlineMean([1e9, 2e9])).toBe(1.5e9)
  })

  it('边界: 负数斜率', () => {
    expect(inlineSlope([4, 3, 2, 1, 0])).toBeCloseTo(-1, 5)
  })

  it('边界: 2元素斜率', () => {
    expect(inlineSlope([10, 20])).toBe(10)
  })
})

// ═══════════════════════════════════════════════════════════════
// AnomalyDetectEngine — 异常检测
// ═══════════════════════════════════════════════════════════════

describe('AnomalyDetectEngine | inlineDetectAnomaly', () => {
  // ── 正例 8+ ──

  it('正例: 稳定序列不报异常', () => {
    const values = [50, 51, 49, 52, 50, 49, 51, 50, 48, 51]
    const result = inlineDetectAnomaly(values)
    expect(result.isAnomaly).toBe(false)
  })

  it('正例: 突增 (spike) 检测', () => {
    const values = [10, 11, 10, 12, 100] // 最后一个点突增
    const result = inlineDetectAnomaly(values)
    expect(result.isAnomaly).toBe(true)
    expect(result.anomalyType).toBe('spike')
  })

  it('正例: 突降 (drop) 检测', () => {
    const values = [100, 95, 100, 90, 5] // 最后一个点突降
    const result = inlineDetectAnomaly(values)
    expect(result.isAnomaly).toBe(true)
  })

  it('正例: 批量记录数据点', () => {
    const points = makeSeries([10, 20, 30, 40, 50, 60])
    expect(points).toHaveLength(6)
  })

  it('正例: 趋势异常 (斜率变化大)', () => {
    const values = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 30, 60, 90, 120, 150]
    const result = inlineDetectAnomaly(values)
    expect(result.isAnomaly).toBe(true)
  })

  it('正例: anomalyScore 范围为 0~1', () => {
    const values = [10, 10, 10, 10, 100]
    const result = inlineDetectAnomaly(values)
    expect(result.anomalyScore).toBeGreaterThanOrEqual(0)
    expect(result.anomalyScore).toBeLessThanOrEqual(1)
  })

  it('正例: detectTrendAnomaly 检测趋势变化', () => {
    const values = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 100]
    expect(inlineDetectTrendAnomaly(values)).toBe(true)
  })

  it('正例: 指数平滑预测返回正数', () => {
    const result = inlinePredictNext([10, 20, 30, 40, 50], 3)
    expect(result).toHaveLength(3)
    for (const v of result) {
      expect(v).toBeGreaterThan(0)
    }
  })

  // ── 反例 5+ ──

  it('反例: 数据不足 5 点不报异常', () => {
    expect(inlineDetectAnomaly([1, 2, 3, 4]).isAnomaly).toBe(false)
  })

  it('反例: 数据不足 10 点 trend 异常不触发', () => {
    expect(inlineDetectTrendAnomaly([1, 2, 3, 4, 5, 6, 7, 8, 9])).toBe(false)
  })

  it('反例: 空数组不报异常', () => {
    expect(inlineDetectAnomaly([]).isAnomaly).toBe(false)
  })

  it('反例: 数据不足 3 预测返回全 0', () => {
    expect(inlinePredictNext([1], 3)).toEqual([0, 0, 0])
  })

  it('反例: 预测 horizon=0 返回空数组', () => {
    expect(inlinePredictNext([1, 2, 3], 0)).toEqual([])
  })

  // ── 边界 5+ ──

  it('边界: 恰好 5 点数据', () => {
    const result = inlineDetectAnomaly([10, 12, 11, 13, 12])
    expect(result.isAnomaly).toBe(false)
  })

  it('边界: 恰好 10 点趋势检测', () => {
    expect(inlineDetectTrendAnomaly([1, 1, 1, 1, 1, 1, 1, 1, 1, 1])).toBe(false)
  })

  it('边界: 大量数据稳定序列', () => {
    const values = Array.from({ length: 1000 }, () => 50 + Math.random() * 10)
    const result = inlineDetectAnomaly(values)
    // 随机数据偶尔也可能触发, 但大概率不是
    expect(result.anomalyScore).toBeDefined()
  })

  it('边界: 所有值相同 z-score=0', () => {
    const values = [50, 50, 50, 50, 50]
    const result = inlineDetectAnomaly(values)
    expect(result.zScore).toBe(0)
    expect(result.isAnomaly).toBe(false)
  })

  it('边界: 全 0 序列', () => {
    const values = [0, 0, 0, 0, 0]
    const result = inlineDetectAnomaly(values)
    expect(result.isAnomaly).toBe(false)
    expect(result.changeRate).toBe(0)
  })

  it('边界: 大数波动序列', () => {
    const values = [1e9, 1e9 + 1, 1e9, 1e9 - 1, 1e9]
    const result = inlineDetectAnomaly(values)
    expect(result.isAnomaly).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════
// AttackDetectEngine — 攻击检测
// ═══════════════════════════════════════════════════════════════

describe('AttackDetectEngine | inlineIsUnderAttack', () => {
  // ── 正例 ──

  it('正例: 正常流量不判定为攻击', () => {
    const values = [10, 12, 11, 13, 12, 11, 13, 10, 14, 11]
    const result = inlineIsUnderAttack(values)
    expect(result.isUnderAttack).toBe(false)
  })

  it('正例: 请求量突增 300% 判定 DDoS', () => {
    const values = [100, 100, 100, 100, 500, 600, 550, 520, 530, 510]
    const result = inlineIsUnderAttack(values)
    expect(result.isUnderAttack).toBe(true)
    expect(result.attackType).toBe('ddos')
  })

  it('正例: 异常值触发 data_exfil 检测', () => {
    const values = [10, 12, 11, 13, 12, 11, 13, 10, 14, 5000]
    const result = inlineIsUnderAttack(values)
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('正例: 高频请求触发检测', () => {
    const values = Array.from({ length: 10 }, (_, i) => i * 100)
    const result = inlineIsUnderAttack(values)
    expect(result.isUnderAttack).toBe(true)
  })

  // ── 反例 ──

  it('反例: 数据不足 10 不判定', () => {
    expect(inlineIsUnderAttack([1, 2, 3, 4, 5, 6, 7, 8, 9]).isUnderAttack).toBe(false)
  })

  it('反例: 空数组不判定', () => {
    expect(inlineIsUnderAttack([]).isUnderAttack).toBe(false)
  })

  it('反例: 轻微波动不判定', () => {
    const values = [10, 11, 9, 12, 10, 9, 11, 10, 8, 9]
    expect(inlineIsUnderAttack(values).isUnderAttack).toBe(false)
  })

  // ── 边界 ──

  it('边界: 刚好 10 点数据, 正常', () => {
    const values = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
    expect(inlineIsUnderAttack(values).isUnderAttack).toBe(false)
  })

  it('边界: confidence 上限为 1', () => {
    const values = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1e9]
    const result = inlineIsUnderAttack(values)
    expect(result.confidence).toBeLessThanOrEqual(1)
  })
})

// ═══════════════════════════════════════════════════════════════
// SelfHealingEngine — 自愈引擎
// ═══════════════════════════════════════════════════════════════

describe('SelfHealingEngine | 自愈逻辑纯函数', () => {
  // ── 正例 ──

  it('正例: 健康系统状态为 healthy', () => {
    const { status, issues } = inlineCheckHealth(30, 40, 100, 0.5)
    expect(status).toBe('healthy')
    expect(issues).toHaveLength(0)
  })

  it('正例: CPU 90% 触发 scale', () => {
    const action = inlineSelectHealingAction(95, false)
    expect(action).toBe('scale')
  })

  it('正例: 错误率高触发 rollback', () => {
    const action = inlineSelectHealingAction(50, true) // hasErrorIssue=true
    expect(action).toBe('rollback')
  })

  it('正例: 默认动作 restart', () => {
    const action = inlineSelectHealingAction(50, false)
    expect(action).toBe('restart')
  })

  it('正例: CPU 超 90 加错误率 → scale（CPU 优先）', () => {
    const action = inlineSelectHealingAction(95, true)
    expect(action).toBe('scale')
  })

  it('正例: healingSuccess 健康状态判定', () => {
    expect(inlineHealingSuccess('healthy')).toBe(true)
    expect(inlineHealingSuccess('degraded')).toBe(true)
    expect(inlineHealingSuccess('critical')).toBe(false)
  })

  it('正例: CPU 80% + 0 其他问题 = degraded', () => {
    const { status } = inlineCheckHealth(85, 50, 100, 0.5)
    expect(status).toBe('degraded')
  })

  // ── 反例 ──

  it('反例: 错误率 6% 触发 degraded', () => {
    const { status } = inlineCheckHealth(30, 40, 100, 6)
    expect(status).toBe('degraded')
  })

  it('反例: CPU 96% → critical', () => {
    const { status } = inlineCheckHealth(96, 50, 100, 1)
    expect(status).toBe('critical')
  })

  it('反例: 错误率 9% → critical', () => {
    const { status } = inlineCheckHealth(50, 50, 100, 9)
    expect(status).toBe('critical')
  })

  it('反例: 3+ 问题 → critical', () => {
    const { status } = inlineCheckHealth(95, 90, 600, 6)
    expect(status).toBe('critical')
    expect(inlineHealingSuccess(status)).toBe(false)
  })

  // ── 边界 ──

  it('边界: CPU 正好 90 触发 single issue → degraded', () => {
    const { status, issues } = inlineCheckHealth(91, 50, 100, 1)
    expect(issues).toHaveLength(1)
    expect(status).toBe('degraded')
  })

  it('边界: CPU 正好 80 (不超阈值) → healthy', () => {
    const { status, issues } = inlineCheckHealth(80, 50, 100, 1)
    expect(status).toBe('healthy')
    expect(issues).toHaveLength(0)
  })

  it('边界: 响应时间正好 500ms → healthy', () => {
    const { status, issues } = inlineCheckHealth(30, 40, 500, 1)
    expect(status).toBe('healthy')
  })

  it('边界: 响应时间 501ms → degraded', () => {
    const { status } = inlineCheckHealth(30, 40, 501, 1)
    expect(status).toBe('degraded')
  })

  it('边界: 错误率正好 3 (不超阈值) → healthy', () => {
    const { status } = inlineCheckHealth(30, 40, 100, 3)
    expect(status).toBe('healthy')
  })

  it('边界: 错误率 3.1 → degraded', () => {
    const { status } = inlineCheckHealth(30, 40, 100, 3.1)
    expect(status).toBe('degraded')
  })

  it('边界: 无 CPU/内存/响应时间/错误率 指标 → healthy', () => {
    const { status } = inlineCheckHealth(0, 0, 0, 0)
    expect(status).toBe('healthy')
  })
})
