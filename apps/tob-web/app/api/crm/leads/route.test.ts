import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'
import { GET, POST } from './route'

const originalFetch = globalThis.fetch
const originalApiBaseUrl = process.env.API_BASE_URL

afterEach(() => {
  globalThis.fetch = originalFetch

  if (originalApiBaseUrl === undefined) {
    delete process.env.API_BASE_URL
  } else {
    process.env.API_BASE_URL = originalApiBaseUrl
  }
})

describe('sports-ants crm leads route', () => {
  test('POST returns 400 when required fields are missing', async () => {
    const response = await POST(
      new Request('http://tob.local/api/crm/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sourcePage: 'homepage' }),
      }) as any
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), {
      success: false,
      message: 'Missing required fields: eventType, sourcePage',
    })
  })

  test('POST forwards transformed payload and returns success when upstream is healthy', async () => {
    let capturedUrl = ''
    let capturedBody = ''

    process.env.API_BASE_URL = 'http://localhost:3000'
    globalThis.fetch = (async (input, init) => {
      capturedUrl = String(input)
      capturedBody = String(init?.body)

      return new Response(JSON.stringify({ leadId: 'lead-001' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }) as typeof fetch

    const response = await POST(
      new Request('http://tob.local/api/crm/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          eventType: 'cta_click',
          eventTime: '2026-07-14T01:00:00.000Z',
          sourcePage: 'homepage',
          companyName: 'BigAnts',
          priority: 'high',
        }),
      }) as any
    )

    assert.equal(capturedUrl, 'http://localhost:3000/leads/webhook')
    assert.match(capturedBody, /"source":"website_home"/)
    assert.match(capturedBody, /"eventType":"form_submit"/)

    const payload = await response.json()
    assert.equal(response.status, 200)
    assert.equal(payload.success, true)
    assert.equal(payload.leadId, 'lead-001')
    assert.equal(payload.estimatedCallbackTime, '2小时内')
    assert.equal(typeof payload.assignedTo, 'string')
  })

  test('POST returns queued success when upstream responds non-2xx', async () => {
    globalThis.fetch = (async () =>
      new Response('upstream failed', {
        status: 502,
        headers: { 'content-type': 'text/plain' },
      })) as typeof fetch

    const response = await POST(
      new Request('http://tob.local/api/crm/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          eventType: 'page_view',
          eventTime: '2026-07-14T01:00:00.000Z',
          sourcePage: 'homepage',
        }),
      }) as any
    )

    const payload = await response.json()
    assert.equal(response.status, 200)
    assert.equal(payload.success, true)
    assert.match(payload.leadId, /^local_/)
    assert.equal(payload.message, 'Lead received, queuing for processing')
  })

  test('POST returns queued success when upstream is unavailable', async () => {
    globalThis.fetch = (async () => {
      throw new TypeError('fetch failed')
    }) as typeof fetch

    const response = await POST(
      new Request('http://tob.local/api/crm/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          eventType: 'page_view',
          eventTime: '2026-07-14T01:00:00.000Z',
          sourcePage: 'homepage',
        }),
      }) as any
    )

    const payload = await response.json()
    assert.equal(response.status, 200)
    assert.equal(payload.success, true)
    assert.match(payload.leadId, /^local_/)
    assert.equal(payload.message, 'Lead received, queuing for processing')
  })

  test('GET exposes route usage information', async () => {
    const response = await GET()

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      message: 'CRM API for Sports Ants - Use POST to submit leads',
      endpoints: {
        POST: '/api/crm/leads - Submit a new lead',
      },
    })
  })
})
