import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'
import {
  GET,
  buildAnalyticsSnapshotUpstreamUrl,
  resolveAnalyticsApiBaseUrl,
  unwrapAnalyticsSnapshotPayload
} from './route'

const originalEnv = {
  M5_API_BASE_URL: process.env.M5_API_BASE_URL,
  NEXT_PUBLIC_M5_API_BASE_URL: process.env.NEXT_PUBLIC_M5_API_BASE_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
}

const originalFetch = globalThis.fetch

function restoreEnv() {
  if (originalEnv.M5_API_BASE_URL === undefined) {
    delete process.env.M5_API_BASE_URL
  } else {
    process.env.M5_API_BASE_URL = originalEnv.M5_API_BASE_URL
  }

  if (originalEnv.NEXT_PUBLIC_M5_API_BASE_URL === undefined) {
    delete process.env.NEXT_PUBLIC_M5_API_BASE_URL
  } else {
    process.env.NEXT_PUBLIC_M5_API_BASE_URL = originalEnv.NEXT_PUBLIC_M5_API_BASE_URL
  }

  if (originalEnv.NEXT_PUBLIC_API_URL === undefined) {
    delete process.env.NEXT_PUBLIC_API_URL
  } else {
    process.env.NEXT_PUBLIC_API_URL = originalEnv.NEXT_PUBLIC_API_URL
  }
}

afterEach(() => {
  restoreEnv()
  globalThis.fetch = originalFetch
})

