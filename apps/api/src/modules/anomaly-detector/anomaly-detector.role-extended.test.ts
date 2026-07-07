import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [anomaly-detector] [C] 角色扩展测试
 *
 * 8 角色视角的异常检测模块扩展深度测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 3 个深层场景测试（复合指标边界 + 级联异常 + 时间窗口 + 恢复模式）
 * 覆盖：白名单 + 阈值调优 + 多算法混合检测 + 连续异常窗口
 */

import 'reflect-metadata'
import { AnomalyDetectorController } from './anomaly-detector.controller'
import { AnomalyDetectorService } from './anomaly-detector.service'
import type { TimeSeriesPoint } from '../time-series/time-series-collector.service'

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

// ── 工具函数 ──
function createController() {
  const service = new AnomalyDetectorService()
  return new AnomalyDetectorController(service)
}

function makeHistory(values: number[]): TimeSeriesPoint[] {
  return values.map((v, i) => ({
    timestamp: new Date(Date.now() - (values.length - i) * 60000).toISOString(),
    value: v,
  }))
}

function makeHistoryWithTime(values: number[], baseTimeMs: number, intervalMs = 60000): TimeSeriesPoint[] {
  return values.map((v, i) => ({
    timestamp: new Date(baseTimeMs + i * intervalMs).toISOString(),
    value: v,
  }))
}

// ================================================================
// 👔 店长 — 运营诊断：门店级复合指标 + 恢复模式 + 跨指标关联
// ================================================================
describe(`${ROLES.StoreManager} anomaly-detector 扩展测试`, () => {
  it('店长检测门店收入 + 客流同步下滑（复合业务异常）', () => {
    const ctrl = createController()
    const normalRevenue = makeHistory([15000, 14800, 15200, 14900, 15100, 14700, 15300, 15000, 14800, 15100])
    const normalTraffic = makeHistory([300, 310, 290, 305, 295, 308, 302, 298, 307, 303])

    const revResult = ctrl.detect({
      metricKey: 'store-daily-revenue',
      value: 2000,
      history: normalRevenue,
    })
    const trafficResult = ctrl.detect({
      metricKey: 'store-daily-traffic',
      value: 30,
      history: normalTraffic,
    })

    expect(revResult.data.severity).not.toBe('NORMAL')
    expect(trafficResult.data.severity).not.toBe('NORMAL')
    // 两个指标都异常 —— 业务紧急度更高
    expect(revResult.data.score).toBeGreaterThan(0.5)
    expect(trafficResult.data.score).toBeGreaterThan(0.5)
  })

  it('店长检测收入回到基线（异常恢复模式）', () => {
    const ctrl = createController()
    const recoveryHistory = makeHistory([10000, 10500, 9800, 10200, 10800]) // 恢复期
    // EWMA 会逐渐跟踪新的水平
    const result = ctrl.detect({
      metricKey: 'store-revenue-recovery',
      value: 10700,
      history: recoveryHistory,
    })
    // 持续恢复，分数应较低
    expect(result.data.score).toBeLessThan(0.4)
    expect(result.data.severity).toBe('NORMAL')
    expect(result.data.deviation).toBeGreaterThan(-500)
  })

  it('店长配置白名单应对促销活动 + 验证白名单覆盖后批量检测结果', () => {
    const ctrl = createController()
    ctrl.configure({
      whitelist: [
        { metricKey: 'store-season-sale-revenue', reason: '换季促销' },
        { metricKey: 'store-season-sale-traffic', reason: '换季促销客流' },
      ],
    })

    const result = ctrl.detectBatch({
      points: [
        { metricKey: 'store-season-sale-revenue', value: 50000, history: makeHistory([15000, 14800, 15200, 14900]) },
        { metricKey: 'store-season-sale-traffic', value: 800, history: makeHistory([300, 310, 290, 305]) },
        { metricKey: 'store-other-metric', value: 999, history: makeHistory([50, 51, 49, 50]) },
      ],
    })

    const whitelisted1 = result.data[0]
    const whitelisted2 = result.data[1]
    const normalCheck = result.data[2]

    expect(whitelisted1.whitelisted).toBe(true)
    expect(whitelisted1.severity).toBe('NORMAL')
    expect(whitelisted2.whitelisted).toBe(true)
    expect(whitelisted2.severity).toBe('NORMAL')
    // 非白名单指标正常检测 - 用异常时间长的历史触发检测
    expect(normalCheck.detectors.threeSigma).toBeDefined()
    expect(normalCheck.score).toBeGreaterThan(0)
  })

  it('店长检测稳态指标 + 数据抖动但不触发告警（稳健性）', () => {
    const ctrl = createController()
    const steadyWithNoise = makeHistory([100, 100.5, 99.8, 100.2, 99.9, 100.1, 100.3, 99.7, 100.0, 100.4])

    const result = ctrl.detect({
      metricKey: 'stable-metric',
      value: 100.2,
      history: steadyWithNoise,
    })

    expect(result.data.severity).toBe('NORMAL')
    expect(result.data.score).toBeLessThan(0.15)
  })
})

