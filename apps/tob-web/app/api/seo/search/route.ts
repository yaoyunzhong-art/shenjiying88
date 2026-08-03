import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8098/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, city, district, lat, lng } = body

    const res = await fetch(`${API_BASE}/seo/geo-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, city, district, lat, lng, pageSize: 10 }),
    })

    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    const data = await res.json()

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    })
  } catch (err: any) {
    console.error('[SEO Search] Error:', err.message)
    return NextResponse.json({ items: [], total: 0, error: err.message }, { status: 200 })
  }
}
