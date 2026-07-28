import MemberLevelsClient from './member-levels-client'
import { loadMemberLevelsSnapshot } from './member-levels-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MemberLevelsPage() {
  const snapshot = await loadMemberLevelsSnapshot()

  return <MemberLevelsClient snapshot={snapshot} />
}
