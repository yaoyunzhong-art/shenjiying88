import MemberCardsClient from './member-cards-client'
import { loadMemberCardsPageSnapshot } from './member-cards-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MemberCardsPage() {
  const snapshot = await loadMemberCardsPageSnapshot()

  return <MemberCardsClient snapshot={snapshot} />
}
