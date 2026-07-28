import NotificationDetailClient from './notification-detail-client'
import { loadNotificationDetailSnapshot } from './notification-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function NotificationDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadNotificationDetailSnapshot(id)

  return <NotificationDetailClient snapshot={snapshot} />
}
