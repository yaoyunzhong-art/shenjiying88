import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'
import { GET as routeGET, POST as routePOST } from './route'

const originalEnv = { LOGISTICS_API_BASE: process.env.LOGISTICS_API_BASE }
const originalFetch = globalThis.fetch
const GET = routeGET as unknown as (request: Request) => ReturnType<typeof routeGET>
const POST = routePOST as unknown as (request: Request) => ReturnType<typeof routePOST>

afterEach(() => {
  if (originalEnv.LOGISTICS_API_BASE === undefined) {
    delete process.env.LOGISTICS_API_BASE
  } else {
    process.env.LOGISTICS_API_BASE = originalEnv.LOGISTICS_API_BASE
  }
  globalThis.fetch = originalFetch
})

describe('clean-schedules route', () => {
  // ── 正例: GET ──

  test('GET fetches clean schedules list with status filter', async () => {
    let capturedUrl = ''
    let capturedHeaders: HeadersInit | undefined

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input, init) => {
      capturedUrl = String(input)
      capturedHeaders = init?.headers
      return new Response(JSON.stringify([{ id: 'cs-1', status: 'pending', area: 'A区' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/clean-schedules?status=pending', {
        headers: {
          'x-tenant-id': 'tenant-p30',
          'x-actor-id': 'admin-store-scheduling',
          'x-actor-roles': 'TENANT_ADMIN,OPERATIONS',
          'x-actor-permissions': 'logistics.schedule.read,logistics.schedule.write'
        }
      })
    )

    assert.ok(capturedUrl.includes('status=pending'))
    assert.ok(capturedUrl.includes('/logistics/clean-schedules'))
    assert.equal(new Headers(capturedHeaders).get('x-tenant-id'), 'tenant-p30')
    assert.equal(new Headers(capturedHeaders).get('x-actor-id'), 'admin-store-scheduling')
    assert.equal(new Headers(capturedHeaders).get('x-actor-roles'), 'TENANT_ADMIN,OPERATIONS')
    assert.equal(
      new Headers(capturedHeaders).get('x-actor-permissions'),
      'logistics.schedule.read,logistics.schedule.write'
    )
    assert.equal(response.status, 200)
    const data = await response.json()
    assert.deepEqual(data, [{ id: 'cs-1', status: 'pending', area: 'A区' }])
  })

  test('GET fetches clean schedules with assigneeId filter', async () => {
    let capturedUrl = ''

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input) => {
      capturedUrl = String(input)
      return new Response(JSON.stringify([{ id: 'cs-2', assigneeId: 'user-01' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await GET(
      new Request('http://admin.local/api/logistics/clean-schedules?assigneeId=user-01', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.ok(capturedUrl.includes('assigneeId=user-01'))
  })

  test('GET fetches clean schedules without query params', async () => {
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
      new Request('http://admin.local/api/logistics/clean-schedules', {
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

    await GET(new Request('http://admin.local/api/logistics/clean-schedules'))

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

    await GET(new Request('http://admin.local/api/logistics/clean-schedules?tenantId=tenant-from-qs'))

    assert.equal(new Headers(capturedHeaders).get('x-tenant-id'), 'tenant-from-qs')
  })

  // ── 反例: GET ──

  test('GET returns error response when upstream fails', async () => {
    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async () => {
      return new Response('Not Found', { status: 404 })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/clean-schedules?status=unknown', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), { error: 'fetch failed' })
  })

  test('GET returns error response on server error', async () => {
    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async () => {
      return new Response('Internal Error', { status: 500 })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/clean-schedules', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(response.status, 500)
    assert.deepEqual(await response.json(), { error: 'fetch failed' })
  })

  // ── 正例: POST ──

  test('POST creates a clean schedule', async () => {
    let capturedUrl = ''
    let capturedBody = ''
    let capturedHeaders: HeadersInit | undefined

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input, init) => {
      capturedUrl = String(input)
      capturedBody = String(init?.body ?? '')
      capturedHeaders = init?.headers
      return new Response(JSON.stringify({ id: 'cs-new', status: 'pending' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await POST(
      new Request('http://admin.local/api/logistics/clean-schedules', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': 'tenant-p30',
          'x-actor-id': 'admin-store-scheduling',
          'x-actor-roles': 'TENANT_ADMIN,OPERATIONS'
        },
        body: JSON.stringify({ area: 'A区', assigneeId: 'user-01', scheduledDate: '2026-07-20' })
      })
    )

    assert.equal(capturedUrl, 'http://localhost:3001/logistics/clean-schedules')
    assert.equal(new Headers(capturedHeaders).get('x-tenant-id'), 'tenant-p30')
    assert.equal(new Headers(capturedHeaders).get('x-actor-id'), 'admin-store-scheduling')
    assert.equal(new Headers(capturedHeaders).get('x-actor-roles'), 'TENANT_ADMIN,OPERATIONS')
    assert.match(capturedBody, /A区/)
    assert.match(capturedBody, /user-01/)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { id: 'cs-new', status: 'pending' })
  })

  test('POST infers tenant from body when x-tenant-id is absent', async () => {
    let capturedHeaders: HeadersInit | undefined

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input, init) => {
      capturedHeaders = init?.headers
      return new Response(JSON.stringify({ id: 'cs-new' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await POST(
      new Request('http://admin.local/api/logistics/clean-schedules', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tenantId: 'tenant-from-body', area: 'B区' })
      })
    )

    assert.equal(new Headers(capturedHeaders).get('x-tenant-id'), 'tenant-from-body')
  })

  test('POST defaults to "default" tenant when neither header nor body has tenantId', async () => {
    let capturedHeaders: HeadersInit | undefined

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input, init) => {
      capturedHeaders = init?.headers
      return new Response(JSON.stringify({ id: 'cs-new' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await POST(
      new Request('http://admin.local/api/logistics/clean-schedules', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ area: 'C区' })
      })
    )

    assert.equal(new Headers(capturedHeaders).get('x-tenant-id'), 'default')
  })

  // ── 反例: POST ──

  test('POST returns error when upstream create fails', async () => {
    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async () => {
      return new Response('Conflict', { status: 409 })
    }) as typeof fetch

    const response = await POST(
      new Request('http://admin.local/api/logistics/clean-schedules', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-p30' },
        body: JSON.stringify({ area: 'A区' })
      })
    )

    assert.equal(response.status, 409)
    assert.deepEqual(await response.json(), { error: 'create failed' })
  })

  test('POST returns error when upstream responds with non-json error', async () => {
    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async () => {
      return new Response('Service Unavailable', { status: 503 })
    }) as typeof fetch

    const response = await POST(
      new Request('http://admin.local/api/logistics/clean-schedules', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-p30' },
        body: JSON.stringify({ area: 'A区' })
      })
    )

    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { error: 'create failed' })
  })

  // ── 边界: env ──

  test('uses default API_BASE when env not set', async () => {
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
      new Request('http://admin.local/api/logistics/clean-schedules', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.ok(capturedUrl.startsWith('http://localhost:3001'))
  })

  test('GET with both status and assigneeId simultaneously', async () => {
    let capturedUrl = ''

    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async (input) => {
      capturedUrl = String(input)
      return new Response(JSON.stringify([{ id: 'cs-3' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    await GET(
      new Request('http://admin.local/api/logistics/clean-schedules?status=completed&assigneeId=user-03', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.ok(capturedUrl.includes('status=completed'))
    assert.ok(capturedUrl.includes('assigneeId=user-03'))
  })

  test('GET returns empty list when upstream returns null json', async () => {
    process.env.LOGISTICS_API_BASE = 'http://localhost:3001'
    globalThis.fetch = (async () => {
      return new Response('null', {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await GET(
      new Request('http://admin.local/api/logistics/clean-schedules', {
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.equal(response.status, 200)
    assert.equal(await response.json(), null)
  })
})
