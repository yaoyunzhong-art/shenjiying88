import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { HealthController } from './health.controller'
import type { RequestTenantContext, ActorType } from '../tenant/tenant.types'
import type { CurrentActorValue } from '../foundation/identity-access/identity-access.decorator'

// ── 辅助工厂 ──
interface MockHealthService {
  ping: () => Promise<{ alive: boolean; timestamp: string }>
  check: (context?: unknown) => Promise<{ status: string; checkedAt?: string; components?: unknown[] }>
}

function tenantCtx(overrides?: Partial<RequestTenantContext>): RequestTenantContext {
  return { tenantId: 't-default', ...overrides }
}

function actorCtx(overrides?: Partial<CurrentActorValue>): CurrentActorValue {
  return {
    actorId: 'a-default',
    actorType: 'employee-user' as ActorType,
    roles: ['OPERATIONS'],
    permissions: ['foundation.governance.read'],
    authenticated: true,
    source: 'headers',
    ...overrides
  }
}

function makeMockService(overrides?: Partial<MockHealthService>): MockHealthService {
  return {
    ping: async () => ({ alive: true, timestamp: new Date().toISOString() }),
    check: async () => ({ status: 'OK', checkedAt: new Date().toISOString(), components: [] }),
    ...overrides
  }
}

function makeController(serviceOverrides?: Partial<MockHealthService>): HealthController {
  return new HealthController(makeMockService(serviceOverrides) as never)
}

// ── 元数据检查 ──
describe('路由元数据验证', () => {
  test('health controller path metadata is set', () => {
    const path = Reflect.getMetadata('path', HealthController)
    assert.equal(path, 'health')
  })

  test('getHealth route keeps GET metadata on root path', () => {
    const method = Reflect.getMetadata('method', HealthController.prototype.getHealth)
    const path = Reflect.getMetadata('path', HealthController.prototype.getHealth)
    assert.equal(method, 0) // GET
    assert.equal(path, '/')
  })

  test('getPing route has GET metadata on ping path', () => {
    const method = Reflect.getMetadata('method', HealthController.prototype.getPing)
    const path = Reflect.getMetadata('path', HealthController.prototype.getPing)
    assert.equal(method, 0) // GET
    assert.equal(path, 'ping')
  })

  test('getReadiness route has GET metadata on readiness path', () => {
    const method = Reflect.getMetadata('method', HealthController.prototype.getReadiness)
    const path = Reflect.getMetadata('path', HealthController.prototype.getReadiness)
    assert.equal(method, 0) // GET
    assert.equal(path, 'readiness')
  })
})

// ── GET /health ──
describe('GET /health（基本存活性检查）', () => {
  test('返回 alive=true 和有效 ISO 时间戳', async () => {
    const ctrl = makeController()
    const result = await ctrl.getHealth()
    assert.equal(result.alive, true)
    assert.ok(typeof result.timestamp === 'string')
    // 验证是合法 ISO 时间戳
    const parsed = new Date(result.timestamp)
    assert.ok(!isNaN(parsed.getTime()))
  })

  test('多次调用返回的 timestamp 随时间递增', async () => {
    const timestamps: string[] = []
    const ctrl = makeController({
      ping: async () => {
        const ts = new Date().toISOString()
        timestamps.push(ts)
        return { alive: true, timestamp: ts }
      }
    })

    await ctrl.getHealth()
    // 微延迟
    await new Promise(resolve => setTimeout(resolve, 10))
    await ctrl.getHealth()

    assert.ok(timestamps.length === 2)
    assert.ok(new Date(timestamps[1]) >= new Date(timestamps[0]))
  })

  test('即使服务降级，alive 依然为 true（存活探头容忍降级）', async () => {
    const ctrl = makeController({
      ping: async () => ({ alive: true, timestamp: '2026-01-01T00:00:00.000Z' })
    })
    const result = await ctrl.getHealth()
    assert.equal(result.alive, true)
  })

  test('服务不可用时 alive 应为 false（进程异常）', async () => {
    const ctrl = makeController({
      ping: async () => ({ alive: false, timestamp: new Date().toISOString() })
    })
    const result = await ctrl.getHealth()
    assert.equal(result.alive, false)
  })
})

