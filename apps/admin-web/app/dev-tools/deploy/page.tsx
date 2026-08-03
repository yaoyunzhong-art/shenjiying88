import DeployClient from './deploy-client'
import { loadDeploySnapshot } from './deploy-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DeployPage() {
  const snapshot = await loadDeploySnapshot()

  return <DeployClient snapshot={snapshot} />
}
