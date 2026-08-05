/**
 * health.service.spec.ts — 健康检查纯函数式测试
 * 只导入 enum/type，不 import 生产 Service
 */
import { describe, it, expect } from 'vitest'
import assert from 'node:assert/strict'

// ─── 枚举 + 类型定义 ──────────────────────────────────────────────

type HealthStatus = 'OK' | 'DEGRADED' | 'UNAVAILABLE'

interface ComponentHealth {
  name: string
  status: HealthStatus
  latencyMs: number
  detail?: Record<string, unknown>
}

interface HealthCheckResult {
  status: HealthStatus
  checkedAt: string
  uptimeSeconds: number
  components: ComponentHealth[]
  version: string
  lytMode?: string
  sampleMember?: Record<string, unknown> | null
}

// ─── 纯函数 ─────────────────────────────────────────────────────

function toHealthCheckResult(
  components: ComponentHealth[],
  overrides: { uptimeSeconds: number; version: string; lytMode?: string; sampleMember?: Record<string, unknown> | null },
): HealthCheckResult {
  const worstStatus = components.reduce<HealthStatus>((worst, c) => {
    if (c.status === 'UNAVAILABLE') return 'UNAVAILABLE'
    if (c.status === 'DEGRADED' && worst !== 'UNAVAILABLE') return 'DEGRADED'
    return worst
  }, 'OK')

  return {
    status: worstStatus,
    checkedAt: new Date().toISOString(),
    uptimeSeconds: overrides.uptimeSeconds,
    version: overrides.version,
    components,
    lytMode: overrides.lytMode,
    sampleMember: overrides.sampleMember,
  }
}

function isHealthy(result: HealthCheckResult): boolean {
  return result.status === 'OK'
}

function isDegraded(result: HealthCheckResult): boolean {
  return result.status === 'DEGRADED'
}

function aggregateStatus(components: ComponentHealth[]): HealthStatus {
  return toHealthCheckResult(components, { uptimeSeconds: 0, version: '0.0.0' }).status
}

function composeComponent(overrides: Partial<ComponentHealth> = {}): ComponentHealth {
  return {
    name: 'test-component',
    status: 'OK',
    latencyMs: 10,
    ...overrides,
  }
}

function calcUptime(bootMs: number): number {
  return Math.floor((Date.now() - bootMs) / 1000)
}

function probeFailover(name: string, errors: Record<string, string>): ComponentHealth {
  const start = Date.now()
  const error = errors[name]
  if (error) {
    return { name, status: 'UNAVAILABLE', latencyMs: Date.now() - start, detail: { error } }
  }
  return { name, status: 'OK', latencyMs: Date.now() - start, detail: { connected: true } }
}

// ─── 测试 ─────────────────────────────────────────────────────

describe('health.service.spec: toHealthCheckResult', () => {
  it('[1] 所有组件 OK → 整体 OK', () => {
    const result = toHealthCheckResult(
      [composeComponent({ name: 'db' }), composeComponent({ name: 'lyt' })],
      { uptimeSeconds: 3600, version: '1.0.0' },
    )
    assert.equal(result.status, 'OK')
    assert.equal(result.components.length, 2)
    assert.equal(result.uptimeSeconds, 3600)
    assert.equal(result.version, '1.0.0')
  })

  it('[2] 一个组件 DEGRADED → 整体 DEGRADED', () => {
    const result = toHealthCheckResult(
      [
        composeComponent({ name: 'db', status: 'OK' }),
        composeComponent({ name: 'redis', status: 'DEGRADED', latencyMs: 500 }),
      ],
      { uptimeSeconds: 100, version: '2.0.0' },
    )
    assert.equal(result.status, 'DEGRADED')
  })

  it('[3] 一个组件 UNAVAILABLE → 整体 UNAVAILABLE', () => {
    const result = toHealthCheckResult(
      [
        composeComponent({ name: 'db', status: 'OK' }),
        composeComponent({ name: 'redis', status: 'UNAVAILABLE' }),
      ],
      { uptimeSeconds: 50, version: '3.0.0' },
    )
    assert.equal(result.status, 'UNAVAILABLE')
  })

  it('[4] UNAVAILABLE 优先级高于 DEGRADED', () => {
    const result = toHealthCheckResult(
      [
        composeComponent({ name: 'db', status: 'UNAVAILABLE' }),
        composeComponent({ name: 'redis', status: 'DEGRADED' }),
      ],
      { uptimeSeconds: 10, version: '4.0.0' },
    )
    assert.equal(result.status, 'UNAVAILABLE')
  })

  it('[5] 空组件列表 → OK', () => {
    const result = toHealthCheckResult([], { uptimeSeconds: 0, version: '0.0.0' })
    assert.equal(result.status, 'OK')
    assert.equal(result.components.length, 0)
  })

  it('[6] checkedAt 是有效 ISO 日期', () => {
    const result = toHealthCheckResult([composeComponent()], { uptimeSeconds: 1, version: '1.0.0' })
    assert.ok(!Number.isNaN(Date.parse(result.checkedAt)))
  })

  it('[7] lytMode 和 sampleMember 传递', () => {
    const member = { memberId: 'm-001', nickname: 'Test', levelName: 'VIP' }
    const result = toHealthCheckResult([composeComponent()], {
      uptimeSeconds: 100,
      version: '1.0.0',
      lytMode: 'mock',
      sampleMember: member,
    })
    assert.equal(result.lytMode, 'mock')
    assert.deepStrictEqual(result.sampleMember, member)
  })
})

