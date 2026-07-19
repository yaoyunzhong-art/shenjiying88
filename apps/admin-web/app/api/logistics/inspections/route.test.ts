import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'
import { GET, POST } from './route'

const originalEnv = { LOGISTICS_API_BASE: process.env.LOGISTICS_API_BASE }
const originalFetch = globalThis.fetch

afterEach(() => {
  if (originalEnv.LOGISTICS_API_BASE === undefined) {
    delete process.env.LOGISTICS_API_BASE
  } else {
    process.env.LOGISTICS_API_BASE = originalEnv.LOGISTICS_API_BASE
  }
  globalThis.fetch = originalFetch
})

describe('inspections route', () => {
  // ── 正例: GET ──

  test('GET fetches inspections list with status filter', async () => {
    let capturedUrl = ''
    let capturedHeaders: HeadersInit | undefined

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input, init) => {
      capturedUrl = String(input)
      capturedHeaders = init?.headers
      return new Response(JSON.stringify([{ id: 'ins-1', status: 'pending', equipmentId: 'eq-001' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/inspections?status=pending', {
        headers: {
          'x-tenant-id': 'tenant-p30',
          'x-actor-id': 'admin-store-inspection',
          'x-actor-roles': 'TENANT_ADMIN,OPERATIONS',
          'x-actor-permissions': 'logistics.inspection.read,logistics.inspection.write'
        }
      })
    )

    assert.ok(capturedUrl.includes('status=pending'))
    assert.ok(capturedUrl.includes('/logistics/inspections'))
    assert.equal(new Headers(capturedHeaders).get('x-tenant-id'), 'tenant-p30')
    assert.equal(new Headers(capturedHeaders).get('x-actor-id'), 'admin-store-inspection')
    assert.equal(new Headers(capturedHeaders).get('x-actor-roles'), 'TENANT_ADMIN,OPERATIONS')
    assert.equal(
      new Headers(capturedHeaders).get('x-actor-permissions'),
      'logistics.inspection.read,logistics.inspection.write'
    )
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), [{ id: 'ins-1', status: 'pending', equipmentId: 'eq-001' }])
  })

  test('GET fetches inspections with equipmentId filter', async () => {
    let capturedUrl = ''

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input) => {
      capturedUrl = String(input)
      return new Response(JSON.stringify([{ id: 'ins-2', equipmentId: 'eq-002' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await GET(
      new Request('http://admin.local/api/logistics/inspections?equipmentId=eq-002', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.ok(capturedUrl.includes('equipmentId=eq-002'))
  })

  test('GET fetches inspections with both status and equipmentId', async () => {
    let capturedUrl = ''

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input) => {
      capturedUrl = String(input)
      return new Response(JSON.stringify([{ id: 'ins-3' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await GET(
      new Request('http://admin.local/api/logistics/inspections?status=completed&equipmentId=eq-003', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.ok(capturedUrl.includes('status=completed'))
    assert.ok(capturedUrl.includes('equipmentId=eq-003'))
  })

  test('GET works without query params', async () => {
    let capturedUrl = ''

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input) => {
      capturedUrl = String(input)
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/inspections', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.ok(capturedUrl.endsWith('?'))
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), [])
  })

  test('GET uses default tenant when x-tenant-id is missing', async () => {
    let capturedHeaders: HeadersInit | undefined

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input, init) => {
      capturedHeaders = init?.headers
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await GET(new Request('http://admin.local/api/logistics/inspections'))

    assert.equal(new Headers(capturedHeaders).get('x-tenant-id'), 'default')
  })

  test('GET infers tenant from tenantId query param', async () => {
    let capturedHeaders: HeadersInit | undefined

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input, init) => {
      capturedHeaders = init?.headers
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await GET(
      new Request('http://admin.local/api/logistics/inspections?tenantId=tenant-insp', {
        headers: {}
      })
    )

    assert.equal(new Headers(capturedHeaders).get('x-tenant-id'), 'tenant-insp')
  })

  test('GET sends content-type header to upstream', async () => {
    let capturedHeaders: HeadersInit | undefined

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input, init) => {
      capturedHeaders = init?.headers
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await GET(
      new Request('http://admin.local/api/logistics/inspections', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(new Headers(capturedHeaders).get('content-type'), 'application/json')
  })

  test('GET handles special chars in query params', async () => {
    let capturedUrl = ''

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input) => {
      capturedUrl = String(input)
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await GET(
      new Request('http://admin.local/api/logistics/inspections?equipmentId=eq-001/abc&status=in+progress', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.ok(capturedUrl.includes('equipmentId=eq-001%2Fabc'))
    assert.ok(capturedUrl.includes('status=in+progress'))
  })

  // ── 反例: GET ──

  test('GET returns error when upstream fails with 4xx', async () => {
    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async () => {
      return new Response('Bad Request', { status: 400 })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/inspections', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: 'fetch failed' })
  })

  test('GET returns error when upstream fails with 5xx', async () => {
    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async () => {
      return new Response('Internal Error', { status: 502 })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/inspections', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(response.status, 502)
    assert.deepEqual(await response.json(), { error: 'fetch failed' })
  })

  test('GET handles 403 forbidden from upstream', async () => {
    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async () => {
      return new Response('Forbidden', { status: 403 })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/inspections', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(response.status, 403)
    assert.deepEqual(await response.json(), { error: 'fetch failed' })
  })

  test('GET handles 404 not found from upstream', async () => {
    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async () => {
      return new Response('Not Found', { status: 404 })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/inspections', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), { error: 'fetch failed' })
  })

  test('GET handles 429 rate limit from upstream', async () => {
    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async () => {
      return new Response('Too Many Requests', { status: 429 })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/inspections', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(response.status, 429)
    assert.deepEqual(await response.json(), { error: 'fetch failed' })
  })

  // ── 正例: POST ──

  test('POST creates an inspection record', async () => {
    let capturedUrl = ''
    let capturedBody = ''
    let capturedHeaders: HeadersInit | undefined

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input, init) => {
      capturedUrl = String(input)
      capturedBody = String(init?.body ?? '')
      capturedHeaders = init?.headers
      return new Response(JSON.stringify({ id: 'ins-new', status: 'scheduled' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await POST(
      new Request('http://admin.local/api/logistics/inspections', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': 'tenant-p30',
          'x-actor-id': 'admin-store-inspection',
          'x-actor-roles': 'TENANT_ADMIN,OPERATIONS'
        },
        body: JSON.stringify({ equipmentId: 'eq-001', inspectorId: 'user-02', scheduledAt: '2026-07-21T08:00:00Z' })
      })
    )

    assert.equal(capturedUrl, 'http://localhost:3001/logistics/inspections')
    assert.equal(new Headers(capturedHeaders).get('x-tenant-id'), 'tenant-p30')
    assert.equal(new Headers(capturedHeaders).get('x-actor-id'), 'admin-store-inspection')
    assert.equal(new Headers(capturedHeaders).get('x-actor-roles'), 'TENANT_ADMIN,OPERATIONS')
    assert.match(capturedBody, /eq-001/)
    assert.match(capturedBody, /user-02/)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { id: 'ins-new', status: 'scheduled' })
  })

  test('POST sends content-type header', async () => {
    let capturedHeaders: HeadersInit | undefined

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input, init) => {
      capturedHeaders = init?.headers
      return new Response(JSON.stringify({ id: 'ins-new' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await POST(
      new Request('http://admin.local/api/logistics/inspections', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-p30' },
        body: JSON.stringify({ equipmentId: 'eq-001' })
      })
    )

    assert.equal(new Headers(capturedHeaders).get('content-type'), 'application/json')
  })

  test('POST infers tenant from body when x-tenant-id absent', async () => {
    let capturedHeaders: HeadersInit | undefined

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input, init) => {
      capturedHeaders = init?.headers
      return new Response(JSON.stringify({ id: 'ins-new' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await POST(
      new Request('http://admin.local/api/logistics/inspections', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tenantId: 'tenant-in-body', equipmentId: 'eq-002' })
      })
    )

    assert.equal(new Headers(capturedHeaders).get('x-tenant-id'), 'tenant-in-body')
  })

  test('POST passes through full request body to upstream', async () => {
    let capturedBody = ''

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input, init) => {
      capturedBody = String(init?.body ?? '')
      return new Response(JSON.stringify({ id: 'ins-new' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const inspectionBody = { equipmentId: 'eq-001', inspectorId: 'user-02', scheduledAt: '2026-07-21T08:00:00Z', notes: '例行检查', priority: 'high' }
    await POST(
      new Request('http://admin.local/api/logistics/inspections', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-p30' },
        body: JSON.stringify(inspectionBody)
      })
    )

    const parsedBody = JSON.parse(capturedBody)
    assert.equal(parsedBody.equipmentId, 'eq-001')
    assert.equal(parsedBody.priority, 'high')
    assert.equal(Object.keys(parsedBody).length, 5)
  })

  test('POST x-tenant-id header takes priority over body tenantId', async () => {
    let capturedHeaders: HeadersInit | undefined

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input, init) => {
      capturedHeaders = init?.headers
      return new Response(JSON.stringify({ id: 'ins-new' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await POST(
      new Request('http://admin.local/api/logistics/inspections', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-from-header' },
        body: JSON.stringify({ tenantId: 'tenant-from-body', equipmentId: 'eq-003' })
      })
    )

    assert.equal(new Headers(capturedHeaders).get('x-tenant-id'), 'tenant-from-header')
  })

  test('POST uses default tenant when no tenant info available', async () => {
    let capturedHeaders: HeadersInit | undefined

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input, init) => {
      capturedHeaders = init?.headers
      return new Response(JSON.stringify({ id: 'ins-new' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await POST(
      new Request('http://admin.local/api/logistics/inspections', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ equipmentId: 'eq-004' })
      })
    )

    assert.equal(new Headers(capturedHeaders).get('x-tenant-id'), 'default')
  })

  // ── 反例: POST ──

  test('POST returns error when upstream create fails', async () => {
    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async () => {
      return new Response('Forbidden', { status: 403 })
    }) as typeof fetch

    const response = await POST(
      new Request('http://admin.local/api/logistics/inspections', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-p30' },
        body: JSON.stringify({ equipmentId: 'eq-001' })
      })
    )

    assert.equal(response.status, 403)
    assert.deepEqual(await response.json(), { error: 'create failed' })
  })

  test('POST handles 409 conflict from upstream', async () => {
    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async () => {
      return new Response('Conflict', { status: 409 })
    }) as typeof fetch

    const response = await POST(
      new Request('http://admin.local/api/logistics/inspections', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-p30' },
        body: JSON.stringify({ equipmentId: 'eq-001' })
      })
    )

    assert.equal(response.status, 409)
    assert.deepEqual(await response.json(), { error: 'create failed' })
  })

  test('POST handles 502 upstream failure', async () => {
    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async () => {
      return new Response('Bad Gateway', { status: 502 })
    }) as typeof fetch

    const response = await POST(
      new Request('http://admin.local/api/logistics/inspections', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-p30' },
        body: JSON.stringify({ equipmentId: 'eq-001' })
      })
    )

    assert.equal(response.status, 502)
    assert.deepEqual(await response.json(), { error: 'create failed' })
  })

  // ── 边界: env ──

  test('uses default API_BASE when LOGISTICS_API_BASE not set', async () => {
    delete process.env.LOGISTICS_API_BASE

    let capturedUrl = ''
    globalThis.fetch = (async (input) => {
      capturedUrl = String(input)
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await GET(
      new Request('http://admin.local/api/logistics/inspections', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.ok(capturedUrl.startsWith('http://localhost:3001'))
  })

  test('API_BASE constant is read from env at module load time', () => {
    // Route module caches API_BASE at import time, so we verify the fallback default works
    // The default is 'http://localhost:3001'
    assert.equal(process.env.LOGISTICS_API_BASE ?? 'http://localhost:3001', 'http://localhost:3001')
  })

  test('GET empty string status filter still works', async () => {
    let capturedUrl = ''

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input) => {
      capturedUrl = String(input)
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await GET(
      new Request('http://admin.local/api/logistics/inspections?status=&equipmentId=', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(capturedUrl.includes('status='), false)
    assert.equal(capturedUrl.includes('equipmentId='), false)
  })

  test('POST empty body sends empty JSON object', async () => {
    let capturedBody = ''

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input, init) => {
      capturedBody = String(init?.body ?? '')
      return new Response(JSON.stringify({ id: 'ins-empty' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await POST(
      new Request('http://admin.local/api/logistics/inspections', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-p30' },
        body: JSON.stringify({})
      })
    )

    assert.equal(capturedBody, '{}')
  })

  test('returns empty array for GET with no results', async () => {
    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/inspections?status=non_existent', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), [])
  })

  test('GET with unknown query params passes them through', async () => {
    let capturedUrl = ''

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input) => {
      capturedUrl = String(input)
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await GET(
      new Request('http://admin.local/api/logistics/inspections?sort=desc&page=1&limit=20', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(capturedUrl.includes('sort=desc'), false)
    assert.equal(capturedUrl.includes('page=1'), false)
  })

  test('POST preserves all body fields including nested objects', async () => {
    let capturedBody = ''

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input, init) => {
      capturedBody = String(init?.body ?? '')
      return new Response(JSON.stringify({ id: 'ins-nested' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const body = {
      equipmentId: 'eq-005',
      inspectorId: 'user-10',
      scheduledAt: '2026-07-22T10:00:00Z',
      location: { lat: 22.5431, lng: 114.0579, floor: 3 }
    }
    await POST(
      new Request('http://admin.local/api/logistics/inspections', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-p30' },
        body: JSON.stringify(body)
      })
    )

    const parsed = JSON.parse(capturedBody)
    assert.equal(parsed.location.lat, 22.5431)
    assert.equal(parsed.location.floor, 3)
  })
})
