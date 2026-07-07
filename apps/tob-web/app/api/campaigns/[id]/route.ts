import { NextResponse } from 'next/server'
import { resolveCampaignApiBaseUrl, unwrapResponseData, buildForwardHeaders } from '../proxy-utils'

function buildUpstreamUrl(requestUrl: string, id: string): string {
  const request = new URL(requestUrl)
  return new URL(`campaigns/${id}${request.search}`, resolveCampaignApiBaseUrl()).toString()
}

function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {}
  headers.forEach((value, key) => { record[key] = value })
  return record
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    const upstream = await fetch(buildUpstreamUrl(request.url, id), {
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
        message: error instanceof Error ? error.message : 'campaign detail proxy failed'
      },
      { status: 502 }
    )
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    const upstream = await fetch(`${buildUpstreamUrl(request.url, id)}/status`, {
      method: 'PATCH',
      headers: {
        ...headersToRecord(buildForwardHeaders(request)),
        'content-type': 'application/json'
      },
      body: await request.text()
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
        message: error instanceof Error ? error.message : 'campaign status proxy failed'
      },
      { status: 502 }
    )
  }
}
