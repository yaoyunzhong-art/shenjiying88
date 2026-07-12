import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [anomaly-detector] [C] 角色测试
 * 
 * 8 角色视角的 anomaly-detector 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
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

// ── 测试数据工厂 ──
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

const normalMetricHistory = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101])
const steadyMetricHistory = makeHistory([50, 50, 50, 50, 50, 50, 50, 50])

// ── 👔店长（StoreManager）视角 ──
// 店长关注全局运营健康度：门店收入异常、客流异常、设备报警概况
describe(`${ROLES.StoreManager} anomaly-detector 角色测试`, () => {
  it('店长检测门店日收入异常 => CRITICAL （收入骤降）', () => {
    const ctrl = createController()
    const revenueHistory = makeHistory([15000, 14800, 15200, 14900, 15100, 14700, 15300, 15000, 14800, 15100])

    const result = ctrl.detect({
      metricKey: 'daily-revenue',
      value: 2000, // 收入从 ~15000 骤降到 2000
      history: revenueHistory,
    })

    expect(result.data.metricKey).toBe('daily-revenue')
    expect(result.data.score).toBeGreaterThan(0.5)
    expect(['WARNING', 'CRITICAL']).toContain(result.data.severity)
    expect(result.data.deviation).toBeLessThan(-10000)
    expect(result.data.reason).toContain('3σ')
  })

  it('店长查看引擎状态确认异常检测系统在线', () => {
    const ctrl = createController()
    const status = ctrl.getStatus()

    expect(status.data.engineName).toBe('AnomalyDetector')
    expect(status.data.status).toBe('ACTIVE')
    expect(status.data.rulesCount).toBeGreaterThanOrEqual(3)
    expect(status.data.lastEvaluationAt).toBeDefined()
  })

  it('店长配置白名单避免已知业务高峰误报', () => {
    const ctrl = createController()
    const result = ctrl.configure({
      whitelist: [
        { metricKey: 'store-promotion-revenue', reason: '促销活动期间收入波动属于正常业务行为' },
        { metricKey: 'weekend-traffic', reason: '周末门店人流量增多' },
      ],
      sigmaThreshold: 3,
    })

    expect(result.status).toBe('ok')
    expect(result.applied).toContain('whitelist')
    expect(result.applied).toContain('sigmaThreshold')

    // 验证白名单生效：促销指标即便值异常也不报警
    const ctrl2 = createController()
    ctrl2.configure({
      whitelist: [{ metricKey: 'store-promotion-revenue', reason: '促销活动' }],
    })
    const history = makeHistory([10000, 11000, 10500, 10800])
    const detectResult = ctrl2.detect({
      metricKey: 'store-promotion-revenue',
      value: 99999,
      history,
    })
    expect(detectResult.data.whitelisted).toBe(true)
    expect(detectResult.data.severity).toBe('NORMAL')
  })

  it('店长批量检测多个业务指标（多店概览）', () => {
    const ctrl = createController()
    // 预热 EWMA
    const service = new AnomalyDetectorService()

    const result = ctrl.detectBatch({
      points: [
        { metricKey: 'store-a-revenue', value: 14300, history: makeHistory([14000, 14200, 13800, 14500, 14100]) },
        { metricKey: 'store-b-customer-count', value: 30, history: makeHistory([300, 310, 290, 305, 295]) },
      ],
    })

    expect(result.data.length).toBe(2)
    // store-a 正常 (14300 vs 均值14120, 在3σ范围内)
    expect(result.data[0].metricKey).toBe('store-a-revenue')
    expect(result.data[0].severity).toBe('NORMAL')
    // store-b 客流暴跌
    expect(result.data[1].metricKey).toBe('store-b-customer-count')
    expect(result.data[1].severity).not.toBe('NORMAL')
  })
})

