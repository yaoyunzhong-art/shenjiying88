import { readIntegrationOrchestrationIdempotencyDetailParam } from '@m5/types'
import IntegrationOrchestrationIdempotencyDetailClient from './integration-orchestration-idempotency-detail-client'
import { loadIntegrationOrchestrationIdempotencyDetailPageSnapshot } from './integration-orchestration-idempotency-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ key?: string | string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readIdempotencyKey(value: string | string[] | undefined): string | null {
  return readIntegrationOrchestrationIdempotencyDetailParam(value)
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export default async function IntegrationOrchestrationIdempotencyDetailPage({
  params,
  searchParams,
}: PageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams])
  const key = readIdempotencyKey(resolvedParams.key)
  const snapshot = await loadIntegrationOrchestrationIdempotencyDetailPageSnapshot(key ?? '', {
    source: readQueryParam(resolvedSearch.source),
  })
  return <IntegrationOrchestrationIdempotencyDetailClient snapshot={snapshot.detail} />
}
