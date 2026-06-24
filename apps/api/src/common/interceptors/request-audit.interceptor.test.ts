import assert from 'node:assert/strict'
import { describe, test, mock } from 'node:test'
import { of } from 'rxjs'
import { RequestAuditInterceptor } from './request-audit.interceptor'

describe('RequestAuditInterceptor', () => {
  // Helper to create a mock RequestGovernanceService
  function createMockService() {
    return {
      ensureRequestContext: mock.fn((_req: any) => ({
        requestId: 'mock-request-id',
        startedAt: Date.now(),
      })),
      recordRequestSuccess: mock.fn(),
      recordRequestFailure: mock.fn(),
    }
  }

  // Helper to create a mock ExecutionContext for HTTP
  function createHttpContext(reqOverrides: Record<string, unknown> = {}) {
    const req = {
      method: 'GET',
      url: '/api/test',
      originalUrl: '/api/test',
      header: () => undefined,
      ...reqOverrides,
    }
    const res = {
      statusCode: 200,
      setHeader: mock.fn(),
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

  test('should call ensureRequestContext on HTTP request', async () => {
    const mockService = createMockService()
    const interceptor = new RequestAuditInterceptor(mockService as any)
    const ctx = createHttpContext()
    const handler = createCallHandler()

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx as any, handler).subscribe({
        next: () => resolve(),
        error: () => resolve(),
      })
    })

    assert.strictEqual(mockService.ensureRequestContext.mock.callCount(), 1)
  })

  test('should call recordRequestSuccess after successful response', async () => {
    const mockService = createMockService()
    const interceptor = new RequestAuditInterceptor(mockService as any)
    const ctx = createHttpContext()
    const handler = createCallHandler({ result: 'ok' })

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx as any, handler).subscribe({
        next: () => resolve(),
        error: () => resolve(),
      })
    })

    assert.strictEqual(mockService.recordRequestSuccess.mock.callCount(), 1)
  })

  test('should not call recordRequestSuccess on non-HTTP context', async () => {
    const mockService = createMockService()
    const interceptor = new RequestAuditInterceptor(mockService as any)
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

    // For non-HTTP, neither ensureRequestContext nor recordRequestSuccess should be called
    assert.strictEqual(mockService.ensureRequestContext.mock.callCount(), 0)
    assert.strictEqual(mockService.recordRequestSuccess.mock.callCount(), 0)
  })

  test('should pass HTTP response data through unchanged', async () => {
    const mockService = createMockService()
    const interceptor = new RequestAuditInterceptor(mockService as any)
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

  test('should pass null through unchanged', async () => {
    const mockService = createMockService()
    const interceptor = new RequestAuditInterceptor(mockService as any)
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

  test('should call ensureRequestContext before recordRequestSuccess', async () => {
    const callOrder: string[] = []
    const mockService = {
      ensureRequestContext: mock.fn(() => {
        callOrder.push('ensureRequestContext')
        return { requestId: 'ordered-test', startedAt: Date.now() }
      }),
      recordRequestSuccess: mock.fn(() => {
        callOrder.push('recordRequestSuccess')
      }),
    }
    const interceptor = new RequestAuditInterceptor(mockService as any)
    const ctx = createHttpContext()
    const handler = createCallHandler()

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx as any, handler).subscribe({
        next: () => resolve(),
        error: () => resolve(),
      })
    })

    assert.deepStrictEqual(callOrder, ['ensureRequestContext', 'recordRequestSuccess'])
  })
})
