import NotificationsClient from './notifications-client'
import { loadNotificationsSettingsSnapshot } from './notifications-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NotificationsPage() {
  const snapshot = await loadNotificationsSettingsSnapshot()
  return <NotificationsClient snapshot={snapshot} />
}