// ================================================================
// 🛒 前台 — 收银异常：排队趋势 + 退单比例 + 设备离线连续窗口
// ================================================================
describe(`${ROLES.FrontDesk} anomaly-detector 扩展测试`, () => {
  it('前台检测收银台连续排队时间超标（连续异常窗口）', () => {
    const ctrl = createController()
    const queueHistory = makeHistory([2, 3, 2, 4, 3, 2, 3, 2, 4, 2])

    const result = ctrl.detect({
      metricKey: 'cashier-queue-peak',
      value: 45,
      history: queueHistory,
    })

    expect(result.data.severity).not.toBe('NORMAL')
    expect(result.data.score).toBeGreaterThan(0.6)
    expect(result.data.metricKey).toBe('cashier-queue-peak')
    // 3σ 应该检测到极端值
    expect(result.data.detectors.threeSigma).toBeDefined()
    expect(result.data.detectors.threeSigma!.zScore).toBeGreaterThan(15)
  })

  it('前台检测退单率异常升高（支付问题诊断）', () => {
    const ctrl = createController()
    const refundHistory = makeHistory([0.01, 0.02, 0.01, 0.03, 0.02, 0.01, 0.02, 0.03, 0.01, 0.02])

    const result = ctrl.detect({
      metricKey: 'cashier-refund-rate',
      value: 0.5, // 50% 退单率
      history: refundHistory,
    })

    expect(result.data.severity).not.toBe('NORMAL')
    expect(result.data.deviation).toBeGreaterThan(0.4)
  })

  it('前台配置 sigma 阈值调低以更敏感发现微小趋势异常', () => {
    const ctrl = createController()
    ctrl.configure({ sigmaThreshold: 2.0 })

    const history = makeHistory([10, 11, 9, 10, 12, 11, 10, 9, 11, 10])
    const result = ctrl.detect({
      metricKey: 'small-shift-metric',
      value: 18, // sigma=2 时 z-score ~5.3, 应检测到
      history,
    })

    // sigmaThreshold=2 时 3σ 应触发
    expect(result.data.detectors.threeSigma?.detected).toBe(true)
    expect(result.data.score).toBeGreaterThan(0.4)
  })

  it('前台处理极端缺失历史数据（边缘：只有 1 个历史点）', () => {
    const ctrl = createController()
    const minimalHistory = makeHistory([10])

    // 只有一个历史点，3σ(需≥3)和IQR(需≥4)静默，但EWMA有初始值
    const result = ctrl.detect({
      metricKey: 'first-ever-metric',
      value: 999,
      history: minimalHistory,
    })

    expect(result.data.severity).toBe('NORMAL')
    // threeSigma 返回 {zScore:0, detected: false} 而非 undefined
    expect(result.data.detectors.threeSigma!.detected).toBe(false)
    expect(result.data.detectors.iqr).toBeUndefined()
    expect(result.data.detectors.ewma).toBeDefined() // EWMA 记录初始值
  })
})

