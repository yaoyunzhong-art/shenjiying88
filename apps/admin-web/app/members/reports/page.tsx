import MemberReportsClient from './member-reports-client'
import { loadMemberReportsPageSnapshot } from './member-reports-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MemberReportsPage() {
  const snapshot = await loadMemberReportsPageSnapshot()
  return <MemberReportsClient snapshot={snapshot} />
}
