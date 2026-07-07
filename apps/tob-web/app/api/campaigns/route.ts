import { NextResponse } from 'next/server'
import {
  buildCampaignListUpstreamUrl,
  unwrapResponseData,
  buildForwardHeaders,
} from './proxy-utils'

export async function GET(request: Request) {
  try {
    const upstream = await fetch(buildCampaignListUpstreamUrl(request.url), {
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
        message: error instanceof Error ? error.message : 'campaigns proxy failed'
      },
      { status: 502 }
    )
  }
}