// ================================================================
// 👥 HR — 人事异常：工时每月波动 + 离职趋势 + 排班轮转异常
// ================================================================
describe(`${ROLES.HR} anomaly-detector 扩展测试`, () => {
  it('HR 检测月度加班工时异常（EWMA 趋势检测）', () => {
    const ctrl = createController()
    // 加班工时逐渐上升趋势
    const overtimeHistory = makeHistory([10, 12, 11, 15, 14, 18, 16, 22, 20, 25])

    // 先预热EWMA
    ctrl.detect({
      metricKey: 'monthly-overtime-hours',
      value: 25,
      history: overtimeHistory,
    })

    const result = ctrl.detect({
      metricKey: 'monthly-overtime-hours',
      value: 40, // 继续上升趋势，偏离EWMA预期
      history: overtimeHistory,
    })

    // EWMA deviation 被归一化到 [0,1]
    expect(result.data.detectors.ewma).toBeDefined()
    if (result.data.detectors.ewma) {
      expect(result.data.detectors.ewma.detected).toBe(true)
    }
    expect(result.data.score).toBeGreaterThan(0)
    expect(result.data.severity).not.toBe('NORMAL')
  })

  it('HR 配置自定义 criticalThreshold 后正常指标仍不误报', () => {
    const ctrl = createController()
    ctrl.configure({ criticalThreshold: 0.9, warningThreshold: 0.7 })

    const history = makeHistory([10, 12, 11, 10, 12, 11, 10, 12, 11, 10])
    const result = ctrl.detect({
      metricKey: 'stable-attrition-rate',
      value: 11,
      history,
    })

    expect(result.data.severity).toBe('NORMAL')
    expect(result.data.score).toBeLessThan(0.3)
  })

  it('HR 批量检测多个月度指标（离职率 + 入职率 + 满意度）', () => {
    const ctrl = createController()

    const result = ctrl.detectBatch({
      points: [
        { metricKey: 'monthly-attrition-rate', value: 0.35, history: makeHistory([0.02, 0.03, 0.02, 0.04, 0.03, 0.02, 0.03]) },
        { metricKey: 'monthly-hire-rate', value: 0.04, history: makeHistory([0.03, 0.04, 0.03, 0.05, 0.04, 0.03, 0.04]) },
        { metricKey: 'employee-satisfaction', value: 4.2, history: makeHistory([4.1, 4.3, 4.2, 4.4, 4.2, 4.3, 4.1, 4.2]) },
      ],
    })

    expect(result.data.length).toBe(3)
    // 离职率异常高
    expect(result.data[0].severity).not.toBe('NORMAL')
    // 入职率和满意度正常
    expect(result.data[1].severity).toBe('NORMAL')
    expect(result.data[2].severity).toBe('NORMAL')
  })

  it('HR 检测连续 3 月离职率攀升（EWMA 趋势累计偏差）', () => {
    const ctrl = createController()
    // 从 0.02 缓慢攀升到 0.08
    const climbingHistory = makeHistory([0.02, 0.02, 0.03, 0.03, 0.04, 0.04, 0.05, 0.05, 0.06, 0.07])

    const result = ctrl.detect({
      metricKey: 'attrition-rolling-3m',
      value: 0.10,
      history: climbingHistory,
    })

    // 趋势上升，EWMA 可能检测
    expect(result.data.score).toBeGreaterThan(0.3)
    expect(result.data.baseline).toBeGreaterThan(0.03)
  })
})