// ── GET /health/ping ──
describe('GET /health/ping（连通性检查）', () => {
  test('返回 alive=true（正常连通）', async () => {
    let called = false
    const ctrl = makeController({
      ping: async () => {
        called = true
        return { alive: true, timestamp: new Date().toISOString() }
      }
    })
    const result = await ctrl.getPing()
    assert.equal(called, true)
    assert.equal(result.alive, true)
    assert.ok(typeof result.timestamp === 'string')
  })

  test('极短时间内连续 ping 都能正确返回', async () => {
    let callCount = 0
    const ctrl = makeController({
      ping: async () => {
        callCount++
        return { alive: true, timestamp: new Date().toISOString() }
      }
    })

    const results = await Promise.all([
      ctrl.getPing(),
      ctrl.getPing(),
      ctrl.getPing()
    ])

    assert.equal(callCount, 3)
    results.forEach(r => assert.equal(r.alive, true))
  })

  test('返回的 timestamp 是有效 ISO 8601 格式', async () => {
    const ctrl = makeController()
    const result = await ctrl.getPing()
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    assert.ok(isoRegex.test(result.timestamp), `Invalid timestamp: ${result.timestamp}`)
  })
})

// ── GET /health/readiness ──
describe('GET /health/readiness（就绪检查）', () => {
  test('verbose=false 时仅检查 database + lyt-adapter', async () => {
    let capturedContext: Record<string, unknown> | undefined
    const ctrl = makeController({
      check: async (ctx: unknown) => {
        capturedContext = ctx as Record<string, unknown>
        return {
          status: 'OK',
          checkedAt: new Date().toISOString(),
          components: [
            { name: 'database', status: 'OK', latencyMs: 1 },
            { name: 'lyt-adapter', status: 'OK', latencyMs: 2 }
          ]
        }
      }
    })

    const result = await ctrl.getReadiness(
      tenantCtx({ tenantId: 't-1', marketCode: 'zh-cn' }),
      actorCtx({ actorId: 'ops' }),
      { verbose: false }
    )
    assert.equal(result.status, 'OK')
    assert.equal(capturedContext?.verbose, false)
    assert.ok(Array.isArray((result as { components: unknown[] }).components))
  })

  test('verbose=true 时检查 5 个组件（含 memory + disk）', async () => {
    let capturedVerbose: boolean | undefined
    const ctrl = makeController({
      check: async (ctx: unknown) => {
        capturedVerbose = (ctx as Record<string, unknown>)?.verbose as boolean
        return {
          status: 'DEGRADED',
          checkedAt: new Date().toISOString(),
          components: [
            { name: 'database', status: 'OK', latencyMs: 1 },
            { name: 'redis', status: 'UNAVAILABLE', latencyMs: 1500, detail: { error: 'timeout' } },
            { name: 'lyt-adapter', status: 'OK', latencyMs: 2 },
            { name: 'memory', status: 'OK', latencyMs: 0 },
            { name: 'disk', status: 'OK', latencyMs: 1 }
          ]
        }
      }
    })

    const result = await ctrl.getReadiness(
      tenantCtx({ tenantId: 't-1', marketCode: 'zh-cn' }),
      actorCtx({ actorId: 'ops' }),
      { verbose: true }
    )
    assert.equal(capturedVerbose, true)
    assert.equal(result.status, 'DEGRADED')
  })

  test('缺少 tenantContext 时 scopeType 为 Platform', async () => {
    let capturedScope: { scopeType: string; scopeId: string } | undefined
    const ctrl = makeController({
      check: async (ctx: unknown) => {
        capturedScope = (ctx as Record<string, unknown>)?.scope as { scopeType: string; scopeId: string }
        return { status: 'OK', checkedAt: new Date().toISOString(), components: [] }
      }
    })

    await ctrl.getReadiness(
      undefined,
      actorCtx({ actorId: 'sys', actorType: 'service-account' as ActorType, roles: [], permissions: [] }),
      {}
    )
    assert.equal(capturedScope?.scopeType, 'PLATFORM')
    assert.equal(capturedScope?.scopeId, 'platform')
  })

  test('仅有 tenantId 时 scopeType 为 Tenant', async () => {
    let capturedScope: { scopeType: string; scopeId: string } | undefined
    const ctrl = makeController({
      check: async (ctx: unknown) => {
        capturedScope = (ctx as Record<string, unknown>)?.scope as { scopeType: string; scopeId: string }
        return { status: 'OK', checkedAt: new Date().toISOString(), components: [] }
      }
    })

    await ctrl.getReadiness(
      tenantCtx({ tenantId: 'acme-corp' }),
      actorCtx({ actorId: 'admin', actorType: 'tenant-user' as ActorType, roles: ['TENANT_ADMIN'] }),
      {}
    )
    assert.equal(capturedScope?.scopeType, 'TENANT')
    assert.equal(capturedScope?.scopeId, 'acme-corp')
  })

  test('有 brandId 时 scopeType 为 Brand', async () => {
    let capturedScope: { scopeType: string; scopeId: string } | undefined
    const ctrl = makeController({
      check: async (ctx: unknown) => {
        capturedScope = (ctx as Record<string, unknown>)?.scope as { scopeType: string; scopeId: string }
        return { status: 'OK' }
      }
    })

    await ctrl.getReadiness(
      tenantCtx({ tenantId: 't-1', brandId: 'b-brand-x' }),
      actorCtx({ actorId: 'mgr', roles: ['BRAND_MANAGER'] }),
      {}
    )
    assert.equal(capturedScope?.scopeType, 'BRAND')
    assert.equal(capturedScope?.scopeId, 'b-brand-x')
  })

  test('有 storeId 时 scopeType 为 Store（最高优先级）', async () => {
    let capturedScope: { scopeType: string; scopeId: string } | undefined
    const ctrl = makeController({
      check: async (ctx: unknown) => {
        capturedScope = (ctx as Record<string, unknown>)?.scope as { scopeType: string; scopeId: string }
        return { status: 'OK' }
      }
    })

    await ctrl.getReadiness(
      tenantCtx({ tenantId: 't-1', brandId: 'b-1', storeId: 's-store-99' }),
      actorCtx({ actorId: 'guide', roles: ['GUIDE'] }),
      {}
    )
    assert.equal(capturedScope?.scopeType, 'STORE')
    assert.equal(capturedScope?.scopeId, 's-store-99')
  })

  test('有 marketCode 时 scopeType 为 Tenant（若 tenantId 存在）', async () => {
    let capturedScope: { scopeType: string; scopeId: string } | undefined
    const ctrl = makeController({
      check: async (ctx: unknown) => {
        capturedScope = (ctx as Record<string, unknown>)?.scope as { scopeType: string; scopeId: string }
        return { status: 'OK' }
      }
    })

    // marketCode + tenantId → scopeType is TENANT (tenantId takes precedence over marketCode)
    await ctrl.getReadiness(
      tenantCtx({ tenantId: 't-1', marketCode: 'jp' }),
      actorCtx({ actorId: 'ops' }),
      {}
    )
    assert.equal(capturedScope?.scopeType, 'TENANT')
    assert.equal(capturedScope?.scopeId, 't-1')
  })

  test('verbose 字符串 "true" 被正确转换为 boolean', async () => {
    let capturedVerbose: boolean | undefined
    const ctrl = makeController({
      check: async (ctx: unknown) => {
        capturedVerbose = (ctx as Record<string, unknown>)?.verbose as boolean
        return { status: 'OK' }
      }
    })

    await ctrl.getReadiness(
      tenantCtx({ tenantId: 't-prod' }),
      actorCtx({ actorId: 'sec', roles: ['SECURITY_ADMIN'] }),
      { verbose: 'true' as unknown as boolean }
    )
    assert.equal(capturedVerbose, true)
  })

  test('verbose 未传递时默认为 false', async () => {
    let capturedVerbose: boolean | undefined
    const ctrl = makeController({
      check: async (ctx: unknown) => {
        capturedVerbose = (ctx as Record<string, unknown>)?.verbose as boolean
        return { status: 'OK' }
      }
    })

    await ctrl.getReadiness(
      tenantCtx({ tenantId: 't-prod' }),
      actorCtx({ actorId: 'ops' }),
      {} as never
    )
    assert.equal(capturedVerbose, false)
  })

  test('actorId 正确传递到 requestorId', async () => {
    let capturedRequestorId: string | undefined
    const ctrl = makeController({
      check: async (ctx: unknown) => {
        capturedRequestorId = (ctx as Record<string, unknown>)?.requestorId as string
        return { status: 'OK' }
      }
    })

    await ctrl.getReadiness(
      tenantCtx({ tenantId: 't-audit' }),
      actorCtx({ actorId: 'security-auditor-007', roles: ['SECURITY_ADMIN'] }),
      {}
    )
    assert.equal(capturedRequestorId, 'security-auditor-007')
  })

  test('检查返回包含 checkedAt 和 status 字段', async () => {
    const ctrl = makeController()
    const result = await ctrl.getReadiness(
      tenantCtx({ tenantId: 't-1' }),
      actorCtx({ actorId: 'u1', actorType: 'tenant-user' as ActorType, roles: ['TENANT_ADMIN'] }),
      {}
    )
    assert.equal(result.status, 'OK')
    assert.ok(typeof (result as { checkedAt: string }).checkedAt === 'string')
  })
})

