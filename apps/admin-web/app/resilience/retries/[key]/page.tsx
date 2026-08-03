import { readResilienceRetryPolicyDetailParam } from '@m5/types'
import ResilienceRetryPolicyDetailClient from './resilience-retry-policy-detail-client'
import { loadResilienceRetryPolicyDetailPageSnapshot } from './resilience-retry-policy-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ key?: string | string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export default async function ResilienceRetryPolicyDetailPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams])
  const key = readResilienceRetryPolicyDetailParam(resolvedParams.key)
  const snapshot = await loadResilienceRetryPolicyDetailPageSnapshot(key ?? '', {
    capability: readQueryParam(resolvedSearch.capability),
    status: readQueryParam(resolvedSearch.status),
    resource: readQueryParam(resolvedSearch.resource),
  })
  return <ResilienceRetryPolicyDetailClient snapshot={snapshot.detail} />
}
