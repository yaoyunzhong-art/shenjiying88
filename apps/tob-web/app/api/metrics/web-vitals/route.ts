import { NextResponse } from 'next/server'
import { createWebVitalsEntry, getWebVitalsStore } from './store'

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return NextResponse.json(
        { success: false, message: 'Invalid web vitals payload' },
        { status: 400 }
      )
    }

    const store = getWebVitalsStore()
    const entry = createWebVitalsEntry(payload as Record<string, unknown>)
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
  const store = getWebVitalsStore()
  const latest = store[store.length - 1] || null

  return NextResponse.json({
    success: true,
    count: store.length,
    latest,
    entries: store.slice(-10),
  })
}
