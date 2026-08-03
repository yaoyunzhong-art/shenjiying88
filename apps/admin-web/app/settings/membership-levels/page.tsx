import MembershipLevelsClient from './membership-levels-client'
import { loadMembershipLevelsSnapshot } from './membership-levels-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MembershipLevelsPage() {
  const snapshot = await loadMembershipLevelsSnapshot()

  return <MembershipLevelsClient snapshot={snapshot} />
}
