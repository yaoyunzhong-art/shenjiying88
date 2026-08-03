import NotificationFormClient from './notification-form-client'
import { loadNotificationFormSnapshot } from './notification-form-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NotificationFormPage() {
  const snapshot = await loadNotificationFormSnapshot()

  return <NotificationFormClient snapshot={snapshot} />
}
