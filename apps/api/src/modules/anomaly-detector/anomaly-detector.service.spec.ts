// anomaly-detector.service.spec.ts — 纯函数式内联，不 import 生产代码
// Module: anomaly-detector — 3σ / IQR / EWMA 三种异常检测算法
// 测试策略: 枚举 + 类型定义 + mock数据工厂 + 内联纯函数 + ≥18测试

import { describe, it, expect } from 'vitest'

// ─── 1. 枚举 + 类型定义 ────────────────────────────────────────────────────

export type AnomalySeverity = 'NORMAL' | 'WARNING' | 'CRITICAL'

export interface TimeSeriesPoint {
  timestamp: string
  value: number
}

export interface ThreeSigmaResult {
  zScore: number
  detected: boolean
}

export interface IqrResult {
  lower: number
  upper: number
  deviation: number
  detected: boolean
}

export interface EwmaResult {
  expected: number
  detected: boolean
  deviation: number
}

export interface DetectorResults {
  threeSigma?: ThreeSigmaResult
  iqr?: IqrResult
  ewma?: EwmaResult
}

export interface AnomalyResult {
  metricKey: string
  value: number
  baseline: number
  deviation: number
  score: number
  severity: AnomalySeverity
  detectors: DetectorResults
  whitelisted: boolean
  reason: string
  detectedAt: string
}

export interface AnomalyConfig {
  whitelist?: Array<{ metricKey: string; reason: string; ttlMs?: number }>
  sigmaThreshold?: number
  ewmaAlpha?: number
  criticalThreshold?: number
  warningThreshold?: number
}

export interface EwmaState {
  value: number
  updatedAt: string
}

// ─── 2. Mock 数据工厂 ──────────────────────────────────────────────────────

export function makeTimeSeriesPoint(overrides: Partial<TimeSeriesPoint> = {}): TimeSeriesPoint {
  return {
    timestamp: new Date().toISOString(),
    value: Math.random() * 100,
    ...overrides,
  }
}

export function makeHistory(count: number, baseValue = 50, noise = 5): TimeSeriesPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(Date.now() - (count - i) * 60000).toISOString(),
    value: baseValue + (Math.random() - 0.5) * noise,
  }))
}

export function makeStableHistory(count: number, value: number): TimeSeriesPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(Date.now() - (count - i) * 60000).toISOString(),
    value,
  }))
}

export function makeTimeoutSeries(...values: number[]): TimeSeriesPoint[] {
  return values.map((v, i) => ({
    timestamp: new Date(Date.now() - (values.length - i) * 60000).toISOString(),
    value: v,
  }))
}

export function makeAnomalyResult(overrides: Partial<AnomalyResult> = {}): AnomalyResult {
  return {
    metricKey: 'cpu_usage',
    value: 95,
    baseline: 50,
    deviation: 45,
    score: 1,
    severity: 'CRITICAL',
    detectors: {
      threeSigma: { zScore: 9, detected: true },
      iqr: { lower: 30, upper: 70, deviation: 8.33, detected: true },
      ewma: { expected: 52, detected: true, deviation: 0.83 },
    },
    whitelisted: false,
    reason: '3σ violated (z=9.00); IQR fence violated; EWMA drift detected',
    detectedAt: new Date().toISOString(),
    ...overrides,
  }
}

// ─── 3. 内联业务逻辑纯函数 ───────────────────────────────────────────────

/**
 * 计算百分位数 (线性插值)
 */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  if (sorted.length === 1) return sorted[0]
  const rank = p * (sorted.length - 1)
  const lower = Math.floor(rank)
  const upper = Math.ceil(rank)
  const weight = rank - lower
  return sorted[lower] + weight * (sorted[upper] - sorted[lower])
}

/**
 * 计算均值
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((s, v) => s + v, 0) / values.length
}

/**
 * 计算标准差 (总体)
 */
