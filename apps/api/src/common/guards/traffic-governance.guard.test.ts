import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, test, mock } from 'node:test'
import { HttpException, HttpStatus } from '@nestjs/common'
import { TrafficGovernanceGuard } from './traffic-governance.guard'
import { RATE_LIMIT_METADATA_KEY } from '../governance/request-governance.decorator'
import type { RateLimitMetadata } from '../governance/request-governance.decorator'
import type { TenantAwareRequest } from '../../modules/tenant/tenant.types'
import type { Response } from 'express'

function makeReflector(metadata: RateLimitMetadata | undefined) {
  return {
    getAllAndOverride: mock.fn((_key: string, _targets: unknown[]) => metadata),
  } as any
}

function makeReq(overrides: Partial<TenantAwareRequest> = {}): TenantAwareRequest {
  return {
    method: 'GET',
    url: '/api/test',
    originalUrl: '/api/test',
    baseUrl: '',
    header: mock.fn(() => undefined),
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' } as any,
    route: { path: '/api/test' },
    tenantContext: { tenantId: 'tenant-1' },
    actorContext: { actorId: 'actor-1', actorType: 'user' },
    governanceContext: undefined,
    ...overrides,
  } as unknown as TenantAwareRequest
}

function makeRes(): Response {
  const headers: Record<string, string> = {}
  return {
    setHeader: mock.fn((name: string, value: string | number) => {
      headers[name.toLowerCase()] = String(value)
    }),
    getHeader: (name: string) => headers[name.toLowerCase()],
    getHeaders: () => headers,
  } as unknown as Response
}

function makeRequestGovernanceService(result: {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterSeconds: number
  scopeKey: string
} = { allowed: true, limit: 100, remaining: 99, retryAfterSeconds: 0, scopeKey: 'test|route:/api/test' }) {
  return {
    evaluateRateLimit: mock.fn(async () => ({
      applied: true as const,
      ...result,
      state: {},
    })),
    applyRateLimitHeaders: mock.fn(),
    ensureRequestContext: mock.fn(),
  } as any
}