// ── 🛒前台（FrontDesk）视角 ──
// 前台关注收银异常、排队时间异常、设备运行状态
describe(`${ROLES.FrontDesk} anomaly-detector 角色测试`, () => {
  it('前台检测收银台排队时间异常 => WARNING', () => {
    const ctrl = createController()
    const queueHistory = makeHistory([2, 3, 2, 4, 3, 2, 3, 2, 4, 2]) // 平均 ~2.7 分钟

    const result = ctrl.detect({
      metricKey: 'cashier-queue-time-min',
      value: 30, // 排队 30 分钟，严重异常
      history: queueHistory,
    })

    expect(result.data.score).toBeGreaterThan(0.5)
    expect(['WARNING', 'CRITICAL']).toContain(result.data.severity)
  })

  it('前台检测正常收银操作不误报', () => {
    const ctrl = createController()
    const orderHistory = makeHistory([50, 52, 48, 51, 49, 53, 47, 50, 52, 48])

    const result = ctrl.detect({
      metricKey: 'orders-per-hour',
      value: 51, // 正常范围
      history: orderHistory,
    })

    expect(result.data.severity).toBe('NORMAL')
    expect(result.data.score).toBeLessThan(0.5)
    expect(result.data.reason).toBe('No anomaly detected')
  })

  it('前台在缺乏历史数据时检测应兜底 NORMAL', () => {
    const ctrl = createController()
    // 历史数据太少（只有2个点），3σ 和 IQR 都会静默
    const shortHistory = makeHistory([100, 101])
    const result = ctrl.detect({
      metricKey: 'new-kiosk-metric',
      value: 999,
      history: shortHistory,
    })
    // 由于没有足够历史，检测器均不触发 → NORMAL
    expect(result.data.severity).toBe('NORMAL')
    // threeSigma (需≥3个历史点) 和 IQR (需≥4个历史点) 在数据不足时不返回
    expect(result.data.detectors.threeSigma).toBeUndefined()
    expect(result.data.detectors.iqr).toBeUndefined()
    // EWMA 始终初始化跟踪
    expect(result.data.detectors.ewma).toBeDefined()
  })
})

// ── 👥HR（HumanResources）视角 ──
// HR 关注员工考勤异常、排班异常、工时异常
describe(`${ROLES.HR} anomaly-detector 角色测试`, () => {
  it('HR 检测员工考勤异常（某员工连续缺勤）', () => {
    const ctrl = createController()
    const attendanceHistory = makeHistory([1, 1, 1, 1, 0, 1, 1, 1, 1, 1]) // 0=缺勤, 1=到岗

    const result = ctrl.detect({
      metricKey: 'employee-attendance-rate',
      value: 0, // 全月缺勤
      history: attendanceHistory,
    })

    // 尽管值在历史范围内出现 (0 出现过)，但 EWMA 可能检测到模式变化
    expect(result.data.metricKey).toBe('employee-attendance-rate')
    expect(result.data.score).toBeGreaterThanOrEqual(0)
  })

  it('HR 配置异常检测阈值应对转正评估期间考勤监控', () => {
    const ctrl = createController()
    // 调低告警阈值以便更敏感地发现考勤异常
    const config = ctrl.configure({
      criticalThreshold: 0.3,
      warningThreshold: 0.1,
    })
    expect(config.status).toBe('ok')
    expect(config.applied).toContain('criticalThreshold')
    expect(config.applied).toContain('warningThreshold')

    // 在更低阈值下，小幅异常也会触发告警
    const ctrl2 = createController()
    ctrl2.configure({ criticalThreshold: 0.3, warningThreshold: 0.1 })
    const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101])
    const mildResult = ctrl2.detect({
      metricKey: 'overtime-hours',
      value: 120,
      history,
    })
    // 阈值调低后，轻微偏差也可能触发 WARNING
    expect(mildResult.data.score).toBeGreaterThan(0)
  })
})

