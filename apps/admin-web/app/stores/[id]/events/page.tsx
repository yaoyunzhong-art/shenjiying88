import EventsClient from './events-client'
import { loadEventsSnapshot } from './events-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EventsPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadEventsSnapshot(id)

  return <EventsClient snapshot={snapshot} />
}
