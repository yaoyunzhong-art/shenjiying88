import NotificationsClient from './notifications-client'
import { loadNotificationsSnapshot } from './notifications-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NotificationsPage() {
  const snapshot = await loadNotificationsSnapshot()

  return <NotificationsClient snapshot={snapshot} />
}
