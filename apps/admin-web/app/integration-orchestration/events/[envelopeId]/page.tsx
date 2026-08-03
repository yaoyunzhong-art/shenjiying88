import { readIntegrationOrchestrationEventDetailParam } from '@m5/types'
import IntegrationOrchestrationEventDetailClient from './integration-orchestration-event-detail-client'
import { loadIntegrationOrchestrationEventDetailPageSnapshot } from './integration-orchestration-event-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ envelopeId?: string | string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readEnvelopeId(value: string | string[] | undefined): string | null {
  return readIntegrationOrchestrationEventDetailParam(value)
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export default async function IntegrationOrchestrationEventDetailPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams])
  const envelopeId = readEnvelopeId(resolvedParams.envelopeId)
  const snapshot = await loadIntegrationOrchestrationEventDetailPageSnapshot(envelopeId ?? '', {
    source: readQueryParam(resolvedSearch.source),
  })
  return <IntegrationOrchestrationEventDetailClient snapshot={snapshot.detail} />
}