function makeHttpContext(req: TenantAwareRequest, res: Response) {
  return {
    getType: () => 'http' as const,
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as any
}

describe('TrafficGovernanceGuard', () => {
  describe('canActivate', () => {
    test('returns true when context is not http', async () => {
      const reflector = makeReflector(undefined)
      const svc = makeRequestGovernanceService()
      const guard = new TrafficGovernanceGuard(reflector, svc)

      const result = await guard.canActivate({ getType: () => 'ws' } as any)
      assert.equal(result, true)
    })

    test('returns true when no rate-limit metadata is set', async () => {
      const reflector = makeReflector(undefined)
      const svc = makeRequestGovernanceService()
      const guard = new TrafficGovernanceGuard(reflector, svc)
      const req = makeReq()
      const res = makeRes()
      const context = makeHttpContext(req, res)

      const result = await guard.canActivate(context)
      assert.equal(result, true)
    })

    test('returns true when rate limit allows the request', async () => {
      const metadata: RateLimitMetadata = { limit: 100, windowSeconds: 60 }
      const reflector = makeReflector(metadata)
      const svc = makeRequestGovernanceService({
        allowed: true,
        limit: 100,
        remaining: 99,
        retryAfterSeconds: 0,
        scopeKey: 'test|route:/api/test',
      })
      const guard = new TrafficGovernanceGuard(reflector, svc)
      const req = makeReq()
      const res = makeRes()
      const context = makeHttpContext(req, res)

      const result = await guard.canActivate(context)
      assert.equal(result, true)
    })

    test('throws HttpException 429 when rate limit blocks the request', async () => {
      const metadata: RateLimitMetadata = { limit: 10, windowSeconds: 10 }
      const reflector = makeReflector(metadata)
      const svc = makeRequestGovernanceService({
        allowed: false,
        limit: 10,
        remaining: 0,
        retryAfterSeconds: 30,
        scopeKey: 'test|route:/api/test|tenant:tenant-1',
      })
      const guard = new TrafficGovernanceGuard(reflector, svc)
      const req = makeReq()
      const res = makeRes()
      const context = makeHttpContext(req, res)

      await assert.rejects(
        () => guard.canActivate(context),
        (err: Error) => {
          assert.ok(err instanceof HttpException)
          assert.equal(err.getStatus(), HttpStatus.TOO_MANY_REQUESTS)
          assert.ok(err.message.includes('Rate limit exceeded'))
          assert.ok(err.message.includes('test|route:/api/test|tenant:tenant-1'))
          return true
        }
      )
    })

    test('applies rate limit headers on the response for allowed requests', async () => {
      const metadata: RateLimitMetadata = { limit: 50, windowSeconds: 30 }
      const reflector = makeReflector(metadata)
      const svc = makeRequestGovernanceService({
        allowed: true,
        limit: 50,
        remaining: 45,
        retryAfterSeconds: 0,
        scopeKey: 'test|route:/api/test',
      })
      const guard = new TrafficGovernanceGuard(reflector, svc)
      const req = makeReq()
      const res = makeRes()
      const context = makeHttpContext(req, res)

      await guard.canActivate(context)

      assert.equal(svc.applyRateLimitHeaders.mock.calls.length, 1)
      const calledWith = svc.applyRateLimitHeaders.mock.calls[0].arguments
      assert.equal(calledWith[0], res)
      assert.equal(calledWith[1].allowed, true)
      assert.equal(calledWith[1].limit, 50)
      assert.equal(calledWith[1].remaining, 45)
    })

    test('applies rate limit headers on the response even when blocked', async () => {
      const metadata: RateLimitMetadata = { limit: 5, windowSeconds: 60, blockSeconds: 120 }
      const reflector = makeReflector(metadata)
      const svc = makeRequestGovernanceService({
        allowed: false,
        limit: 5,
        remaining: 0,
        retryAfterSeconds: 60,
        scopeKey: 'test|route:/api/test',
      })
      const guard = new TrafficGovernanceGuard(reflector, svc)
      const req = makeReq()
      const res = makeRes()
      const context = makeHttpContext(req, res)

      await assert.rejects(() => guard.canActivate(context))

      assert.equal(svc.applyRateLimitHeaders.mock.calls.length, 1)
      const calledWith = svc.applyRateLimitHeaders.mock.calls[0].arguments
      assert.equal(calledWith[0], res)
      assert.equal(calledWith[1].allowed, false)
      assert.equal(calledWith[1].retryAfterSeconds, 60)
    })

    test('delegates metadata to evaluateRateLimit with correct request', async () => {
      const metadata: RateLimitMetadata = {
        limit: 200,
        windowSeconds: 120,
        prefix: 'api',
        scopeBy: ['tenant', 'ip'],
        blockSeconds: 300,
      }
      const reflector = makeReflector(metadata)
      const svc = makeRequestGovernanceService()
      const guard = new TrafficGovernanceGuard(reflector, svc)
      const req = makeReq()
      const res = makeRes()
      const context = makeHttpContext(req, res)

      await guard.canActivate(context)

      assert.equal(svc.evaluateRateLimit.mock.calls.length, 1)
      const callArgs = svc.evaluateRateLimit.mock.calls[0].arguments
      assert.equal(callArgs[0], req)
      assert.deepStrictEqual(callArgs[1], metadata)
    })

    test('reads metadata from both handler and class using getAllAndOverride', async () => {
      const metadata: RateLimitMetadata = { limit: 30, windowSeconds: 15 }
      const reflector = makeReflector(metadata)
      const svc = makeRequestGovernanceService()
      const guard = new TrafficGovernanceGuard(reflector, svc)
      const req = makeReq()
      const res = makeRes()

      const handler = { name: 'testHandler' }
      const klass = { name: 'TestController' }
      const context = {
        getType: () => 'http' as const,
        getHandler: () => handler,
        getClass: () => klass,
        switchToHttp: () => ({
          getRequest: () => req,
          getResponse: () => res,
        }),
      } as any

      await guard.canActivate(context)

      assert.equal(reflector.getAllAndOverride.mock.calls.length, 1)
      const reflectorArgs = reflector.getAllAndOverride.mock.calls[0].arguments
      assert.equal(reflectorArgs[0], RATE_LIMIT_METADATA_KEY)
      assert.deepStrictEqual(reflectorArgs[1], [handler, klass])
    })
  })
})
