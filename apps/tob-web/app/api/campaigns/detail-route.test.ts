import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'
import { GET, PATCH } from './[id]/route'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('tob campaign detail route', () => {
  test('GET unwraps single campaign payload', async () => {
    let capturedUrl = ''

    globalThis.fetch = (async (input) => {
      capturedUrl = String(input)
      return new Response(
        JSON.stringify({
          success: true,
          data: { planId: 'plan-001', title: 'Live detail', status: 'ACTIVE' }
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }
      )
    }) as typeof fetch

    const response = await GET(
      new Request('http://tob.local/api/campaigns/plan-001', {
        headers: { 'x-tenant-id': 'demo-tenant' }
      }),
      { params: Promise.resolve({ id: 'plan-001' }) }
    )

    assert.equal(capturedUrl, 'http://localhost:3001/api/v1/campaigns/plan-001')
    assert.deepEqual(await response.json(), { planId: 'plan-001', title: 'Live detail', status: 'ACTIVE' })
  })

  test('PATCH forwards status transition body', async () => {
    let capturedUrl = ''
    let capturedInit: RequestInit | undefined

    globalThis.fetch = (async (input, init) => {
      capturedUrl = String(input)
      capturedInit = init
      return new Response(
        JSON.stringify({
          success: true,
          data: { planId: 'plan-001', status: 'PAUSED' }
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }
      )
    }) as typeof fetch

    const response = await PATCH(
      new Request('http://tob.local/api/campaigns/plan-001', {
        method: 'PATCH',
        headers: {
          'x-tenant-id': 'demo-tenant',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ status: 'PAUSED' })
      }),
      { params: Promise.resolve({ id: 'plan-001' }) }
    )

    assert.equal(capturedUrl, 'http://localhost:3001/api/v1/campaigns/plan-001/status')
    assert.equal(capturedInit?.method, 'PATCH')
    assert.equal(capturedInit?.body, JSON.stringify({ status: 'PAUSED' }))
    assert.deepEqual(await response.json(), { planId: 'plan-001', status: 'PAUSED' })
  })
})
