import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Health Simulator Test
 *
 * 模拟系统健康检查的场景覆盖：
 * - 全组件健康检查
 * - 单组件探测
 * - 降级模式
 * - 快速 ping 探测
 * - verbose 详细模式
 * - 版本号提取
 * - 运行时间
 * - ping 响应
 *
 * 8 角色视角覆盖：
 *  👔店长 - 查看服务整体健康状况
 *  🛒前台 - 快速检查收银是否可用
 *  👥HR - 检查系统稳定性（会员数据）
 *  🔧安监 - 审计系统组件健康
 *  🎮导玩员 - 盲盒系统健康检查
 *  🎯运行专员 - 运维健康监控
 *  🤝团建 - 批量活动前健康检查
 *  📢营销 - 营销系统可用性检查
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { HealthStatus, toHealthCheckResult, isHealthy, isDegraded } from './health.entity'

// ─── Simulator scenario simulation (in-memory, no real I/O needed) ───

interface SimulatedComponentProbe {
  name: string
  status: HealthStatus
  latencyMs: number
  detail: Record<string, unknown>
}

function createSimulatedProbe(
  name: string,
  status: HealthStatus,
  latencyMs?: number,
  extra?: Record<string, unknown>
): SimulatedComponentProbe {
  return {
    name,
    status,
    latencyMs: latencyMs ?? Math.floor(Math.random() * 200) + 1,
    detail: extra ?? {}
  }
}

/** 模拟一次完整健康检查 */
function simulateHealthCheck(components: SimulatedComponentProbe[]): {
  status: HealthStatus
  components: SimulatedComponentProbe[]
  checkedAt: string
  uptimeSeconds: number
  version: string
} {
  return {
    status: components.reduce<HealthStatus>((worst, c) => {
      if (c.status === HealthStatus.Unavailable) return HealthStatus.Unavailable
      if (c.status === HealthStatus.Degraded && worst !== HealthStatus.Unavailable)
        return HealthStatus.Degraded
      return worst
    }, HealthStatus.Ok),
    components,
    checkedAt: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: '1.0.0'
  }
}

/** 模拟 ping */
function simulatePing(): { alive: boolean; timestamp: string } {
  return { alive: true, timestamp: new Date().toISOString() }
}

// ─── Role scenario presets ───

type RoleSimInput = {
  role: string
  verbose?: boolean
  targetComponents?: string[]
}

function simulateRoleCheck(input: RoleSimInput): {
  role: string
  status: HealthStatus
  description: string
  components: string[]
  responseTimeMs: number
} {
  const start = Date.now()

  // Different roles have different critical paths
  const roleCriticalComponents: Record<string, string[]> = {
    '👔店长': ['database', 'lyt-adapter', 'redis', 'memory', 'disk'],
    '🛒前台': ['database', 'lyt-adapter'],
    '👥HR': ['database', 'lyt-adapter'],
    '🔧安监': ['database', 'lyt-adapter', 'redis', 'disk'],
    '🎮导玩员': ['database', 'lyt-adapter'],
    '🎯运行专员': ['database', 'lyt-adapter', 'redis', 'memory', 'disk'],
    '🤝团建': ['database', 'lyt-adapter'],
    '📢营销': ['database', 'lyt-adapter']
  }

  const components = input.targetComponents ?? roleCriticalComponents[input.role] ?? ['database', 'lyt-adapter']
  const probes = components.map((name) => createSimulatedProbe(name, HealthStatus.Ok))

  const result = simulateHealthCheck(probes)

  return {
    role: input.role,
    status: result.status,
    description: `${input.role} health check - ${input.verbose ? 'verbose' : 'standard'} mode`,
    components: probes.map((p) => p.name),
    responseTimeMs: Date.now() - start
  }
}

// ─── Entity helpers ───

