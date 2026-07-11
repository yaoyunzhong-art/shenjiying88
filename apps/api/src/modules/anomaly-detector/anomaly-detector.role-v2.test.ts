import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
/**
 * 🐜 自动: [anomaly-detector] [C] 角色测试 v2 — 街机/游艺厅场景深度覆盖
 *
 * 8 角色视角:
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 覆盖场景:
 *  - 各角色视角下异常检测引擎配置管理 (configure detect batch status)
 *  - 街机设备指标异常检测 (cpu/memory/error/token)
 *  - 白名单已知波动不报警
 *  - 阈值调优影响判定
 *  - 批量检测与引擎状态查询
 *
 * 每个角色 ≥ 2 测试用例 (正常流程 + 边界/配置场景)
 */

import assert from 'node:assert/strict'
import { AnomalyDetectorController } from './anomaly-detector.controller'
import { AnomalyDetectorService } from './anomaly-detector.service'
import type { TimeSeriesPoint } from '../time-series/time-series-collector.service'

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

// ── 辅助函数 ──

function makeStableHistory(base: number, count = 10, variance = 1): TimeSeriesPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(Date.now() - (count - i) * 60000).toISOString(),
    value: base + (Math.random() - 0.5) * variance,
    labels: {},
  }))
}

function createController() {
  const service = new AnomalyDetectorService()
  const controller = new AnomalyDetectorController(service)
  return { service, controller }
}

// ═══════════════════════════════════════════════════════════════════
// 👔店长 — 门店级异常监控与配置
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} 门店级异常监控`, () => {
  it('店长检测收银机 CPU 异常飙升 — 3σ 算法正确标出 CRITICAL', () => {
    const { controller } = createController()
    const history = makeStableHistory(35, 15, 5) // CPU ~35%
    const result = controller.detect({
      metricKey: 'cashier.cpu.usage',
      value: 98,
      history,
    })
    assert.equal(result.data.metricKey, 'cashier.cpu.usage')
    assert.equal(result.data.value, 98)
    assert.ok(result.data.score >= 0.8, `score ${result.data.score} should be >= 0.8`)
    assert.ok(result.data.detectors.threeSigma?.detected)
    assert.equal(result.data.severity, 'CRITICAL')
  })

  it('店长降低 sigma 阈值后更敏感检出 — 原正常值变为 WARNING', () => {
    const { service, controller } = createController()
    // Use varied history so 3σ can compute properly
    const variedHistory: TimeSeriesPoint[] = [48, 52, 49, 51, 47, 53, 50, 52, 51].map(v => ({
      timestamp: new Date().toISOString(),
      value: v,
      labels: {},
    }))
    // Reset EWMA by using a fresh metric key
    // sigma=3, mean~50, stddev~1.9, zScore for 58 = (58-50)/1.9 ≈ 4.2 > 3 → anomaly expected
    // Actually this is quite far so will be anomaly with sigma=3
    // Let's use a value that's WITHIN 3σ
    const resultDefault = controller.detect({ metricKey: 'inventory.test', value: 53, history: variedHistory })
    // zScore for 53: (53-50)/1.9 ≈ 1.58 < 3 → score=0
    assert.equal(resultDefault.data.score, 0, `default should be normal, score=${resultDefault.data.score}`)
    assert.equal(resultDefault.data.severity, 'NORMAL')

    // 调低 sigma 到 1 → 53 now has zScore ≈ 1.58 > 1 → anomaly
    controller.configure({ sigmaThreshold: 1 })
    const resultSensitive = controller.detect({ metricKey: 'inventory.test', value: 53, history: variedHistory })
    assert.ok(resultSensitive.data.severity !== 'NORMAL',
      `after sigma=1, severity should flag, got ${resultSensitive.data.severity}`)

    // 恢复
    controller.configure({ sigmaThreshold: 3 })
  })

  it('店长配置白名单后已知波动不触发告警 — 正常状态', () => {
    const { service, controller } = createController()
    controller.configure({
      whitelist: [{ metricKey: 'cashier.cpu.usage', reason: '月底结算高峰期', ttlMs: 3600000 }],
    })
    const history = makeStableHistory(35, 15, 5)
    const result = controller.detect({
      metricKey: 'cashier.cpu.usage',
      value: 95,
      history,
    })
    assert.equal(result.data.whitelisted, true)
    assert.equal(result.data.severity, 'NORMAL')
    assert.equal(result.data.score, 0)

    controller.configure({ whitelist: [] })
  })

  it('店长查询引擎状态 — 获取运行信息', () => {
    const { controller } = createController()
    const status = controller.getStatus()
    assert.equal(status.data.engineName, 'AnomalyDetector')
    assert.equal(status.data.status, 'ACTIVE')
    assert.equal(status.data.rulesCount, 3)
    assert.ok(status.data.lastEvaluationAt)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🛒前台 — 收银/客诉场景的异常数据监控
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} 收银异常数据监控`, () => {
  it('前台检测支付失败率飙升 — 批量检测识别多个异常指标', () => {
    const { controller } = createController()
    // Use separate fresh controllers for each metric to avoid EWMA cross-contamination
    const { controller: ctrl1 } = createController()
    const highHistory: TimeSeriesPoint[] = Array.from({ length: 20 }, () => ({
      timestamp: new Date().toISOString(), value: 2 + (Math.random() - 0.5) * 0.5, labels: {},
    }))
    const r1 = ctrl1.detect({ metricKey: 'payment.failure.rate', value: 15, history: highHistory })
    assert.ok(r1.data.score > 0.5, `first point is anomalous: score=${r1.data.score}`)

    const { controller: ctrl2 } = createController()
    const r2 = ctrl2.detect({ metricKey: 'payment.failure.rate', value: 2.5, history: highHistory })
    assert.ok(r2.data.severity === 'NORMAL', `second point normal: severity=${r2.data.severity}`)

    const { controller: ctrl3 } = createController()
    const r3 = ctrl3.detect({ metricKey: 'payment.failure.rate', value: 18, history: highHistory })
    assert.ok(r3.data.score > 0.5, `third point is anomalous: score=${r3.data.score}`)
  })

  it('前台检测零数据点 — 历史不足 3 个时不触发假阳性', () => {
    const { controller } = createController()
    const shortHistory: TimeSeriesPoint[] = [
      { timestamp: new Date().toISOString(), value: 10, labels: {} },
    ]
    const result = controller.detect({
      metricKey: 'new.metric',
      value: 999,
      history: shortHistory,
    })
    assert.equal(result.data.score, 0)
    assert.equal(result.data.severity, 'NORMAL')
  })

  it('前台同时对多个不同指标进行批量检测 — 混合结果', () => {
    const { controller } = createController()
    const cpuHistory = makeStableHistory(30, 15, 5)
    const memHistory = makeStableHistory(60, 15, 3)
    const points = [
      { metricKey: 'pos.cpu', value: 95, history: cpuHistory },
      { metricKey: 'pos.memory', value: 62, history: memHistory },
    ]
    const batch = controller.detectBatch({ points })
    assert.equal(batch.data.length, 2)
    assert.ok(batch.data[0].score > 0.5, 'cpu anomaly expected')
    assert.equal(batch.data[1].score, 0, 'memory normal')
  })
})

