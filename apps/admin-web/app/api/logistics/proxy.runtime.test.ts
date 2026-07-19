import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'

import { buildLogisticsForwardHeaders, proxyLogisticsRequest } from './proxy'

const originalEnv = {
  M5_API_BASE_URL: process.env.M5_API_BASE_URL,
  NEXT_PUBLIC_M5_API_BASE_URL: process.env.NEXT_PUBLIC_M5_API_BASE_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
}

const originalFetch = globalThis.fetch

afterEach(() => {
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

  globalThis.fetch = originalFetch
})

describe('logistics proxy runtime', () => {
  test('buildLogisticsForwardHeaders 白名单透传 actor headers 并覆盖 tenant/content-type', () => {
    const request = new Request('http://admin.local/api/logistics/inspections', {
      headers: {
        authorization: 'Bearer demo-token',
        'content-type': 'text/plain',
        'x-tenant-id': 'tenant-old',
        'x-brand-id': 'brand-001',
        'x-market-code': 'cn-mainland',
        'x-actor-id': 'admin-store-inspection',
        'x-actor-type': 'employee-user',
        'x-actor-name': 'Admin Store Inspection',
        'x-actor-roles': 'TENANT_ADMIN,OPERATIONS',
        'x-actor-permissions': 'logistics.inspection.read,logistics.inspection.write',
        'x-actor-authenticated': 'true',
        'x-roles': 'TENANT_ADMIN,OPERATIONS',
        'x-permissions': 'logistics.inspection.read,logistics.inspection.write',
        'x-custom-secret': 'should-not-forward'
      }
    })

    const headers = buildLogisticsForwardHeaders(request, {
      tenantId: 'tenant-new',
      contentType: 'application/json'
    })

    assert.equal(headers.get('authorization'), 'Bearer demo-token')
    assert.equal(headers.get('content-type'), 'application/json')
    assert.equal(headers.get('x-tenant-id'), 'tenant-new')
    assert.equal(headers.get('x-brand-id'), 'brand-001')
    assert.equal(headers.get('x-market-code'), 'cn-mainland')
    assert.equal(headers.get('x-actor-id'), 'admin-store-inspection')
    assert.equal(headers.get('x-actor-type'), 'employee-user')
    assert.equal(headers.get('x-actor-name'), 'Admin Store Inspection')
    assert.equal(headers.get('x-actor-roles'), 'TENANT_ADMIN,OPERATIONS')
    assert.equal(
      headers.get('x-actor-permissions'),
      'logistics.inspection.read,logistics.inspection.write'
    )
    assert.equal(headers.get('x-actor-authenticated'), 'true')
    assert.equal(headers.get('x-roles'), 'TENANT_ADMIN,OPERATIONS')
    assert.equal(headers.get('x-permissions'), 'logistics.inspection.read,logistics.inspection.write')
    assert.equal(headers.get('x-custom-secret'), null)
  })

  test('proxyLogisticsRequest GET 只透传白名单头并解包 data', async () => {
    let capturedUrl = ''
    let capturedHeaders: HeadersInit | undefined

    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async (input, init) => {
      capturedUrl = String(input)
      capturedHeaders = init?.headers
      return new Response(
        JSON.stringify({
          code: 'OK',
          data: [{ id: 'material-001', status: 'pending_approval' }]
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }
      )
    }) as typeof fetch

    const response = await proxyLogisticsRequest(
      new Request('http://admin.local/api/logistics/material-requests?status=pending_approval', {
        headers: {
          authorization: 'Bearer inventory-token',
          'x-tenant-id': 'tenant-p30',
          'x-market-code': 'cn-mainland',
          'x-actor-id': 'admin-store-inventory',
          'x-actor-permissions': 'logistics.inventory.read,logistics.inventory.write',
          'x-actor-authenticated': 'true',
          'x-custom-secret': 'should-not-forward'
        }
      }),
      'logistics/material-requests',
      'GET'
    )

    assert.equal(
      capturedUrl,
      'http://localhost:3001/api/v1/logistics/material-requests?status=pending_approval'
    )
    assert.equal(new Headers(capturedHeaders).get('authorization'), 'Bearer inventory-token')
    assert.equal(new Headers(capturedHeaders).get('x-tenant-id'), 'tenant-p30')
    assert.equal(new Headers(capturedHeaders).get('x-market-code'), 'cn-mainland')
    assert.equal(new Headers(capturedHeaders).get('x-actor-id'), 'admin-store-inventory')
    assert.equal(
      new Headers(capturedHeaders).get('x-actor-permissions'),
      'logistics.inventory.read,logistics.inventory.write'
    )
    assert.equal(new Headers(capturedHeaders).get('x-actor-authenticated'), 'true')
    assert.equal(new Headers(capturedHeaders).get('x-custom-secret'), null)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), [{ id: 'material-001', status: 'pending_approval' }])
  })

  test('proxyLogisticsRequest POST 透传 body 与兼容权限别名', async () => {
    let capturedBody = ''
    let capturedHeaders: HeadersInit | undefined

    process.env.M5_API_BASE_URL = 'http://localhost:3001/api/v1'
    globalThis.fetch = (async (_input, init) => {
      capturedBody = String(init?.body ?? '')
      capturedHeaders = init?.headers
      return new Response(JSON.stringify({ id: 'material-002', status: 'approved' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const response = await proxyLogisticsRequest(
      new Request('http://admin.local/api/logistics/material-requests/material-002/approve', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': 'tenant-p30',
          'x-actor-id': 'admin-store-inventory',
          'x-roles': 'TENANT_ADMIN,OPERATIONS',
          'x-permissions': 'logistics.inventory.write'
        },
        body: JSON.stringify({
          approverName: '后勤主管',
          note: '通过'
        })
      }),
      'logistics/material-requests/material-002/approve',
      'POST'
    )

    assert.equal(new Headers(capturedHeaders).get('content-type'), 'application/json')
    assert.equal(new Headers(capturedHeaders).get('x-tenant-id'), 'tenant-p30')
    assert.equal(new Headers(capturedHeaders).get('x-actor-id'), 'admin-store-inventory')
    assert.equal(new Headers(capturedHeaders).get('x-roles'), 'TENANT_ADMIN,OPERATIONS')
    assert.equal(new Headers(capturedHeaders).get('x-permissions'), 'logistics.inventory.write')
    assert.equal(new Headers(capturedHeaders).get('x-custom-secret'), null)
    assert.match(capturedBody, /后勤主管/)
    assert.match(capturedBody, /通过/)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { id: 'material-002', status: 'approved' })
  })
})
