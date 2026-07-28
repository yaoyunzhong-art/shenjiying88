import NewMemberTierClient from './new-member-tier-client'
import { loadNewMemberTierPageSnapshot } from './new-member-tier-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewMemberTierPage() {
  const snapshot = await loadNewMemberTierPageSnapshot()

  return <NewMemberTierClient snapshot={snapshot} />
}
