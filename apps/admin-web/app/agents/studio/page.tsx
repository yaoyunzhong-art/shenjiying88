import AgentStudioClient from './studio-client'
import { loadAgentStudioSnapshot } from './studio-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AgentStudioPage() {
  const snapshot = await loadAgentStudioSnapshot()
  return <AgentStudioClient snapshot={snapshot} />
}
