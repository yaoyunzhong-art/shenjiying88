import CreateMemberClient from './create-member-client'
import { loadCreateMemberPageSnapshot } from './create-member-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CreateMemberPage() {
  const snapshot = await loadCreateMemberPageSnapshot()

  return <CreateMemberClient snapshot={snapshot} />
}
