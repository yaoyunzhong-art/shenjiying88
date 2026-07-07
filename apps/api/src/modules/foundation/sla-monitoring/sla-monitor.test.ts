import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import assert from 'node:assert/strict'
import { SlaMonitorImpl } from './sla-monitor'
import { CanaryRouter } from '../platform-abstractions/canary-router'
import type { SlaAlert } from './sla-monitor.port'

/**
 * P3-3.3 SLA 监控 5 子套件测试
 *
 *   1. record + 滑动窗口 + 多 scope
 *   2. getMetrics: p95/p99/avg/errorRate/throughput 计算
 *   3. setThresholds + 越界告警
 *   4. 告警严重度 (info/warning/critical)
 *   5. 集成: 告警 → CanaryRouter 自动回滚
 */

// ═══════════════════════════════════════════════════════════════
// 1. record + 滑动窗口
// ═══════════════════════════════════════════════════════════════

describe('SlaMonitor · 记录 + 滑动窗口', () => {
  it('1.1 record 单条: 累计到对应 scope', () => {
    const m = new SlaMonitorImpl()
    m.record({ durationMs: 100, success: true, scope: 'p1', at: Date.now() })
    const metrics = m.getMetrics('p1')
    assert.equal(metrics.sampleCount, 1)
    assert.equal(metrics.avgDurationMs, 100)
  })

  it('1.2 recordBatch 批量: 一次性累加', () => {
    const m = new SlaMonitorImpl()
    const now = Date.now()
    m.recordBatch([
      { durationMs: 10, success: true, scope: 'p1', at: now },
      { durationMs: 20, success: true, scope: 'p1', at: now },
      { durationMs: 30, success: false, scope: 'p1', at: now }
    ])
    const metrics = m.getMetrics('p1')
    assert.equal(metrics.sampleCount, 3)
    assert.equal(metrics.errorRate, 1 / 3)
  })

  it('1.3 多 scope 独立: p1/p2 各自维护', () => {
    const m = new SlaMonitorImpl()
    const now = Date.now()
    m.record({ durationMs: 100, success: true, scope: 'p1', at: now })
    m.record({ durationMs: 200, success: true, scope: 'p2', at: now })
    assert.equal(m.getMetrics('p1').sampleCount, 1)
    assert.equal(m.getMetrics('p2').sampleCount, 1)
    assert.equal(m.getMetrics('p1').avgDurationMs, 100)
    assert.equal(m.getMetrics('p2').avgDurationMs, 200)
  })

  it('1.4 默认 scope=__global__', () => {
    const m = new SlaMonitorImpl()
    m.record({ durationMs: 50, success: true, at: Date.now() })
    const global = m.getMetrics()
    assert.equal(global.sampleCount, 1)
  })

  it('1.5 滑动窗口: 过期样本自动清理', async () => {
    const m = new SlaMonitorImpl({ windowSeconds: 1 })
    const now = Date.now()
    m.record({ durationMs: 100, success: true, scope: 'p', at: now - 2000 })
    m.record({ durationMs: 200, success: true, scope: 'p', at: now })
    // 触发 evict (新 record 时清理)
    m.record({ durationMs: 300, success: true, scope: 'p', at: Date.now() })
    const metrics = m.getMetrics('p')
    // 第一条已过期
    assert.equal(metrics.sampleCount, 2)
    assert.equal(metrics.avgDurationMs, 250)
  })

  it('1.6 reset(scope): 清空指定 scope 样本', () => {
    const m = new SlaMonitorImpl()
    m.record({ durationMs: 100, success: true, scope: 'p1', at: Date.now() })
    m.record({ durationMs: 200, success: true, scope: 'p2', at: Date.now() })
    m.reset('p1')
    assert.equal(m.getMetrics('p1').sampleCount, 0)
    assert.equal(m.getMetrics('p2').sampleCount, 1)
  })

  it('1.7 getAllMetrics: 返回所有 scope', () => {
    const m = new SlaMonitorImpl()
    m.record({ durationMs: 10, success: true, scope: 'p1', at: Date.now() })
    m.record({ durationMs: 20, success: true, scope: 'p2', at: Date.now() })
    m.record({ durationMs: 30, success: true, scope: 'p3', at: Date.now() })
    const all = m.getAllMetrics()
    assert.equal(all.length, 3)
    assert.ok(all.find((x) => x.scope === 'p1'))
    assert.ok(all.find((x) => x.scope === 'p2'))
    assert.ok(all.find((x) => x.scope === 'p3'))
  })
})

