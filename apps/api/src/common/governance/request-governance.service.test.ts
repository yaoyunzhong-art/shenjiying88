import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { describe, test, beforeEach, mock } from 'node:test'
import { RequestGovernanceService } from './request-governance.service'
import type { RateLimitMetadata } from './request-governance.decorator'
import type { TenantAwareRequest } from '../../modules/tenant/tenant.types'
import type { Response } from 'express'

function mockRequest(overrides: Partial<TenantAwareRequest> = {}): TenantAwareRequest {
  return {
    method: 'GET',
    url: '/api/test',
    originalUrl: '/api/test',
    baseUrl: '',
    header: (name: string) => {
      if (name === 'x-request-id') return 'req-123'
      if (name === 'x-forwarded-for') return '10.0.0.1'
      if (name === 'user-agent') return 'test-agent'
      return undefined
    },
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' } as any,
    route: { path: '/api/test' },
    tenantContext: { tenantId: 'tenant-1' },
    actorContext: { actorId: 'actor-1', actorType: 'user' },
    governanceContext: undefined,
    ...overrides,
  } as unknown as TenantAwareRequest
}

function mockResponse(): Response {
  const headers: Record<string, string> = {}
  return {
    statusCode: 200,
    setHeader: (name: string, value: string | number) => {
      headers[name] = String(value)
    },
    getHeader: (name: string) => headers[name],
    getHeaders: () => headers,
  } as unknown as Response
}

function mockTrustGovernanceService(
  rateLimitResult = {
    scopeKey: 'http|route:/api/test|tenant:tenant-1|actor:actor-1|ip:10.0.0.1',
    allowed: true,
    limit: 100,
    remaining: 99,
    retryAfterSeconds: 0,
    state: {},
  }
) {
  return {
    evaluateRateLimit: mock.fn(async () => rateLimitResult),
    recordAudit: mock.fn(async () => {}),
  } as any
}

