'use server'

import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_API_ORIGIN = 'http://localhost:3001'
const CONTEXT_HEADERS = [
  'authorization',
  'content-type',
  'x-tenant-id',
  'x-brand-id',
  'x-store-id',
  'x-market-code',
] as const

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

async function resolveApiBaseUrl(): Promise<string> {
  const configured =
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  if (!normalized.length) return `${DEFAULT_API_ORIGIN}/api/v1/`
  if (normalized.endsWith('/api/v1') || normalized.endsWith('/api/v1/')) {
    return ensureTrailingSlash(normalized)
  }
  if (normalized.endsWith('/api') || normalized.endsWith('/api/')) {
    return `${normalized.replace(/\/$/, '')}/v1/`
  }
  return `${normalized.replace(/\/$/, '')}/api/v1/`
}

function copyContextHeaders(request: NextRequest): Headers {
  const headers = new Headers()
  for (const name of CONTEXT_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  return headers
}

async function proxyContractRequest(
  request: NextRequest,
  contractId: string,
  method: 'GET' | 'PATCH'
) {
  const upstreamUrl = new URL(`contracts/${contractId}`, await resolveApiBaseUrl()).toString()
  const upstream = await fetch(upstreamUrl, {
    method,
    headers: copyContextHeaders(request),
    body: method === 'GET' ? undefined : await request.text(),
    cache: 'no-store',
  })

  const contentType = upstream.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: contentType ? { 'content-type': contentType } : undefined,
    })
  }

  return NextResponse.json(await upstream.json(), { status: upstream.status })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    return await proxyContractRequest(request, id, 'GET')
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'contracts proxy failed' },
      { status: 502 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    return await proxyContractRequest(request, id, 'PATCH')
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'contracts proxy failed' },
      { status: 502 }
    )
  }
}