// ── 跨端点行为一致性 ──
describe('跨端点行为一致性', () => {
  test('getHealth 和 getPing 都委托到 service.ping()', async () => {
    let pingCallCount = 0
    const ctrl = makeController({
      ping: async () => {
        pingCallCount++
        return { alive: true, timestamp: new Date().toISOString() }
      }
    })

    await ctrl.getHealth()
    await ctrl.getPing()
    await ctrl.getHealth()

    assert.equal(pingCallCount, 3)
  })

  test('getHealth 和 getPing 返回结构一致', async () => {
    const ctrl = makeController()
    const health = await ctrl.getHealth()
    const ping = await ctrl.getPing()

    assert.equal(typeof health.alive, 'boolean')
    assert.equal(typeof ping.alive, 'boolean')
    assert.equal(typeof health.timestamp, 'string')
    assert.equal(typeof ping.timestamp, 'string')
  })

  test('getReadiness 返回更丰富的结果（含 components）', async () => {
    const ctrl = makeController({
      check: async () => ({
        status: 'OK',
        checkedAt: new Date().toISOString(),
        components: [
          { name: 'database', status: 'OK', latencyMs: 3, detail: { connected: true } },
          { name: 'lyt-adapter', status: 'OK', latencyMs: 1, detail: { available: true } }
        ],
        uptimeSeconds: 3600,
        version: '1.0.0'
      })
    })

    const result = await ctrl.getReadiness(
      tenantCtx({ tenantId: 't-svc' }),
      actorCtx({ actorId: 'svc', actorType: 'service-account' as ActorType, roles: ['SUPER_ADMIN'] }),
      {}
    )

    assert.equal(result.status, 'OK')
    assert.ok(Array.isArray((result as { components: unknown[] }).components))
    assert.equal((result as { components: unknown[] }).components.length, 2)
  })
})

