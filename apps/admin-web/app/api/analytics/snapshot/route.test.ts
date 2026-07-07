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
  test('resolveAnalyticsApiBaseUrl normalizes host-only api origin', () => {
    delete process.env.M5_API_BASE_URL
    delete process.env.NEXT_PUBLIC_M5_API_BASE_URL
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001'

    assert.equal(resolveAnalyticsApiBaseUrl(), 'http://localhost:3001/api/v1/')
  })

  test('buildAnalyticsSnapshotUpstreamUrl preserves query string', () => {
    process.env.M5_API_BASE_URL = 'http://analytics.local/api/v1'

    assert.equal(
      buildAnalyticsSnapshotUpstreamUrl(
        'http://admin.local/api/analytics/snapshot?scope=STORE&brandId=b-1&storeId=s-1'
      ),
      'http://analytics.local/api/v1/analytics/snapshot?scope=STORE&brandId=b-1&storeId=s-1'
    )
  })

  test('unwrapAnalyticsSnapshotPayload extracts wrapped data object', () => {
    assert.deepEqual(
      unwrapAnalyticsSnapshotPayload({
        success: true,
        data: { scope: 'TENANT', groups: [], totals: [] }
      }),
      { scope: 'TENANT', groups: [], totals: [] }
    )
  })

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
})
