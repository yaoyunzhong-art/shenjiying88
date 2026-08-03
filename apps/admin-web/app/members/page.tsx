import MembersClient from './members-client'
import { loadMembersPageSnapshot } from './members-page-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MembersPage() {
  const snapshot = await loadMembersPageSnapshot()

  return <MembersClient snapshot={snapshot} />
}
