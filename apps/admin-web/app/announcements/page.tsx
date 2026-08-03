import AnnouncementsClient from './announcements-client'
import { loadAnnouncementsSnapshot } from './announcements-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AnnouncementsPage() {
  const snapshot = await loadAnnouncementsSnapshot()

  return <AnnouncementsClient snapshot={snapshot} />
}
