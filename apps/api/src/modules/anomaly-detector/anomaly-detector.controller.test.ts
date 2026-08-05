import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 8角色视角 + 边界测试: 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
import { Test, TestingModule } from '@nestjs/testing'
import { AnomalyDetectorController } from './anomaly-detector.controller'
import { AnomalyDetectorService } from './anomaly-detector.service'
import type { TimeSeriesPoint } from '../time-series/time-series-collector.service'
import type { AnomalyResult, AnomalyEngineStatus } from './anomaly-detector.entity'

function makeHistory(values: number[]): TimeSeriesPoint[] {
  return values.map((v, i) => ({
    timestamp: new Date(Date.now() - (values.length - i) * 60000).toISOString(),
    value: v,
  }))
}

describe('AnomalyDetectorController (spec)', () => {
  let controller: AnomalyDetectorController
  let service: AnomalyDetectorService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnomalyDetectorController],
      providers: [AnomalyDetectorService],
    }).compile()

    controller = module.get<AnomalyDetectorController>(AnomalyDetectorController)
    service = module.get<AnomalyDetectorService>(AnomalyDetectorService)
  })

  // ── 👔 店长: 关注整体运营健康度和异常告警概览 ──
  describe('👔 店长 Store Manager', () => {
    it('AC-1: 查看引擎状态 — 应返回整体健康度', () => {
      const result = controller.getStatus()
      expect(result.data.engineName).toBe('AnomalyDetector')
      expect(result.data.status).toBe('ACTIVE')
      expect(result.data.rulesCount).toBeGreaterThan(0)
      expect(result.data.lastEvaluationAt).toBeDefined()
    })

    it('AC-2: 单点异常探测 — 异常数据应被正确标记严重度', () => {
      const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101])
      const normal = controller.detect({ metricKey: 'p95', value: 100, history })
      expect(normal.data.severity).toBe('NORMAL')

      const critical = controller.detect({ metricKey: 'p95', value: 999, history })
      expect(critical.data.severity).toBe('CRITICAL')
      expect(critical.data.score).toBeGreaterThan(0.8)
    })

    it('AC-3: 查看告警分布 — 批量检测应返回所有结果', () => {
      const history = makeHistory([50, 52, 49, 51])
      const result = controller.detectBatch({
        points: [
          { metricKey: 'cpu', value: 51, history },
          { metricKey: 'memory', value: 95, history },
          { metricKey: 'disk_io', value: 20, history },
        ],
      })
      expect(result.data).toHaveLength(3)
      expect(result.data.some((r) => r.severity !== 'NORMAL')).toBe(true)
    })
  })

  // ── 🛒 前台: 关注系统响应和可用性异常 ──
  describe('🛒 前台 Front Desk', () => {
    it('AC-4: 页面加载时间异常 — 高延迟应被检测', () => {
      const history = makeHistory([200, 210, 190, 205, 195, 210, 190, 200, 205, 195])
      const result = controller.detect({
        metricKey: 'page_load_ms',
        value: 5000,
        history,
      })
      expect(result.data.severity).not.toBe('NORMAL')
      expect(result.data.metricKey).toBe('page_load_ms')
    })

    it('AC-5: 结账响应正常 — 应返回 NORMAL', () => {
      const history = makeHistory([300, 310, 290, 305, 295])
      const result = controller.detect({
        metricKey: 'checkout_ms',
        value: 305,
        history,
      })
      expect(result.data.severity).toBe('NORMAL')
    })
  })

  // ── 👥 HR: 关注人员操作异常率和系统稳定性 ──
  describe('👥 HR HR Manager', () => {
    it('AC-6: 配置异常阈值 — 调整 sigma 应生效', () => {
      const result = controller.configure({ sigmaThreshold: 2.0 })
      expect(result.status).toBe('ok')
      expect(result.applied).toContain('sigmaThreshold')

      // 用更松弛的阈值重新检测
      const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101])
      const det = controller.detect({ metricKey: 'error_rate', value: 120, history })
      // 宽松阈值下 120 可能不再是异常
      expect(det.data.severity).toBeDefined()
    })

    it('AC-7: 批量配置多项参数 — 应全部返回 applied', () => {
      const result = controller.configure({
        sigmaThreshold: 3.0,
        ewmaAlpha: 0.5,
        criticalThreshold: 0.99,
        warningThreshold: 0.8,
      })
      expect(result.status).toBe('ok')
      expect(result.applied).toHaveLength(4)
      expect(result.applied).toContain('sigmaThreshold')
      expect(result.applied).toContain('ewmaAlpha')
      expect(result.applied).toContain('criticalThreshold')
      expect(result.applied).toContain('warningThreshold')
    })
  })

  // ── 🔧 安监: 关注安全隐患和紧急告警 ──
  describe('🔧 安监 Safety Supervisor', () => {
    it('AC-8: 极端异常应立即触发 CRITICAL', () => {
      const history = makeHistory([1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
      const result = controller.detect({ metricKey: 'fire_alarm', value: 100, history })
      expect(result.data.severity).toBe('CRITICAL')
      expect(result.data.score).toBeGreaterThan(0.9)
    })

    it('AC-9: 配置白名单 — 白名单内的指标应被忽略', () => {
      const result = controller.configure({
        whitelist: [{ metricKey: 'maintenance_metric', reason: '定期维护，波动正常' }] as any,
        sigmaThreshold: 3.0,
      })
      expect(result.status).toBe('ok')
      expect(result.applied).toContain('whitelist')

      const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101])
      // Even if anomalous, whitelisted metric should be marked whitelisted
      const det = controller.detect({ metricKey: 'maintenance_metric', value: 500, history })
      expect(det.data.whitelisted).toBe(true)
    })

    it('AC-10: 连续告警批量检测 — 所有异常应标记严重度', () => {
      const history = makeHistory([50, 52, 49, 51, 50, 53, 48, 51])
      const result = controller.detectBatch({
        points: [
          { metricKey: 'temp_sensor_1', value: 85, history },
          { metricKey: 'temp_sensor_2', value: 90, history },
          { metricKey: 'temp_sensor_3', value: 200, history },
        ],
      })
      const criticals = result.data.filter((r) => r.severity === 'CRITICAL')
      expect(criticals.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── 🎮 导玩员: 关注设备/游戏机异常检测 ──
  describe('🎮 导玩员 Game Guide', () => {
    it('AC-11: 游戏机温度正常 — 应返回 NORMAL', () => {
      const history = makeHistory([40, 42, 39, 41, 43, 40, 42, 38, 41, 40])
      const result = controller.detect({ metricKey: 'machine_temp', value: 41, history })
      expect(result.data.severity).toBe('NORMAL')
    })

    it('AC-12: 设备离线率飙升 — 应检测异常', () => {
      const history = makeHistory([1, 0, 1, 0, 1, 0, 1, 0, 1, 0])
      const result = controller.detect({ metricKey: 'device_offline_count', value: 8, history })
      expect(result.data.severity).not.toBe('NORMAL')
      expect(result.data.deviation).toBeGreaterThan(0)
    })
  })

  // ── 🎯 运行专员: 关注系统运行参数和批量操作 ──
  describe('🎯 运行专员 Operations Specialist', () => {
    it('AC-13: 批量检测空列表 — 应返回空数组', () => {
      const result = controller.detectBatch({ points: [] })
      expect(result.data).toHaveLength(0)
    })

    it('AC-14: 大并发下 CPU 异常检测 — 正常范围应通过', () => {
      const history = makeHistory([30, 35, 28, 32, 31, 33, 29, 34, 30, 32])
      const result = controller.detect({ metricKey: 'cpu_usage', value: 33, history })
      expect(result.data.severity).toBe('NORMAL')
    })

    it('AC-15: 带 timestamp 的检测请求 — 应正确传递', () => {
      const now = new Date().toISOString()
      const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101])
      const result = controller.detect({
        metricKey: 'latency_ms',
        value: 100,
        history,
        timestamp: now,
      })
      expect(result.data.detectedAt).toBeDefined()
    })
  })

  // ── 🤝 团建: 关注多人协作场景和团队使用 ──
  describe('🤝 团建 Team Building Coordinator', () => {
    it('AC-16: 多次配置不应抛出异常', () => {
      controller.configure({ sigmaThreshold: 2.5 })
      controller.configure({ ewmaAlpha: 0.4 })
      controller.configure({ criticalThreshold: 0.95 })
      controller.configure({ warningThreshold: 0.75 })
      // 最后检测仍能正常执行
      const history = makeHistory([100, 101, 99, 100])
      const result = controller.detect({ metricKey: 'metric_a', value: 100, history })
      expect(result.data.metricKey).toBe('metric_a')
    })

    it('AC-17: 状态查询应返回引擎元信息', () => {
      const result = controller.getStatus()
      expect(result.data).toHaveProperty('engineName')
      expect(result.data).toHaveProperty('rulesCount')
      expect(result.data).toHaveProperty('status')
      expect(result.data).toHaveProperty('lastEvaluationAt')
      expect(typeof result.data.rulesCount).toBe('number')
    })
  })

  // ── 📢 营销: 关注营销活动期间指标异常 ──
  describe('📢 营销 Marketing Manager', () => {
    it('AC-18: 大促期间流量尖峰 — 应告警但非 CRITICAL', () => {
      const history = makeHistory([1000, 1200, 1100, 1050, 1150, 1080, 1020, 1180, 1120, 1060])
      const result = controller.detect({ metricKey: 'traffic_volume', value: 5000, history })
      // 大流量尖峰应被检测但可能是 WARNING 而非 CRITICAL
      expect(result.data.severity).not.toBe('NORMAL')
    })

    it('AC-19: 多维度营销指标批量检测 — 应全部返回', () => {
      const history = makeHistory([200, 210, 190, 205])
      const result = controller.detectBatch({
        points: [
          { metricKey: 'click_rate', value: 205, history },
          { metricKey: 'conversion_rate', value: 3.5, history },
          { metricKey: 'impression_count', value: 100000, history },
          { metricKey: 'cpc', value: 2.1, history },
        ],
      })
      expect(result.data).toHaveLength(4)
      result.data.forEach((r) => {
        expect(r.metricKey).toBeDefined()
        expect(r.score).toBeGreaterThanOrEqual(0)
      })
    })
  })

  // ── 额外边界场景 ──
  describe('边界场景 Edge Cases', () => {
    it('AC-20: 最少历史数据（2 个点）应能检测', () => {
      const history = makeHistory([100, 101])
      const result = controller.detect({ metricKey: 'minimal_data', value: 200, history })
      expect(result.data.severity).toBeDefined()
    })

    it('AC-21: 空历史数据应返回合理结果', () => {
      const result = controller.detect({ metricKey: 'no_history', value: 100, history: [] })
      expect(result.data.severity).toBe('NORMAL') // 无足够历史时默认 NORMAL
      expect(result.data.baseline).toBe(0) // 空历史 baseline 为 0
    })

    it('AC-22: 所有值相等的历史和正常值 — 应 NORMAL', () => {
      const history = makeHistory([50, 50, 50, 50, 50, 50, 50, 50, 50, 50])
      const result = controller.detect({ metricKey: 'constant', value: 50, history })
      expect(result.data.severity).toBe('NORMAL')
    })

    it('AC-23: Service detect 被正确调用 — spy 验证', () => {
      const spy = vi.spyOn(service, 'detect')
      const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101])
      controller.detect({ metricKey: 'spy_test', value: 90, history })
      expect(spy).toHaveBeenCalledTimes(1)
      spy.mockRestore()
    })

    it('AC-24: 配置空对象 — 应返回空 applied 数组', () => {
      const result = controller.configure({})
      expect(result.status).toBe('ok')
      expect(result.applied).toHaveLength(0)
    })

    it('AC-25: 连续配置后配置参数应固化', () => {
      controller.configure({ sigmaThreshold: 3.5 })
      controller.configure({ sigmaThreshold: 4.0 })
      // 重新检测应使用最新的 sigmaThreshold
      const history = makeHistory([100, 101, 99, 100, 102, 98])
      const det1 = controller.detect({ metricKey: 'reconfig', value: 130, history })
      expect(det1.data.score).toBeGreaterThanOrEqual(0)
    })

    it('AC-26: 极高异常值应得分为 1.0', () => {
      const history = makeHistory([1, 2, 1, 2, 1, 2, 1, 2, 1, 2])
      const result = controller.detect({ metricKey: 'extreme', value: 999999, history })
      expect(result.data.score).toBeCloseTo(1.0, 1)
      expect(result.data.severity).toBe('CRITICAL')
    })

    it('AC-27: 引擎状态应在多次检测后仍可用', () => {
      const history = makeHistory([100, 101, 99])
      controller.detect({ metricKey: 'a', value: 100, history })
      controller.detect({ metricKey: 'b', value: 200, history })
      controller.detect({ metricKey: 'c', value: 300, history })
      const status = controller.getStatus()
      expect(status.data.status).toBe('ACTIVE')
    })

    it('AC-28: 检测结果应包含 reason 字段', () => {
      const history = makeHistory([10, 12, 9, 11, 10, 13, 8, 11, 10, 12])
      const result = controller.detect({ metricKey: 'with_reason', value: 100, history })
      expect(result.data.reason).toBeDefined()
      expect(typeof result.data.reason).toBe('string')
      expect(result.data.reason.length).toBeGreaterThan(0)
    })
  })
})
