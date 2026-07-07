import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'
import { GET } from './[id]/dispatches/route'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('tob campaign dispatches route', () => {
  test('GET unwraps dispatch list payload', async () => {
    let capturedUrl = ''

    globalThis.fetch = (async (input) => {
      capturedUrl = String(input)
      return new Response(
        JSON.stringify({
          success: true,
          data: [
            {
              dispatchId: 'dispatch-001',
              planId: 'plan-001',
              actionIndex: 0,
              triggerEvent: 'payment.success',
              status: 'DISPATCHED',
              createdAt: '2026-07-02T10:00:00.000Z'
            }
          ]
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }
      )
    }) as typeof fetch

    const response = await GET(
      new Request('http://tob.local/api/campaigns/plan-001/dispatches', {
        headers: { 'x-tenant-id': 'demo-tenant' }
      }),
      { params: Promise.resolve({ id: 'plan-001' }) }
    )

    assert.equal(capturedUrl, 'http://localhost:3001/api/v1/campaigns/plan-001/dispatches')
    assert.deepEqual(await response.json(), [
      {
        dispatchId: 'dispatch-001',
        planId: 'plan-001',
        actionIndex: 0,
        triggerEvent: 'payment.success',
        status: 'DISPATCHED',
        createdAt: '2026-07-02T10:00:00.000Z'
      }
    ])
  })
})