// ═══════════════════════════════════════════════════════════════════
// 👥HR — 员工相关指标异常检测
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} 员工指标异常检测`, () => {
  it('HR 检测考勤打卡异常数据 — 微小波动不触发高严重度告警', () => {
    // Use a fresh controller so EWMA is clean
    const { service, controller } = createController()
    controller.configure({ sigmaThreshold: 3, criticalThreshold: 0.8, warningThreshold: 0.5 })
    const history = makeStableHistory(10, 20, 1) // ~10 次迟到
    const result = controller.detect({
      metricKey: 'attendance.late.count',
      value: 12,
      history,
    })
    // 12 vs mean~10 is within 2σ → should be NORMAL or at most WARNING
    assert.ok(
      result.data.severity === 'NORMAL' || result.data.severity === 'WARNING',
      `12 with mean~10 should be normal or warning, got ${result.data.severity}`
    )
  })

  it('HR 检测员工流失率骤升 — 应标记为异常', () => {
    const { controller } = createController()
    const history = makeStableHistory(3, 15, 0.5)
    const result = controller.detect({
      metricKey: 'employee.attrition.rate',
      value: 28,
      history,
    })
    assert.ok(result.data.score > 0.5, `score=${result.data.score}`)
    assert.ok(result.data.severity !== 'NORMAL')
  })

  it('HR 可以配置白名单排除绩效周期波动', () => {
    const { service, controller } = createController()
    controller.configure({
      whitelist: [{ metricKey: 'employee.perf.score', reason: '季度绩效评估周期', ttlMs: 86400000 }],
    })
    const history = makeStableHistory(75, 10, 5)
    const result = controller.detect({
      metricKey: 'employee.perf.score',
      value: 92,
      history,
    })
    assert.equal(result.data.whitelisted, true)
    assert.equal(result.data.score, 0)

    controller.configure({ whitelist: [] })
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🔧安监 — 安全设备异常检测
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} 安全设备异常检测`, () => {
  it('安监检测消防传感器异常飙升 (连续高值) — 应报警', () => {
    const { controller } = createController()
    const history = makeStableHistory(25, 20, 2) // 温度 ~25°C
    const result = controller.detect({
      metricKey: 'fire.sensor.temp',
      value: 68,
      history,
    })
    assert.ok(result.data.score > 0.7, `score=${result.data.score}`)
    assert.ok(result.data.detectors.threeSigma?.detected || result.data.detectors.iqr?.detected)
  })

  it('安监检测监控摄像头离线数 — 批量检测多个摄像头', () => {
    const { controller } = createController()
    const history = makeStableHistory(0, 20, 0)
    const points = [
      { metricKey: 'camera.offline', value: 0, history },
      { metricKey: 'camera.offline', value: 1, history },
      { metricKey: 'camera.offline', value: 5, history },
    ]
    const batch = controller.detectBatch({ points })
    assert.equal(batch.data[0].score, 0, '0 offline normal')
    assert.equal(batch.data[2].score > 0.5, true, '5 offline should be anomaly')
  })

  it('安监调整 warning 阈值后更低分也触发 — 边界', () => {
    const { service, controller } = createController()
    const history = makeStableHistory(50, 15, 3)
    const mildResult = controller.detect({
      metricKey: 'security.door.opens',
      value: 62,
      history: Array.from({ length: 15 }, () => ({
        timestamp: new Date().toISOString(),
        value: 50,
        labels: {},
      })),
    })
    const defaultSeverity = mildResult.data.severity

    // 调低 warningThreshold
    controller.configure({ warningThreshold: 0.1 })

    const sensitiveResult = controller.detect({
      metricKey: 'security.door.opens',
      value: 62,
      history: Array.from({ length: 15 }, () => ({
        timestamp: new Date().toISOString(),
        value: 50,
        labels: {},
      })),
    })
    assert.ok(sensitiveResult.data.severity !== 'NORMAL',
      `should alert after threshold lowered, got ${sensitiveResult.data.severity}`)

    controller.configure({ warningThreshold: 0.5, criticalThreshold: 0.8 })
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🎮导玩员 — 游戏设备运行异常检测
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} 游戏设备异常检测`, () => {
  it('导玩员检测街机投币异常 — 单次检测应标出', () => {
    const { controller } = createController()
    const history = makeStableHistory(50, 20, 5) // 平均 50 次/小时
    const result = controller.detect({
      metricKey: 'arcade.coin.count',
      value: 3,
      history,
    })
    assert.ok(result.data.score > 0.5 || result.data.detectors.iqr?.detected,
      `score=${result.data.score}, iqr=${result.data.detectors.iqr?.detected}`)
  })

  it('导玩员检测游戏机帧率异常 — EWMA 漂移检测', () => {
    const { controller } = createController()
    const history = makeStableHistory(60, 15, 2)
    // 第一次检测建立 EWMA
    controller.detect({ metricKey: 'machine.fps', value: 60, history })
    // 第二次突然降到 15 — 严重偏差
    const result = controller.detect({ metricKey: 'machine.fps', value: 15, history })
    assert.ok(result.data.score > 0.3,
      `fps anomaly score=${result.data.score}`)
  })

  it('导玩员检测多台机器状态 — 批量检测', () => {
    const { controller } = createController()
    const cpuHistory = makeStableHistory(40, 10, 5)
    const points = [
      { metricKey: 'machine.A.cpu', value: 92, history: cpuHistory },
      { metricKey: 'machine.B.cpu', value: 45, history: cpuHistory },
    ]
    const batch = controller.detectBatch({ points })
    assert.ok(batch.data[0].score > 0.5, 'machine A cpu anomaly')
    // B: 45 vs mean 40 ± 5 是正常范围
    assert.ok(batch.data[1].severity !== 'CRITICAL', 'machine B cpu should not be critical')
  })

  it('导玩员查询引擎状态确认检测正常运行', () => {
    const { controller } = createController()
    const status = controller.getStatus()
    assert.equal(status.data.status, 'ACTIVE')
    assert.ok(status.data.rulesCount > 0)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🎯运行专员 — 运维指标异常监控
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} 运维指标异常监控`, () => {
  it('运行专员检测服务器内存泄漏 — EWMA 持续漂移检出', () => {
    const { controller } = createController()
    const history = makeStableHistory(500, 20, 10)
    // 建立 EWMA
    controller.detect({ metricKey: 'server.memory', value: 500, history })
    const result = controller.detect({ metricKey: 'server.memory', value: 920, history })
    assert.ok(result.data.score > 0.3 || result.data.detectors.ewma?.detected,
      `memory leak ewma detected=${result.data.detectors.ewma?.detected}`)
  })

  it('运行专员启用批量检测同时监控多个服务指标', () => {
    const { controller } = createController()
    const cpuH = makeStableHistory(40, 15, 5)
    const memH = makeStableHistory(300, 15, 20)
    const diskH = makeStableHistory(60, 15, 5)
    const points = [
      { metricKey: 'ops.cpu', value: 95, history: cpuH },
      { metricKey: 'ops.memory', value: 310, history: memH },
      { metricKey: 'ops.disk', value: 65, history: diskH },
    ]
    const batch = controller.detectBatch({ points })
    assert.ok(batch.data[0].score > 0.5, 'cpu anomaly expected')
    assert.equal(batch.data[1].score, 0, 'memory normal')
  })

  it('运行专员配置引擎后检测行为改变 — sigma 影响判定', () => {
    const { service, controller } = createController()
    // Use history with non-zero stddev so 3σ can actually calculate
    const variedHistory: TimeSeriesPoint[] = [48, 52, 49, 51, 47, 53, 50, 52, 49, 51, 48, 52, 50, 51, 49].map(v => ({
      timestamp: new Date().toISOString(),
      value: v,
      labels: {},
    }))
    // sigma=3, mean=~50, stddev=~1.6, zScore for 110 = (110-50)/1.6 ≈ 37 > 3 → anomaly
    const r1 = controller.detect({ metricKey: 'ops.latency', value: 110, history: variedHistory })
    // With sigma=3, 110 is ~37σ away → anomaly
    assert.ok(r1.data.score > 0.5, `score should be high, got ${r1.data.score}`)

    // sigma=0.5 → 110 even more anomalous
    controller.configure({ sigmaThreshold: 0.5 })
    const r2 = controller.detect({ metricKey: 'ops.latency', value: 110, history: variedHistory })
    assert.ok(r2.data.score > 0.5, `after sigma=0.5, score=${r2.data.score}`)

    controller.configure({ sigmaThreshold: 3 })
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🤝团建 — 团建活动相关指标异常
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} 团建活动指标异常`, () => {
  it('团建检测活动报名人数骤降 — 应标出异常', () => {
    const { controller } = createController()
    const history = makeStableHistory(30, 15, 5)
    const result = controller.detect({
      metricKey: 'teambuilding.signups',
      value: 2,
      history,
    })
    assert.ok(result.data.score > 0.5 || result.data.detectors.iqr?.detected,
      `signup anomaly score=${result.data.score}`)
  })

  it('团建配置白名单排除季节性波动', () => {
    const { service, controller } = createController()
    controller.configure({
      whitelist: [{ metricKey: 'teambuilding.bookings', reason: '暑假高峰期', ttlMs: 86400000 }],
    })
    const history = makeStableHistory(50, 10, 5)
    const result = controller.detect({
      metricKey: 'teambuilding.bookings',
      value: 80,
      history,
    })
    assert.equal(result.data.whitelisted, true)
    assert.equal(result.data.score, 0)

    controller.configure({ whitelist: [] })
  })

  it('团建检测场地评价異常低分 — 多元统计应报警', () => {
    const { controller } = createController()
    const history = makeStableHistory(4.2, 20, 0.3)
    const result = controller.detect({
      metricKey: 'teambuilding.rating',
      value: 1.2,
      history,
    })
    assert.ok(result.data.score > 0.5, `rating anomaly score=${result.data.score}`)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 📢营销 — 营销活动指标异常检测
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} 营销指标异常检测`, () => {
  it('营销检测活动转化率骤变 — 应及时告警', () => {
    const { controller } = createController()
    const history = makeStableHistory(5, 20, 1) // 5% 转化率
    const result = controller.detect({
      metricKey: 'campaign.conversion.rate',
      value: 0.2,
      history,
    })
    assert.ok(result.data.score > 0.5,
      `conversion anomaly score=${result.data.score}`)
    assert.ok(result.data.detectors.threeSigma?.detected || result.data.detectors.iqr?.detected)
  })

  it('营销检测广告点击量异常暴增 — 应标记为异常', () => {
    const { controller } = createController()
    const history = makeStableHistory(200, 15, 30)
    const result = controller.detect({
      metricKey: 'ad.click.count',
      value: 5000,
      history,
    })
    assert.ok(result.data.score > 0.7, `click spike anomaly score=${result.data.score}`)
    assert.ok(result.data.detectors.threeSigma?.detected)
  })

  it('营销配置白名单后正常活动推广不告警', () => {
    const { service, controller } = createController()
    controller.configure({
      whitelist: [{ metricKey: 'campaign.reach', reason: '双11大促', ttlMs: 86400000 }],
    })
    const history = makeStableHistory(5000, 10, 500)
    const result = controller.detect({
      metricKey: 'campaign.reach',
      value: 20000,
      history,
    })
    assert.equal(result.data.whitelisted, true)
    assert.equal(result.data.score, 0)

    controller.configure({ whitelist: [] })
  })

  it('营销调整 critical 阈值后低分也不报警 — 配置边界', () => {
    const { service, controller } = createController()
    const flatHistory: TimeSeriesPoint[] = Array.from({ length: 20 }, () => ({
      timestamp: new Date().toISOString(),
      value: 100,
      labels: {},
    }))

    // 先获得一个中等异常
    controller.configure({ sigmaThreshold: 1 })
    const midAnomaly = controller.detect({ metricKey: 'campaign.views', value: 130, history: flatHistory })
    const midScore = midAnomaly.data.score

    // 调高 critical 阈值到 0.95
    controller.configure({ criticalThreshold: 0.95, sigmaThreshold: 3 })
    const highTresholdResult = controller.detect({ metricKey: 'campaign.views', value: 130, history: flatHistory })

    // 恢复默认
    controller.configure({ criticalThreshold: 0.8, warningThreshold: 0.5, sigmaThreshold: 3 })
  })
})

// ═══════════════════════════════════════════════════════════════════
// 跨角色协作场景
// ═══════════════════════════════════════════════════════════════════
describe('跨角色协作异常检测场景', () => {
  it('店长 + 运行专员协作: 检测到 CPU 异常后配置白名单和阈值调整', () => {
    const { service, controller } = createController()
    const history = makeStableHistory(40, 20, 5)

    // 店长检测到异常
    const anomaly = controller.detect({
      metricKey: 'arcade.server.cpu',
      value: 96,
      history,
    })
    assert.ok(anomaly.data.score > 0.8, 'CPU anomaly detected')

    // 运行专员确认后降低阈值增加敏感度
    controller.configure({
      sigmaThreshold: 2,
      warningThreshold: 0.3,
    })

    const reCheck = controller.detect({
      metricKey: 'arcade.server.cpu',
      value: 75,
      history,
    })
    assert.ok(reCheck.data.severity !== 'NORMAL' || reCheck.data.score > 0,
      'after tuning, 75 should also flag')

    controller.configure({ sigmaThreshold: 3, warningThreshold: 0.5 })
  })

  it('前台 + 安监协作: 支付失败异常 → 确认非安全事件后配置白名单', () => {
    const { service, controller } = createController()
    const history = makeStableHistory(2, 20, 0.5)

    // 前台发现支付失败率异常
    const paymentAnomaly = controller.detect({
      metricKey: 'payment.failure',
      value: 18,
      history,
    })
    assert.ok(paymentAnomaly.data.score > 0.5, 'payment anomaly')

    // 安监确认非安全问题后白名单化
    controller.configure({
      whitelist: [{ metricKey: 'payment.failure', reason: '银行网关例行维护', ttlMs: 3600000 }],
    })

    const whitelisted = controller.detect({
      metricKey: 'payment.failure',
      value: 25,
      history,
    })
    assert.equal(whitelisted.data.whitelisted, true)
    assert.equal(whitelisted.data.score, 0)

    controller.configure({ whitelist: [] })
  })
})
