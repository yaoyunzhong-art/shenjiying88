import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'
import { GET, POST, resetWebVitalsStoreForTest } from './route'

afterEach(() => {
  resetWebVitalsStoreForTest()
})

describe('brand website web-vitals route', () => {
  test('POST stores payload and GET returns latest metrics snapshot', async () => {
    const firstResponse = await POST(
      new Request('http://tob.local/api/metrics/web-vitals', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lcp: { avg: 2100, count: 3, poorRate: 0 },
          cls: { avg: 0.08, count: 3, poorRate: 0 },
        }),
      })
    )

    assert.equal(firstResponse.status, 200)
    assert.equal((await firstResponse.json()).count, 1)

    await POST(
      new Request('http://tob.local/api/metrics/web-vitals', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lcp: { avg: 3200, count: 1, poorRate: 1 },
          fid: { avg: 180, count: 1, poorRate: 0 },
        }),
      })
    )

    const response = await GET()
    const payload = await response.json()

    assert.equal(response.status, 200)
    assert.equal(payload.success, true)
    assert.equal(payload.count, 2)
    assert.equal(payload.entries.length, 2)
    assert.equal(payload.latest?.payload?.lcp?.avg, 3200)
    assert.equal(payload.latest?.payload?.fid?.avg, 180)
  })

  test('POST rejects invalid payloads', async () => {
    const response = await POST(
      new Request('http://tob.local/api/metrics/web-vitals', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(['bad-payload']),
      })
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), {
      success: false,
      message: 'Invalid web vitals payload',
    })
  })
})
