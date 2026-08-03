import ConfigurationWorkspaceClient from './configuration-workspace-client'
import {
  loadConfigurationPageSnapshot,
  normalizeConfigurationQuery,
} from './configuration-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface ConfigurationPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ConfigurationPage({
  searchParams,
}: ConfigurationPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const snapshot = await loadConfigurationPageSnapshot(
    normalizeConfigurationQuery(resolvedSearchParams),
  )

  return (
    <ConfigurationWorkspaceClient
      overview={snapshot.overview}
      managementMetadata={snapshot.managementMetadata}
      scopeChain={snapshot.overview.scopeChain}
    />
  )
}