// ═══════════════════════════════════════════════════════════════
// 2. getMetrics 计算
// ═══════════════════════════════════════════════════════════════

describe('SlaMonitor · getMetrics 指标计算', () => {
  it('2.1 空 scope: 全部为 0, successRate=1', () => {
    const m = new SlaMonitorImpl()
    const metrics = m.getMetrics('empty')
    assert.equal(metrics.sampleCount, 0)
    assert.equal(metrics.successRate, 1)
    assert.equal(metrics.errorRate, 0)
    assert.equal(metrics.p95DurationMs, 0)
  })

  it('2.2 100 个样本: p95 ≈ 95th, p99 ≈ 99th', () => {
    const m = new SlaMonitorImpl()
    const now = Date.now()
    for (let i = 1; i <= 100; i++) {
      m.record({ durationMs: i, success: true, scope: 'p', at: now })
    }
    const metrics = m.getMetrics('p')
    assert.equal(metrics.sampleCount, 100)
    assert.equal(metrics.avgDurationMs, 50.5)
    // p95 索引 = ceil(0.95 * 100) - 1 = 94 → 95
    // p99 索引 = ceil(0.99 * 100) - 1 = 98 → 99
    assert.ok(metrics.p95DurationMs >= 90 && metrics.p95DurationMs <= 100, `p95=${metrics.p95DurationMs}`)
    assert.ok(metrics.p99DurationMs >= 95 && metrics.p99DurationMs <= 100, `p99=${metrics.p99DurationMs}`)
  })

  it('2.3 错误率: 50% success → errorRate=0.5', () => {
    const m = new SlaMonitorImpl()
    const now = Date.now()
    for (let i = 0; i < 5; i++) {
      m.record({ durationMs: 100, success: true, scope: 'p', at: now })
      m.record({ durationMs: 200, success: false, scope: 'p', at: now })
    }
    const metrics = m.getMetrics('p')
    assert.equal(metrics.sampleCount, 10)
    assert.equal(metrics.successRate, 0.5)
    assert.equal(metrics.errorRate, 0.5)
  })

  it('2.4 throughput: sampleCount / windowSeconds', () => {
    const m = new SlaMonitorImpl({ windowSeconds: 10 })
    const now = Date.now()
    for (let i = 0; i < 100; i++) {
      m.record({ durationMs: 10, success: true, scope: 'p', at: now })
    }
    const metrics = m.getMetrics('p')
    assert.equal(metrics.throughputPerSec, 10) // 100 / 10
  })

  it('2.5 单样本: avg=p95=p99=该值', () => {
    const m = new SlaMonitorImpl()
    m.record({ durationMs: 42, success: true, scope: 'p', at: Date.now() })
    const metrics = m.getMetrics('p')
    assert.equal(metrics.avgDurationMs, 42)
    assert.equal(metrics.p95DurationMs, 42)
    assert.equal(metrics.p99DurationMs, 42)
  })

  it('2.6 windowStart/windowEnd 时间范围', () => {
    const m = new SlaMonitorImpl({ windowSeconds: 60 })
    const now = Date.now()
    m.record({ durationMs: 100, success: true, scope: 'p', at: now })
    const metrics = m.getMetrics('p')
    assert.ok(Math.abs(metrics.windowEnd - now) < 100)
    assert.equal(metrics.windowStart, now - 60_000)
  })
})

// ═══════════════════════════════════════════════════════════════
// 3. setThresholds + 越界告警
// ═══════════════════════════════════════════════════════════════

