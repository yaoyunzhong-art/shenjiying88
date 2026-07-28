import MemberConfigClient from './member-config-client'
import { loadMemberConfigSnapshot } from './member-config-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MemberConfigPage() {
  const snapshot = await loadMemberConfigSnapshot()
  return <MemberConfigClient snapshot={snapshot} />
}
