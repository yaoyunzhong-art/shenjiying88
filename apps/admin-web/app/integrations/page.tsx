import IntegrationsClient from './integrations-client'
import { loadIntegrationsSnapshot } from './integrations-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function IntegrationsPage() {
  const snapshot = await loadIntegrationsSnapshot()
  return <IntegrationsClient snapshot={snapshot} />
}
