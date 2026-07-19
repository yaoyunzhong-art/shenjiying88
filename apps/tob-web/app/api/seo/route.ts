/**
 * /api/seo — SEO API 代理路由
 * 从 api NestJS 服务获取 SEO/GEO 数据，前端同域访问
 */

import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8098/api'

interface CacheEntry { data: any; timestamp: number }
const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000

async function fetchFromApi(path: string, params?: Record<string, string>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  const url = `${API_BASE}/seo${path}${query}`
  const cacheKey = url

  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 300 },
  })

  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()

  cache.set(cacheKey, { data, timestamp: Date.now() })
  return data
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint') || 'stats'
    const params: Record<string, string> = {}

    for (const key of ['tenantId', 'city', 'district', 'keyword', 'locale', 'path', 'title', 'description']) {
      const val = searchParams.get(key)
      if (val) params[key] = val
    }

    let data: any
    switch (endpoint) {
      case 'stats':
        data = await fetchFromApi('/stats', params); break
      case 'health':
        data = await fetchFromApi('/health', params); break
      case 'geo-locations':
        data = await fetchFromApi('/geo-locations', params); break
      case 'geo-search':
        const body = { query: params.city || '', city: params.city, district: params.district }
        const url = `${API_BASE}/seo/geo-search`
        const res = await fetch(url, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        data = await res.json(); break
      case 'sitemap':
        data = await fetchFromApi('/sitemap', params); break
      case 'score-page':
        data = await fetchFromApi('/score-page', params); break
      default:
        data = await fetchFromApi('/' + endpoint, params)
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=600' },
    })
  } catch (err: any) {
    console.error('[SEO API Proxy] Error:', err.message)
    return NextResponse.json(
      { error: err.message || 'SEO API 代理失败', endpoint: 'seo' },
      { status: 502 }
    )
  }
}
