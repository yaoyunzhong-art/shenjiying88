import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { of } from 'rxjs'
import { ResponseInterceptor } from './response.interceptor'

describe('ResponseInterceptor', () => {
  const interceptor = new ResponseInterceptor()

  it('should wrap response data in ApiResult envelope', async () => {
    const handler = { handle: () => of({ items: [1, 2, 3] }) }
    const result = await new Promise((resolve, reject) => {
      interceptor.intercept({} as any, handler as any).subscribe({
        next: resolve,
        error: reject,
      })
    })

    assert.deepStrictEqual(result, {
      success: true,
      message: 'OK',
      data: { items: [1, 2, 3] },
      timestamp: (result as any).timestamp,
    })
    assert.ok(typeof (result as any).timestamp === 'string')
  })

  it('should handle null data', async () => {
    const handler = { handle: () => of(null) }
    const result = await new Promise((resolve, reject) => {
      interceptor.intercept({} as any, handler as any).subscribe({
        next: resolve,
        error: reject,
      })
    })

    assert.deepStrictEqual(result, {
      success: true,
      message: 'OK',
      data: null,
      timestamp: (result as any).timestamp,
    })
  })

  it('should handle string data', async () => {
    const handler = { handle: () => of('hello') }
    const result = await new Promise((resolve, reject) => {
      interceptor.intercept({} as any, handler as any).subscribe({
        next: resolve,
        error: reject,
      })
    })

    assert.deepStrictEqual(result, {
      success: true,
      message: 'OK',
      data: 'hello',
      timestamp: (result as any).timestamp,
    })
  })

  it('should propagate errors from handler', async () => {
    const handler = { handle: () => of(null).pipe(() => { throw new Error('upstream error') }) }
    
    try {
      interceptor.intercept({} as any, handler as any).subscribe({})
      // If we reach here without error, the test fails
      assert.fail('expected error to be thrown')
    } catch (err) {
      assert.ok(err instanceof Error)
      assert.equal((err as Error).message, 'upstream error')
    }
  })

  it('should preserve object structure without mutation', async () => {
    const data = { id: 1, name: 'test' }
    const handler = { handle: () => of(data) }
    const result = await new Promise((resolve, reject) => {
      interceptor.intercept({} as any, handler as any).subscribe({
        next: resolve,
        error: reject,
      })
    })

    assert.strictEqual((result as any).data, data)
    assert.deepStrictEqual((result as any).data, { id: 1, name: 'test' })
  })
})