describe('analytics snapshot route', () => {
  // ── 正例: resolveAnalyticsApiBaseUrl ──

  test('resolveAnalyticsApiBaseUrl normalizes host-only api origin', () => {
    delete process.env.M5_API_BASE_URL
    delete process.env.NEXT_PUBLIC_M5_API_BASE_URL
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001'

    assert.equal(resolveAnalyticsApiBaseUrl(), 'http://localhost:3001/api/v1/')
  })

  test('resolveAnalyticsApiBaseUrl prefers M5_API_BASE_URL when set', () => {
    process.env.M5_API_BASE_URL = 'http://m5.internal/api/v1'
    delete process.env.NEXT_PUBLIC_M5_API_BASE_URL
    delete process.env.NEXT_PUBLIC_API_URL

    assert.equal(resolveAnalyticsApiBaseUrl(), 'http://m5.internal/api/v1/')
  })

  test('resolveAnalyticsApiBaseUrl falls back to DEFAULT_API_ORIGIN when all env are unset', () => {
    delete process.env.M5_API_BASE_URL
    delete process.env.NEXT_PUBLIC_M5_API_BASE_URL
    delete process.env.NEXT_PUBLIC_API_URL

    assert.equal(resolveAnalyticsApiBaseUrl(), 'http://localhost:3001/api/v1/')
  })

  test('resolveAnalyticsApiBaseUrl preserves already normalized trailing slash', () => {
    process.env.M5_API_BASE_URL = 'http://demo.local/api/v1/'

    assert.equal(resolveAnalyticsApiBaseUrl(), 'http://demo.local/api/v1/')
  })

  // ── 正例: buildAnalyticsSnapshotUpstreamUrl ──

  test('buildAnalyticsSnapshotUpstreamUrl preserves query string', () => {
    process.env.M5_API_BASE_URL = 'http://analytics.local/api/v1'

    assert.equal(
      buildAnalyticsSnapshotUpstreamUrl(
        'http://admin.local/api/analytics/snapshot?scope=STORE&brandId=b-1&storeId=s-1'
      ),
      'http://analytics.local/api/v1/analytics/snapshot?scope=STORE&brandId=b-1&storeId=s-1'
    )
  })

  test('buildAnalyticsSnapshotUpstreamUrl works without query string', () => {
    process.env.M5_API_BASE_URL = 'http://analytics.local/api/v1'

    assert.equal(
      buildAnalyticsSnapshotUpstreamUrl('http://admin.local/api/analytics/snapshot'),
      'http://analytics.local/api/v1/analytics/snapshot'
    )
  })

  // ── 正例/反例/边界: unwrapAnalyticsSnapshotPayload ──

  test('unwrapAnalyticsSnapshotPayload extracts wrapped data object', () => {
    assert.deepEqual(
      unwrapAnalyticsSnapshotPayload({
        success: true,
        data: { scope: 'TENANT', groups: [], totals: [] }
      }),
      { scope: 'TENANT', groups: [], totals: [] }
    )
  })

  test('unwrapAnalyticsSnapshotPayload passes through payload without data field', () => {
    const raw = { groups: [{ groupKey: 'marketing', metrics: [] }], totals: [] }
    assert.deepEqual(unwrapAnalyticsSnapshotPayload(raw), raw)
  })

  test('unwrapAnalyticsSnapshotPayload passes through non-object values', () => {
    assert.equal(unwrapAnalyticsSnapshotPayload('string-value'), 'string-value')
    assert.equal(unwrapAnalyticsSnapshotPayload(null), null)
    assert.equal(unwrapAnalyticsSnapshotPayload(42), 42)
  })

  test('unwrapAnalyticsSnapshotPayload returns payload when data is undefined', () => {
    const payload = { success: true, data: undefined }
    assert.deepEqual(unwrapAnalyticsSnapshotPayload(payload), payload)
  })

  test('unwrapAnalyticsSnapshotPayload handles empty object', () => {
    assert.deepEqual(unwrapAnalyticsSnapshotPayload({}), {})
  })

  // ── 正例: GET ──

  test('GET forwards context headers and unwraps analytics payload', async () => {
    let capturedUrl = ''
    let capturedHeaders: HeadersInit | undefined

    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async (input, init) => {
      capturedUrl = String(input)
      capturedHeaders = init?.headers
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            groups: [
              {
                groupKey: 'marketing',
                metrics: [
                  { key: 'campaignTriggerTotal', value: 48 },
                  { key: 'campaignDispatchedTotal', value: 36 }
                ]
              }
            ],
            totals: []
          }
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }
      )
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/analytics/snapshot?scope=TENANT', {
        headers: {
          'x-tenant-id': 'demo-tenant',
          'x-brand-id': 'brand-001'
        }
      })
    )

    assert.equal(capturedUrl, 'http://localhost:3001/api/v1/analytics/snapshot?scope=TENANT')
    assert.equal(new Headers(capturedHeaders).get('x-tenant-id'), 'demo-tenant')
    assert.equal(new Headers(capturedHeaders).get('x-brand-id'), 'brand-001')
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      groups: [
        {
          groupKey: 'marketing',
          metrics: [
            { key: 'campaignTriggerTotal', value: 48 },
            { key: 'campaignDispatchedTotal', value: 36 }
          ]
        }
      ],
      totals: []
    })
  })

  test('GET forwards authorization and store header', async () => {
    let capturedHeaders: HeadersInit | undefined

    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async (input, init) => {
      capturedHeaders = init?.headers
      return new Response(JSON.stringify({ success: true, data: {} }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await GET(
      new Request('http://admin.local/api/analytics/snapshot', {
        headers: {
          authorization: 'Bearer test-token',
          'x-store-id': 'store-001',
          'x-market-code': 'cn-mainland'
        }
      })
    )

    assert.equal(new Headers(capturedHeaders).get('authorization'), 'Bearer test-token')
    assert.equal(new Headers(capturedHeaders).get('x-store-id'), 'store-001')
    assert.equal(new Headers(capturedHeaders).get('x-market-code'), 'cn-mainland')
  })

  test('GET returns upstream json error when upstream responds with 4xx', async () => {
    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ error: 'bad request' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/analytics/snapshot?scope=TENANT', {
        headers: { 'x-tenant-id': 'demo-tenant' }
      })
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: 'bad request' })
  })

  test('GET returns upstream text when upstream responds non-json error', async () => {
    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async () => {
      return new Response('Service Unavailable', {
        status: 503,
        headers: { 'content-type': 'text/plain' }
      })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/analytics/snapshot?scope=TENANT', {
        headers: { 'x-tenant-id': 'demo-tenant' }
      })
    )

    assert.equal(response.status, 503)
    assert.equal(await response.text(), 'Service Unavailable')
  })

  // ── 反例: GET ──

  test('GET returns 502 when upstream fetch throws', async () => {
    globalThis.fetch = (async () => {
      throw new Error('connect ECONNREFUSED')
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/analytics/snapshot?scope=TENANT', {
        headers: { 'x-tenant-id': 'demo-tenant' }
      })
    )

    assert.equal(response.status, 502)
    assert.deepEqual(await response.json(), {
      message: 'connect ECONNREFUSED'
    })
  })

  test('GET returns non-json content when upstream returns non-json 200', async () => {
    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async () => {
      return new Response('plain text body', {
        status: 200,
        headers: { 'content-type': 'text/plain' }
      })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/analytics/snapshot?scope=TENANT', {
        headers: { 'x-tenant-id': 'demo-tenant' }
      })
    )

    assert.equal(response.status, 200)
    assert.equal(await response.text(), 'plain text body')
  })
})
