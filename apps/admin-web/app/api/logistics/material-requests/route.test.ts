import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'
import { POST as approvePOST } from './[id]/approve/route'
import { POST as outboundPOST } from './[id]/outbound/route'
import { GET, POST } from './route'
import {
  buildLogisticsUpstreamUrl,
  resolveLogisticsApiBaseUrl
} from '../proxy'

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

describe('logistics material requests route', () => {
  test('resolveLogisticsApiBaseUrl normalizes host-only api origin', () => {
    delete process.env.M5_API_BASE_URL
    delete process.env.NEXT_PUBLIC_M5_API_BASE_URL
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001'

    assert.equal(resolveLogisticsApiBaseUrl(), 'http://localhost:3001/api/v1/')
  })

  test('buildLogisticsUpstreamUrl preserves query string', () => {
    process.env.M5_API_BASE_URL = 'http://logistics.local/api/v1'

    assert.equal(
      buildLogisticsUpstreamUrl(
        'http://admin.local/api/logistics/material-requests?status=pending_approval',
        'logistics/material-requests'
      ),
      'http://logistics.local/api/v1/logistics/material-requests?status=pending_approval'
    )
  })

  test('GET forwards tenant header to material request list', async () => {
    let capturedUrl = ''
    let capturedHeaders: HeadersInit | undefined

    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async (input, init) => {
      capturedUrl = String(input)
      capturedHeaders = init?.headers
      return new Response(JSON.stringify([{ id: 'material-001', status: 'pending_approval' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/material-requests?status=pending_approval', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(
      capturedUrl,
      'http://localhost:3001/api/v1/logistics/material-requests?status=pending_approval'
    )
    assert.equal(new Headers(capturedHeaders).get('x-tenant-id'), 'tenant-p30')
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), [{ id: 'material-001', status: 'pending_approval' }])
  })

  test('POST forwards body for create material request', async () => {
    let capturedUrl = ''
    let capturedBody = ''
    let capturedHeaders: HeadersInit | undefined

    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async (input, init) => {
      capturedUrl = String(input)
      capturedBody = String(init?.body ?? '')
      capturedHeaders = init?.headers
      return new Response(JSON.stringify({ id: 'material-002', status: 'pending_approval' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await POST(
      new Request('http://admin.local/api/logistics/material-requests', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': 'tenant-p30'
        },
        body: JSON.stringify({
          requesterName: '门店后勤',
          purpose: '晚班耗材补充'
        })
      })
    )

    assert.equal(capturedUrl, 'http://localhost:3001/api/v1/logistics/material-requests')
    assert.equal(new Headers(capturedHeaders).get('content-type'), 'application/json')
    assert.equal(new Headers(capturedHeaders).get('x-tenant-id'), 'tenant-p30')
    assert.match(capturedBody, /晚班耗材补充/)
    assert.equal(response.status, 200)
  })

  test('approve POST proxies to approve endpoint', async () => {
    let capturedUrl = ''

    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async (input) => {
      capturedUrl = String(input)
      return new Response(JSON.stringify({ id: 'material-003', status: 'approved' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await approvePOST(
      new Request('http://admin.local/api/logistics/material-requests/material-003/approve', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': 'tenant-p30'
        },
        body: JSON.stringify({ approverName: '后勤主管', note: '通过' })
      }),
      { params: Promise.resolve({ id: 'material-003' }) }
    )

    assert.equal(
      capturedUrl,
      'http://localhost:3001/api/v1/logistics/material-requests/material-003/approve'
    )
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { id: 'material-003', status: 'approved' })
  })

  test('outbound POST proxies to outbound endpoint', async () => {
    let capturedUrl = ''

    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async (input) => {
      capturedUrl = String(input)
      return new Response(JSON.stringify({ id: 'material-003', status: 'outbound' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await outboundPOST(
      new Request('http://admin.local/api/logistics/material-requests/material-003/outbound', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': 'tenant-p30'
        },
        body: JSON.stringify({ operatorName: '仓管员', note: '已出库' })
      }),
      { params: Promise.resolve({ id: 'material-003' }) }
    )

    assert.equal(
      capturedUrl,
      'http://localhost:3001/api/v1/logistics/material-requests/material-003/outbound'
    )
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { id: 'material-003', status: 'outbound' })
  })
})
