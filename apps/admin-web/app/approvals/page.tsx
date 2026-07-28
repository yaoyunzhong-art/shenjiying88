import ApprovalsClient from './approvals-client'
import { loadApprovalsSnapshot } from './approvals-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ApprovalsPage() {
  const snapshot = await loadApprovalsSnapshot()
  return <ApprovalsClient snapshot={snapshot} />
}
