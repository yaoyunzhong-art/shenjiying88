import WorkflowClient from './workflow-client'
import { loadWorkflowSnapshot } from './workflow-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function WorkflowPage() {
  const snapshot = await loadWorkflowSnapshot()

  return <WorkflowClient snapshot={snapshot} />
}
