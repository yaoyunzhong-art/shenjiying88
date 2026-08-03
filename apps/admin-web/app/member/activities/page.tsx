import MemberActivitiesClient from './member-activities-client'
import { loadMemberActivitiesSnapshot } from './mock-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MemberActivitiesPage() {
  const snapshot = await loadMemberActivitiesSnapshot()
  return <MemberActivitiesClient snapshot={snapshot} />
}
