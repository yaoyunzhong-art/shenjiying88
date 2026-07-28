import MemberTiersClient from './member-tiers-client'
import { loadMemberTiersPageSnapshot } from './member-tiers-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MemberTiersPage() {
  const snapshot = await loadMemberTiersPageSnapshot()

  return <MemberTiersClient snapshot={snapshot} />
}
