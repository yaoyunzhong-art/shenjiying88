import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { of, throwError } from 'rxjs'
import { RequestAuditInterceptor } from './request-audit.interceptor'

describe('RequestAuditInterceptor', () => {
  // Helper to create a mock AuditService
  function createMockAuditService() {
    return {
      log: vi.fn(() => Promise.resolve()),
    }
  }

  // Helper to create a mock ExecutionContext for HTTP
  function createHttpContext(reqOverrides: Record<string, unknown> = {}) {
    const req = {
      method: 'GET',
      url: '/api/test',
      originalUrl: '/api/test',
      path: '/api/test',
      header: () => undefined,
      tenantContext: { tenantId: 'tenant-1' },
      ...reqOverrides,
    }
    const res = {
      statusCode: 200,
      setHeader: vi.fn(),
    }
    return {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    }
  }

  // Helper to create a mock CallHandler
  function createCallHandler(data: unknown = { ok: true }) {
    return { handle: () => of(data) }
  }

  it('should call audit.log for POST request on success', async () => {
    const mockAudit = createMockAuditService()
    const interceptor = new RequestAuditInterceptor(mockAudit as any)
    const ctx = createHttpContext({ method: 'POST' })
    const handler = createCallHandler()

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx as any, handler).subscribe({
        next: () => resolve(),
        error: () => resolve(),
      })
    })

    assert.strictEqual(mockAudit.log.mock.calls.length, 1)
    const callArg = mockAudit.log.mock.calls[0][0]
    assert.strictEqual(callArg.eventType, 'api.request')
  })

  it('should call audit.log with api.error eventType on error', async () => {
    const mockAudit = createMockAuditService()
    const interceptor = new RequestAuditInterceptor(mockAudit as any)
    const ctx = createHttpContext({ method: 'POST' })
    const errorHandler = { handle: () => throwError(() => ({ status: 400, message: 'bad request' })) }

    await new Promise<void>((resolve) => {
      (interceptor.intercept(ctx as any, errorHandler as any) as any).subscribe({
        next: () => resolve(),
        error: () => resolve(),
      })
    })

    assert.strictEqual(mockAudit.log.mock.calls.length, 1)
    const callArg = mockAudit.log.mock.calls[0][0]
    assert.strictEqual(callArg.eventType, 'api.error')
  })

  it('should skip audit for GET requests', async () => {
    const mockAudit = createMockAuditService()
    const interceptor = new RequestAuditInterceptor(mockAudit as any)
    const ctx = createHttpContext({ method: 'GET' })
    const handler = createCallHandler()

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx as any, handler).subscribe({
        next: () => resolve(),
        error: () => resolve(),
      })
    })

    // GET requests should skip audit entirely
    assert.strictEqual(mockAudit.log.mock.calls.length, 0)
  })

  it('should skip audit for non-HTTP context', async () => {
    const mockAudit = createMockAuditService()
    const interceptor = new RequestAuditInterceptor(mockAudit as any)
    const ctx = {
      getType: () => 'rpc',
      switchToHttp: () => {
        throw new Error('should not be called')
      },
    }
    const handler = createCallHandler()

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx as any, handler).subscribe({
        next: () => resolve(),
        error: () => resolve(),
      })
    })

    assert.strictEqual(mockAudit.log.mock.calls.length, 0)
  })

  it('should pass HTTP response data through unchanged', async () => {
    const mockAudit = createMockAuditService()
    const interceptor = new RequestAuditInterceptor(mockAudit as any)
    const ctx = createHttpContext()
    const responseData = { id: 1, name: 'test-result' }
    const handler = createCallHandler(responseData)

    const result = await new Promise((resolve) => {
      interceptor.intercept(ctx as any, handler).subscribe({
        next: (val) => resolve(val),
        error: () => resolve(undefined),
      })
    })

    assert.deepStrictEqual(result, responseData)
  })

  it('should pass null through unchanged', async () => {
    const mockAudit = createMockAuditService()
    const interceptor = new RequestAuditInterceptor(mockAudit as any)
    const ctx = createHttpContext()
    const handler = createCallHandler(null)

    const result = await new Promise((resolve) => {
      interceptor.intercept(ctx as any, handler).subscribe({
        next: (val) => resolve(val),
        error: () => resolve(undefined),
      })
    })

    assert.strictEqual(result, null)
  })
})