describe('RequestGovernanceService', () => {
  let service: RequestGovernanceService
  let trustGov: ReturnType<typeof mockTrustGovernanceService>

  beforeEach(() => {
    trustGov = mockTrustGovernanceService()
    service = new RequestGovernanceService(trustGov)
  })

  test('ensureRequestContext creates context with requestId from header', () => {
    const req = mockRequest({ governanceContext: undefined })
    const ctx = service.ensureRequestContext(req)

    assert.ok(ctx.requestId)
    assert.strictEqual(ctx.requestId, 'req-123')
    assert.ok(typeof ctx.startedAt === 'number')
    assert.ok(ctx.startedAt > 0)
  })

  test('ensureRequestContext generates UUID when no x-request-id header', () => {
    const req = mockRequest({
      governanceContext: undefined,
      header: () => undefined,
    } as any)

    const ctx = service.ensureRequestContext(req)
    assert.ok(ctx.requestId)
    // UUID v4 format
    assert.ok(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(ctx.requestId))
  })

  test('ensureRequestContext returns existing context if already set', () => {
    const existing = { requestId: 'existing-id', startedAt: 1000 }
    const req = mockRequest({ governanceContext: existing })
    const ctx = service.ensureRequestContext(req)
    assert.strictEqual(ctx.requestId, 'existing-id')
    assert.strictEqual(ctx.startedAt, 1000)
  })

  test('evaluateRateLimit delegates to trustGovernanceService', async () => {
    const req = mockRequest()
    const metadata: RateLimitMetadata = {
      limit: 100,
      windowSeconds: 60,
      prefix: 'test',
      scopeBy: ['tenant', 'ip'],
    }

    const decision = await service.evaluateRateLimit(req, metadata)

    assert.strictEqual(decision.applied, true)
    assert.strictEqual(decision.allowed, true)
    assert.strictEqual(decision.limit, 100)
    assert.strictEqual(decision.remaining, 99)
    assert.strictEqual(decision.retryAfterSeconds, 0)

    const callArgs = trustGov.evaluateRateLimit.mock.calls[0]?.arguments[0]
    assert.ok(callArgs.scopeKey.includes('tenant:tenant-1'))
    assert.ok(callArgs.scopeKey.includes('ip:10.0.0.1'))
    assert.strictEqual(callArgs.limit, 100)
    assert.strictEqual(callArgs.windowSeconds, 60)
  })

  test('evaluateRateLimit stores decision on request context', async () => {
    const req = mockRequest()
    const metadata: RateLimitMetadata = { limit: 50, windowSeconds: 30 }
    const decision = await service.evaluateRateLimit(req, metadata)

    assert.strictEqual(req.governanceContext?.rateLimit, decision)
    assert.strictEqual(decision.limit, 100) // from mock default
  })

  test('applyRateLimitHeaders sets rate limit headers on response', () => {
    const res = mockResponse()
    const decision = {
      applied: true as const,
      scopeKey: 'test|route:/api/test',
      allowed: true,
      limit: 100,
      remaining: 95,
      retryAfterSeconds: 0,
      state: {},
    }

    service.applyRateLimitHeaders(res, decision)

    assert.strictEqual(res.getHeader('X-RateLimit-Limit'), '100')
    assert.strictEqual(res.getHeader('X-RateLimit-Remaining'), '95')
    assert.strictEqual(res.getHeader('X-RateLimit-Scope'), 'test|route:/api/test')
    assert.strictEqual(res.getHeader('Retry-After'), undefined)
  })

  test('applyRateLimitHeaders sets Retry-After when blocked', () => {
    const res = mockResponse()
    const decision = {
      applied: true as const,
      scopeKey: 'test|route:/api/test',
      allowed: false,
      limit: 100,
      remaining: 0,
      retryAfterSeconds: 30,
      state: {},
    }

    service.applyRateLimitHeaders(res, decision)
    assert.strictEqual(res.getHeader('Retry-After'), '30')
  })

  test('applyRateLimitHeaders floors negative remaining to 0', () => {
    const res = mockResponse()
    const decision = {
      applied: true as const,
      scopeKey: 'test',
      allowed: false,
      limit: 10,
      remaining: -5,
      retryAfterSeconds: 0,
      state: {},
    }

    service.applyRateLimitHeaders(res, decision)
    assert.strictEqual(res.getHeader('X-RateLimit-Remaining'), '0')
  })

  test('recordRequestSuccess records audit with 200 status', async () => {
    const req = mockRequest()
    service.ensureRequestContext(req)
    const res = mockResponse()
    res.statusCode = 200

    service.recordRequestSuccess(req, res)

    const callArgs = trustGov.recordAudit.mock.calls[0]?.arguments
    assert.strictEqual(callArgs[0], 'http.request.completed')
    assert.deepStrictEqual(callArgs[2], {
      tenantId: 'tenant-1',
      actorId: 'actor-1',
      source: 'http',
      riskLevel: 'low',
    })
  })

  test('recordRequestFailure records rate-limited audit for 429', async () => {
    const req = mockRequest()
    service.ensureRequestContext(req)

    service.recordRequestFailure(req, 429, 'Rate limit exceeded')

    const callArgs = trustGov.recordAudit.mock.calls[0]?.arguments
    assert.strictEqual(callArgs[0], 'http.request.rate-limited')
    assert.strictEqual(callArgs[1].errorName, 'UnhandledException')
    assert.strictEqual(callArgs[1].errorMessage, 'Rate limit exceeded')
    assert.strictEqual(callArgs[2].riskLevel, 'medium')
  })

  test('recordRequestFailure records denied audit for 401', async () => {
    const req = mockRequest()
    service.ensureRequestContext(req)

    service.recordRequestFailure(req, 401, 'Unauthorized', 'UnauthorizedException')

    const callArgs = trustGov.recordAudit.mock.calls[0]?.arguments
    assert.strictEqual(callArgs[0], 'http.request.denied')
    assert.strictEqual(callArgs[1].errorName, 'UnauthorizedException')
    assert.strictEqual(callArgs[2].riskLevel, 'medium')
  })

  test('recordRequestFailure records failed audit for 500', async () => {
    const req = mockRequest()
    service.ensureRequestContext(req)

    service.recordRequestFailure(req, 500, 'Internal error')

    const callArgs = trustGov.recordAudit.mock.calls[0]?.arguments
    assert.strictEqual(callArgs[0], 'http.request.failed')
    assert.strictEqual(callArgs[2].riskLevel, 'high')
  })

  test('evaluateRateLimit uses default scopeBy when not provided', async () => {
    const req = mockRequest()
    const metadata: RateLimitMetadata = { limit: 10, windowSeconds: 10 }

    await service.evaluateRateLimit(req, metadata)

    const callArgs = trustGov.evaluateRateLimit.mock.calls[0]?.arguments[0]
    assert.ok(callArgs.scopeKey.includes('route:'))
    assert.ok(callArgs.scopeKey.includes('tenant:'))
    assert.ok(callArgs.scopeKey.includes('actor:'))
    assert.ok(callArgs.scopeKey.includes('ip:'))
  })
})
