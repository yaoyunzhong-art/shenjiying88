import { NextResponse } from 'next/server'

interface StoredWebVitalsEntry {
  id: string
  receivedAt: string
  payload: Record<string, unknown>
}

type MetricsStore = typeof globalThis & {
  __tobWebVitalsStore?: StoredWebVitalsEntry[]
}

function getStore(): StoredWebVitalsEntry[] {
  const metricsStore = globalThis as MetricsStore
  if (!metricsStore.__tobWebVitalsStore) {
    metricsStore.__tobWebVitalsStore = []
  }
  return metricsStore.__tobWebVitalsStore
}

function createEntry(payload: Record<string, unknown>): StoredWebVitalsEntry {
  return {
    id: `wv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    receivedAt: new Date().toISOString(),
    payload,
  }
}

export function resetWebVitalsStoreForTest(): void {
  const metricsStore = globalThis as MetricsStore
  metricsStore.__tobWebVitalsStore = []
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return NextResponse.json(
        { success: false, message: 'Invalid web vitals payload' },
        { status: 400 }
      )
    }

    const store = getStore()
    const entry = createEntry(payload as Record<string, unknown>)
    store.push(entry)

    if (store.length > 50) {
      store.splice(0, store.length - 50)
    }

    return NextResponse.json({
      success: true,
      storedAt: entry.receivedAt,
      count: store.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Invalid request body',
      },
      { status: 400 }
    )
  }
}

export async function GET() {
  const store = getStore()
  const latest = store[store.length - 1] || null

  return NextResponse.json({
    success: true,
    count: store.length,
    latest,
    entries: store.slice(-10),
  })
}