// ── 异常场景 ──
describe('异常与边界场景', () => {
  test('getReadiness 中 service.check() 抛出异常时向上传播', async () => {
    const ctrl = makeController({
      check: async () => {
        throw new Error('DB connection timeout')
      }
    })

    await assert.rejects(
      ctrl.getReadiness(
        tenantCtx({ tenantId: 't-broken' }),
        actorCtx({ actorId: 'ops' }),
        {}
      ),
      /DB connection timeout/
    )
  })

  test('actorContext 缺少 actorId 时 requestorId 为 undefined', async () => {
    let capturedRequestorId: string | undefined
    const ctrl = makeController({
      check: async (ctx: unknown) => {
        capturedRequestorId = (ctx as Record<string, unknown>)?.requestorId as string | undefined
        return { status: 'OK' }
      }
    })

    await ctrl.getReadiness(
      tenantCtx({ tenantId: 't-anon' }),
      actorCtx({ actorId: undefined, roles: [], permissions: [], authenticated: false }) as CurrentActorValue,
      {}
    )
    assert.equal(capturedRequestorId, undefined)
  })

  test('tenantContext 完全为空时 scopeId 为 platform', async () => {
    let capturedScope: { scopeType: string; scopeId: string } | undefined
    const ctrl = makeController({
      check: async (ctx: unknown) => {
        capturedScope = (ctx as Record<string, unknown>)?.scope as { scopeType: string; scopeId: string }
        return { status: 'OK' }
      }
    })

    await ctrl.getReadiness(
      {} as RequestTenantContext,
      actorCtx({ actorId: 'sys', actorType: 'service-account' as ActorType, roles: [], permissions: [] }),
      {}
    )
    assert.equal(capturedScope?.scopeType, 'PLATFORM')
    assert.equal(capturedScope?.scopeId, 'platform')
  })
})
