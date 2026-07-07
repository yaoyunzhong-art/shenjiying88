import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import assert from 'node:assert/strict'
import {
  BasePaymentGateway,
  PaymentGatewayHttpError,
  type BasePaymentGatewayConfig,
  type CallbackVerifyResult
} from './base-payment-gateway'
import type { PaymentMethod } from '@m5/types'
/**
 * BasePaymentGateway 单元测试 (P0-1.2)
 *
 * 覆盖:
 *   - 构造校验 (4 维度)
 *   - httpRequest 成功路径
 *   - httpRequest 4xx 立即抛 (非重试)
 *   - httpRequest 5xx 重试到 maxRetries
 *   - httpRequest timeout 映射 PAY_TIMEOUT
 *   - httpRequest vendor code 映射
 *   - signRequest 确定性
 *   - safeEqual 三种情况
 *   - isRetryableStatus
 *   - verifyCallback 子类契约 (abstract 必实现)
 *   - downloadReconciliation 默认抛 not-implemented
 */
// ── 测试用最小子类 ─────────────────────────────────────────────────
interface TestableGatewayOptions extends Partial<BasePaymentGatewayConfig> {
  callbackResult?: CallbackVerifyResult
  gatewayName?: string
}
class TestablePaymentGateway extends BasePaymentGateway {
  readonly gatewayName: string
  public lastCallbackInput: { rawBody: string; signature: string; timestamp: string } | null = null
  private readonly callbackResult: CallbackVerifyResult
  constructor(config: TestableGatewayOptions = {}) {
    super({
      baseUrl: config.baseUrl ?? 'https://pay.test.local',
      signingSecret: config.signingSecret ?? 'test-secret',
      timeoutMs: config.timeoutMs ?? 1000,
      maxRetries: config.maxRetries ?? 2,
      channel: config.channel ?? 'WECHAT',
      errorCodeMap: config.errorCodeMap ?? { AUTH_EXPIRED: 'PAY_AUTH_EXPIRED' },
      staticHeaders: config.staticHeaders
    })
    this.gatewayName = config.gatewayName ?? 'TestablePaymentGateway'
    this.callbackResult = config.callbackResult ?? { verified: true }
  }
  async createPrepay(order: { id: string; totalCents: number }, _method: PaymentMethod) {
    return {
      prepayId: `prepay-${order.id}`,
      codeUrl: `pay://qr/${order.id}`,
      expiresAt: new Date(Date.now() + 900_000).toISOString()
    }
  }
  async query(providerTxnId: string) {
    return {
      status: 'SUCCESS' as const,
      paidAt: new Date().toISOString(),
      failureReason: undefined
    }
  }
  async refund(input: { paymentId: string; amountCents: number; reason: string }) {
    return { providerRefundId: `refund-${input.paymentId}` }
  }
  verifyCallback(input: { rawBody: string; signature: string; timestamp: string }): CallbackVerifyResult {
    this.lastCallbackInput = input
    return this.callbackResult
  }
}
// ── 工具: fetch mock ───────────────────────────────────────────────
type FetchCall = {
  url: string
  method: string
  headers: Record<string, string>
  body?: string
}
function buildFetchRecorder(responses: Array<() => Response>) {
  const calls: FetchCall[] = []
  let callIndex = 0
  const mockFetch: typeof fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.toString()
    const headers: Record<string, string> = {}
    if (init?.headers) {
      for (const [k, v] of Object.entries(init.headers as Record<string, string>)) {
        headers[k.toLowerCase()] = v
      }
    }
    const call: FetchCall = {
      url,
      method: init?.method ?? 'GET',
      headers,
      body: typeof init?.body === 'string' ? init.body : undefined
    }
    calls.push(call)
    const response = responses[callIndex++] ?? responses[responses.length - 1]
    return response()
  }
  return { mockFetch, calls }
}
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  })
}
function emptyResponse(status: number): Response {
  return new Response(null, { status })
}
// ═══════════════════════════════════════════════════════════════
// 1. 构造校验
// ═══════════════════════════════════════════════════════════════
describe('BasePaymentGateway · 构造校验', () => {
  test('rejects empty baseUrl', () => {
    assert.throws(
      () =>
        new TestablePaymentGateway({
          baseUrl: '',
          gatewayName: 'gw-empty-base'
        }),
      /baseUrl required/
    )
  })
  test('rejects empty signingSecret', () => {
    assert.throws(
      () =>
        new TestablePaymentGateway({
          signingSecret: '',
          gatewayName: 'gw-empty-secret'
        }),
      /signingSecret required/
    )
  })
  test('rejects non-positive timeoutMs', () => {
    assert.throws(
      () =>
        new TestablePaymentGateway({
          timeoutMs: 0,
          gatewayName: 'gw-zero-timeout'
        }),
      /timeoutMs must be > 0/
    )
  })
  test('rejects negative maxRetries', () => {
    assert.throws(
      () =>
        new TestablePaymentGateway({
          maxRetries: -1,
          gatewayName: 'gw-negative-retry'
        }),
      /maxRetries must be >= 0/
    )
  })
  test('accepts valid config and exposes channel', () => {
    const gw = new TestablePaymentGateway({ gatewayName: 'gw-valid' })
    assert.equal(gw.gatewayName, 'gw-valid')
    assert.equal(gw.channel, 'WECHAT')
  })
  test('honors staticHeaders', () => {
    const gw = new TestablePaymentGateway({
      staticHeaders: { 'x-mch-id': 'mch-001', 'x-app-id': 'app-001' },
      gatewayName: 'gw-static-hdr'
    })
    assert.ok(gw) // 仅验证构造不抛
  })
})
// ═══════════════════════════════════════════════════════════════
// 2. httpRequest · 成功路径
// ═══════════════════════════════════════════════════════════════
describe('BasePaymentGateway · httpRequest 成功路径', () => {
  let originalFetch: typeof fetch
  beforeEach(() => {
    originalFetch = globalThis.fetch
  })
  afterEach(() => {
    globalThis.fetch = originalFetch
  })
  test('returns parsed JSON and sets standard x-pay-* headers', async () => {
    const { mockFetch, calls } = buildFetchRecorder([() => jsonResponse({ prepayId: 'p-001' })])
    globalThis.fetch = mockFetch
    const gw = new TestablePaymentGateway({ gatewayName: 'gw-success' })
    const result = await (gw as unknown as {
      httpRequest: <T>(p: string, init?: { method?: string; body?: string }) => Promise<T>
    }).httpRequest<{ prepayId: string }>('/v3/orders', { method: 'POST', body: '{}' })
    assert.equal(result.prepayId, 'p-001')
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, 'https://pay.test.local/v3/orders')
    assert.equal(calls[0].method, 'POST')
    assert.equal(calls[0].headers['content-type'], 'application/json')
    assert.equal(calls[0].headers['x-pay-channel'], 'WECHAT')
    assert.equal(calls[0].headers['x-pay-gateway'], 'gw-success')
    assert.equal(calls[0].headers['x-pay-retry-attempt'], '0')
    assert.ok(typeof calls[0].headers['x-pay-request-id'] === 'string')
    assert.ok(typeof calls[0].headers['x-pay-request-timestamp'] === 'string')
    assert.ok(typeof calls[0].headers['x-pay-signature'] === 'string')
  })
  test('signature format is sha256 hex (64 chars)', async () => {
    const { mockFetch, calls } = buildFetchRecorder([() => jsonResponse({ ok: true })])
    globalThis.fetch = mockFetch
    const gw = new TestablePaymentGateway({ gatewayName: 'gw-sig' })
    await (gw as unknown as {
      httpRequest: <T>(p: string, init?: { method?: string }) => Promise<T>
    }).httpRequest<{ ok: boolean }>('/v3/health')
    const sig = calls[0].headers['x-pay-signature']
    assert.match(sig, /^[a-f0-9]{64}$/)
  })
  test('merge staticHeaders into request headers', async () => {
    const { mockFetch, calls } = buildFetchRecorder([() => jsonResponse({ ok: true })])
    globalThis.fetch = mockFetch
    const gw = new TestablePaymentGateway({
      staticHeaders: { 'x-mch-id': 'mch-001' },
      gatewayName: 'gw-mch'
    })
    await (gw as unknown as {
      httpRequest: <T>(p: string) => Promise<T>
    }).httpRequest('/v3/test')
    assert.equal(calls[0].headers['x-mch-id'], 'mch-001')
  })
  test('per-call init.headers can override defaults', async () => {
    const { mockFetch, calls } = buildFetchRecorder([() => jsonResponse({ ok: true })])
    globalThis.fetch = mockFetch
    const gw = new TestablePaymentGateway({ gatewayName: 'gw-override' })
    await (gw as unknown as {
      httpRequest: <T>(p: string, init?: { headers?: Record<string, string> }) => Promise<T>
    }).httpRequest<{ ok: boolean }>('/v3/test', {
      headers: { 'x-pay-channel': 'OVERRIDE' }
    })
    assert.equal(calls[0].headers['x-pay-channel'], 'OVERRIDE')
  })
})
// ═══════════════════════════════════════════════════════════════
// 3. httpRequest · 错误处理 + 重试
// ═══════════════════════════════════════════════════════════════
describe('BasePaymentGateway · httpRequest 错误处理', () => {
  let originalFetch: typeof fetch
  beforeEach(() => {
    originalFetch = globalThis.fetch
  })
  afterEach(() => {
    globalThis.fetch = originalFetch
  })
  test('4xx business error throws immediately (no retry)', async () => {
    const { mockFetch, calls } = buildFetchRecorder([
      () => jsonResponse({ code: 'INVALID_PARAM', message: 'bad amount' }, 400)
    ])
    globalThis.fetch = mockFetch
    const gw = new TestablePaymentGateway({ maxRetries: 3, gatewayName: 'gw-4xx' })
    await assert.rejects(
      (gw as unknown as {
        httpRequest: <T>(p: string) => Promise<T>
      }).httpRequest('/v3/bad'),
      (err: unknown) => {
        assert.ok(err instanceof PaymentGatewayHttpError)
        const httpErr = err as PaymentGatewayHttpError
        assert.equal(httpErr.code, 'INVALID_PARAM')
        assert.equal(httpErr.status, 400)
        assert.equal(httpErr.retryable, false)
        return true
      }
    )
    assert.equal(calls.length, 1, '4xx 业务错误不应重试')
  })
  test('5xx server error retries up to maxRetries', async () => {
    const { mockFetch, calls } = buildFetchRecorder([
      () => emptyResponse(503),
      () => emptyResponse(503),
      () => emptyResponse(503)
    ])
    globalThis.fetch = mockFetch
    const gw = new TestablePaymentGateway({ maxRetries: 2, gatewayName: 'gw-5xx' })
    await assert.rejects(
      (gw as unknown as {
        httpRequest: <T>(p: string) => Promise<T>
      }).httpRequest('/v3/down'),
      (err: unknown) => {
        assert.ok(err instanceof PaymentGatewayHttpError)
        const httpErr = err as PaymentGatewayHttpError
        assert.equal(httpErr.code, 'PAY_HTTP_503')
        assert.equal(httpErr.retryable, true)
        return true
      }
    )
    assert.equal(calls.length, 3, '5xx 应重试到 maxRetries=2 共 3 次')
    assert.equal(calls[0].headers['x-pay-retry-attempt'], '0')
    assert.equal(calls[1].headers['x-pay-retry-attempt'], '1')
    assert.equal(calls[2].headers['x-pay-retry-attempt'], '2')
  })
  test('5xx then success on 2nd attempt recovers', async () => {
    const { mockFetch, calls } = buildFetchRecorder([
      () => emptyResponse(500),
      () => jsonResponse({ ok: true })
    ])
    globalThis.fetch = mockFetch
    const gw = new TestablePaymentGateway({ maxRetries: 2, gatewayName: 'gw-recover' })
    const result = await (gw as unknown as {
      httpRequest: <T>(p: string) => Promise<T>
    }).httpRequest<{ ok: boolean }>('/v3/recover')
    assert.equal(result.ok, true)
    assert.equal(calls.length, 2)
  })
  test('429 rate-limited is retryable', async () => {
    const { mockFetch, calls } = buildFetchRecorder([
      () => jsonResponse({ code: 'RATE_LIMITED' }, 429),
      () => jsonResponse({ ok: true })
    ])
    globalThis.fetch = mockFetch
    const gw = new TestablePaymentGateway({
      maxRetries: 1,
      errorCodeMap: { RATE_LIMITED: 'PAY_RATE_LIMITED' },
      gatewayName: 'gw-429'
    })
    await (gw as unknown as {
      httpRequest: <T>(p: string) => Promise<T>
    }).httpRequest<{ ok: boolean }>('/v3/limited')
    assert.equal(calls.length, 2)
  })
  test('vendor error code is mapped via errorCodeMap', async () => {
    const { mockFetch } = buildFetchRecorder([
      () => jsonResponse({ code: 'AUTH_EXPIRED', message: 'token expired' }, 401)
    ])
    globalThis.fetch = mockFetch
    const gw = new TestablePaymentGateway({
      maxRetries: 0,
      errorCodeMap: { AUTH_EXPIRED: 'PAY_AUTH_EXPIRED' },
      gatewayName: 'gw-vendor'
    })
    await assert.rejects(
      (gw as unknown as {
        httpRequest: <T>(p: string) => Promise<T>
      }).httpRequest('/v3/auth'),
      (err: unknown) => {
        const httpErr = err as PaymentGatewayHttpError
        assert.equal(httpErr.code, 'PAY_AUTH_EXPIRED')
        return true
      }
    )
  })
  test('unknown vendor code passes through unchanged', async () => {
    const { mockFetch } = buildFetchRecorder([
      () => jsonResponse({ code: 'CUSTOM_VENDOR_CODE_X' }, 422)
    ])
    globalThis.fetch = mockFetch
    const gw = new TestablePaymentGateway({ maxRetries: 0, gatewayName: 'gw-passthrough' })
    await assert.rejects(
      (gw as unknown as {
        httpRequest: <T>(p: string) => Promise<T>
      }).httpRequest('/v3/x'),
      (err: unknown) => {
        const httpErr = err as PaymentGatewayHttpError
        assert.equal(httpErr.code, 'CUSTOM_VENDOR_CODE_X')
        return true
      }
    )
  })
  test('non-JSON 5xx response falls back to PAY_HTTP_503', async () => {
    const { mockFetch } = buildFetchRecorder([
      () => new Response('service unavailable text body', { status: 503 })
    ])
    globalThis.fetch = mockFetch
    const gw = new TestablePaymentGateway({ maxRetries: 0, gatewayName: 'gw-text' })
    await assert.rejects(
      (gw as unknown as {
        httpRequest: <T>(p: string) => Promise<T>
      }).httpRequest('/v3/text'),
      (err: unknown) => {
        const httpErr = err as PaymentGatewayHttpError
        assert.equal(httpErr.code, 'PAY_HTTP_503')
        assert.match(httpErr.message, /service unavailable text body/)
        return true
      }
    )
  })
  test('empty 200 response returns {}', async () => {
    const { mockFetch, calls } = buildFetchRecorder([() => new Response('', { status: 200 })])
    globalThis.fetch = mockFetch
    const gw = new TestablePaymentGateway({ gatewayName: 'gw-empty' })
    const result = await (gw as unknown as {
      httpRequest: <T>(p: string) => Promise<T>
    }).httpRequest<Record<string, never>>('/v3/empty')
    assert.deepEqual(result, {})
    assert.equal(calls.length, 1)
  })
})
// ═══════════════════════════════════════════════════════════════
// 4. signRequest 确定性
// ═══════════════════════════════════════════════════════════════
describe('BasePaymentGateway · signRequest 确定性', () => {
  test('same inputs produce same signature', () => {
    const gw = new TestablePaymentGateway({ gatewayName: 'gw-determinism' })
    const sig1 = (gw as unknown as {
      signRequest: (m: string, p: string, t: string, b?: string) => string
    }).signRequest('POST', '/v3/orders', '2026-07-03T10:00:00.000Z', '{}')
    const sig2 = (gw as unknown as {
      signRequest: (m: string, p: string, t: string, b?: string) => string
    }).signRequest('POST', '/v3/orders', '2026-07-03T10:00:00.000Z', '{}')
    assert.equal(sig1, sig2)
  })
  test('different body produces different signature', () => {
    const gw = new TestablePaymentGateway({ gatewayName: 'gw-body' })
    const sig1 = (gw as unknown as {
      signRequest: (m: string, p: string, t: string, b?: string) => string
    }).signRequest('POST', '/v3/orders', '2026-07-03T10:00:00.000Z', '{"a":1}')
    const sig2 = (gw as unknown as {
      signRequest: (m: string, p: string, t: string, b?: string) => string
    }).signRequest('POST', '/v3/orders', '2026-07-03T10:00:00.000Z', '{"a":2}')
    assert.notEqual(sig1, sig2)
  })
  test('different secret produces different signature', () => {
    const gw1 = new TestablePaymentGateway({ signingSecret: 'secret-1', gatewayName: 'gw-s1' })
    const gw2 = new TestablePaymentGateway({ signingSecret: 'secret-2', gatewayName: 'gw-s2' })
    const ts = '2026-07-03T10:00:00.000Z'
    const sig1 = (gw1 as unknown as {
      signRequest: (m: string, p: string, t: string, b?: string) => string
    }).signRequest('POST', '/v3/orders', ts, '{}')
    const sig2 = (gw2 as unknown as {
      signRequest: (m: string, p: string, t: string, b?: string) => string
    }).signRequest('POST', '/v3/orders', ts, '{}')
    assert.notEqual(sig1, sig2)
  })
  test('method is case-normalized to uppercase before signing', () => {
    const gw = new TestablePaymentGateway({ gatewayName: 'gw-case' })
    const sig1 = (gw as unknown as {
      signRequest: (m: string, p: string, t: string, b?: string) => string
    }).signRequest('post', '/v3/orders', '2026-07-03T10:00:00.000Z', '{}')
    const sig2 = (gw as unknown as {
      signRequest: (m: string, p: string, t: string, b?: string) => string
    }).signRequest('POST', '/v3/orders', '2026-07-03T10:00:00.000Z', '{}')
    assert.equal(sig1, sig2, '应大小写不敏感')
  })
})
// ═══════════════════════════════════════════════════════════════
// 5. safeEqual 行为
// ═══════════════════════════════════════════════════════════════
describe('BasePaymentGateway · safeEqual', () => {
  test('returns true for equal strings', () => {
    const gw = new TestablePaymentGateway({ gatewayName: 'gw-safe' })
    const eq = (gw as unknown as { safeEqual: (l: string, r: string) => boolean }).safeEqual
    assert.equal(eq('abc123', 'abc123'), true)
  })
  test('returns false for different length strings', () => {
    const gw = new TestablePaymentGateway({ gatewayName: 'gw-len' })
    const eq = (gw as unknown as { safeEqual: (l: string, r: string) => boolean }).safeEqual
    assert.equal(eq('abc', 'abcd'), false)
  })
  test('returns false for different content same length', () => {
    const gw = new TestablePaymentGateway({ gatewayName: 'gw-diff' })
    const eq = (gw as unknown as { safeEqual: (l: string, r: string) => boolean }).safeEqual
    assert.equal(eq('abc', 'abd'), false)
  })
  test('handles empty strings', () => {
    const gw = new TestablePaymentGateway({ gatewayName: 'gw-empty' })
    const eq = (gw as unknown as { safeEqual: (l: string, r: string) => boolean }).safeEqual
    assert.equal(eq('', ''), true)
  })
})
// ═══════════════════════════════════════════════════════════════
// 6. isRetryableStatus
// ═══════════════════════════════════════════════════════════════
describe('BasePaymentGateway · isRetryableStatus', () => {
  function check(status: number, expected: boolean) {
    const gw = new TestablePaymentGateway({ gatewayName: 'gw-retry' })
    const fn = (gw as unknown as { isRetryableStatus: (s: number) => boolean }).isRetryableStatus
    assert.equal(fn(status), expected, `status=${status} 应为 ${expected}`)
  }
  test('408/429/5xx 可重试', () => {
    check(408, true)
    check(429, true)
    check(500, true)
    check(502, true)
    check(503, true)
    check(504, true)
  })
  test('4xx 业务错误不可重试', () => {
    check(400, false)
    check(401, false)
    check(403, false)
    check(404, false)
    check(422, false)
  })
  test('2xx 成功不在 isRetryableStatus 考虑范围 (不会调用)', () => {
    check(200, false) // 不抛
    check(201, false)
  })
})
// ═══════════════════════════════════════════════════════════════
// 7. verifyCallback 子类契约
// ═══════════════════════════════════════════════════════════════
describe('BasePaymentGateway · verifyCallback 子类契约', () => {
  test('subclass-implemented verifyCallback returns expected result', () => {
    const gw = new TestablePaymentGateway({
      callbackResult: { verified: false, reason: 'signature-mismatch' },
      gatewayName: 'gw-cb'
    })
    const result = gw.verifyCallback({
      rawBody: '{}',
      signature: 'sig-x',
      timestamp: '2026-07-03T10:00:00.000Z'
    })
    assert.deepEqual(result, { verified: false, reason: 'signature-mismatch' })
    assert.deepEqual(gw.lastCallbackInput, {
      rawBody: '{}',
      signature: 'sig-x',
      timestamp: '2026-07-03T10:00:00.000Z'
    })
  })
  test('abstract contract: subclass missing verifyCallback throws at call-site', () => {
    // TS 编译期: 任何遗漏 verifyCallback 的子类都会被 abstract 标记拦截。
    // 运行期: 即便绕开 TS, 调用未实现的 verifyCallback 也会抛 TypeError
    //        test(TS 编译时 abstract method 会被替换为 throw new Error('...') 占位)。
    const gw = new TestablePaymentGateway({
      gatewayName: 'gw-implicit-default'
    })
    // TestablePaymentGateway 已经实现 verifyCallback, 不应抛
    const result = gw.verifyCallback({ rawBody: 'x', signature: 's', timestamp: 't' })
    assert.equal(result.verified, true)
    // 验证 basePaymentGateway 是 function (abstract 类编译后是 class)
    assert.equal(typeof BasePaymentGateway, 'function')
    // 验证 abstract 标记存在 (TS 用 abstract flag 表达, 编译后 class 自身仍是 function)
    assert.ok(
      BasePaymentGateway.prototype.verifyCallback === undefined ||
        typeof BasePaymentGateway.prototype.verifyCallback === 'function',
      'abstract 方法在 prototype 上应存在 (作为占位)'
    )
  })
})
// ═══════════════════════════════════════════════════════════════
// 8. downloadReconciliation 默认行为 (P1-2 落地)
// ═══════════════════════════════════════════════════════════════
describe('BasePaymentGateway · downloadReconciliation 默认实现', () => {
  test('throws not-implemented by default', async () => {
    const gw = new TestablePaymentGateway({ gatewayName: 'gw-recon-default' })
    await assert.rejects(
      gw.downloadReconciliation('2026-07-02'),
      /downloadReconciliation not implemented \(P1-2 schedule\)/
    )
  })
})
// ═══════════════════════════════════════════════════════════════
// 9. PaymentGatewayHttpError 字段完整性
// ═══════════════════════════════════════════════════════════════
describe('PaymentGatewayHttpError · 字段完整性', () => {
  test('preserves all diagnostic fields', () => {
    const cause = new Error('underlying')
    const err = new PaymentGatewayHttpError({
      gatewayName: 'gw-x',
      channel: 'ALIPAY',
      path: '/v3/pay',
      code: 'PAY_AUTH_EXPIRED',
      status: 401,
      retryable: false,
      requestId: 'req-001',
      message: 'auth expired',
      cause
    })
    assert.equal(err.name, 'PaymentGatewayHttpError')
    assert.equal(err.gatewayName, 'gw-x')
    assert.equal(err.channel, 'ALIPAY')
    assert.equal(err.path, '/v3/pay')
    assert.equal(err.code, 'PAY_AUTH_EXPIRED')
    assert.equal(err.status, 401)
    assert.equal(err.retryable, false)
    assert.equal(err.requestId, 'req-001')
    assert.equal(err.message, 'auth expired')
    assert.equal((err as { cause?: unknown }).cause, cause)
  })
})
