import NotificationTemplatesClient from './notification-templates-client'
import { loadNotificationTemplatesSnapshot } from './notification-templates-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NotificationTemplatesPage() {
  const snapshot = await loadNotificationTemplatesSnapshot()

  return <NotificationTemplatesClient snapshot={snapshot} />
}