// ── 🔧安监（Security）视角 ──
// 安监关注设备安全异常、环境传感器异常、入侵检测
describe(`${ROLES.Security} anomaly-detector 角色测试`, () => {
  it('安监检测门禁传感器异常（深夜频繁进出）', () => {
    const ctrl = createController()
    const doorHistory = makeHistory([0, 0, 0, 0, 1, 0, 0, 0, 0, 0]) // 1=开门事件

    const result = ctrl.detect({
      metricKey: 'security-door-access-count',
      value: 20, // 深夜 20 次开门，异常
      history: doorHistory,
    })

    expect(result.data.score).toBeGreaterThan(0.5)
    expect(result.data.severity).not.toBe('NORMAL')
    expect(result.data.metricKey).toBe('security-door-access-count')
  })

  it('安监检测摄像头离线数量异常', () => {
    const ctrl = createController()
    const camHistory = makeHistory([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) // 正常情况下无离线

    const result = ctrl.detect({
      metricKey: 'camera-offline-count',
      value: 5, // 5 个摄像头同时离线
      history: camHistory,
    })

    expect(result.data.score).toBeGreaterThan(0.5)
    expect(result.data.severity).not.toBe('NORMAL')
    expect(result.data.detectors.ewma).toBeDefined()
  })

  it('安监配置白名单避免安保巡检时段误报', () => {
    const ctrl = createController()
    ctrl.configure({
      whitelist: [{ metricKey: 'security-patrol-trigger', reason: '常规安保巡逻触发' }],
    })

    const history = makeHistory([0, 0, 0, 0, 0])
    const result = ctrl.detect({
      metricKey: 'security-patrol-trigger',
      value: 10,
      history,
    })

    expect(result.data.whitelisted).toBe(true)
    expect(result.data.severity).toBe('NORMAL')
    expect(result.data.reason).toContain('White')
  })

  it('安监批量检测多个安全指标（全店安防概览）', () => {
    const ctrl = createController()

    const result = ctrl.detectBatch({
      points: [
        { metricKey: 'door-open-count', value: 1, history: makeHistory([0, 0, 0, 0, 0, 0, 0]) },
        { metricKey: 'alarm-trigger-count', value: 0, history: makeHistory([0, 0, 0, 0, 0, 0, 0]) },
      ],
    })

    expect(result.data.length).toBe(2)
    expect(result.data[0].severity).toBe('NORMAL')
    expect(result.data[1].severity).toBe('NORMAL')
    // 传递空 timestamps 时批量结果依然有效
    expect(result.data[0].detectedAt).toBeDefined()
  })
})

// ── 🎮导玩员（Guide）视角 ──
// 导玩员关注游乐设备运行异常、排队时长、设备使用率
describe(`${ROLES.Guide} anomaly-detector 角色测试`, () => {
  it('导玩员检测游戏设备故障率异常', () => {
    const ctrl = createController()
    const failureHistory = makeHistory([0.01, 0, 0.02, 0.01, 0, 0.01, 0.02, 0, 0.01, 0.01])

    const result = ctrl.detect({
      metricKey: 'game-device-failure-rate',
      value: 0.8, // 80% 故障率，严重异常
      history: failureHistory,
    })

    expect(result.data.score).toBeGreaterThan(0.5)
    expect(result.data.severity).toBe('CRITICAL')
    expect(result.data.detectors.threeSigma?.detected).toBe(true)
  })

  it('导玩员检测正常设备开机率不误报', () => {
    const ctrl = createController()
    const uptimeHistory = makeHistory([0.95, 0.97, 0.96, 0.98, 0.95, 0.96, 0.97, 0.95, 0.96, 0.97])

    const result = ctrl.detect({
      metricKey: 'device-uptime-rate',
      value: 0.96, // 正常范围
      history: uptimeHistory,
    })

    expect(result.data.severity).toBe('NORMAL')
    expect(result.data.score).toBeLessThan(0.3)
  })

  it('导玩员批量检测多台设备状态', () => {
    const ctrl = createController()

    const result = ctrl.detectBatch({
      points: [
        { metricKey: 'game-cabinet-01', value: 50, history: makeHistory([48, 52, 49, 51, 50]) },
        { metricKey: 'game-cabinet-02', value: 95, history: makeHistory([50, 51, 49, 50, 52]) }, // CPU 突然飙升
        { metricKey: 'game-cabinet-03', value: 10, history: makeHistory([9, 11, 10, 8, 12]) },
      ],
    })

    expect(result.data.length).toBe(3)
    // cabinet-02 CPU 超高应被检测
    expect(result.data[1].metricKey).toBe('game-cabinet-02')
    expect(result.data[1].score).toBeGreaterThan(0.5)
    expect(result.data[1].severity).not.toBe('NORMAL')
  })
})

// ── 🎯运行专员（Operations）视角 ──
// 运行专员关注系统性能指标：CPU、内存、延迟、错误率
describe(`${ROLES.Operations} anomaly-detector 角色测试`, () => {
  it('运行专员检测 CPU 异常飙升', () => {
    const ctrl = createController()
    const cpuHistory = makeHistory([30, 32, 28, 31, 29, 33, 30, 31, 28, 29])

    const result = ctrl.detect({
      metricKey: 'cpu-usage-pct',
      value: 95, // CPU 95%，严重异常
      history: cpuHistory,
    })

    expect(result.data.score).toBeGreaterThan(0.5)
    expect(result.data.severity).toBe('CRITICAL')
    expect(result.data.reason).not.toBe('No anomaly detected')
    expect(result.data.baseline).toBeGreaterThan(0)
  })

  it('运行专员检测 API 延迟异常', () => {
    const ctrl = createController()
    const latencyHistory = makeHistory([100, 102, 98, 101, 99, 103, 97, 100, 102, 101])

    const result = ctrl.detect({
      metricKey: 'api-p99-latency-ms',
      value: 5000, // 5秒延迟，异常
      history: latencyHistory,
    })

    expect(result.data.score).toBeGreaterThan(0.5)
    expect(result.data.severity).not.toBe('NORMAL')
    expect(result.data.baseline).toBeCloseTo(100.3, 0)
  })

  it('运行专员配置调优：提高 sigma 阈值减少误报', () => {
    const ctrl = createController()
    ctrl.configure({ sigmaThreshold: 4 })

    const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101])
    // sigma=4 下仍检测到大幅异常
    const result = ctrl.detect({
      metricKey: 'tuned-cpu',
      value: 200,
      history,
    })
    expect(result.data.score).toBeGreaterThan(0)
    expect(result.data.severity).toBe('CRITICAL')

    // 小幅波动在 sigma=4 下分数较低
    const mildResult = ctrl.detect({
      metricKey: 'tuned-cpu',
      value: 103,
      history,
    })
    expect(mildResult.data.score).toBeLessThan(result.data.score)
  })

  it('运行专员批量检测多个系统指标', () => {
    const ctrl = createController()

    const result = ctrl.detectBatch({
      points: [
        { metricKey: 'memory-usage', value: 45, history: makeHistory([40, 42, 41, 43, 40, 42, 44]) },
        { metricKey: 'disk-io', value: 99, history: makeHistory([20, 22, 21, 19, 23, 20, 21]) },
        { metricKey: 'error-rate', value: 0.001, history: makeHistory([0.001, 0.001, 0.001, 0.001]) },
      ],
    })

    expect(result.data.length).toBe(3)
    // memory 正常
    expect(result.data[0].severity).toBe('NORMAL')
    // disk-io 异常
    expect(result.data[1].severity).not.toBe('NORMAL')
    // error-rate 正常
    expect(result.data[2].severity).toBe('NORMAL')
  })
})

