import assert from 'node:assert/strict'
import { describe, test, beforeEach, mock } from 'node:test'
import { AllExceptionsFilter } from './all-exceptions.filter'

describe('AllExceptionsFilter', () => {
  const mockRecordRequestFailure = mock.fn()
  const mockRequestGovernanceService = {
    recordRequestFailure: mockRecordRequestFailure,
  }

  let filter: AllExceptionsFilter

  beforeEach(() => {
    mockRecordRequestFailure.mock.resetCalls()
    filter = new AllExceptionsFilter(mockRequestGovernanceService as any)
  })

  function createHttpHost(opts?: { request?: Record<string, unknown> }) {
    const response = {
      status: mock.fn(() => response),
      json: mock.fn(() => response),
    }
    return {
      getType: () => 'http' as const,
      switchToHttp: () => ({
        getRequest: () => opts?.request ?? {},
        getResponse: () => response,
      }),
      _response: response,
    }
  }

  test('should ignore non-HTTP hosts', () => {
    const host = { getType: () => 'rpc' }
    assert.doesNotThrow(() => filter.catch(new Error('boom'), host as any))
    assert.equal(mockRecordRequestFailure.mock.callCount(), 0)
  })

  test('should return 500 and error message for plain Error', () => {
    const host = createHttpHost()
    filter.catch(new Error('boom'), host as any)
    const res = (host as any)._response

    assert.equal(res.status.mock.calls[0]?.arguments[0], 500)
    const jsonArg = res.json.mock.calls[0]?.arguments[0]
    assert.equal(jsonArg.success, false)
    assert.equal(jsonArg.message, 'boom')
    assert.equal(jsonArg.data, null)
  })

  test('should return the HttpException status and message', async () => {
    const { HttpException } = await import('@nestjs/common')
    const host = createHttpHost()
    filter.catch(new HttpException('not found', 404), host as any)
    const res = (host as any)._response

    assert.equal(res.status.mock.calls[0]?.arguments[0], 404)
    const jsonArg = res.json.mock.calls[0]?.arguments[0]
    assert.equal(jsonArg.success, false)
    assert.equal(jsonArg.message, 'not found')
  })

  test('should return 500 for non-Error exceptions', () => {
    const host = createHttpHost()
    filter.catch('string exception', host as any)
    const res = (host as any)._response

    assert.equal(res.status.mock.calls[0]?.arguments[0], 500)
    const jsonArg = res.json.mock.calls[0]?.arguments[0]
    assert.equal(jsonArg.message, 'Internal server error')
  })

  test('should call recordRequestFailure with correct args', () => {
    const host = createHttpHost({ request: { method: 'GET', url: '/test' } })
    filter.catch(new Error('boom'), host as any)

    assert.equal(mockRecordRequestFailure.mock.callCount(), 1)
    const args = mockRecordRequestFailure.mock.calls[0]?.arguments as any[]
    assert.equal(args[0], host.switchToHttp().getRequest())
    assert.equal(args[1], 500)
    assert.equal(args[2], 'boom')
    assert.equal(args[3], 'Error')
  })

  test('should include a timestamp in the response body', () => {
    const before = new Date().toISOString()
    const host = createHttpHost()
    filter.catch(new Error('boom'), host as any)
    const res = (host as any)._response

    const call = res.json.mock.calls[0]?.arguments[0]
    assert.ok(typeof call.timestamp === 'string')
    assert.ok(new Date(call.timestamp).getTime() >= new Date(before).getTime())
  })
})
