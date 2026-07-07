import { NextResponse } from 'next/server'

const DEFAULT_API_ORIGIN = 'http://localhost:3001'
const CONTEXT_HEADERS = [
  'authorization',
  'x-tenant-id',
  'x-brand-id',
  'x-store-id',
  'x-market-code'
] as const

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

export function resolveAnalyticsApiBaseUrl(): string {
  const configured =
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  if (!normalized.length) {
    return `${DEFAULT_API_ORIGIN}/api/v1/`
  }
  if (normalized.endsWith('/api/v1') || normalized.endsWith('/api/v1/')) {
    return ensureTrailingSlash(normalized)
  }
  if (normalized.endsWith('/api') || normalized.endsWith('/api/')) {
    return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/v1`)
  }
  return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/api/v1`)
}

export function buildAnalyticsSnapshotUpstreamUrl(requestUrl: string): string {
  const request = new URL(requestUrl)
  const upstream = new URL(`analytics/snapshot${request.search}`, resolveAnalyticsApiBaseUrl())
  return upstream.toString()
}

export function unwrapAnalyticsSnapshotPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object' || !('data' in payload)) {
    return payload
  }
  const data = (payload as { data?: unknown }).data
  return data === undefined ? payload : data
}

export async function GET(request: Request) {
  const upstreamUrl = buildAnalyticsSnapshotUpstreamUrl(request.url)
  const headers = new Headers()

  for (const headerName of CONTEXT_HEADERS) {
    const value = request.headers.get(headerName)
    if (value) {
      headers.set(headerName, value)
    }
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers,
      cache: 'no-store'
    })
    const contentType = upstream.headers.get('content-type') ?? ''
    const isJson = contentType.includes('application/json')

    if (!upstream.ok) {
      if (isJson) {
        return NextResponse.json(await upstream.json(), { status: upstream.status })
      }
      return new NextResponse(await upstream.text(), {
        status: upstream.status,
        headers: contentType ? { 'content-type': contentType } : undefined
      })
    }

    if (!isJson) {
      return new NextResponse(await upstream.text(), {
        status: upstream.status,
        headers: contentType ? { 'content-type': contentType } : undefined
      })
    }

    const payload = await upstream.json()
    return NextResponse.json(unwrapAnalyticsSnapshotPayload(payload), { status: upstream.status })
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'analytics snapshot proxy failed'
      },
      { status: 502 }
    )
  }
}