describe('SlaMonitor · 阈值 + 告警', () => {
  it('3.1 样本数 < minSamples: 不告警 (冷启动保护)', () => {
    const m = new SlaMonitorImpl({ minSamples: 10 })
    m.setThresholds('p', { p95Ms: 100, minSamples: 10 })
    const alerts: SlaAlert[] = []
    m.onAlert((a) => { alerts.push(a) })
    for (let i = 0; i < 5; i++) {
      m.record({ durationMs: 200, success: true, scope: 'p', at: Date.now() }) // 越界
    }
    // 等等异步告警
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        assert.equal(alerts.length, 0, '样本不足不应告警')
        resolve()
      }, 50)
    })
  })

  it('3.2 p95 越界 → 触发告警', () => {
    const m = new SlaMonitorImpl({ minSamples: 5 })
    m.setThresholds('p', { p95Ms: 100, minSamples: 5 })
    const alerts: SlaAlert[] = []
    m.onAlert((a) => { alerts.push(a) })
    const now = Date.now()
    for (let i = 0; i < 10; i++) {
      m.record({ durationMs: 200, success: true, scope: 'p', at: now + i })
    }
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        assert.ok(alerts.length >= 1, '应至少告警 1 次')
        assert.ok(alerts[0].reason.includes('p95'))
        assert.equal(alerts[0].scope, 'p')
        resolve()
      }, 100)
    })
  })

  it('3.3 errorRate 越界 → 触发告警', () => {
    const m = new SlaMonitorImpl({ minSamples: 5 })
    m.setThresholds('p', { errorRate: 0.1, minSamples: 5 })
    const alerts: SlaAlert[] = []
    m.onAlert((a) => { alerts.push(a) })
    const now = Date.now()
    // 50% 错误
    for (let i = 0; i < 5; i++) {
      m.record({ durationMs: 100, success: false, scope: 'p', at: now + i })
    }
    for (let i = 0; i < 5; i++) {
      m.record({ durationMs: 100, success: true, scope: 'p', at: now + 10 + i })
    }
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        assert.ok(alerts.length >= 1)
        assert.ok(alerts[0].reason.includes('errorRate'))
        resolve()
      }, 100)
    })
  })

  it('3.4 未设阈值: 不会告警 (即使错误率高)', () => {
    const m = new SlaMonitorImpl({ minSamples: 5 })
    const alerts: SlaAlert[] = []
    m.onAlert((a) => { alerts.push(a) })
    const now = Date.now()
    for (let i = 0; i < 10; i++) {
      m.record({ durationMs: 200, success: false, scope: 'p', at: now + i })
    }
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        assert.equal(alerts.length, 0)
        resolve()
      }, 50)
    })
  })

  it('3.5 告警去重: 60s 内同 reason 不重复', () => {
    const m = new SlaMonitorImpl({ minSamples: 5 })
    m.setThresholds('p', { p95Ms: 100, minSamples: 5 })
    const alerts: SlaAlert[] = []
    m.onAlert((a) => { alerts.push(a) })
    const now = Date.now()
    for (let i = 0; i < 10; i++) {
      m.record({ durationMs: 200, success: true, scope: 'p', at: now + i })
    }
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const firstCount = alerts.length
        assert.ok(firstCount >= 1)
        // 再发 10 条 (还在 60s 内) → 不应重复
        for (let i = 0; i < 10; i++) {
          m.record({ durationMs: 200, success: true, scope: 'p', at: now + 20 + i })
        }
        setTimeout(() => {
          assert.equal(alerts.length, firstCount, '60s 内不重复告警')
          resolve()
        }, 50)
      }, 100)
    })
  })

  it('3.6 clearThresholds: 不再告警', () => {
    const m = new SlaMonitorImpl({ minSamples: 5 })
    m.setThresholds('p', { p95Ms: 100, minSamples: 5 })
    m.clearThresholds('p')
    const alerts: SlaAlert[] = []
    m.onAlert((a) => { alerts.push(a) })
    for (let i = 0; i < 10; i++) {
      m.record({ durationMs: 200, success: true, scope: 'p', at: Date.now() })
    }
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        assert.equal(alerts.length, 0)
        resolve()
      }, 50)
    })
  })

  it('3.7 多个 onAlert handler: 全部触发', () => {
    const m = new SlaMonitorImpl({ minSamples: 5 })
    m.setThresholds('p', { p95Ms: 100, minSamples: 5 })
    let a1 = 0
    let a2 = 0
    m.onAlert(() => { a1 += 1 })
    m.onAlert(() => { a2 += 1 })
    for (let i = 0; i < 10; i++) {
      m.record({ durationMs: 200, success: true, scope: 'p', at: Date.now() + i })
    }
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        assert.ok(a1 >= 1 && a2 >= 1)
        resolve()
      }, 100)
    })
  })

  it('3.8 handler 抛错: 不影响其他 handler', () => {
    const m = new SlaMonitorImpl({ minSamples: 5 })
    m.setThresholds('p', { p95Ms: 100, minSamples: 5 })
    let a2 = 0
    m.onAlert(() => { throw new Error('handler boom') })
    m.onAlert(() => { a2 += 1 })
    for (let i = 0; i < 10; i++) {
      m.record({ durationMs: 200, success: true, scope: 'p', at: Date.now() + i })
    }
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        assert.ok(a2 >= 1, '第二个 handler 应仍触发')
        resolve()
      }, 100)
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// 4. 告警严重度
// ═══════════════════════════════════════════════════════════════

