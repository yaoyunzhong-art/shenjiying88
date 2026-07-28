import UserPortraitClient from './user-portrait-client'
import { loadUserPortraitSnapshot } from './user-portrait-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function UserPortraitPage() {
  const snapshot = await loadUserPortraitSnapshot()

  return <UserPortraitClient snapshot={snapshot} />
}