describe('health.service.spec: isHealthy', () => {
  it('[8] OK → true', () => {
    assert.equal(isHealthy({ status: 'OK', checkedAt: '', uptimeSeconds: 1, components: [], version: '' }), true)
  })

  it('[9] DEGRADED → false', () => {
    assert.equal(isHealthy({ status: 'DEGRADED', checkedAt: '', uptimeSeconds: 1, components: [], version: '' }), false)
  })

  it('[10] UNAVAILABLE → false', () => {
    assert.equal(isHealthy({ status: 'UNAVAILABLE', checkedAt: '', uptimeSeconds: 1, components: [], version: '' }), false)
  })
})

describe('health.service.spec: isDegraded', () => {
  it('[11] DEGRADED → true', () => {
    assert.equal(isDegraded({ status: 'DEGRADED', checkedAt: '', uptimeSeconds: 1, components: [], version: '' }), true)
  })

  it('[12] OK → false', () => {
    assert.equal(isDegraded({ status: 'OK', checkedAt: '', uptimeSeconds: 1, components: [], version: '' }), false)
  })

  it('[13] UNAVAILABLE → false', () => {
    assert.equal(isDegraded({ status: 'UNAVAILABLE', checkedAt: '', uptimeSeconds: 1, components: [], version: '' }), false)
  })
})

describe('health.service.spec: aggregateStatus', () => {
  it('[14] 全部 OK → OK', () => {
    assert.equal(aggregateStatus([composeComponent({ name: 'a' }), composeComponent({ name: 'b' })]), 'OK')
  })

  it('[15] 全部 DEGRADED → DEGRADED', () => {
    assert.equal(aggregateStatus([composeComponent({ name: 'a', status: 'DEGRADED' }), composeComponent({ name: 'b', status: 'DEGRADED' })]), 'DEGRADED')
  })

  it('[16] 全部 UNAVAILABLE → UNAVAILABLE', () => {
    assert.equal(aggregateStatus([composeComponent({ name: 'a', status: 'UNAVAILABLE' }), composeComponent({ name: 'b', status: 'UNAVAILABLE' })]), 'UNAVAILABLE')
  })

  it('[17] 混合: OK + DEGRADED → DEGRADED', () => {
    assert.equal(aggregateStatus([composeComponent({ name: 'a', status: 'OK' }), composeComponent({ name: 'b', status: 'DEGRADED' })]), 'DEGRADED')
  })

  it('[18] 混合: OK + UNAVAILABLE → UNAVAILABLE', () => {
    assert.equal(aggregateStatus([composeComponent({ name: 'a', status: 'OK' }), composeComponent({ name: 'b', status: 'UNAVAILABLE' })]), 'UNAVAILABLE')
  })
})

describe('health.service.spec: probeFailover', () => {
  it('[19] 正常组件返回 OK + detail', () => {
    const c = probeFailover('database', {})
    assert.equal(c.status, 'OK')
    assert.deepStrictEqual(c.detail, { connected: true })
  })

  it('[20] 故障组件返回 UNAVAILABLE + 错误信息', () => {
    const c = probeFailover('redis', { redis: 'connection refused' })
    assert.equal(c.status, 'UNAVAILABLE')
    assert.deepStrictEqual(c.detail, { error: 'connection refused' })
  })
})

describe('health.service.spec: calcUptime', () => {
  it('[21] uptime 在合理范围内', () => {
    const boot = Date.now() - 5000 // 5s ago
    const uptime = calcUptime(boot)
    assert.ok(uptime >= 4 && uptime <= 6)
  })

  it('[22] 刚刚启动的 uptime 为 0', () => {
    const uptime = calcUptime(Date.now())
    assert.equal(uptime, 0)
  })
})