describe('SlaMonitor · 告警严重度', () => {
  it('4.1 1 项越界 → info', () => {
    const m = new SlaMonitorImpl({ minSamples: 5 })
    m.setThresholds('p', { p95Ms: 100, p99Ms: 200, errorRate: 0.5, minSamples: 5 })
    const alerts: SlaAlert[] = []
    m.onAlert((a) => { alerts.push(a) })
    const now = Date.now()
    // p95 越界 (200>100) 但 p99 不越界 (<200), errorRate 0
    for (let i = 0; i < 10; i++) {
      m.record({ durationMs: 150, success: true, scope: 'p', at: now + i })
    }
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        assert.ok(alerts.length >= 1)
        assert.equal(alerts[0].severity, 'info')
        resolve()
      }, 100)
    })
  })

  it('4.2 2 项越界 (含 p99) → critical (p99 加权)', () => {
    const m = new SlaMonitorImpl({ minSamples: 5 })
    m.setThresholds('p', { p95Ms: 100, p99Ms: 200, errorRate: 0.5, minSamples: 5 })
    const alerts: SlaAlert[] = []
    m.onAlert((a) => { alerts.push(a) })
    const now = Date.now()
    for (let i = 0; i < 10; i++) {
      m.record({ durationMs: 250, success: true, scope: 'p', at: now + i }) // p95 + p99 都越界
    }
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        assert.ok(alerts.length >= 1)
        assert.equal(alerts[0].severity, 'critical')
        resolve()
      }, 100)
    })
  })

  it('4.2b 2 项越界 (仅 p95 + errorRate, 不含 p99) → warning', () => {
    const m = new SlaMonitorImpl({ minSamples: 5 })
    m.setThresholds('p', { p95Ms: 100, p99Ms: 9999, errorRate: 0.1, minSamples: 5 })
    const alerts: SlaAlert[] = []
    m.onAlert((a) => { alerts.push(a) })
    const now = Date.now()
    for (let i = 0; i < 10; i++) {
      m.record({ durationMs: 200, success: false, scope: 'p', at: now + i }) // p95 越界 + errorRate 50%
    }
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        assert.ok(alerts.length >= 1)
        assert.equal(alerts[0].severity, 'warning')
        resolve()
      }, 100)
    })
  })

  it('4.3 3 项全越界 → critical', () => {
    const m = new SlaMonitorImpl({ minSamples: 5 })
    m.setThresholds('p', { p95Ms: 100, p99Ms: 200, errorRate: 0.1, minSamples: 5 })
    const alerts: SlaAlert[] = []
    m.onAlert((a) => { alerts.push(a) })
    const now = Date.now()
    for (let i = 0; i < 10; i++) {
      m.record({ durationMs: 300, success: false, scope: 'p', at: now + i })
    }
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        assert.ok(alerts.length >= 1)
        assert.equal(alerts[0].severity, 'critical')
        resolve()
      }, 100)
    })
  })

  it('4.4 p99 越界 + 错误率越界 (共 2 项) → critical (加重规则)', () => {
    const m = new SlaMonitorImpl({ minSamples: 5 })
    m.setThresholds('p44', { p95Ms: 9999, p99Ms: 200, errorRate: 0.1, minSamples: 5 })
    const now = Date.now()
    for (let i = 0; i < 5; i++) {
      m.record({ durationMs: 100, success: false, scope: 'p44', at: now + i })
    }
    for (let i = 0; i < 5; i++) {
      m.record({ durationMs: 300, success: true, scope: 'p44', at: now + 10 + i })
    }
    // 主动 evaluate 拿到最新告警 (避免受 record 阶段多次触发影响)
    const alerts = m.evaluate('p44')
    assert.ok(alerts.length >= 1, '应至少有 1 个告警')
    assert.equal(alerts[0].severity, 'critical', `reason=${alerts[0].reason}`)
    assert.ok(alerts[0].reason.includes('p99'))
    assert.ok(alerts[0].reason.includes('errorRate'))
  })
})

