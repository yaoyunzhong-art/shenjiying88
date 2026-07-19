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
  // ── 正例: resolveLogisticsApiBaseUrl ──

  test('resolveLogisticsApiBaseUrl normalizes host-only api origin', async () => {
    delete process.env.M5_API_BASE_URL
    delete process.env.NEXT_PUBLIC_M5_API_BASE_URL
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001'

    const baseUrl = await resolveLogisticsApiBaseUrl(); assert.ok(baseUrl.includes('api/v1') || baseUrl.includes('/api/'), 'api base: ' + baseUrl)
  })

  test('resolveLogisticsApiBaseUrl prefers M5_API_BASE_URL', async () => {
    process.env.M5_API_BASE_URL = 'http://logistics.internal/api/v1'
    delete process.env.NEXT_PUBLIC_M5_API_BASE_URL
    delete process.env.NEXT_PUBLIC_API_URL

    const baseUrl = await resolveLogisticsApiBaseUrl()
    assert.equal(baseUrl, 'http://logistics.internal/api/v1/')
  })

  test('resolveLogisticsApiBaseUrl falls back to default origin', async () => {
    delete process.env.M5_API_BASE_URL
    delete process.env.NEXT_PUBLIC_M5_API_BASE_URL
    delete process.env.NEXT_PUBLIC_API_URL

    const baseUrl = await resolveLogisticsApiBaseUrl()
    assert.equal(baseUrl, 'http://localhost:3001/api/v1/')
  })

  test('resolveLogisticsApiBaseUrl uses NEXT_PUBLIC_M5_API_BASE_URL when M5_API_BASE_URL missing', async () => {
    delete process.env.M5_API_BASE_URL
    process.env.NEXT_PUBLIC_M5_API_BASE_URL = 'http://m5.public/api/v1'
    delete process.env.NEXT_PUBLIC_API_URL

    const baseUrl = await resolveLogisticsApiBaseUrl()
    assert.equal(baseUrl, 'http://m5.public/api/v1/')
  })

  test('resolveLogisticsApiBaseUrl handles api/ suffix correctly', async () => {
    process.env.M5_API_BASE_URL = 'http://logistics.internal/api'

    const baseUrl = await resolveLogisticsApiBaseUrl()
    assert.equal(baseUrl, 'http://logistics.internal/api/v1/')
  })

  test('resolveLogisticsApiBaseUrl handles trailing slash on path', async () => {
    process.env.M5_API_BASE_URL = 'http://logistics.internal/api/v1/'

    const baseUrl = await resolveLogisticsApiBaseUrl()
    assert.equal(baseUrl, 'http://logistics.internal/api/v1/')
  })

  test('resolveLogisticsApiBaseUrl falls back when empty env var', async () => {
    process.env.M5_API_BASE_URL = '  '

    const baseUrl = await resolveLogisticsApiBaseUrl()
    assert.equal(baseUrl, 'http://localhost:3001/api/v1/')
  })

  // ── 正例: buildLogisticsUpstreamUrl ──

  test('buildLogisticsUpstreamUrl preserves query string', async () => {
    process.env.M5_API_BASE_URL = 'http://logistics.local/api/v1'

    const upstreamUrl = await buildLogisticsUpstreamUrl(
        'http://admin.local/api/logistics/material-requests?status=pending_approval',
        'logistics/material-requests'
      );
      assert.ok(upstreamUrl.includes('material-requests') && upstreamUrl.includes('pending_approval'), 'upstream: ' + upstreamUrl);
      assert.equal(upstreamUrl, 'http://logistics.local/api/v1/logistics/material-requests?status=pending_approval');
  })

  test('buildLogisticsUpstreamUrl works without query params', async () => {
    process.env.M5_API_BASE_URL = 'http://logistics.local/api/v1'

    const upstreamUrl = await buildLogisticsUpstreamUrl(
      'http://admin.local/api/logistics/material-requests',
      'logistics/material-requests'
    )
    assert.equal(upstreamUrl, 'http://logistics.local/api/v1/logistics/material-requests')
  })

  test('buildLogisticsUpstreamUrl handles multiple query params', async () => {
    process.env.M5_API_BASE_URL = 'http://logistics.local/api/v1'

    const upstreamUrl = await buildLogisticsUpstreamUrl(
      'http://admin.local/api/logistics/material-requests?status=pending_approval&sort=createdAt&order=desc',
      'logistics/material-requests'
    )
    assert.equal(upstreamUrl, 'http://logistics.local/api/v1/logistics/material-requests?status=pending_approval&sort=createdAt&order=desc')
  })

  test('buildLogisticsUpstreamUrl handles special chars in query', async () => {
    process.env.M5_API_BASE_URL = 'http://logistics.local/api/v1'

    const upstreamUrl = await buildLogisticsUpstreamUrl(
      'http://admin.local/api/logistics/material-requests?requesterName=%E9%97%A8%E5%BA%97&page=1',
      'logistics/material-requests'
    )
    assert.ok(upstreamUrl.includes('requesterName=%E9%97%A8%E5%BA%97'))
    assert.ok(upstreamUrl.includes('page=1'))
  })

  // ── 正例: GET ──

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

  test('GET forwards content-type header', async () => {
    let capturedHeaders: HeadersInit | undefined

    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async (input, init) => {
      capturedHeaders = init?.headers
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await GET(
      new Request('http://admin.local/api/logistics/material-requests', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(new Headers(capturedHeaders).get('content-type'), 'application/json')
  })

  test('GET forwards x-brand-id header', async () => {
    let capturedHeaders: HeadersInit | undefined

    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async (input, init) => {
      capturedHeaders = init?.headers
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await GET(
      new Request('http://admin.local/api/logistics/material-requests', {
        headers: { 'x-tenant-id': 'tenant-p30', 'x-brand-id': 'brand-demo' }
      })
    )

    assert.equal(new Headers(capturedHeaders).get('x-brand-id'), 'brand-demo')
  })

  test('GET does not forward random headers', async () => {
    let capturedHeaders: HeadersInit | undefined

    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async (input, init) => {
      capturedHeaders = init?.headers
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await GET(
      new Request('http://admin.local/api/logistics/material-requests', {
        headers: { 'x-tenant-id': 'tenant-p30', 'x-custom-secret': 'should-not-forward' }
      })
    )

    assert.equal(new Headers(capturedHeaders).get('x-custom-secret'), null)
  })

  test('GET fetches without query params', async () => {
    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/material-requests', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), [])
  })

  // ── 反例: GET ──

  test('GET returns 502 when upstream fetch throws', async () => {
    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async () => {
      throw new Error('upstream unreachable')
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/material-requests', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(response.status, 502)
    assert.deepEqual(await response.json(), { message: 'upstream unreachable' })
  })

  test('GET returns 502 with default message when fetch throws non-Error', async () => {
    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async () => {
      throw 'string error'
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/material-requests', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(response.status, 502)
    assert.deepEqual(await response.json(), { message: 'logistics proxy failed' })
  })

  test('GET returns 404 when upstream returns 404 json', async () => {
    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ error: 'not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/material-requests', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), { error: 'not found' })
  })

  test('GET handles 403 forbidden from upstream', async () => {
    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async () => {
      return new Response('Forbidden', { status: 403 })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/material-requests', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(response.status, 403)
  })

  test('GET handles 500 from upstream with non-json body', async () => {
    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async () => {
      return new Response('Internal Server Error', {
        status: 500,
        headers: { 'content-type': 'text/plain' }
      })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/material-requests', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(response.status, 500)
  })

  // ── 正例: POST (create) ──

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

  test('POST forwards full body fields', async () => {
    let capturedBody = ''

    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async (input, init) => {
      capturedBody = String(init?.body ?? '')
      return new Response(JSON.stringify({ id: 'material-003', status: 'pending_approval' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const body = { requesterName: '仓管', purpose: '库存补充', items: [{ sku: 'ABC-001', quantity: 10 }], priority: 'high', notes: '加急' }
    await POST(
      new Request('http://admin.local/api/logistics/material-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-p30' },
        body: JSON.stringify(body)
      })
    )

    const parsed = JSON.parse(capturedBody)
    assert.equal(parsed.items.length, 1)
    assert.equal(parsed.items[0].sku, 'ABC-001')
    assert.equal(parsed.priority, 'high')
  })

  test('POST returns 502 when upstream create throws', async () => {
    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async () => {
      throw new Error('create failed: timeout')
    }) as typeof fetch

    const response = await POST(
      new Request('http://admin.local/api/logistics/material-requests', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': 'tenant-p30'
        },
        body: JSON.stringify({ requesterName: '测试' })
      })
    )

    assert.equal(response.status, 502)
    assert.deepEqual(await response.json(), { message: 'create failed: timeout' })
  })

  test('POST returns upstream error when creation fails with 400', async () => {
    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ error: 'invalid request' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await POST(
      new Request('http://admin.local/api/logistics/material-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-p30' },
        body: JSON.stringify({ requesterName: '' })
      })
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: 'invalid request' })
  })

  test('POST handles 409 conflict from upstream', async () => {
    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ error: 'duplicate request' }), {
        status: 409,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await POST(
      new Request('http://admin.local/api/logistics/material-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-p30' },
        body: JSON.stringify({ requesterName: '重复' })
      })
    )

    assert.equal(response.status, 409)
    assert.deepEqual(await response.json(), { error: 'duplicate request' })
  })

  // ── approve POST ──

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

  test('approve POST returns 502 on failure', async () => {
    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async () => {
      throw new Error('approve failed')
    }) as typeof fetch

    const response = await approvePOST(
      new Request('http://admin.local/api/logistics/material-requests/material-003/approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-p30' },
        body: JSON.stringify({ approverName: '主管' })
      }),
      { params: Promise.resolve({ id: 'material-003' }) }
    )

    assert.equal(response.status, 502)
    assert.deepEqual(await response.json(), { message: 'approve failed' })
  })

  test('approve POST proxies approval note body', async () => {
    let capturedBody = ''

    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async (input, init) => {
      capturedBody = String(init?.body ?? '')
      return new Response(JSON.stringify({ id: 'material-004', status: 'approved' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const approvalBody = { approverName: '经理', note: '同意申请', signature: 'digital-sig-001' }
    await approvePOST(
      new Request('http://admin.local/api/logistics/material-requests/material-004/approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-p30' },
        body: JSON.stringify(approvalBody)
      }),
      { params: Promise.resolve({ id: 'material-004' }) }
    )

    const parsed = JSON.parse(capturedBody)
    assert.equal(parsed.approverName, '经理')
    assert.equal(parsed.signature, 'digital-sig-001')
  })

  test('approve POST handles 403 from upstream', async () => {
    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ error: 'no permission' }), {
        status: 403,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await approvePOST(
      new Request('http://admin.local/api/logistics/material-requests/material-005/approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-p30' },
        body: JSON.stringify({ approverName: '无权' })
      }),
      { params: Promise.resolve({ id: 'material-005' }) }
    )

    assert.equal(response.status, 403)
    assert.deepEqual(await response.json(), { error: 'no permission' })
  })

  // ── outbound POST ──

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

  test('outbound POST returns 502 on failure', async () => {
    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async () => {
      throw new Error('outbound failed')
    }) as typeof fetch

    const response = await outboundPOST(
      new Request('http://admin.local/api/logistics/material-requests/material-003/outbound', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-p30' },
        body: JSON.stringify({ operatorName: '仓管员' })
      }),
      { params: Promise.resolve({ id: 'material-003' }) }
    )

    assert.equal(response.status, 502)
    assert.deepEqual(await response.json(), { message: 'outbound failed' })
  })

  test('outbound POST proxies operator data', async () => {
    let capturedBody = ''

    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async (input, init) => {
      capturedBody = String(init?.body ?? '')
      return new Response(JSON.stringify({ id: 'material-006', status: 'outbound' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await outboundPOST(
      new Request('http://admin.local/api/logistics/material-requests/material-006/outbound', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-p30' },
        body: JSON.stringify({ operatorName: '张三', note: '已出库', items: [{ sku: 'ABC-001', quantity: 5 }] })
      }),
      { params: Promise.resolve({ id: 'material-006' }) }
    )

    const parsed = JSON.parse(capturedBody)
    assert.equal(parsed.operatorName, '张三')
    assert.equal(parsed.items.length, 1)
  })

  test('outbound POST handles 404 from upstream', async () => {
    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ error: 'material request not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await outboundPOST(
      new Request('http://admin.local/api/logistics/material-requests/material-999/outbound', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-p30' },
        body: JSON.stringify({ operatorName: '仓管' })
      }),
      { params: Promise.resolve({ id: 'material-999' }) }
    )

    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), { error: 'material request not found' })
  })

  // ── 边界: unwrapPayload ──

  test('GET unwraps data field from upstream response', async () => {
    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ code: 'OK', message: '', data: { id: 'material-007', status: 'approved' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/material-requests', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { id: 'material-007', status: 'approved' })
  })

  test('GET handles upstream returning non-data wrapped response', async () => {
    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify([{ id: 'material-008' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/material-requests', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), [{ id: 'material-008' }])
  })

  test('GET returns empty array for empty upstream result', async () => {
    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/material-requests', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), [])
  })
})
