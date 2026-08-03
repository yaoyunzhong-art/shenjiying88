import IntegrationOrchestrationWorkspaceClient from './integration-orchestration-workspace-client'
import { loadIntegrationOrchestrationPageSnapshot } from './integration-orchestration-data'

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

export default async function IntegrationOrchestrationPage({ searchParams }: PageProps) {
  const params = await searchParams
  const snapshot = await loadIntegrationOrchestrationPageSnapshot({
    source: readQueryParam(params.source),
  })
  return (
    <IntegrationOrchestrationWorkspaceClient
      workspace={snapshot.workspace}
      foundationDependencies={snapshot.foundationDependencies}
    />
  )
}
