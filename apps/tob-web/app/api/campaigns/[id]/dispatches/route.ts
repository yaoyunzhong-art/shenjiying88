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

function buildDispatchesUpstreamUrl(requestUrl: string, id: string): string {
  const request = new URL(requestUrl)
  return new URL(`campaigns/${id}/dispatches${request.search}`, resolveCampaignApiBaseUrl()).toString()
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    const upstream = await fetch(buildDispatchesUpstreamUrl(request.url, id), {
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
        message: error instanceof Error ? error.message : 'campaign dispatches proxy failed'
      },
      { status: 502 }
    )
  }
}