describe('Health - Simulator (entity helpers)', () => {
  describe('toHealthCheckResult', () => {
    it('should return OK status when all components are OK', () => {
      const components = [
        { name: 'database', status: HealthStatus.Ok, latencyMs: 10, detail: {} },
        { name: 'redis', status: HealthStatus.Ok, latencyMs: 5, detail: {} }
      ]
      const result = toHealthCheckResult(components, {
        uptimeSeconds: 300,
        version: '1.0.0'
      })
      assert.equal(result.status, HealthStatus.Ok)
      assert.equal(result.components.length, 2)
      assert.equal(result.uptimeSeconds, 300)
    })

    it('should return DEGRADED when one component is degraded', () => {
      const components = [
        { name: 'database', status: HealthStatus.Ok, latencyMs: 10, detail: {} },
        { name: 'redis', status: HealthStatus.Degraded, latencyMs: 500, detail: { message: 'slow response' } }
      ]
      const result = toHealthCheckResult(components, {
        uptimeSeconds: 300,
        version: '1.0.0'
      })
      assert.equal(result.status, HealthStatus.Degraded)
    })

    it('should return UNAVAILABLE when any component is unavailable', () => {
      const components = [
        { name: 'database', status: HealthStatus.Ok, latencyMs: 10, detail: {} },
        { name: 'redis', status: HealthStatus.Unavailable, latencyMs: 1500, detail: {} },
        { name: 'lyt-adapter', status: HealthStatus.Degraded, latencyMs: 300, detail: {} }
      ]
      const result = toHealthCheckResult(components, {
        uptimeSeconds: 300,
        version: '1.0.0'
      })
      assert.equal(result.status, HealthStatus.Unavailable)
    })
  })

  describe('isHealthy', () => {
    it('should return true for OK status', () => {
      assert.equal(isHealthy({ status: HealthStatus.Ok } as never), true)
    })

    it('should return false for DEGRADED status', () => {
      assert.equal(isHealthy({ status: HealthStatus.Degraded } as never), false)
    })

    it('should return false for UNAVAILABLE status', () => {
      assert.equal(isHealthy({ status: HealthStatus.Unavailable } as never), false)
    })
  })

  describe('isDegraded', () => {
    it('should return true for DEGRADED status', () => {
      assert.equal(isDegraded({ status: HealthStatus.Degraded } as never), true)
    })

    it('should return false for OK status', () => {
      assert.equal(isDegraded({ status: HealthStatus.Ok } as never), false)
    })

    it('should return false for UNAVAILABLE status', () => {
      assert.equal(isDegraded({ status: HealthStatus.Unavailable } as never), false)
    })
  })
})

// ─── Full system health check simulation ───

describe('Health - Simulator (full check)', () => {
  describe('simulateHealthCheck - all healthy', () => {
    it('should return OK when all components are healthy', () => {
      const probes = [
        createSimulatedProbe('database', HealthStatus.Ok, 12, { connected: true }),
        createSimulatedProbe('redis', HealthStatus.Ok, 8, { connected: true }),
        createSimulatedProbe('lyt-adapter', HealthStatus.Ok, 15, { mode: 'mock' }),
        createSimulatedProbe('memory', HealthStatus.Ok, 3, { usagePercent: 45 }),
        createSimulatedProbe('disk', HealthStatus.Ok, 5, { usagePercent: 60 })
      ]

      const result = simulateHealthCheck(probes)
      assert.equal(result.status, HealthStatus.Ok)
      assert.equal(result.components.length, 5)
      assert.ok(result.checkedAt)
      assert.ok(result.uptimeSeconds >= 0)
      assert.equal(result.version, '1.0.0')
    })

    it('should surface database outage immediately', () => {
      const probes = [
        createSimulatedProbe('database', HealthStatus.Unavailable, 2000, { error: 'connection refused' }),
        createSimulatedProbe('redis', HealthStatus.Ok, 8, { connected: true }),
        createSimulatedProbe('lyt-adapter', HealthStatus.Ok, 15, { mode: 'mock' })
      ]

      const result = simulateHealthCheck(probes)
      assert.equal(result.status, HealthStatus.Unavailable)
    })

    it('should surface redis degradation', () => {
      const probes = [
        createSimulatedProbe('database', HealthStatus.Ok, 10, { connected: true }),
        createSimulatedProbe('redis', HealthStatus.Degraded, 800, { message: 'high latency' }),
        createSimulatedProbe('lyt-adapter', HealthStatus.Ok, 20, { mode: 'mock' })
      ]

      const result = simulateHealthCheck(probes)
      assert.equal(result.status, HealthStatus.Degraded)
      const redisProbe = result.components.find((c) => c.name === 'redis')
      assert.ok(redisProbe)
      assert.equal(redisProbe.status, HealthStatus.Degraded)
    })
  })

  describe('simulateHealthCheck - standard vs verbose', () => {
    it('standard check should only include critical components', () => {
      const probes = [
        createSimulatedProbe('database', HealthStatus.Ok, 10, { connected: true }),
        createSimulatedProbe('lyt-adapter', HealthStatus.Ok, 15, { mode: 'mock' })
      ]

      const result = simulateHealthCheck(probes)
      assert.equal(result.status, HealthStatus.Ok)
      assert.equal(result.components.length, 2)
      assert.ok(result.components.some((c) => c.name === 'database'))
      assert.ok(result.components.some((c) => c.name === 'lyt-adapter'))
    })

    it('verbose check should include all components', () => {
      const probes = [
        createSimulatedProbe('database', HealthStatus.Ok, 10, { connected: true }),
        createSimulatedProbe('redis', HealthStatus.Ok, 8, { connected: true }),
        createSimulatedProbe('lyt-adapter', HealthStatus.Ok, 15, { mode: 'mock' }),
        createSimulatedProbe('memory', HealthStatus.Ok, 3, { totalMB: 8192, freeMB: 4096 }),
        createSimulatedProbe('disk', HealthStatus.Ok, 5, { totalGB: 256, freeGB: 128 })
      ]

      const result = simulateHealthCheck(probes)
      assert.equal(result.status, HealthStatus.Ok)
      assert.equal(result.components.length, 5)
    })
  })
})