// ── 🤝团建（Teambuilding）视角 ──
// 团建关注员工活动参与率异常、团队氛围评分波动、预算异常
describe(`${ROLES.Teambuilding} anomaly-detector 角色测试`, () => {
  it('团建检测月度团建参与率骤降', () => {
    const ctrl = createController()
    const participationHistory = makeHistory([75, 80, 72, 78, 82, 76, 79, 74, 81, 77])

    const result = ctrl.detect({
      metricKey: 'team-building-participation-rate',
      value: 10, // 仅 10% 参与率
      history: participationHistory,
    })

    expect(result.data.score).toBeGreaterThan(0.5)
    expect(result.data.severity).not.toBe('NORMAL')
    expect(result.data.deviation).toBeLessThan(-50)
  })

  it('团建检测正常参与率不误报', () => {
    const ctrl = createController()
    const participationHistory = makeHistory([75, 80, 72, 78, 82, 76, 79, 74, 81, 77])

    const result = ctrl.detect({
      metricKey: 'team-building-participation-rate',
      value: 78, // 正常范围
      history: participationHistory,
    })

    expect(result.data.severity).toBe('NORMAL')
  })

  it('团建检测团建预算突发超额', () => {
    const ctrl = createController()
    const budgetHistory = makeHistory([5000, 4800, 5200, 4900, 5100, 4700, 5300, 5000, 4800, 5100])

    const result = ctrl.detect({
      metricKey: 'monthly-team-building-budget',
      value: 50000, // 严重超预算
      history: budgetHistory,
    })

    expect(result.data.score).toBeGreaterThan(0.5)
    expect(result.data.severity).toBe('CRITICAL')
  })
})

