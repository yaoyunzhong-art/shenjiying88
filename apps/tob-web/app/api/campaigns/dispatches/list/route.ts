import { NextResponse } from 'next/server'
import { resolveCampaignApiBaseUrl, unwrapResponseData } from '../../proxy-utils'

const CONTEXT_HEADERS = [
  'authorization',
  'x-tenant-id',
  'x-brand-id',
  'x-store-id',
  'x-market-code'
] as const

function buildForwardHeaders(request: Request): Headers {
  const headers = new Headers()
  for (const headerName of CONTEXT_HEADERS) {
    const value = request.headers.get(headerName)
    if (value) {
      headers.set(headerName, value)
    }
  }
  return headers
}

function buildUpstreamUrl(requestUrl: string): string {
  const request = new URL(requestUrl)
  return new URL(`campaigns/dispatches/list${request.search}`, resolveCampaignApiBaseUrl()).toString()
}

export async function GET(request: Request) {
  try {
    const upstream = await fetch(buildUpstreamUrl(request.url), {
      method: 'GET',
      headers: buildForwardHeaders(request),
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

    return NextResponse.json(unwrapResponseData(await upstream.json()), { status: upstream.status })
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'campaign dispatch list proxy failed'
      },
      { status: 502 }
    )
  }
}