// ═══════════════════════════════════════════════════════════════
// 5. 集成: SLA 告警 → CanaryRouter 自动回滚
// ═══════════════════════════════════════════════════════════════

describe('SlaMonitor × CanaryRouter · 集成 (告警自动回滚)', () => {
  it('5.1 critical 告警 → setForceRollback(true) → canary 切回 primary', () => {
    const canary = new CanaryRouter({ primaryPlatformId: 'lyt', canaryPlatformId: 'alt' })
    canary.setStage(50) // 50% 灰度
    const m = new SlaMonitorImpl({ minSamples: 5 })
    m.setThresholds('canary-platform', { p95Ms: 100, p99Ms: 200, errorRate: 0.1, minSamples: 5 })
    m.onAlert((alert) => {
      if (alert.severity === 'critical') {
        canary.setForceRollback(true)
      }
    })
    const now = Date.now()
    for (let i = 0; i < 10; i++) {
      m.record({ durationMs: 300, success: false, scope: 'canary-platform', at: now + i })
    }
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // 验证 canary 已切回 primary
        const d = canary.shouldUseCanary({ tenantId: 't-1', hashKey: 'k', stagePercentage: 100 })
        assert.equal(d.useCanary, false)
        assert.equal(d.reason, 'override_force_primary')
        // 验证 canary config
        assert.equal(canary.getConfig().forceRollback, true)
        resolve()
      }, 150)
    })
  })

  it('5.2 info / warning 不回滚 (只有 critical 才回滚)', () => {
    const canary = new CanaryRouter({ primaryPlatformId: 'lyt', canaryPlatformId: 'alt' })
    canary.setStage(50)
    const m = new SlaMonitorImpl({ minSamples: 5 })
    // 只设 p95Ms: 单项越界 → info
    m.setThresholds('p', { p95Ms: 100, minSamples: 5 })
    m.onAlert((alert) => {
      if (alert.severity === 'critical') {
        canary.setForceRollback(true)
      }
    })
    const now = Date.now()
    for (let i = 0; i < 10; i++) {
      m.record({ durationMs: 200, success: true, scope: 'p', at: now + i }) // 仅 p95 越界 (info)
    }
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        assert.equal(canary.getConfig().forceRollback, false, 'info 不应回滚')
        resolve()
      }, 100)
    })
  })

  it('5.3 告警恢复后, 业务方主动解除 forceRollback', () => {
    const canary = new CanaryRouter({ primaryPlatformId: 'lyt', canaryPlatformId: 'alt' })
    canary.setStage(50)
    const m = new SlaMonitorImpl({ minSamples: 5 })
    m.setThresholds('p', { p95Ms: 100, p99Ms: 200, errorRate: 0.1, minSamples: 5 })
    m.onAlert((alert) => {
      if (alert.severity === 'critical') canary.setForceRollback(true)
    })
    const now = Date.now()
    for (let i = 0; i < 10; i++) {
      m.record({ durationMs: 300, success: false, scope: 'p', at: now + i })
    }
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        assert.equal(canary.getConfig().forceRollback, true)
        // 业务方解除回滚 (假设运维确认)
        canary.setForceRollback(false)
        const d = canary.shouldUseCanary({ tenantId: 't', hashKey: 'k', stagePercentage: 100 })
        assert.equal(d.useCanary, true)
        resolve()
      }, 150)
    })
  })
})