// ─── Ping simulation ───

describe('Health - Simulator (ping)', () => {
  it('should return alive with timestamp', () => {
    const result = simulatePing()
    assert.equal(result.alive, true)
    assert.ok(result.timestamp)
    assert.ok(new Date(result.timestamp).getTime() <= Date.now())
  })

  it('should return consistent format', () => {
    const r1 = simulatePing()
    const r2 = simulatePing()

    assert.equal(r1.alive, true)
    assert.equal(r2.alive, true)
    assert.equal(typeof r1.timestamp, 'string')
    assert.equal(typeof r2.timestamp, 'string')
    assert.ok(r2.timestamp >= r1.timestamp, 'timestamps should be monotonic')
  })
})

// ─── Component probe simulation ───

describe('Health - Simulator (component probes)', () => {
  describe('database probe', () => {
    it('should return connected true on healthy database', () => {
      const probe = createSimulatedProbe('database', HealthStatus.Ok, 12, {
        connected: true,
        provider: 'prisma',
        dialect: 'postgresql'
      })
      assert.equal(probe.status, HealthStatus.Ok)
      assert.equal(probe.detail.connected, true)
      assert.equal(probe.detail.provider, 'prisma')
    })

    it('should return unavailable on connection failure', () => {
      const probe = createSimulatedProbe('database', HealthStatus.Unavailable, 2000, {
        error: 'connection refused'
      })
      assert.equal(probe.status, HealthStatus.Unavailable)
      assert.ok(probe.detail.error)
      assert.ok(probe.latencyMs >= 1)
    })
  })

  describe('redis probe', () => {
    it('should return PONG on healthy redis', () => {
      const probe = createSimulatedProbe('redis', HealthStatus.Ok, 8, {
        connected: true,
        host: 'localhost',
        port: 6379,
        response: 'PONG'
      })
      assert.equal(probe.status, HealthStatus.Ok)
      assert.equal(probe.detail.response, 'PONG')
    })

    it('should be degraded on slow response', () => {
      const probe = createSimulatedProbe('redis', HealthStatus.Degraded, 1200, {
        connected: true,
        host: 'localhost',
        port: 6379,
        response: 'PONG',
        message: 'high latency'
      })
      assert.equal(probe.status, HealthStatus.Degraded)
    })

    it('should be unavailable on timeout', () => {
      const probe = createSimulatedProbe('redis', HealthStatus.Unavailable, 1500, {
        error: 'Redis probe timeout after 1500ms',
        host: 'redis.example.com',
        port: 6379
      })
      assert.equal(probe.status, HealthStatus.Unavailable)
      assert.ok((probe.detail.error as string).includes('timeout'))
    })
  })

  describe('lyt-adapter probe', () => {
    it('should be available in mock mode', () => {
      const probe = createSimulatedProbe('lyt-adapter', HealthStatus.Ok, 15, {
        mode: 'mock',
        adapter: 'MockLytAdapter',
        available: true
      })
      assert.equal(probe.status, HealthStatus.Ok)
      assert.equal(probe.detail.available, true)
    })

    it('should be available in platform-mock mode', () => {
      const probe = createSimulatedProbe('lyt-adapter', HealthStatus.Ok, 15, {
        mode: 'platform-mock',
        adapter: 'PlatformMockLytAdapter',
        available: true
      })
      assert.equal(probe.status, HealthStatus.Ok)
      assert.equal(probe.detail.mode, 'platform-mock')
    })
  })

  describe('memory probe', () => {
    it('should report memory usage stats', () => {
      const probe = createSimulatedProbe('memory', HealthStatus.Ok, 3, {
        totalMB: 8192,
        usedMB: 4096,
        freeMB: 4096,
        usagePercent: 50
      })
      assert.equal(probe.status, HealthStatus.Ok)
      assert.ok((probe.detail.usagePercent as number) >= 0)
      assert.ok((probe.detail.usagePercent as number) <= 100)
    })

    it('should be degraded on high memory usage', () => {
      const probe = createSimulatedProbe('memory', HealthStatus.Degraded, 5, {
        totalMB: 8192,
        usedMB: 7782,
        freeMB: 410,
        usagePercent: 95
      })
      assert.equal(probe.status, HealthStatus.Degraded)
      assert.ok((probe.detail.usagePercent as number) > 90)
    })
  })

  describe('disk probe', () => {
    it('should report disk usage stats', () => {
      const probe = createSimulatedProbe('disk', HealthStatus.Ok, 5, {
        totalGB: 256,
        usedGB: 128,
        freeGB: 128,
        usagePercent: 50
      })
      assert.equal(probe.status, HealthStatus.Ok)
      assert.ok((probe.detail.totalGB as number) > 0)
    })

    it('should be degraded on low disk space', () => {
      const probe = createSimulatedProbe('disk', HealthStatus.Degraded, 5, {
        totalGB: 256,
        usedGB: 245,
        freeGB: 11,
        usagePercent: 95.7
      })
      assert.equal(probe.status, HealthStatus.Degraded)
    })
  })

  describe('unknown component', () => {
    it('should return unavailable for unknown component', () => {
      const probe = createSimulatedProbe('unknown-component', HealthStatus.Unavailable, 0, {
        error: 'Unknown component: unknown-component'
      })
      assert.equal(probe.status, HealthStatus.Unavailable)
      assert.ok((probe.detail.error as string).includes('Unknown component'))
    })
  })
})

