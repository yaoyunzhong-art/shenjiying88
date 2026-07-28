import { readResilienceSignalDetailParam } from '@m5/types'
import ResilienceSignalDetailClient from './resilience-signal-detail-client'
import { loadResilienceSignalDetailPageSnapshot } from './resilience-signal-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ signal?: string | string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export default async function ResilienceSignalDetailPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams])
  const signal = readResilienceSignalDetailParam(resolvedParams.signal)
  const snapshot = await loadResilienceSignalDetailPageSnapshot(signal ?? '', {
    capability: readQueryParam(resolvedSearch.capability),
    status: readQueryParam(resolvedSearch.status),
    resource: readQueryParam(resolvedSearch.resource),
  })
  return <ResilienceSignalDetailClient snapshot={snapshot.detail} />
}