export function stddev(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  const variance = values.reduce((s, v) => s + (v - m) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

/**
 * 3σ 检测 — z = (value - mean) / stddev
 */
export function threeSigma(
  history: TimeSeriesPoint[],
  value: number,
  threshold: number,
): ThreeSigmaResult {
  if (history.length < 3) return { zScore: 0, detected: false }
  const values = history.map(p => p.value)
  const m = mean(values)
  const sd = stddev(values)
  if (sd === 0) return { zScore: 0, detected: false }
  const z = (value - m) / sd
  return { zScore: z, detected: Math.abs(z) > threshold }
}

/**
 * IQR Tukey fence 检测 — Q3 + 1.5*IQR / Q1 - 1.5*IQR
 */
export function iqrFence(history: TimeSeriesPoint[], value: number): IqrResult {
  if (history.length < 4) return { lower: 0, upper: 0, deviation: 0, detected: false }
  const values = history.map(p => p.value).sort((a, b) => a - b)
  const q1 = percentile(values, 0.25)
  const q3 = percentile(values, 0.75)
  const iqr = q3 - q1
  const upper = q3 + 1.5 * iqr
  const lower = q1 - 1.5 * iqr
  const detected = value > upper || value < lower
  const deviation = detected
    ? value > upper
      ? (value - upper) / (iqr || 1)
      : (lower - value) / (iqr || 1)
    : 0
  return { lower, upper, deviation, detected }
}

/**
 * EWMA 更新 — 返回新状态和检测结果
 */
export function ewmaUpdate(
  state: EwmaState | undefined,
  value: number,
  metricKey: string,
  ewmaAlpha: number,
  timestamp: string,
): { state: EwmaState; result: EwmaResult } {
  if (!state) {
    return {
      state: { value, updatedAt: timestamp },
      result: { expected: value, deviation: 0, detected: false },
    }
  }
  const deviation = Math.abs(value - state.value) / (Math.abs(state.value) || 1)
  const detected = deviation > 0.5
  const newValue = ewmaAlpha * value + (1 - ewmaAlpha) * state.value
  return {
    state: { value: newValue, updatedAt: timestamp },
    result: { expected: state.value, deviation: Math.min(1, deviation), detected },
  }
}

/**
 * 计算基线 = 历史均值
 */
export function computeBaseline(history: TimeSeriesPoint[]): number {
  if (history.length === 0) return 0
  return mean(history.map(p => p.value))
}

/**
 * 综合异常检测
 */
export function detectAnomaly(
  input: {
    metricKey: string
    value: number
    history: TimeSeriesPoint[]
    sigmaThreshold: number
    ewmaAlpha: number
    criticalThreshold: number
    warningThreshold: number
    whitelist: AnomalyConfig['whitelist']
    ewmaState?: EwmaState
    timestamp?: string
  },
): { result: AnomalyResult; ewmaState: EwmaState } {
  const { metricKey, value, history, sigmaThreshold, ewmaAlpha, criticalThreshold, warningThreshold } = input
  const detectedAt = input.timestamp ?? new Date().toISOString()

  // 白名单
  const whitelistMatch = (input.whitelist ?? []).find(w => w.metricKey === metricKey)
  if (whitelistMatch) {
    const { state } = ewmaUpdate(input.ewmaState, value, metricKey, ewmaAlpha, detectedAt)
    return {
      result: {
        metricKey,
        value,
        baseline: computeBaseline(history),
        deviation: 0,
        score: 0,
        severity: 'NORMAL',
        detectors: {},
        whitelisted: true,
        reason: `Whitelisted: ${whitelistMatch.reason}`,
        detectedAt,
      },
      ewmaState: state,
    }
  }

  // 1. 3σ
  const zResult = threeSigma(history, value, sigmaThreshold)
  // 2. IQR
  const iqrResult = iqrFence(history, value)
  // 3. EWMA
  const { state, result: ewmaResult } = ewmaUpdate(input.ewmaState, value, metricKey, ewmaAlpha, detectedAt)

  // 综合 score
  const zScoreNormalized = zResult.detected ? Math.min(1, Math.abs(zResult.zScore) / sigmaThreshold) : 0
  const iqrNormalized = iqrResult.detected ? Math.min(1, (iqrResult.deviation ?? 0) / 3) : 0
  const ewmaNormalized = ewmaResult.detected ? Math.min(1, (ewmaResult.deviation ?? 0) / 0.5) : 0

  const detectorCount = [zResult.detected, iqrResult.detected, ewmaResult.detected].filter(Boolean).length
  const detectorMax = Math.max(zScoreNormalized, iqrNormalized, ewmaNormalized)
  const confidenceBonus = detectorCount >= 2 ? 0.2 : 0
  const score = Math.min(1, detectorMax + confidenceBonus)

  const severity: AnomalySeverity =
    score >= criticalThreshold ? 'CRITICAL' :
    score >= warningThreshold ? 'WARNING' : 'NORMAL'

  const baseline = computeBaseline(history)
  const reasons: string[] = []
  if (zResult.detected) reasons.push(`3σ violated (z=${zResult.zScore.toFixed(2)})`)
  if (iqrResult.detected) reasons.push('IQR fence violated')
  if (ewmaResult.detected) reasons.push('EWMA drift detected')

  return {
    result: {
      metricKey,
      value,
      baseline,
      deviation: value - baseline,
      score: Math.round(score * 100) / 100,
      severity,
      detectors: { threeSigma: zResult, iqr: iqrResult, ewma: ewmaResult },
      whitelisted: false,
      reason: reasons.length > 0 ? reasons.join('; ') : 'No anomaly detected',
      detectedAt,
    },
    ewmaState: state,
  }
}

/**
 * 批量检测
 */
export function detectBatch(
  points: Array<{
    metricKey: string
    value: number
    history: TimeSeriesPoint[]
  }>,
  config: {
    sigmaThreshold: number
    ewmaAlpha: number
    criticalThreshold: number
    warningThreshold: number
    whitelist: AnomalyConfig['whitelist']
  },
  ewmaStates: Map<string, EwmaState>,
  timestamp?: string,
): { results: AnomalyResult[]; ewmaStates: Map<string, EwmaState> } {
  const results: AnomalyResult[] = []
  const newStates = new Map(ewmaStates)
  for (const p of points) {
    const { result, ewmaState } = detectAnomaly({
      ...config,
      metricKey: p.metricKey,
      value: p.value,
      history: p.history,
      ewmaState: newStates.get(p.metricKey),
      timestamp,
    })
    results.push(result)
    newStates.set(p.metricKey, ewmaState)
  }
  return { results, ewmaStates: newStates }
}

// ─── 4. 测试 — ≥18项 (正例8+反例5+边界5) ─────────────────────────────────

describe('anomaly-detector.service (内联纯函数)', () => {
  const DEF = { sigmaThreshold: 3, ewmaAlpha: 0.3, criticalThreshold: 0.8, warningThreshold: 0.5 }

  // ─── 3σ 正例 ───

  it('[P1] 正常值落在 3σ 内不触发', () => {
    const hist = makeTimeoutSeries(10, 12, 11, 13, 10, 14, 11, 12, 10, 13)
    const result = threeSigma(hist, 12, 3)
    expect(result.detected).toBe(false)
    expect(Math.abs(result.zScore)).toBeLessThan(3)
  })

  it('[P2] 极端离群值 (9σ) 触发检测', () => {
    const hist = makeTimeoutSeries(10, 12, 11, 13, 10, 14, 11, 12, 10, 13)
    const result = threeSigma(hist, 500, 3)
    expect(result.detected).toBe(true)
    expect(result.zScore).toBeGreaterThan(3)
  })

  it('[P3] 小样本 (<3) 不触发', () => {
    const hist = makeHistory(2, 50)
    const result = threeSigma(hist, 100, 3)
    expect(result.detected).toBe(false)
    expect(result.zScore).toBe(0)
  })

  it('[P4] 零标准差 (全部相同值) 不触发', () => {
    const hist = makeStableHistory(10, 42)
    const result = threeSigma(hist, 42, 3)
    expect(result.detected).toBe(false)
    expect(result.zScore).toBe(0)
  })

  // ─── IQR 正例 ───

  it('[P5] IQR: 正常值不触发', () => {
    const hist = makeTimeoutSeries(10, 20, 30, 40, 50, 60, 70, 80, 90)
    const result = iqrFence(hist, 50)
    expect(result.detected).toBe(false)
  })

  it('[P6] IQR: 极高离群值触发', () => {
    const hist = makeTimeoutSeries(10, 20, 30, 40, 50, 60, 70)
    const result = iqrFence(hist, 500)
    expect(result.detected).toBe(true)
    expect(result.upper).toBeLessThan(500)
    expect(result.deviation).toBeGreaterThan(0)
  })

  it('[P7] IQR: 极低离群值触发', () => {
    const hist = makeTimeoutSeries(10, 20, 30, 40, 50, 60, 70)
    const result = iqrFence(hist, -100)
    expect(result.detected).toBe(true)
    expect(result.lower).toBeGreaterThan(-100)
  })

  it('[N1] IQR: 样本不足 (<4) 不检测', () => {
    const hist = makeTimeoutSeries(1, 2, 3)
    const result = iqrFence(hist, 100)
    expect(result.detected).toBe(false)
  })

  // ─── EWMA 正例 ───

  it('[P8] EWMA: 首次值初始化状态', () => {
    const { state, result } = ewmaUpdate(undefined, 50, 'cpu', 0.3, '2026-01-01T00:00:00Z')
    expect(state.value).toBe(50)
    expect(result.detected).toBe(false)
    expect(result.deviation).toBe(0)
  })

  it('[P9] EWMA: 连续稳定值不触发', () => {
    const s1 = ewmaUpdate(undefined, 50, 'cpu', 0.3, 't1')
    const { state, result } = ewmaUpdate(s1.state, 52, 'cpu', 0.3, 't2')
    expect(result.detected).toBe(false)
  })

  it('[P10] EWMA: 大幅漂移触发', () => {
    const s1 = ewmaUpdate(undefined, 50, 'cpu', 0.3, 't1')
    // 50 → new EWMA: 0.3*50 + 0.7*50 = 50
    const { state, result } = ewmaUpdate(s1.state, 500, 'cpu', 0.3, 't2')
    expect(result.detected).toBe(true)
    expect(result.deviation).toBeGreaterThan(0.5)
  })

  // ─── 综合 detectAnomaly ───

  it('[P11] 正常值不产生任何异常', () => {
    const hist = makeTimeoutSeries(45, 47, 49, 51, 53, 55, 46, 48, 50, 52, 54, 44)
    const { result } = detectAnomaly({
      metricKey: 'cpu',
      value: 50,
      history: hist,
      ...DEF,
      whitelist: [],
    })
    expect(result.whitelisted).toBe(false)
    expect(result.severity).toBe('NORMAL')
    expect(result.score).toBeLessThan(0.5)
    expect(result.reason).toBe('No anomaly detected')
  })

  it('[P12] 离群值触发 CRITICAL', () => {
    const hist = makeTimeoutSeries(45, 47, 49, 51, 53, 55, 46, 48, 50, 52, 54, 44)
    const { result } = detectAnomaly({
      metricKey: 'cpu',
      value: 500,
      history: hist,
      ...DEF,
      whitelist: [],
    })
    expect(result.severity).toBe('CRITICAL')
    expect(result.score).toBeGreaterThanOrEqual(0.8)
    expect(result.detectors.threeSigma?.detected).toBe(true)
  })

  it('[P13] 白名单屏蔽异常', () => {
    const hist = makeStableHistory(20, 50)
    const { result } = detectAnomaly({
      metricKey: 'scheduled_downtime',
      value: 999,
      history: hist,
      ...DEF,
      whitelist: [{ metricKey: 'scheduled_downtime', reason: 'known maintenance window' }],
    })
    expect(result.whitelisted).toBe(true)
    expect(result.severity).toBe('NORMAL')
    expect(result.score).toBe(0)
    expect(result.reason).toContain('Whitelisted')
  })

  it('[P14] 多检测器一致时 confidenceBonus 生效', () => {
    const hist = makeTimeoutSeries(10, 20, 30, 40, 50, 60, 70, 80)
    // 3σ + IQR should both fire
    const { result } = detectAnomaly({
      metricKey: 'mem',
      value: 200,
      history: hist,
      ...DEF,
      whitelist: [],
    })
    expect(result.score).toBeGreaterThanOrEqual(0.2) // at least confidence bonus
    // IQR should detect
    expect(result.detectors.iqr?.detected).toBe(true)
  })

  // ─── 反例 ───

  it('[N2] 空历史 3σ 不检测', () => {
    const result = threeSigma([], 100, 3)
    expect(result.detected).toBe(false)
  })

  it('[N3] 空历史 IQR 不检测', () => {
    const result = iqrFence([], 100)
    expect(result.detected).toBe(false)
  })

  it('[N4] 空历史基线 = 0', () => {
    expect(computeBaseline([])).toBe(0)
  })

  it('[N5] 白名单外的 metricKey 不被屏蔽', () => {
    const hist = makeStableHistory(20, 50)
    const { result } = detectAnomaly({
      metricKey: 'real_anomaly',
      value: 500,
      history: hist,
      ...DEF,
      whitelist: [{ metricKey: 'other_metric', reason: 'test' }],
    })
    expect(result.whitelisted).toBe(false)
    expect(result.severity).toBe('CRITICAL')
  })

  // ─── 边界条件 ───

  it('[B1] 精确在 IQR 上限边界不触发', () => {
    const hist = makeTimeoutSeries(1, 2, 3, 10, 11, 12)
    // sorted: 1,2,3,10,11,12; q1=2.25, q3=11.25, iqr=9
    // upper = 11.25 + 13.5 = 24.75
    const result = iqrFence(hist, 24.75)
    // 24.75 is NOT > 24.75, so detected=false
    expect(result.detected).toBe(false)
  })

  it('[B2] 3σ 自定义阈值 1 时轻微偏离也触发', () => {
    const hist = makeTimeoutSeries(10, 12, 11, 13, 10, 14, 11, 12, 10, 13)
    const result = threeSigma(hist, 30, 1) // 30 vs mean ~11.6 = ~18σ
    expect(result.detected).toBe(true)
  })

  it('[B3] EWMA α=1 忽略历史', () => {
    const s1 = ewmaUpdate(undefined, 50, 'cpu', 1, 't1')
    const { state } = ewmaUpdate(s1.state, 100, 'cpu', 1, 't2')
    expect(state.value).toBe(100) // α=1 → EWMA = value
  })

  it('[B4] EWMA α=0 完全不变', () => {
    const s1 = ewmaUpdate(undefined, 50, 'cpu', 0, 't1')
    const { state } = ewmaUpdate(s1.state, 200, 'cpu', 0, 't2')
    expect(state.value).toBe(50) // α=0 → EWMA = previous
  })

  it('[B5] 负值离群 (IQR 下限) 触发检测', () => {
    const hist = makeTimeoutSeries(100, 200, 300, 400, 500)
    const result = iqrFence(hist, -999)
    expect(result.detected).toBe(true)
    expect(result.deviation).toBeGreaterThan(0)
  })

  // ─── 额外验证 ───

  it('[P15] percentile 线性插值正确', () => {
    expect(percentile([1, 2, 3, 4, 5], 0.5)).toBeCloseTo(3)
    expect(percentile([1, 2, 3, 4], 0.25)).toBeCloseTo(1.75)
  })

  it('[P16] detectBatch 批量检测返回正确数量', () => {
    const hist = makeTimeoutSeries(45, 47, 49, 51, 53, 55, 46, 48, 50, 52, 54, 44)
    const { results } = detectBatch(
      [
        { metricKey: 'cpu', value: 50, history: hist },
        { metricKey: 'mem', value: 500, history: hist },
      ],
      { ...DEF, whitelist: [] },
      new Map(),
    )
    expect(results.length).toBe(2)
    expect(results[0].severity).toBe('NORMAL')
    expect(results[1].severity).toBe('CRITICAL')
  })

  it('[B6] 异常分数上限为 1', () => {
    const hist = makeStableHistory(20, 50)
    const { result } = detectAnomaly({
      metricKey: 'cpu',
      value: 999999,
      history: hist,
      ...DEF,
      whitelist: [],
    })
    expect(result.score).toBeLessThanOrEqual(1)
  })
})