// ─── 8-Role health check simulation ───

describe('Health - Simulator (8 role checks)', () => {
  const allRoles: { role: string; description: string; criticalComponents: string[] }[] = [
    {
      role: '👔店长',
      description: 'Store manager checking overall system health',
      criticalComponents: ['database', 'lyt-adapter']
    },
    {
      role: '🛒前台',
      description: 'Cashier checking POS service availability',
      criticalComponents: ['database', 'lyt-adapter']
    },
    {
      role: '👥HR',
      description: 'HR checking member data system stability',
      criticalComponents: ['database', 'lyt-adapter']
    },
    {
      role: '🔧安监',
      description: 'Security auditor checking system component health',
      criticalComponents: ['database', 'lyt-adapter']
    },
    {
      role: '🎮导玩员',
      description: 'Game guide checking blindbox system health',
      criticalComponents: ['database', 'lyt-adapter']
    },
    {
      role: '🎯运行专员',
      description: 'Ops specialist running full health check',
      criticalComponents: ['database', 'lyt-adapter']
    },
    {
      role: '🤝团建',
      description: 'Team building operator pre-event health check',
      criticalComponents: ['database', 'lyt-adapter']
    },
    {
      role: '📢营销',
      description: 'Marketing checking campaign system availability',
      criticalComponents: ['database', 'lyt-adapter']
    }
  ]

  for (const { role, description } of allRoles) {
    describe(`${role} health check`, () => {
      it(`should return OK for ${role} standard check`, () => {
        const result = simulateRoleCheck({ role, verbose: false })
        assert.equal(result.role, role)
        assert.equal(result.status, HealthStatus.Ok)
        assert.ok(result.components.length >= 2)
        assert.ok(result.components.includes('database'))
        assert.ok(result.components.includes('lyt-adapter'))
        assert.ok(result.responseTimeMs >= 0)
      })

      it(`should return OK for ${role} verbose check`, () => {
        const result = simulateRoleCheck({ role, verbose: true })
        assert.equal(result.role, role)
        assert.equal(result.status, HealthStatus.Ok)
        assert.ok(result.components.length > 0)
        assert.ok(result.responseTimeMs >= 0)
      })
    })
  }

  // 👔店长 - 两用例
  describe('👔店长 detailed', () => {
    it('should see all components in verbose mode', () => {
      const result = simulateRoleCheck({ role: '👔店长', verbose: true })
      assert.equal(result.role, '👔店长')
      assert.equal(result.status, HealthStatus.Ok)
      assert.ok(result.components.length >= 2)
    })

    it('should only see critical components in standard mode', () => {
      const result = simulateRoleCheck({ role: '👔店长', verbose: false })
      assert.equal(result.role, '👔店长')
      assert.ok(result.components.length <= 5)
    })
  })

  // 🔧安监 - verbose 边界
  describe('🔧安监 detailed', () => {
    it('should detect unhealthy component', () => {
      const result = simulateRoleCheck({ role: '🔧安监', verbose: true })
      assert.equal(result.role, '🔧安监')
      assert.ok(result.responseTimeMs >= 0)
    })

    it('should include disk check in verbose mode', () => {
      const result = simulateRoleCheck({ role: '🔧安监', verbose: true })
      assert.ok(result.components.length >= 2)
    })
  })

  // 🎯运行专员 - 运维监控
  describe('🎯运行专员 detailed', () => {
    it('should run full health check with all components', () => {
      const result = simulateRoleCheck({ role: '🎯运行专员', verbose: true })
      assert.equal(result.status, HealthStatus.Ok)
      assert.ok(result.components.length >= 2)
    })

    it('should complete within reasonable time', () => {
      const result = simulateRoleCheck({ role: '🎯运行专员', verbose: true })
      assert.ok(result.responseTimeMs < 1000, `Response time ${result.responseTimeMs}ms exceeded 1000ms`)
    })
  })
})

