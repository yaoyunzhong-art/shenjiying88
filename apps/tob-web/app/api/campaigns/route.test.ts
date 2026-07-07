import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'
import { GET } from './route'
import { buildCampaignListUpstreamUrl, resolveCampaignApiBaseUrl, unwrapResponseData } from './proxy-utils'

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

describe('tob campaigns list route', () => {
  test('resolveCampaignApiBaseUrl normalizes host-only origin', () => {
    delete process.env.M5_API_BASE_URL
    delete process.env.NEXT_PUBLIC_M5_API_BASE_URL
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001'

    assert.equal(resolveCampaignApiBaseUrl(), 'http://localhost:3001/api/v1/')
  })

  test('buildCampaignListUpstreamUrl preserves query', () => {
    process.env.M5_API_BASE_URL = 'http://api.local/api/v1'

    assert.equal(
      buildCampaignListUpstreamUrl('http://tob.local/api/campaigns?status=ACTIVE&triggerEvent=payment.success'),
      'http://api.local/api/v1/campaigns?status=ACTIVE&triggerEvent=payment.success'
    )
  })

  test('unwrapResponseData extracts data field', () => {
    assert.deepEqual(unwrapResponseData({ success: true, data: [{ planId: 'p-1' }] }), [{ planId: 'p-1' }])
  })

  test('GET forwards tenant header and unwraps payload', async () => {
    let capturedUrl = ''
    let capturedHeaders: HeadersInit | undefined

    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async (input, init) => {
      capturedUrl = String(input)
      capturedHeaders = init?.headers
      return new Response(
        JSON.stringify({
          success: true,
          data: [{ planId: 'plan-001', code: 'LIVE-001', title: 'Live campaign' }]
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }
      )
    }) as typeof fetch

    const response = await GET(
      new Request('http://tob.local/api/campaigns?status=ACTIVE', {
        headers: { 'x-tenant-id': 'demo-tenant' }
      })
    )

    assert.equal(capturedUrl, 'http://localhost:3001/api/v1/campaigns?status=ACTIVE')
    assert.equal(new Headers(capturedHeaders).get('x-tenant-id'), 'demo-tenant')
    assert.deepEqual(await response.json(), [{ planId: 'plan-001', code: 'LIVE-001', title: 'Live campaign' }])
  })
})
