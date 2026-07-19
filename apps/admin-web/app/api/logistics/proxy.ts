'use server'

import { NextResponse } from 'next/server'

const DEFAULT_API_ORIGIN = 'http://localhost:3001'
const CONTEXT_HEADERS = [
  'authorization',
  'content-type',
  'x-tenant-id',
  'x-brand-id',
  'x-store-id',
  'x-market-code',
  'x-actor-id',
  'x-actor-type',
  'x-actor-name',
  'x-actor-tenant-id',
  'x-actor-brand-id',
  'x-actor-store-id',
  'x-actor-roles',
  'x-actor-permissions',
  'x-actor-authenticated',
  'x-roles',
  'x-permissions'
] as const

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

export async function resolveLogisticsApiBaseUrl(): Promise<string> {
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

export async function buildLogisticsUpstreamUrl(requestUrl: string, upstreamPath: string): Promise<string> {
  const request = new URL(requestUrl)
  const upstream = new URL(`${upstreamPath}${request.search}`, await resolveLogisticsApiBaseUrl())
  return upstream.toString()
}

function unwrapPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object' || !('data' in payload)) {
    return payload
  }
  const data = (payload as { data?: unknown }).data
  return data === undefined ? payload : data
}

function copyContextHeaders(request: Request): Headers {
  const headers = new Headers()

  for (const headerName of CONTEXT_HEADERS) {
    const value = request.headers.get(headerName)
    if (value) {
      headers.set(headerName, value)
    }
  }

  return headers
}

export function buildLogisticsForwardHeaders(
  request: Request,
  options: {
    tenantId: string
    contentType?: string
  }
): Headers {
  const headers = copyContextHeaders(request)
  headers.set('x-tenant-id', options.tenantId)
  if (options.contentType) {
    headers.set('content-type', options.contentType)
  }
  return headers
}

export async function proxyLogisticsRequest(
  request: Request,
  upstreamPath: string,
  method: 'GET' | 'POST'
) {
  const upstreamUrl = await buildLogisticsUpstreamUrl(request.url, upstreamPath)
  const headers = copyContextHeaders(request)

  try {
    const upstream = await fetch(upstreamUrl, {
      method,
      headers,
      body: method === 'GET' ? undefined : await request.text(),
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
    return NextResponse.json(unwrapPayload(payload), { status: upstream.status })
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'logistics proxy failed'
      },
      { status: 502 }
    )
  }
}