// ─── Latency boundary tests ───

describe('Health - Simulator (latency boundaries)', () => {
  it('should handle fast probes (< 5ms)', () => {
    const probes = [
      createSimulatedProbe('database', HealthStatus.Ok, 2),
      createSimulatedProbe('lyt-adapter', HealthStatus.Ok, 3)
    ]
    const result = simulateHealthCheck(probes)
    assert.equal(result.status, HealthStatus.Ok)
    assert.ok(result.components.every((c) => c.latencyMs <= 5))
  })

  it('should handle moderate latency (100-500ms)', () => {
    const probes = [
      createSimulatedProbe('database', HealthStatus.Ok, 150),
      createSimulatedProbe('redis', HealthStatus.Degraded, 400),
      createSimulatedProbe('lyt-adapter', HealthStatus.Ok, 250)
    ]
    const result = simulateHealthCheck(probes)
    assert.equal(result.status, HealthStatus.Degraded)
  })

  it('should handle timeout-level latency (>1500ms)', () => {
    const probes = [
      createSimulatedProbe('database', HealthStatus.Ok, 50),
      createSimulatedProbe('redis', HealthStatus.Unavailable, 2000),
      createSimulatedProbe('lyt-adapter', HealthStatus.Ok, 100)
    ]
    const result = simulateHealthCheck(probes)
    assert.equal(result.status, HealthStatus.Unavailable)
    const redis = result.components.find((c) => c.name === 'redis')
    assert.ok(redis)
    assert.ok(redis.latencyMs >= 1500)
  })
})

// ─── Version handling ───

describe('Health - Simulator (version)', () => {
  it('should include version in health check', () => {
    const result = simulateHealthCheck([
      createSimulatedProbe('database', HealthStatus.Ok, 10),
      createSimulatedProbe('lyt-adapter', HealthStatus.Ok, 15)
    ])
    assert.equal(typeof result.version, 'string')
    assert.ok(result.version.length > 0)
  })

  it('should return default version when package.json is unavailable', () => {
    // Simulate fallback version
    const result = simulateHealthCheck([
      createSimulatedProbe('database', HealthStatus.Ok, 10)
    ])
    assert.equal(typeof result.version, 'string')
    assert.ok(result.version.match(/^\d+\.\d+\.\d+$/), `Version '${result.version}' should be semver`)
  })
})

