import IntegrationOrchestrationEventsClient from './integration-orchestration-events-client'
import { loadIntegrationOrchestrationEventsPageSnapshot } from './integration-orchestration-events-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export default async function IntegrationOrchestrationEventsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const snapshot = await loadIntegrationOrchestrationEventsPageSnapshot({
    source: readQueryParam(params.source),
  })
  return <IntegrationOrchestrationEventsClient events={snapshot.events} sources={snapshot.sources} />
}
