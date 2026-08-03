import UserActivityClient from './user-activity-client'
import { loadUserActivitySnapshot } from './user-activity-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function UserActivityPage() {
  const snapshot = await loadUserActivitySnapshot()

  return <UserActivityClient snapshot={snapshot} />
}
