import MemberTierFormClient from './member-tier-form-client'
import { loadMemberTierFormPageSnapshot } from './member-tier-form-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MemberFormPage() {
  const snapshot = await loadMemberTierFormPageSnapshot()

  return <MemberTierFormClient snapshot={snapshot} />
}
