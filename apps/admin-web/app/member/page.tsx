import MemberClient from './member-client'
import { loadMemberSnapshot } from './member-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MemberPage() {
  const snapshot = await loadMemberSnapshot()
  return <MemberClient snapshot={snapshot} />
}
