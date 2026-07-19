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
        headers: { 'x-tenant-id': 'tenant-p30' }
      })
    )

    assert.ok(capturedUrl.includes('status=pending'))
    assert.ok(capturedUrl.includes('/logistics/inspections'))
    assert.equal(new Headers(capturedHeaders).get('x-tenant-id'), 'tenant-p30')
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
          'x-tenant-id': 'tenant-p30'
        },
        body: JSON.stringify({ equipmentId: 'eq-001', inspectorId: 'user-02', scheduledAt: '2026-07-21T08:00:00Z' })
      })
    )

    assert.equal(capturedUrl, 'http://localhost:3001/logistics/inspections')
    assert.equal(new Headers(capturedHeaders).get('x-tenant-id'), 'tenant-p30')
    assert.match(capturedBody, /eq-001/)
    assert.match(capturedBody, /user-02/)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { id: 'ins-new', status: 'scheduled' })
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
})
