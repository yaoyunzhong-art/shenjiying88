import DevToolsClient from './dev-tools-client'
import { loadDevToolsSnapshot } from './dev-tools-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DevToolsPage() {
  const snapshot = await loadDevToolsSnapshot()
  return <DevToolsClient snapshot={snapshot} />
}