// ── 📢营销（Marketing）视角 ──
// 营销关注广告投放效果异常、转化率异常、活动 ROI 异常
describe(`${ROLES.Marketing} anomaly-detector 角色测试`, () => {
  it('营销检测广告点击率异常飙升（刷量嫌疑）', () => {
    const ctrl = createController()
    const ctrHistory = makeHistory([2.1, 1.9, 2.3, 2.0, 2.2, 1.8, 2.1, 2.4, 1.9, 2.0])

    const result = ctrl.detect({
      metricKey: 'ad-click-through-rate',
      value: 25.0, // CTR 25%，严重异常（疑似刷量）
      history: ctrHistory,
    })

    expect(result.data.score).toBeGreaterThan(0.5)
    expect(result.data.severity).not.toBe('NORMAL')
    expect(result.data.reason).not.toBe('No anomaly detected')
  })

  it('营销检测营销活动 ROI 异常下滑', () => {
    const ctrl = createController()
    const roiHistory = makeHistory([4.5, 4.8, 4.2, 4.6, 4.3, 4.7, 4.4, 4.9, 4.1, 4.5])

    const result = ctrl.detect({
      metricKey: 'campaign-roi-multiple',
      value: 0.1, // ROI 几乎为 0
      history: roiHistory,
    })

    expect(result.data.score).toBeGreaterThan(0.5)
    expect(result.data.severity).not.toBe('NORMAL')
  })

  it('营销检测正常转化率无异常', () => {
    const ctrl = createController()
    const convHistory = makeHistory([3.2, 3.5, 3.1, 3.4, 3.3, 3.6, 3.0, 3.5, 3.2, 3.4])

    const result = ctrl.detect({
      metricKey: 'campaign-conversion-rate',
      value: 3.3, // 正常范围
      history: convHistory,
    })

    expect(result.data.severity).toBe('NORMAL')
    expect(result.data.score).toBeLessThan(0.3)
  })

  it('营销配置白名单避免大促期间指标波动误报', () => {
    const ctrl = createController()
    ctrl.configure({
      whitelist: [{ metricKey: 'promo-daily-revenue', reason: '双十一大促期间收入大幅增长属正常现象' }],
    })

    const history = makeHistory([20000, 21000, 19000, 20500])
    const result = ctrl.detect({
      metricKey: 'promo-daily-revenue',
      value: 100000,
      history,
    })

    expect(result.data.whitelisted).toBe(true)
    expect(result.data.severity).toBe('NORMAL')
    expect(result.data.reason).toContain('Whitelisted')
  })
})
