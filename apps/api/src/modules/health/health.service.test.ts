import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { HealthService } from './health.service'
import { HealthStatus } from './health.entity'

describe('HealthService', () => {
  let service: HealthService

  function createService() {
    const service = new HealthService({
      getAdapter: () => ({
        getMember: async (memberId: string) => ({
          memberId,
          nickname: 'Mock Member',
          levelName: 'SVIP Seed',
        }),
      }),
      getBootstrap: () => ({
        adapter: 'MockLytAdapter',
        foundationDependencies: ['foundation'],
        foundationContracts: ['member.read'],
      }),
    } as never, {
      $queryRaw: async () => [{ ready: 1 }],
    } as never,
      /* redisService */ undefined,
      /* eventBus */ { ping: async () => true, backend: 'memory', publish: async () => {}, subscribe: () => {} } as any,
      /* queueProducer */ { stats: async () => ({ pending: 0, completed: 0, failed: 0 }) })

    ;(service as any).pingTcpPort = async () => undefined
    return service
  }

  it('can be instantiated', () => {
    service = createService()
    assert.ok(service)
    assert.ok(service instanceof HealthService)
  })

  describe('check()', () => {
    it('returns OK status for default components', async () => {
      service = createService()
      const result = await service.check()

      assert.equal(result.status, HealthStatus.Ok)
      assert.ok(result.checkedAt)
      assert.ok(result.uptimeSeconds >= 0)
      assert.ok(result.version)
      assert.equal(result.lytMode, 'mock')
    })

    it('returns components array with required entries', async () => {
      service = createService()
      const result = await service.check()

      assert.ok(Array.isArray(result.components))
      assert.ok(result.components.length >= 2)
      assert.ok(result.components.some((c) => c.name === 'database'))
      assert.ok(result.components.some((c) => c.name === 'lyt-adapter'))
    })

    it('each component has status and latencyMs', async () => {
      service = createService()
      const result = await service.check()

      for (const component of result.components) {
        assert.ok(typeof component.status === 'string')
        assert.ok(typeof component.latencyMs === 'number')
        assert.ok(typeof component.name === 'string')
      }
    })

    it('verbose mode includes more components', async () => {
      service = createService()
      ;(service as any).pingRedis = async () => 'PONG'
      const result = await service.check({ scope: { scopeType: 'TENANT' } as any, verbose: true })

      assert.ok(result.components.length >= 4)
      assert.ok(result.components.some((c) => c.name === 'redis'))
      assert.ok(result.components.some((c) => c.name === 'memory'))
      assert.ok(result.components.some((c) => c.name === 'disk'))
      assert.equal(result.sampleMember?.memberId, 'seed-member-001')
    })

    it('non-verbose mode excludes extra components', async () => {
      service = createService()
      const result = await service.check()

      const extraComponents = result.components.filter(
        (c) => c.name === 'redis' || c.name === 'memory' || c.name === 'disk'
      )
      assert.equal(extraComponents.length, 0)
      assert.equal(result.sampleMember, undefined)
    })

    it('returns valid ISO date for checkedAt', async () => {
      service = createService()
      const result = await service.check()

      assert.ok(!isNaN(Date.parse(result.checkedAt)))
    })
  })

  describe('ping()', () => {
    it('returns alive=true for healthy system', async () => {
      service = createService()
      const result = await service.ping()

      assert.equal(result.alive, true)
      assert.ok(result.timestamp)
      assert.ok(!isNaN(Date.parse(result.timestamp)))
    })

    it('returns alive=true even when readiness dependencies are unavailable', async () => {
      service = createService()
      ;(service as any).prismaService.$queryRaw = async () => {
        throw new Error('database down')
      }

      const result = await service.ping()

      assert.equal(result.alive, true)
      assert.ok(!isNaN(Date.parse(result.timestamp)))
    })
  })

  describe('checkComponent()', () => {
    it('database returns OK with detail', async () => {
      let queryCalls = 0
      service = createService()
      ;(service as any).prismaService.$queryRaw = async () => {
        queryCalls += 1
        return [{ ready: 1 }]
      }

      const result = await service.checkComponent('database')

      assert.equal(result.status, HealthStatus.Ok)
      assert.equal(result.name, 'database')
      assert.ok(result.latencyMs >= 0)
      assert.ok(result.detail)
      assert.equal(result.detail!.connected, true)
      assert.equal(result.detail!.dialect, 'postgresql')
      assert.equal(result.detail!.provider, 'prisma')
      assert.equal(queryCalls, 1)
    })

    it('redis returns OK with detail', async () => {
      const originalHost = process.env.REDIS_HOST
      const originalPort = process.env.REDIS_PORT
      process.env.REDIS_HOST = 'redis.internal'
      process.env.REDIS_PORT = '6380'
      service = createService()
      try {
        ;(service as any).pingRedis = async () => 'PONG'
        const result = await service.checkComponent('redis')
        assert.equal(result.status, HealthStatus.Ok)
        assert.equal(result.name, 'redis')
        assert.equal(result.detail!.connected, true)
        assert.equal(result.detail!.host, 'redis.internal')
        assert.equal(result.detail!.port, 6380)
        assert.equal(result.detail!.response, 'PONG')
      } finally {
        if (originalHost !== undefined) process.env.REDIS_HOST = originalHost
        else delete process.env.REDIS_HOST

        if (originalPort !== undefined) process.env.REDIS_PORT = originalPort
        else delete process.env.REDIS_PORT
      }
    })

    it('lyt-adapter returns mock mode', async () => {
      service = createService()
      const result = await service.checkComponent('lyt-adapter')

      assert.equal(result.status, HealthStatus.Ok)
      assert.equal(result.name, 'lyt-adapter')
      assert.equal(result.detail!.mode, 'mock')
      assert.equal(result.detail!.available, true)
      assert.equal(result.detail!.adapter, 'MockLytAdapter')
    })

    it('memory returns OK with detail', async () => {
      service = createService()
      const result = await service.checkComponent('memory')

      assert.equal(result.status, HealthStatus.Ok)
      assert.equal(result.name, 'memory')
      assert.ok(typeof result.detail!.totalMB === 'number')
      assert.ok(typeof result.detail!.usedMB === 'number')
      assert.ok(typeof result.detail!.freeMB === 'number')
      assert.ok(typeof result.detail!.usagePercent === 'number')
    })

    it('disk returns OK with detail', async () => {
      service = createService()
      const result = await service.checkComponent('disk')

      assert.equal(result.status, HealthStatus.Ok)
      assert.equal(result.name, 'disk')
      assert.ok(typeof result.detail!.totalGB === 'number')
      assert.ok(typeof result.detail!.usedGB === 'number')
      assert.ok(typeof result.detail!.freeGB === 'number')
      assert.ok(typeof result.detail!.usagePercent === 'number')
    })

    it('database returns Unavailable when prisma probe fails', async () => {
      service = createService()
      ;(service as any).prismaService.$queryRaw = async () => {
        throw new Error('database down')
      }

      const result = await service.checkComponent('database')

      assert.equal(result.status, HealthStatus.Unavailable)
      assert.equal(result.detail!.error, 'database down')
    })

    it('redis returns Unavailable when ping fails', async () => {
      service = createService()
      ;(service as any).pingRedis = async () => {
        throw new Error('redis down')
      }

      const result = await service.checkComponent('redis')

      assert.equal(result.status, HealthStatus.Unavailable)
      assert.equal(result.detail!.error, 'redis down')
    })

    it('unknown component returns Unavailable', async () => {
      service = createService()
      const result = await service.checkComponent('unknown-component')

      assert.equal(result.status, HealthStatus.Unavailable)
      assert.equal(result.name, 'unknown-component')
      assert.ok(result.detail)
    })
  })

  describe('uptime tracking', () => {
    it('uptimeSeconds is non-negative and increases', async () => {
      service = createService()
      const result1 = await service.check()

      // Wait a tiny bit
      await new Promise((resolve) => setTimeout(resolve, 50))

      const result2 = await service.check()

      assert.ok(result1.uptimeSeconds >= 0)
      // uptime should be same or greater (could be same if within same second)
      assert.ok(result2.uptimeSeconds >= result1.uptimeSeconds)
    })
  })
})