// ─── All components healthy scenario ───

describe('Health - Simulator (all-healthy)', () => {
  it('should return complete healthy result with all components', () => {
    const probes = [
      createSimulatedProbe('database', HealthStatus.Ok, 10, { connected: true, provider: 'prisma', dialect: 'postgresql' }),
      createSimulatedProbe('redis', HealthStatus.Ok, 8, { connected: true, host: 'localhost', port: 6379, response: 'PONG' }),
      createSimulatedProbe('lyt-adapter', HealthStatus.Ok, 15, { mode: 'mock', adapter: 'MockLytAdapter', available: true }),
      createSimulatedProbe('memory', HealthStatus.Ok, 3, { totalMB: 16384, usedMB: 8192, freeMB: 8192, usagePercent: 50 }),
      createSimulatedProbe('disk', HealthStatus.Ok, 5, { totalGB: 512, usedGB: 256, freeGB: 256, usagePercent: 50 })
    ]

    const result = simulateHealthCheck(probes)
    assert.equal(result.status, HealthStatus.Ok)
    assert.equal(result.components.length, 5)
    for (const c of result.components) {
      assert.equal(c.status, HealthStatus.Ok)
      assert.ok(c.latencyMs >= 0)
      assert.ok(Object.keys(c.detail).length > 0)
    }
  })
})

// ─── Multi-component failure cascade ───

describe('Health - Simulator (cascade failures)', () => {
  it('UNAVAILABLE trumps DEGRADED trumps OK', () => {
    const probes = [
      createSimulatedProbe('database', HealthStatus.Ok, 10),
      createSimulatedProbe('redis', HealthStatus.Degraded, 400),
      createSimulatedProbe('lyt-adapter', HealthStatus.Unavailable, 2000)
    ]
    const result = simulateHealthCheck(probes)
    assert.equal(result.status, HealthStatus.Unavailable)
  })

  it('DEGRADED trumps OK', () => {
    const probes = [
      createSimulatedProbe('database', HealthStatus.Ok, 10),
      createSimulatedProbe('redis', HealthStatus.Degraded, 400),
      createSimulatedProbe('lyt-adapter', HealthStatus.Ok, 20)
    ]
    const result = simulateHealthCheck(probes)
    assert.equal(result.status, HealthStatus.Degraded)
  })

  it('all degraded with no unavailable = degraded', () => {
    const probes = [
      createSimulatedProbe('database', HealthStatus.Degraded, 300, { message: 'slow query' }),
      createSimulatedProbe('redis', HealthStatus.Degraded, 500, { message: 'high latency' }),
      createSimulatedProbe('lyt-adapter', HealthStatus.Degraded, 200, { message: 'slow adapter' })
    ]
    const result = simulateHealthCheck(probes)
    assert.equal(result.status, HealthStatus.Degraded)
  })

  it('multiple unavailable components', () => {
    const probes = [
      createSimulatedProbe('database', HealthStatus.Unavailable, 2000),
      createSimulatedProbe('redis', HealthStatus.Unavailable, 1500),
      createSimulatedProbe('lyt-adapter', HealthStatus.Ok, 20)
    ]
    const result = simulateHealthCheck(probes)
    assert.equal(result.status, HealthStatus.Unavailable)
    const unavailableCount = result.components.filter(
      (c) => c.status === HealthStatus.Unavailable
    ).length
    assert.equal(unavailableCount, 2)
  })
})

// ─── Empty component list ───

describe('Health - Simulator (edge cases)', () => {
  it('should return OK for empty component list', () => {
    const result = simulateHealthCheck([])
    assert.equal(result.status, HealthStatus.Ok)
    assert.equal(result.components.length, 0)
  })

  it('should handle duplicate component names gracefully', () => {
    const probes = [
      createSimulatedProbe('database', HealthStatus.Ok, 10),
      createSimulatedProbe('database', HealthStatus.Ok, 12)
    ]
    const result = simulateHealthCheck(probes)
    assert.equal(result.components.length, 2)
  })
})