// ================================================================
// 🔧 安监 — 安全异常：传感器级联报警 + 设备离线恢复 + 深夜异常窗口
// ================================================================
describe(`${ROLES.Security} anomaly-detector 扩展测试`, () => {
  it('安监检测传感器级联离线（多个传感器连续离线）', () => {
    const ctrl = createController()
    const sensorHistory = makeHistory([0.5, 0.6, 0.7, 0.5, 0.6, 0.7, 0.5, 0.6, 0.7, 0.5])

    const sensor1 = ctrl.detect({ metricKey: 'sensor-temp-01', value: -1, history: sensorHistory })
    const sensor2 = ctrl.detect({ metricKey: 'sensor-humidity-01', value: -1, history: sensorHistory })

    // 多个传感器同时偏离正常范围
    expect(sensor1.data.severity).not.toBe('NORMAL')
    expect(sensor2.data.severity).not.toBe('NORMAL')
    expect(sensor1.data.score).toBeGreaterThan(0.5)
    expect(sensor2.data.score).toBeGreaterThan(0.5)
  })

  it('安监检测设备从离线恢复在线（异常→正常过渡）', () => {
    const ctrl = createController()
    const offlineHistory = makeHistory([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

    // 设备恢复在线
    const result = ctrl.detect({
      metricKey: 'camera-003-status',
      value: 1,
      history: offlineHistory,
    })

    // 对异常视角来说 0→1 也是偏离基线的，但这是恢复，不应报警
    expect(result.data.severity).toBe('NORMAL')
  })

  it('安监批量检测夜间安防指标（多传感器夜间模式）', () => {
    const ctrl = createController()

    // 夜间各指标正常
    const result = ctrl.detectBatch({
      points: [
        { metricKey: 'night-door-sensor', value: 0, history: makeHistory([0, 0, 0, 0, 0, 0]) },
        { metricKey: 'night-motion-sensor', value: 0, history: makeHistory([0, 0, 0, 0, 0, 0]) },
        { metricKey: 'night-window-sensor', value: 0, history: makeHistory([0, 0, 0, 0, 0, 0]) },
        { metricKey: 'night-fire-alarm', value: 0, history: makeHistory([0, 0, 0, 0, 0, 0]) },
      ],
    })

    expect(result.data.length).toBe(4)
    for (const r of result.data) {
      expect(r.severity).toBe('NORMAL')
      expect(r.detectedAt).toBeDefined()
    }
  })

  it('安监检测深夜门禁异常开门（时间窗口敏感的极小值变化）', () => {
    const ctrl = createController()
    const nightHistory = makeHistory([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

    const result = ctrl.detect({
      metricKey: 'backdoor-access',
      value: 5, // 深夜 5 次开门
      history: nightHistory,
    })

    expect(result.data.severity).not.toBe('NORMAL')
    expect(result.data.score).toBeGreaterThan(0.4)
    // 此类偏差 EWMA 应敏感
    expect(result.data.detectors.ewma).toBeDefined()
  })
})

// ================================================================
// 🎮 导玩员 — 设备异常：设备使用率离散 + 多机同时异常 + 复位检测
// ================================================================
describe(`${ROLES.Guide} anomaly-detector 扩展测试`, () => {
  it('导玩员检测游乐设备使用率 0%（停摆异常）', () => {
    const ctrl = createController()
    const usageHistory = makeHistory([0.6, 0.7, 0.5, 0.8, 0.65, 0.7, 0.55, 0.75, 0.6, 0.7])

    const result = ctrl.detect({
      metricKey: 'game-machine-utilization',
      value: 0, // 设备完全闲置
      history: usageHistory,
    })

    expect(result.data.severity).not.toBe('NORMAL')
    expect(result.data.deviation).toBeLessThan(-0.5)
    expect(result.data.score).toBeGreaterThan(0.5)
  })

  it('导玩员使用 σ=2.5 调优后对小幅异常更敏感', () => {
    const ctrl = createController()
    ctrl.configure({ sigmaThreshold: 2.5 })

    const history = makeHistory([0.6, 0.7, 0.65, 0.55, 0.7, 0.6, 0.65, 0.55, 0.7, 0.6])
    const result = ctrl.detect({
      metricKey: 'ride-usage',
      value: 0.1, // 远低于基线，应触发
      history,
    })

    expect(result.data.detectors.threeSigma?.detected).toBe(true)
    expect(result.data.score).toBeGreaterThan(0.4)
  })

  it('导玩员批量检测多台游戏机健康状态', () => {
    const ctrl = createController()
    const normalHistory = makeHistory([0, 0, 0, 0, 0, 0, 0])

    const result = ctrl.detectBatch({
      points: [
        { metricKey: 'machine-error-code-01', value: 0, history: normalHistory },
        { metricKey: 'machine-error-code-02', value: 0, history: normalHistory },
        { metricKey: 'machine-error-code-03', value: 0, history: normalHistory },
        { metricKey: 'machine-error-code-04', value: 404, history: normalHistory }, // 异常
        { metricKey: 'machine-error-code-05', value: 0, history: normalHistory },
      ],
    })

    expect(result.data.length).toBe(5)
    expect(result.data[0].severity).toBe('NORMAL')
    expect(result.data[1].severity).toBe('NORMAL')
    expect(result.data[2].severity).toBe('NORMAL')
    expect(result.data[3].severity).not.toBe('NORMAL')
    expect(result.data[4].severity).toBe('NORMAL')
  })

  it('导玩员检测使用率逐步下滑趋势（设备老旧信号）', () => {
    const ctrl = createController()
    // 使用率从 0.8 逐步降到 0.3
    const decliningHistory = makeHistory([0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4, 0.35])

    // 预热EWMA
    ctrl.detect({
      metricKey: 'old-machine-usage',
      value: 0.35,
      history: decliningHistory,
    })

    const result = ctrl.detect({
      metricKey: 'old-machine-usage',
      value: 0.28, // 继续下滑，偏离EWMA
      history: decliningHistory,
    })

    expect(result.data.detectors.ewma?.detected).toBe(true)
  })
})

// ================================================================
// 🎯 运行专员 — 系统运维：CPU/内存/磁盘复合 + 恢复 + 配置调优
// ================================================================
describe(`${ROLES.Operations} anomaly-detector 扩展测试`, () => {
  it('运行专员检测 CPU + 内存 + IO 同时异常（系统级雪崩）', () => {
    const ctrl = createController()
    const normalCpu = makeHistory([30, 32, 28, 31, 29, 33, 30, 31, 28, 29])
    const normalMem = makeHistory([60, 62, 58, 61, 59, 63, 60, 61, 58, 59])
    const normalIO = makeHistory([20, 22, 21, 19, 23, 20, 22, 21, 20, 19])

    const cpuResult = ctrl.detect({ metricKey: 'cpu-usage', value: 98, history: normalCpu })
    const memResult = ctrl.detect({ metricKey: 'mem-usage', value: 99, history: normalMem })
    const ioResult = ctrl.detect({ metricKey: 'disk-io', value: 99, history: normalIO })

    expect(cpuResult.data.severity).toBe('CRITICAL')
    expect(memResult.data.severity).toBe('CRITICAL')
    expect(ioResult.data.severity).not.toBe('NORMAL')
  })

  it('运行专员检测节点从高负载恢复（异常→正常确认）', () => {
    const ctrl = createController()
    // 节点重启后恢复正常
    const recoveryCpu = makeHistory([95, 94, 90, 85, 70, 55, 45, 40, 35, 32])

    const result = ctrl.detect({
      metricKey: 'node-recovery-cpu',
      value: 30,
      history: recoveryCpu,
    })

    // 若 EWMA 已跟上，应为正常
    expect(result.data.score).toBeLessThan(0.4)
  })

  it('运行专员配置后验证配置持久化到新检测中', () => {
    const ctrl = createController()

    // 先调低阈值
    ctrl.configure({ sigmaThreshold: 2, criticalThreshold: 0.5, warningThreshold: 0.3 })

    // 用新 controller（service 应反映新配置？实际测试中 service 实例不同，需同实例）
    // 但 controller 每次创建新 service，保留在同一个 controller 上
    const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101])

    // sigma=2 下 3σ 检测更灵敏
    const result = ctrl.detect({
      metricKey: 'tuned-sigma-metric',
      value: 115,
      history,
    })

    // 原 sigma=3 时 z=(115-100.1)/1.37≈10.9 都 >3；sigma=2 更灵敏
    expect(result.data.detectors.threeSigma?.detected).toBe(true)
    // severity 取决于 deviation 映射到分数
    expect(result.data.score).toBeGreaterThan(0)
  })

  it('运行专员批量检测含空历史数据点的指标（边缘：稀疏数据）', () => {
    const ctrl = createController()

    const result = ctrl.detectBatch({
      points: [
        { metricKey: 'sparse-metric', value: 42, history: [] },
      ],
    })

    expect(result.data.length).toBe(1)
    // 无历史数据，3σ(需≥3)和IQR(需≥4)静默返回 {detected:false}
    expect(result.data[0].severity).toBe('NORMAL')
    // 3σ 返回 {zScore:0,detected:false} 而非 undefined
    expect(result.data[0].detectors.threeSigma!.detected).toBe(false)
    expect(result.data[0].detectors.iqr).toBeUndefined()
  })
})

// ================================================================
// 🤝 团建 — 活动异常：预算 + 参与率 + 反馈评分 + 年度对比
// ================================================================
describe(`${ROLES.Teambuilding} anomaly-detector 扩展测试`, () => {
  it('团建检测季度活动预算异常超支', () => {
    const ctrl = createController()
    const budgetHistory = makeHistory([5000, 4800, 5200, 4900, 5100, 4700, 5300, 5000, 4800, 5100])

    const result = ctrl.detect({
      metricKey: 'quarterly-activity-budget',
      value: 60000, // 通常~5000，异常10倍
      history: budgetHistory,
    })

    expect(result.data.severity).not.toBe('NORMAL')
    expect(result.data.score).toBeGreaterThan(0.7)
    expect(result.data.deviation).toBeGreaterThan(50000)
  })

  it('团建检测活动满意度评分异常下跌', () => {
    const ctrl = createController()
    const satisfactionHistory = makeHistory([4.5, 4.3, 4.6, 4.4, 4.7, 4.2, 4.5, 4.6, 4.4, 4.5])

    const result = ctrl.detect({
      metricKey: 'activity-satisfaction',
      value: 1.2,
      history: satisfactionHistory,
    })

    expect(result.data.severity).not.toBe('NORMAL')
    expect(result.data.baseline).toBeGreaterThan(4)
    expect(result.data.deviation).toBeLessThan(-3)
  })

  it('团建检测年度活动频次异常（全年活动对比）', () => {
    const ctrl = createController()
    const freqHistory = makeHistory([3, 4, 3, 5, 4, 6, 3, 5, 4, 4])

    // 全年只有 0 次活动，严重异常
    const result = ctrl.detect({
      metricKey: 'yearly-team-building-count',
      value: 0,
      history: freqHistory,
    })

    expect(result.data.severity).not.toBe('NORMAL')
    expect(result.data.score).toBeGreaterThan(0.5)
  })

  it('团建批量检测多个团建指标（预算+参与+反馈综合健康度）', () => {
    const ctrl = createController()

    const result = ctrl.detectBatch({
      points: [
        { metricKey: 'activity-budget-spent', value: 200000, history: makeHistory([5000, 4800, 5200, 4900]) },
        // 参与率基线约0.76，0.85在正常方差内
        { metricKey: 'activity-participation-rate', value: 0.85, history: makeHistory([0.75, 0.78, 0.72, 0.8, 0.76, 0.80, 0.79, 0.77, 0.81, 0.82]) },
        // 反馈评分4.2波动小，在正常范围
        { metricKey: 'activity-feedback-score', value: 4.2, history: makeHistory([4.1, 4.3, 4.2, 4.4, 4.2, 4.3, 4.1, 4.2, 4.3, 4.2]) },
      ],
    })

    expect(result.data.length).toBe(3)
    // 预算超支严重
    expect(result.data[0].severity).not.toBe('NORMAL')
    // 有更多历史的参与率和反馈正常
    expect(result.data[1].severity).toBe('NORMAL')
    expect(result.data[2].severity).toBe('NORMAL')
  })
})

// ================================================================
// 📢 营销 — 活动效果：转化率 + 广告 ROI + 自然流量 + 竞品对比
// ================================================================
describe(`${ROLES.Marketing} anomaly-detector 扩展测试`, () => {
  it('营销检测广告 ROI 突降为负（投放策略失效）', () => {
    const ctrl = createController()
    const roiHistory = makeHistory([4.5, 4.8, 4.2, 4.6, 4.3, 4.7, 4.4, 4.9, 4.1, 4.5])

    const result = ctrl.detect({
      metricKey: 'ad-roi',
      value: -2.0, // 负 ROI
      history: roiHistory,
    })

    expect(result.data.severity).not.toBe('NORMAL')
    expect(result.data.deviation).toBeLessThan(-6) // 偏离基线 6+
  })

  it('营销检测自然流量异常归零（渠道故障）', () => {
    const ctrl = createController()
    const trafficHistory = makeHistory([5000, 5200, 4800, 5100, 4900, 5300, 4700, 5400, 5050, 5150])

    const result = ctrl.detect({
      metricKey: 'organic-traffic',
      value: 0,
      history: trafficHistory,
    })

    expect(result.data.severity).not.toBe('NORMAL')
    expect(result.data.score).toBeGreaterThan(0.6)
  })

  it('营销检测活动转化率稳步上升（正常正向趋势不应误报）', () => {
    const ctrl = createController()
    // 转化率从 2% 逐步提升到 5%
    const improvingHistory = makeHistory([2.0, 2.3, 2.5, 2.8, 3.1, 3.5, 3.8, 4.0, 4.3, 4.7])

    const result = ctrl.detect({
      metricKey: 'campaign-conversion-trend',
      value: 5.1, // 继续提升
      history: improvingHistory,
    })

    // 正向提升不应告警（仅超出 EWMA 预测时可能低分）
    expect(result.data.score).toBeLessThan(0.4)
  })

  it('营销配置白名单后大促指标 + 内部运营指标混合批量检测', () => {
    const ctrl = createController()
    ctrl.configure({
      whitelist: [
        { metricKey: '618-sale-revenue', reason: '618大促' },
        { metricKey: '618-ad-spend', reason: '618投放增加' },
      ],
    })

    const result = ctrl.detectBatch({
      points: [
        { metricKey: '618-sale-revenue', value: 300000, history: makeHistory([50000, 52000, 48000, 51000]) },
        { metricKey: '618-ad-spend', value: 80000, history: makeHistory([10000, 12000, 8000, 11000]) },
        { metricKey: 'normal-daily-revenue', value: 52000, history: makeHistory([50000, 52000, 48000, 51000]) },
      ],
    })

    // 618 指标白名单 → NORMAL
    expect(result.data[0].whitelisted).toBe(true)
    expect(result.data[0].severity).toBe('NORMAL')
    expect(result.data[1].whitelisted).toBe(true)
    expect(result.data[1].severity).toBe('NORMAL')
    // 常规指标正常 → NORMAL
    expect(result.data[2].severity).toBe('NORMAL')
    expect(result.data[2].score).toBeLessThan(0.2)
  })

  it('营销检测多渠道 ROI 批量对比，识别异常渠道', () => {
    const ctrl = createController()
    const normalHistory = makeHistory([3.0, 3.2, 2.8, 3.1, 3.0, 3.3, 2.9, 3.1, 3.0, 3.2])

    const result = ctrl.detectBatch({
      points: [
        { metricKey: 'channel-wechat-roi', value: 3.1, history: normalHistory },
        { metricKey: 'channel-douyin-roi', value: 15.0, history: normalHistory }, // 异常高（疑似刷量）
        { metricKey: 'channel-xiaohongshu-roi', value: 2.9, history: normalHistory },
      ],
    })

    expect(result.data.length).toBe(3)
    expect(result.data[0].severity).toBe('NORMAL')
    expect(result.data[1].severity).not.toBe('NORMAL') // 抖音 ROI 异常
    expect(result.data[2].severity).toBe('NORMAL')
  })

  it('营销检测极端值大于 1e6（数值边界处理）', () => {
    const ctrl = createController()
    const history = makeHistory([1000, 1200, 900, 1100, 1000, 1300, 950, 1050, 1150, 980])

    const result = ctrl.detect({
      metricKey: 'huge-spike-metric',
      value: 99999999,
      history,
    })

    expect(result.data.score).toBeGreaterThan(0.8)
    expect(result.data.severity).toBe('CRITICAL')
    expect(result.data.detectors.threeSigma?.zScore).toBeGreaterThan(100)
  })
})
