import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MODULE_URL = pathToFileURL(resolve(__dirname, 'conversion-service.ts')).href

const originalWindow = globalThis.window
const originalDocument = globalThis.document
const originalLocalStorage = globalThis.localStorage
const originalFetch = globalThis.fetch

function createStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed))

  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
    removeItem(key: string) {
      store.delete(key)
    },
    clear() {
      store.clear()
    },
  }
}

afterEach(() => {
  globalThis.window = originalWindow
  globalThis.document = originalDocument
  globalThis.localStorage = originalLocalStorage
  globalThis.fetch = originalFetch
})

describe('sports-ants conversion service attribution', () => {
  test('trackPageView merges utm params, referrer and stable visitor id into payload', async () => {
    const storage = createStorage({
      bigants_visitor_id: 'v_fixed_001',
    })
    let capturedBody = ''

    globalThis.window = {
      location: {
        search: '?utm_source=baidu&utm_medium=cpc&utm_campaign=summer-launch',
      },
    } as any
    globalThis.document = {
      referrer: 'https://www.baidu.com/s?wd=bigants',
    } as any
    globalThis.localStorage = storage as any
    globalThis.fetch = (async (_input, init) => {
      capturedBody = String(init?.body)
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }) as typeof fetch

    const { conversionService } = await import(`${MODULE_URL}?case=attribution-${Date.now()}`)
    await conversionService.trackPageView('homepage')

    assert.match(capturedBody, /"eventType":"page_view"/)
    assert.match(capturedBody, /"sourcePage":"homepage"/)
    assert.match(capturedBody, /"visitorId":"v_fixed_001"/)
    assert.match(capturedBody, /"utmSource":"baidu"/)
    assert.match(capturedBody, /"utmMedium":"cpc"/)
    assert.match(capturedBody, /"utmCampaign":"summer-launch"/)
    assert.match(capturedBody, /"referrer":"https:\/\/www\.baidu\.com\/s\?wd=bigants"/)
  })
})
